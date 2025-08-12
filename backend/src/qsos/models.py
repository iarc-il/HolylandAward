from sqlalchemy import Column, Integer, String, DateTime, Float, UniqueConstraint
from sqlalchemy.sql import func
from database import Base


class QSOLogs(Base):
    __tablename__ = "qso_logs"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=False)  # QSO_DATE
    freq = Column(Float, index=False)  # FREQ
    spotter = Column(String, index=True)  # Spotter callsign
    dx = Column(String, index=True)  # DX callsign
    area = Column(String, index=True)  # Area or grid square

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Unique constraint on spotter + area combination
    __table_args__ = (UniqueConstraint("spotter", "area", name="unique_spotter_area"),)
