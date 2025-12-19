#!/bin/bash
# ===============================================
# Pi HLS Live Stream Setup Script
# ===============================================

set -e

HLS_DIR="$HOME/hls_stream"       # where HLS files will be saved
HLS_URL_PORT=8080                 # HTTP port
HLS_SEGMENT_TIME=1                # seconds per segment
HLS_LIST_SIZE=2                    # number of segments to keep
CAM_DEVICE="/dev/video0"          # Pi camera device
RESOLUTION="640x480"              # change as needed
FRAMERATE=30                      # fps
FFMPEG_PRESET="ultrafast"
FFMPEG_TUNE="zerolatency"

mkdir -p "$HLS_DIR"

echo "Starting HLS stream..."
ffmpeg -f v4l2 -framerate $FRAMERATE -video_size $RESOLUTION -i $CAM_DEVICE \
  -c:v h264 -preset $FFMPEG_PRESET -tune $FFMPEG_TUNE \
  -f hls \
  -hls_time $HLS_SEGMENT_TIME \
  -hls_list_size $HLS_LIST_SIZE \
  -hls_flags delete_segments \
  "$HLS_DIR/live.m3u8" &

FFMPEG_PID=$!
echo "FFmpeg running with PID $FFMPEG_PID"

echo "Serving HLS files at http://$(hostname -I | awk '{print $1}'):$HLS_URL_PORT/"
cd "$HLS_DIR"
python3 -m http.server $HLS_URL_PORT &

HTTP_PID=$!
echo "HTTP server running with PID $HTTP_PID"

cleanup() {
    echo "Stopping stream and server..."
    kill $FFMPEG_PID $HTTP_PID
    exit
}

trap cleanup SIGINT SIGTERM

echo "Press Ctrl+C to stop."
wait
