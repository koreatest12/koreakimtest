#!/usr/bin/env bash
set -euo pipefail
FILE="${1:-defenderbot.tar}"
docker load -i "$FILE"
