#!/usr/bin/env bash
set -euo pipefail

# Apply generated customer SQL files in order using td_run_sql.sh with variables
# Usage: apply_customer_sql.sh CUSTOMER_NAME [ENV_FILE]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/td_load_env.sh" ${TD_ENV_FILE:-}

CUSTOMER="${1:-}"
ENV_FILE_OVERRIDE="${2:-}"

if [[ -z "$CUSTOMER" ]]; then
  echo "Usage: $0 CUSTOMER_NAME [ENV_FILE]" >&2
  exit 1
fi

CUSTOMER_DIR="$TD_SQL_DIR/customers/${CUSTOMER}"
if [[ ! -d "$CUSTOMER_DIR" ]]; then
  echo "Customer SQL directory not found: $CUSTOMER_DIR" >&2
  exit 1
fi

# Load variables from .vars
VARS_FILE="$CUSTOMER_DIR/.vars"
if [[ ! -f "$VARS_FILE" ]]; then
  echo "Vars file not found: $VARS_FILE" >&2
  exit 1
fi

mapfile -t VARS_ARR < <(grep -E '^[A-Z0-9_]+=' "$VARS_FILE")

runner="$SCRIPT_DIR/td_run_sql.sh"

# Execute SQL files in lexical order
shopt -s nullglob
for sql in "$CUSTOMER_DIR"/*.sql; do
  echo "Applying: $(basename "$sql") for ${CUSTOMER}"
  "$runner" ${ENV_FILE_OVERRIDE:+-e "$ENV_FILE_OVERRIDE"} $(printf ' -v %q' "${VARS_ARR[@]}") "$sql"
 done
