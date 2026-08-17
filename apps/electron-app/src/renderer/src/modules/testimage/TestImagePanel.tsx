import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Download } from 'lucide-react'
import type { TestImageFormat } from '../../../../shared/contracts'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'

type BgMode = 'solid' | 'gradient' | 'transparent'

interface Config {
  width: number
  height: number
  bgMode: BgMode
  bgColor: string
  gradColor: string
  gradAngle: number
  textColor: string
  text: string
  fontSize: number
  autoFontSize: boolean
  borderWidth: number
  borderColor: string
  format: TestImageFormat
  scale: 1 | 2 | 3
}

const DEFAULT_CONFIG: Config = {
  width: 1280,
  height: 720,
  bgMode: 'solid',
  bgColor: '#e2e8f0',
  gradColor: '#94a3b8',
  gradAngle: 135,
  textColor: '#475569',
  text: '',
  fontSize: 48,
  autoFontSize: true,
  borderWidth: 0,
  borderColor: '#94a3b8',
  format: 'png',
  scale: 1
}

const MIN_SIZE = 1
const MAX_SIZE = 8000

const RATIOS: { label: string; w: number; h: number }[] = [
  { label: '自由', w: 0, h: 0 },
  { label: '1:1', w: 1, h: 1 },
  { label: '16:9', w: 16, h: 9 },
  { label: '9:16', w: 9, h: 16 },
  { label: '4:3', w: 4, h: 3 },
  { label: '3:4', w: 3, h: 4 }
]

const PRESETS: { label: string; w: number; h: number }[] = [
  { label: '1080p', w: 1920, h: 1080 },
  { label: '720p', w: 1280, h: 720 },
  { label: '480p', w: 854, h: 480 },
  { label: '方形 1080', w: 1080, h: 1080 },
  { label: 'OG 图', w: 1200, h: 630 },
  { label: '头像', w: 400, h: 400 },
  { label: '横幅广告', w: 728, h: 90 },
  { label: '中矩形广告', w: 300, h: 250 },
  { label: '竖幅广告', w: 160, h: 600 }
]

const FORMATS: { value: TestImageFormat; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' }
]

const clampSize = (n: number): number => Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(n)))

