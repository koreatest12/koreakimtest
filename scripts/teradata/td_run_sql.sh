#!/usr/bin/env bash
set -euo pipefail

# Execute Teradata SQL using bteq with variable substitution.
# Usage: td_run_sql.sh [-e ENV_FILE] [-v VAR=VALUE ...] sql_file

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/td_load_env.sh" ${TD_ENV_FILE:-}

ENV_FILE=""
VARS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--env)
      ENV_FILE="$2"; shift 2;;
    -v|--var)
      VARS+=("$2"); shift 2;;
    --)
      shift; break;;
    -h|--help)
      echo "Usage: $0 [-e ENV_FILE] [-v VAR=VALUE ...] sql_file"; exit 0;;
    *)
      break;;
  esac
done

if [[ -n "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$SCRIPT_DIR/td_load_env.sh" "$ENV_FILE"
fi

SQL_FILE="${1:-}"
if [[ -z "$SQL_FILE" || ! -f "$SQL_FILE" ]]; then
  echo "SQL file not found: $SQL_FILE" >&2
  exit 1
fi

# Build sed script for variable substitution
SED_EXPR=()
for kv in "${VARS[@]:-}"; do
  key="${kv%%=*}"; val="${kv#*=}"
  # Escape sed delimiter and ampersands
  val_esc=$(printf '%s' "$val" | sed -e 's/[\/&]/\\&/g')
  SED_EXPR+=('-e' "s/\\$\\{${key}\\}/${val_esc}/g")
done

TMP_SQL=$(mktemp)
sed "${SED_EXPR[@]:-}" "$SQL_FILE" > "$TMP_SQL"
trap 'rm -f "$TMP_SQL"' EXIT

# Compose BTEQ logon
LOGON_STR=".LOGON ${TD_HOST}/${TD_USER},${TD_PASSWORD};"
if [[ -n "${TD_AUTH:-}" && "${TD_AUTH}" != "TD2" ]]; then
  LOGON_STR=".LOGON ${TD_HOST}/${TD_USER},${TD_PASSWORD},${TD_AUTH};"
fi

# Execute via bteq if available, else try Docker teradatasql (Python)
if command -v bteq >/dev/null 2>&1; then
  timeout "$TD_TIMEOUT_SECONDS" bteq <<EOF
${LOGON_STR}
DATABASE ${TD_DATABASE};
.RUN FILE=${TMP_SQL};
.LOGOFF;
.QUIT 0;
EOF
else
  echo "bteq not found. Please install Teradata CLIv2/bteq or provide an alternative runner." >&2
  exit 127
fi
