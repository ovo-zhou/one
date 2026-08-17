import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { registerIpcHandlers, stopAllServices } from './ipc'
import { setupMenu } from './menu'
import { setupAutoCheck } from './updater'
import { disableProxyIfOwned } from './whistle-actions'
import { APP_ID, APP_NAME, createMainWindow } from './window'

// Ensure a single app instance; focus the existing window on relaunch.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  void app.whenReady().then(() => {
    electronApp.setAppUserModelId(APP_ID)
    // Show the real product name in the menu bar / about dialog in dev mode.
    app.setName(APP_NAME)

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    registerIpcHandlers()
    setupMenu()
    setupAutoCheck()
    createMainWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

let quitting = false

app.on('before-quit', (event) => {
  // Disable the system proxy first if we own it, then stop services (once).
  if (quitting) return
  quitting = true
  event.preventDefault()
  void disableProxyIfOwned().finally(() => {
    stopAllServices()
    app.exit()
  })
})
