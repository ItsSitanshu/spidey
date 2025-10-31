from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
import os
from datetime import datetime

app = FastAPI()

UPLOAD_DIR = "clips"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload")
async def upload_clip(file: UploadFile = File(...), device_id: str = Form("rpi")):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{device_id}_{timestamp}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(await file.read())

    return JSONResponse({"status": "ok", "filename": filename})
