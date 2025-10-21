#!/usr/bin/env bash
set -euo pipefail

if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo apt-get install -y openjdk-17-jre docker.io
elif command -v dnf >/dev/null 2>&1; then
  sudo dnf install -y java-17-openjdk docker
elif command -v yum >/dev/null 2>&1; then
  sudo yum install -y java-17-openjdk docker
else
  echo "Unsupported distro. Please install Java 17 and Docker manually." >&2
  exit 1
fi

# Enable and start Docker if available
if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl enable --now docker || true
fi

# Add current user to docker group (may require re-login)
sudo usermod -aG docker "$USER" || true

echo "Dependencies installation completed. You may need to log out and back in for Docker group changes to take effect."
