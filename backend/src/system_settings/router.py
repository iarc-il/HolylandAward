from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from system_settings.repository import get_setting, get_user_limit, set_setting, set_user_limit
from system_settings.schema import (
    MaintenanceModeResponse,
    MaintenanceModeUpdate,
    UserLimitResponse,
    UserLimitUpdate,
)
from users.admin_router import verify_admin
from utils import count_non_admin_users

router = APIRouter()


def build_user_limit_response(db: Session) -> UserLimitResponse:
    user_limit = get_user_limit(db)
    current_users = count_non_admin_users(db)
    limit_reached = user_limit is not None and current_users >= user_limit
    remaining_slots = None
    if user_limit is not None:
        remaining_slots = max(user_limit - current_users, 0)

    return UserLimitResponse(
        user_limit=user_limit,
        current_users=current_users,
        limit_reached=limit_reached,
        remaining_slots=remaining_slots,
    )


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


@router.get("/registration-status", response_model=UserLimitResponse)
def get_registration_status(db: Session = Depends(get_db)):
    return build_user_limit_response(db)


@router.get("/admin/user-limit", response_model=UserLimitResponse)
def get_admin_user_limit(
    db: Session = Depends(get_db),
    admin_id: str = Depends(verify_admin),
):
    return build_user_limit_response(db)


@router.post("/admin/user-limit", response_model=UserLimitResponse)
def update_admin_user_limit(
    body: UserLimitUpdate,
    db: Session = Depends(get_db),
    admin_id: str = Depends(verify_admin),
):
    set_user_limit(db, body.user_limit)
    return build_user_limit_response(db)
