#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="$REPO_ROOT/linux-images"
ARTIFACT_ROOT="$WORK_DIR/artifacts"
LOG_DIR="$WORK_DIR/logs"
CONFIG_DIR="$WORK_DIR/config"
DIRECTORY_BLUEPRINT_FILE="$CONFIG_DIR/directories.txt"
WORKSPACE_ROOT="$WORK_DIR/workspaces"

mkdir -p "$ARTIFACT_ROOT/iso" \
         "$ARTIFACT_ROOT/disks" \
         "$LOG_DIR" \
         "$WORKSPACE_ROOT"

if [[ ! -f "$DIRECTORY_BLUEPRINT_FILE" ]]; then
  echo "[linux-image-workflow] config/directories.txt 파일이 없어 기본 파일을 생성합니다." >&2
  cat <<'DIRS' > "$DIRECTORY_BLUEPRINT_FILE"
apps/prod/api
apps/prod/web
monitoring/prod/prometheus
DIRS
fi

TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
COMMIT_HASH="$(git -C "$REPO_ROOT" rev-parse HEAD)"
RUN_ID="${GITHUB_RUN_ID:-local}"

SANITIZED_TS="${TIMESTAMP//[:TZ-]/}"
DOWNLOAD_LOG="$LOG_DIR/download-${SANITIZED_TS}.md"
BULK_DIR_LOG="$LOG_DIR/directories-${SANITIZED_TS}.md"
cat > "$DOWNLOAD_LOG" <<EOF_INNER
# Download and Verification Report
- generated_at: $TIMESTAMP
- commit: $COMMIT_HASH
- run: $RUN_ID
- ubuntu_iso: pending automation
- rhel_iso: pending automation
- kali_iso: pending automation
EOF_INNER

mapfile -t DIRECTORY_BLUEPRINTS < <(grep -v '^[[:space:]]*#' "$DIRECTORY_BLUEPRINT_FILE" | sed '/^\s*$/d')
if [[ ${#DIRECTORY_BLUEPRINTS[@]} -eq 0 ]]; then
  echo "apps/prod/api" > "$DIRECTORY_BLUEPRINT_FILE"
  DIRECTORY_BLUEPRINTS=("apps/prod/api")
fi

cat > "$BULK_DIR_LOG" <<EOF_DIR_LOG
# Directory Factory Report
- generated_at: $TIMESTAMP
- commit: $COMMIT_HASH
- run: $RUN_ID
- source_file: $DIRECTORY_BLUEPRINT_FILE

EOF_DIR_LOG

declare -A DIRECTORY_COUNTS=()

for os in ubuntu rhel kali; do
  ISO_PATH="$ARTIFACT_ROOT/iso/${os}-server.iso"
  DISK_PATH="$ARTIFACT_ROOT/disks/${os}-server.qcow2"
  printf "Simulated %s ISO for %s\n" "$TIMESTAMP" "$os" > "$ISO_PATH"
  printf "Simulated %s disk for %s\n" "$TIMESTAMP" "$os" > "$DISK_PATH"
  gzip -f "$ISO_PATH"
  gzip -f "$DISK_PATH"
  sha256sum "${ISO_PATH}.gz" "${DISK_PATH}.gz"

  WORKSPACE_OS_ROOT="$WORKSPACE_ROOT/$os"
  mkdir -p "$WORKSPACE_OS_ROOT"
  COUNT=0
  {
    echo "## $os"
    for rel_path in "${DIRECTORY_BLUEPRINTS[@]}"; do
      TARGET="$WORKSPACE_OS_ROOT/$rel_path"
      mkdir -p "$TARGET"
      touch "$TARGET/.keep"
      echo "- $rel_path" 
      COUNT=$((COUNT + 1))
    done
    echo
  } >> "$BULK_DIR_LOG"
  DIRECTORY_COUNTS[$os]=$COUNT
done > "$ARTIFACT_ROOT/checksums.txt"

MANIFEST="$ARTIFACT_ROOT/manifest.json"
cat > "$MANIFEST" <<EOF_MANIFEST
{
  "generated_at": "$TIMESTAMP",
  "commit": "$COMMIT_HASH",
  "run_id": "$RUN_ID",
  "images": [
    {
      "name": "ubuntu",
      "iso": "artifacts/iso/ubuntu-server.iso.gz",
      "disk": "artifacts/disks/ubuntu-server.qcow2.gz"
    },
    {
      "name": "rhel",
      "iso": "artifacts/iso/rhel-server.iso.gz",
      "disk": "artifacts/disks/rhel-server.qcow2.gz"
    },
    {
      "name": "kali",
      "iso": "artifacts/iso/kali-server.iso.gz",
      "disk": "artifacts/disks/kali-server.qcow2.gz"
    }
  ],
  "bulk_directories": {
    "config_source": "config/directories.txt",
    "workspace_root": "workspaces",
    "counts": {
      "ubuntu": ${DIRECTORY_COUNTS[ubuntu]:-0},
      "rhel": ${DIRECTORY_COUNTS[rhel]:-0},
      "kali": ${DIRECTORY_COUNTS[kali]:-0}
    }
  }
}
EOF_MANIFEST

cat <<EOF_SUMMARY
[linux-image-workflow] Completed scaffold artifacts.
- manifest: $MANIFEST
- checksums: $ARTIFACT_ROOT/checksums.txt
- download log: $DOWNLOAD_LOG
- directory log: $BULK_DIR_LOG
EOF_SUMMARY
