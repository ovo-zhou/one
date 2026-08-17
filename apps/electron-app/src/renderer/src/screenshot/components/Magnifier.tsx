import { useEffect, useRef } from 'react'

interface MagnifierProps {
  x: number
  y: number
  winW: number
  winH: number
  sf: number
  /** Returns a 9x9 (row-major) hex color grid centered on the physical point. */
  readBlock: (px: number, py: number) => string[] | null
}

const CELL = 11
const GRID = 9
const SIZE = GRID * CELL

/** Snipaste-style pixel magnifier: zoomed pixel grid + center color. */
export function Magnifier({ x, y, winW, winH, sf, readBlock }: MagnifierProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const px = Math.round(x * sf)
  const py = Math.round(y * sf)
  const block = readBlock(px, py)
  const centerHex = block?.[(GRID * GRID) / 2] ?? '#000000'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, SIZE, SIZE)
    if (!block) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, SIZE, SIZE)
      return
    }
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        ctx.fillStyle = block[row * GRID + col]
        ctx.fillRect(col * CELL, row * CELL, CELL, CELL)
      }
    }
    // crosshair
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = 1
    ctx.beginPath()
    const mid = (GRID / 2) * CELL
    ctx.moveTo(mid - 4.5, mid)
    ctx.lineTo(mid + 5.5, mid)
    ctx.moveTo(mid, mid - 4.5)
    ctx.lineTo(mid, mid + 5.5)
    ctx.stroke()
  }, [block])

  const W = SIZE + 12
  const H = SIZE + 30
  const left = x + 18 + W < winW ? x + 18 : Math.max(4, x - 18 - W)
  const top = y + 18 + H < winH ? y + 18 : Math.max(4, y - 18 - H)

  return (
    <div
      className="pointer-events-none absolute z-10 flex flex-col items-center gap-1 rounded-lg border border-white/20 bg-black/85 p-1.5 shadow-xl"
      style={{ left, top }}
    >
      <canvas ref={canvasRef} className="rounded" style={{ width: SIZE, height: SIZE }} />
      <div className="flex items-center gap-1.5 text-[10px] leading-none text-white">
        <span
          className="size-2.5 rounded-sm border border-white/40"
          style={{ background: centerHex }}
        />
        <span className="font-mono">{centerHex}</span>
        <span className="ml-1 opacity-60">
          {px}, {py}
        </span>
      </div>
    </div>
  )
}
