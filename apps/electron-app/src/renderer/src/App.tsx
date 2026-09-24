import { Suspense, useCallback, useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
import { HomePage } from './home/HomePage'
import { TitleBar } from './shell/TitleBar'
import { WebPanel } from './shell/WebPanel'
import { getEnabledModules, getModule } from './modules/registry'
import { useModuleStatuses } from './modules/useModuleStatus'
import { Button } from './components/ui/button'
import { ConfigModal } from './modules/multiwin/ConfigModal'
import type { MultiWinConfig } from './modules/multiwin/ConfigModal'
import type { ModuleServiceStatus } from '../../shared/contracts'
import { lazy } from 'react'

const MultiWindowPanel = lazy(() => import('./modules/multiwin/MultiWindowPanel'))

const ENABLED = getEnabledModules()
const WEB_IDS = ENABLED.filter((m) => m.kind === 'web').map((m) => m.id)
const IDLE: ModuleServiceStatus = { phase: 'idle', url: null, error: null }
const APP_NAME = 'Faceless'

export default function App(): React.JSX.Element {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [multiWinConfigs, setMultiWinConfigs] = useState<MultiWinConfig[]>([])
  const [showMultiWinModal, setShowMultiWinModal] = useState(false)
  const [hasUpdate, setHasUpdate] = useState(false)
  const statuses = useModuleStatuses(WEB_IDS)
  // multiwin renders exclusively via the overlay below; its registry entry
  // exists only for the home grid, so exclude it from the primary area.
  const activeModule = activeId && activeId !== 'multiwin' ? getModule(activeId) : undefined
  // The title bar keeps showing the breadcrumb for every module, multiwin
  // included, so resolve it independently of the primary-area exclusion.
  const titleModule = activeId ? getModule(activeId) : undefined
  const webModule = activeModule?.kind === 'web' ? activeModule : null
  const reactModule = activeModule?.kind === 'react' ? activeModule : null
  const status = (webModule && statuses[webModule.id]) || IDLE
  const phases = Object.fromEntries(WEB_IDS.map((id) => [id, statuses[id]?.phase ?? 'idle']))

  useEffect(() => {
    void window.api.getActiveModule().then((moduleId) => {
      if (moduleId && getModule(moduleId)) {
        setActiveId(moduleId)
      }
    })
  }, [])

  useEffect(() => {
    return window.api.onUpdateProgress((payload) => {
      if (payload.phase === 'available') setHasUpdate(true)
    })
  }, [])

  const openModule = useCallback(
    (moduleId: string) => {
      if (moduleId === 'multiwin') {
        if (multiWinConfigs.length > 0) {
          setActiveId('multiwin')
          void window.api.setActiveModule('multiwin')
        } else {
          setShowMultiWinModal(true)
        }
        return
      }
      setActiveId(moduleId)
      void window.api.setActiveModule(moduleId)
      if (getModule(moduleId)?.kind === 'web') {
        void window.api.activateModule(moduleId).catch(() => {})
      }
    },
    [multiWinConfigs.length]
  )

  const goHome = useCallback(() => {
    setActiveId(null)
    void window.api.setActiveModule(null)
  }, [])

  const activate = webModule ? () => window.api.activateModule(webModule.id).catch(() => {}) : null

  const handleMultiWinConfirm = useCallback((configs: MultiWinConfig[]) => {
    setMultiWinConfigs(configs)
    setShowMultiWinModal(false)
    setActiveId('multiwin')
    void window.api.setActiveModule('multiwin')
  }, [])

  const handleMultiWinEmpty = useCallback(() => {
    setMultiWinConfigs([])
    setActiveId(null)
    void window.api.setActiveModule(null)
  }, [])

  const showMultiWinPanel = multiWinConfigs.length > 0
  const multiWinVisible = activeId === 'multiwin'

  return (
    <div className="relative flex h-screen w-screen flex-col">
      <TitleBar
        appName={APP_NAME}
        moduleName={titleModule?.name}
        phase={webModule ? status.phase : null}
        onHome={titleModule ? goHome : undefined}
        right={
          !titleModule ? (
            <span className="relative">
              <Button
                variant="ghost"
                size="icon"
                aria-label={hasUpdate ? '设置（有可用更新）' : '设置'}
                className="size-7"
                onClick={() => openModule('settings')}
              >
                <Settings className="size-4" />
              </Button>
              {hasUpdate && (
                <span
                  aria-label="有可用更新"
                  className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-destructive ring-2 ring-background"
                />
              )}
            </span>
          ) : undefined
        }
      />
      <div className="relative flex min-h-0 flex-1 flex-col">
        {activeModule ? (
          webModule ? (
            <WebPanel
              moduleId={webModule.id}
              name={webModule.name}
              status={status}
              onActivate={() => activate?.()}
            />
          ) : reactModule ? (
            <Suspense
              fallback={
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                  加载中…
                </div>
              }
            >
              <reactModule.Component />
            </Suspense>
          ) : null
        ) : (
          <HomePage modules={ENABLED} phases={phases} hasUpdate={hasUpdate} onOpen={openModule} />
        )}

        {showMultiWinPanel && (
          <div className={`absolute inset-0 z-10 bg-background ${multiWinVisible ? '' : 'hidden'}`}>
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  加载中…
                </div>
              }
            >
              <MultiWindowPanel
                initialConfigs={multiWinConfigs}
                onEmpty={handleMultiWinEmpty}
                visible={multiWinVisible}
              />
            </Suspense>
          </div>
        )}
      </div>

      {showMultiWinModal && (
        <ConfigModal
          onConfirm={handleMultiWinConfirm}
          onCancel={() => setShowMultiWinModal(false)}
        />
      )}
    </div>
  )
}
