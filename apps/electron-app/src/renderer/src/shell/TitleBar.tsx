import { ChevronRight, House } from 'lucide-react'
import type { ModuleServicePhase } from '../../../shared/contracts'

const DOTS: Record<ModuleServicePhase, string> = {
  idle: 'bg-muted-foreground/50',
  starting: 'bg-amber-500 animate-pulse',
  ready: 'bg-emerald-500',
  error: 'bg-destructive',
  stopped: 'bg-muted-foreground/50'
}

// The custom title bar only renders where the native one is hidden (macOS
// hiddenInset); other platforms keep their native title bar.
export const IS_MAC = navigator.userAgent.includes('Macintosh')

interface TitleBarProps {
  appName: string
  moduleName?: string
  phase?: ModuleServicePhase | null
  onHome?: () => void
  /** Optional trailing content (e.g. settings button), clickable no-drag area. */
  right?: React.ReactNode
}

/**
 * Custom draggable title bar in the traffic-light row (macOS hiddenInset).
 * Home shows the app name; module pages show a "首页 / 模块名" breadcrumb
 * where 首页 returns to the home page.
 */
export function TitleBar({
  appName,
  moduleName,
  phase,
  onHome,
  right
}: TitleBarProps): React.JSX.Element | null {
  if (!IS_MAC) return null

  return (
    <header className="flex h-9 shrink-0 items-center border-b border-border/60 pl-20 pr-4 [-webkit-app-region:drag]">
      {moduleName && onHome ? (
        <nav aria-label="面包屑" className="flex items-center gap-0.5 [-webkit-app-region:no-drag]">
          <button
            type="button"
            onClick={onHome}
            title="返回主页"
            aria-label="返回主页"
            className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
          >
            <House className="size-3.5" />
            首页
          </button>
          <ChevronRight className="mx-0.5 size-3 text-muted-foreground" aria-hidden="true" />
          <span className="flex items-center gap-1.5 px-1 py-1 text-xs font-medium text-foreground/80">
            {phase && (
              <span className={`size-1.5 rounded-full ${DOTS[phase]}`} aria-hidden="true" />
            )}
            {moduleName}
          </span>
        </nav>
      ) : (
        <span className="select-none px-2 text-xs font-medium text-muted-foreground">
          {appName}
        </span>
      )}
      {right && (
        <div className="ml-auto flex items-center [-webkit-app-region:no-drag]">{right}</div>
      )}
    </header>
  )
}
