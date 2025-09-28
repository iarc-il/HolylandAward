from fastapi import APIRouter, Depends
from src.users import service as user_service
from src.utils import verify_clerk_session

from database import get_db
from sqlalchemy.orm import Session


router = APIRouter(prefix="/user")


@router.get("/callsign")
async def get_user_callsign(
    db: Session = Depends(get_db), user_id: str = Depends(verify_clerk_session)
):
    user = user_service.get_user_callsign(db, user_id)
    if user:
        return user
    return {"error": "User not found"}, 404
