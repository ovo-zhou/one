import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { Prefs } from '../shared/contracts'

const DEFAULT_PREFS: Prefs = {
  systemProxyEnabledByApp: false
}

let cache: Prefs | null = null

function prefsPath(): string {
  return join(app.getPath('userData'), 'prefs.json')
}

export function getPrefs(): Prefs {
  if (cache) return { ...cache }
  let loaded: Prefs
  try {
    const raw = JSON.parse(readFileSync(prefsPath(), 'utf-8')) as Partial<Prefs>
    loaded = {
      systemProxyEnabledByApp: raw.systemProxyEnabledByApp ?? false
    }
  } catch {
    loaded = { ...DEFAULT_PREFS }
  }
  cache = loaded
  return { ...cache }
}

export function setPrefs(patch: Partial<Prefs>): Prefs {
  const next = getPrefs()
  if (patch.systemProxyEnabledByApp !== undefined) {
    next.systemProxyEnabledByApp = patch.systemProxyEnabledByApp
  }
  cache = next
  writeFileSync(prefsPath(), JSON.stringify(cache, null, 2))
  return { ...cache }
}
