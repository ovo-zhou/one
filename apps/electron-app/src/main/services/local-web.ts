import { spawn, type ChildProcess } from 'child_process'
import { existsSync, realpathSync } from 'fs'
import { delimiter, dirname, join } from 'path'
import type { ModuleServiceStatus } from '../../shared/contracts'
import { BaseModuleService } from './base'

const STOP_TIMEOUT_MS = 5_000
const MAX_RESTARTS = 3

/**
 * Resolve the Node.js binary bundled with the app (resources/services/
 * node-runtime, installed by scripts/install-services.sh). Falls back to
 * the system PATH node for dev setups that skipped the installer.
 */
export function resolveServicesNode(): string {
  const candidates = [
    // Dev: apps/electron-app/resources/services/node-runtime (out/main -> ../../)
    join(__dirname, '../../resources/services/node-runtime/bin/node'),
    // Packaged: <resources>/services/node-runtime
    join(process.resourcesPath, 'services/node-runtime/bin/node')
  ]
  for (const bin of candidates) {
    if (existsSync(bin)) return bin
  }
  return 'node'
}

/**
 * Base class for module services backed by a local web server process
 * (from node_modules): lazy start, readiness detection, crash restart with
 * backoff, process-group cleanup on quit.
 *
 * Services run on a bundled real Node.js runtime (resources/services/
 * node-runtime) so native modules work and subprocesses spawned by the
 * services themselves (process.execPath) stay plain node processes —
 * never GUI Electron instances. User machines need no system Node.js.
 */
export abstract class LocalWebService extends BaseModuleService {
  protected abstract readonly serviceName: string
  /** npm package name providing the service CLI. */
  protected abstract readonly packageName: string
  /** JS entry file of the package CLI, relative to the package root. */
  protected abstract readonly packageBinEntry: string
  protected abstract readonly binName: string

  protected get startTimeoutMs(): number {
    return 60_000
  }

  private child: ChildProcess | null = null
  private startPromise: Promise<ModuleServiceStatus> | null = null
  private restarts = 0
  protected intentionalStop = false
  private output = ''

  async start(): Promise<ModuleServiceStatus> {
    if (this.startPromise) return this.startPromise
    if (this.status.phase === 'ready') return this.getStatus()

    this.startPromise = this.doStart().finally(() => {
      this.startPromise = null
    })
    return this.startPromise
  }

  async stop(): Promise<void> {
    this.intentionalStop = true
    await this.killChild()
    this.setStatus({ phase: 'stopped', url: null })
  }

  /** Override to reuse an already-running external instance instead of spawning. */
  protected async findExternalInstance(): Promise<string | null> {
    return null
  }

  protected binArgs(): string[] {
    return []
  }

  protected binEnv(): NodeJS.ProcessEnv {
    return {}
  }

  protected binCwd(): string | null {
    return null
  }

  /**
   * Resolve the service URL once the process is ready; reject with a
   * human-readable message on failure. `getOutput` returns accumulated
   * stdout+stderr, useful for URL discovery.
   */
  protected abstract waitForReady(child: ChildProcess, getOutput: () => string): Promise<string>

  /**
   * Locate the package root in dev (resources/services install, resolving
   * npm/junction symlinks) and when packaged (extraResources/services).
   * Returns the absolute path of the CLI JS entry file.
   */
  protected resolveEntry(): string {
    const pkgDir = join('node_modules', this.packageName)
    const candidates = [
      // Dev: apps/electron-app/resources/services (out/main/index.js -> ../../)
      join(__dirname, '../../resources/services', pkgDir),
      // Packaged: <resources>/services
      join(process.resourcesPath, 'services', pkgDir)
    ]
    for (const root of candidates) {
      if (existsSync(root)) return join(realpathSync(root), this.packageBinEntry)
    }
    throw new Error(
      `${this.binName} package not found. Run \`pnpm install:services\` in apps/electron-app first.`
    )
  }

