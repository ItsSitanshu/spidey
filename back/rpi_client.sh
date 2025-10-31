#!/bin/bash
CAMERA_URL="rtsp://192.168.42.1/live"
OUT_DIR="/home/pi/dji_chunks"
SERVER_URL="http://192.168.16.101:8000/upload"

mkdir -p "$OUT_DIR"

ffmpeg -i "$CAMERA_URL" \
  -c copy -f segment \
  -segment_time 10 \
  -reset_timestamps 1 \
  "$OUT_DIR/clip_%03d.mp4" &

inotifywait -m -e close_write "$OUT_DIR" | while read -r path action file; do
  if [[ "$file" == clip_*.mp4 ]]; then
    echo "Uploading $file..."
    curl -X POST -F "device_id=rpi" -F "file=@$OUT_DIR/$file" "$SERVER_URL"
    rm "$OUT_DIR/$file"
  fi
done
