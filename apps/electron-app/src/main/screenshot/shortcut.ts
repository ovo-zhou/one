import { globalShortcut } from 'electron'
import { startScreenshot } from './manager'

let current: string | null = null

/** Registers (or re-registers) the global screenshot accelerator. */
export async function applyScreenshotShortcut(accelerator: string): Promise<boolean> {
  if (current === accelerator) return true
  if (current) globalShortcut.unregister(current)
  const ok = globalShortcut.register(accelerator, () => {
    void startScreenshot()
  })
  current = ok ? accelerator : null
  return ok
}

export function unregisterScreenshotShortcut(): void {
  if (current) globalShortcut.unregister(current)
  current = null
}

/** Dry-run check: does another app already own this accelerator? */
export function validateAccelerator(accelerator: string): boolean {
  if (!accelerator) return false
  if (current === accelerator) return true
  const ok = globalShortcut.register(accelerator, () => {})
  if (ok) globalShortcut.unregister(accelerator)
  return ok
}
