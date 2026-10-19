/** Canvas rendering of annotation shapes (live preview and final composite). */

import type { Shape } from './shapes'

export const FONT_STACK =
  '-apple-system, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif'

export interface ShapeEnv {
  /** Base screenshot canvas at native resolution. */
  base: HTMLCanvasElement
  /** base.width / window CSS width. */
  imgScale: number
  selX: number
  selY: number
  selW: number
  selH: number
}

const scratchA: HTMLCanvasElement | null = null
const scratchB: HTMLCanvasElement | null = null
const scratchM: HTMLCanvasElement | null = null

function getScratch(size: { w: number; h: number }, slot: 0 | 1 | 2): HTMLCanvasElement {
  const pool = [scratchA, scratchB, scratchM]
  let c = pool[slot]
  if (!c) {
    c = document.createElement('canvas')
    pool[slot] = c
  }
  c.width = Math.max(1, Math.round(size.w))
  c.height = Math.max(1, Math.round(size.h))
  return c
}

function drawMosaic(
  ctx: CanvasRenderingContext2D,
  s: Extract<Shape, { type: 'mosaic' }>,
  env: ShapeEnv
): void {
  if (s.points.length === 0) return
  const brush = Math.max(12, s.strokeWidth * 3)
  const cell = Math.max(4, Math.round(brush / 2.5))
  const sw = Math.max(1, Math.ceil(env.selW / cell))
  const sh = Math.max(1, Math.ceil(env.selH / cell))

  // 1) pixelate the whole selection (downscale → upscale with smoothing off)
  const small = getScratch({ w: sw, h: sh }, 0)
  const sctx = small.getContext('2d')!
  sctx.imageSmoothingEnabled = true
  sctx.clearRect(0, 0, sw, sh)
  sctx.drawImage(
    env.base,
    env.selX * env.imgScale,
    env.selY * env.imgScale,
    env.selW * env.imgScale,
    env.selH * env.imgScale,
    0,
    0,
    sw,
    sh
  )
  const big = getScratch({ w: env.selW, h: env.selH }, 1)
  const bctx = big.getContext('2d')!
  bctx.imageSmoothingEnabled = false
  bctx.clearRect(0, 0, big.width, big.height)
  bctx.drawImage(small, 0, 0, sw, sh, 0, 0, big.width, big.height)

  // 2) mask = the brush stroke path
  const mask = getScratch({ w: env.selW, h: env.selH }, 2)
  const mctx = mask.getContext('2d')!
  mctx.clearRect(0, 0, mask.width, mask.height)
  mctx.strokeStyle = '#fff'
  mctx.lineWidth = brush
  mctx.lineCap = 'round'
  mctx.lineJoin = 'round'
  mctx.beginPath()
  s.points.forEach((p, i) => {
    if (i === 0) mctx.moveTo(p.x, p.y)
    else mctx.lineTo(p.x, p.y)
  })
  mctx.stroke()

  // 3) apply mask to the pixelated region, then composite
  bctx.globalCompositeOperation = 'destination-in'
  bctx.drawImage(mask, 0, 0)
  bctx.globalCompositeOperation = 'source-over'
  ctx.drawImage(big, 0, 0)
}

export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape, env: ShapeEnv): void {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  switch (shape.type) {
    case 'rect':
      ctx.strokeStyle = shape.color
      ctx.lineWidth = shape.strokeWidth
      ctx.strokeRect(shape.x, shape.y, shape.w, shape.h)
      break
    case 'ellipse': {
      const cx = shape.x + shape.w / 2
      const cy = shape.y + shape.h / 2
      ctx.strokeStyle = shape.color
      ctx.lineWidth = shape.strokeWidth
      ctx.beginPath()
      ctx.ellipse(cx, cy, shape.w / 2, shape.h / 2, 0, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    case 'arrow': {
      const dx = shape.x2 - shape.x1
      const dy = shape.y2 - shape.y1
      const angle = Math.atan2(dy, dx)
      const head = Math.max(10, shape.strokeWidth * 3.2)
      ctx.strokeStyle = shape.color
      ctx.lineWidth = shape.strokeWidth
      const backX = shape.x2 - Math.cos(angle) * head * 0.9
      const backY = shape.y2 - Math.sin(angle) * head * 0.9
      ctx.beginPath()
      ctx.moveTo(shape.x1, shape.y1)
      ctx.lineTo(backX, backY)
      ctx.stroke()
      ctx.fillStyle = shape.color
      ctx.beginPath()
      ctx.moveTo(shape.x2, shape.y2)
      ctx.lineTo(shape.x2 - Math.cos(angle - 0.45) * head, shape.y2 - Math.sin(angle - 0.45) * head)
      ctx.lineTo(shape.x2 - Math.cos(angle + 0.45) * head, shape.y2 - Math.sin(angle + 0.45) * head)
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'pen':
    case 'mosaic': {
      if (shape.type === 'mosaic') {
        drawMosaic(ctx, shape, env)
        break
      }
      if (shape.points.length < 2) break
      ctx.strokeStyle = shape.color
      ctx.lineWidth = shape.strokeWidth
      ctx.beginPath()
      shape.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      })
      ctx.stroke()
      break
    }
    case 'text': {
      ctx.font = `${shape.fontSize}px ${FONT_STACK}`
      ctx.textBaseline = 'top'
      ctx.fillStyle = shape.color
      const lines = shape.text.split('\n')
      lines.forEach((line, i) => {
        ctx.fillText(line, shape.x, shape.y + i * shape.fontSize * 1.25)
      })
      break
    }
  }
}
