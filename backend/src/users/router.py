from fastapi import APIRouter, Depends, HTTPException, status
from users import service as user_service
from utils import verify_clerk_session
from users.schema import UserProfileUpdateRequest, UserResponse

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


@router.get("/profile", response_model=UserResponse)
async def get_user_profile(
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_clerk_session),
):
    """Get current user's profile"""
    try:
        from users.repository import get_user_by_clerk_id

        user = get_user_by_clerk_id(db, user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        return UserResponse.from_orm(user)

    except Exception as e:
        print(f"Get profile error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.patch("/profile", response_model=UserResponse)
async def update_user_profile(
    profile_data: UserProfileUpdateRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_clerk_session),
):
    """Update user's callsign and region"""
    try:
        # Update user profile using the service function
        updated_user = user_service.update_user_profile(
            db=db,
            clerk_user_id=user_id,
            callsign=profile_data.callsign,
            region=profile_data.region,
        )

        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        return UserResponse.from_orm(updated_user)

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"Profile update error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )
