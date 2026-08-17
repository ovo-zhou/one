import { useCallback, useEffect, useRef, useState } from 'react'
import type { TranslateTargetLang } from '../../../shared/contracts'
import { Button } from '../components/ui/button'

/**
 * Selection-translate tooltip.
 *
 * Two visual modes driven by main-process pushes:
 *  - pill:    a tiny "翻译" button shown next to a stable selection
 *  - card:    streaming translation result with copy / retry / lang actions
 *
 * The window itself is a transparent frameless BrowserWindow kept warm by
 * the main process; this renderer measures its content and asks main to
 * resize the window to fit (translate:resize).
 */

type Mode = 'idle' | 'pill' | 'loading' | 'streaming' | 'error' | 'done'

const PILL_TIMEOUT_MS = 4000
const CARD_WIDTH = 420
const CARD_MAX_HEIGHT = 340

export default function TranslateApp(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('idle')
  const [text, setText] = useState('')
  const [targetLang, setTargetLang] = useState<TranslateTargetLang>('en')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const pillTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSize = useRef<{ w: number; h: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const clearPillTimer = (): void => {
    if (pillTimer.current) {
      clearTimeout(pillTimer.current)
      pillTimer.current = null
    }
  }

  const dismiss = useCallback((): void => {
    clearPillTimer()
    setMode('idle')
    setResult('')
    setError('')
    setCopied(false)
    void window.api.dismissTranslate()
  }, [])

  const request = useCallback((t: string, lang: TranslateTargetLang): void => {
    setMode('loading')
    setResult('')
    setError('')
    setCopied(false)
    void window.api.requestTranslate({ text: t, targetLang: lang })
  }, [])

  useEffect(() => {
    const offSelection = window.api.onTranslateSelection((payload) => {
      clearPillTimer()
      setText(payload.text)
      setTargetLang(payload.targetLang)
      setMode('pill')
      pillTimer.current = setTimeout(dismiss, PILL_TIMEOUT_MS)
    })
    const offChunk = window.api.onTranslateChunk((payload) => {
      setMode('streaming')
      setResult(payload.text)
    })
    const offDone = window.api.onTranslateDone((payload) => {
      if (payload.ok) {
        setResult(payload.text)
        setMode('done')
      } else {
        setError(payload.text)
        setMode('error')
      }
    })
    return () => {
      offSelection()
      offChunk()
      offDone()
    }
  }, [dismiss])

  // Esc closes the card (the window has focus while translating).
  useEffect(() => {
    if (mode === 'idle') return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        dismiss()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [mode, dismiss])

  // Clicking anywhere outside the tooltip dismisses it.
  useEffect(() => {
    if (mode === 'idle') return
    const onBlur = (): void => {
      if (mode === 'pill' || mode === 'done' || mode === 'error') dismiss()
      // streaming/loading: keep the card visible, the stream keeps running.
    }
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [mode, dismiss])

  // Keep the window size glued to the measured content.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const report = (): void => {
      const w = mode === 'pill' ? el.scrollWidth : CARD_WIDTH
      const h = Math.min(el.scrollHeight, CARD_MAX_HEIGHT)
      const prev = lastSize.current
      if (prev && prev.w === w && prev.h === h) return
      lastSize.current = { w, h }
      void window.api.resizeTranslateTooltip(w, h)
    }
    report()
    const observer = new ResizeObserver(report)
    observer.observe(el)
    return () => observer.disconnect()
  }, [mode, result, error])

  useEffect(() => clearPillTimer, [])

  const copy = async (): Promise<void> => {
    if (!result) return
    await window.api.copyTranslateText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const langLabel = targetLang === 'en' ? '中 → 英' : '英/其他 → 中'
  const toggleLang = (): void => {
    const next: TranslateTargetLang = targetLang === 'en' ? 'zh' : 'en'
    setTargetLang(next)
    request(text, next)
  }

  if (mode === 'idle') return <div ref={rootRef} className="size-0" />

  if (mode === 'pill') {
    return (
      <div ref={rootRef} className="inline-flex">
        <button
          type="button"
          onClick={() => {
            clearPillTimer()
            request(text, targetLang)
          }}
          className="flex items-center gap-1.5 rounded-lg border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-lg transition-colors hover:bg-accent"
        >
          <span className="font-serif italic">文A</span>
          <span>翻译</span>
        </button>
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className="flex flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl"
      style={{ width: CARD_WIDTH }}
    >
      <div className="flex items-start gap-2 border-b px-3 py-2">
        <p className="flex-1 truncate text-xs text-muted-foreground" title={text}>
          {text}
        </p>
        <span className="shrink-0 text-[10px] text-muted-foreground">{langLabel}</span>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded px-1 text-xs text-muted-foreground hover:text-foreground"
          aria-label="关闭"
        >
          ✕
        </button>
      </div>

      <div className="max-h-64 overflow-auto px-3 py-2.5">
        {mode === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            翻译中…
          </div>
        )}
        {(mode === 'streaming' || mode === 'done') && (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed select-text">
            {result}
            {mode === 'streaming' && (
              <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-foreground align-middle" />
            )}
          </p>
        )}
        {mode === 'error' && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {mode !== 'loading' && (
        <div className="flex items-center gap-1.5 border-t px-2.5 py-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={copy}
            disabled={!result}
          >
            {copied ? '已复制 ✓' : '复制'}
          </Button>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={toggleLang}>
            译到{targetLang === 'en' ? '中文' : '英文'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-6 px-2 text-xs"
            onClick={() => request(text, targetLang)}
          >
            重译
          </Button>
        </div>
      )}
    </div>
  )
}
