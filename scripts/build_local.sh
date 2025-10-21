#!/usr/bin/env bash
set -euo pipefail

if ! command -v mvn >/dev/null 2>&1; then
  echo "Maven is not installed. Install Maven or build via Docker image build (which includes Maven in the build stage)." >&2
  exit 1
fi

mvn -DskipTests package
