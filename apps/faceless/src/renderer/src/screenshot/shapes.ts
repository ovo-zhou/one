/** Shape model for screenshot annotations. Coordinates are CSS px, local to the selection origin. */

export interface Point {
  x: number
  y: number
}

export type Tool = 'select' | 'rect' | 'ellipse' | 'arrow' | 'pen' | 'text' | 'mosaic' | 'eraser'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface ShapeCommon {
  id: number
}

export interface RectShape extends ShapeCommon {
  type: 'rect'
  x: number
  y: number
  w: number
  h: number
  color: string
  strokeWidth: number
}

export interface EllipseShape extends ShapeCommon {
  type: 'ellipse'
  x: number
  y: number
  w: number
  h: number
  color: string
  strokeWidth: number
}

export interface ArrowShape extends ShapeCommon {
  type: 'arrow'
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  strokeWidth: number
}

export interface PenShape extends ShapeCommon {
  type: 'pen'
  points: Point[]
  color: string
  strokeWidth: number
}

export interface TextShape extends ShapeCommon {
  type: 'text'
  x: number
  y: number
  text: string
  color: string
  fontSize: number
}

export interface MosaicShape extends ShapeCommon {
  type: 'mosaic'
  points: Point[]
  strokeWidth: number
}

export type Shape = RectShape | EllipseShape | ArrowShape | PenShape | TextShape | MosaicShape

export const STROKE_WIDTHS = [2, 4, 6, 9] as const

export const PALETTE = [
  '#ff4d4f',
  '#faad14',
  '#f759ab',
  '#52c41a',
  '#1890ff',
  '#722ed1',
  '#ffffff',
  '#111111'
] as const

export function normalizeRect(a: Point, b: Point): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y)
  }
}

export function rectOf(x1: number, y1: number, x2: number, y2: number): Rect {
  return normalizeRect({ x: x1, y: y1 }, { x: x2, y: y2 })
}

const measureCtx: CanvasRenderingContext2D | null = (() => {
  if (typeof document === 'undefined') return null
  return document.createElement('canvas').getContext('2d')
})()

function textBounds(s: TextShape): Rect {
  const font = `${s.fontSize}px -apple-system, "Helvetica Neue", Arial, "PingFang SC", sans-serif`
  const lines = s.text.split('\n')
  const width = measureCtx
    ? (() => {
        measureCtx!.font = font
        return Math.max(...lines.map((l) => measureCtx!.measureText(l).width))
      })()
    : Math.max(...lines.map((l) => l.length * s.fontSize * 0.6))
  return {
    x: s.x,
    y: s.y,
    w: width,
    h: lines.length * s.fontSize * 1.25
  }
}

export function shapeBounds(s: Shape): Rect {
  switch (s.type) {
    case 'rect':
    case 'ellipse':
      return { x: s.x, y: s.y, w: s.w, h: s.h }
    case 'arrow':
      return rectOf(s.x1, s.y1, s.x2, s.y2)
    case 'pen':
    case 'mosaic': {
      if (s.points.length === 0) return { x: 0, y: 0, w: 0, h: 0 }
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      for (const p of s.points) {
        minX = Math.min(minX, p.x)
        minY = Math.min(minY, p.y)
        maxX = Math.max(maxX, p.x)
        maxY = Math.max(maxY, p.y)
      }
      const pad = s.strokeWidth
      return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 }
    }
    case 'text':
      return textBounds(s)
  }
}

function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

/** Whole-object hit test used by the eraser tool. */
export function hitShape(s: Shape, p: Point, tol = 5): boolean {
  const b = shapeBounds(s)
  if (p.x < b.x - tol || p.y < b.y - tol || p.x > b.x + b.w + tol || p.y > b.y + b.h + tol) {
    return false
  }
  switch (s.type) {
    case 'rect':
    case 'ellipse':
      return true
    case 'arrow':
      return distToSegment(p, { x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }) <= s.strokeWidth / 2 + tol
    case 'pen':
    case 'mosaic': {
      for (let i = 1; i < s.points.length; i++) {
        if (distToSegment(p, s.points[i - 1], s.points[i]) <= s.strokeWidth / 2 + tol) return true
      }
      return false
    }
    case 'text':
      return true
  }
}
