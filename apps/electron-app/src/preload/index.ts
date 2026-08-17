import { contextBridge, ipcRenderer } from 'electron'
import {
  IPC,
  type ModuleServiceStatus,
  type PrefsPatch,
  type ScreenshotFinishPayload,
  type ScreenshotInitPayload,
  type ScreenshotPinAction,
  type ScreenshotRect,
  type TestImageSavePayload,
  type TranslateChunkPayload,
  type TranslateDonePayload,
  type TranslateSelectionPayload
} from '../shared/contracts'

type StatusListener = (status: ModuleServiceStatus) => void

let nextToken = 1
const listeners = new Map<number, { moduleId: string; listener: StatusListener }>()

ipcRenderer.on(
  IPC.moduleStatusChange,
  (_event, payload: { moduleId: string; status: ModuleServiceStatus }) => {
    for (const entry of listeners.values()) {
      if (entry.moduleId === payload.moduleId) entry.listener(payload.status)
    }
  }
)

const api = {
  getAppInfo: () => ipcRenderer.invoke(IPC.appInfo),
  getPrefs: () => ipcRenderer.invoke(IPC.prefsGet),
  setPrefs: (patch: PrefsPatch) => ipcRenderer.invoke(IPC.prefsSet, patch),
  getActiveModule: () => ipcRenderer.invoke(IPC.appGetActiveModule),
  setActiveModule: (moduleId: string | null) =>
    ipcRenderer.invoke(IPC.appSetActiveModule, moduleId),
  activateModule: (moduleId: string) => ipcRenderer.invoke(IPC.moduleActivate, moduleId),
  stopModule: (moduleId: string) => ipcRenderer.invoke(IPC.moduleStop, moduleId),
  getModuleStatus: (moduleId: string) => ipcRenderer.invoke(IPC.moduleGetStatus, moduleId),
  subscribeModuleStatus: async (moduleId: string, listener: StatusListener) => {
    const token = nextToken++
    listeners.set(token, { moduleId, listener })
    return token
  },
  unsubscribeModuleStatus: async (token: number) => {
    listeners.delete(token)
  },
  startScreenshot: () => ipcRenderer.invoke(IPC.screenshotStart),
  cancelScreenshotSession: () => ipcRenderer.invoke(IPC.screenshotCancel),
  onScreenshotInit: (listener: (payload: ScreenshotInitPayload) => void) => {
    const handler = (_event: unknown, payload: ScreenshotInitPayload): void => listener(payload)
    ipcRenderer.on(IPC.screenshotInit, handler)
    return () => {
      ipcRenderer.removeListener(IPC.screenshotInit, handler)
    }
  },
  notifyScreenshotReady: () => ipcRenderer.invoke(IPC.screenshotReady),
  setScreenshotSelectionActive: (active: boolean) =>
    ipcRenderer.invoke(IPC.screenshotSelectionChanged, active),
  onScreenshotWindowHighlight: (listener: (rect: ScreenshotRect | null) => void) => {
    const handler = (_event: unknown, rect: ScreenshotRect | null): void => listener(rect)
    ipcRenderer.on(IPC.screenshotWindowHighlight, handler)
    return () => {
      ipcRenderer.removeListener(IPC.screenshotWindowHighlight, handler)
    }
  },
  onScreenshotWindows: (
    listener: (data: { displayId: number; rects: ScreenshotRect[] }) => void
  ) => {
    const handler = (_event: unknown, data: { displayId: number; rects: ScreenshotRect[] }): void =>
      listener(data)
    ipcRenderer.on(IPC.screenshotWindows, handler)
    return () => {
      ipcRenderer.removeListener(IPC.screenshotWindows, handler)
    }
  },
  finishScreenshot: (payload: ScreenshotFinishPayload) =>
    ipcRenderer.invoke(IPC.screenshotFinish, payload),
  getScreenshotImage: (file: string) => ipcRenderer.invoke(IPC.screenshotGetImage, file),
  chooseScreenshotSaveDir: () => ipcRenderer.invoke(IPC.screenshotChooseSaveDir),
  validateScreenshotShortcut: (accelerator: string) =>
    ipcRenderer.invoke(IPC.screenshotValidateShortcut, accelerator),
  screenshotPinAction: (pinId: number, action: ScreenshotPinAction) =>
    ipcRenderer.invoke(IPC.screenshotPinAction, pinId, action),
  screenshotPinResize: (pinId: number, width: number, height: number) =>
    ipcRenderer.invoke(IPC.screenshotPinResize, pinId, width, height),
  screenshotPinSetOpacity: (pinId: number, opacity: number) =>
    ipcRenderer.invoke(IPC.screenshotPinOpacity, pinId, opacity),
  saveTestImage: (payload: TestImageSavePayload) => ipcRenderer.invoke(IPC.testImageSave, payload),
  onTranslateSelection: (listener: (payload: TranslateSelectionPayload) => void) => {
    const handler = (_event: unknown, payload: TranslateSelectionPayload): void => listener(payload)
    ipcRenderer.on(IPC.translateSelection, handler)
    return () => {
      ipcRenderer.removeListener(IPC.translateSelection, handler)
    }
  },
  requestTranslate: (payload: { text: string; targetLang: 'en' | 'zh' }) =>
    ipcRenderer.invoke(IPC.translateRequest, payload),
  onTranslateChunk: (listener: (payload: TranslateChunkPayload) => void) => {
    const handler = (_event: unknown, payload: TranslateChunkPayload): void => listener(payload)
    ipcRenderer.on(IPC.translateChunk, handler)
    return () => {
      ipcRenderer.removeListener(IPC.translateChunk, handler)
    }
  },
  onTranslateDone: (listener: (payload: TranslateDonePayload) => void) => {
    const handler = (_event: unknown, payload: TranslateDonePayload): void => listener(payload)
    ipcRenderer.on(IPC.translateDone, handler)
    return () => {
      ipcRenderer.removeListener(IPC.translateDone, handler)
    }
  },
  dismissTranslate: () => ipcRenderer.invoke(IPC.translateDismiss),
  resizeTranslateTooltip: (width: number, height: number) =>
    ipcRenderer.invoke(IPC.translateResize, width, height),
  copyTranslateText: (text: string) => ipcRenderer.invoke(IPC.translateCopy, text),
  validateTranslateShortcut: (accelerator: string) =>
    ipcRenderer.invoke(IPC.translateValidateShortcut, accelerator),
  getTranslateAccessibilityStatus: () =>
    ipcRenderer.invoke(IPC.translateAccessibilityStatus) as Promise<{
      supported: boolean
      trusted: boolean
    }>,
  openTranslateAccessibilitySettings: () =>
    ipcRenderer.invoke(IPC.translateOpenAccessibilitySettings)
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
