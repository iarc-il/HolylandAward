from fastapi import FastAPI, UploadFile, File
import uvicorn
import adif_io
import os
from adif_service import AdifService

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "Worldddd"}


@app.post("/read-file")
async def upload_file(file: UploadFile = File(...), spotter_callsign: str = "4Z1KD"):
    contents = await file.read()
    with open(f"temp_{file.filename}", "wb") as f:
        f.write(contents)

    qsos, header = adif_io.read_from_file(f"temp_{file.filename}")
    adif_service = AdifService(qsos, spotter_callsign=spotter_callsign)
    valid_entries = adif_service.get_valid_entries()
    os.remove(f"temp_{file.filename}")
    return valid_entries


def main():
    uvicorn.run("main:app", host="0.0.0.0", port=1293, reload=True)


if __name__ == "__main__":
    main()
