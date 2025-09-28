from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
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

    # Relationship - one user can have many QSO logs
    qso_logs = relationship("QSOLogs", back_populates="user")
