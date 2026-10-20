import { app, Notification, webContents } from 'electron'
import { execFile, spawn } from 'node:child_process'
import { createWriteStream, existsSync } from 'node:fs'
import { mkdtemp, open, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { promisify } from 'node:util'
import { IPC, type UpdateCheckResult, type UpdaterProgressPayload } from '../shared/contracts'
import { UPDATE_INSTALLER_SCRIPT } from './update-installer'
import { stopAllServices } from './ipc'
import { stopSelectionWatcher } from './translate/selection-watcher'
import { stopWindowDetect } from './screenshot/window-detect'

/**
 * Unsigned-app updater for macOS: mirrors install.sh — fetch the latest DMG
 * from GitHub Releases, stage and validate it, then hand off installation
 * to an independent process that waits for the app to exit. Copies made by the app itself carry no quarantine
 * attribute, so Gatekeeper is never involved. electron-updater requires a
 * signed app on macOS (Squirrel.Mac), hence this custom flow.
 */

const REPO = 'ovo-zhou/one'
const APP_BUNDLE = 'Faceless.app'
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases/latest`
const UA = 'faceless-updater'

const execFileP = promisify(execFile)

interface ReleaseAsset {
  name: string
  browser_download_url: string
}

interface ReleaseInfo {
  tag_name?: string
  body?: string
  html_url?: string
  assets?: ReleaseAsset[]
}

function parseVersion(tag: string): number[] {
  return tag
    .replace(/^v/, '')
    .split('.')
    .map((n) => Number.parseInt(n, 10) || 0)
}

function isNewer(tag: string, current: string): boolean {
  const a = parseVersion(tag)
  const b = parseVersion(current)
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0)
    if (diff !== 0) return diff > 0
  }
  return false
}

async function fetchLatestRelease(): Promise<ReleaseInfo | null> {
  try {
    const res = await fetch(RELEASES_API, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(10_000)
    })
    if (!res.ok) return null
    return (await res.json()) as ReleaseInfo
  } catch {
    return null
  }
}

/** In-app updates need a packaged macOS build (dev runs have no .app bundle). */
export function updateSupported(): boolean {
  return app.isPackaged && process.platform === 'darwin'
}

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const current = app.getVersion()
  if (!updateSupported()) {
    return {
      supported: false,
      hasUpdate: false,
      currentVersion: current,
      latestVersion: null,
      notes: null,
      error: null
    }
  }
  const release = await fetchLatestRelease()
  const tag = release?.tag_name
  if (!tag) {
    return {
      supported: true,
      hasUpdate: false,
      currentVersion: current,
      latestVersion: null,
      notes: null,
      error: '无法获取最新版本信息，请检查网络后重试。'
    }
  }
  return {
    supported: true,
    hasUpdate: isNewer(tag, current),
    currentVersion: current,
    latestVersion: tag.replace(/^v/, ''),
    notes: (release?.body ?? '').slice(0, 1000) || null,
    error: null
  }
}

// ---------- install ----------

let updating = false

function broadcast(payload: UpdaterProgressPayload): void {
  for (const wc of webContents.getAllWebContents()) {
    wc.send(IPC.updaterProgress, payload)
  }
}

function notify(title: string, body: string): void {
  if (!Notification.isSupported()) return
  new Notification({ title, body }).show()
}

function dmgArch(): string {
  return process.arch === 'arm64' ? 'arm64' : 'x64'
}

function pickDmgAsset(release: ReleaseInfo): ReleaseAsset | null {
  const arch = dmgArch()
  return (
    release.assets?.find((a) => a.name === `faceless-${latestVersion(release)}-${arch}.dmg`) ??
    release.assets?.find((a) => a.name.endsWith(`-${arch}.dmg`)) ??
    null
  )
}

function latestVersion(release: ReleaseInfo): string {
  return (release.tag_name ?? '').replace(/^v/, '')
}

/** Path of the running .app bundle, e.g. /Applications/Faceless.app. */
function currentAppBundlePath(): string | null {
  const exe = app.getPath('exe')
  const marker = '/Contents/'
  const idx = exe.indexOf(marker)
  if (idx > 0) return exe.slice(0, idx)
  let dir = dirname(exe)
  while (true) {
    if (basename(dir).endsWith('.app')) return dir
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

async function downloadWithProgress(
  url: string,
  dest: string,
  onPercent: (percent: number) => void
): Promise<void> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    redirect: 'follow',
    signal: AbortSignal.timeout(10 * 60_000)
  })
  if (!res.ok || !res.body) throw new Error(`下载失败（HTTP ${res.status}）`)
  const total = Number(res.headers.get('content-length')) || 0
  let received = 0
  await pipeline(
    Readable.fromWeb(res.body as import('node:stream/web').ReadableStream<Uint8Array>),
    new Transform({
      transform(chunk, _enc, cb) {
        received += chunk.length
        if (total > 0) onPercent(Math.min(99, Math.floor((received / total) * 100)))
        cb(null, chunk)
      }
    }),
    createWriteStream(dest)
  )
}

/** Mounts the DMG and returns the mount point under /Volumes. */
async function mountDmg(dmgPath: string): Promise<string> {
  const { stdout } = await execFileP('hdiutil', ['attach', dmgPath, '-nobrowse'])
  const mountPoint = stdout
    .split('\n')
    .map((line) => line.split('\t').at(-1)?.trim() ?? '')
    .find((p) => p.startsWith('/Volumes/'))
  if (!mountPoint) throw new Error('挂载 DMG 失败')
  return mountPoint
}

async function bundleVersion(appPath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileP('plutil', [
      '-extract',
      'CFBundleShortVersionString',
      'raw',
      join(appPath, 'Contents', 'Info.plist')
    ])
    return stdout.trim()
  } catch {
    return null
  }
}

/** Prepare on the same volume, so the installer can swap directories by rename. */
async function stageAppBundle(srcApp: string, expectedVersion: string): Promise<string> {
  const appPath = currentAppBundlePath()
  if (!appPath || !existsSync(appPath)) throw new Error('未找到当前应用安装位置')
  const staging = await mkdtemp(join(dirname(appPath), '.faceless-update-'))
  try {
    const stagedApp = join(staging, APP_BUNDLE)
    await execFileP('/usr/bin/ditto', [srcApp, stagedApp])
    if ((await bundleVersion(stagedApp)) !== expectedVersion) {
      throw new Error('新版本安装校验失败')
    }
    return staging
  } catch (err) {
    await rm(staging, { recursive: true, force: true }).catch(() => {})
    throw err
  }
}

/** The system shell and script survive replacement of the Electron bundle. */
async function startInstaller(staging: string): Promise<void> {
  const appPath = currentAppBundlePath()
  if (!appPath) throw new Error('未找到当前应用安装位置')
  const script = join(staging, 'install.sh')
  await writeFile(script, UPDATE_INSTALLER_SCRIPT, { mode: 0o700 })
  const log = await open(join(app.getPath('userData'), 'update-install.log'), 'a', 0o600)
  const child = spawn('/bin/bash', [script, appPath, staging, String(process.pid)], {
    detached: true,
    cwd: '/',
    stdio: ['ignore', log.fd, log.fd]
  })
  try {
    await new Promise<void>((resolve, reject) => {
      child.once('spawn', resolve)
      child.once('error', reject)
    })
    child.unref()
    for (let attempt = 0; attempt < 100; attempt++) {
      if (existsSync(join(staging, 'ready'))) return
      if (child.exitCode !== null) break
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    child.kill()
    throw new Error('无法启动独立安装进程，已取消更新')
  } finally {
    await log.close()
  }
}

/**
 * Stop every child process the app spawned from its own bundle (service
 * runtimes, whistle proxy, screenshot/translate helpers). Required before
 * deleting the .app during an update: those children keep files open inside
 * Contents/Resources and can interfere with removal.
 */
async function stopChildProcesses(): Promise<void> {
  await Promise.allSettled([stopAllServices()])
  try {
    stopSelectionWatcher()
  } catch {
    /* not running — ignore */
  }
  try {
    stopWindowDetect()
  } catch {
    /* not running — ignore */
  }
}

/**
 * Full in-app update: download → stage → start installer → quit.
 * Progress is broadcast to all renderers and (optionally) macOS notifications.
 */
export async function startInAppUpdate(options: { notify: boolean }): Promise<boolean> {
  if (!updateSupported()) return false
  if (updating) return false
  updating = true

  const { notify: useNotify } = options
  let tmpDir: string | null = null
  let mountPoint: string | null = null
  let staging: string | null = null
  let handedOff = false

  try {
    const release = await fetchLatestRelease()
    const tag = release?.tag_name
    if (!tag) throw new Error('无法获取最新版本信息，请检查网络后重试。')
    if (!isNewer(tag, app.getVersion())) return false

    const asset = pickDmgAsset(release)
    if (!asset) throw new Error(`未找到 ${dmgArch()} 架构的 DMG 安装包`)

    tmpDir = await mkdtemp(join(tmpdir(), 'aio-update-'))
    const dmgPath = join(tmpDir, asset.name)

    broadcast({ phase: 'downloading', percent: 0, error: null })
    if (useNotify) notify('发现新版本', `正在下载 v${latestVersion(release)}…`)
    await downloadWithProgress(asset.browser_download_url, dmgPath, (percent) => {
      broadcast({ phase: 'downloading', percent, error: null })
    })

    broadcast({ phase: 'installing', percent: null, error: null })
    mountPoint = await mountDmg(dmgPath)
    const srcApp = join(mountPoint, APP_BUNDLE)
    if (!existsSync(srcApp)) throw new Error(`安装包内未找到 ${APP_BUNDLE}`)
    const version = latestVersion(release)
    if ((await bundleVersion(srcApp)) !== version) {
      throw new Error(`安装包版本校验失败，期望版本为 ${version}`)
    }
    staging = await stageAppBundle(srcApp, version)

    await execFileP('hdiutil', ['detach', mountPoint, '-quiet']).catch(() => {})
    mountPoint = null
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true })
      tmpDir = null
    }

    await stopChildProcesses()
    await startInstaller(staging)
    broadcast({ phase: 'restarting', percent: null, error: null })
    if (useNotify) notify('正在安装更新', '应用退出后将安装并重新打开…')
    await writeFile(join(staging, 'install'), '')
    handedOff = true
    // Normal shutdown also resets the proxy and tears down helpers. The installer
    // aborts without changing the app if shutdown fails to finish in time.
    app.quit()
    return true
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    broadcast({ phase: 'error', percent: null, error: message })
    if (useNotify) notify('更新失败', `${message}\n可前往发布页手动下载。`)
    return false
  } finally {
    if (mountPoint) await execFileP('hdiutil', ['detach', mountPoint, '-quiet']).catch(() => {})
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true }).catch(() => {})
    if (staging && !handedOff) {
      await rm(staging, { recursive: true, force: true }).catch(() => {})
    }
    updating = handedOff
  }
}

// ---------- startup entry point ----------

/** Acknowledge only a sibling installer directory prepared by our updater. */
export async function confirmUpdateStartup(): Promise<void> {
  const prefix = '--faceless-update-ready='
  const staging = process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length)
  const appPath = currentAppBundlePath()
  if (
    !staging ||
    !appPath ||
    dirname(staging) !== dirname(appPath) ||
    !basename(staging).startsWith('.faceless-update-') ||
    !existsSync(join(staging, 'install'))
  ) {
    return
  }
  await writeFile(join(staging, 'launched'), '', { flag: 'wx' }).catch(() => {})
}

/** Silent check shortly after launch; the renderer surfaces available updates in Settings. */
export function setupAutoCheck(): void {
  setTimeout(() => {
    void (async () => {
      if (!updateSupported()) return
      const check = await checkForUpdates()
      if (check.hasUpdate && check.latestVersion) {
        broadcast({
          phase: 'available',
          percent: null,
          error: null,
          version: check.latestVersion,
          notes: check.notes
        })
      }
    })()
  }, 8_000)
}
