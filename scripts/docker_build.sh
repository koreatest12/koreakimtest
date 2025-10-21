#!/usr/bin/env bash
set -euo pipefail
IMAGE="${1:-defenderbot:latest}"
DOCKER_BUILDKIT=1 docker build -t "$IMAGE" .
