import { app, ipcMain, webContents } from 'electron'
import {
  IPC,
  type AppInfo,
  type ModuleStatusEventPayload,
  type PrefsPatch
} from '../shared/contracts'
import { getPrefs, setPrefs } from './prefs'
import { getAllServices, getService } from './services/registry'
import { registerScreenshotIpc } from './screenshot/ipc'
import { applyScreenshotShortcut } from './screenshot/shortcut'
import { rebuildAppMenu } from './menu'

function broadcastStatus(moduleId: string, payload: ModuleStatusEventPayload['status']): void {
  const event: ModuleStatusEventPayload = { moduleId, status: payload }
  for (const wc of webContents.getAllWebContents()) {
    wc.send(IPC.moduleStatusChange, event)
  }
}

/**
 * Last opened module, kept in main-process memory only: it survives window
 * close (macOS red button) but resets when the app fully quits.
 */
let activeModuleId: string | null = null

/** Registers all main-process IPC handlers. Call once after app ready. */
export function registerIpcHandlers(): void {
  registerScreenshotIpc()

  ipcMain.handle(
    IPC.appInfo,
    (): AppInfo => ({
      version: app.getVersion(),
      platform: process.platform
    })
  )

  ipcMain.handle(IPC.prefsGet, () => getPrefs())
  ipcMain.handle(IPC.prefsSet, async (_event, patch: PrefsPatch) => {
    const before = getPrefs()
    const next = setPrefs(patch)
    if (next.screenshot.shortcut !== before.screenshot.shortcut) {
      const ok = await applyScreenshotShortcut(next.screenshot.shortcut)
      if (!ok) {
        setPrefs({ screenshot: { shortcut: before.screenshot.shortcut } })
        throw new Error(`快捷键「${next.screenshot.shortcut}」注册失败，可能已被其他应用占用`)
      }
      rebuildAppMenu()
    }
    return next
  })

  ipcMain.handle(IPC.appGetActiveModule, () => activeModuleId)
  ipcMain.handle(IPC.appSetActiveModule, (_event, moduleId: string | null) => {
    activeModuleId = moduleId
  })

  ipcMain.handle(IPC.moduleGetStatus, (_event, moduleId: string) => {
    return getService(moduleId)?.getStatus() ?? { phase: 'idle', url: null, error: null }
  })

  const subscribed = new Set<string>()

  ipcMain.handle(IPC.moduleActivate, async (_event, moduleId: string) => {
    const service = getService(moduleId)
    if (!service) throw new Error(`Unknown module service: ${moduleId}`)
    if (!subscribed.has(moduleId)) {
      subscribed.add(moduleId)
      service.onStatusChange((status) => broadcastStatus(moduleId, status))
    }
    return await service.start()
  })

  ipcMain.handle(IPC.moduleStop, async (_event, moduleId: string) => {
    const service = getService(moduleId)
    if (!service) throw new Error(`Unknown module service: ${moduleId}`)
    await service.stop()
  })
}

/** Stops all running module services. Call on will-quit. */
export function stopAllServices(): void {
  for (const service of getAllServices()) {
    void service.stop()
  }
}
