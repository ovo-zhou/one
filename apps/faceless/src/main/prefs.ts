import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { ApiClientSnapshot, Prefs, PrefsPatch, TranslateModel } from '../shared/contracts'

export const SCREENSHOT_SHORTCUT = 'Control+Command+A'
export const TRANSLATE_SHORTCUT = 'Control+Command+Z'
export const DEFAULT_TRANSLATE_MODEL: TranslateModel = 'deepseek-v4-flash'

/** Max API-client snapshots kept in prefs (most recent first). */
const MAX_API_SNAPSHOTS = 200

const DEFAULT_PREFS: Prefs = {
  systemProxyEnabledByApp: false,
  apiClientSnapshots: [],
  screenshot: {
    format: 'png',
    saveDir: null
  },
  translate: {
    enabled: true,
    autoPopup: true,
    apiKey: '',
    model: DEFAULT_TRANSLATE_MODEL
  }
}

function isTranslateModel(v: unknown): v is TranslateModel {
  return v === 'deepseek-v4-flash' || v === 'deepseek-v4-pro'
}

function isSnapshotHeader(value: unknown): value is [string, string] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'string' &&
    typeof value[1] === 'string'
  )
}

function parseSnapshot(value: unknown): ApiClientSnapshot | null {
  if (!value || typeof value !== 'object') return null
  const s = value as Record<string, unknown>
  if (typeof s.id !== 'string' || !s.id.trim()) return null
  if (typeof s.title !== 'string') return null
  if (typeof s.method !== 'string' || !s.method.trim()) return null
  if (s.protocol !== 'https://' && s.protocol !== 'http://') return null
  if (typeof s.url !== 'string') return null
  if (!Array.isArray(s.headers) || !s.headers.every(isSnapshotHeader)) return null
  if (typeof s.body !== 'string') return null
  const createdAt = typeof s.createdAt === 'number' ? s.createdAt : Date.now()
  return {
    id: s.id,
    title: s.title,
    method: s.method,
    protocol: s.protocol,
    url: s.url,
    headers: s.headers,
    body: s.body,
    createdAt,
    updatedAt: typeof s.updatedAt === 'number' ? s.updatedAt : createdAt
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
    if (Array.isArray(raw.apiClientSnapshots)) {
      next.apiClientSnapshots = raw.apiClientSnapshots
        .map(parseSnapshot)
        .filter((s): s is ApiClientSnapshot => s !== null)
    }
    const s = raw.screenshot
    if (s && typeof s === 'object') {
      const shot = s as Record<string, unknown>
      if (shot.format === 'png' || shot.format === 'jpeg' || shot.format === 'webp') {
        next.screenshot.format = shot.format
      }
      if (typeof shot.saveDir === 'string') {
        next.screenshot.saveDir = shot.saveDir
      }
    }
    const t = raw.translate
    if (t && typeof t === 'object') {
      const tr = t as Record<string, unknown>
      if (typeof tr.enabled === 'boolean') {
        next.translate.enabled = tr.enabled
      }
      if (typeof tr.autoPopup === 'boolean') {
        next.translate.autoPopup = tr.autoPopup
      }
      if (typeof tr.apiKey === 'string') {
        next.translate.apiKey = tr.apiKey
      }
      if (isTranslateModel(tr.model)) {
        next.translate.model = tr.model
      }
    }
  } catch {
    // fall through to defaults
  }
  return next
}

export function getPrefs(): Prefs {
  if (!cache) cache = load()
  return {
    ...cache,
    apiClientSnapshots: cache.apiClientSnapshots.map((s) => ({ ...s })),
    screenshot: { ...cache.screenshot },
    translate: { ...cache.translate }
  }
}

export function setPrefs(patch: PrefsPatch): Prefs {
  const next = getPrefs()
  if (typeof patch.systemProxyEnabledByApp === 'boolean') {
    next.systemProxyEnabledByApp = patch.systemProxyEnabledByApp
  }
  if (Array.isArray(patch.apiClientSnapshots)) {
    next.apiClientSnapshots = patch.apiClientSnapshots
      .map(parseSnapshot)
      .filter((s): s is ApiClientSnapshot => s !== null)
      .slice(0, MAX_API_SNAPSHOTS)
  }
  const sp = patch.screenshot
  if (sp) {
    if (sp.format === 'png' || sp.format === 'jpeg' || sp.format === 'webp') {
      next.screenshot.format = sp.format
    }
    if (sp.saveDir === undefined) {
      // unchanged
    } else if (sp.saveDir === null || typeof sp.saveDir === 'string') {
      next.screenshot.saveDir = sp.saveDir
    }
  }
  const tp = patch.translate
  if (tp) {
    if (typeof tp.enabled === 'boolean') {
      next.translate.enabled = tp.enabled
    }
    if (typeof tp.autoPopup === 'boolean') {
      next.translate.autoPopup = tp.autoPopup
    }
    if (typeof tp.apiKey === 'string') {
      next.translate.apiKey = tp.apiKey.trim()
    }
    if (isTranslateModel(tp.model)) {
      next.translate.model = tp.model
    }
  }
  cache = next
  writeFileSync(prefsPath(), JSON.stringify(cache, null, 2))
  return {
    ...cache,
    apiClientSnapshots: cache.apiClientSnapshots.map((s) => ({ ...s })),
    screenshot: { ...cache.screenshot },
    translate: { ...cache.translate }
  }
}
