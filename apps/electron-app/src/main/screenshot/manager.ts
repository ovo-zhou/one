import type { BrowserWindow, Display } from 'electron'
import { clipboard, dialog, nativeImage, screen } from 'electron'
import { IPC, type ScreenshotFinishPayload, type ScreenshotRect } from '../../shared/contracts'
import { getMainWindow } from '../window'
import {
  captureOneDisplay,
  ensureScreenPermission,
  removeCapturedBuffer,
  type CapturedDisplay
} from './capture'
import { createOverlayWindow } from './overlay'
import { createPin } from './pin'
import { saveNativeImage } from './save'
import {
  ensureWindowDetect,
  startWindowDetect,
  stopWindowDetect,
  topWindowAt,
  windowsNow
} from './window-detect'

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

/** Starts a screenshot session. Returns false if one is already active. */
export function startScreenshot(): boolean {
  if (phase !== 'idle') return false
  phase = 'starting'
  void (async () => {
    try {
      if (!(await ensureScreenPermission())) {
        phase = 'idle'
        return
      }
      if (phase !== 'starting') return
      if (!(await ensureWindowDetect())) {
        console.warn('[screenshot] window detection unavailable - edge snapping disabled')
      }
      if (phase !== 'starting') return
      mainWindow = getMainWindow()
      mainWindow?.hide()
      startWindowDetect()
      phase = 'live'
      await updateForCursor(true)
      if (phase === 'live') {
        pollTimer = setInterval(() => {
          void updateForCursor(false)
        }, POLL_MS)
      }
    } catch (err) {
      console.error('[screenshot] failed to start:', err)
      await teardown()
      const message = err instanceof Error ? err.message : String(err)
      dialog.showErrorBox('截图', `启动截图失败：\n${message}`)
    }
  })()
  return true
}

/** One poll tick: follows the cursor and broadcasts highlight / edges. */
async function updateForCursor(initial: boolean): Promise<void> {
  if (phase === 'idle' || phase === 'starting' || phase === 'editing' || capturing) return
  const cursorPoint = screen.getCursorScreenPoint()
  // Skip redundant work if cursor hasn't moved since last tick.
  if (
    !initial &&
    lastCursorPoint &&
    cursorPoint.x === lastCursorPoint.x &&
    cursorPoint.y === lastCursorPoint.y
  ) {
    return
  }
  lastCursorPoint = cursorPoint
  const display = screen.getDisplayNearestPoint(cursorPoint)
  if (display.id !== currentDisplayId) {
    if (initial) {
      await switchToDisplay(display)
      return
    }
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

/** Captures the display and replaces the overlay window. */
async function switchToDisplay(display: Display): Promise<void> {
  if (capturing || phase !== 'live') return
  capturing = true
  try {
    await destroyOverlay()
    const shot = await captureOneDisplay(display)
    if (phase !== 'live') {
      // Session was cancelled while capturing.
      removeCapturedBuffer(shot.id)
      return
    }
    sessionIds.add(shot.id)
    captured = shot
    currentDisplayId = display.id
    lastHighlightSig = null
    lastWindowsSig = null
    const win = createOverlayWindow(shot)
    overlay = win
    win.once('closed', () => {
      if (overlay === win && (phase === 'live' || phase === 'editing')) void teardown()
    })
    maybeBroadcastWindows(display)
  } finally {
    capturing = false
  }
}

async function destroyOverlay(): Promise<void> {
  const win = overlay
  const old = captured
  overlay = null
  captured = null
  currentDisplayId = null
  pendingSwitch = null
  lastHighlightSig = null
  lastWindowsSig = null
  lastCursorPoint = null
  if (win && !win.isDestroyed()) win.destroy()
  if (old) removeCapturedBuffer(old.id)
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
  stopWindowDetect()
  pendingSwitch = null
  await destroyOverlay()
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
  if (phase !== 'idle') await teardown()
}

export async function finishScreenshot(payload: ScreenshotFinishPayload): Promise<void> {
  if (phase === 'idle') return
  // Close overlays first so dialogs / pins don't appear over a black screen.
  await teardown()

  let image: Electron.NativeImage | null = null
  try {
    image = nativeImage.createFromDataURL(payload.dataUrl)
    if (image.isEmpty()) throw new Error('empty image')
  } catch {
    dialog.showErrorBox('截图', '生成截图内容失败')
    return
  }

  try {
    switch (payload.mode) {
      case 'copy':
        clipboard.writeImage(image)
        break
      case 'save':
        await saveNativeImage(image)
        break
      case 'pin':
        await createPin(image, payload.width, payload.height)
        break
    }
  } catch (err) {
    console.error('[screenshot] finish failed:', err)
    dialog.showErrorBox('截图', `处理截图失败：${err instanceof Error ? err.message : String(err)}`)
  }
}
