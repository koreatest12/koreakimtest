#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="defenderbot"
SERVICE_FILE="deploy/systemd/${SERVICE_NAME}.service"
JAR_SOURCE="${1:-target/defenderbot.jar}"

if [ ! -f "$SERVICE_FILE" ]; then
  echo "Service file not found: $SERVICE_FILE" >&2
  exit 1
fi

if [ ! -f "$JAR_SOURCE" ]; then
  echo "Jar not found at $JAR_SOURCE. Build the project first." >&2
  exit 1
fi

sudo useradd --system --no-create-home --shell /usr/sbin/nologin "$SERVICE_NAME" || true
sudo mkdir -p "/opt/${SERVICE_NAME}"
sudo cp "$JAR_SOURCE" "/opt/${SERVICE_NAME}/${SERVICE_NAME}.jar"
sudo cp "$SERVICE_FILE" "/etc/systemd/system/${SERVICE_NAME}.service"
sudo chown -R ${SERVICE_NAME}:${SERVICE_NAME} "/opt/${SERVICE_NAME}"

sudo systemctl daemon-reload
sudo systemctl enable --now "${SERVICE_NAME}.service"
systemctl status "${SERVICE_NAME}.service" --no-pager || true
