import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { Prefs, PrefsPatch } from '../shared/contracts'

export const DEFAULT_SCREENSHOT_SHORTCUT = 'CommandOrControl+Alt+A'

const DEFAULT_PREFS: Prefs = {
  systemProxyEnabledByApp: false,
  screenshot: {
    shortcut: DEFAULT_SCREENSHOT_SHORTCUT,
    format: 'png',
    saveDir: null
  }
}

let cache: Prefs | null = null

function prefsPath(): string {
  return join(app.getPath('userData'), 'prefs.json')
}

function load(): Prefs {
  const next = structuredClone(DEFAULT_PREFS)
  try {
    const raw = JSON.parse(readFileSync(prefsPath(), 'utf-8')) as Record<string, unknown>
    if (typeof raw.systemProxyEnabledByApp === 'boolean') {
      next.systemProxyEnabledByApp = raw.systemProxyEnabledByApp
    }
    const s = raw.screenshot
    if (s && typeof s === 'object') {
      const shot = s as Record<string, unknown>
      if (typeof shot.shortcut === 'string' && shot.shortcut.trim()) {
        next.screenshot.shortcut = shot.shortcut.trim()
      }
      if (shot.format === 'png' || shot.format === 'jpeg') {
        next.screenshot.format = shot.format
      }
      if (typeof shot.saveDir === 'string') {
        next.screenshot.saveDir = shot.saveDir
      }
    }
  } catch {
    // fall through to defaults
  }
  return next
}

export function getPrefs(): Prefs {
  if (!cache) cache = load()
  return { ...cache, screenshot: { ...cache.screenshot } }
}

export function setPrefs(patch: PrefsPatch): Prefs {
  const next = getPrefs()
  if (typeof patch.systemProxyEnabledByApp === 'boolean') {
    next.systemProxyEnabledByApp = patch.systemProxyEnabledByApp
  }
  const sp = patch.screenshot
  if (sp) {
    if (typeof sp.shortcut === 'string' && sp.shortcut.trim()) {
      next.screenshot.shortcut = sp.shortcut.trim()
    }
    if (sp.format === 'png' || sp.format === 'jpeg') {
      next.screenshot.format = sp.format
    }
    if (sp.saveDir === undefined) {
      // unchanged
    } else if (sp.saveDir === null || typeof sp.saveDir === 'string') {
      next.screenshot.saveDir = sp.saveDir
    }
  }
  cache = next
  writeFileSync(prefsPath(), JSON.stringify(cache, null, 2))
  return { ...cache, screenshot: { ...cache.screenshot } }
}
