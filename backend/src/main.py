import uvicorn
import adif_io
import os
import json


from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
from adif_service import AdifService
from database import get_db
from qsos.qsos_repository import QSORepository
from qsos.schema import QSO
from users import service as user_service
from users.repository import get_user_by_clerk_id
from users.schema import UserProfileUpdateRequest, UserResponse
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from utils import verify_clerk_session

from lifespan import lifespan

origins = ["http://localhost:5173"]


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

bearer_scheme = HTTPBearer()


# Dependency function to get repository
def get_qso_repository(db: Session = Depends(get_db)) -> QSORepository:
    return QSORepository(db)


@app.post("/clerk-webhook")
async def handle_clerk_webhook(request: Request, db: Session = Depends(get_db)):
    try:
        # Get the raw request body and parse JSON
        body = await request.body()
        webhook_data = json.loads(body.decode())

        # Log the webhook for debugging
        print(f"Webhook received: {webhook_data.get('type')}")

        # Handle different webhook types
        webhook_type = webhook_data.get("type")

        if webhook_type == "user.created":
            # Create new user in our database using functional approach
            user = user_service.handle_clerk_user_created(db, webhook_data)
            print(f"Created user: {user.id} with Clerk ID: {user.clerk_user_id}")
            return {"status": "success", "user_id": user.id}

        # For other webhook types, just acknowledge
        return {"status": "acknowledged", "type": webhook_type}

    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON in webhook body")
    except ValueError as e:
        print(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/users/profile", response_model=UserResponse)
async def get_user_profile(
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_clerk_session),
):
    """Get current user's profile"""
    try:
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


@app.put("/users/profile", response_model=UserResponse)
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


@app.get("/")
def read_root():
    return {"Hello": "Worldddd"}


# get all areas of a spotter
@app.get("/areas/{spotter_callsign}")
def get_all_areas(
    spotter_callsign: str,
    repo: QSORepository = Depends(get_qso_repository),
    user_id: str = Depends(verify_clerk_session),
):
    print(f"user_id: {user_id}")
    areas = repo.get_areas_by_spotter(spotter_callsign)
    return {"areas": areas}


@app.post("/read-file")
async def upload_file(
    file: UploadFile = File(...),
    spotter_callsign: str = "4Z5SL",
    repo: QSORepository = Depends(get_qso_repository),
):
    contents = await file.read()
    with open(f"temp_{file.filename}", "wb") as f:
        f.write(contents)

    qsos, header = adif_io.read_from_file(f"temp_{file.filename}")
    adif_service = AdifService(qsos, spotter_callsign=spotter_callsign)
    valid_entries = adif_service.get_valid_entries()

    # Convert valid entries to QSO schema objects
    qso_objects = []
    for entry in valid_entries:
        qso_obj = QSO(
            date=entry.get("date", ""),
            freq=float(entry.get("freq", 0)),
            spotter=spotter_callsign,
            dx=entry.get("dx", ""),
            area=entry.get("area", ""),
        )
        qso_objects.append(qso_obj)

    # Save to database using injected repository
    saved_qsos = repo.insert_qsos(qso_objects)

    os.remove(f"temp_{file.filename}")
    return {"message": f"Processed {len(saved_qsos)} QSO entries", "qsos": saved_qsos}


def main():
    uvicorn.run("main:app", host="0.0.0.0", port=1293, reload=True)


if __name__ == "__main__":
    main()
