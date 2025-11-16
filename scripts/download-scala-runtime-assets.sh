#!/usr/bin/env bash
set -euo pipefail

SCALA_VERSION=${SCALA_VERSION:-2.13.14}
SBT_VERSION=${SBT_VERSION:-1.10.2}
TARGET_DIR=${TARGET_DIR:-artifacts/scala-runtime}

mkdir -p "${TARGET_DIR}"

echo "[scala-runtime] Downloading Scala ${SCALA_VERSION} archive"
curl -fsSL "https://downloads.lightbend.com/scala/${SCALA_VERSION}/scala-${SCALA_VERSION}.tgz" -o "${TARGET_DIR}/scala-${SCALA_VERSION}.tgz"

echo "[scala-runtime] Downloading SBT ${SBT_VERSION} archive"
curl -fsSL "https://github.com/sbt/sbt/releases/download/v${SBT_VERSION}/sbt-${SBT_VERSION}.tgz" -o "${TARGET_DIR}/sbt-${SBT_VERSION}.tgz"

echo "[scala-runtime] Contents:"
ls -al "${TARGET_DIR}"
