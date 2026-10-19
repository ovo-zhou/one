import type { ElectronApi } from '../shared/contracts'

declare global {
  interface Window {
    api: ElectronApi
  }
}

export {}
