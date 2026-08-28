import { useCallback, useEffect, useState } from 'react'
import { Globe, LoaderCircle, Plus, Trash2, AlertCircle, PanelLeft, Bug } from 'lucide-react'
import { Button } from '../../components/ui/button'
import type { MultiWinConfig } from './ConfigModal'
import { AddWindowForm } from './AddWindowForm'

function truncateUrl(url: string, max = 28): string {
  try {
    const u = new URL(url)
    const host = u.hostname + (u.pathname !== '/' ? u.pathname : '')
    return host.length > max ? host.slice(0, max) + '…' : host
  } catch {
    return url.length > max ? url.slice(0, max) + '…' : url
  }
}

type LoadState = 'loading' | 'ready' | 'error'

const SIDEBAR_W = 224

interface MultiWindowPanelProps {
  initialConfigs: MultiWinConfig[]
  onEmpty: () => void
  /** False when the shell navigated away (overlay CSS-hidden): the native
   *  child windows are OS-level and must be hidden via the main process. */
  visible: boolean
}

export default function MultiWindowPanel({
  initialConfigs,
  onEmpty,
  visible
}: MultiWindowPanelProps): React.JSX.Element {
  const [configs, setConfigs] = useState<MultiWinConfig[]>(initialConfigs)
  const [activeIdx, setActiveIdx] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loadStates, setLoadStates] = useState<Record<string, LoadState>>(() =>
    Object.fromEntries(initialConfigs.map((c) => [c.id, 'loading' as const]))
  )
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Start the session (each tab = its own child window) once mounted.
  // No "started" guard here: under React StrictMode the effect mounts,
  // unmounts (calling multiwinStop) and mounts again — `multiwinStart` is
  // idempotent (it stops any prior session first), so we must re-run it.
  useEffect(() => {
    void window.api.multiwinStart(
      initialConfigs.map((c) => ({ id: c.id, url: c.url, devtools: c.devtools }))
    )
    void window.api.multiwinLayout({ sidebarOpen: true, sidebarW: SIDEBAR_W })
    return () => {
      void window.api.multiwinStop()
    }
  }, [initialConfigs])

  // Mirror tab load status broadcast from the main process.
  useEffect(() => {
    const unsub = window.api.onMultiwinStatus(({ id, status }) => {
      setLoadStates((p) => ({ ...p, [id]: status }))
    })
    return unsub
  }, [])

  useEffect(() => {
    void window.api.multiwinLayout({ sidebarOpen, sidebarW: SIDEBAR_W })
  }, [sidebarOpen])

  useEffect(() => {
    void window.api.multiwinSetVisible(visible)
  }, [visible])

  const setActive = useCallback((id: string, idx: number) => {
    setActiveIdx(idx)
    void window.api.multiwinSetActive(id)
  }, [])

  const deleteWindow = useCallback(
    (id: string) => {
      const idx = configs.findIndex((c) => c.id === id)
      if (configs.length === 1) {
        onEmpty()
        return
      }
      setActiveIdx((prev) => {
        if (idx < prev) return prev - 1
        if (idx === prev && prev >= configs.length - 1) return prev - 1
        return prev
      })
      setConfigs((prev) => prev.filter((c) => c.id !== id))
      void window.api.multiwinRemove(id)
    },
    [configs, onEmpty]
  )

  const deleteAll = useCallback(() => {
    onEmpty()
  }, [onEmpty])

  const addWindow = useCallback((config: MultiWinConfig) => {
    setConfigs((prev) => [...prev, config])
    setActiveIdx((prev) => prev + 1)
    setShowAddForm(false)
    void window.api.multiwinAdd({ id: config.id, url: config.url, devtools: config.devtools })
    void window.api.multiwinSetActive(config.id)
  }, [])

  const toggleDevtools = useCallback((id: string, on: boolean) => {
    setConfigs((prev) => prev.map((c) => (c.id === id ? { ...c, devtools: on } : c)))
    void window.api.multiwinSetDevtools(id, on)
  }, [])

  const retry = useCallback((id: string) => {
    setLoadStates((p) => ({ ...p, [id]: 'loading' }))
    void window.api.multiwinReload(id)
  }, [])

  const activeConfig = configs[activeIdx]
  const activeSt = activeConfig ? loadStates[activeConfig.id] : undefined

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1">
        {sidebarOpen ? (
          <div className="flex w-56 shrink-0 flex-col border-r border-border/60">
            <div className="flex items-center gap-1 border-b px-3 py-2 text-xs font-medium text-muted-foreground">
              <span className="flex-1 truncate">窗口列表 ({configs.length})</span>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="折叠窗口列表"
                title="折叠窗口列表"
                onClick={() => setSidebarOpen(false)}
              >
                <PanelLeft className="size-3" />
              </Button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto p-2">
              {configs.map((config, i) => (
                <div
                  key={config.id}
                  onClick={() => setActive(config.id, i)}
                  className={`group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                    i === activeIdx
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {loadStates[config.id] === 'loading' ? (
                    <LoaderCircle className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
                  ) : loadStates[config.id] === 'error' ? (
                    <AlertCircle className="size-3.5 shrink-0 text-destructive" />
                  ) : (
                    <Globe className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-xs">{truncateUrl(config.url)}</span>
                  <button
                    type="button"
                    aria-label="切换 DevTools"
                    title="切换 DevTools"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleDevtools(config.id, !config.devtools)
                    }}
                    className={`shrink-0 rounded p-0.5 transition-opacity group-hover:opacity-100 ${
                      config.devtools
                        ? 'text-primary opacity-100'
                        : 'text-muted-foreground opacity-0 hover:text-foreground'
                    }`}
                  >
                    <Bug className="size-3" />
                  </button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="shrink-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteWindow(config.id)
                    }}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}

              {showAddForm && (
                <AddWindowForm onAdd={addWindow} onCancel={() => setShowAddForm(false)} />
              )}
            </div>

            <div className="flex gap-1 border-t p-2">
              <Button
                size="xs"
                variant="ghost"
                className="flex-1"
                disabled={configs.length >= 20}
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="size-3" />
                添加
              </Button>
              <Button
                size="xs"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={deleteAll}
              >
                全部删除
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex w-8 shrink-0 flex-col items-center border-r border-border/60 py-2">
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="展开窗口列表"
              title="展开窗口列表"
              onClick={() => setSidebarOpen(true)}
            >
              <PanelLeft className="size-3" />
            </Button>
          </div>
        )}

        <div className="relative min-h-0 flex-1">
          {/* The actual page renders in a native child window (managed by the
              main process) layered above this area. We only show overlays
              while the active tab is still loading or failed to load. */}
          {configs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              无打开的窗口
            </div>
          ) : (
            activeSt !== 'ready' && (
              <div className="absolute inset-0 flex items-center justify-center bg-background">
                {activeSt === 'error' ? (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <AlertCircle className="size-8 text-destructive" />
                    <p className="text-sm font-medium">页面加载失败</p>
                    <p className="max-w-xs text-xs text-muted-foreground">{activeConfig?.url}</p>
                    <Button size="sm" variant="outline" onClick={() => retry(activeConfig!.id)}>
                      重试
                    </Button>
                  </div>
                ) : (
                  <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
