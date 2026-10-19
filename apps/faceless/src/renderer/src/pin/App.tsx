import { useEffect, useState, type CSSProperties } from 'react'
import { Copy, Save, X } from 'lucide-react'

const params = new URLSearchParams(window.location.search)
const PIN_ID = Number(params.get('id')) || 0
const IMAGE_FILE = params.get('file') ?? ''
const INIT_W = Number(params.get('w')) || 200
const INIT_H = Number(params.get('h')) || 200

const MIN_SIZE = 40
const MAX_SIZE = 6000

function clampSize(v: number): number {
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(v)))
}

const DRAG_STYLE = { WebkitAppRegion: 'drag' } as unknown as CSSProperties
const NO_DRAG_STYLE = { WebkitAppRegion: 'no-drag' } as unknown as CSSProperties

export default function PinApp(): React.JSX.Element {
  const [, setSize] = useState({ w: INIT_W, h: INIT_H })
  const [opacity, setOpacity] = useState(100)
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void window.api
      .getScreenshotImage(IMAGE_FILE)
      .then((bytes) => {
        if (cancelled) return
        const blob = new Blob([bytes], { type: 'image/png' })
        setSrc(URL.createObjectURL(blob))
      })
      .catch((err) => console.error('[pin] load image failed:', err))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      setSize((prev) => {
        const w = clampSize(prev.w * factor)
        const h = clampSize(prev.h * factor)
        void window.api.screenshotPinResize(PIN_ID, w, h)
        return { w, h }
      })
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') void window.api.screenshotPinAction(PIN_ID, 'close')
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-black"
      style={DRAG_STYLE}
      onDoubleClick={() => void window.api.screenshotPinAction(PIN_ID, 'close')}
    >
      {src && (
        <img
          src={src}
          draggable={false}
          className="absolute inset-0 h-full w-full select-none"
          alt=""
        />
      )}

      {/* hover toolbar */}
      <div
        className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-md border border-white/15 bg-black/80 px-1.5 py-1 opacity-0 shadow-lg transition-opacity hover:opacity-100 focus-within:opacity-100"
        style={NO_DRAG_STYLE}
        onMouseDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <input
          type="range"
          min={20}
          max={100}
          value={opacity}
          title="透明度"
          onChange={(e) => {
            const v = Number(e.target.value)
            setOpacity(v)
            void window.api.screenshotPinSetOpacity(PIN_ID, v / 100)
          }}
          className="h-1 w-16 cursor-pointer accent-white"
        />
        <button
          type="button"
          title="复制"
          className="rounded p-1 text-white/80 hover:bg-white/15 hover:text-white"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => void window.api.screenshotPinAction(PIN_ID, 'copy')}
        >
          <Copy className="size-3.5" />
        </button>
        <button
          type="button"
          title="保存"
          className="rounded p-1 text-white/80 hover:bg-white/15 hover:text-white"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => void window.api.screenshotPinAction(PIN_ID, 'save')}
        >
          <Save className="size-3.5" />
        </button>
        <button
          type="button"
          title="关闭 (Esc)"
          className="rounded p-1 text-white/80 hover:bg-white/15 hover:text-white"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => void window.api.screenshotPinAction(PIN_ID, 'close')}
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
