#!/usr/bin/env bash
# Build the macOS selection watcher (AX API) used by selection-translate.
# Skips silently on non-macOS or when the Swift toolchain is missing.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$DIR/resources/selectionwatch/selectionwatch.swift"
OUT="$DIR/resources/selectionwatch/selectionwatch"

if [ "$(uname -s)" != "Darwin" ]; then
  echo "selectionwatch: skipping (not macOS)"
  exit 0
fi
if ! command -v swiftc >/dev/null 2>&1; then
  echo "selectionwatch: swiftc not found, skipping (selection translate unavailable)"
  exit 0
fi
swiftc -O "$SRC" -o "$OUT"
echo "selectionwatch: built $OUT"
