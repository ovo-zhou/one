import { join } from 'path'
import { BrowserWindow, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

export const APP_ID = 'com.one.faceless'
export const APP_NAME = 'Faceless'

let mainWindow: BrowserWindow | null = null

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

function isLoopbackUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:') return false
    if (url.hostname === 'localhost' || url.hostname === '[::1]') return true
    const parts = url.hostname.split('.')
    return (
      parts.length === 4 &&
      parts[0] === '127' &&
      parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
    )
  } catch {
    return false
  }
}

export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 720,
    minHeight: 480,
    show: false,
    title: APP_NAME,
    // Use the bundled mark for the development window and non-macOS desktop
    // integrations. Packaged macOS builds use build/icon.icns via electron-builder.
    icon,
    autoHideMenuBar: true,
    // mac: hide the native title but keep traffic lights; the renderer draws
    // its own draggable title bar (see shell/TitleBar.tsx). Traffic lights
    // are 12px tall; y=12 centers them in the 36px custom bar.
    ...(process.platform === 'darwin'
      ? {
          titleBarStyle: 'hiddenInset' as const,
          trafficLightPosition: { x: 16, y: 12 }
        }
      : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    }
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })

  // Open external links in the system browser instead of new Electron windows.
  win.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // DSH is embedded as a webview so its Strict browser-auth cookie can be
  // established in the guest's own top-level context. Never let a guest carry
  // a preload or Node privileges, and accept only its local HTTP origin.
  win.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    if (!isLoopbackUrl(params.src)) {
      event.preventDefault()
      return
    }
    delete webPreferences.preload
    webPreferences.nodeIntegration = false
    webPreferences.contextIsolation = true
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow = win
  return win
}
