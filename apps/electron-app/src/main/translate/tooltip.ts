import { join } from 'path'
import { BrowserWindow, screen } from 'electron'
import { is } from '@electron-toolkit/utils'
import { IPC, type TranslateSelectionPayload } from '../../shared/contracts'

/**
 * Persistent hidden frameless window used as the selection-translate tooltip.
 * Same warm-renderer trick as the screenshot overlay: created once, kept
 * alive, content swapped via IPC pushes, resized between "pill" and "card"
 * modes by the renderer (translate:resize).
 */

let tooltipWindow: BrowserWindow | null = null

export function isTranslateTooltipWindow(win: BrowserWindow): boolean {
  return win === tooltipWindow
}

function loadTooltipPage(win: BrowserWindow): void {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/translate.html`)
  } else {
    void win.loadFile(join(__dirname, '../renderer/translate.html'))
  }
}

/** Creates the tooltip window once (call at app start to pre-warm). */
export function ensureTooltipWindow(): BrowserWindow {
  if (tooltipWindow && !tooltipWindow.isDestroyed()) return tooltipWindow
  const win = new BrowserWindow({
    width: 120,
    height: 40,
    frame: false,
    hasShadow: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#00000000',
    transparent: true,
    useContentSize: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  win.setAlwaysOnTop(true, 'floating')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  win.setFullScreen(false)

  // Tooltip must not appear in Mission Control / app switcher.
  win.setSkipTaskbar(true)

  win.on('closed', () => {
    tooltipWindow = null
  })

  loadTooltipPage(win)
  tooltipWindow = win
  return win
}

export function getTooltipWindow(): BrowserWindow | null {
  return tooltipWindow && !tooltipWindow.isDestroyed() ? tooltipWindow : null
}

/** Destroys the tooltip window (app quit). */
export function destroyTooltipWindow(): void {
  const win = tooltipWindow
  tooltipWindow = null
  if (win && !win.isDestroyed()) {
    win.removeAllListeners('closed')
    win.destroy()
  }
}

/**
 * Positions the tooltip next to the selection anchor and pushes the pill
 * payload. Shown with showInactive() so the source app keeps focus while
 * the pill is up (clicking the pill focuses the window naturally).
 */
export function presentTooltip(
  payload: TranslateSelectionPayload,
  size: { width: number; height: number }
): void {
  const win = getTooltipWindow()
  if (!win) return
  if (win.webContents.isLoading()) return
  const { x, y } = clampToWorkArea(payload.x, payload.y, size)
  if (win.isVisible()) win.hide()
  win.setBounds({ x, y, width: size.width, height: size.height }, false)
  win.webContents.send(IPC.translateSelection, payload)
  win.showInactive()
}

export function hideTooltip(): void {
  const win = getTooltipWindow()
  if (win && win.isVisible()) win.hide()
}

export function focusTooltip(): void {
  const win = getTooltipWindow()
  if (win && win.isVisible()) win.focus()
}

/** Renderer-measured content resize (pill ⇄ card transitions). */
export function resizeTooltip(width: number, height: number): void {
  const win = getTooltipWindow()
  if (!win) return
  const b = win.getBounds()
  const { x, y } = clampToWorkArea(b.x, b.y, { width, height })
  win.setBounds({ x, y, width: Math.round(width), height: Math.round(height) }, false)
}

/** Keeps the tooltip inside the display work area (flip above on overflow). */
function clampToWorkArea(
  x: number,
  y: number,
  size: { width: number; height: number }
): { x: number; y: number } {
  const area = screen.getDisplayNearestPoint({ x: Math.round(x), y: Math.round(y) }).workArea
  // Position below-right of the anchor; flip above when it would overflow.
  let px = Math.round(x)
  let py = Math.round(y + 8)
  if (px < area.x) px = area.x
  if (px + size.width > area.x + area.width) px = area.x + area.width - size.width
  if (py + size.height > area.y + area.height) {
    // No room below: place the top-left anchor ~24px above the anchor point.
    py = Math.round(y - size.height - 24)
  }
  if (py < area.y) py = area.y
  return { x: px, y: py }
}
