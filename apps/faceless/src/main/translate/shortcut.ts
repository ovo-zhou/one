import { globalShortcut } from 'electron'
import { TRANSLATE_SHORTCUT } from '../prefs'
import { triggerTranslateShortcut } from './manager'

let current: string | null = null

/** Registers (or re-registers) the fixed global translate accelerator. */
export async function applyTranslateShortcut(): Promise<boolean> {
  if (current === TRANSLATE_SHORTCUT) return true
  if (current) globalShortcut.unregister(current)
  const ok = globalShortcut.register(TRANSLATE_SHORTCUT, () => {
    void triggerTranslateShortcut()
  })
  current = ok ? TRANSLATE_SHORTCUT : null
  return ok
}

export function unregisterTranslateShortcut(): void {
  if (current) globalShortcut.unregister(current)
  current = null
}
