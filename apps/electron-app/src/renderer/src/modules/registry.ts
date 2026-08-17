import { lazy, type LazyExoticComponent, type ComponentType } from 'react'
import { Bot, Music, Settings, Waypoints, type LucideIcon } from 'lucide-react'
import type { ModuleServiceStatus } from '../../../shared/contracts'

export type ModuleStatusDot = Pick<ModuleServiceStatus, 'phase'>

export interface BaseModule {
  id: string
  name: string
  description: string
  icon: LucideIcon
  order: number
  /** Disabled modules are hidden from the home grid (reserved placeholders). */
  enabled: boolean
}

/** Pure React page rendered by the shell. */
export interface ReactModule extends BaseModule {
  kind: 'react'
  Component: LazyExoticComponent<ComponentType>
}

/** Local web service embedded via iframe; the service lives in main. */
export interface WebModule extends BaseModule {
  kind: 'web'
}

export type AppModule = ReactModule | WebModule

export const MODULES: AppModule[] = [
  {
    id: 'dsh',
    name: 'DeepSeek Harness',
    description: 'AI 编码助手',
    icon: Bot,
    order: 10,
    enabled: true,
    kind: 'web'
  },
  {
    id: 'music',
    name: '音乐',
    description: '本地音乐播放',
    icon: Music,
    order: 20,
    enabled: false,
    kind: 'react',
    Component: lazy(() => import('./music/MusicPanel'))
  },
  {
    id: 'whistle',
    name: 'Whistle 代理',
    description: 'HTTP 调试代理',
    icon: Waypoints,
    order: 30,
    enabled: true,
    kind: 'web'
  },
  {
    id: 'settings',
    name: '设置',
    description: '应用与模块设置',
    icon: Settings,
    order: 90,
    enabled: true,
    kind: 'react',
    Component: lazy(() => import('./settings/SettingsPanel'))
  }
]

export function getEnabledModules(): AppModule[] {
  return MODULES.filter((m) => m.enabled).sort((a, b) => a.order - b.order)
}

export function getModule(id: string): AppModule | undefined {
  return MODULES.find((m) => m.id === id && m.enabled)
}
