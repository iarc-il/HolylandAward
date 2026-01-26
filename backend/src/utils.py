from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions
from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

load_dotenv()

clerk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY", ""))


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


# Define the authentication dependency
async def verify_clerk_session(request: Request):
    """
    Verifies the user's session using Clerk's SDK and returns the user ID.
    Raises an HTTPException if the user is not authenticated.
    """
    try:
        # Pass the raw FastAPI request object to Clerk's authentication method.
        # This handles parsing the Authorization header and verifying the JWT.
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

        session = clerk.authenticate_request(
            request,
            AuthenticateRequestOptions(authorized_parties=[frontend_url]),
        )

        # The session object contains all the user and session data
        if not session.is_signed_in:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated."
            )

        # Return the user_id, which can be injected into the route handler
        user_id = session.payload.get("sub") if session.payload else None
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session."
            )
        return user_id

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Catch any exceptions during authentication and return a 401 error
        print(f"Authentication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
        )
