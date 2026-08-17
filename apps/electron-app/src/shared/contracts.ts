/** Types and IPC channel names shared between main, preload and renderer. */

export type ModuleServicePhase = 'idle' | 'starting' | 'ready' | 'error' | 'stopped'

export interface ModuleServiceStatus {
  phase: ModuleServicePhase
  url: string | null
  error: string | null
}

export interface AppInfo {
  version: string
  platform: string
}

export type ScreenshotFormat = 'png' | 'jpeg'

export interface ScreenshotPrefs {
  /** Global accelerator string, e.g. 'CommandOrControl+Alt+A'. */
  shortcut: string
  format: ScreenshotFormat
  /** null = ask for a location on every save. */
  saveDir: string | null
}

export interface Prefs {
  /** Whether the system proxy was enabled by this app (cleanup on quit). */
  systemProxyEnabledByApp: boolean
  screenshot: ScreenshotPrefs
}

export type PrefsPatch = Partial<Omit<Prefs, 'screenshot'>> & {
  screenshot?: Partial<ScreenshotPrefs>
}

export const IPC = {
  appInfo: 'app:info',
  prefsGet: 'prefs:get',
  prefsSet: 'prefs:set',
  appGetActiveModule: 'app:getActiveModule',
  appSetActiveModule: 'app:setActiveModule',
  moduleActivate: 'module:activate',
  moduleStop: 'module:stop',
  moduleGetStatus: 'module:getStatus',
  /** Push channel used by preload fan-out, payload: ModuleStatusEventPayload */
  moduleStatusChange: 'module:statusChange',
  screenshotStart: 'screenshot:start',
  screenshotCancel: 'screenshot:cancel',
  /** Overlay → main: a selection interaction started/ended (locks screen following). */
  screenshotSelectionChanged: 'screenshot:selectionChanged',
  /** Main → overlay: display-local rect of the window under the cursor, or null. */
  screenshotWindowHighlight: 'screenshot:windowHighlight',
  /** Main → overlay: every window intersecting the overlay display (for edge snapping). */
  screenshotWindows: 'screenshot:windows',
  screenshotFinish: 'screenshot:finish',
  screenshotGetImage: 'screenshot:getImage',
  screenshotChooseSaveDir: 'screenshot:chooseSaveDir',
  screenshotValidateShortcut: 'screenshot:validateShortcut',
  screenshotPinAction: 'screenshot:pinAction',
  screenshotPinResize: 'screenshot:pinResize',
  screenshotPinOpacity: 'screenshot:pinOpacity'
} as const

export interface ModuleStatusEventPayload {
  moduleId: string
  status: ModuleServiceStatus
}

export type ScreenshotFinishMode = 'copy' | 'save' | 'pin'

export interface ScreenshotFinishPayload {
  mode: ScreenshotFinishMode
  /** PNG data URL of the annotated selection. */
  dataUrl: string
  /** Selection size in CSS px (used to size pin windows). */
  width: number
  height: number
}

export type ScreenshotPinAction = 'close' | 'copy' | 'save'

/** Display-local rectangle in CSS px. */
export interface ScreenshotRect {
  x: number
  y: number
  w: number
  h: number
}

export interface ElectronApi {
  getAppInfo(): Promise<AppInfo>
  getPrefs(): Promise<Prefs>
  setPrefs(patch: PrefsPatch): Promise<Prefs>
  /** In-memory only: survives window close, resets when the app quits. */
  getActiveModule(): Promise<string | null>
  setActiveModule(moduleId: string | null): Promise<void>
  activateModule(moduleId: string): Promise<ModuleServiceStatus>
  stopModule(moduleId: string): Promise<void>
  getModuleStatus(moduleId: string): Promise<ModuleServiceStatus>
  /** Returns a subscription token; unsubscribe with {@link unsubscribeModuleStatus}. */
  subscribeModuleStatus(
    moduleId: string,
    listener: (status: ModuleServiceStatus) => void
  ): Promise<number>
  unsubscribeModuleStatus(token: number): Promise<void>
  /** Returns false when a session is already active or permission is missing. */
  startScreenshot(): Promise<boolean>
  cancelScreenshotSession(): Promise<void>
  /** Overlay: lock/unlock cursor-following (call true on pointerdown). */
  setScreenshotSelectionActive(active: boolean): Promise<void>
  /** Overlay: subscribe to window-highlight updates; returns unsubscribe. */
  onScreenshotWindowHighlight(listener: (rect: ScreenshotRect | null) => void): () => void
  /** Overlay: subscribe to window-edge lists for the overlay display. */
  onScreenshotWindows(
    listener: (data: { displayId: number; rects: ScreenshotRect[] }) => void
  ): () => void
  finishScreenshot(payload: ScreenshotFinishPayload): Promise<void>
  /** Returns the PNG bytes of a captured display / pin image (overlay windows). */
  getScreenshotImage(file: string): Promise<ArrayBuffer>
  chooseScreenshotSaveDir(): Promise<string | null>
  validateScreenshotShortcut(accelerator: string): Promise<boolean>
  screenshotPinAction(pinId: number, action: ScreenshotPinAction): Promise<void>
  screenshotPinResize(pinId: number, width: number, height: number): Promise<void>
  screenshotPinSetOpacity(pinId: number, opacity: number): Promise<void>
}
