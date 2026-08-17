import { clipboard, ipcMain } from 'electron'
import { IPC } from '../../shared/contracts'
import { dismissTooltip, requestTranslation } from './manager'
import { resizeTooltip } from './tooltip'
import {
  isAccessibilityTrusted,
  isSelectionWatchAvailable,
  openAccessibilitySettings
} from './selection-watcher'
import { validateTranslateAccelerator } from './shortcut'

export function registerTranslateIpc(): void {
  ipcMain.handle(IPC.translateRequest, (_event, payload: unknown) => {
    if (
      !payload ||
      typeof payload !== 'object' ||
      typeof (payload as { text?: unknown }).text !== 'string' ||
      !['en', 'zh'].includes((payload as { targetLang?: unknown }).targetLang as string)
    ) {
      return false
    }
    const { text, targetLang } = payload as { text: string; targetLang: 'en' | 'zh' }
    return requestTranslation(text, targetLang)
  })
  ipcMain.handle(IPC.translateDismiss, () => dismissTooltip())
  ipcMain.handle(IPC.translateResize, (_event, width: unknown, height: unknown) => {
    if (typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0) {
      resizeTooltip(width, height)
    }
  })
  ipcMain.handle(IPC.translateCopy, (_event, text: unknown) => {
    if (typeof text === 'string' && text) clipboard.writeText(text)
  })
  ipcMain.handle(IPC.translateValidateShortcut, (_event, accelerator: unknown) => {
    return typeof accelerator === 'string' && validateTranslateAccelerator(accelerator)
  })
  ipcMain.handle(IPC.translateAccessibilityStatus, () => ({
    supported: isSelectionWatchAvailable(),
    trusted: isAccessibilityTrusted()
  }))
  ipcMain.handle(IPC.translateOpenAccessibilitySettings, () => openAccessibilitySettings())
}
