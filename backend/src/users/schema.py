from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class UserProfileUpdateRequest(BaseModel):
    callsign: str
    region: int = Field(ge=0, lt=4)  # Region must be 0 (Israel), 1, 2, or 3


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    clerk_user_id: str
    email: Optional[str]
    username: Optional[str]
    callsign: Optional[str]
    region: Optional[int]
