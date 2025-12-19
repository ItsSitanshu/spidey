from flask import Flask, Response
import cv2
import time

app = Flask(__name__)

CAM_INDEX = 0
cap = cv2.VideoCapture(CAM_INDEX)

cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
cap.set(cv2.CAP_PROP_FPS, 24)

def generate_frames():
    while True:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.01)
            continue  # skip if frame not ready
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video')
def video_feed():
    return Response(
        generate_frames(),
        mimetype='multipart/x-mixed-replace; boundary=frame',
        headers={
            'Access-Control-Allow-Origin': '*',  # allow mobile devices to fetch
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        }
    )

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, threaded=True)
