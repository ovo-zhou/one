import type { BrowserWindow, Display } from 'electron'
import { clipboard, dialog, nativeImage, screen, shell, systemPreferences } from 'electron'
import { IPC, type ScreenshotFinishPayload, type ScreenshotRect } from '../../shared/contracts'
import { getMainWindow } from '../window'
import { resetTccService, SCREEN_CAPTURE_SETTINGS_URL } from '../tcc'
import {
  captureOneDisplay,
  ensureScreenPermission,
  removeCapturedBuffer,
  type CapturedDisplay
} from './capture'
import {
  destroyOverlayWindow,
  ensureOverlayWindow,
  setOverlayClosedHandler,
  stageOverlayBounds
} from './overlay'
import { createPin } from './pin'
import { saveDataUrl } from './save'
import { ensureWindowDetect, startWindowDetect, topWindowAt, windowsNow } from './window-detect'

/**
 * Snipaste-style screenshot session.
 *
 * The overlay only exists on the display currently under the cursor. While
 * the user moves the cursor without interacting, the main process polls the
 * cursor (40ms) and lazily captures + swaps the overlay once the cursor has
 * dwelled on a new display for a few ticks. A selection interaction
 * (pointerdown) locks the session to the current display via
 * {@link setScreenshotSelectionActive}.
 *
 * Window geometry comes from the Swift CGWindowList helper; the window under
 * the cursor is broadcast as a highlight rect, and all window edges are
 * broadcast for edge snapping in the renderer.
 */

type Phase = 'idle' | 'starting' | 'live' | 'editing'

const POLL_MS = 40
/** Cursor must dwell on a new display this long before swapping the overlay. */
const SWITCH_DWELL_MS = 80
/** Upper bound for waiting on the warm renderer's first page load. */
const LOAD_TIMEOUT_MS = 1500

let phase: Phase = 'idle'
let overlay: BrowserWindow | null = null
let captured: CapturedDisplay | null = null
let currentDisplayId: number | null = null
let capturing = false
let pollTimer: NodeJS.Timeout | null = null
let pendingSwitch: { displayId: number; since: number } | null = null
let lastHighlightSig: string | null = null
let lastWindowsSig: string | null = null
let lastCursorPoint: { x: number; y: number } | null = null
let mainWindow: BrowserWindow | null = null
const sessionIds = new Set<string>()

/** Generation counter to ignore stale presents (session torn down mid-flight). */
let presentGen = 0

/**
 * Called via IPC when the overlay renderer has decoded the frame and painted
 * its first frame. The transparent overlay is already shown at that point
 * (show no longer waits for the handshake), so this is diagnostics only.
 */
export function notifyOverlayReady(): void {
  // no-op: kept for IPC compatibility with the renderer preload API.
}

// If the overlay window is closed externally (e.g. Cmd+W) mid-session, tear
// the session down so the hidden main window is restored.
setOverlayClosedHandler(() => {
  overlay = null
  if (phase !== 'idle') void teardown()
})

/**
 * Repair dialog for stale screen-capture grants: System Settings shows the
 * app checked, but the ad-hoc re-signed binary no longer matches the stored
 * grant. Reset via tccutil, then the user re-checks and restarts the app
 * (screen capture grants only apply to freshly started processes).
 */
async function showScreenCaptureRepairDialog(detail: string): Promise<void> {
  const { response } = await dialog.showMessageBox({
    type: 'warning',
    message: '需要「屏幕录制」权限',
    detail:
      `${detail}\n\n` +
      '若系统设置中已勾选本应用仍失败（应用更新后常见），说明旧版本的授权已失效：' +
      '请点击「重置后重新授权」，在系统设置中重新勾选，然后重启本应用。',
    buttons: ['打开系统设置', '重置后重新授权', '取消'],
    defaultId: 0,
    cancelId: 2
  })
  if (response === 0) {
    void shell.openExternal(SCREEN_CAPTURE_SETTINGS_URL)
  } else if (response === 1) {
    resetTccService('ScreenCapture')
    void shell.openExternal(SCREEN_CAPTURE_SETTINGS_URL)
  }
}

/** Starts a screenshot session. Returns false if one is already active. */
export function startScreenshot(): boolean {
  if (phase !== 'idle') return false
  const t0 = Date.now()
  phase = 'starting'
  void (async () => {
    try {
      if (phase !== 'starting') return
      if (!(await ensureWindowDetect())) {
        console.warn('[screenshot] window detection unavailable - edge snapping disabled')
      }
      if (phase !== 'starting') return
      mainWindow = getMainWindow()
      mainWindow?.hide()
      startWindowDetect()
      phase = 'live'
      // Blank early show: the overlay (opacity 0, crosshair cursor) appears
      // immediately over the live desktop; the frozen frame replaces the
      // view once decoded.
      const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
      currentDisplayId = display.id
      await presentOverlay(display, null)
      console.log(`[screenshot] session visible in ${Date.now() - t0}ms`)
      // Permission gate AFTER the show (the raw query costs up to ~1.3s
      // when the TCC session is cold — it must not delay the crosshair)
      // but strictly BEFORE any capture. On failure the session is torn
      // down FIRST so the guide dialog is never trapped under the
      // always-on-top overlay; the user re-triggers after granting.
      if (
        process.platform === 'darwin' &&
        systemPreferences.getMediaAccessStatus('screen') !== 'granted'
      ) {
        await teardown()
        await ensureScreenPermission()
        return
      }
      if (phase === 'live') {
        pollTimer = setInterval(() => {
          void updateForCursor()
        }, POLL_MS)
      }
      await switchToDisplay(display)
    } catch (err) {
      console.error('[screenshot] failed to start:', err)
      await teardown()
      const message = err instanceof Error ? err.message : String(err)
      // Permission failures (empty or all-black capture) get the repair
      // dialog: stale grants are expected after every ad-hoc re-sign.
      if (message.includes('屏幕录制') && process.platform === 'darwin') {
        await showScreenCaptureRepairDialog(message)
      } else {
        dialog.showErrorBox('截图', `启动截图失败：\n${message}`)
      }
    }
  })()
  return true
}

