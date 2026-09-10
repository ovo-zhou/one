import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { registerIpcHandlers, stopAllServices } from './ipc'
import { setupMenu } from './menu'
import { cleanupStaleBackups, setupAutoCheck } from './updater'
import { disableProxyIfOwned } from './whistle-actions'
import { APP_ID, APP_NAME, createMainWindow } from './window'
import { applyScreenshotShortcut, unregisterScreenshotShortcut } from './screenshot/shortcut'
import { stopWindowDetect, warmWindowDetect } from './screenshot/window-detect'
import { warmScreenPermissionStatus } from './screenshot/capture'
import { cleanupPinImages, closeAllPins } from './screenshot/pin'
import { destroyOverlayWindow, ensureOverlayWindow, isOverlayWindow } from './screenshot/overlay'
import { applyTranslateShortcut, unregisterTranslateShortcut } from './translate/shortcut'
import { setupTranslate, teardownTranslate } from './translate/manager'
import {
  destroyTooltipWindow,
  ensureTooltipWindow,
  isTranslateTooltipWindow
} from './translate/tooltip'
import { getPrefs } from './prefs'

// Ensure a single app instance; focus the existing window on relaunch.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // Never focus the (persistent, hidden) screenshot overlay or translate
    // tooltip windows.
    const win = BrowserWindow.getAllWindows().find(
      (w) => !isOverlayWindow(w) && !isTranslateTooltipWindow(w)
    )
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

    void applyScreenshotShortcut(getPrefs().screenshot.shortcut)
    if (getPrefs().translate.enabled) {
      void applyTranslateShortcut(getPrefs().translate.shortcut)
    }
    void setupTranslate()
    registerIpcHandlers()
    setupMenu()
    setupAutoCheck()
    createMainWindow()

    // Clear any .old-<timestamp> bundle left by a previous in-app update.
    void cleanupStaleBackups()
    // Retry shortly after, in case the previous app instance was still alive
    // (relaunch overlap) and blocked the first pass.
    setTimeout(() => void cleanupStaleBackups(), 5_000)

    // Start screenshot-specific warm-up on the next turn instead of waiting
    // a full second: an early shortcut now has a ready overlay and a running
    // window helper. Keep the TCC query delayed so it cannot make app launch
    // feel slower; its result is cached for all screenshot sessions.
    setTimeout(() => {
      if (!quitting) {
        ensureOverlayWindow()
        void warmWindowDetect()
      }
    }, 0)
    setTimeout(() => {
      if (!quitting) warmScreenPermissionStatus()
    }, 1000)
    setTimeout(() => {
      if (!quitting) ensureTooltipWindow()
    }, 1500)

    app.on('activate', () => {
      if (
        BrowserWindow.getAllWindows().filter(
          (w) => !isOverlayWindow(w) && !isTranslateTooltipWindow(w)
        ).length === 0
      ) {
        createMainWindow()
      }
    })
  })
}

app.on('window-all-closed', () => {
  // The screenshot overlay is persistent and hidden; it must not keep the
  // app alive after the real windows are gone.
  const realWindows = BrowserWindow.getAllWindows().filter(
    (w) => !isOverlayWindow(w) && !isTranslateTooltipWindow(w)
  )
  if (process.platform !== 'darwin' && realWindows.length === 0) {
    app.quit()
  }
})

let quitting = false

app.on('before-quit', (event) => {
  // Disable the system proxy first if we own it, then stop services (once).
  if (quitting) return
  quitting = true
  event.preventDefault()
  void disableProxyIfOwned().finally(async () => {
    stopAllServices()
    unregisterScreenshotShortcut()
    unregisterTranslateShortcut()
    teardownTranslate()
    stopWindowDetect()
    closeAllPins()
    await cleanupPinImages()
    destroyOverlayWindow()
    destroyTooltipWindow()
    app.exit()
  })
})
