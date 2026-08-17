import { LocalWebService } from './local-web'

const WHISTLE_PORT = 8899
const WHISTLE_URL = `http://127.0.0.1:${WHISTLE_PORT}`
const PROBE_TIMEOUT_MS = 1500
const PROBE_INTERVAL_MS = 500

async function isWhistleUp(): Promise<boolean> {
  try {
    const res = await fetch(WHISTLE_URL, { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) })
    // Any non-server-error HTTP response means the web UI is serving.
    return res.status < 500
  } catch {
    return false
  }
}

/**
 * Manages the whistle proxy (`w2 run` in foreground mode): fixed port 8899
 * (stable port for system/browser proxy config), readiness via HTTP polling.
 * If an external whistle instance already owns the port, it is reused and
 * left running on stop.
 */
export class WhistleService extends LocalWebService {
  protected readonly serviceName = 'whistle'
  protected readonly binName = 'w2'

  protected get startTimeoutMs(): number {
    return 30_000
  }

  protected binArgs(): string[] {
    return ['run', '--port', String(WHISTLE_PORT)]
  }

  protected async findExternalInstance(): Promise<string | null> {
    return (await isWhistleUp()) ? WHISTLE_URL : null
  }

  protected async waitForReady(): Promise<string> {
    const deadline = Date.now() + this.startTimeoutMs
    while (Date.now() < deadline) {
      if (await isWhistleUp()) return WHISTLE_URL
      await new Promise((resolve) => setTimeout(resolve, PROBE_INTERVAL_MS))
    }
    throw new Error('whistle did not become ready in time')
  }
}
