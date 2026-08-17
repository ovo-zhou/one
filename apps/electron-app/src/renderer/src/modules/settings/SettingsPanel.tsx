import { useEffect, useState } from 'react'
import type { AppInfo } from '../../../../shared/contracts'
import { MODULES } from '../registry'

export default function SettingsPanel(): React.JSX.Element {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)

  useEffect(() => {
    void window.api.getAppInfo().then(setAppInfo)
  }, [])

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">关于</h2>
          <dl className="grid grid-cols-[6rem_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">应用</dt>
            <dd>All in One</dd>
            <dt className="text-muted-foreground">版本</dt>
            <dd>{appInfo ? appInfo.version : '—'}</dd>
            <dt className="text-muted-foreground">平台</dt>
            <dd>{appInfo ? appInfo.platform : '—'}</dd>
          </dl>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">模块</h2>
          <ul className="flex flex-col divide-y">
            {MODULES.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2.5 text-sm">
                <m.icon className="size-4 text-muted-foreground" />
                <span className="font-medium">{m.name}</span>
                <span className="text-xs text-muted-foreground">{m.description}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {m.enabled ? (m.kind === 'web' ? '本地服务' : '内置页面') : '即将推出'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
