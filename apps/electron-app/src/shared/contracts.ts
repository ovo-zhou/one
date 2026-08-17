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

export type ScreenshotFormat = 'png' | 'jpeg' | 'webp'

export type TestImageFormat = 'png' | 'jpeg' | 'webp'

export interface ScreenshotPrefs {
  /** Global accelerator string, e.g. 'CommandOrControl+Alt+A'. */
  shortcut: string
  format: ScreenshotFormat
  /** null = ask for a location on every save. */
  saveDir: string | null
}

export type TranslateModel = 'deepseek-v4-flash' | 'deepseek-v4-pro'

export interface TranslatePrefs {
  /** Master switch for the selection-translate feature. */
  enabled: boolean
  /** Pop the tooltip automatically on selection (needs accessibility). */
  autoPopup: boolean
  /** Empty = reuse the DeepSeek key from the dsh CLI (~/.dsh/.credentials.yaml). */
  apiKey: string
  model: TranslateModel
  /** Fallback accelerator: query the current selection and translate it. */
  shortcut: string
}

export interface Prefs {
  /** Whether the system proxy was enabled by this app (cleanup on quit). */
  systemProxyEnabledByApp: boolean
  screenshot: ScreenshotPrefs
  translate: TranslatePrefs
}

export type PrefsPatch = Partial<Omit<Prefs, 'screenshot' | 'translate'>> & {
  screenshot?: Partial<ScreenshotPrefs>
  translate?: Partial<TranslatePrefs>
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
  /** Main → overlay: session push with the frozen frame + geometry. */
  screenshotInit: 'screenshot:init',
  /** Overlay → main: frame decoded and first paint done (show-time handshake). */
  screenshotReady: 'screenshot:ready',
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
  screenshotPinOpacity: 'screenshot:pinOpacity',
  testImageSave: 'testImage:save',
  /** Main → tooltip: a stable text selection was made; show the pill. */
  translateSelection: 'translate:selection',
  /** Tooltip → main: run a streaming translation for the given text. */
  translateRequest: 'translate:request',
  /** Main → tooltip: one streaming delta of the current translation. */
  translateChunk: 'translate:chunk',
  /** Main → tooltip: the current translation finished (or failed). */
  translateDone: 'translate:done',
  /** Tooltip → main: hide the tooltip window. */
  translateDismiss: 'translate:dismiss',
  /** Tooltip → main: resize the tooltip window to its measured content. */
  translateResize: 'translate:resize',
  /** Tooltip → main: write text to the clipboard (window may be unfocused). */
  translateCopy: 'translate:copy',
  translateValidateShortcut: 'translate:validateShortcut',
  /** Returns whether the macOS accessibility permission is granted. */
  translateAccessibilityStatus: 'translate:accessibilityStatus',
  translateOpenAccessibilitySettings: 'translate:openAccessibilitySettings'
} as const

/** Payload for saving a generated test image from the renderer. */
export interface TestImageSavePayload {
  fileName: string
  format: TestImageFormat
  /** Encoded image bytes, e.g. ArrayBuffer from canvas.toBlob(). */
  data: ArrayBuffer
}

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

/**
 * Pushed to the overlay when a session starts (or switches display). Drives a
 * full renderer state reset; geometry comes via IPC instead of URL params so
 * the window can stay warm and be reused across displays.
 */
export interface ScreenshotInitPayload {
  /** Electron display id the overlay covers. */
  displayId: number
  /** Capture buffer id of the frozen frame. */
  imageId: string
  /** Overlay content size in CSS px (= display bounds size). */
  width: number
  height: number
  scaleFactor: number
}

/** Target language the DeepSeek translation should produce. */
export type TranslateTargetLang = 'en' | 'zh'

/** Pushed to the tooltip renderer when a selection becomes stable. */
export interface TranslateSelectionPayload {
  /** Selected text (already trimmed / truncated by the main process). */
  text: string
  /** Direction hint computed by the main process. */
  targetLang: TranslateTargetLang
  /** Anchor point in global screen coords (DIP); pill is placed near it. */
  x: number
  y: number
}

export interface TranslateRequestPayload {
  text: string
  targetLang: TranslateTargetLang
}

/** One streaming delta of the active translation. */
export interface TranslateChunkPayload {
  /** Full translation text accumulated so far (not a per-chunk delta). */
  text: string
}

export interface TranslateDonePayload {
  ok: boolean
  /** Full translation on success; user-facing message on failure. */
  text: string
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
  /** Overlay: session push from main (frame + geometry); drives a full UI reset. */
  onScreenshotInit(listener: (payload: ScreenshotInitPayload) => void): () => void
  /** Overlay: tells main the frame is decoded and painted (show-time handshake). */
  notifyScreenshotReady(): Promise<void>
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
  /** Shows a save dialog and writes the image; returns the path or null on cancel. */
  saveTestImage(payload: TestImageSavePayload): Promise<string | null>
  /** Tooltip: selection push from main (drives the pill). */
  onTranslateSelection(listener: (payload: TranslateSelectionPayload) => void): () => void
  /** Tooltip: starts a streaming translation; deltas arrive via onTranslateChunk. */
  requestTranslate(payload: TranslateRequestPayload): Promise<boolean>
  /** Tooltip: streaming deltas of the active translation. */
  onTranslateChunk(listener: (payload: TranslateChunkPayload) => void): () => void
  /** Tooltip: the active translation finished (ok=false → text is a message). */
  onTranslateDone(listener: (payload: TranslateDonePayload) => void): () => void
  /** Tooltip: hide the tooltip window (Esc / click-away / timeout). */
  dismissTranslate(): Promise<void>
  /** Tooltip: resize the window to the measured content box (CSS px). */
  resizeTranslateTooltip(width: number, height: number): Promise<void>
  /** Clipboard write that works while the tooltip window is unfocused. */
  copyTranslateText(text: string): Promise<void>
  validateTranslateShortcut(accelerator: string): Promise<boolean>
  /** { supported, trusted } for the macOS accessibility permission. */
  getTranslateAccessibilityStatus(): Promise<{ supported: boolean; trusted: boolean }>
  openTranslateAccessibilitySettings(): Promise<void>
}
