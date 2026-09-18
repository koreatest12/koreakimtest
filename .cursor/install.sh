#!/usr/bin/env bash
# Cloud Agent environment bootstrap for the koreakimtest polyglot monorepo.
# Idempotent: safe to run repeatedly and against cached/partial state.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> Installing system packages (Maven + Python venv support)"
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update
sudo apt-get install -y --no-install-recommends maven python3.12-venv

echo "==> Installing Node dependencies (root + MCP servers)"
npm install
for d in money-mcp crypto-mcp chrome-mcp anthropic-cost-tracker/nodejs; do
  if [ -f "$d/package.json" ]; then
    echo "    - $d"
    (cd "$d" && npm install)
  fi
done

echo "==> Creating Python virtualenv (.venv) and installing dependencies"
python3 -m venv .venv
# shellcheck disable=SC1091
. .venv/bin/activate
pip install --upgrade pip
pip install \
  sqlalchemy faker tabulate cryptography requests beautifulsoup4 numpy pytest
if [ -f banking_pipeline/requirements.txt ]; then
  pip install -r banking_pipeline/requirements.txt
fi
deactivate

echo "==> Pre-fetching Maven dependencies for Java modules"
(cd enterprise-app && mvn -B -q -DskipTests dependency:resolve) || true
(cd financial-core && mvn -B -q dependency:resolve) || true

echo "==> Environment bootstrap complete"
