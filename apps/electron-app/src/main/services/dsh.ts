import type { ChildProcess } from 'child_process'
import { app } from 'electron'
import { LocalWebService } from './local-web'

const URL_PATTERN = /https?:\/\/[^\s"'<>]+/

/**
 * Manages the `dsh web` server process: lazy start on a random port, URL
 * discovery from stdout, crash restart with backoff, cleanup on quit.
 */
export class DshService extends LocalWebService {
  protected readonly serviceName = 'dsh'
  protected readonly binName = 'dsh'

  protected binArgs(): string[] {
    return ['web', '--port', '0']
  }

  protected binEnv(): NodeJS.ProcessEnv {
    return { DSH_TELEMETRY_DISABLED: '1' }
  }

  protected binCwd(): string | null {
    // dsh uses its invoking directory as the default filesystem location.
    return app.getPath('home')
  }

  protected waitForReady(child: ChildProcess, getOutput: () => string): Promise<string> {
    return new Promise((resolve) => {
      const onData = (): void => {
        const match = URL_PATTERN.exec(getOutput())
        if (match) {
          cleanup()
          let url = match[0]
          if (url.endsWith('.')) url = url.slice(0, -1)
          resolve(url)
        }
      }
      const cleanup = (): void => {
        child.stdout?.removeListener('data', onData)
        child.stderr?.removeListener('data', onData)
      }
      child.stdout?.on('data', onData)
      child.stderr?.on('data', onData)
    })
  }
}
