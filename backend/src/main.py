from fastapi import FastAPI, UploadFile, File
import uvicorn
import adif_io
import os

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "Worldddd"}


@app.post("/read-file")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    with open(f"temp_{file.filename}", "wb") as f:
        f.write(contents)

    qsos, header = adif_io.read_from_file(f"temp_{file.filename}")
    print(qsos, header)

    os.remove(f"temp_{file.filename}")
    return {"qsos": qsos, "header": header}


def main():
    uvicorn.run("main:app", host="0.0.0.0", port=1293, reload=True)


if __name__ == "__main__":
    main()
