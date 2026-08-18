#!/bin/bash

set -euo pipefail

REPO="ovo-zhou/one"
APP_NAME="All in One"
APP_BUNDLE="${APP_NAME}.app"
INSTALL_DIR="/Applications"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ---------- pre-flight ----------

if [[ "$(uname -s)" != "Darwin" ]]; then
  error "This script only supports macOS."
  exit 1
fi

ARCH="$(uname -m)"
case "$ARCH" in
  arm64)  DMG_ARCH="arm64" ;;
  x86_64) DMG_ARCH="x64" ;;
  *)      error "Unsupported architecture: $ARCH"; exit 1 ;;
esac

info "Detected architecture: ${ARCH} → DMG variant: ${DMG_ARCH}"

# ---------- fetch latest release ----------

info "Fetching latest release from GitHub..."

RELEASE_JSON=""
if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
  RELEASE_JSON="$(gh api "repos/${REPO}/releases/latest" 2>/dev/null)" || true
fi

if [[ -z "$RELEASE_JSON" ]]; then
  RELEASE_JSON="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" 2>/dev/null)" || true
fi

if [[ -z "$RELEASE_JSON" ]] || echo "$RELEASE_JSON" | grep -q '"Not Found"'; then
  error "No release found for ${REPO}."
  echo ""
  error "Releases may not be published yet."
  error "You can also download the DMG manually from:"
  error "  https://github.com/${REPO}/releases"
  exit 1
fi

VERSION="$(echo "$RELEASE_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['tag_name'].lstrip('v'))" 2>/dev/null)" || true
if [[ -z "$VERSION" ]]; then
  error "Could not determine latest version from GitHub API response."
  exit 1
fi

DMG_FILENAME="all-in-one-${VERSION}-${DMG_ARCH}.dmg"
DMG_URL="https://github.com/${REPO}/releases/download/v${VERSION}/${DMG_FILENAME}"

info "Latest version: ${VERSION}"
info "Download URL:   ${DMG_URL}"

# ---------- download ----------

TMP_DIR="$(mktemp -d)"
DMG_PATH="${TMP_DIR}/${DMG_FILENAME}"
trap 'rm -rf "${TMP_DIR}"' EXIT

echo ""
info "Downloading ${DMG_FILENAME} …"

if ! curl -# -L -o "${DMG_PATH}" "${DMG_URL}"; then
  error "Download failed. Check your network connection."
  error "Or download manually from: https://github.com/${REPO}/releases"
  exit 1
fi

if [[ ! -s "${DMG_PATH}" ]]; then
  error "Downloaded file is empty."
  exit 1
fi

# ---------- mount ----------

info "Mounting DMG…"
MOUNT_POINT="$(hdiutil attach "${DMG_PATH}" -nobrowse -quiet 2>&1 \
  | grep -m1 '/Volumes/' \
  | sed 's|.* /Volumes/||;s| *$||')"

if [[ -z "${MOUNT_POINT}" ]]; then
  error "Failed to mount DMG."
  exit 1
fi

APP_SRC="/Volumes/${MOUNT_POINT}/${APP_BUNDLE}"

if [[ ! -d "${APP_SRC}" ]]; then
  error "App not found inside DMG: ${APP_SRC}"
  hdiutil detach "/Volumes/${MOUNT_POINT}" -quiet 2>/dev/null || true
  exit 1
fi

# ---------- install ----------

info "Installing ${APP_BUNDLE} → ${INSTALL_DIR}/"

if [[ -d "${INSTALL_DIR}/${APP_BUNDLE}" ]]; then
  warn "Existing ${APP_BUNDLE} found. Removing…"
  rm -rf "${INSTALL_DIR}/${APP_BUNDLE}"
fi

cp -R "${APP_SRC}" "${INSTALL_DIR}/${APP_BUNDLE}"

# ---------- cleanup ----------

hdiutil detach "/Volumes/${MOUNT_POINT}" -quiet 2>/dev/null || true

echo ""
info "Done! ${APP_NAME} has been installed to ${INSTALL_DIR}/"
info "You can launch it from Spotlight, Launchpad, or:"
info "  open \"${INSTALL_DIR}/${APP_BUNDLE}\""
