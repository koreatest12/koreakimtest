#!/usr/bin/env bash
set -euo pipefail
IMAGE="${1:-defenderbot:latest}"
CONTAINER_NAME="${2:-defenderbot}"

# Stop and remove existing container if present
if docker ps -a --format '{{.Names}}' | grep -Eq "^${CONTAINER_NAME}$"; then
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
fi

docker run -d --name "$CONTAINER_NAME" -p 8080:8080 --restart unless-stopped "$IMAGE"

echo "Container '$CONTAINER_NAME' is running on http://localhost:8080"
