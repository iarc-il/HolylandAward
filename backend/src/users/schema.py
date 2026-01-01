from pydantic import BaseModel, Field
from typing import Optional


class UserProfileUpdateRequest(BaseModel):
    callsign: str
    region: int = Field(ge=0, lt=4)  # Region must be 0 (Israel), 1, 2, or 3


class UserResponse(BaseModel):
    id: int
    clerk_user_id: str
    email: Optional[str]
    username: Optional[str]
    callsign: Optional[str]
    region: Optional[int]

    class Config:
        from_attributes = True
