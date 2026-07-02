from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    DateTime,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    clerk_user_id = Column(
        String, unique=True, index=True, nullable=False
    )  # Clerk user ID
    email = Column(String, index=True, nullable=True)  # User's email
    username = Column(String, index=True, nullable=True)  # Username from Clerk
    callsign = Column(
        String, unique=True, index=True, nullable=True
    )  # Ham radio callsign
    region = Column(Integer, nullable=True)  # Amateur radio region (1, 2, or 3)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    linked_callsigns = relationship(
        "LinkedCallsigns",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="LinkedCallsigns.id",
    )


class LinkedCallsigns(Base):
    __tablename__ = "linked_callsigns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    old_callsign = Column(String, nullable=False, index=True)
    new_callsign = Column(String, nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("Users", back_populates="linked_callsigns")

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "old_callsign",
            "new_callsign",
            name="unique_user_callsign_link",
        ),
    )


class CallsignChangeRequest(Base):
    __tablename__ = "callsign_change_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    old_callsign = Column(String, nullable=True)
    new_callsign = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("Users", foreign_keys=[user_id])
    admin = relationship("Users", foreign_keys=[admin_id])
