#!/usr/bin/env bash
# Build the macOS window-list helper (CGWindowList) used for window-edge
# detection in screenshot mode. Skips silently on non-macOS or when the
# Swift toolchain is missing.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$DIR/resources/windowlist/main.swift"
OUT="$DIR/resources/windowlist/windowlist"

if [ "$(uname -s)" != "Darwin" ]; then
  echo "windowlist: skipping (not macOS)"
  exit 0
fi
if ! command -v swiftc >/dev/null 2>&1; then
  echo "windowlist: swiftc not found, skipping (window detection unavailable)"
  exit 0
fi
swiftc -O "$SRC" -o "$OUT"
echo "windowlist: built $OUT"