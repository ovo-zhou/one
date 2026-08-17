import type { ModuleServiceStatus } from '../../shared/contracts'

export type StatusListener = (status: ModuleServiceStatus) => void

/** A long-lived background process owned by a module (e.g. the dsh web server). */
export interface ModuleService {
  /** Idempotent: returns ready status eventually; rejects on fatal error. */
  start(): Promise<ModuleServiceStatus>
  stop(): Promise<void>
  getStatus(): ModuleServiceStatus
  onStatusChange(listener: StatusListener): () => void
}

export abstract class BaseModuleService implements ModuleService {
  protected status: ModuleServiceStatus = { phase: 'idle', url: null, error: null }
  private listeners = new Set<StatusListener>()

  getStatus(): ModuleServiceStatus {
    return { ...this.status }
  }

  onStatusChange(listener: StatusListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  protected setStatus(patch: Partial<ModuleServiceStatus>): void {
    this.status = { ...this.status, ...patch }
    const snapshot = { ...this.status }
    for (const listener of this.listeners) listener(snapshot)
  }

  abstract start(): Promise<ModuleServiceStatus>
  abstract stop(): Promise<void>
}
