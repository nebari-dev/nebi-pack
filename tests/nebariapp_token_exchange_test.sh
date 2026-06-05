#!/usr/bin/env bash
# Verify the rendered NebariApp enables token exchange by default, so the
# JupyterHub client is permitted to exchange a user token for a Nebi-audience
# token in Keycloak without a per-deployment override.
set -euo pipefail

CHART_DIR="$(cd "$(dirname "$0")/.." && pwd)"

render() {
  helm template t "$CHART_DIR" --set nebariapp.hostname=nebi.example.com "$@"
}

# Default values must render tokenExchange.enabled=true on the NebariApp.
if render | grep -A1 "tokenExchange:" | grep -q "enabled: true"; then
  echo "PASS: tokenExchange enabled by default"
else
  echo "FAIL: tokenExchange not enabled by default in rendered NebariApp"
  exit 1
fi
