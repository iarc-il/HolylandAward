from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    String,
    DateTime,
    Float,
    UniqueConstraint,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class QSOLogs(Base):
    __tablename__ = "qso_logs"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=False)  # QSO_DATE
    freq = Column(Float, index=False)  # FREQ
    spotter = Column(
        String, ForeignKey("users.callsign"), index=True
    )  # References Users.callsign
    dx = Column(String, index=True)  # DX callsign
    area = Column(String, index=True)  # Area or grid square
    # marked_for_sticker = Column(Boolean, default=False)
    # marked_for_certificate = Column(Boolean, default=False)
    # award_id = Column(Integer, ForeignKey("awards.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship - many QSOs belong to one user
    user = relationship("Users", back_populates="qso_logs")

    # Unique constraint on spotter + area combination
    __table_args__ = (UniqueConstraint("spotter", "area", name="unique_spotter_area"),)
