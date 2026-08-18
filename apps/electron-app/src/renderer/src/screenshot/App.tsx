import { useCallback, useEffect, useRef, useState } from 'react'
import type { ScreenshotInitPayload, ScreenshotRect } from '../../../shared/contracts'
import type { Point, Rect, Shape, Tool } from './shapes'
import { STROKE_WIDTHS, hitShape, normalizeRect, rectOf } from './shapes'
import { drawShape, type ShapeEnv } from './render'
import { Toolbar } from './components/Toolbar'
import { Magnifier } from './components/Magnifier'

// Geometry is pushed per-session via the screenshotInit IPC (the window stays
// warm and is reused across displays). snapRect and other module-scope code
// read the current values at call time, which is always within a session.
let WIN_W = 1
let WIN_H = 1
let SF = 1

const ACCENT = '#3d8bff'
const HANDLE = 8
const HANDLE_HIT = 7

type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

type Mode = 'idle' | 'selecting' | 'moving' | 'resizing' | 'drawing'

interface DragState {
  kind: 'new' | 'move' | 'resize' | 'draw'
  startPt: Point
  startSel: Rect
  handle?: HandleId
  shape?: Shape
  /** Window rect under the cursor when the drag started (click-to-select). */
  startHighlight?: ScreenshotRect | null
}

/**
 * Snaps rect edges to the display bounds and to visible window edges.
 * Windows are display-local rects broadcast by the main process.
 */
function snapRect(r: Rect, refs: ScreenshotRect[], tol = 6): Rect {
  const xs = [0, WIN_W]
  const ys = [0, WIN_H]
  for (const e of refs) {
    xs.push(e.x, e.x + e.w)
    ys.push(e.y, e.y + e.h)
  }
  let { x, y, w, h } = r
  for (const c of xs)
    if (Math.abs(x - c) <= tol) {
      x = c
      break
    }
  for (const c of xs)
    if (Math.abs(x + w - c) <= tol) {
      w = c - x
      break
    }
  for (const c of ys)
    if (Math.abs(y - c) <= tol) {
      y = c
      break
    }
  for (const c of ys)
    if (Math.abs(y + h - c) <= tol) {
      h = c - y
      break
    }
  if (w < 2 || h < 2) return r
  return { x, y, w, h }
}

