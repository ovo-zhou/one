import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '../lib/utils'

interface ResizerProps {
  orientation: 'vertical' | 'horizontal'
  className?: string
  onResize: (deltaPx: number) => void
  onResizeStart?: () => void
  onResizeEnd?: () => void
}

/**
 * Thin drag handle between two panes. Reports the pointer delta since the
 * previous move (or since drag start for the first move); the parent decides
 * how to apply it (e.g. clamp + set width).
 */
export function Resizer({
  orientation,
  className,
  onResize,
  onResizeStart,
  onResizeEnd
}: ResizerProps): React.JSX.Element {
  const [dragging, setDragging] = useState(false)
  const lastPosRef = useRef(0)

  const posKey = orientation === 'vertical' ? 'clientX' : 'clientY'

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      e.preventDefault()
      lastPosRef.current = e[posKey]
      setDragging(true)
      onResizeStart?.()
    },
    [posKey, onResizeStart]
  )

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: PointerEvent): void => {
      const pos = e[posKey]
      const delta = pos - lastPosRef.current
      lastPosRef.current = pos
      if (delta !== 0) onResize(delta)
    }
    const onUp = (): void => {
      setDragging(false)
      onResizeEnd?.()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, posKey, onResize, onResizeEnd])

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      onPointerDown={onPointerDown}
      className={cn(
        'group relative z-10 shrink-0',
        orientation === 'vertical' ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize',
        // Wider invisible hit area centered on the 1px line
        "before:absolute before:inset-y-0 before:-inset-x-1 before:content-['']",
        dragging && 'select-none',
        className
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-border/60 transition-colors group-hover:bg-primary/60',
          dragging && 'bg-primary/70'
        )}
      />
    </div>
  )
}
