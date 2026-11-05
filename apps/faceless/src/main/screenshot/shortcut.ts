import { globalShortcut } from 'electron'
import { SCREENSHOT_SHORTCUT } from '../prefs'
import { startScreenshot } from './manager'

let current: string | null = null

/** Registers (or re-registers) the fixed global screenshot accelerator. */
export async function applyScreenshotShortcut(): Promise<boolean> {
  if (current === SCREENSHOT_SHORTCUT) return true
  if (current) globalShortcut.unregister(current)
  const ok = globalShortcut.register(SCREENSHOT_SHORTCUT, () => {
    void startScreenshot()
  })
  current = ok ? SCREENSHOT_SHORTCUT : null
  return ok
}

export function unregisterScreenshotShortcut(): void {
  if (current) globalShortcut.unregister(current)
  current = null
}
