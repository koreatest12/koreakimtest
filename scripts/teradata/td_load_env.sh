#!/usr/bin/env bash
set -euo pipefail

# Load Teradata environment variables from a .env file if present
# Usage: source td_load_env.sh [ENV_FILE]

ENV_FILE="${1:-/workspace/config/teradata/.env}"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC2046
  export $(grep -E '^[A-Z0-9_]+=' "$ENV_FILE" | xargs)
else
  echo "Warning: env file not found at $ENV_FILE; relying on existing environment" >&2
fi

: "${TD_HOST:?TD_HOST is required}"
: "${TD_PORT:=1025}"
: "${TD_USER:?TD_USER is required}"
: "${TD_PASSWORD:?TD_PASSWORD is required}"
: "${TD_DATABASE:=dbc}"
: "${TD_AUTH:=TD2}"
: "${TD_SQL_DIR:=/workspace/sql/teradata}"
: "${TD_DATA_DIR:=/workspace/data/teradata}"
: "${TD_TIMEOUT_SECONDS:=600}"
