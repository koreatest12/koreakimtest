#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="teradata-batch"
SERVICE_FILE="deploy/systemd/${SERVICE_NAME}.service"
TIMER_FILE="deploy/systemd/${SERVICE_NAME}.timer"

if [ ! -f "$SERVICE_FILE" ] || [ ! -f "$TIMER_FILE" ]; then
  echo "Service or timer file not found in deploy/systemd" >&2
  exit 1
fi

sudo cp "$SERVICE_FILE" "/etc/systemd/system/${SERVICE_NAME}.service"
sudo cp "$TIMER_FILE" "/etc/systemd/system/${SERVICE_NAME}.timer"

sudo systemctl daemon-reload
sudo systemctl enable --now "${SERVICE_NAME}.timer"
systemctl status "${SERVICE_NAME}.timer" --no-pager || true
