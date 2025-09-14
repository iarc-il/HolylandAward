from sqlalchemy.orm import Session
from users.models import Users
from typing import Optional


def create_user(
    db: Session, clerk_user_id: str, email: str, username: Optional[str] = None
) -> Users:
    """Create a new user with null callsign"""
    user = Users(
        clerk_user_id=clerk_user_id,
        email=email,
        username=username,
        callsign=None,  # Will be set later when user provides it
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_clerk_id(db: Session, clerk_user_id: str) -> Optional[Users]:
    """Get user by Clerk user ID"""
    return db.query(Users).filter(Users.clerk_user_id == clerk_user_id).first()


def get_user_by_callsign(db: Session, callsign: str) -> Optional[Users]:
    """Get user by callsign"""
    return db.query(Users).filter(Users.callsign == callsign).first()


def update_user_callsign(
    db: Session, clerk_user_id: str, callsign: str
) -> Optional[Users]:
    """Update user's callsign"""
    user = get_user_by_clerk_id(db, clerk_user_id)
    if user:
        user.callsign = callsign
        db.commit()
        db.refresh(user)
    return user
