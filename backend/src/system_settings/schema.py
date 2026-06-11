from typing import Optional

from pydantic import BaseModel, Field


class MaintenanceModeResponse(BaseModel):
    maintenance_mode: bool


class MaintenanceModeUpdate(BaseModel):
    maintenance_mode: bool


class UserLimitResponse(BaseModel):
    user_limit: Optional[int]
    current_users: int
    limit_reached: bool
    remaining_slots: Optional[int]


class UserLimitUpdate(BaseModel):
    user_limit: Optional[int] = Field(default=None, ge=0)
