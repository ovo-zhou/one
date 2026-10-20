/** Runs with system bash, outside the bundle that it replaces. Arguments are
 * passed separately by spawn; paths must never be interpolated into shell code. */
export const UPDATE_INSTALLER_SCRIPT = String.raw`#!/bin/bash
set -eu
APP_PATH="$1"
STAGING="$2"
PARENT_PID="$3"
STAGED_APP="$STAGING/Faceless.app"
BACKUP="$STAGING/previous.app"
KEEP_BACKUP=0

cleanup() {
  if [ "$KEEP_BACKUP" = 0 ]; then
    /bin/rm -rf "$STAGING" || true
  fi
}
trap cleanup EXIT

fail() {
  echo "$1" >&2
  /usr/bin/osascript -e 'display alert "Faceless 更新失败" message "旧版已保留。请重新打开应用，或从 GitHub 发布页手动安装。"' || true
  exit 1
}

# Handshake: the app must see this before it starts quitting.
: > "$STAGING/ready"
for ((i=0; i<60; i++)); do
  [ -f "$STAGING/install" ] && break
  /bin/sleep 1
done
[ -f "$STAGING/install" ] || exit 1

exited=0
for ((i=0; i<60; i++)); do
  if ! kill -0 "$PARENT_PID" 2>/dev/null; then
    # Service processes and Electron helpers may outlive the main process.
    # Wait for bundle executables as well; never kill unrelated processes.
    if commands=$(/bin/ps -ww -axo comm=); then
      if ! /usr/bin/awk -v prefix="$APP_PATH/Contents/" 'index($0, prefix) == 1 { found=1 } END { exit !found }' <<< "$commands"; then
        exited=1
        break
      fi
    fi
  fi
  /bin/sleep 1
done
[ "$exited" = 1 ] || fail "应用进程未完全退出，取消替换。"

# Preserve the old app until both the swap and the launch request succeed.
/bin/mv "$APP_PATH" "$BACKUP" || fail "无法备份旧版应用。"
KEEP_BACKUP=1
if ! /bin/mv "$STAGED_APP" "$APP_PATH"; then
  if /bin/mv "$BACKUP" "$APP_PATH"; then
    KEEP_BACKUP=0
    /usr/bin/open -n "$APP_PATH" || true
  fi
  fail "替换失败；恢复副本位置：$BACKUP"
fi
if ! /usr/bin/open -n "$APP_PATH" --args "--faceless-update-ready=$STAGING"; then
  if /bin/mv "$APP_PATH" "$STAGED_APP" && /bin/mv "$BACKUP" "$APP_PATH"; then
    KEEP_BACKUP=0
    /usr/bin/open -n "$APP_PATH" || true
  fi
  fail "启动新版失败；恢复副本位置：$BACKUP"
fi
# Opening via Launch Services only confirms the request was accepted. Keep the
# recovery copy until the new main window confirms that its page loaded.
for ((i=0; i<60; i++)); do
  if [ -f "$STAGING/launched" ]; then
    KEEP_BACKUP=0
    echo "安装完成，新版窗口已加载。"
    exit 0
  fi
  /bin/sleep 1
done
# The new app may still be running: do not replace it or delete its backup.
fail "未收到新版启动确认；恢复副本保留在：$BACKUP"
`
