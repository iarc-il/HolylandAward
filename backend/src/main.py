import uvicorn
import adif_io
import os
import json


from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
from adif_service import AdifService
from database import get_db
from qsos.repository import insert_qsos, get_areas_by_spotter
from qsos.schema import QSO
from users import service as user_service
from users.repository import get_user_by_clerk_id
from users.schema import UserProfileUpdateRequest, UserResponse
from users.router import router as users_router
from qsos.router import router as qsos_router
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

# Include routers
app.include_router(users_router)
app.include_router(qsos_router)

bearer_scheme = HTTPBearer()


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


@app.get("/")
def read_root():
    return {"Hello": "Worldddd"}


# get all areas of a spotter
@app.get("/areas/{spotter_callsign}")
def get_all_areas(
    spotter_callsign: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_clerk_session),
):
    print(f"user_id: {user_id}")
    areas = get_areas_by_spotter(db, spotter_callsign)
    return {"areas": areas}


@app.post("/read-file")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_clerk_session),
):
    # Get user from database to retrieve callsign
    user = get_user_by_clerk_id(db, user_id)
    if not user or not user.callsign:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User callsign not found. Please update your profile first.",
        )

    spotter_callsign = user.callsign

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

    # Save to database using functional repository
    saved_qsos = insert_qsos(db, qso_objects)

    os.remove(f"temp_{file.filename}")

    # Return organized response with QSO data
    return {
        "total_qsos": len(saved_qsos),
        "callsign": spotter_callsign,
        "qsos": [
            {
                "id": qso.id,
                "date": qso.date,
                "freq": qso.freq,
                "dx": qso.dx,
                "area": qso.area,
            }
            for qso in saved_qsos
        ],
    }


def main():
    uvicorn.run("main:app", host="0.0.0.0", port=1293, reload=True)


if __name__ == "__main__":
    main()
