import { LoaderCircle, RotateCw } from 'lucide-react'
import type { ModuleServiceStatus } from '../../../shared/contracts'
import { Button } from '../components/ui/button'

interface WebPanelProps {
  moduleId: string
  name: string
  status: ModuleServiceStatus
  onActivate: () => void
}

/**
 * Generic embed for modules backed by a local web service: shows startup /
 * error states and mounts the service UI in an iframe once ready.
 */
export function WebPanel({ moduleId, name, status, onActivate }: WebPanelProps): React.JSX.Element {
  if (status.phase === 'ready' && status.url) {
    // DSH authenticates its first page load with a SameSite=Strict cookie. It
    // must therefore be a top-level guest page, rather than a cross-site iframe
    // under the packaged app's file:// renderer origin.
    if (moduleId === 'dsh') {
      return (
        <webview src={status.url} title={name} className="h-full w-full flex-1 bg-background" />
      )
    }

    return (
      <iframe
        src={status.url}
        title={name}
        className="h-full w-full flex-1 border-0 bg-background"
        allow="clipboard-read; clipboard-write; downloads"
      />
    )
  }

  if (status.phase === 'error') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm font-medium">{name} 启动失败</p>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          {status.error ?? '未知错误'}
        </p>
        <Button variant="outline" size="sm" onClick={onActivate}>
          <RotateCw data-icon="inline-start" />
          重试
        </Button>
      </div>
    )
  }

  if (status.phase === 'idle' || status.phase === 'stopped') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-sm text-muted-foreground">{name} 服务未运行</p>
        <Button size="sm" onClick={onActivate}>
          启动服务
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
      <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">正在启动 {name}…</p>
    </div>
  )
}
