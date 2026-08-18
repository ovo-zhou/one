import { join } from 'path'
import { BrowserWindow } from 'electron'
import { is } from '@electron-toolkit/utils'

/**
 * One persistent, frameless, always-on-top overlay window kept hidden with a
 * warm renderer, so triggering a screenshot only needs capture + show. The
 * window only deals with one display at a time and its scaleFactor, which
 * sidesteps mixed-DPI coordinate mapping entirely. Session payloads (frame,
 * geometry) arrive via the screenshotInit push channel.
 */

let overlayWindow: BrowserWindow | null = null
/** Bounds the post-show guard should assert (set per present, see manager). */
let expectedBounds: Electron.Rectangle | null = null
let closedHandler: (() => void) | null = null

/** Sets the handler invoked when the overlay window is destroyed externally. */
export function setOverlayClosedHandler(handler: () => void): void {
  closedHandler = handler
}

/** True if the given window is the screenshot overlay. */
export function isOverlayWindow(win: BrowserWindow): boolean {
  return win === overlayWindow
}

function loadOverlayPage(win: BrowserWindow): void {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/screenshot.html`)
  } else {
    void win.loadFile(join(__dirname, '../renderer/screenshot.html'))
  }
}

/**
 * Creates the overlay window once. At app start this pre-warms the renderer
 * (~300-600ms cold start saved on the first screenshot).
 */
export function ensureOverlayWindow(): BrowserWindow {
  if (overlayWindow && !overlayWindow.isDestroyed()) return overlayWindow
  const win = new BrowserWindow({
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    frame: false,
    hasShadow: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    // The overlay must be a passive full-screen surface: without these macOS
    // keeps invisible system resize zones at the edges/corners, so dragging
    // near a screen corner would move/resize the overlay instead of starting
    // a selection.
    resizable: false,
    movable: false,
    skipTaskbar: true,
    show: false,
    // Transparent overlay: it can be shown the instant a session starts —
    // the live desktop shows through until the renderer paints the frozen
    // frame, so there is no black flash and no perceived start delay.
    transparent: true,
    // Without this macOS clamps the frame into the visible work area on show
    // (below the menu bar / beside the Dock), misaligning the frozen frame.
    enableLargerThanScreen: process.platform === 'darwin',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  win.setFullScreen(false)
  // Exclude the overlay from screen capture. It is shown over the display
  // BEFORE the frame is captured (blank early show); without this the
  // capture composites the overlay itself — the whole frame comes back
  // black. Content protection removes the window from window-list captures;
  // the blank show additionally runs at opacity 0 (see manager) because
  // display-level SCStream captures still composite "protected" windows.
  win.setContentProtection(true)

  // macOS ignores bounds changes queued before the window's first show.
  // enableLargerThanScreen removes the work-area clamp; re-assert the expected
  // bounds once the window is on screen as a fallback and verify it sticks.
  win.on('show', () => {
    setTimeout(() => {
      if (win.isDestroyed()) return
      win.setAlwaysOnTop(true, 'screen-saver')
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
      const expected = expectedBounds
      if (!expected) return
      win.setBounds(expected)
      let tries = 0
      const timer = setInterval(() => {
        tries += 1
        if (win.isDestroyed()) {
          clearInterval(timer)
          return
        }
        const actual = win.getBounds()
        const aligned =
          actual.x === expected.x &&
          actual.y === expected.y &&
          actual.width === expected.width &&
          actual.height === expected.height
        if (aligned || tries >= 6) {
          clearInterval(timer)
          if (!aligned) {
            console.warn(
              `[screenshot] overlay bounds still off after ${tries} tries: got ` +
                `${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`
            )
          }
          return
        }
        win.setBounds(expected)
      }, 100)
    }, 50)
  })

  win.on('closed', () => {
    overlayWindow = null
    expectedBounds = null
    closedHandler?.()
  })

  loadOverlayPage(win)
  overlayWindow = win
  return win
}

/** Returns the live overlay window, or null when not created / destroyed. */
export function getOverlayWindow(): BrowserWindow | null {
  return overlayWindow && !overlayWindow.isDestroyed() ? overlayWindow : null
}

/** Destroys the overlay window (app quit / crashed renderer). */
export function destroyOverlayWindow(): void {
  const win = overlayWindow
  overlayWindow = null
  expectedBounds = null
  if (win && !win.isDestroyed()) {
    // Explicit destroy must not run the external-close recovery handler.
    win.removeAllListeners('closed')
    win.destroy()
  }
}

/**
 * Records the bounds the overlay should cover for the upcoming present and
 * applies them while hidden. The post-show guard re-asserts them.
 */
export function stageOverlayBounds(bounds: Electron.Rectangle): void {
  expectedBounds = { ...bounds }
  const win = getOverlayWindow()
  if (win) win.setBounds(expectedBounds)
}
