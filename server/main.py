from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2, numpy as np, threading, asyncio, time, os
from ultralytics import YOLO
from datetime import datetime

MODEL_PATH = os.environ.get("YOLO_MODEL", "yolo11s.pt")
model = YOLO(MODEL_PATH)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

latest_frame = None
frame_lock = threading.Lock()
clients = set()

PROCESS_FPS = 5
OBSTACLE_SIZE_THRESHOLD = 0.15
OBSTACLE_CENTER_TOLERANCE = 0.25

@app.post("/stream")
async def stream(request: Request):
    global latest_frame
    print("[INFO] Frame stream connected")
    bytes_data = b""
    async for chunk in request.stream():
        bytes_data += chunk
        a = bytes_data.find(b'\xff\xd8')
        b = bytes_data.find(b'\xff\xd9')
        if a != -1 and b != -1:
            jpg = bytes_data[a:b+2]
            bytes_data = bytes_data[b+2:]
            frame = cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)
            if frame is not None:
                with frame_lock:
                    latest_frame = frame
    return JSONResponse({"status": "ended"})

@app.get("/process")
def process_feed():
    async def gen():
        while True:
            with frame_lock:
                frame = latest_frame.copy() if latest_frame is not None else None
            if frame is not None:
                results = model.predict(frame, imgsz=640, verbose=False)
                annotated = results[0].plot()
                _, jpeg = cv2.imencode('.jpg', annotated)
                yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
            await asyncio.sleep(0.2)
    return StreamingResponse(gen(), media_type='multipart/x-mixed-replace; boundary=frame')

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    clients.add(ws)
    print(f"[INFO] Client connected: {ws.client.host}")
    try:
        while True:
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        clients.remove(ws)
        print(f"[INFO] Client disconnected: {ws.client.host}")

def processor_loop():
    global latest_frame
    print("[INFO] Processor loop running")
    last_cmd = None
    while True:
        if latest_frame is None:
            time.sleep(0.1)
            continue

        with frame_lock:
            frame = latest_frame.copy()

        results = model.predict(frame, imgsz=640, verbose=False)
        dets = results[0].boxes
        h, w = frame.shape[:2]

        found_obstacle = False
        obstacle_centered = False

        for box in dets:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            bw, bh = (x2 - x1) / w, (y2 - y1) / h
            cx = (x1 + x2) / 2.0 / w

            if bw > OBSTACLE_SIZE_THRESHOLD or bh > OBSTACLE_SIZE_THRESHOLD:
                found_obstacle = True
            if abs(cx - 0.5) < OBSTACLE_CENTER_TOLERANCE and (bw > 0.08 or bh > 0.08):
                obstacle_centered = True

        if found_obstacle:
            if obstacle_centered:
                cmd = {"cmd": "turn_left", "reason": "obstacle_centered", "timestamp": datetime.now().isoformat()}
            else:
                cmd = {"cmd": "stop", "reason": "obstacle_detected", "timestamp": datetime.now().isoformat()}
        else:
            cmd = {"cmd": "forward", "reason": "clear_path", "timestamp": datetime.now().isoformat()}

        if cmd != last_cmd:  # only broadcast when changed
            print(f"[CMD] {cmd}")
            asyncio.run(broadcast_command(cmd))
            last_cmd = cmd

        time.sleep(1.0 / PROCESS_FPS)

async def broadcast_command(cmd):
    for ws in list(clients):
        try:
            await ws.send_json(cmd)
        except Exception:
            clients.discard(ws)

threading.Thread(target=processor_loop, daemon=True).start()

@app.get("/")
def root():
    return {"status": "server running", "clients": len(clients)}
