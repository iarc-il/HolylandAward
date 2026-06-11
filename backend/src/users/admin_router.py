from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from users import service as user_service
from users.service import normalize_callsign, ensure_callsign_available
from users.repository import (
    get_user_by_clerk_id,
    get_callsigns_for_user,
    create_callsign_request,
    get_pending_callsign_requests,
    get_callsign_requests_for_user,
    get_callsign_request_by_id,
    approve_callsign_request as repo_approve,
    deny_callsign_request as repo_deny,
    cancel_callsign_request as repo_cancel,
    update_user_callsign,
    add_linked_callsign,
    update_user_region,
    search_users,
)
from users.schema import (
    CallsignChangeRequestCreate,
    CallsignChangeRequestResponse,
    CallsignChangeRequestAction,
    RegionUpdateRequest,
    UserResponse,
)
from qsos.repository import count_qsos_by_spotters, get_qsos_by_spotters
from utils import verify_clerk_session
from database import get_db
from sqlalchemy.orm import Session
from typing import List

router = APIRouter()


async def verify_admin(
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_clerk_session),
) -> str:
    from utils import clerk
    try:
        clerk_user = clerk.users.get(user_id=user_id)
        if not clerk_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required",
            )
        metadata = getattr(clerk_user, "public_metadata", {}) or {}
        if metadata.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required",
            )
        return user_id
    except HTTPException:
        raise
    except Exception as e:
        print(f"Admin check error: {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )


@router.post("/user/callsign-request", response_model=CallsignChangeRequestResponse)
async def create_callsign_change_request(
    request_data: CallsignChangeRequestCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_clerk_session),
):
    from utils import get_or_create_user_from_clerk
    user = await get_or_create_user_from_clerk(db, user_id)

    if not user.callsign:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot request change before setting initial callsign. Use the profile setup instead.",
        )

    try:
        new_callsign = normalize_callsign(request_data.callsign)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if new_callsign == user.callsign:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New callsign is the same as current callsign",
        )

    ensure_callsign_available(db, user_id, new_callsign)

    existing_pending = get_callsign_requests_for_user(db, user.id)
    for req in existing_pending:
        if req.status == "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have a pending callsign change request",
            )

    request = create_callsign_request(
        db=db,
        user_id=user.id,
        old_callsign=user.callsign,
        new_callsign=new_callsign,
    )

    resp = CallsignChangeRequestResponse(
        id=request.id,
        user_id=request.user_id,
        old_callsign=request.old_callsign,
        new_callsign=request.new_callsign,
        status=request.status,
        reason=request.reason,
        created_at=request.created_at,
        updated_at=request.updated_at,
        user_callsign=user.callsign,
        user_email=user.email,
    )
    return resp


@router.get("/user/callsign-requests", response_model=List[CallsignChangeRequestResponse])
async def get_my_callsign_requests(
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_clerk_session),
):
    from utils import get_or_create_user_from_clerk
    user = await get_or_create_user_from_clerk(db, user_id)

    requests = get_callsign_requests_for_user(db, user.id)
    return [
        CallsignChangeRequestResponse(
            id=r.id,
            user_id=r.user_id,
            old_callsign=r.old_callsign,
            new_callsign=r.new_callsign,
            status=r.status,
            reason=r.reason,
            created_at=r.created_at,
            updated_at=r.updated_at,
            user_callsign=user.callsign,
            user_email=user.email,
        )
        for r in requests
    ]


