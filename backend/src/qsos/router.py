from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from utils import verify_clerk_session
from users.repository import get_callsigns_for_user, get_user_by_clerk_id
from qsos.repository import (
    count_qsos_by_spotters,
    delete_qsos_by_ids_and_spotters,
    get_areas_by_spotters,
    get_qsos_by_spotters,
)
from qsos.schema import DeleteQsosRequest
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

    # Get all areas for this user's current and historical linked callsigns
    callsigns = get_callsigns_for_user(db, user)
    areas = get_areas_by_spotters(db, callsigns)

    # Extract unique regions from areas
    regions = get_regions_from_areas(areas)

    return {
        "callsign": user.callsign,
        "callsigns": callsigns,
        "areas": areas,
        "regions": regions,
        "total_areas": len(areas),
        "total_regions": len(regions),
    }


@router.get("/by-user/logs")
def get_user_qso_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_clerk_session),
):
    user = get_user_by_clerk_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.callsign:
        raise HTTPException(status_code=400, detail="User has no callsign assigned")

    callsigns = get_callsigns_for_user(db, user)
    total_qsos = count_qsos_by_spotters(db, callsigns)
    qsos = get_qsos_by_spotters(
        db,
        callsigns,
        limit=page_size,
        offset=(page - 1) * page_size,
    )
    total_pages = ceil(total_qsos / page_size) if total_qsos else 0

    return {
        "callsign": user.callsign,
        "callsigns": callsigns,
        "total_qsos": total_qsos,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "qsos": [
            {
                "id": qso.id,
                "date": qso.date,
                "freq": qso.freq,
                "spotter": qso.spotter,
                "dx": qso.dx,
                "area": qso.area,
            }
            for qso in qsos
        ],
    }


@router.delete("/by-user/logs")
def delete_user_qso_logs(
    body: DeleteQsosRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_clerk_session),
):
    user = get_user_by_clerk_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.callsign:
        raise HTTPException(status_code=400, detail="User has no callsign assigned")

    callsigns = get_callsigns_for_user(db, user)
    deleted = delete_qsos_by_ids_and_spotters(db, body.ids, callsigns)

    return {"deleted": deleted}