/** One poll tick: follows the cursor and broadcasts highlight / edges. */
async function updateForCursor(): Promise<void> {
  if (phase === 'idle' || phase === 'starting' || phase === 'editing' || capturing) return
  const cursorPoint = screen.getCursorScreenPoint()
  // Skip redundant work if cursor hasn't moved since last tick.
  if (
    lastCursorPoint &&
    cursorPoint.x === lastCursorPoint.x &&
    cursorPoint.y === lastCursorPoint.y
  ) {
    return
  }
  lastCursorPoint = cursorPoint
  const display = screen.getDisplayNearestPoint(cursorPoint)
  if (display.id !== currentDisplayId) {
    const now = Date.now()
    if (pendingSwitch && pendingSwitch.displayId === display.id) {
      if (now - pendingSwitch.since >= SWITCH_DWELL_MS) {
        pendingSwitch = null
        await switchToDisplay(display)
      }
    } else if (!pendingSwitch) {
      pendingSwitch = { displayId: display.id, since: now }
    }
    return
  }
  pendingSwitch = null
  maybeBroadcastHighlight(display, cursorPoint)
  maybeBroadcastWindows(display)
}

/**
 * Repositions the persistent overlay onto the target display, pushes the
 * init payload (blank or with a frozen frame) and shows it. The window is
 * transparent, so showing is instant: the live desktop (blank) or the
 * previous frozen frame (display switch) shows through until the renderer
 * paints the new frame.
 */
async function presentOverlay(display: Display, shot: CapturedDisplay | null): Promise<void> {
  const gen = ++presentGen
  let win = ensureOverlayWindow()
  if (win.webContents.isCrashed()) {
    destroyOverlayWindow()
    win = ensureOverlayWindow()
  }
  // The warm renderer may still be loading during the first seconds after
  // app launch; wait briefly so the init push is not lost.
  if (win.webContents.isLoading()) {
    await new Promise<void>((resolve) => {
      const done = (): void => {
        clearTimeout(timer)
        win.webContents.removeListener('did-finish-load', done)
        resolve()
      }
      const timer = setTimeout(done, LOAD_TIMEOUT_MS)
      win.webContents.once('did-finish-load', done)
    })
    if (gen !== presentGen) return
  }

  // shot === null: blank early show. The overlay runs at opacity 0 — a
  // fully transparent Electron surface still composites as a black rectangle
  // into SCStream display captures, but alphaValue 0 removes the window's
  // contribution entirely (while input + the crosshair CSS cursor still
  // work). The frozen-frame present below restores opacity 1.
  //
  // Re-presents NEVER hide() an already visible overlay: hiding the key
  // window while no other window is visible deactivates the app on macOS,
  // and the follow-up focus() does not reliably restore key status — the
  // renderer then stops receiving keyboard events (Esc could not close the
  // session). Opacity 0 blanks the window without unmapping it, so focus
  // is preserved across the swap.
  const bounds = shot ? shot.bounds : display.bounds
  const wasVisible = win.isVisible()
  if (wasVisible) win.setOpacity(0)
  stageOverlayBounds(bounds)

  overlay = win
  win.setOpacity(shot ? 1 : 0)
  win.webContents.send(IPC.screenshotInit, {
    displayId: shot ? shot.index : display.id,
    imageId: shot ? shot.id : null,
    width: bounds.width,
    height: bounds.height,
    scaleFactor: shot ? shot.scaleFactor : display.scaleFactor
  })
  if (gen !== presentGen || win.isDestroyed()) return
  win.setAlwaysOnTop(true, 'screen-saver')
  if (!wasVisible) {
    win.show()
    win.focus()
  } else if (!win.isFocused()) {
    win.focus()
  }
}

