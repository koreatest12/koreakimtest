#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="$REPO_ROOT/linux-images"
ARTIFACT_ROOT="$WORK_DIR/artifacts"
LOG_DIR="$WORK_DIR/logs"
CONFIG_DIR="$WORK_DIR/config"
DIRECTORIES_FILE="$CONFIG_DIR/directories.txt"

mkdir -p "$ARTIFACT_ROOT/iso" "$ARTIFACT_ROOT/disks" "$LOG_DIR"

if [[ ! -f "$DIRECTORIES_FILE" ]]; then
  echo "[linux-image-workflow] config/directories.txt 파일이 없어 기본 파일을 생성합니다." >&2
  cat <<'DIRS' > "$DIRECTORIES_FILE"
apps/prod/api
DIRS
fi

TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
COMMIT_HASH="$(git -C "$REPO_ROOT" rev-parse HEAD)"
RUN_ID="${GITHUB_RUN_ID:-local}"

SANITIZED_TS="${TIMESTAMP//[:TZ-]/}"
DOWNLOAD_LOG="$LOG_DIR/download-${SANITIZED_TS}.md"
cat > "$DOWNLOAD_LOG" <<EOF_INNER
# Download and Verification Report
- generated_at: $TIMESTAMP
- commit: $COMMIT_HASH
- run: $RUN_ID
- ubuntu_iso: pending automation
- rhel_iso: pending automation
- kali_iso: pending automation
EOF_INNER

for os in ubuntu rhel kali; do
  ISO_PATH="$ARTIFACT_ROOT/iso/${os}-server.iso"
  DISK_PATH="$ARTIFACT_ROOT/disks/${os}-server.qcow2"
  printf "Simulated %s ISO for %s\n" "$TIMESTAMP" "$os" > "$ISO_PATH"
  printf "Simulated %s disk for %s\n" "$TIMESTAMP" "$os" > "$DISK_PATH"
  gzip -f "$ISO_PATH"
  gzip -f "$DISK_PATH"
  sha256sum "${ISO_PATH}.gz" "${DISK_PATH}.gz"
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
  ]
}
EOF_MANIFEST

cat <<EOF_SUMMARY
[linux-image-workflow] Completed scaffold artifacts.
- manifest: $MANIFEST
- checksums: $ARTIFACT_ROOT/checksums.txt
- download log: $DOWNLOAD_LOG
EOF_SUMMARY