const HANDLES: HandleId[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

function handlePos(r: Rect, id: HandleId): Point {
  const cx = r.x + r.w / 2
  const cy = r.y + r.h / 2
  switch (id) {
    case 'nw':
      return { x: r.x, y: r.y }
    case 'n':
      return { x: cx, y: r.y }
    case 'ne':
      return { x: r.x + r.w, y: r.y }
    case 'e':
      return { x: r.x + r.w, y: cy }
    case 'se':
      return { x: r.x + r.w, y: r.y + r.h }
    case 's':
      return { x: cx, y: r.y + r.h }
    case 'sw':
      return { x: r.x, y: r.y + r.h }
    case 'w':
      return { x: r.x, y: cy }
  }
}

function hitHandle(r: Rect, p: Point): HandleId | null {
  for (const id of HANDLES) {
    const hp = handlePos(r, id)
    if (Math.abs(p.x - hp.x) <= HANDLE_HIT && Math.abs(p.y - hp.y) <= HANDLE_HIT) return id
  }
  return null
}

function resizeRect(start: Rect, handle: HandleId, pt: Point, min = 8): Rect | null {
  switch (handle) {
    case 'nw':
      return rectOf(start.x + start.w, start.y + start.h, pt.x, pt.y)
    case 'se':
      return rectOf(start.x, start.y, pt.x, pt.y)
    case 'ne':
      return rectOf(start.x, start.y + start.h, pt.x, pt.y)
    case 'sw':
      return rectOf(start.x + start.w, start.y, pt.x, pt.y)
    case 'n': {
      const top = Math.min(pt.y, start.y + start.h)
      if (start.y + start.h - top < min) return null
      return { x: start.x, y: top, w: start.w, h: start.y + start.h - top }
    }
    case 's': {
      const bottom = Math.max(pt.y, start.y)
      if (bottom - start.y < min) return null
      return { x: start.x, y: start.y, w: start.w, h: bottom - start.y }
    }
    case 'w': {
      const left = Math.min(pt.x, start.x + start.w)
      if (start.x + start.w - left < min) return null
      return { x: left, y: start.y, w: start.x + start.w - left, h: start.h }
    }
    case 'e': {
      const right = Math.max(pt.x, start.x)
      if (right - start.x < min) return null
      return { x: start.x, y: start.y, w: right - start.x, h: start.h }
    }
  }
}

const LINE_HEIGHT = 1.25

function makeShape(
  id: number,
  tool: Tool,
  a: Point,
  b: Point,
  color: string,
  strokeWidth: number
): Shape | null {
  switch (tool) {
    case 'rect':
      return { id, type: 'rect', ...rectOf(a.x, a.y, b.x, b.y), color, strokeWidth }
    case 'ellipse':
      return { id, type: 'ellipse', ...rectOf(a.x, a.y, b.x, b.y), color, strokeWidth }
    case 'arrow':
      return { id, type: 'arrow', x1: a.x, y1: a.y, x2: b.x, y2: b.y, color, strokeWidth }
    case 'pen':
      return { id, type: 'pen', points: [{ x: a.x, y: a.y }], color, strokeWidth }
    case 'mosaic':
      return { id, type: 'mosaic', points: [{ x: a.x, y: a.y }], strokeWidth }
    default:
      return null
  }
}

function isShapeValid(s: Shape | null): boolean {
  if (!s) return false
  switch (s.type) {
    case 'rect':
    case 'ellipse':
      return s.w >= 3 && s.h >= 3
    case 'arrow':
      return Math.hypot(s.x2 - s.x1, s.y2 - s.y1) >= 3
    case 'pen':
    case 'mosaic':
      return s.points.length >= 2
    case 'text':
      return s.text.trim().length > 0
  }
}

function fontSizeForStroke(strokeWidth: number): number {
  return Math.max(12, strokeWidth * 6)
}

interface BaseImage {
  canvas: HTMLCanvasElement
  scale: number
}

export default function ScreenshotApp(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const baseRef = useRef<BaseImage | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const finishedRef = useRef(false)
  const idSeq = useRef(1)

  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [sel, setSel] = useState<Rect | null>(null)
  const [mode, setMode] = useState<Mode>('idle')
  const [tool, setTool] = useState<Tool>('select')
  const [color, setColor] = useState<string>('#ff4d4f')
  const [size, setSize] = useState(1)
  const [shapes, setShapes] = useState<Shape[]>([])
  const [draft, setDraft] = useState<Shape | null>(null)
  const [cursor, setCursor] = useState<Point | null>(null)
  const [textDraft, setTextDraft] = useState<{ x: number; y: number; value: string } | null>(null)
  const [showDim, setShowDim] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [windowHighlight, setWindowHighlight] = useState<ScreenshotRect | null>(null)

  const highlightRef = useRef<ScreenshotRect | null>(null)
  const windowsRef = useRef<ScreenshotRect[]>([])

  const pastRef = useRef<Shape[][]>([])
  const redoRef = useRef<Shape[][]>([])

  const strokeWidth = STROKE_WIDTHS[Math.min(size, STROKE_WIDTHS.length - 1)]

  // ---- session init from main (full state reset, reused window) ----
  const [session, setSession] = useState<ScreenshotInitPayload | null>(null)

  useEffect(() => {
    return window.api.onScreenshotInit((payload) => {
      WIN_W = Math.max(1, payload.width)
      WIN_H = Math.max(1, payload.height)
      SF = Math.max(1, payload.scaleFactor)
      dragRef.current = null
      finishedRef.current = false
      baseRef.current = null
      highlightRef.current = null
      windowsRef.current = []
      pastRef.current = []
      redoRef.current = []
      // Clear the previous session's frame: the overlay is transparent now,
      // so any leftover pixels would visibly cover the live desktop until
      // the new frozen frame is painted.
      const dc = canvasRef.current
      if (dc) dc.getContext('2d')?.clearRect(0, 0, dc.width, dc.height)
      setReady(false)
      setLoadError(null)
      setSel(null)
      setMode('idle')
      setTool('select')
      setDraft(null)
      setTextDraft(null)
      setCursor(null)
      setShowDim(false)
      setCanUndo(false)
      setCanRedo(false)
      setWindowHighlight(null)
      setSession({ ...payload })
    })
  }, [])

  // ---- load the captured image (bytes via IPC, decoded off-thread) ----
  useEffect(() => {
    if (!session) return
    // Blank early show (imageId null): state was reset by the init handler,
    // the live desktop shows through; the frozen frame arrives via a second
    // init once the capture completes.
    if (!session.imageId) return
    let cancelled = false
    void window.api
      .getScreenshotImage(session.imageId)
      .then(async (bytes) => {
        if (cancelled) return
        // createImageBitmap decodes on a worker thread; a 5K JPEG decodes
        // measurably faster than the Image + blob-URL path (which decodes on
        // the main thread and delays the first paint).
        const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }))
        if (cancelled) {
          bitmap.close()
          return
        }
        const canvas = document.createElement('canvas')
        canvas.width = bitmap.width
        canvas.height = bitmap.height
        // No willReadFrequently here: it would force software rendering for
        // every draw on this 5K canvas. The magnifier samples via a small
        // scratch canvas instead (see readBlock).
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(bitmap, 0, 0)
        bitmap.close()
        baseRef.current = { canvas, scale: canvas.width / WIN_W }
        setReady(true)
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(`获取截图图像失败：${err instanceof Error ? err.message : String(err)}`)
        console.error('[screenshot] getScreenshotImage failed:', err)
      })
    return () => {
      cancelled = true
    }
  }, [session])

  // ---- window highlight / edges from main (cursor-following) ----
  useEffect(() => {
    const offH = window.api.onScreenshotWindowHighlight((rect) => {
      highlightRef.current = rect
      setWindowHighlight(rect)
    })
    const offW = window.api.onScreenshotWindows((data) => {
      windowsRef.current = data.rects
    })
    return () => {
      offH()
      offW()
    }
  }, [])

  // ---- history helpers ----
  const undo = useCallback((): void => {
    const prevState = pastRef.current.pop()
    if (!prevState) return
    redoRef.current.push(shapes)
    setShapes(prevState)
    setCanUndo(pastRef.current.length > 0)
    setCanRedo(true)
  }, [shapes])

  const redo = useCallback((): void => {
    const next = redoRef.current.pop()
    if (!next) return
    pastRef.current.push(shapes)
    setShapes(next)
    setCanRedo(redoRef.current.length > 0)
    setCanUndo(true)
  }, [shapes])

  const commitShapes = useCallback(
    (next: Shape[]): void => {
      pastRef.current.push(shapes)
      redoRef.current = []
      setShapes(next)
      setCanUndo(true)
      setCanRedo(false)
    },
    [shapes]
  )

  const resetHistory = useCallback((): void => {
    pastRef.current = []
    redoRef.current = []
    setCanUndo(false)
    setCanRedo(false)
  }, [])

  // ---- canvas redraw ----
  useEffect(() => {
    if (!ready) return
    const canvas = canvasRef.current
    const base = baseRef.current
    if (!canvas || !base) return
    canvas.width = Math.round(WIN_W * SF)
    canvas.height = Math.round(WIN_H * SF)
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(SF, 0, 0, SF, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.clearRect(0, 0, WIN_W, WIN_H)
    ctx.drawImage(base.canvas, 0, 0, WIN_W, WIN_H)

    if (!sel) {
      if (windowHighlight) {
        // Snipaste-style: dim everything except the window under the cursor,
        // which stays at full brightness.
        const hl = windowHighlight
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, 0, WIN_W, WIN_H)
        ctx.rect(hl.x, hl.y, hl.w, hl.h)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
        ctx.fill('evenodd')
        ctx.restore()
        ctx.strokeStyle = ACCENT
        ctx.lineWidth = 2
        ctx.strokeRect(hl.x + 1, hl.y + 1, hl.w - 2, hl.h - 2)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1
        ctx.strokeRect(hl.x + 3.5, hl.y + 3.5, hl.w - 7, hl.h - 7)
      } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
        ctx.fillRect(0, 0, WIN_W, WIN_H)
      }
      return
    }

    // dim mask outside the selection
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, WIN_W, WIN_H)
    ctx.rect(sel.x, sel.y, sel.w, sel.h)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
    ctx.fill('evenodd')
    ctx.restore()

    // annotations clipped to the selection
    ctx.save()
    ctx.beginPath()
    ctx.rect(sel.x, sel.y, sel.w, sel.h)
    ctx.clip()
    ctx.translate(sel.x, sel.y)
    const shapeEnv: ShapeEnv = {
      base: base.canvas,
      imgScale: base.scale,
      selX: sel.x,
      selY: sel.y,
      selW: sel.w,
      selH: sel.h
    }
    for (const s of shapes) drawShape(ctx, s, shapeEnv)
    if (draft) drawShape(ctx, draft, shapeEnv)
    ctx.restore()

    // selection border
    ctx.strokeStyle = ACCENT
    ctx.lineWidth = 1
    ctx.strokeRect(sel.x + 0.5, sel.y + 0.5, sel.w - 1, sel.h - 1)

    // resize handles
    if (mode !== 'selecting' && mode !== 'drawing') {
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = ACCENT
      ctx.lineWidth = 1
      for (const id of HANDLES) {
        const p = handlePos(sel, id)
        ctx.fillRect(p.x - HANDLE / 2, p.y - HANDLE / 2, HANDLE, HANDLE)
        ctx.strokeRect(p.x - HANDLE / 2 + 0.5, p.y - HANDLE / 2 + 0.5, HANDLE - 1, HANDLE - 1)
      }
    }
  }, [ready, sel, mode, shapes, draft, windowHighlight])

  // ---- finish ----
  const composeSelection = useCallback(
    (mime = 'image/png'): string | null => {
      const base = baseRef.current
      if (!base || !sel) return null
      const out = document.createElement('canvas')
      out.width = Math.max(1, Math.round(sel.w * SF))
      out.height = Math.max(1, Math.round(sel.h * SF))
      const ctx = out.getContext('2d')!
      ctx.drawImage(
        base.canvas,
        sel.x * base.scale,
        sel.y * base.scale,
        sel.w * base.scale,
        sel.h * base.scale,
        0,
        0,
        out.width,
        out.height
      )
      ctx.setTransform(out.width / sel.w, 0, 0, out.height / sel.h, 0, 0)
      const shapeEnv: ShapeEnv = {
        base: base.canvas,
        imgScale: base.scale,
        selX: sel.x,
        selY: sel.y,
        selW: sel.w,
        selH: sel.h
      }
      for (const s of shapes) drawShape(ctx, s, shapeEnv)
      return out.toDataURL(mime, 0.92)
    },
    [sel, shapes]
  )

  const doFinish = useCallback(
    (mode: 'copy' | 'save' | 'pin'): void => {
      if (finishedRef.current || !sel) return
      const send = (dataUrl: string | null): void => {
        if (!dataUrl || finishedRef.current) return
        finishedRef.current = true
        void window.api.finishScreenshot({ mode, dataUrl, width: sel.w, height: sel.h })
      }
      if (mode === 'save') {
        // Encode per the format pref here; the main process writes the bytes
        // as-is (WebP is not encodable via NativeImage).
        void window.api
          .getPrefs()
          .then((p) => {
            const mime =
              p.screenshot.format === 'webp'
                ? 'image/webp'
                : p.screenshot.format === 'jpeg'
                  ? 'image/jpeg'
                  : 'image/png'
            send(composeSelection(mime))
          })
          .catch(() => send(composeSelection()))
      } else {
        send(composeSelection())
      }
    },
    [composeSelection, sel]
  )

  // ---- text draft ----
  const commitTextDraft = useCallback((): void => {
    const td = textDraft
    if (td && td.value.trim()) {
      const s: Shape = {
        id: idSeq.current++,
        type: 'text',
        x: td.x,
        y: td.y,
        text: td.value,
        color,
        fontSize: fontSizeForStroke(strokeWidth)
      }
      commitShapes([...shapes, s])
    }
    setTextDraft(null)
  }, [textDraft, shapes, color, strokeWidth, commitShapes])

  // ---- selection ----
  const startNewSelection = useCallback(
    (pt: Point): void => {
      dragRef.current = {
        kind: 'new',
        startPt: pt,
        startSel: { x: pt.x, y: pt.y, w: 0, h: 0 },
        startHighlight: highlightRef.current
      }
      setShapes([])
      resetHistory()
      setDraft(null)
      setTextDraft(null)
      setSel({ x: pt.x, y: pt.y, w: 0, h: 0 })
      setMode('selecting')
      setShowDim(true)
    },
    [resetHistory]
  )

  // ---- pointer events ----
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): void => {
      if (!ready || e.button !== 0) return
      const pt: Point = { x: e.clientX, y: e.clientY }

      e.currentTarget.setPointerCapture(e.pointerId)
      // Any interaction locks the session to this display.
      void window.api.setScreenshotSelectionActive(true)

      if (textDraft) {
        commitTextDraft()
      }

      if (tool === 'text') {
        const s = sel
        if (!s) {
          startNewSelection(pt)
          return
        }
        const lp = { x: pt.x - s.x, y: pt.y - s.y }
        if (lp.x < 0 || lp.y < 0 || lp.x > s.w || lp.y > s.h) {
          startNewSelection(pt)
          return
        }
        // The draft is opened on pointerup (see onPointerUp): opening it here
        // would mount the textarea mid-click, and the captured mousedown on
        // the canvas instantly blurs it, discarding the draft before typing.
        return
      }

      if (tool === 'eraser') {
        const s = sel
        if (!s) return
        const lp = { x: pt.x - s.x, y: pt.y - s.y }
        const hit = shapes.findLast((sh) => hitShape(sh, lp))
        if (hit) {
          commitShapes(shapes.filter((sh) => sh.id !== hit.id))
        }
        return
      }

      if (tool === 'select') {
        const s = sel
        if (!s) {
          startNewSelection(pt)
          return
        }
        const handle = hitHandle(s, pt)
        if (handle) {
          dragRef.current = { kind: 'resize', startPt: pt, startSel: s, handle }
          setMode('resizing')
          setShowDim(true)
          return
        }
        if (pt.x >= s.x && pt.y >= s.y && pt.x <= s.x + s.w && pt.y <= s.y + s.h) {
          dragRef.current = { kind: 'move', startPt: pt, startSel: s }
          setMode('moving')
          setShowDim(true)
          return
        }
        startNewSelection(pt)
        return
      }

      // drawing tools
      const s = sel
      if (!s) {
        startNewSelection(pt)
        return
      }
      if (pt.x < s.x || pt.y < s.y || pt.x > s.x + s.w || pt.y > s.y + s.h) {
        startNewSelection(pt)
        return
      }
      const lp = { x: pt.x - s.x, y: pt.y - s.y }
      const shape = makeShape(idSeq.current++, tool, lp, lp, color, strokeWidth)
      if (!shape) return
      dragRef.current = { kind: 'draw', startPt: pt, startSel: s, shape }
      setMode('drawing')
      setDraft(shape)
    },
    [
      ready,
      sel,
      shapes,
      tool,
      color,
      strokeWidth,
      textDraft,
      commitTextDraft,
      startNewSelection,
      commitShapes
    ]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): void => {
      const pt: Point = { x: e.clientX, y: e.clientY }
      setCursor(pt)
      const drag = dragRef.current
      const s = sel
      if (!drag || !s) return

      switch (drag.kind) {
        case 'new': {
          const r = normalizeRect(drag.startPt, pt)
          const clamped = {
            x: Math.max(0, r.x),
            y: Math.max(0, r.y),
            w: Math.min(WIN_W - r.x, r.w),
            h: Math.min(WIN_H - r.y, r.h)
          }
          setSel(snapRect(clamped, windowsRef.current, 4))
          break
        }
        case 'move': {
          const dx = pt.x - drag.startPt.x
          const dy = pt.y - drag.startPt.y
          const next = {
            x: Math.min(WIN_W - s.w, Math.max(0, drag.startSel.x + dx)),
            y: Math.min(WIN_H - s.h, Math.max(0, drag.startSel.y + dy)),
            w: s.w,
            h: s.h
          }
          setSel(snapRect(next, windowsRef.current, 4))
          break
        }
        case 'resize': {
          const next = drag.handle ? resizeRect(drag.startSel, drag.handle, pt) : null
          if (next) {
            const clamped = {
              ...next,
              x: Math.max(0, Math.min(WIN_W - next.w, next.x)),
              y: Math.max(0, Math.min(WIN_H - next.h, next.y))
            }
            setSel(snapRect(clamped, windowsRef.current, 4))
          }
          break
        }
        case 'draw': {
          const lp = { x: pt.x - drag.startSel.x, y: pt.y - drag.startSel.y }
          if (drag.shape && (drag.shape.type === 'pen' || drag.shape.type === 'mosaic')) {
            const pts = drag.shape.points
            const last = pts[pts.length - 1]
            if (Math.hypot(lp.x - last.x, lp.y - last.y) > 1.5) {
              const next = { ...drag.shape, points: [...pts, lp] } as Shape
              dragRef.current = { ...drag, shape: next }
              setDraft(next)
            }
          } else if (drag.shape) {
            const a = { x: drag.startPt.x - drag.startSel.x, y: drag.startPt.y - drag.startSel.y }
            const next = makeShape(drag.shape.id, tool, a, lp, color, strokeWidth)
            if (next) {
              dragRef.current = { ...drag, shape: next }
              setDraft(next)
            }
          }
          break
        }
      }
    },
    [sel, tool, color, strokeWidth]
  )

  const snapSel = useCallback((r: Rect): Rect => {
    const sx = Math.round(r.x * SF) / SF
    const sy = Math.round(r.y * SF) / SF
    const ex = Math.round((r.x + r.w) * SF) / SF
    const ey = Math.round((r.y + r.h) * SF) / SF
    return { x: sx, y: sy, w: Math.max(1, ex - sx), h: Math.max(1, ey - sy) }
  }, [])

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): void => {
      const drag = dragRef.current
      dragRef.current = null
      setShowDim(false)
      if (!drag) {
        // Open the text draft only after the click has fully settled, so the
        // textarea mounts with focus (no pointer-capture / blur race).
        if (tool === 'text' && sel) {
          const lp = { x: e.clientX - sel.x, y: e.clientY - sel.y }
          if (lp.x >= 0 && lp.y >= 0 && lp.x <= sel.w && lp.y <= sel.h) {
            setTextDraft({ x: lp.x, y: lp.y, value: '' })
          }
        }
        return
      }
      setMode('idle')

      if (drag.kind === 'new') {
        const pt: Point = { x: e.clientX, y: e.clientY }
        const moved = Math.hypot(pt.x - drag.startPt.x, pt.y - drag.startPt.y)
        // Click (no real drag) on a highlighted window selects the window.
        if (moved < 3 && drag.startHighlight) {
          setSel(snapRect({ ...drag.startHighlight }, windowsRef.current, 4))
          return
        }
        if (sel && sel.w < 4 && sel.h < 4) {
          setSel(null)
          void window.api.setScreenshotSelectionActive(false)
        } else if (sel) {
          setSel(snapSel(sel))
        }
        return
      }
      if (drag.kind === 'draw') {
        const done = drag.shape && isShapeValid(drag.shape)
        setDraft(null)
        if (done && drag.shape) {
          commitShapes([...shapes, drag.shape as Shape])
        }
        return
      }
      setSel((prev) => (prev ? snapSel(prev) : prev))
    },
    [snapSel, shapes, commitShapes, sel, tool]
  )

  // ---- keyboard ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) return
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()

      if (mod && key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (mod && key === 'y') {
        e.preventDefault()
        redo()
        return
      }
      if (e.key === 'Escape') {
        if (draft) {
          setDraft(null)
          setMode('idle')
          return
        }
        if (textDraft) {
          setTextDraft(null)
          if (!sel) void window.api.setScreenshotSelectionActive(false)
          return
        }
        if (tool !== 'select') {
          setTool('select')
          return
        }
        if (sel) {
          setSel(null)
          setShapes([])
          resetHistory()
          void window.api.setScreenshotSelectionActive(false)
          return
        }
        void window.api.cancelScreenshotSession()
        return
      }
      if (e.key === 'Enter') {
        if (sel && !textDraft && !draft) doFinish('copy')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [draft, textDraft, tool, sel, undo, redo, doFinish, resetHistory])

  // ---- magnifier sampling ----
  const readBlock = useCallback((px: number, py: number): string[] | null => {
    const base = baseRef.current
    if (!base) return null
    const cx = Math.round(px * base.scale)
    const cy = Math.round(py * base.scale)
    const x = Math.max(0, Math.min(base.canvas.width - 9, cx - 4))
    const y = Math.max(0, Math.min(base.canvas.height - 9, cy - 4))
    // Sample through a tiny scratch canvas so the big base canvas can stay
    // GPU-accelerated (no willReadFrequently on a 5K surface).
    const scratch = document.createElement('canvas')
    scratch.width = 9
    scratch.height = 9
    const sctx = scratch.getContext('2d', { willReadFrequently: true })!
    sctx.drawImage(base.canvas, x, y, 9, 9, 0, 0, 9, 9)
    const data = sctx.getImageData(0, 0, 9, 9).data
    const hexes: string[] = []
    for (let i = 0; i < 81; i++) {
      const r = data[i * 4]
      const g = data[i * 4 + 1]
      const b = data[i * 4 + 2]
      hexes.push('#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join(''))
    }
    return hexes
  }, [])

  // ---- cursor style ----
  const canvasCursor = ((): string => {
    if (textDraft) return 'text'
    if (tool === 'text') return 'text'
    if (!cursor || !sel) return 'crosshair'
    if (mode === 'moving') return 'move'
    if (mode === 'resizing') {
      const h = hitHandle(sel, cursor)
      if (!h) return 'crosshair'
      if (h === 'n' || h === 's') return 'ns-resize'
      if (h === 'e' || h === 'w') return 'ew-resize'
      if (h === 'nw' || h === 'se') return 'nwse-resize'
      return 'nesw-resize'
    }
    if (tool === 'select') {
      const h = hitHandle(sel, cursor)
      if (h) return 'move'
      if (
        cursor.x >= sel.x &&
        cursor.y >= sel.y &&
        cursor.x <= sel.x + sel.w &&
        cursor.y <= sel.y + sel.h
      ) {
        return 'move'
      }
    }
    return 'crosshair'
  })()

  const textFontSize = fontSizeForStroke(strokeWidth)

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ width: WIN_W, height: WIN_H, cursor: canvasCursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => setCursor(null)}
        onDoubleClick={(e) => {
          if (e.button !== 0) return
          if (sel && !textDraft && !draft) doFinish('copy')
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          if (textDraft) {
            setTextDraft(null)
            if (!sel) void window.api.setScreenshotSelectionActive(false)
          } else if (sel) {
            setSel(null)
            setShapes([])
            resetHistory()
            void window.api.setScreenshotSelectionActive(false)
          } else {
            void window.api.cancelScreenshotSession()
          }
        }}
      />

      {/* load error / diagnostic */}
      {loadError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center">
          <p className="text-sm font-medium text-red-400">截图加载失败</p>
          <p className="max-w-md text-xs break-all text-white/70">{loadError}</p>
          <button
            type="button"
            className="rounded bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => void window.api.cancelScreenshotSession()}
          >
            关闭 (Esc)
          </button>
        </div>
      )}

      {/* hint bar */}
      {ready && !sel && !loadError && (
        <div className="pointer-events-none absolute top-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs whitespace-nowrap text-white/90">
          拖拽框选区域 · 点击高亮窗口快速选择 · 选区边缘自动吸附窗口 · Esc 取消
        </div>
      )}

      {/* highlighted-window dimension badge */}
      {ready && !sel && !loadError && windowHighlight && (
        <div
          className="pointer-events-none absolute z-20 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white"
          style={{
            left: Math.max(4, Math.min(WIN_W - 90, windowHighlight.x + windowHighlight.w / 2 - 40)),
            top:
              windowHighlight.y + windowHighlight.h + 6 + 22 > WIN_H
                ? windowHighlight.y - 22
                : windowHighlight.y + windowHighlight.h + 6
          }}
        >
          {Math.round(windowHighlight.w * SF)} × {Math.round(windowHighlight.h * SF)}
        </div>
      )}

      {/* dimension badge */}
      {sel && showDim && (
        <div
          className="pointer-events-none absolute z-10 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white"
          style={{
            left: sel.x,
            top: sel.y - 24 < 0 ? sel.y + sel.h + 4 : sel.y - 24
          }}
        >
          {Math.round(sel.w * SF)} × {Math.round(sel.h * SF)}
        </div>
      )}

      {/* text input */}
      {sel && textDraft && (
        <textarea
          autoFocus
          value={textDraft.value}
          onChange={(e) => setTextDraft({ ...textDraft, value: e.target.value })}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              commitTextDraft()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              setTextDraft(null)
            }
          }}
          onBlur={() => commitTextDraft()}
          spellCheck={false}
          className="absolute z-10 overflow-hidden bg-transparent text-white outline-1 outline-dashed outline-[#3d8bff]"
          style={{
            left: sel.x + textDraft.x,
            top: sel.y + textDraft.y,
            minWidth: '12ch',
            color,
            fontSize: textFontSize,
            lineHeight: LINE_HEIGHT,
            fontFamily: '-apple-system, "Helvetica Neue", Arial, "PingFang SC", sans-serif',
            resize: 'none',
            border: 'none',
            padding: 0
          }}
        />
      )}

      {/* magnifier */}
      {cursor && !textDraft && (
        <Magnifier
          x={cursor.x}
          y={cursor.y}
          winW={WIN_W}
          winH={WIN_H}
          readBlock={readBlock}
          sf={SF}
        />
      )}

      {/* toolbar */}
      {sel && (
        <Toolbar
          sel={sel}
          winW={WIN_W}
          winH={WIN_H}
          tool={tool}
          onTool={setTool}
          color={color}
          onColor={setColor}
          size={size}
          onSize={setSize}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onCopy={() => doFinish('copy')}
          onSave={() => doFinish('save')}
          onPin={() => doFinish('pin')}
          onClose={() => {
            setSel(null)
            setShapes([])
            resetHistory()
            void window.api.setScreenshotSelectionActive(false)
          }}
        />
      )}
    </div>
  )
}
