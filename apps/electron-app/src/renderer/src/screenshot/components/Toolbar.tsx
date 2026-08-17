import { useState } from 'react'
import {
  ArrowUpRight,
  Circle,
  Copy,
  Eraser,
  Grid3x3,
  MousePointer2,
  Pencil,
  Pin,
  Redo2,
  Save,
  Square,
  Type,
  Undo2,
  X
} from 'lucide-react'
import type { Rect, Tool } from '../shapes'
import { PALETTE, STROKE_WIDTHS } from '../shapes'

interface ToolbarProps {
  sel: Rect
  winW: number
  winH: number
  tool: Tool
  onTool: (t: Tool) => void
  color: string
  onColor: (c: string) => void
  size: number
  onSize: (s: number) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onCopy: () => void
  onSave: () => void
  onPin: () => void
  onClose: () => void
}

const BAR_HEIGHT = 40

const TOOLS: { id: Tool; icon: React.ComponentType<{ className?: string }>; title: string }[] = [
  { id: 'select', icon: MousePointer2, title: '选择/移动' },
  { id: 'rect', icon: Square, title: '矩形' },
  { id: 'ellipse', icon: Circle, title: '椭圆' },
  { id: 'arrow', icon: ArrowUpRight, title: '箭头' },
  { id: 'pen', icon: Pencil, title: '画笔' },
  { id: 'text', icon: Type, title: '文字' },
  { id: 'mosaic', icon: Grid3x3, title: '马赛克' },
  { id: 'eraser', icon: Eraser, title: '橡皮擦（点击删除标注）' }
]

function IconButton({
  active,
  title,
  onClick,
  children,
  disabled
}: {
  active?: boolean
  title: string
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}): React.JSX.Element {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded-md p-1.5 transition-colors disabled:opacity-30 ${
        active ? 'bg-sky-500 text-white' : 'text-zinc-200 hover:bg-white/15'
      }`}
    >
      {children}
    </button>
  )
}

export function Toolbar(props: ToolbarProps): React.JSX.Element {
  const { sel, winW, winH } = props
  const [panel, setPanel] = useState<'color' | 'size' | null>(null)

  const barW = 360
  const left = Math.min(Math.max(8, sel.x + sel.w / 2 - barW / 2), winW - barW - 8)
  const below = sel.y + sel.h + 12
  const top = below + BAR_HEIGHT + 8 < winH ? below : Math.max(8, sel.y - BAR_HEIGHT - 12)

  const bar = (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-neutral-900/95 px-1.5 py-1 shadow-xl backdrop-blur"
      style={{ width: barW }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-0.5 border-r border-white/10 pr-1">
        {TOOLS.map(({ id, icon: Icon, title }) => (
          <IconButton
            key={id}
            active={props.tool === id}
            title={title}
            onClick={() => props.onTool(id)}
          >
            <Icon className="size-4" />
          </IconButton>
        ))}
      </div>

      <div className="flex items-center gap-0.5 border-r border-white/10 px-1">
        <IconButton title="撤销 (Ctrl+Z)" onClick={props.onUndo} disabled={!props.canUndo}>
          <Undo2 className="size-4" />
        </IconButton>
        <IconButton title="重做 (Ctrl+Shift+Z)" onClick={props.onRedo} disabled={!props.canRedo}>
          <Redo2 className="size-4" />
        </IconButton>
      </div>

      <div className="flex items-center gap-0.5 border-r border-white/10 px-1">
        <IconButton
          title="颜色"
          active={panel === 'color'}
          onClick={() => setPanel(panel === 'color' ? null : 'color')}
        >
          <span
            className="block size-4 rounded-full border border-white/30"
            style={{ background: props.color }}
          />
        </IconButton>
        <IconButton
          title="粗细"
          active={panel === 'size'}
          onClick={() => setPanel(panel === 'size' ? null : 'size')}
        >
          <span
            className="block rounded-full bg-zinc-200"
            style={{ width: 10 + props.size * 3, height: 10 + props.size * 3 }}
          />
        </IconButton>
      </div>

      <div className="flex items-center gap-0.5 px-1">
        <IconButton title="复制到剪贴板 (Enter)" onClick={props.onCopy}>
          <Copy className="size-4" />
        </IconButton>
        <IconButton title="保存" onClick={props.onSave}>
          <Save className="size-4" />
        </IconButton>
        <IconButton title="贴图（钉在屏幕上）" onClick={props.onPin}>
          <Pin className="size-4" />
        </IconButton>
      </div>

      <div className="border-l border-white/10 pl-1">
        <IconButton title="取消 (Esc)" onClick={props.onClose}>
          <X className="size-4" />
        </IconButton>
      </div>
    </div>
  )

  const panelEl =
    panel === 'color' || panel === 'size' ? (
      <div
        className="absolute z-30 flex items-center gap-2 rounded-lg border border-white/10 bg-neutral-900/95 px-2 py-1.5 shadow-xl"
        style={{ left, top: panel === 'color' ? top + BAR_HEIGHT + 4 : top + BAR_HEIGHT + 4 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {panel === 'color'
          ? PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  props.onColor(c)
                  setPanel(null)
                }}
                className="size-6 rounded-full border border-white/25 transition-transform hover:scale-110"
                style={{ background: c }}
              />
            ))
          : STROKE_WIDTHS.map((w, i) => (
              <button
                key={w}
                type="button"
                title={`${w}px`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  props.onSize(i)
                  setPanel(null)
                }}
                className="flex size-7 items-center justify-center rounded hover:bg-white/10"
              >
                <span
                  className="rounded-full bg-zinc-200"
                  style={{ width: 8 + w * 2, height: 8 + w * 2 }}
                />
              </button>
            ))}
      </div>
    ) : null

  return (
    <>
      <div className="absolute z-20" style={{ left, top }}>
        {bar}
      </div>
      {panelEl}
    </>
  )
}
