import { useCallback, useEffect, useState } from 'react'
import type { AppInfo, ScreenshotFormat } from '../../../../shared/contracts'
import { MODULES } from '../registry'
import { Button } from '../../components/ui/button'
import { acceleratorFromEvent, prettyAccelerator } from '../../lib/shortcut'

function ShortcutRecorder({
  value,
  onSaved
}: {
  value: string
  onSaved: (next: string) => void
}): React.JSX.Element {
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleKey = useCallback(
    async (e: KeyboardEvent): Promise<void> => {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === 'Escape') {
        setRecording(false)
        return
      }
      const accel = acceleratorFromEvent(e)
      if (!accel) return
      const ok = await window.api.validateScreenshotShortcut(accel)
      if (!ok) {
        setError(`「${prettyAccelerator(accel)}」已被其他应用占用`)
        setRecording(false)
        return
      }
      try {
        await window.api.setPrefs({ screenshot: { shortcut: accel } })
        onSaved(accel)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
      setRecording(false)
    },
    [onSaved]
  )

  useEffect(() => {
    if (!recording) return
    window.addEventListener('keydown', handleKey, true)
    return () => window.removeEventListener('keydown', handleKey, true)
  }, [recording, handleKey])

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Button
          variant={recording ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setRecording(true)
            setError(null)
          }}
          className="font-mono"
        >
          {recording ? '按下新快捷键… (Esc 取消)' : prettyAccelerator(value)}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export default function SettingsPanel(): React.JSX.Element {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
  const [saveDir, setSaveDir] = useState<string | null>(null)
  const [format, setFormat] = useState<ScreenshotFormat>('png')
  const [shortcut, setShortcut] = useState('CommandOrControl+Alt+A')

  useEffect(() => {
    void window.api.getAppInfo().then(setAppInfo)
    void window.api.getPrefs().then((p) => {
      setSaveDir(p.screenshot.saveDir)
      setFormat(p.screenshot.format)
      setShortcut(p.screenshot.shortcut)
    })
  }, [])

  const chooseDir = async (): Promise<void> => {
    const dir = await window.api.chooseScreenshotSaveDir()
    if (!dir) return
    setSaveDir(dir)
    void window.api.setPrefs({ screenshot: { saveDir: dir } })
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">关于</h2>
          <dl className="grid grid-cols-[6rem_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">应用</dt>
            <dd>All in One</dd>
            <dt className="text-muted-foreground">版本</dt>
            <dd>{appInfo ? appInfo.version : '—'}</dd>
            <dt className="text-muted-foreground">平台</dt>
            <dd>{appInfo ? appInfo.platform : '—'}</dd>
          </dl>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">截图</h2>
          <div className="flex flex-col gap-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">全局快捷键</span>
              <ShortcutRecorder value={shortcut} onSaved={setShortcut} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">保存格式</span>
              <div className="flex gap-1.5">
                {(['png', 'jpeg'] as const).map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={format === f ? 'default' : 'outline'}
                    onClick={() => {
                      setFormat(f)
                      void window.api.setPrefs({ screenshot: { format: f } })
                    }}
                  >
                    {f.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">保存目录</span>
              <div className="flex items-center gap-2">
                <span className="max-w-52 truncate text-xs text-muted-foreground">
                  {saveDir ?? '每次询问'}
                </span>
                <Button size="sm" variant="outline" onClick={chooseDir}>
                  选择…
                </Button>
                {saveDir && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSaveDir(null)
                      void window.api.setPrefs({ screenshot: { saveDir: null } })
                    }}
                  >
                    清除
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              未设置保存目录时，每次保存会弹出保存对话框。
            </p>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">模块</h2>
          <ul className="flex flex-col divide-y">
            {MODULES.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2.5 text-sm">
                <m.icon className="size-4 text-muted-foreground" />
                <span className="font-medium">{m.name}</span>
                <span className="text-xs text-muted-foreground">{m.description}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {m.enabled ? (m.kind === 'web' ? '本地服务' : '内置页面') : '即将推出'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
