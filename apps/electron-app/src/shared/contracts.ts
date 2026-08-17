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

export interface Prefs {
  /** Whether the system proxy was enabled by this app (cleanup on quit). */
  systemProxyEnabledByApp: boolean
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
  moduleStatusChange: 'module:statusChange'
} as const

export interface ModuleStatusEventPayload {
  moduleId: string
  status: ModuleServiceStatus
}

export interface ElectronApi {
  getAppInfo(): Promise<AppInfo>
  getPrefs(): Promise<Prefs>
  setPrefs(patch: Partial<Prefs>): Promise<Prefs>
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
}
