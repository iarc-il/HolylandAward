import uvicorn
import adif_io
import math


from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer
from adif_service import AdifService
from database import get_db, SessionLocal
from qsos.repository import insert_qsos, get_areas_by_spotter
from qsos.schema import QSO
from users.router import router as users_router
from users.admin_router import router as admin_router
from users.repository import get_callsigns_for_user
from qsos.router import router as qsos_router
from system_settings.router import router as system_settings_router
from system_settings.repository import get_setting
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from utils import get_frontend_origins, verify_clerk_session, authenticate_request, is_admin_user

from lifespan import lifespan

origins = get_frontend_origins()


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
app.include_router(admin_router)
app.include_router(qsos_router)
app.include_router(system_settings_router)

bearer_scheme = HTTPBearer()

# Webhook endpoint removed - users are now auto-created on first authentication
# See utils.py::get_or_create_user_from_clerk() for the new pattern


PUBLIC_PATHS = {"/", "/maintenance-mode", "/docs", "/openapi.json", "/favicon.ico"}


def _parse_freq(value) -> float:
    """A QSO record without a usable FREQ must not crash the whole upload.

    NaN/inf parse as floats but cannot be serialized to JSON, which would make
    the upload response (and every later read of that row) fail, so they are
    treated as missing too.
    """
    try:
        freq = float(value)
    except (TypeError, ValueError):
        return 0.0
    return freq if math.isfinite(freq) else 0.0


def _parse_adif(contents: bytes):
    """Parse an uploaded ADIF file, turning unreadable input into a clear 400."""
    # ADIF field lengths are byte counts, but adif_io slices by Python
    # character count. Decoding as latin-1 keeps a 1:1 byte-to-character
    # mapping so multi-byte UTF-8 content (e.g. Hebrew names/comments from
    # N1MM) doesn't shift field boundaries and corrupt the parse.
    try:
        qsos, _header = adif_io.read_from_string(contents.decode("latin-1"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This file is not a valid ADIF log (.adi).",
        )
    return qsos


@app.middleware("http")
async def maintenance_mode_check(request: Request, call_next):
    if request.method == "OPTIONS" or request.url.path in PUBLIC_PATHS:
        return await call_next(request)

    db = SessionLocal()
    try:
        maintenance = get_setting(db, "maintenance_mode")
        if maintenance != "true":
            return await call_next(request)

        try:
            user_id = await authenticate_request(request)
            if not await is_admin_user(user_id):
                return JSONResponse(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    content={"detail": "Site is under maintenance. Please try again later."},
                )
            return await call_next(request)
        except Exception:
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={"detail": "Site is under maintenance. Please try again later."},
            )
    finally:
        db.close()


@app.get("/")
def read_root():
    return {"Hello": "Worldddd"}


# get all areas of a spotter
@app.get("/areas/{spotter_callsign}")
async def get_all_areas(
    spotter_callsign: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(verify_clerk_session),
):
    # Auto-create user if doesn't exist
    from utils import get_or_create_user_from_clerk

    await get_or_create_user_from_clerk(db, user_id)

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
    # Get or create user from Clerk, then check for callsign
    from utils import get_or_create_user_from_clerk

    user = await get_or_create_user_from_clerk(db, user_id)
    if not user.callsign:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User callsign not found. Please update your profile first.",
        )

    spotter_callsign = user.callsign
    spotter_callsigns = get_callsigns_for_user(db, user)

    contents = await file.read()
    qsos = _parse_adif(contents)
    adif_service = AdifService(qsos, spotter_callsigns=spotter_callsigns)
    valid_entries = adif_service.get_valid_entries()
    # Callsigns in the file that are not the user's (e.g. an old callsign) -
    # the frontend offers to link them instead of silently dropping the QSOs.
    unmatched_callsigns = adif_service.get_unmatched_callsigns()

    # Convert valid entries to QSO schema objects
    qso_objects = []
    for entry in valid_entries:
        qso_obj = QSO(
            date=entry.get("date", ""),
            freq=_parse_freq(entry.get("freq")),
            spotter=entry.get("spotter", ""),
            dx=entry.get("dx", ""),
            area=entry.get("area", ""),
        )
        qso_objects.append(qso_obj)

    # Save to database using functional repository
    saved_qsos = insert_qsos(db, qso_objects)

    # Return organized response with QSO data
    return {
        "total_qsos": len(saved_qsos),
        "callsign": spotter_callsign,
        "unmatched_callsigns": unmatched_callsigns,
        "qsos": [
            {
                "id": qso.id,
                "date": qso.date,
                "freq": qso.freq,
                "spotter": qso.spotter,
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
