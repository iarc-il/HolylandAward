from fastapi import FastAPI, UploadFile, File, Depends
import uvicorn
import adif_io
import os
from contextlib import asynccontextmanager
from adif_service import AdifService
from database import get_db
from qsos.qsos_repository import QSORepository
from qsos.schema import QSO
from sqlalchemy.orm import Session


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print("Application starting up...")
    print("Note: Run 'uv run alembic upgrade head' to apply migrations")

    yield

    # Shutdown (if needed)
    print("Application shutting down...")


app = FastAPI(lifespan=lifespan)


# Dependency function to get repository
def get_qso_repository(db: Session = Depends(get_db)) -> QSORepository:
    return QSORepository(db)


@app.get("/")
def read_root():
    return {"Hello": "Worldddd"}


@app.post("/read-file")
async def upload_file(
    file: UploadFile = File(...),
    spotter_callsign: str = "4Z1KD",
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
