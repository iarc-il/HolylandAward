from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class QSO(BaseModel):
    date: str
    freq: float
    spotter: str
    dx: str
    area: str


class QSOResponse(QSO):
    """Schema for QSO response (includes database fields)"""

    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # Allows Pydantic to work with SQLAlchemy models
