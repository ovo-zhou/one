import { execFile, type ChildProcess } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { ScreenshotRect } from '../../shared/contracts'

/**
 * Window detection for screenshot mode.
 *
 * macOS ships no public API for "window under the cursor", so a tiny Swift
 * helper (resources/windowlist/windowlist) polls CGWindowListCopyWindowInfo
 * and streams one JSON array per line (~10Hz) to stdout. The main process
 * caches the latest list and hit-tests it on demand. No extra permissions
 * are needed for window geometry.
 */

export interface OSWindow {
  id: number
  pid: number
  owner: string
  name: string
  layer: number
  bounds: ScreenshotRect
}

let child: ChildProcess | null = null
let cache: OSWindow[] = []
let lastLine = ''

export function isWindowDetectAvailable(): boolean {
  return process.platform === 'darwin'
}

function binaryPath(): string {
  if (process.platform !== 'darwin') return ''
  if (app.isPackaged) return join(process.resourcesPath, 'windowlist', 'windowlist')
  return join(app.getAppPath(), 'resources', 'windowlist', 'windowlist')
}

function buildBinary(): Promise<boolean> {
  return new Promise((resolve) => {
    const dir = join(app.getAppPath(), 'resources', 'windowlist')
    execFile(
      'swiftc',
      ['-O', join(dir, 'main.swift'), '-o', join(dir, 'windowlist')],
      { cwd: dir },
      (err) => resolve(!err)
    )
  })
}

/**
 * Makes sure the helper binary exists. In dev it is compiled on first use
 * (swiftc must be available); in packaged builds it ships in extraResources.
 */
export async function ensureWindowDetect(): Promise<boolean> {
  if (!isWindowDetectAvailable()) return false
  const bin = binaryPath()
  if (existsSync(bin)) return true
  if (app.isPackaged) return false
  const ok = await buildBinary()
  if (!ok) {
    console.error('[windowlist] build failed (swiftc unavailable?) - window detection disabled')
  }
  return ok
}

/** Spawns the streaming helper and keeps the newest window list in memory. */
export function startWindowDetect(): void {
  stopWindowDetect()
  const bin = binaryPath()
  if (!bin || !existsSync(bin)) return
  child = execFile(bin, ['-stream'])
  let buf = ''
  child.stdout?.on('data', (chunk: Buffer) => {
    buf += chunk.toString('utf8')
    let nl: number
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl)
      buf = buf.slice(nl + 1)
      if (!line || line === lastLine) continue
      lastLine = line
      try {
        cache = JSON.parse(line) as OSWindow[]
      } catch (err) {
        console.error('[windowlist] parse error:', err)
      }
    }
  })
  child.stderr?.on('data', (chunk: Buffer) => {
    console.error('[windowlist]', chunk.toString())
  })
  child.on('exit', () => {
    child = null
  })
}

export function stopWindowDetect(): void {
  if (child) child.kill()
  child = null
  cache = []
  lastLine = ''
}

export function windowsNow(): OSWindow[] {
  return cache
}

/**
 * Topmost window (higher layer first; within a layer, front-to-back list
 * order) containing the point. Own windows are never returned.
 */
export function topWindowAt(point: { x: number; y: number }): OSWindow | null {
  const myPid = process.pid
  const sorted = [...cache].sort((a, b) => b.layer - a.layer)
  for (const w of sorted) {
    if (w.pid === myPid) continue
    const b = w.bounds
    if (point.x >= b.x && point.y >= b.y && point.x <= b.x + b.w && point.y <= b.y + b.h) {
      return w
    }
  }
  return null
}
