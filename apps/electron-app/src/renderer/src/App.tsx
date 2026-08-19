import { Suspense, useCallback, useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
import { HomePage } from './home/HomePage'
import { TitleBar } from './shell/TitleBar'
import { WebPanel } from './shell/WebPanel'
import { getEnabledModules, getModule } from './modules/registry'
import { useModuleStatuses } from './modules/useModuleStatus'
import { Button } from './components/ui/button'
import type { ModuleServiceStatus } from '../../shared/contracts'

const ENABLED = getEnabledModules()
const WEB_IDS = ENABLED.filter((m) => m.kind === 'web').map((m) => m.id)
const IDLE: ModuleServiceStatus = { phase: 'idle', url: null, error: null }
const APP_NAME = 'Faceless'

export default function App(): React.JSX.Element {
  const [activeId, setActiveId] = useState<string | null>(null)
  const statuses = useModuleStatuses(WEB_IDS)
  const activeModule = activeId ? getModule(activeId) : undefined
  const webModule = activeModule?.kind === 'web' ? activeModule : null
  const reactModule = activeModule?.kind === 'react' ? activeModule : null
  const status = (webModule && statuses[webModule.id]) || IDLE
  const phases = Object.fromEntries(WEB_IDS.map((id) => [id, statuses[id]?.phase ?? 'idle']))

  // Restore the in-memory module on window recreation (app still running);
  // a fresh app launch starts on home since memory is empty.
  useEffect(() => {
    void window.api.getActiveModule().then((moduleId) => {
      if (moduleId && getModule(moduleId)) {
        setActiveId(moduleId)
      }
    })
  }, [])

  const openModule = useCallback((moduleId: string) => {
    setActiveId(moduleId)
    void window.api.setActiveModule(moduleId)
    if (getModule(moduleId)?.kind === 'web') {
      void window.api.activateModule(moduleId).catch(() => {})
    }
  }, [])

  const goHome = useCallback(() => {
    setActiveId(null)
    void window.api.setActiveModule(null)
  }, [])

  const activate = webModule ? () => window.api.activateModule(webModule.id).catch(() => {}) : null

  if (!activeModule) {
    return (
      <div className="relative flex h-screen w-screen flex-col">
        <TitleBar
          appName={APP_NAME}
          right={
            <Button
              variant="ghost"
              size="icon"
              aria-label="设置"
              className="size-7"
              onClick={() => openModule('settings')}
            >
              <Settings className="size-4" />
            </Button>
          }
        />
        <HomePage modules={ENABLED} phases={phases} onOpen={openModule} />
      </div>
    )
  }

  return (
    <div className="relative flex h-screen w-screen flex-col">
      <TitleBar
        appName={APP_NAME}
        moduleName={activeModule.name}
        phase={webModule ? status.phase : null}
        onHome={goHome}
      />
      <div className="relative flex min-h-0 flex-1 flex-col">
        {webModule ? (
          <WebPanel name={webModule.name} status={status} onActivate={() => activate?.()} />
        ) : (
          reactModule && (
            <Suspense
              fallback={
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                  加载中…
                </div>
              }
            >
              <reactModule.Component />
            </Suspense>
          )
        )}
      </div>
    </div>
  )
}
