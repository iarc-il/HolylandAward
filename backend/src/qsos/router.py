from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from utils import verify_clerk_session
from users.repository import get_user_by_clerk_id
from qsos.repository import get_areas_by_spotter
from qsos.service import get_regions_from_areas

router = APIRouter(prefix="/qsos", tags=["qsos"])


@router.get("/by-user")
def get_user_areas_and_regions(
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_clerk_session),
):
    """
    Get the current user's areas and regions based on their QSO logs.
    """
    # Get user by Clerk ID to retrieve callsign
    user = get_user_by_clerk_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.callsign:
        raise HTTPException(status_code=400, detail="User has no callsign assigned")

    # Get all areas for this user's callsign
    areas = get_areas_by_spotter(db, user.callsign)

    # Extract unique regions from areas
    regions = get_regions_from_areas(areas)

    return {
        "callsign": user.callsign,
        "areas": areas,
        "regions": regions,
        "total_areas": len(areas),
        "total_regions": len(regions),
    }