/** Captures the display and presents the overlay on it (window is reused). */
async function switchToDisplay(display: Display): Promise<void> {
  if (capturing || phase !== 'live') return
  capturing = true
  const startedAt = Date.now()
  try {
    const shot = await captureOneDisplay(display)
    if (phase !== 'live') {
      // Session was cancelled while capturing.
      removeCapturedBuffer(shot.id)
      return
    }
    const prev = captured
    sessionIds.add(shot.id)
    captured = shot
    currentDisplayId = display.id
    lastHighlightSig = null
    lastWindowsSig = null
    lastCursorPoint = null
    await presentOverlay(display, shot)
    console.log(`[screenshot] frozen frame presented in ${Date.now() - startedAt}ms`)
    if (phase !== 'live') return
    if (prev && prev.id !== shot.id) {
      sessionIds.delete(prev.id)
      removeCapturedBuffer(prev.id)
    }
    // Broadcast immediately: the highlight must be visible the instant the
    // frozen frame appears, without waiting for cursor movement.
    maybeBroadcastWindows(display)
    maybeBroadcastHighlight(display, screen.getCursorScreenPoint())
  } finally {
    capturing = false
  }
}

function maybeBroadcastHighlight(display: Display, cursorPoint: { x: number; y: number }): void {
  if (!overlay || overlay.isDestroyed()) return
  const hit = topWindowAt(cursorPoint)
  let rect: ScreenshotRect | null = null
  if (hit) {
    const db = display.bounds
    const ix = Math.max(hit.bounds.x, db.x)
    const iy = Math.max(hit.bounds.y, db.y)
    const iw = Math.min(hit.bounds.x + hit.bounds.w, db.x + db.width) - ix
    const ih = Math.min(hit.bounds.y + hit.bounds.h, db.y + db.height) - iy
    if (iw > 0 && ih > 0) rect = { x: ix - db.x, y: iy - db.y, w: iw, h: ih }
  }
  const sig = rect ? `${rect.x}|${rect.y}|${rect.w}|${rect.h}` : 'null'
  if (sig !== lastHighlightSig) {
    lastHighlightSig = sig
    overlay.webContents.send(IPC.screenshotWindowHighlight, rect)
  }
}

function maybeBroadcastWindows(display: Display): void {
  if (!overlay || overlay.isDestroyed()) return
  const db = display.bounds
  const rects: ScreenshotRect[] = []
  for (const w of windowsNow()) {
    if (w.pid === process.pid) continue
    const ix = Math.max(w.bounds.x, db.x)
    const iy = Math.max(w.bounds.y, db.y)
    const iw = Math.min(w.bounds.x + w.bounds.w, db.x + db.width) - ix
    const ih = Math.min(w.bounds.y + w.bounds.h, db.y + db.height) - iy
    if (iw > 0 && ih > 0) rects.push({ x: ix - db.x, y: iy - db.y, w: iw, h: ih })
  }
  const sig = rects.map((r) => `${r.x}|${r.y}|${r.w}|${r.h}`).join('~')
  if (sig !== lastWindowsSig) {
    lastWindowsSig = sig
    overlay.webContents.send(IPC.screenshotWindows, { displayId: display.id, rects })
  }
}

/**
 * Locks/unlocks cursor-following. The overlay calls this with `true` on
 * pointerdown (an interaction started) and `false` when the interaction
 * ended without producing a selection.
 */
export function setScreenshotSelectionActive(active: boolean): void {
  if (active && phase === 'live') {
    phase = 'editing'
    pendingSwitch = null
  } else if (!active && phase === 'editing') {
    phase = 'live'
  }
}

async function teardown(): Promise<void> {
  if (phase === 'idle') return
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  // The window-detect helper stays resident across sessions (spawned once at
  // app start) so the next screenshot starts with a warm window cache.
  pendingSwitch = null
  presentGen++
  // Hide (keep) the overlay for the next session; its renderer stays warm.
  const win = overlay
  overlay = null
  captured = null
  currentDisplayId = null
  lastHighlightSig = null
  lastWindowsSig = null
  lastCursorPoint = null
  if (win && !win.isDestroyed() && win.isVisible()) win.hide()
  for (const id of sessionIds) removeCapturedBuffer(id)
  sessionIds.clear()
  phase = 'idle'
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show()
    mainWindow.focus()
  }
  mainWindow = null
}

export async function cancelScreenshot(): Promise<void> {
  if (phase !== 'idle') {
    await teardown()
    console.log('[screenshot] session cancelled (Esc)')
  }
}

export async function finishScreenshot(payload: ScreenshotFinishPayload): Promise<void> {
  if (phase === 'idle') return
  // Close overlays first so dialogs / pins don't appear over a black screen.
  await teardown()

  // copy/pin receive PNG data URLs, which NativeImage can decode.
  const imageFromPayload = (): Electron.NativeImage => {
    const image = nativeImage.createFromDataURL(payload.dataUrl)
    if (image.isEmpty()) throw new Error('empty image')
    return image
  }

  try {
    switch (payload.mode) {
      case 'copy':
        clipboard.writeImage(imageFromPayload())
        break
      case 'save':
        // Write the renderer-encoded bytes directly (supports WebP).
        await saveDataUrl(payload.dataUrl)
        break
      case 'pin':
        await createPin(imageFromPayload(), payload.width, payload.height)
        break
    }
  } catch (err) {
    console.error('[screenshot] finish failed:', err)
    dialog.showErrorBox('截图', `处理截图失败：${err instanceof Error ? err.message : String(err)}`)
  }
}
