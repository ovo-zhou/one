import type { ModuleServicePhase } from '../../../shared/contracts'

const LABELS: Record<ModuleServicePhase, { text: string; dot: string }> = {
  idle: { text: '未启动', dot: 'bg-muted-foreground/40' },
  starting: { text: '启动中', dot: 'bg-amber-500 animate-pulse' },
  ready: { text: '运行中', dot: 'bg-emerald-500' },
  error: { text: '错误', dot: 'bg-destructive' },
  stopped: { text: '已停止', dot: 'bg-muted-foreground/40' }
}

export function StatusBadge({ phase }: { phase: ModuleServicePhase }): React.JSX.Element {
  const item = LABELS[phase]
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`size-2 rounded-full ${item.dot}`} />
      {item.text}
    </span>
  )
}