/** Draws the test image at (w*scale, h*scale). */
function drawImage(ctx: CanvasRenderingContext2D, cfg: Config, w: number, h: number): void {
  const s = w / cfg.width
  if (cfg.bgMode === 'transparent') {
    ctx.clearRect(0, 0, w, h)
  } else if (cfg.bgMode === 'gradient') {
    const rad = ((cfg.gradAngle - 90) * Math.PI) / 180
    const cx = w / 2
    const cy = h / 2
    const len = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))
    const grad = ctx.createLinearGradient(
      cx - (Math.cos(rad) * len) / 2,
      cy - (Math.sin(rad) * len) / 2,
      cx + (Math.cos(rad) * len) / 2,
      cy + (Math.sin(rad) * len) / 2
    )
    grad.addColorStop(0, cfg.bgColor)
    grad.addColorStop(1, cfg.gradColor)
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = cfg.bgColor
  }
  if (cfg.bgMode !== 'transparent') ctx.fillRect(0, 0, w, h)

  const lines = (cfg.text.trim() ? cfg.text : `${cfg.width}×${cfg.height}`).split('\n')
  const auto =
    cfg.autoFontSize || !cfg.fontSize
      ? Math.max(12, Math.min((cfg.height / (lines.length * 1.6)) | 0, (cfg.width / 8) | 0))
      : cfg.fontSize
  const size = auto * s
  ctx.font = `${size}px ui-sans-serif, -apple-system, "PingFang SC", "Segoe UI", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = cfg.textColor
  const lineHeight = size * 1.4
  const startY = h / 2 - ((lines.length - 1) * lineHeight) / 2
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], w / 2, startY + i * lineHeight, w * 0.92)
  }

  if (cfg.borderWidth > 0) {
    ctx.strokeStyle = cfg.borderColor
    ctx.lineWidth = cfg.borderWidth * s
    const half = (cfg.borderWidth * s) / 2
    ctx.strokeRect(half, half, w - cfg.borderWidth * s, h - cfg.borderWidth * s)
  }
}

function toBlob(canvas: HTMLCanvasElement, format: TestImageFormat): Promise<Blob | null> {
  const mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png'
  return new Promise((resolve) => canvas.toBlob(resolve, mime, 0.92))
}

function Field({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30'

function ColorInput({
  value,
  onChange
}: {
  value: string
  onChange: (v: string) => void
}): React.JSX.Element {
  return (
    <span className="flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="size-5 cursor-pointer rounded border-none bg-transparent p-0"
        aria-label="选择颜色"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent font-mono text-xs uppercase outline-none"
        spellCheck={false}
      />
    </span>
  )
}

export default function TestImagePanel(): React.JSX.Element {
  const [cfg, setCfg] = useState<Config>(DEFAULT_CONFIG)
  const [ratio, setRatio] = useState(0)
  const [saving, setSaving] = useState(false)
  const [savedPath, setSavedPath] = useState<string | null>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)
  const [previewSize, setPreviewSize] = useState({ w: 0, h: 0 })

  const patch = useCallback((p: Partial<Config>): void => {
    setCfg((c) => ({ ...c, ...p }))
  }, [])

  const setWidth = (w: number): void => {
    const width = clampSize(w)
    const r = RATIOS[ratio]
    setCfg((c) => ({
      ...c,
      width,
      height: r.w > 0 ? clampSize((width * r.h) / r.w) : c.height
    }))
  }
  const setHeight = (h: number): void => {
    const height = clampSize(h)
    const r = RATIOS[ratio]
    setCfg((c) => ({
      ...c,
      height,
      width: r.w > 0 ? clampSize((height * r.w) / r.h) : c.width
    }))
  }

  /** Applies a ratio in one step: keeps width, recomputes height from the NEW ratio. */
  const applyRatio = (i: number): void => {
    setRatio(i)
    const r = RATIOS[i]
    if (r.w <= 0) return
    setCfg((c) => ({ ...c, height: clampSize((c.width * r.h) / r.w) }))
  }

  const applyPreset = (w: number, h: number): void => {
    setCfg((c) => ({ ...c, width: w, height: h }))
    const match = RATIOS.findIndex((r) => r.w > 0 && Math.abs(w / h - r.w / r.h) < 0.001)
    setRatio(match >= 0 ? match : 0)
  }

  // Render preview: draw at a display resolution capped for the panel.
  useEffect(() => {
    const canvas = previewRef.current
    if (!canvas) return
    const maxW = 640
    const maxH = 420
    const scale = Math.min(1, maxW / cfg.width, maxH / cfg.height)
    const w = Math.max(1, Math.round(cfg.width * scale))
    const h = Math.max(1, Math.round(cfg.height * scale))
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawImage(ctx, cfg, w, h)
    setPreviewSize({ w, h })
  }, [cfg])

  const transparent = cfg.bgMode === 'transparent'
  const jpegWarn = transparent && cfg.format === 'jpeg'

  const fileBase = useMemo(() => `测试图 ${cfg.width}x${cfg.height}`, [cfg.width, cfg.height])

  const exportImage = useCallback(async (): Promise<void> => {
    if (saving) return
    setSaving(true)
    setSavedPath(null)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = cfg.width * cfg.scale
      canvas.height = cfg.height * cfg.scale
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('无法创建画布')
      if (transparent && cfg.format === 'jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      drawImage(ctx, cfg, canvas.width, canvas.height)
      const blob = await toBlob(canvas, cfg.format)
      if (!blob) throw new Error('导出失败')
      const data = await blob.arrayBuffer()
      const path = await window.api.saveTestImage({
        fileName: fileBase,
        format: cfg.format,
        data
      })
      if (path) setSavedPath(path)
    } catch (err) {
      console.error('[testimage] export failed:', err)
    } finally {
      setSaving(false)
    }
  }, [cfg, fileBase, saving, transparent])

  return (
    <div className="flex h-full flex-1 overflow-hidden p-6">
      <div className="flex h-full w-full flex-col gap-4 lg:flex-row">
        {/* Config panel */}
        <section className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0 lg:overflow-y-auto">
          <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
            <Field label="尺寸（px，1–8000）">
              <span className="flex items-center gap-2">
                <input
                  type="number"
                  min={MIN_SIZE}
                  max={MAX_SIZE}
                  value={cfg.width}
                  onChange={(e) => setWidth(Number(e.target.value) || MIN_SIZE)}
                  className={cn(inputClass, 'font-mono')}
                  aria-label="宽度"
                />
                <span className="text-muted-foreground">×</span>
                <input
                  type="number"
                  min={MIN_SIZE}
                  max={MAX_SIZE}
                  value={cfg.height}
                  onChange={(e) => setHeight(Number(e.target.value) || MIN_SIZE)}
                  className={cn(inputClass, 'font-mono')}
                  aria-label="高度"
                />
              </span>
            </Field>

            <Field label="比例锁定">
              <span className="flex flex-wrap gap-1.5">
                {RATIOS.map((r, i) => (
                  <Button
                    key={r.label}
                    size="xs"
                    variant={ratio === i ? 'default' : 'outline'}
                    onClick={() => applyRatio(i)}
                  >
                    {r.label}
                  </Button>
                ))}
              </span>
            </Field>

            <Field label="常用尺寸">
              <span className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <Button
                    key={p.label}
                    size="xs"
                    variant={cfg.width === p.w && cfg.height === p.h ? 'default' : 'outline'}
                    onClick={() => applyPreset(p.w, p.h)}
                  >
                    {p.label}
                  </Button>
                ))}
              </span>
            </Field>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
            <Field label="背景">
              <span className="flex gap-1.5">
                {(
                  [
                    ['solid', '纯色'],
                    ['gradient', '渐变'],
                    ['transparent', '透明']
                  ] as [BgMode, string][]
                ).map(([mode, label]) => (
                  <Button
                    key={mode}
                    size="xs"
                    variant={cfg.bgMode === mode ? 'default' : 'outline'}
                    onClick={() => patch({ bgMode: mode })}
                  >
                    {label}
                  </Button>
                ))}
              </span>
            </Field>

            {cfg.bgMode !== 'transparent' && (
              <Field label={cfg.bgMode === 'gradient' ? '渐变起始色' : '背景颜色'}>
                <ColorInput value={cfg.bgColor} onChange={(bgColor) => patch({ bgColor })} />
              </Field>
            )}
            {cfg.bgMode === 'gradient' && (
              <>
                <Field label="渐变结束色">
                  <ColorInput
                    value={cfg.gradColor}
                    onChange={(gradColor) => patch({ gradColor })}
                  />
                </Field>
                <Field label={`渐变角度（${cfg.gradAngle}°）`}>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={cfg.gradAngle}
                    onChange={(e) => patch({ gradAngle: Number(e.target.value) })}
                    className="w-full"
                  />
                </Field>
              </>
            )}
          </div>

          <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
            <Field label="文字（留空显示尺寸，支持多行）">
              <textarea
                value={cfg.text}
                onChange={(e) => patch({ text: e.target.value })}
                rows={3}
                spellCheck={false}
                className="w-full resize-none rounded-lg border border-border bg-background p-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                placeholder={`${cfg.width}×${cfg.height}（默认）`}
              />
            </Field>
            <Field label="文字颜色">
              <ColorInput value={cfg.textColor} onChange={(textColor) => patch({ textColor })} />
            </Field>
            <Field label="字号">
              <span className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={cfg.autoFontSize}
                    onChange={(e) => patch({ autoFontSize: e.target.checked })}
                    className="size-3.5"
                  />
                  自动
                </label>
                <input
                  type="number"
                  min={8}
                  max={999}
                  value={cfg.fontSize}
                  disabled={cfg.autoFontSize}
                  onChange={(e) => patch({ fontSize: Number(e.target.value) || 8 })}
                  className={cn(inputClass, 'font-mono disabled:opacity-50')}
                />
              </span>
            </Field>
            <Field label={`边框宽度（${cfg.borderWidth}px）`}>
              <span className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={cfg.borderWidth}
                  onChange={(e) => patch({ borderWidth: Number(e.target.value) })}
                  className="w-full"
                />
                <ColorInput
                  value={cfg.borderColor}
                  onChange={(borderColor) => patch({ borderColor })}
                />
              </span>
            </Field>
          </div>
        </section>

        {/* Preview */}
        <section className="flex min-h-0 flex-1 flex-col rounded-xl border bg-card">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">实时预览</span>
            <span className="font-mono text-xs text-muted-foreground">
              {cfg.width}×{cfg.height}
            </span>
            <Dialog.Root>
              <Dialog.Trigger
                render={
                  <Button size="sm" variant="outline" className="ml-auto">
                    <Download />
                    导出
                  </Button>
                }
              />
              <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
                <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-88 -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-5 shadow-2xl">
                  <Dialog.Title className="mb-4 text-sm font-semibold">导出图片</Dialog.Title>
                  <div className="flex flex-col gap-4 text-sm">
                    <Field label="导出格式">
                      <span className="flex gap-1.5">
                        {FORMATS.map((f) => (
                          <Button
                            key={f.value}
                            size="xs"
                            variant={cfg.format === f.value ? 'default' : 'outline'}
                            onClick={() => patch({ format: f.value })}
                          >
                            {f.label}
                          </Button>
                        ))}
                      </span>
                    </Field>
                    <Field label="倍率（Retina）">
                      <span className="flex items-center gap-1.5">
                        {([1, 2, 3] as const).map((s) => (
                          <Button
                            key={s}
                            size="xs"
                            variant={cfg.scale === s ? 'default' : 'outline'}
                            onClick={() => patch({ scale: s })}
                          >
                            @{s}x
                          </Button>
                        ))}
                        <span className="ml-auto font-mono text-xs text-muted-foreground">
                          {cfg.width * cfg.scale}×{cfg.height * cfg.scale}
                        </span>
                      </span>
                    </Field>
                    <Button onClick={() => void exportImage()} disabled={saving || jpegWarn}>
                      <Download />
                      {saving
                        ? '导出中…'
                        : `导出 ${cfg.width * cfg.scale}×${cfg.height * cfg.scale}`}
                    </Button>
                    {jpegWarn && (
                      <p className="text-xs text-destructive">
                        JPEG 不支持透明背景，请换 PNG / WebP。
                      </p>
                    )}
                    {savedPath && (
                      <p className="truncate text-xs text-muted-foreground" title={savedPath}>
                        已保存：{savedPath}
                      </p>
                    )}
                  </div>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-auto p-6">
            <canvas
              ref={previewRef}
              className={cn(
                'rounded-md shadow-lg',
                transparent &&
                  '[background-image:repeating-conic-gradient(var(--border)_0%_25%,transparent_0%_50%)] [background-size:16px_16px]'
              )}
              style={{ width: previewSize.w, height: previewSize.h }}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
