import { screen, systemPreferences } from 'electron'
import { IPC, type TranslateSelectionPayload } from '../../shared/contracts'
import { getPrefs } from '../prefs'
import {
  captureSelectionOnce,
  ensureAccessibilityPermission,
  ensureSelectionWatcher,
  isSelectionWatchAvailable,
  isSelectionWatcherRunning,
  startSelectionWatcher,
  stopSelectionWatcher,
  type SelectionEvent
} from './selection-watcher'
import {
  ensureTooltipWindow,
  focusTooltip,
  getTooltipWindow,
  hideTooltip,
  presentTooltip
} from './tooltip'
import { streamTranslation } from './deepseek'

/**
 * Selection-translate session manager.
 *
 * The Swift watcher streams selection changes; a debounce waits for the
 * selection to stabilize (~400ms of quiet) before presenting the pill. While
 * the tooltip is visible, new selections are ignored to avoid feedback loops
 * with our own focused window (dismiss on blur first, then select again).
 *
 * The watcher dies instantly while the accessibility permission is missing,
 * so a slow poll re-checks the permission and (re)starts the watcher once it
 * is granted — no app restart needed.
 */

/** Selection must be quiet this long before the pill appears. */
const DEBOUNCE_MS = 400
/** Max characters sent to the API. */
const MAX_TEXT = 2000
/** Pill fallback size before the renderer reports its measured size. */
const PILL_SIZE = { width: 96, height: 36 }
/** Permission re-check interval while the watcher should be running. */
const PERM_POLL_MS = 10_000

let debounceTimer: NodeJS.Timeout | null = null
let lastSelection: SelectionEvent | null = null
let visible = false
let abortController: AbortController | null = null
let permPollTimer: NodeJS.Timeout | null = null

export function isTranslateTooltipVisible(): boolean {
  return visible
}

function containsCjk(text: string): boolean {
  return /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/.test(text)
}

/** 中文 → 英文，其他 → 中文. */
function detectTargetLang(text: string): 'en' | 'zh' {
  return containsCjk(text) ? 'en' : 'zh'
}

function sanitize(text: string): string | null {
  const trimmed = text.replace(/\u00a0/g, ' ').trim()
  if (trimmed.length < 2) return null
  return trimmed.length > MAX_TEXT ? `${trimmed.slice(0, MAX_TEXT)}…` : trimmed
}

/** Anchor point for the pill: bottom-left of the selection, or the cursor. */
function anchorOf(sel: SelectionEvent): { x: number; y: number } {
  if (sel.w > 0 && sel.h > 0) {
    return { x: sel.x, y: sel.y + sel.h }
  }
  const cursor = screen.getCursorScreenPoint()
  return { x: cursor.x, y: cursor.y }
}

function onWatcherSelection(sel: SelectionEvent | null): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  if (!sel || sel.pid === process.pid) {
    lastSelection = null
    return
  }
  lastSelection = sel
  if (!getPrefs().translate.autoPopup || visible) return
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    const stable = lastSelection
    if (!stable || visible) return
    const text = sanitize(stable.text)
    if (!text) return
    showPill(text, anchorOf(stable))
  }, DEBOUNCE_MS)
}

function showPill(text: string, anchor: { x: number; y: number }): void {
  ensureTooltipWindow()
  const payload: TranslateSelectionPayload = {
    text,
    targetLang: detectTargetLang(text),
    x: anchor.x,
    y: anchor.y
  }
  presentTooltip(payload, PILL_SIZE)
  visible = true
}

/** Global shortcut: query the current selection once and show the pill. */
export async function triggerTranslateShortcut(): Promise<void> {
  if (!(await ensureAccessibilityPermission())) return
  const sel = await captureSelectionOnce()
  if (!sel || sel.pid === process.pid) return
  const text = sanitize(sel.text)
  if (!text) return
  showPill(text, anchorOf(sel))
}

function stopPermPoll(): void {
  if (permPollTimer) {
    clearInterval(permPollTimer)
    permPollTimer = null
  }
}

/** Starts or stops the watcher to match the current prefs. */
export async function applyTranslatePrefs(): Promise<void> {
  const prefs = getPrefs().translate
  if (prefs.enabled && isSelectionWatchAvailable()) {
    if (!(await ensureSelectionWatcher())) return
    if (!isSelectionWatcherRunning()) {
      startSelectionWatcher(onWatcherSelection)
    }
    if (!permPollTimer) {
      // Restart the watcher (it exits while untrusted) once the permission
      // is granted; also revives it after helper crashes.
      permPollTimer = setInterval(() => {
        if (!getPrefs().translate.enabled) return
        if (isSelectionWatcherRunning()) return
        if (process.platform === 'darwin' && !systemPreferences.isTrustedAccessibilityClient(false))
          return
        startSelectionWatcher(onWatcherSelection)
      }, PERM_POLL_MS)
    }
    return
  }
  stopPermPoll()
  stopSelectionWatcher()
  dismissTooltip()
}

/** Called from IPC: the tooltip renderer starts a translation. */
export function requestTranslation(text: string, targetLang: 'en' | 'zh'): boolean {
  const win = getTooltipWindow()
  if (!win) return false
  focusTooltip()
  cancelTranslation()
  abortController = new AbortController()
  const controller = abortController
  void streamTranslation(text, targetLang === 'en', controller.signal, {
    onDelta: (full) => {
      if (getTooltipWindow() === win && !controller.signal.aborted) {
        win.webContents.send(IPC.translateChunk, { text: full })
      }
    }
  })
    .then((full) => {
      if (controller.signal.aborted) return
      win.webContents.send(IPC.translateDone, { ok: true, text: full })
    })
    .catch((err: unknown) => {
      if (controller.signal.aborted) return
      const message =
        err instanceof Error && err.message === 'aborted'
          ? '已取消'
          : err instanceof Error
            ? err.message
            : String(err)
      win.webContents.send(IPC.translateDone, { ok: false, text: message })
    })
  return true
}

export function cancelTranslation(): void {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
}

/** Called from IPC: hide the tooltip (Esc / blur / pill timeout). */
export function dismissTooltip(): void {
  cancelTranslation()
  hideTooltip()
  visible = false
}

/** App startup wiring: apply prefs and pre-warm the tooltip renderer. */
export async function setupTranslate(): Promise<void> {
  await applyTranslatePrefs()
  if (
    getPrefs().translate.enabled &&
    process.platform === 'darwin' &&
    !systemPreferences.isTrustedAccessibilityClient(false)
  ) {
    console.warn(
      '[translate] accessibility permission missing - 划词自动弹窗暂不可用，可在设置中授权'
    )
  }
}

export function teardownTranslate(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  stopPermPoll()
  cancelTranslation()
  stopSelectionWatcher()
  hideTooltip()
  visible = false
}
