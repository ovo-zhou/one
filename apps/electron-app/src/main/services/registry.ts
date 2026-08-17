import type { ModuleService } from './base'
import { DshService } from './dsh'
import { WhistleService } from './whistle'

/**
 * Registry of module background services. Adding a module with a local
 * service = implement ModuleService + register it here. Instances are
 * created lazily and cached for the app lifetime.
 */
const factories = new Map<string, () => ModuleService>()
const instances = new Map<string, ModuleService>()

function registerService(moduleId: string, factory: () => ModuleService): void {
  factories.set(moduleId, factory)
}

registerService('dsh', () => new DshService())
registerService('whistle', () => new WhistleService())

export function getService(moduleId: string): ModuleService | null {
  let service = instances.get(moduleId)
  if (!service) {
    const factory = factories.get(moduleId)
    if (!factory) return null
    service = factory()
    instances.set(moduleId, service)
  }
  return service
}

export function getAllServices(): ModuleService[] {
  return [...instances.values()]
}
