#!/usr/bin/env bash
# Install service dependencies (dsh, whistle, set-global-proxy) plus a real
# Node.js runtime into a flat tree suitable for electron-builder
# extraResources copy.
#
# The runtime version is pinned to the *installing* machine's node version so
# native modules (node-pty etc.) built during `npm install` match the
# bundled binary exactly.
#
# Usage: ./scripts/install-services.sh [--force]
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICES_DIR="$DIR/resources/services"
FORCE="${1:-}"

if [ -d "$SERVICES_DIR/node_modules" ] && [ "$FORCE" != "--force" ]; then
  echo "services node_modules exists, skipping deps (use --force to reinstall)"
else
  rm -rf "$SERVICES_DIR/node_modules" "$SERVICES_DIR/package-lock.json"
  # Whistle's dependency graph can exceed Node's default 2 GB heap on CI.
  # Keep this scoped to the install rather than changing the app runtime.
  NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=4096" \
    npm install --prefix "$SERVICES_DIR" --omit=dev --no-audit --no-fund
  echo "services installed at $SERVICES_DIR/node_modules"
fi

# ---- macOS window-list helper for screenshot window detection ----
bash "$DIR/scripts/build-windowlist.sh"

# ---- macOS selection watcher for selection-translate (AX API) ----
bash "$DIR/scripts/build-selectionwatch.sh"

# ---- bundled Node.js runtime ----
NODE_RUNTIME="$SERVICES_DIR/node-runtime"
NODE_BIN="$NODE_RUNTIME/bin/node"
if [ -x "$NODE_BIN" ] && [ "$FORCE" != "--force" ]; then
  echo "node runtime exists: $($NODE_BIN --version), skipping"
  exit 0
fi

NODE_VER="$(node -p process.version)" # e.g. v22.14.0
PLATFORM_ARCH="$(node -e "console.log(process.platform + '-' + process.arch)")"
rm -rf "$NODE_RUNTIME"
mkdir -p "$NODE_RUNTIME/bin"
echo "downloading node $NODE_VER ($PLATFORM_ARCH)..."
curl -fsSL "https://nodejs.org/dist/$NODE_VER/node-$NODE_VER-$PLATFORM_ARCH.tar.gz" \
  | tar -xz -C "$NODE_RUNTIME" --strip-components=1 "node-$NODE_VER-$PLATFORM_ARCH/bin/node"
echo "node runtime installed: $NODE_BIN ($($NODE_BIN --version))"
