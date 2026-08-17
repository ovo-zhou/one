import { dialog, ipcMain } from 'electron'
import { IPC, type ScreenshotPinAction } from '../../shared/contracts'
import {
  cancelScreenshot,
  finishScreenshot,
  notifyOverlayReady,
  setScreenshotSelectionActive,
  startScreenshot
} from './manager'
import { handlePinAction, getPinBuffer, resizePin, setPinOpacity } from './pin'
import { validateAccelerator } from './shortcut'
import { getCapturedBuffer } from './capture'

/**
 * Serves captured / pin PNG bytes to overlay windows.
 * Captures are keyed by capture id, pins by absolute file path; both are
 * served from memory (no disk I/O).
 */
async function readScreenshotImage(id: string): Promise<ArrayBuffer> {
  const buf = getCapturedBuffer(id) ?? getPinBuffer(id)
  if (!buf) throw new Error('capture not found')
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

export function registerScreenshotIpc(): void {
  ipcMain.handle(IPC.screenshotStart, () => startScreenshot())
  ipcMain.handle(IPC.screenshotCancel, () => cancelScreenshot())
  ipcMain.handle(IPC.screenshotReady, () => notifyOverlayReady())
  ipcMain.handle(IPC.screenshotSelectionChanged, (_event, active: boolean) =>
    setScreenshotSelectionActive(active)
  )
  ipcMain.handle(IPC.screenshotFinish, (_event, payload) => finishScreenshot(payload))
  ipcMain.handle(IPC.screenshotGetImage, (_event, file: string) => readScreenshotImage(file))
  ipcMain.handle(IPC.screenshotChooseSaveDir, async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    })
    return canceled ? null : (filePaths[0] ?? null)
  })
  ipcMain.handle(IPC.screenshotValidateShortcut, (_event, accelerator: unknown) => {
    return typeof accelerator === 'string' && validateAccelerator(accelerator)
  })
  ipcMain.handle(IPC.screenshotPinAction, (_event, pinId: number, action: ScreenshotPinAction) =>
    handlePinAction(pinId, action)
  )
  ipcMain.handle(IPC.screenshotPinResize, (_event, pinId: number, width: number, height: number) =>
    resizePin(pinId, width, height)
  )
  ipcMain.handle(IPC.screenshotPinOpacity, (_event, pinId: number, opacity: number) =>
    setPinOpacity(pinId, opacity)
  )
}
