from pydantic import BaseModel, ConfigDict
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

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
