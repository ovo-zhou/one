import { House } from 'lucide-react'
import type { ModuleServicePhase } from '../../../shared/contracts'

const DOTS: Record<ModuleServicePhase, string> = {
  idle: 'bg-muted-foreground/50',
  starting: 'bg-amber-500 animate-pulse',
  ready: 'bg-emerald-500',
  error: 'bg-destructive',
  stopped: 'bg-muted-foreground/50'
}

interface FloatingBallProps {
  onHome: () => void
  phase?: ModuleServicePhase | null
}

/**
 * Bottom-right floating home button, overlaid above module content
 * (including iframes). Semi-transparent at rest, fully visible on hover.
 */
export function FloatingBall({ onHome, phase }: FloatingBallProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onHome}
      title="返回主页"
      aria-label="返回主页"
      className="group fixed right-5 bottom-5 z-50 flex size-11 cursor-pointer items-center justify-center rounded-full border border-border/60 bg-card/70 text-foreground/80 shadow-md backdrop-blur-md transition-all duration-200 opacity-50 hover:scale-110 hover:text-foreground hover:opacity-100 active:scale-95"
    >
      <House className="size-5" />
      {phase && (
        <span
          className={`absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-background ${DOTS[phase]}`}
          aria-hidden="true"
        />
      )}
    </button>
  )
}
