from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class UserProfileUpdateRequest(BaseModel):
    callsign: str
    region: int = Field(ge=0, lt=4)  # Region must be 0 (Israel), 1, 2, or 3


class LinkedCallsignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    old_callsign: str
    new_callsign: str
    created_at: Optional[datetime]


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    clerk_user_id: str
    email: Optional[str]
    username: Optional[str]
    callsign: Optional[str]
    region: Optional[int]
    linked_callsigns: list[LinkedCallsignResponse] = Field(default_factory=list)
