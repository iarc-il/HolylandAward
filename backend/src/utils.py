from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions
from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
if not CLERK_SECRET_KEY:
    raise RuntimeError("Missing CLERK_SECRET_KEY. Add it to backend/.env.")
if not CLERK_SECRET_KEY.startswith(("sk_test_", "sk_live_")):
    raise RuntimeError(
        "CLERK_SECRET_KEY must be a Clerk secret key starting with sk_test_ or "
        "sk_live_. Do not use the publishable pk_test_/pk_live_ key here."
    )

clerk = Clerk(bearer_auth=CLERK_SECRET_KEY)

DEFAULT_FRONTEND_ORIGINS = ("http://localhost:5173", "http://127.0.0.1:5173")


def _add_origin(origins: list[str], origin: str) -> None:
    normalized_origin = origin.strip().rstrip("/")
    if normalized_origin and normalized_origin not in origins:
        origins.append(normalized_origin)


def _get_loopback_alias(origin: str) -> str | None:
    parsed_origin = urlsplit(origin)
    if parsed_origin.hostname not in {"localhost", "127.0.0.1"}:
        return None

    alias_host = "127.0.0.1" if parsed_origin.hostname == "localhost" else "localhost"
    alias_netloc = alias_host
    if parsed_origin.port:
        alias_netloc = f"{alias_netloc}:{parsed_origin.port}"

    return urlunsplit((parsed_origin.scheme, alias_netloc, "", "", ""))


def get_frontend_origins() -> list[str]:
    origins: list[str] = []
    for configured_origins in (os.getenv("FRONTEND_URL"), os.getenv("FRONTEND_ORIGINS")):
        if not configured_origins:
            continue
        for origin in configured_origins.split(","):
            _add_origin(origins, origin)

    for origin in list(origins):
        loopback_alias = _get_loopback_alias(origin)
        if loopback_alias:
            _add_origin(origins, loopback_alias)

    return origins or list(DEFAULT_FRONTEND_ORIGINS)


async def get_or_create_user_from_clerk(db: Session, clerk_user_id: str):
    """
    Get existing user or create new user from Clerk data.
    This eliminates the need for webhooks - users are created on first authentication.
    """
    from users.repository import get_user_by_clerk_id, create_user

    # Check if user already exists
    existing_user = get_user_by_clerk_id(db, clerk_user_id)
    if existing_user:
        return existing_user

    # User doesn't exist - fetch details from Clerk and create
    try:
        clerk_user = clerk.users.get(user_id=clerk_user_id)

        if not clerk_user:
            # Fallback: create user with minimal info
            return create_user(
                db=db,
                clerk_user_id=clerk_user_id,
                email=f"{clerk_user_id}@unknown.clerk",  # Placeholder email
                username=None,
            )

        # Extract email safely
        email = f"{clerk_user_id}@unknown.clerk"  # Default fallback
        if hasattr(clerk_user, "email_addresses") and clerk_user.email_addresses:
            # Try to find primary email
            for email_addr in clerk_user.email_addresses:
                if hasattr(email_addr, "id") and hasattr(
                    clerk_user, "primary_email_address_id"
                ):
                    if email_addr.id == clerk_user.primary_email_address_id:
                        email = email_addr.email_address
                        break
            # Fallback to first email if primary not found
            if email == f"{clerk_user_id}@unknown.clerk" and clerk_user.email_addresses:
                first_email = clerk_user.email_addresses[0]
                if hasattr(first_email, "email_address"):
                    email = first_email.email_address

        # Get username safely
        username = clerk_user.username if hasattr(clerk_user, "username") else None

        # Create user
        return create_user(
            db=db, clerk_user_id=clerk_user_id, email=email, username=username
        )
    except Exception as e:
        print(f"Error creating user from Clerk data: {e}")
        # Create minimal user record if Clerk fetch fails
        return create_user(
            db=db,
            clerk_user_id=clerk_user_id,
            email=f"{clerk_user_id}@unknown.clerk",
            username=None,
        )


async def authenticate_request(request: Request) -> str:
    """
    Authenticate a request using Clerk and return the user ID.
    Raises HTTPException(401) if authentication fails.
    Can be used both as a dependency and in middleware.
    """
    try:
        session = clerk.authenticate_request(
            request,
            AuthenticateRequestOptions(authorized_parties=get_frontend_origins()),
        )
        if not session.is_signed_in:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated."
            )
        user_id = session.payload.get("sub") if session.payload else None
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session."
            )
        return user_id
    except HTTPException:
        raise
    except Exception as e:
        print(f"Authentication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
        )


async def verify_clerk_session(request: Request):
    """
    FastAPI dependency that verifies the user's session via Clerk
    and returns the user ID.
    """
    return await authenticate_request(request)


async def is_admin_user(user_id: str) -> bool:
    """
    Check if a Clerk user has admin role in their public metadata.
    """
    try:
        clerk_user = clerk.users.get(user_id=user_id)
        if not clerk_user:
            return False
        metadata = getattr(clerk_user, "public_metadata", {}) or {}
        return metadata.get("role") == "admin"
    except Exception:
        return False
