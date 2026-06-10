from pydantic import BaseModel


class MaintenanceModeResponse(BaseModel):
    maintenance_mode: bool


class MaintenanceModeUpdate(BaseModel):
    maintenance_mode: bool