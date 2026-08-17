/** Shortcut display/recording helpers shared by the screenshot UI. */

export function isMac(): boolean {
  return /Mac/i.test(navigator.userAgent)
}

/** 'CommandOrControl+Alt+A' → '⌘⇧A' style display on macOS, 'Ctrl+Alt+A' elsewhere. */
export function prettyAccelerator(accelerator: string): string {
  const parts = accelerator.split('+')
  const modMap: Record<string, string> = isMac()
    ? { CommandOrControl: '⌘', Alt: '⌥', Shift: '⇧', Control: '^' }
    : { CommandOrControl: 'Ctrl', Alt: 'Alt', Shift: 'Shift', Control: 'Ctrl' }
  return parts.map((p) => modMap[p] ?? p).join(isMac() ? '' : '+')
}

/** Builds an Electron accelerator string from a keydown event. */
export function acceleratorFromEvent(e: KeyboardEvent): string | null {
  const key = e.key
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) return null
  const mac = isMac()
  const parts: string[] = []
  const primary = mac ? e.metaKey : e.ctrlKey
  if (primary) parts.push('CommandOrControl')
  if (mac && e.ctrlKey) parts.push('Control')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  if (parts.length === 0) return null
  let k: string
  if (/^F\d{1,2}$/.test(key)) {
    k = key
  } else if (key.length === 1) {
    k = key.toUpperCase()
  } else {
    return null
  }
  return [...parts, k].join('+')
}
