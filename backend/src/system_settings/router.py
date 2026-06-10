from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from system_settings.repository import get_setting, set_setting
from system_settings.schema import MaintenanceModeResponse, MaintenanceModeUpdate
from users.admin_router import verify_admin

router = APIRouter()


@router.get("/maintenance-mode", response_model=MaintenanceModeResponse)
def get_maintenance_mode(db: Session = Depends(get_db)):
    value = get_setting(db, "maintenance_mode")
    return MaintenanceModeResponse(maintenance_mode=value == "true")


@router.post("/admin/maintenance-mode", response_model=MaintenanceModeResponse)
def set_maintenance_mode(
    body: MaintenanceModeUpdate,
    db: Session = Depends(get_db),
    admin_id: str = Depends(verify_admin),
):
    set_setting(db, "maintenance_mode", "true" if body.maintenance_mode else "false")
    return MaintenanceModeResponse(maintenance_mode=body.maintenance_mode)