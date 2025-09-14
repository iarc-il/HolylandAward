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
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions
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

clerk = Clerk(bearer_auth="ADDKEY")
bearer_scheme = HTTPBearer()


# Define the authentication dependency
async def verify_clerk_session(request: Request):
    """
    Verifies the user's session using Clerk's SDK and returns the user ID.
    Raises an HTTPException if the user is not authenticated.
    """
    try:
        # Pass the raw FastAPI request object to Clerk's authentication method.
        # This handles parsing the Authorization header and verifying the JWT.
        session = clerk.authenticate_request(
            request,
            AuthenticateRequestOptions(authorized_parties=["http://localhost:5173"]),
        )

        # The session object contains all the user and session data
        if not session.is_signed_in:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated."
            )

        # Return the user_id, which can be injected into the route handler
        return session.payload["sub"]

    except Exception as e:
        # Catch any exceptions during authentication and return a 401 error
        print(f"Authentication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
        )


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