  /** Spawn the CLI on the bundled Node.js runtime. */
  protected spawnService(args: string[], cwd: string | null): ChildProcess {
    // Prepend the bundled node dir to PATH so subprocesses spawned by the
    // service itself (e.g. whistle's pfork children resolve `node` from
    // PATH) also use the bundled runtime on machines without system Node.
    const nodeBin = resolveServicesNode()
    return spawn(nodeBin, [this.resolveEntry(), ...args], {
      cwd: cwd ?? undefined,
      env: {
        ...process.env,
        ...this.binEnv(),
        PATH: `${dirname(nodeBin)}${delimiter}${process.env.PATH ?? ''}`
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true
    })
  }

  protected killTree(child: ChildProcess): void {
    if (child.pid == null) return
    try {
      // We spawn detached so the child gets its own process group; kill the group.
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      child.kill('SIGTERM')
    }
  }

  private async doStart(): Promise<ModuleServiceStatus> {
    this.intentionalStop = false

    const externalUrl = await this.findExternalInstance()
    if (externalUrl) {
      this.child = null
      this.setStatus({ phase: 'ready', url: externalUrl, error: null })
      return this.getStatus()
    }

    return await this.launch()
  }

  /** Crash-restart path: skips external reuse and keeps the restart counter. */
  private async restart(): Promise<ModuleServiceStatus> {
    if (this.status.phase === 'ready') return this.getStatus()
    return await this.launch()
  }

  private async killChild(): Promise<void> {
    const child = this.child
    this.child = null
    if (!child) return
    this.killTree(child)
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        try {
          if (child.pid != null) process.kill(-child.pid, 'SIGKILL')
        } catch {
          /* already dead */
        }
        resolve()
      }, STOP_TIMEOUT_MS)
      child.once('exit', () => {
        clearTimeout(timer)
        resolve()
      })
    })
  }

  private async launch(): Promise<ModuleServiceStatus> {
    const name = this.serviceName
    this.setStatus({ phase: 'starting', url: null, error: null })

    return await new Promise<ModuleServiceStatus>((resolve, reject) => {
      let settled = false
      this.output = ''

      let child: ChildProcess
      try {
        child = this.spawnService(this.binArgs(), this.binCwd())
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)))
        return
      }
      this.child = child

      const timeout = setTimeout(() => {
        if (settled) return
        settled = true
        this.intentionalStop = true
        void this.killChild().finally(() => {
          this.setStatus({ phase: 'error', error: `${name} startup timed out` })
        })
        reject(new Error(`${name} startup timed out`))
      }, this.startTimeoutMs)

      const finish = (url: string): void => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        this.restarts = 0
        this.setStatus({ phase: 'ready', url, error: null })
        resolve(this.getStatus())
      }

      const fail = (message: string): void => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        this.child = null
        this.setStatus({ phase: 'error', url: null, error: message })
        reject(new Error(message))
      }

      const collect = (data: Buffer): void => {
        this.output += data.toString()
      }
      child.stdout?.on('data', collect)
      child.stderr?.on('data', collect)

      child.once('error', (err) => {
        fail(`Failed to start ${name}: ${err.message}`)
      })

      child.once('exit', (code) => {
        if (settled) {
          // Died after ready: crash restart with backoff.
          if (!this.intentionalStop && this.restarts < MAX_RESTARTS) {
            this.restarts += 1
            const delay = Math.min(1000 * 2 ** (this.restarts - 1), 8000)
            this.setStatus({
              phase: 'starting',
              url: null,
              error: `${name} exited (${code}), restarting`
            })
            setTimeout(() => {
              void this.restart().catch(() => {})
            }, delay)
          } else if (!this.intentionalStop) {
            this.setStatus({
              phase: 'error',
              url: null,
              error: `${name} exited unexpectedly (${code})`
            })
          }
          return
        }
        fail(this.output.trim() || `${name} exited during startup (${code})`)
      })

      this.waitForReady(child, () => this.output).then(
        (url) => finish(url),
        (err) => fail(err instanceof Error ? err.message : String(err))
      )
    })
  }
}
