import { app, dialog, Notification, shell, webContents } from 'electron'
import { execFile } from 'node:child_process'
import { createWriteStream, existsSync } from 'node:fs'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { promisify } from 'node:util'
import { IPC, type UpdateCheckResult, type UpdaterProgressPayload } from '../shared/contracts'
import { stopAllServices } from './ipc'
import { stopSelectionWatcher } from './translate/selection-watcher'
import { stopWindowDetect } from './screenshot/window-detect'

/**
 * Unsigned-app updater for macOS: mirrors install.sh — fetch the latest DMG
 * from GitHub Releases, mount it, replace the running .app bundle (with
 * rollback), then relaunch. Copies made by the app itself carry no quarantine
 * attribute, so Gatekeeper is never involved. electron-updater requires a
 * signed app on macOS (Squirrel.Mac), hence this custom flow.
 */

const REPO = 'ovo-zhou/one'
const APP_BUNDLE = 'Faceless.app'
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases/latest`
const RELEASES_PAGE = `https://github.com/${REPO}/releases/latest`
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

/**
 * Replaces the running .app with the one from the mounted DMG:
 * mv old → backup (same volume, instant), cp new in place, rm backup.
 * Any failure after the mv restores the backup.
 */
async function replaceAppBundle(srcApp: string): Promise<void> {
  const appPath = currentAppBundlePath()
  if (!appPath || !existsSync(appPath)) throw new Error('未找到当前应用安装位置')
  const backup = `${appPath}.old-${Date.now()}`

  await execFileP('mv', [appPath, backup])
  try {
    await execFileP('cp', ['-R', srcApp, appPath])
    const installed = await bundleVersion(appPath)
    if (!existsSync(join(appPath, 'Contents', 'Info.plist')) || !installed) {
      throw new Error('新版本安装校验失败')
    }
  } catch (err) {
    await execFileP('mv', [backup, appPath]).catch(() => {})
    throw err
  }
  // The live main process still runs from `backup`; its own binary can't be
  // unlinked while running, so a full removal here is expected to fail. The
  // leftover .old bundle is removed on the next launch (cleanupStaleBackups).
  // Best-effort only — a failure here must not fail the already-applied update.
  await rm(backup, { recursive: true, force: true }).catch(() => {})
}

/**
 * Stop every child process the app spawned from its own bundle (service
 * runtimes, whistle proxy, screenshot/translate helpers). Required before
 * swapping the .app during an update: those children keep files open inside
 * Contents/Resources, and an `rm` of the renamed .old bundle would otherwise
 * fail with ENOTEMPTY.
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
 * Remove stale `.old-<timestamp>` app bundles left beside the running app by
 * interrupted or in-app updates. Safe to call on startup: the live app runs
 * from the real bundle, not a `.old` one. Best-effort — a still-living old
 * process (e.g. during relaunch overlap) is simply skipped until next launch.
 */
export async function cleanupStaleBackups(): Promise<void> {
  const appPath = currentAppBundlePath()
  if (!appPath) return
  const parent = dirname(appPath)
  const base = basename(appPath)
  try {
    const entries = await readdir(parent)
    await Promise.allSettled(
      entries
        .filter((name) => name.startsWith(`${base}.old-`))
        .map((name) => rm(join(parent, name), { recursive: true, force: true }))
    )
  } catch {
    /* best-effort */
  }
}

/**
 * Full in-app update: download DMG → replace bundle → relaunch.
 * Progress is broadcast to all renderers and (optionally) macOS notifications.
 */
export async function startInAppUpdate(options: { notify: boolean }): Promise<boolean> {
  if (!updateSupported()) return false
  if (updating) return false
  updating = true

  const { notify: useNotify } = options
  let tmpDir: string | null = null
  let mountPoint: string | null = null

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
    // Stop children spawned from the current bundle so the renamed .old
    // directory can be removed (otherwise rm fails with ENOTEMPTY).
    await stopChildProcesses()
    await replaceAppBundle(srcApp)

    broadcast({ phase: 'restarting', percent: null, error: null })
    if (useNotify) notify('更新完成', '即将重启应用…')

    await execFileP('hdiutil', ['detach', mountPoint, '-quiet']).catch(() => {})
    mountPoint = null
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true })
      tmpDir = null
    }

    app.relaunch()
    // Graceful quit runs the before-quit cleanup chain (services, proxy, …);
    // force-exit after 5s in case a child hangs the shutdown.
    setTimeout(() => app.exit(0), 5_000)
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
    updating = false
  }
}

// ---------- menu / startup entry points ----------

/** Menu entry: check, then confirm and run the in-app update (browser fallback). */
export function manualCheckForUpdate(): void {
  void (async () => {
    if (!updateSupported()) {
      void dialog.showMessageBox({
        type: 'warning',
        message: '无法应用内更新',
        detail: '应用内更新仅支持 macOS 安装包版本。开发模式请参考 README 手动更新。'
      })
      return
    }
    const check = await checkForUpdates()
    if (check.error || !check.latestVersion) {
      void dialog.showMessageBox({
        type: 'warning',
        message: '检查更新失败',
        detail: `${check.error ?? '未知错误'}\n\n也可以直接访问发布页：${RELEASES_PAGE}`
      })
      return
    }
    if (!check.hasUpdate) {
      void dialog.showMessageBox({
        type: 'info',
        message: '已是最新版本',
        detail: `当前版本 v${check.currentVersion}`
      })
      return
    }
    const result = await dialog.showMessageBox({
      type: 'info',
      message: `发现新版本 v${check.latestVersion}`,
      detail: `当前版本 v${check.currentVersion}\n\n${(check.notes ?? '').slice(0, 500)}`,
      buttons: ['立即更新', '前往下载页', '稍后再说'],
      defaultId: 0,
      cancelId: 2
    })
    if (result.response === 0) {
      await startInAppUpdate({ notify: true })
    } else if (result.response === 1) {
      void shell.openExternal(RELEASES_PAGE)
    }
  })()
}

/** Silent check shortly after launch; auto-updates in place when a release exists. */
export function setupAutoCheck(): void {
  setTimeout(() => {
    void (async () => {
      if (!updateSupported()) return
      const check = await checkForUpdates()
      if (check.hasUpdate && check.latestVersion) {
        await startInAppUpdate({ notify: true })
      }
    })()
  }, 8_000)
}
