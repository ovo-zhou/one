import { join } from 'path'
import { BrowserWindow, screen } from 'electron'
import { is } from '@electron-toolkit/utils'
import type { CapturedDisplay } from './capture'

/**
 * One fullscreen, frameless, always-on-top window for the display currently
 * under the cursor. The window only deals with its own display and
 * scaleFactor, which sidesteps mixed-DPI coordinate mapping entirely.
 */
export function createOverlayWindow(captured: CapturedDisplay): BrowserWindow {
  const bounds = captured.bounds
  const expected = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height
  }
  const win = new BrowserWindow({
    ...expected,
    frame: false,
    hasShadow: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#000000',
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

  const query: Record<string, string> = {
    display: String(captured.index),
    sf: String(captured.scaleFactor),
    w: String(bounds.width),
    h: String(bounds.height),
    id: captured.id
  }

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const url = new URL(`${process.env['ELECTRON_RENDERER_URL']}/screenshot.html`)
    url.search = new URLSearchParams(query).toString()
    void win.loadURL(url.toString())
  } else {
    void win.loadFile(join(__dirname, '../renderer/screenshot.html'), { query })
  }

  win.once('ready-to-show', () => {
    win.show()
    win.focus()
  })

  // macOS ignores bounds changes queued before the window's first show and
  // can clamp the window into the visible frame (below the menu bar / next
  // to the Dock). Re-assert the full bounds once the window is on screen and
  // keep re-applying until it sticks.
  win.once('show', () => {
    setTimeout(() => {
      if (win.isDestroyed()) return
      win.setAlwaysOnTop(true, 'screen-saver')
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
      win.setBounds(expected)
      let tries = 0
      const timer = setInterval(() => {
        tries += 1
        if (win.isDestroyed()) {
          clearInterval(timer)
          return
        }
        const actual = win.getBounds()
        if ((actual.x === expected.x && actual.y === expected.y) || tries >= 6) {
          clearInterval(timer)
          if (actual.x !== expected.x || actual.y !== expected.y) {
            const nearest = screen.getDisplayNearestPoint({ x: actual.x, y: actual.y })
            console.warn(
              `[screenshot] overlay bounds still off after ${tries} tries: got ` +
                `${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}, ` +
                `nearest display ${nearest.id} workArea=${JSON.stringify(nearest.workArea)}`
            )
          }
          return
        }
        win.setBounds(expected)
      }, 100)
    }, 50)
  })

  return win
}
