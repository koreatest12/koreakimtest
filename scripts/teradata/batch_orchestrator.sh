#!/usr/bin/env bash
set -euo pipefail

# Orchestrate Teradata workflow: install deps, generate/apply SQL, load data, repeat every run
# This script runs once; use systemd timer to schedule every 10 minutes

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/td_load_env.sh" ${TD_ENV_FILE:-}

CUSTOMERS_DIR="$TD_SQL_DIR/customers"
DATA_DIR="$TD_DATA_DIR/customers"

# Optional step: install any additional required client tools
if ! command -v bteq >/dev/null 2>&1; then
  echo "bteq not found; attempting to install Teradata CLIv2/bteq (apt/yum)." >&2
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -y
    sudo apt-get install -y teradata-client teradata-tools-and-utilities || true
  elif command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y teradata-client teradata-tools-and-utilities || true
  elif command -v yum >/dev/null 2>&1; then
    sudo yum install -y teradata-client teradata-tools-and-utilities || true
  else
    echo "Unsupported distro for auto-install; please install bteq manually." >&2
  fi
fi

# Iterate all customers and ensure SQL exists, then apply
shopt -s nullglob
for vars in "$CUSTOMERS_DIR"/*/.vars; do
  customer_dir="$(dirname "$vars")"
  customer="$(basename "$customer_dir")"

  if [[ -z $(ls -1 "$customer_dir"/*.sql 2>/dev/null) ]]; then
    "$SCRIPT_DIR/generate_customer_sql.sh" "$customer"
  fi

  "$SCRIPT_DIR/apply_customer_sql.sh" "$customer"

  # Data loading hook: load any .sql under data directory for this customer
  data_sql_dir="$DATA_DIR/$customer"
  if [[ -d "$data_sql_dir" ]]; then
    for sql in "$data_sql_dir"/*.sql; do
      [ -f "$sql" ] || continue
      echo "Loading data with $(basename "$sql") for ${customer}"
      "$SCRIPT_DIR/td_run_sql.sh" "$sql"
    done
  fi

done
