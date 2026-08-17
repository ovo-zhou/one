import { execFile, spawn } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { createRequire } from 'module'
import { getPrefs, setPrefs } from './prefs'

const WHISTLE_HOST = '127.0.0.1'
const WHISTLE_PORT = 8899

interface SetGlobalProxy {
  enableProxy(options: { host: string; port: number; sudo?: boolean }): boolean
  disableProxy(sudo?: boolean): boolean
  getServerProxy(callback: (err: Error | null, conf: unknown) => void): void
  sudoMacProxyHelper(
    sudoPrompt: (cmd: string, callback: (err: Error | null, stdout?: string) => void) => void
  ): Promise<void> | undefined
}

// CJS interop: the package ships neither ESM nor its own types.
const sgp = createRequire(import.meta.url)('set-global-proxy') as SetGlobalProxy

export interface SystemProxyState {
  enabled: boolean
  host: string | null
  port: number | null
}

interface RawProxyConf {
  http: { enabled?: boolean; host?: string; port?: string }
  https: { enabled?: boolean; host?: string; port?: string }
}

/** Ask macOS for an administrator password via a native GUI dialog. */
function osascriptSudo(cmd: string, callback: (err: Error | null, stdout?: string) => void): void {
  const script = `do shell script "${cmd.replace(/"/g, '\\"')}" with administrator privileges with prompt "All in One 需要修改系统代理设置"`
  execFile('osascript', ['-e', script], (err, stdout) =>
    callback(
      err instanceof Error ? err : err ? new Error(String(err)) : null,
      stdout == null ? undefined : String(stdout)
    )
  )
}

function readProxyState(callback: (state: SystemProxyState) => void): void {
  sgp.getServerProxy((err, conf) => {
    if (err || !conf) {
      callback({ enabled: false, host: null, port: null })
      return
    }
    const raw = conf as RawProxyConf
    const enabled = Boolean(raw.http?.enabled || raw.https?.enabled)
    callback({
      enabled,
      host: raw.http?.host ?? raw.https?.host ?? null,
      port: raw.http?.port ? Number(raw.http.port) : raw.https?.port ? Number(raw.https.port) : null
    })
  })
}

export function getSystemProxyState(): Promise<SystemProxyState> {
  return new Promise((resolve) => readProxyState(resolve))
}

/**
 * Enable/disable the system proxy (127.0.0.1:8899). On first use the
 * setuid helper needs a one-time admin authorization (native GUI prompt).
 */
export async function setSystemProxy(enabled: boolean): Promise<{ ok: boolean; message: string }> {
  try {
    if (enabled) {
      await sgp.sudoMacProxyHelper(osascriptSudo)
      const ok = sgp.enableProxy({ host: WHISTLE_HOST, port: WHISTLE_PORT })
      setPrefs({ systemProxyEnabledByApp: ok })
      return {
        ok,
        message: ok
          ? `系统代理已开启 (${WHISTLE_HOST}:${WHISTLE_PORT})`
          : '开启系统代理失败，请重试'
      }
    }
    const ok = sgp.disableProxy()
    setPrefs({ systemProxyEnabledByApp: false })
    return { ok, message: ok ? '系统代理已关闭' : '关闭系统代理失败，请重试' }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) }
  }
}

/** Whether the current proxy was enabled by this app (crash-safe marker). */
export function proxyEnabledByApp(): boolean {
  return getPrefs().systemProxyEnabledByApp
}

/** Best-effort proxy cleanup on quit; never throws. */
export async function disableProxyIfOwned(): Promise<void> {
  if (!proxyEnabledByApp()) return
  try {
    sgp.disableProxy()
  } catch {
    /* best effort */
  }
  setPrefs({ systemProxyEnabledByApp: false })
}

function resolveW2Bin(): string {
  const dev = join(__dirname, '../../node_modules/.bin/w2')
  if (existsSync(dev)) return dev
  const packaged = join(process.resourcesPath, 'w2', 'node_modules/.bin', 'w2')
  if (existsSync(packaged)) return packaged
  throw new Error('w2 binary not found')
}

/**
 * Install the whistle root CA for HTTPS interception: fetches the cert from
 * the running whistle instance and adds it to the login keychain (macOS
 * shows a native trust dialog).
 */
export async function installRootCa(): Promise<{ ok: boolean; message: string }> {
  return await new Promise((resolve) => {
    let child
    try {
      child = spawn(
        resolveW2Bin(),
        ['ca', '--host', WHISTLE_HOST, '--port', String(WHISTLE_PORT)],
        {
          stdio: ['ignore', 'pipe', 'pipe']
        }
      )
    } catch (err) {
      resolve({ ok: false, message: err instanceof Error ? err.message : String(err) })
      return
    }

    let output = ''
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      child.kill('SIGKILL')
      resolve({ ok: false, message: '安装根证书超时' })
    }, 120_000)

    const settle = (ok: boolean): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (ok) {
        resolve({ ok: true, message: '根证书安装成功' })
      } else {
        resolve({
          ok: false,
          message:
            output.includes('failed') || output.includes('Error')
              ? `安装失败: ${output.trim().split('\n').pop() ?? ''}`
              : '安装失败，请重试'
        })
      }
    }

    child.stdout?.on('data', (d: Buffer) => {
      output += d.toString()
      if (output.includes('Successfully installed')) settle(true)
    })
    child.stderr?.on('data', (d: Buffer) => {
      output += d.toString()
    })
    child.once('error', (err) => {
      clearTimeout(timer)
      settled = true
      resolve({ ok: false, message: `启动 w2 失败: ${err.message}` })
    })
    child.once('exit', () => {
      settle(output.includes('Successfully installed'))
    })
  })
}
