#!/usr/bin/env bash
set -euo pipefail

# Generate customer-specific SQL files from templates
# Usage: generate_customer_sql.sh CUSTOMER_NAME [PERM_MB] [SPOOL_MB]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/td_load_env.sh" ${TD_ENV_FILE:-}

CUSTOMER="${1:-}"
PERM_MB="${2:-1024}"
SPOOL_MB="${3:-1024}"

if [[ -z "$CUSTOMER" ]]; then
  echo "Usage: $0 CUSTOMER_NAME [PERM_MB] [SPOOL_MB]" >&2
  exit 1
fi

TPL_DIR="$TD_SQL_DIR/templates"
OUT_DIR="$TD_SQL_DIR/customers/${CUSTOMER}"
mkdir -p "$OUT_DIR"

# 00 - Create user
cat >"${OUT_DIR}/00_create_user.sql" <<SQL
-- Generated for ${CUSTOMER}
$(cat "$TPL_DIR/create_user.sql")
SQL

# 01 - Create database
cat >"${OUT_DIR}/01_create_db.sql" <<SQL
-- Generated for ${CUSTOMER}
$(cat "$TPL_DIR/create_database.sql")
SQL

# 02 - Grant privileges
cat >"${OUT_DIR}/02_grants.sql" <<SQL
-- Generated for ${CUSTOMER}
$(cat "$TPL_DIR/grant_privileges.sql")
SQL

# 03 - Create schema objects
cat >"${OUT_DIR}/03_schema.sql" <<SQL
-- Generated for ${CUSTOMER}
$(cat "$TPL_DIR/schema_template.sql")
SQL

# Provide a default .vars file to feed into td_run_sql
cat >"${OUT_DIR}/.vars" <<VARS
DB_NAME=${CUSTOMER}_db
DB_OWNER=dbc
PERM_SPACE_MB=${PERM_MB}
SPOOL_SPACE_MB=${SPOOL_MB}
GRANTEE=${CUSTOMER}_user
USER_NAME=${CUSTOMER}_user
PASSWORD=${CUSTOMER}_P@ssw0rd
VARS

echo "Generated SQL files in ${OUT_DIR}"
