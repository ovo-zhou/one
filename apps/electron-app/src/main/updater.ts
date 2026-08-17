import { app, dialog, shell } from 'electron'

const REPO = 'ovo-zhou/one'
// Toggle when the app is signed & notarized: switch to electron-updater
// full auto-update. Manual-check flow works unsigned.
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases/latest`
const RELEASES_PAGE = `https://github.com/${REPO}/releases/latest`

interface ReleaseInfo {
  tag_name?: string
  name?: string
  html_url?: string
  body?: string
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
      headers: { 'User-Agent': 'all-in-one-updater' },
      signal: AbortSignal.timeout(10_000)
    })
    if (!res.ok) return null
    return (await res.json()) as ReleaseInfo
  } catch {
    return null
  }
}

async function checkForUpdate(silent: boolean): Promise<void> {
  const release = await fetchLatestRelease()
  const tag = release?.tag_name

  if (!tag) {
    if (!silent) {
      void dialog.showMessageBox({
        type: 'warning',
        message: '检查更新失败',
        detail: '无法获取最新版本信息，请检查网络后重试，或直接访问发布页。'
      })
    }
    return
  }

  if (!isNewer(tag, app.getVersion())) {
    if (!silent) {
      void dialog.showMessageBox({
        type: 'info',
        message: '已是最新版本',
        detail: `当前版本 v${app.getVersion()}`
      })
    }
    return
  }

  const result = await dialog.showMessageBox({
    type: 'info',
    message: `发现新版本 ${tag}`,
    detail: `当前版本 v${app.getVersion()}\n\n${(release?.body ?? '').slice(0, 500)}`,
    buttons: ['前往下载', '稍后再说'],
    defaultId: 0,
    cancelId: 1
  })
  if (result.response === 0) {
    void shell.openExternal(release?.html_url ?? RELEASES_PAGE)
  }
}

/** Manual menu entry. */
export function manualCheckForUpdate(): void {
  void checkForUpdate(false)
}

/** Silent check shortly after launch; only prompts when a new version exists. */
export function setupAutoCheck(): void {
  setTimeout(() => {
    void checkForUpdate(true)
  }, 8_000)
}
