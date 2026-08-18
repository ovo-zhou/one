import { app, dialog, ipcMain, webContents } from 'electron'
import { writeFile } from 'fs/promises'
import {
  IPC,
  type AppInfo,
  type ModuleStatusEventPayload,
  type PrefsPatch,
  type TestImageSavePayload
} from '../shared/contracts'
import { getPrefs, setPrefs } from './prefs'
import { getAllServices, getService } from './services/registry'
import { registerScreenshotIpc } from './screenshot/ipc'
import { applyScreenshotShortcut } from './screenshot/shortcut'
import { registerTranslateIpc } from './translate/ipc'
import { applyTranslateShortcut, unregisterTranslateShortcut } from './translate/shortcut'
import { applyTranslatePrefs } from './translate/manager'
import { rebuildAppMenu } from './menu'
import { checkForUpdates, startInAppUpdate } from './updater'

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
  registerTranslateIpc()

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
    if (next.translate.shortcut !== before.translate.shortcut) {
      if (!next.translate.enabled) {
        // Feature disabled: shortcuts stay unregistered; just persist.
      } else {
        const ok = await applyTranslateShortcut(next.translate.shortcut)
        if (!ok) {
          setPrefs({ translate: { shortcut: before.translate.shortcut } })
          throw new Error(`快捷键「${next.translate.shortcut}」注册失败，可能已被其他应用占用`)
        }
        rebuildAppMenu()
      }
    }
    if (next.translate.enabled !== before.translate.enabled) {
      if (next.translate.enabled) {
        const ok = await applyTranslateShortcut(next.translate.shortcut)
        if (!ok) {
          setPrefs({ translate: { enabled: false } })
          throw new Error(`快捷键「${next.translate.shortcut}」注册失败，可能已被其他应用占用`)
        }
      } else {
        unregisterTranslateShortcut()
      }
      rebuildAppMenu()
      await applyTranslatePrefs()
    } else if (next.translate.autoPopup !== before.translate.autoPopup) {
      await applyTranslatePrefs()
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

  ipcMain.handle(IPC.updaterCheck, () => checkForUpdates())
  ipcMain.handle(IPC.updaterStart, () => startInAppUpdate({ notify: true }))

  ipcMain.handle(IPC.testImageSave, async (_event, payload: TestImageSavePayload) => {
    const ext = payload.format === 'jpeg' ? 'jpg' : payload.format
    const filterName =
      payload.format === 'png' ? 'PNG 图片' : payload.format === 'jpeg' ? 'JPEG 图片' : 'WebP 图片'
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: '保存测试图',
      defaultPath: payload.fileName.endsWith(`.${ext}`)
        ? payload.fileName
        : `${payload.fileName}.${ext}`,
      filters: [{ name: filterName, extensions: [ext] }]
    })
    if (canceled || !filePath) return null
    await writeFile(filePath, new Uint8Array(payload.data))
    return filePath
  })
}

/** Stops all running module services. Call on will-quit. */
export function stopAllServices(): void {
  for (const service of getAllServices()) {
    void service.stop()
  }
}
