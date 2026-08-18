import { execFile, type ChildProcess } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { app, dialog, shell, systemPreferences } from 'electron'
import { resetTccService } from '../tcc'

/**
 * Selection watching for the translate feature.
 *
 * Mirrors screenshot/window-detect.ts: a tiny Swift helper
 * (resources/selectionwatch/selectionwatch) polls the focused element's
 * AXSelectedText and streams one JSON line per change to stdout. macOS only,
 * and requires the Accessibility permission (checked via Electron's
 * systemPreferences, no extra helper round-trip needed).
 */

export interface SelectionEvent {
  text: string
  /** Global screen coords in DIP; w/h are 0 when the app hides them. */
  x: number
  y: number
  w: number
  h: number
  pid: number
}

type SelectionListener = (selection: SelectionEvent | null) => void

let child: ChildProcess | null = null

export function isSelectionWatchAvailable(): boolean {
  return process.platform === 'darwin'
}

function binaryPath(): string {
  if (process.platform !== 'darwin') return ''
  if (app.isPackaged) return join(process.resourcesPath, 'selectionwatch', 'selectionwatch')
  return join(app.getAppPath(), 'resources', 'selectionwatch', 'selectionwatch')
}

function buildBinary(): Promise<boolean> {
  return new Promise((resolve) => {
    const dir = join(app.getAppPath(), 'resources', 'selectionwatch')
    execFile(
      'swiftc',
      ['-O', join(dir, 'selectionwatch.swift'), '-o', join(dir, 'selectionwatch')],
      { cwd: dir },
      (err) => resolve(!err)
    )
  })
}

/**
 * Makes sure the helper binary exists. In dev it is compiled on first use
 * (swiftc must be available); in packaged builds it ships in extraResources.
 */
export async function ensureSelectionWatcher(): Promise<boolean> {
  if (!isSelectionWatchAvailable()) return false
  const bin = binaryPath()
  if (existsSync(bin)) return true
  if (app.isPackaged) return false
  const ok = await buildBinary()
  if (!ok) {
    console.error(
      '[selectionwatch] build failed (swiftc unavailable?) - selection translate disabled'
    )
  }
  return ok
}

const ACCESSIBILITY_SETTINGS_URL =
  'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility'

export function isAccessibilityTrusted(): boolean {
  if (process.platform !== 'darwin') return true
  return systemPreferences.isTrustedAccessibilityClient(false)
}

/** Shows the Chinese permission dialog (mirrors capture.ts). Returns granted. */
export async function ensureAccessibilityPermission(): Promise<boolean> {
  if (isAccessibilityTrusted()) return true
  const { response } = await dialog.showMessageBox({
    type: 'warning',
    message: '需要「辅助功能」权限',
    detail:
      '划词翻译需要辅助功能权限。请前往 系统设置 → 隐私与安全性 → 辅助功能，勾选本应用。\n\n' +
      '开发模式下权限归属于启动应用的终端（如 VS Code 或 Terminal），请勾选对应程序。\n\n' +
      '若列表中已勾选本应用仍反复提示未授权，说明旧版本残留的授权已失效：' +
      '请点击「重置后重新授权」，并在系统设置中重新勾选。',
    buttons: ['打开系统设置', '重置后重新授权', '取消'],
    defaultId: 0,
    cancelId: 2
  })
  if (response === 0) {
    await shell.openExternal(ACCESSIBILITY_SETTINGS_URL)
  } else if (response === 1) {
    resetAccessibilityPermission()
  }
  return false
}

export function openAccessibilitySettings(): void {
  void shell.openExternal(ACCESSIBILITY_SETTINGS_URL)
}

/**
 * Ad-hoc signed builds get a new code hash on every release, so an
 * accessibility grant from an older install goes stale: System Settings still
 * shows the app checked, yet AXIsProcessTrusted() keeps returning false.
 * Clearing the stored grant via tccutil forces a clean re-grant that matches
 * the currently running binary.
 */
export function resetAccessibilityPermission(): void {
  resetTccService('Accessibility')
  void shell.openExternal(ACCESSIBILITY_SETTINGS_URL)
}

function parseLine(line: string, onSelection: SelectionListener): void {
  if (!line) return
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(line) as Record<string, unknown>
  } catch {
    return
  }
  if (typeof parsed.error === 'string') {
    console.error('[selectionwatch] helper error:', parsed.error)
    onSelection(null)
    return
  }
  const text = typeof parsed.text === 'string' ? parsed.text : ''
  if (!text) {
    onSelection(null)
    return
  }
  onSelection({
    text,
    x: typeof parsed.x === 'number' ? parsed.x : 0,
    y: typeof parsed.y === 'number' ? parsed.y : 0,
    w: typeof parsed.w === 'number' ? parsed.w : 0,
    h: typeof parsed.h === 'number' ? parsed.h : 0,
    pid: typeof parsed.pid === 'number' ? parsed.pid : 0
  })
}

/** Spawns the streaming helper and forwards every selection change. */
export function startSelectionWatcher(onSelection: SelectionListener): void {
  stopSelectionWatcher()
  const bin = binaryPath()
  if (!bin || !existsSync(bin)) return
  child = execFile(bin, ['--stream'])
  let buf = ''
  child.stdout?.on('data', (chunk: Buffer) => {
    buf += chunk.toString('utf8')
    let nl: number
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl)
      buf = buf.slice(nl + 1)
      parseLine(line, onSelection)
    }
  })
  child.stderr?.on('data', (chunk: Buffer) => {
    console.error('[selectionwatch]', chunk.toString())
  })
  child.on('exit', () => {
    child = null
  })
}

export function stopSelectionWatcher(): void {
  if (child) child.kill()
  child = null
}

export function isSelectionWatcherRunning(): boolean {
  return child !== null
}

/** One-shot query for the current selection (used by the global shortcut). */
export async function captureSelectionOnce(): Promise<SelectionEvent | null> {
  const bin = binaryPath()
  if (!bin || !existsSync(bin)) return null
  return new Promise((resolve) => {
    execFile(bin, ['--once'], { timeout: 2000 }, (err, stdout) => {
      if (err) {
        resolve(null)
        return
      }
      const lines = String(stdout).trim().split('\n')
      let result: SelectionEvent | null = null
      for (const line of lines) {
        parseLine(line, (sel) => {
          result = sel
        })
      }
      resolve(result)
    })
  })
}

/** Reads DEEPSEEK_API_KEY from the dsh CLI credentials file, if present. */
export function readDshApiKey(): string | null {
  try {
    const file = join(homedir(), '.dsh', '.credentials.yaml')
    if (!existsSync(file)) return null
    const m = readFileSync(file, 'utf-8').match(/^DEEPSEEK_API_KEY:\s*(\S+)\s*$/m)
    return m ? m[1] : null
  } catch {
    return null
  }
}
