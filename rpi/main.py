import asyncio, websockets, aiohttp, cv2, time, threading
from rpi.depr.movement import HexapodController, ServoDriver
from maps.beta import *


SERVER_URL = "http://10.10.254.245:8888"  
WS_URL = SERVER_URL.replace("http", "ws") + "/ws"

servo_driver = ServoDriver()
hexapod = HexapodController(servo_driver, servo_map=SERVO_MAP)  # load your actual SERVO_MAP

current_command = "stop"
streaming = True

async def stream_video():
    async with aiohttp.ClientSession() as session:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("[ERR] Camera not found.")
            return
        async with session.post(SERVER_URL + "/stream", data=frame_generator(cap)) as resp:
            print("[INFO] Stream closed:", resp.status)

async def frame_generator(cap):
    while streaming:
        ret, frame = cap.read()
        if not ret:
            continue
        _, jpg = cv2.imencode('.jpg', frame)
        yield jpg.tobytes()
        await asyncio.sleep(0.1)

async def listen_commands():
    global current_command
    async with websockets.connect(WS_URL) as ws:
        print("[INFO] Connected to control WebSocket.")
        async for msg in ws:
            data = eval(msg) if isinstance(msg, str) else msg
            cmd = data.get("cmd")
            reason = data.get("reason")
            print(f"[CMD RECEIVED] {cmd} ({reason})")
            current_command = cmd
            execute_command(cmd)

def execute_command(cmd):
    if cmd == "forward":
        hexapod.perform_step(direction=1)
    elif cmd == "turn_left":
        hexapod.perform_step(direction=-1)
    elif cmd == "stop":
        hexapod.move_to_neutral()
    else:
        print(f"[WARN] Unknown cmd: {cmd}")

def main():
    loop = asyncio.get_event_loop()
    loop.create_task(stream_video())
    loop.create_task(listen_commands())
    loop.run_forever()

if __name__ == "__main__":
    main()
