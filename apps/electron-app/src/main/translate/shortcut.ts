import { globalShortcut } from 'electron'
import { triggerTranslateShortcut } from './manager'

let current: string | null = null

/** Registers (or re-registers) the global translate accelerator. */
export async function applyTranslateShortcut(accelerator: string): Promise<boolean> {
  if (current === accelerator) return true
  if (current) globalShortcut.unregister(current)
  const ok = globalShortcut.register(accelerator, () => {
    void triggerTranslateShortcut()
  })
  current = ok ? accelerator : null
  return ok
}

export function unregisterTranslateShortcut(): void {
  if (current) globalShortcut.unregister(current)
  current = null
}

/** Dry-run check: does another app already own this accelerator? */
export function validateTranslateAccelerator(accelerator: string): boolean {
  if (!accelerator) return false
  if (current === accelerator) return true
  const ok = globalShortcut.register(accelerator, () => {})
  if (ok) globalShortcut.unregister(accelerator)
  return ok
}
