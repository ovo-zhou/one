import { app, dialog, Menu } from 'electron'
import {
  getSystemProxyState,
  installRootCa,
  setSystemProxy,
  type SystemProxyState
} from './whistle-actions'

let proxyState: SystemProxyState = { enabled: false, host: null, port: null }
let proxyBusy = false
let caBusy = false

function isWhistleTarget(state: SystemProxyState): boolean {
  return state.enabled && state.host === '127.0.0.1' && state.port === 8899
}

type MenuTemplate = Electron.MenuItemConstructorOptions[]

function buildTemplate(): MenuTemplate {
  const isMac = process.platform === 'darwin'

  const whistleItems: MenuTemplate = [
    {
      id: 'whistle-system-proxy',
      label: '系统代理',
      type: 'checkbox',
      checked: isWhistleTarget(proxyState),
      enabled: !proxyBusy,
      accelerator: 'CmdOrCtrl+Shift+P',
      click: () => {
        void toggleProxy()
      }
    },
    {
      id: 'whistle-install-ca',
      label: '安装 HTTPS 根证书',
      enabled: !caBusy,
      click: () => {
        void runInstallCa()
      }
    }
  ]

  const template: MenuTemplate = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        ...whistleItems,
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    // NOTE: role-based items keep standard shortcuts (copy/paste/quit/...).
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' }
  ]

  if (!isMac) {
    // No app menu on Windows/Linux; keep the first menu minimal with the
    // whistle items and quit.
    template[0] = {
      label: app.name,
      submenu: [...whistleItems, { type: 'separator' }, { role: 'quit' }]
    }
  }

  return template
}

function rebuildMenu(): void {
  Menu.setApplicationMenu(Menu.buildFromTemplate(buildTemplate()))
}

async function refreshProxyState(): Promise<void> {
  proxyState = await getSystemProxyState()
  rebuildMenu()
}

async function toggleProxy(): Promise<void> {
  if (proxyBusy) return
  proxyBusy = true
  rebuildMenu()
  try {
    const enable = !isWhistleTarget(proxyState)
    const result = await setSystemProxy(enable)
    await refreshProxyState()
    if (!result.ok) {
      dialog.showErrorBox('系统代理', result.message)
    }
  } finally {
    proxyBusy = false
    rebuildMenu()
  }
}

async function runInstallCa(): Promise<void> {
  if (caBusy) return
  caBusy = true
  rebuildMenu()
  try {
    const result = await installRootCa()
    if (result.ok) {
      void dialog.showMessageBox({
        type: 'info',
        message: '根证书',
        detail: result.message
      })
    } else {
      dialog.showErrorBox('根证书', result.message)
    }
  } finally {
    caBusy = false
    rebuildMenu()
  }
}

/** Build the application menu with the Whistle section. Call once after ready. */
export function setupMenu(): void {
  rebuildMenu()
  void refreshProxyState()
  // Keep the checkbox in sync when the user changes proxy outside the app.
  setInterval(() => {
    if (!proxyBusy) void refreshProxyState()
  }, 10_000)
}
