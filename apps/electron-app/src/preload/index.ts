import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type ModuleServiceStatus } from '../shared/contracts'

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
  setPrefs: (patch: Record<string, unknown>) => ipcRenderer.invoke(IPC.prefsSet, patch),
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
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
