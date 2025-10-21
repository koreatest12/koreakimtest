#!/usr/bin/env bash
set -euo pipefail
IMAGE="${1:-defenderbot:latest}"
OUT="${2:-defenderbot.tar}"
docker save "$IMAGE" -o "$OUT"
echo "Saved image $IMAGE to $OUT"
