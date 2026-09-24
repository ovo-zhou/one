import { useEffect, useState } from 'react'
import { ArrowUpRight, Settings, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/button'
import { StatusBadge } from '../shell/StatusBadge'
import { IS_MAC } from '../shell/TitleBar'
import type { ModuleStatusDot } from '../modules/registry'

/** Per-module accent tint (cycled). Static strings so the Tailwind JIT keeps them. */
const ACCENTS = [
  'bg-chart-1/10 text-chart-1 group-hover:bg-chart-1/15',
  'bg-chart-2/10 text-chart-2 group-hover:bg-chart-2/15',
  'bg-chart-3/10 text-chart-3 group-hover:bg-chart-3/15',
  'bg-chart-4/10 text-chart-4 group-hover:bg-chart-4/15',
  'bg-chart-5/10 text-chart-5 group-hover:bg-chart-5/15'
] as const

interface ModuleCardProps {
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  phase: ModuleStatusDot['phase'] | null
  accent: string
  onOpen: () => void
}

export function ModuleCard({
  name,
  description,
  icon: Icon,
  phase,
  accent,
  onOpen
}: ModuleCardProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/80 p-5 text-left outline-none backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-[0_12px_32px_-12px_rgb(0_0_0/20%)] focus-visible:ring-3 focus-visible:ring-ring/30 active:translate-y-0"
    >
      {phase && (
        <span className="absolute top-3.5 right-3.5">
          <StatusBadge phase={phase} />
        </span>
      )}
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-105 ${accent}`}
      >
        <Icon className="size-5" />
      </span>
      <span className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1 text-sm font-medium text-card-foreground">
          {name}
          <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
        </span>
        <span className="line-clamp-2 min-h-8 pr-4 text-xs leading-4 text-muted-foreground">
          {description}
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
  hasUpdate: boolean
  onOpen: (moduleId: string) => void
}

export function HomePage({ modules, phases, hasUpdate, onOpen }: HomePageProps): React.JSX.Element {
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    void window.api.getAppInfo().then((info) => setVersion(info.version))
  }, [])

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-auto">
      {/* Mac shows settings in the custom title bar (App.tsx); elsewhere use
          the in-page button since TitleBar returns null. */}
      {!IS_MAC && (
        <span className="absolute top-3 right-3 z-10">
          <Button
            variant="ghost"
            size="icon"
            aria-label={hasUpdate ? '设置（有可用更新）' : '设置'}
            onClick={() => onOpen('settings')}
          >
            <Settings />
          </Button>
          {hasUpdate && (
            <span
              aria-label="有可用更新"
              className="pointer-events-none absolute top-0.5 right-0.5 size-1.5 rounded-full bg-destructive ring-2 ring-background"
            />
          )}
        </span>
      )}

      {/* Ambient aurora glow behind the hero. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[28rem]">
        <div className="absolute top-[-12rem] left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-chart-1/10 blur-[100px]" />
        <div className="absolute top-[2rem] left-[12%] size-64 rounded-full bg-chart-4/10 blur-[80px]" />
        <div className="absolute top-[4rem] right-[10%] size-72 rounded-full bg-chart-2/10 blur-[80px]" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-9 p-10 py-16">
        <header className="flex flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
            <Sparkles className="size-3" />
            可扩展的开发者助手{version ? ` · v${version}` : ''}
          </span>
          <h1 className="bg-gradient-to-br from-foreground via-foreground/80 to-foreground/40 bg-clip-text text-4xl font-semibold tracking-tight text-transparent">
            Faceless
          </h1>
        </header>

        <div className="grid w-full max-w-3xl grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-4">
          {modules
            .filter((m) => m.id !== 'settings')
            .map((m, index) => (
              <ModuleCard
                key={m.id}
                name={m.name}
                description={m.description}
                icon={m.icon}
                phase={m.kind === 'web' ? (phases[m.id] ?? 'idle') : null}
                accent={ACCENTS[index % ACCENTS.length]}
                onOpen={() => onOpen(m.id)}
              />
            ))}
        </div>
      </div>
    </div>
  )
}
