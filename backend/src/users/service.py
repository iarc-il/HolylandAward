from sqlalchemy.orm import Session
import re
from users.repository import (
    create_user,
    get_user_by_clerk_id,
    get_user_by_callsign,
    get_user_by_linked_callsign,
    update_user_callsign as repo_update_user_callsign,
    update_user_profile as repo_update_user_profile,
)
from users.models import Users
from typing import Optional, Dict, Any


CALLSIGN_PATTERN = re.compile(r"^[A-Z0-9/]+$")
CALLSIGN_LETTER_PATTERN = re.compile(r"[A-Z]")
CALLSIGN_NUMBER_PATTERN = re.compile(r"\d")


def normalize_callsign(callsign: str) -> str:
    normalized = callsign.strip().upper()

    if not normalized:
        raise ValueError("Callsign is required")
    if not CALLSIGN_PATTERN.fullmatch(normalized):
        raise ValueError("Callsign must contain only letters and numbers")
    if not CALLSIGN_LETTER_PATTERN.search(
        normalized
    ) or not CALLSIGN_NUMBER_PATTERN.search(normalized):
        raise ValueError("Callsign must contain both letters and numbers")

    return normalized


def ensure_callsign_available(db: Session, clerk_user_id: str, callsign: str) -> None:
    existing_user = get_user_by_callsign(db, callsign)
    if existing_user and existing_user.clerk_user_id != clerk_user_id:
        raise ValueError(f"Callsign {callsign} is already taken")

    linked_user = get_user_by_linked_callsign(db, callsign)
    if linked_user and linked_user.clerk_user_id != clerk_user_id:
        raise ValueError(f"Callsign {callsign} is already taken")


def handle_clerk_user_created(db: Session, webhook_data: Dict[str, Any]) -> Users:
    """Handle Clerk user.created webhook"""
    user_data = webhook_data.get("data", {})

    # Extract user information from webhook
    clerk_user_id = user_data.get("id")
    username = user_data.get("username")

    # Get primary email
    email_addresses = user_data.get("email_addresses", [])
    primary_email_id = user_data.get("primary_email_address_id")

    email = None
    for email_addr in email_addresses:
        if email_addr.get("id") == primary_email_id:
            email = email_addr.get("email_address")
            break

    if not email and email_addresses:
        # Fallback to first email if primary not found
        email = email_addresses[0].get("email_address")

    if not clerk_user_id:
        raise ValueError("Missing Clerk user ID in webhook data")

    # Check if user already exists
    existing_user = get_user_by_clerk_id(db, clerk_user_id)
    if existing_user:
        return existing_user

    # Create new user with null callsign
    return create_user(
        db=db, clerk_user_id=clerk_user_id, email=email, username=username
    )


def update_user_callsign(
    db: Session, clerk_user_id: str, callsign: str
) -> Optional[Users]:
    """Update user's callsign"""
    normalized_callsign = normalize_callsign(callsign)
    ensure_callsign_available(db, clerk_user_id, normalized_callsign)

    return repo_update_user_callsign(db, clerk_user_id, normalized_callsign)


def update_user_profile(
    db: Session, clerk_user_id: str, callsign: str, region: int
) -> Optional[Users]:
    """Update user's callsign and region"""
    normalized_callsign = normalize_callsign(callsign)

    # Validate region (0 = Israel, 1-3 = IARU regions)
    if region not in [0, 1, 2, 3]:
        raise ValueError("Region must be 0 (Israel), 1, 2, or 3")

    ensure_callsign_available(db, clerk_user_id, normalized_callsign)

    return repo_update_user_profile(db, clerk_user_id, normalized_callsign, region)


def get_user_callsign(db: Session, clerk_user_id: str) -> Optional[str]:
    """Get user's callsign by Clerk user ID"""
    user = get_user_by_clerk_id(db, clerk_user_id)
    if user:
        return user.callsign
    return None
