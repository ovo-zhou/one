import { lazy, type LazyExoticComponent, type ComponentType } from 'react'
import { Bot, Braces, ImagePlus, Settings, Waypoints, type LucideIcon } from 'lucide-react'
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
    id: 'json',
    name: 'JSON 工具',
    description: 'JSON 解析 · 格式化 · 折叠',
    icon: Braces,
    order: 12,
    enabled: true,
    kind: 'react',
    Component: lazy(() => import('./json/JsonPanel'))
  },
  {
    id: 'testimage',
    name: '测试图生成',
    description: '占位图 · 尺寸 · 导出',
    icon: ImagePlus,
    order: 14,
    enabled: true,
    kind: 'react',
    Component: lazy(() => import('./testimage/TestImagePanel'))
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
