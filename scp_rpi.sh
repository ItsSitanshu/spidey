#!/bin/bash
# scp_rpi.sh — Copy local folders to Raspberry Pi with presets

PI_USER="pi"
PI_HOST="raspberrypi.local"
PI_DEST="/"    

show_usage() {
  echo "Usage: $0 [-p preset_number] [local_folder_path] [optional_remote_subdir]"
  echo "  Presets:"
  echo "    -p 1   Copy './rpi/' → $PI_USER@$PI_HOST:$PI_DEST/rpi"
  echo "    -p 2   Copy '../rpi/' → $PI_USER@$PI_HOST:$PI_DEST/rpi"
  exit 1
}

PRESET=0
while getopts "p:" opt; do
  case $opt in
    p)
      PRESET=$OPTARG
      ;;
    *)
      show_usage
      ;;
  esac
done
shift $((OPTIND - 1))

if [ "$PRESET" -eq 1 ]; then
  LOCAL_PATH="rpi"
  echo "Using preset 1: Copying './rpi/' → $PI_USER@$PI_HOST:$DEST_PATH"
elif [ "$PRESET" -eq 2 ]; then
  LOCAL_PATH="../rpi"
  echo "Using preset 1: Copying '../rpi/' → $PI_USER@$PI_HOST:$DEST_PATH"
else
  if [ "$#" -lt 1 ]; then
    show_usage
  fi

  LOCAL_PATH="$1"
  REMOTE_SUBDIR="${2:-}"

  if [ ! -d "$LOCAL_PATH" ]; then
    echo "Error: '$LOCAL_PATH' is not a directory."
    exit 1
  fi

  if [ -n "$REMOTE_SUBDIR" ]; then
    DEST_PATH="$PI_DEST/$REMOTE_SUBDIR"
  else
    DEST_PATH="$PI_DEST"
  fi
fi

echo "Copying '$LOCAL_PATH' → $PI_USER@$PI_HOST:$DEST_PATH ..."
scp -rp "$LOCAL_PATH" "$PI_USER@$PI_HOST:$DEST_PATH"

if [ $? -eq 0 ]; then
  echo "[✅] Transfer complete!"
else
  echo "[❌] Transfer failed!"
fi