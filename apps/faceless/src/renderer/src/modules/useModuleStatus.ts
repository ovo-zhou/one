import { useEffect, useMemo, useState } from 'react'
import type { ModuleServicePhase, ModuleServiceStatus } from '../../../shared/contracts'

const IDLE: ModuleServiceStatus = { phase: 'idle', url: null, error: null }

function toInitial(ids: string[]): Record<string, ModuleServiceStatus> {
  return Object.fromEntries(ids.map((id) => [id, IDLE]))
}

/**
 * Subscribes to the service status of the given module ids. Updates arrive
 * from main via push events; initial values are fetched once per id.
 */
export function useModuleStatuses(ids: string[]): Record<string, ModuleServiceStatus> {
  const [statuses, setStatuses] = useState<Record<string, ModuleServiceStatus>>(() =>
    toInitial(ids)
  )
  const key = ids.join(',')

  useEffect(() => {
    const moduleIds = key ? key.split(',') : []
    let alive = true
    const tokens: number[] = []

    for (const id of moduleIds) {
      void window.api.getModuleStatus(id).then((s) => {
        if (alive) setStatuses((prev) => ({ ...prev, [id]: s }))
      })
      void window.api
        .subscribeModuleStatus(id, (s) => {
          if (alive) setStatuses((prev) => ({ ...prev, [id]: s }))
        })
        .then((t) => {
          tokens.push(t)
        })
    }

    return () => {
      alive = false
      for (const t of tokens) void window.api.unsubscribeModuleStatus(t)
    }
  }, [key])

  return statuses
}

export function useModulePhases(ids: string[]): Record<string, ModuleServicePhase> {
  const statuses = useModuleStatuses(ids)
  return useMemo(
    () => Object.fromEntries(ids.map((id) => [id, statuses[id]?.phase ?? 'idle'])),
    [ids, statuses]
  )
}
