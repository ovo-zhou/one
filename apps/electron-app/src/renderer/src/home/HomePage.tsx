import { Settings } from 'lucide-react'
import { Button } from '../components/ui/button'
import { StatusBadge } from '../shell/StatusBadge'
import { IS_MAC } from '../shell/TitleBar'
import type { ModuleStatusDot } from '../modules/registry'

interface ModuleCardProps {
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  phase: ModuleStatusDot['phase'] | null
  onOpen: () => void
}

export function ModuleCard({
  name,
  description,
  icon: Icon,
  phase,
  onOpen
}: ModuleCardProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card p-6 outline-none transition-all hover:border-ring/40 hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/30 active:translate-y-px"
    >
      <span className="flex size-16 items-center justify-center rounded-2xl bg-muted transition-colors group-hover:bg-background">
        <Icon className="size-8 text-foreground/80" />
      </span>
      <span className="flex flex-col items-center gap-1">
        <span className="text-sm font-medium">{name}</span>
        <span className="flex h-4 items-center text-xs text-muted-foreground">
          {phase ? <StatusBadge phase={phase} /> : description}
        </span>
      </span>
    </button>
  )
}

interface HomePageProps {
  modules: {
    id: string
    name: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    kind: 'react' | 'web'
  }[]
  phases: Record<string, ModuleStatusDot['phase']>
  onOpen: (moduleId: string) => void
}

export function HomePage({ modules, phases, onOpen }: HomePageProps): React.JSX.Element {
  return (
    <div className="flex h-full flex-1 flex-col overflow-auto">
      {/* Mac shows settings in the custom title bar (App.tsx); elsewhere use
          the in-page button since TitleBar returns null. */}
      {!IS_MAC && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="设置"
          className="absolute top-3 right-3"
          onClick={() => onOpen('settings')}
        >
          <Settings />
        </Button>
      )}
      <div className="flex flex-1 flex-col items-center justify-center gap-10 p-10">
        <h1 className="text-2xl font-semibold tracking-tight">All in One</h1>
        <div className="grid w-full max-w-xl grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4">
          {modules
            .filter((m) => m.id !== 'settings')
            .map((m) => (
              <ModuleCard
                key={m.id}
                name={m.name}
                description={m.description}
                icon={m.icon}
                phase={m.kind === 'web' ? (phases[m.id] ?? 'idle') : null}
                onOpen={() => onOpen(m.id)}
              />
            ))}
        </div>
      </div>
    </div>
  )
}
