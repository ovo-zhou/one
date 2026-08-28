import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus, Trash2, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Switch } from '../../components/ui/switch'

export interface MultiWinConfig {
  id: string
  url: string
  devtools: boolean
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

interface UrlComboProps {
  value: string
  history: string[]
  urlError: boolean
  onChange: (url: string) => void
  onDeleteHistory: (url: string) => void
}

/** Text input with a history dropdown; filters options by the current input. */
function UrlCombo({
  value,
  history,
  urlError,
  onChange,
  onDeleteHistory
}: UrlComboProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocDown = (e: MouseEvent): void => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
    }
  }, [open])

  const options = history.filter((u) => u.toLowerCase().includes(value.trim().toLowerCase()))
  const showList = open && options.length > 0

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="https://example.com"
          className={`w-full rounded-lg border bg-transparent py-2 pl-3 pr-8 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-ring ${
            urlError ? 'border-destructive' : 'border-border'
          }`}
        />
        {history.length > 0 && (
          <button
            type="button"
            aria-label="选择历史地址"
            onClick={() => setOpen((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      {showList && (
        <ul className="absolute top-full left-0 z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-lg">
          {options.map((u) => (
            <li key={u} className="group/option flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  onChange(u)
                  setOpen(false)
                }}
                className="min-w-0 flex-1 cursor-pointer truncate rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
              >
                {u}
              </button>
              <button
                type="button"
                aria-label={`删除历史 ${u}`}
                title="删除该历史记录"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteHistory(u)
                }}
                className="shrink-0 cursor-pointer rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover/option:opacity-100 hover:bg-muted hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface ConfigRowProps {
  config: MultiWinConfig
  index: number
  canDelete: boolean
  history: string[]
  urlError: boolean
  onChange: (id: string, patch: Partial<MultiWinConfig>) => void
  onDelete: (id: string) => void
  onDeleteHistory: (url: string) => void
}

function ConfigRow({
  config,
  index,
  canDelete,
  history,
  urlError,
  onChange,
  onDelete,
  onDeleteHistory
}: ConfigRowProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 shrink-0 text-right text-sm text-muted-foreground">{index + 1}</span>
      <UrlCombo
        value={config.url}
        history={history}
        urlError={urlError}
        onChange={(url) => onChange(config.id, { url })}
        onDeleteHistory={onDeleteHistory}
      />
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-xs text-muted-foreground">DevTools</span>
        <Switch
          checked={config.devtools}
          onCheckedChange={(checked) => onChange(config.id, { devtools: checked })}
        />
      </div>
      <Button
        size="icon-sm"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        disabled={!canDelete}
        onClick={() => onDelete(config.id)}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}

interface ConfigModalProps {
  onConfirm: (configs: MultiWinConfig[]) => void
  onCancel: () => void
}

export function ConfigModal({ onConfirm, onCancel }: ConfigModalProps): React.JSX.Element {
  const [configs, setConfigs] = useState<MultiWinConfig[]>([
    { id: makeId(), url: '', devtools: false }
  ])
  const [errors, setErrors] = useState<Set<string>>(new Set())
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    void window.api.getPrefs().then((prefs) => setHistory(prefs.multiwinUrlHistory))
  }, [])

  const addRow = useCallback(() => {
    if (configs.length >= 20) return
    setConfigs((prev) => [...prev, { id: makeId(), url: '', devtools: false }])
  }, [configs.length])

  const deleteRow = useCallback((id: string) => {
    setConfigs((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((c) => c.id !== id)
    })
  }, [])

  const updateRow = useCallback((id: string, patch: Partial<MultiWinConfig>) => {
    setConfigs((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    setErrors((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const deleteHistory = useCallback((url: string) => {
    setHistory((prev) => {
      const next = prev.filter((u) => u !== url)
      void window.api.setPrefs({ multiwinUrlHistory: next }).catch(() => {})
      return next
    })
  }, [])

  const handleConfirm = useCallback(() => {
    const trimmed = configs.map((c) => ({ ...c, url: c.url.trim() }))
    const emptyIds = new Set(trimmed.filter((c) => !c.url).map((c) => c.id))
    if (emptyIds.size > 0) {
      setErrors(emptyIds)
      return
    }
    // Persist the entered URLs as history (most recent first, deduped by
    // the prefs layer). Merge on top of the existing history.
    void window.api
      .getPrefs()
      .then((prefs) => {
        const merged = [...trimmed.map((c) => c.url), ...prefs.multiwinUrlHistory]
        return window.api.setPrefs({ multiwinUrlHistory: merged })
      })
      .catch(() => {})
    onConfirm(trimmed)
  }, [configs, onConfirm])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 flex w-full max-w-lg flex-col gap-4 rounded-xl border bg-card p-6 shadow-lg">
        <h2 className="text-base font-semibold">配置匿名窗口</h2>

        <div className="flex flex-col gap-2">
          {configs.map((config, i) => (
            <ConfigRow
              key={config.id}
              config={config}
              index={i}
              canDelete={configs.length > 1}
              history={history}
              urlError={errors.has(config.id)}
              onChange={updateRow}
              onDelete={deleteRow}
              onDeleteHistory={deleteHistory}
            />
          ))}
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="self-start"
          disabled={configs.length >= 20}
          onClick={addRow}
        >
          <Plus className="size-3.5" />
          添加窗口
        </Button>

        <div className="flex items-center justify-end gap-2 border-t pt-3">
          <Button variant="ghost" onClick={onCancel}>
            取消
          </Button>
          <Button onClick={handleConfirm}>确认</Button>
        </div>
      </div>
    </div>
  )
}
