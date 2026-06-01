from sqlalchemy.orm import Session
from users.models import LinkedCallsigns, Users
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


def get_user_by_linked_callsign(db: Session, callsign: str) -> Optional[Users]:
    return (
        db.query(Users)
        .join(LinkedCallsigns, LinkedCallsigns.user_id == Users.id)
        .filter(LinkedCallsigns.old_callsign == callsign)
        .first()
    )


def get_callsigns_for_user(db: Session, user: Users) -> list[str]:
    callsigns = set()
    if user.callsign:
        callsigns.add(user.callsign)

    linked_callsigns = (
        db.query(LinkedCallsigns.old_callsign, LinkedCallsigns.new_callsign)
        .filter(LinkedCallsigns.user_id == user.id)
        .all()
    )
    for old_callsign, new_callsign in linked_callsigns:
        callsigns.add(old_callsign)
        callsigns.add(new_callsign)

    return sorted(callsigns)


def add_linked_callsign(
    db: Session, user_id: int, old_callsign: str, new_callsign: str
) -> None:
    existing_link = (
        db.query(LinkedCallsigns)
        .filter(
            LinkedCallsigns.user_id == user_id,
            LinkedCallsigns.old_callsign == old_callsign,
            LinkedCallsigns.new_callsign == new_callsign,
        )
        .first()
    )
    if not existing_link:
        db.add(
            LinkedCallsigns(
                user_id=user_id,
                old_callsign=old_callsign,
                new_callsign=new_callsign,
            )
        )


def update_user_callsign(
    db: Session, clerk_user_id: str, callsign: str
) -> Optional[Users]:
    """Update user's callsign"""
    user = get_user_by_clerk_id(db, clerk_user_id)
    if user:
        if user.callsign and user.callsign != callsign:
            add_linked_callsign(db, user.id, user.callsign, callsign)
        user.callsign = callsign
        db.commit()
        db.refresh(user)
    return user


def update_user_profile(
    db: Session, clerk_user_id: str, callsign: str, region: int
) -> Optional[Users]:
    """Update user's callsign and region"""
    user = get_user_by_clerk_id(db, clerk_user_id)
    if user:
        if user.callsign and user.callsign != callsign:
            add_linked_callsign(db, user.id, user.callsign, callsign)
        user.callsign = callsign
        user.region = region
        db.commit()
        db.refresh(user)
    return user