@router.patch("/user/callsign-requests/{request_id}/cancel", response_model=CallsignChangeRequestResponse)
async def cancel_callsign_change_request(
    request_id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_clerk_session),
):
    from utils import get_or_create_user_from_clerk
    user = await get_or_create_user_from_clerk(db, user_id)

    request = get_callsign_request_by_id(db, request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if request.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your request")
    if request.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending requests can be cancelled")

    request = repo_cancel(db, request)

    return CallsignChangeRequestResponse(
        id=request.id,
        user_id=request.user_id,
        old_callsign=request.old_callsign,
        new_callsign=request.new_callsign,
        status=request.status,
        reason=request.reason,
        created_at=request.created_at,
        updated_at=request.updated_at,
        user_callsign=user.callsign,
        user_email=user.email,
    )


@router.get("/admin/callsign-requests", response_model=List[CallsignChangeRequestResponse])
async def list_callsign_requests(
    db: Session = Depends(get_db),
    admin_id: str = Depends(verify_admin),
):
    requests = get_pending_callsign_requests(db)
    result = []
    for r in requests:
        user = r.user
        result.append(
            CallsignChangeRequestResponse(
                id=r.id,
                user_id=r.user_id,
                old_callsign=r.old_callsign,
                new_callsign=r.new_callsign,
                status=r.status,
                reason=r.reason,
                created_at=r.created_at,
                updated_at=r.updated_at,
                user_callsign=user.callsign if user else None,
                user_email=user.email if user else None,
            )
        )
    return result


@router.patch("/admin/callsign-requests/{request_id}/approve", response_model=CallsignChangeRequestResponse)
async def approve_callsign_request(
    request_id: int,
    db: Session = Depends(get_db),
    admin_id: str = Depends(verify_admin),
):
    request = get_callsign_request_by_id(db, request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if request.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request is not pending")

    from users.repository import get_user_by_clerk_id
    admin_user = get_user_by_clerk_id(db, admin_id)
    if not admin_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin user not found")

    user = request.user
    if user.callsign:
        add_linked_callsign(db, user.id, user.callsign, request.new_callsign)
    user.callsign = request.new_callsign

    request = repo_approve(db, request, admin_user.id)

    resp = CallsignChangeRequestResponse(
        id=request.id,
        user_id=request.user_id,
        old_callsign=request.old_callsign,
        new_callsign=request.new_callsign,
        status=request.status,
        reason=request.reason,
        created_at=request.created_at,
        updated_at=request.updated_at,
        user_callsign=user.callsign,
        user_email=user.email,
    )
    return resp


@router.patch("/admin/callsign-requests/{request_id}/deny", response_model=CallsignChangeRequestResponse)
async def deny_callsign_request(
    request_id: int,
    action: CallsignChangeRequestAction,
    db: Session = Depends(get_db),
    admin_id: str = Depends(verify_admin),
):
    request = get_callsign_request_by_id(db, request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if request.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request is not pending")

    from users.repository import get_user_by_clerk_id
    admin_user = get_user_by_clerk_id(db, admin_id)
    if not admin_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin user not found")

    request = repo_deny(db, request, admin_user.id, action.reason)

    user = request.user
    resp = CallsignChangeRequestResponse(
        id=request.id,
        user_id=request.user_id,
        old_callsign=request.old_callsign,
        new_callsign=request.new_callsign,
        status=request.status,
        reason=request.reason,
        created_at=request.created_at,
        updated_at=request.updated_at,
        user_callsign=user.callsign if user else None,
        user_email=user.email if user else None,
    )
    return resp


@router.patch("/user/region", response_model=UserResponse)
async def update_region(
    region_data: RegionUpdateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_clerk_session),
):
    from utils import get_or_create_user_from_clerk
    user = await get_or_create_user_from_clerk(db, user_id)

    if region_data.region not in [0, 1, 2, 3]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Region must be 0 (Israel), 1, 2, or 3",
        )

    updated_user = update_user_region(db, user_id, region_data.region)
    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserResponse.model_validate(updated_user)


@router.get("/admin/users/search")
async def admin_search_users(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    admin_id: str = Depends(verify_admin),
):
    users = search_users(db, q)
    return {
        "users": [UserResponse.model_validate(u) for u in users],
        "total": len(users),
    }


@router.get("/admin/users/{clerk_user_id}/qsos")
async def admin_get_user_qsos(
    clerk_user_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    admin_id: str = Depends(verify_admin),
):
    user = get_user_by_clerk_id(db, clerk_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.callsign:
        raise HTTPException(
            status_code=400, detail="User has no callsign assigned"
        )

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