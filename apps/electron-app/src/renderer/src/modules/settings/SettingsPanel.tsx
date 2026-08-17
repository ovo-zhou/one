import { useCallback, useEffect, useState } from 'react'
import type { AppInfo, ScreenshotFormat, TranslateModel } from '../../../../shared/contracts'
import { MODULES } from '../registry'
import { Button } from '../../components/ui/button'
import { acceleratorFromEvent, prettyAccelerator } from '../../lib/shortcut'

function ShortcutRecorder({
  value,
  validate,
  save,
  onSaved
}: {
  value: string
  validate: (accel: string) => Promise<boolean>
  save: (accel: string) => Promise<void>
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
      const ok = await validate(accel)
      if (!ok) {
        setError(`「${prettyAccelerator(accel)}」已被其他应用占用`)
        setRecording(false)
        return
      }
      try {
        await save(accel)
        onSaved(accel)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
      setRecording(false)
    },
    [validate, save, onSaved]
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

function Toggle({
  value,
  onChange,
  labels = ['开启', '关闭']
}: {
  value: boolean
  onChange: (next: boolean) => void
  labels?: [string, string] | string[]
}): React.JSX.Element {
  return (
    <div className="flex gap-1.5">
      <Button size="sm" variant={value ? 'default' : 'outline'} onClick={() => onChange(true)}>
        {labels[0]}
      </Button>
      <Button size="sm" variant={!value ? 'default' : 'outline'} onClick={() => onChange(false)}>
        {labels[1]}
      </Button>
    </div>
  )
}

export default function SettingsPanel(): React.JSX.Element {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
  const [saveDir, setSaveDir] = useState<string | null>(null)
  const [format, setFormat] = useState<ScreenshotFormat>('png')
  const [shortcut, setShortcut] = useState('Control+Command+A')
  const [trEnabled, setTrEnabled] = useState(true)
  const [trAutoPopup, setTrAutoPopup] = useState(true)
  const [trApiKey, setTrApiKey] = useState('')
  const [trModel, setTrModel] = useState<TranslateModel>('deepseek-v4-flash')
  const [trShortcut, setTrShortcut] = useState('Alt+Shift+T')
  const [accessibility, setAccessibility] = useState<{ supported: boolean; trusted: boolean }>({
    supported: false,
    trusted: false
  })

  useEffect(() => {
    void window.api.getAppInfo().then(setAppInfo)
    void window.api.getPrefs().then((p) => {
      setSaveDir(p.screenshot.saveDir)
      setFormat(p.screenshot.format)
      setShortcut(p.screenshot.shortcut)
      setTrEnabled(p.translate.enabled)
      setTrAutoPopup(p.translate.autoPopup)
      setTrApiKey(p.translate.apiKey)
      setTrModel(p.translate.model)
      setTrShortcut(p.translate.shortcut)
    })
    void window.api.getTranslateAccessibilityStatus().then(setAccessibility)
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
              <ShortcutRecorder
                value={shortcut}
                onSaved={setShortcut}
                validate={(accel) => window.api.validateScreenshotShortcut(accel)}
                save={async (accel) => {
                  await window.api.setPrefs({ screenshot: { shortcut: accel } })
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">保存格式</span>
              <div className="flex gap-1.5">
                {(['png', 'jpeg', 'webp'] as const).map((f) => (
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
          <h2 className="mb-3 text-sm font-semibold">翻译</h2>
          <div className="flex flex-col gap-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">划词翻译</span>
              <Toggle
                value={trEnabled}
                onChange={(v) => {
                  setTrEnabled(v)
                  void window.api.setPrefs({ translate: { enabled: v } })
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">选中后自动弹出</span>
              <Toggle
                value={trAutoPopup}
                onChange={(v) => {
                  setTrAutoPopup(v)
                  void window.api.setPrefs({ translate: { autoPopup: v } })
                }}
                labels={['自动', '仅快捷键']}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">快捷键兜底</span>
              <ShortcutRecorder
                value={trShortcut}
                onSaved={setTrShortcut}
                validate={(accel) => window.api.validateTranslateShortcut(accel)}
                save={async (accel) => {
                  await window.api.setPrefs({ translate: { shortcut: accel } })
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">模型</span>
              <div className="flex gap-1.5">
                {(['deepseek-v4-flash', 'deepseek-v4-pro'] as const).map((m) => (
                  <Button
                    key={m}
                    size="sm"
                    variant={trModel === m ? 'default' : 'outline'}
                    onClick={() => {
                      setTrModel(m)
                      void window.api.setPrefs({ translate: { model: m } })
                    }}
                  >
                    {m === 'deepseek-v4-flash' ? 'V4 Flash' : 'V4 Pro'}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">API Key</span>
                <div className="flex w-64 items-center gap-2">
                  <input
                    type="password"
                    value={trApiKey}
                    placeholder="留空则复用 DeepSeek Harness 的 Key"
                    onChange={(e) => setTrApiKey(e.target.value)}
                    onBlur={() => {
                      void window.api.setPrefs({ translate: { apiKey: trApiKey } })
                    }}
                    className="h-8 w-full rounded-md border bg-background px-2.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                留空时自动读取 ~/.dsh/.credentials.yaml 中的 DEEPSEEK_API_KEY（与 DeepSeek Harness
                模块共用登录）。
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">辅助功能权限</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {!accessibility.supported
                    ? '仅 macOS 支持'
                    : accessibility.trusted
                      ? '已授权 ✓'
                      : '未授权'}
                </span>
                {accessibility.supported && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await window.api.openTranslateAccessibilitySettings()
                      setTimeout(() => {
                        void window.api.getTranslateAccessibilityStatus().then(setAccessibility)
                      }, 3000)
                    }}
                  >
                    去授权…
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              任意应用中选中文字后弹出翻译按钮；中文译英文，其他语言译中文。开发模式下权限归属于启动应用的终端（如
              VS Code 或 Terminal），授权后需重启应用。
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
