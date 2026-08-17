import { useEffect, useState } from 'react'
import { Camera, Keyboard, Pin, Wand2 } from 'lucide-react'
import type { ScreenshotPrefs } from '../../../../shared/contracts'
import { Button } from '../../components/ui/button'
import { prettyAccelerator } from '../../lib/shortcut'

export default function ScreenshotPanel(): React.JSX.Element {
  const [prefs, setPrefs] = useState<ScreenshotPrefs | null>(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    void window.api.getPrefs().then((p) => setPrefs(p.screenshot))
  }, [])

  const start = async (): Promise<void> => {
    setStarting(true)
    try {
      await window.api.startScreenshot()
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center overflow-auto p-6">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <Camera className="size-8 text-foreground/80" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">截图</h1>
          <p className="text-sm text-muted-foreground">
            框选屏幕任意区域，标注后复制、保存或钉在屏幕上
          </p>
        </div>

        <Button size="lg" className="w-48" onClick={start} disabled={starting}>
          {starting ? '准备中…' : '开始截图'}
        </Button>

        {prefs && (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <Keyboard className="size-3.5" />
            全局快捷键：
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-foreground">
              {prettyAccelerator(prefs.shortcut)}
            </kbd>
            （可在设置中修改）
          </div>
        )}

        <ul className="grid w-full grid-cols-2 gap-3 text-left text-xs text-muted-foreground">
          <li className="rounded-lg border bg-card p-3">
            <Wand2 className="mb-1.5 size-4" />
            矩形 / 椭圆 / 箭头 / 画笔 / 文字 / 马赛克 / 橡皮擦，支持撤销重做
          </li>
          <li className="rounded-lg border bg-card p-3">
            <Pin className="mb-1.5 size-4" />
            截图后一键贴图：钉在屏幕上，可拖动、滚轮缩放、调节透明度
          </li>
        </ul>

        <p className="text-xs leading-relaxed text-muted-foreground/80">
          操作提示：Esc 逐级退出 · Enter 复制 · 双击选区复制 · 右键取消
        </p>
      </div>
    </div>
  )
}
