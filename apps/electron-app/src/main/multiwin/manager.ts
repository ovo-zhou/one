import { BrowserWindow } from 'electron'
import { getMainWindow } from '../window'
import { IPC, type MultiWinTab } from '../../shared/contracts'

type LoadStatus = 'loading' | 'ready' | 'error'

// On macOS the shell uses `hiddenInset`, so the custom title bar (h-9 = 36px)
// is drawn inside the webContents and the content area starts below it. Other
// platforms keep a native title bar, already excluded from getContentBounds.
const TITLEBAR_H = process.platform === 'darwin' ? 36 : 0

interface Tab {
  id: string
  url: string
  devtools: boolean
  win: BrowserWindow
  status: LoadStatus
}

/**
 * Owns the multi-window (窗口多开) session: each tab is its own child
 * BrowserWindow parented to the shell. Because every tab uses a *top-level*
 * webContents, `webContents.openDevTools({ mode })` docks natively inside that
 * tab's window — no separate floating DevTools and zero cross-tab interference.
 */
class MultiWinManager {
  private tabs = new Map<string, Tab>()
  private activeId: string | null = null
  private sidebarOpen = true
  private sidebarW = 224
  private started = false
  private visible = true

  start(tabs: MultiWinTab[]): void {
    this.stop()
    this.started = true
    const parent = getMainWindow()
    if (!parent) return
    parent.on('resize', this.onParentResize)

    for (const tab of tabs) {
      this.createTab(tab)
    }
    if (tabs.length > 0) this.setActive(tabs[0].id)
    this.relayout()
  }

  stop(): void {
    if (!this.started) return
    this.started = false
    getMainWindow()?.off('resize', this.onParentResize)
    for (const tab of this.tabs.values()) {
      this.closeDevToolsFor(tab)
      tab.win.destroy()
    }
    this.tabs.clear()
    this.activeId = null
    this.visible = true
  }

  add(tab: MultiWinTab): void {
    if (!this.started) return
    if (this.tabs.has(tab.id)) return
    this.createTab(tab)
    this.setActive(tab.id)
    this.relayout()
  }

  remove(id: string): void {
    const tab = this.tabs.get(id)
    if (!tab) return
    this.closeDevToolsFor(tab)
    tab.win.destroy()
    this.tabs.delete(id)
    if (this.activeId === id) {
      const next = this.tabs.keys().next()
      this.activeId = next.done ? null : next.value
      if (this.activeId) this.setActive(this.activeId)
    }
    this.relayout()
  }

  setActive(id: string): void {
    const tab = this.tabs.get(id)
    if (!tab) return
    this.activeId = id
    for (const t of this.tabs.values()) {
      if (t.id === id) {
        if (t.status === 'ready') t.win.show()
        t.win.focus()
      } else {
        t.win.hide()
      }
    }
    // Reposition the now-active window to the content area (non-active tabs are
    // never laid out, so this keeps switching visually correct in real time).
    this.relayout()
  }

  setDevtools(id: string, on: boolean): void {
    const tab = this.tabs.get(id)
    if (!tab) return
    tab.devtools = on
    if (on) {
      // Top-level webContents → native docked DevTools in this window.
      tab.win.webContents.openDevTools({ mode: 'right' })
    } else {
      this.closeDevToolsFor(tab)
    }
  }

  reload(id: string): void {
    const tab = this.tabs.get(id)
    if (!tab) return
    tab.status = 'loading'
    this.broadcast(id, 'loading')
    tab.win.webContents.reload()
  }

  layout(info: { sidebarOpen: boolean; sidebarW: number }): void {
    this.sidebarOpen = info.sidebarOpen
    this.sidebarW = info.sidebarW
    this.relayout()
  }

  /**
   * Show/hide every session window without destroying the session (the
   * renderer keeps the panel mounted to preserve tab state, so navigating
   * away must hide the native child windows explicitly).
   */
  setVisible(visible: boolean): void {
    if (!this.started) return
    this.visible = visible
    const active = this.activeId ? this.tabs.get(this.activeId) : undefined
    if (!visible) {
      for (const tab of this.tabs.values()) tab.win.hide()
      return
    }
    this.relayout()
    if (active && active.status === 'ready') active.win.show()
  }

  private onParentResize = (): void => {
    this.relayout()
  }

  private createTab(tab: MultiWinTab): void {
    const parent = getMainWindow()
    if (!parent) return
    const win = new BrowserWindow({
      parent,
      show: false,
      skipTaskbar: true,
      frame: false,
      // macOS frameless child windows add a drop shadow + a 1px hairline border
      // and default rounded corners; we want a flush, square browser area.
      roundedCorners: false,
      backgroundColor: '#ffffff',
      webPreferences: {
        partition: `multiwin-${tab.id}`,
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false
      }
    })
    // Remove the default macOS window drop shadow.
    win.setHasShadow(false)
    const record: Tab = { ...tab, win, status: 'loading' }
    this.tabs.set(tab.id, record)

    win.webContents.on('did-finish-load', () => {
      record.status = 'ready'
      this.broadcast(tab.id, 'ready')
      if (this.activeId === tab.id && this.visible) win.show()
      if (tab.devtools) win.webContents.openDevTools({ mode: 'right' })
    })
    win.webContents.on('did-fail-load', () => {
      record.status = 'error'
      this.broadcast(tab.id, 'error')
    })
    // Keep our per-tab devtools flag in sync when the user closes/opens the
    // DevTools from inside the panel (e.g. the close button in DevTools).
    win.webContents.on('devtools-opened', () => {
      tab.devtools = true
    })
    win.webContents.on('devtools-closed', () => {
      tab.devtools = false
    })
    // Intercept the default DevTools shortcuts (F12 / Ctrl+Shift+I / Cmd+Opt+I):
    // the built-in handler opens undocked (new window), so route them through
    // our docked (right) toggle instead.
    win.webContents.on('before-input-event', (_event, input) => {
      const key = input.key?.toLowerCase()
      const isDevTools =
        input.key === 'F12' ||
        ((input.control || input.meta) && input.shift && key === 'i') ||
        (input.meta && input.alt && key === 'i')
      if (isDevTools) {
        _event.preventDefault()
        this.setDevtools(tab.id, !tab.devtools)
      }
    })
    void win.loadURL(tab.url)
  }

  private closeDevToolsFor(tab: Tab): void {
    if (tab.win.webContents.isDevToolsOpened()) {
      tab.win.webContents.closeDevTools()
    }
  }

  private relayout(): void {
    const parent = getMainWindow()
    if (!parent) return
    const cb = parent.getContentBounds()
    const sw = this.sidebarOpen ? this.sidebarW : 32
    const x = cb.x + sw
    const y = cb.y + TITLEBAR_H
    const w = Math.max(0, cb.width - sw)
    const h = Math.max(0, cb.height - TITLEBAR_H)
    for (const tab of this.tabs.values()) {
      if (tab.id === this.activeId) {
        tab.win.setBounds({ x, y, width: w, height: h })
      }
    }
  }

  private broadcast(id: string, status: LoadStatus): void {
    const parent = getMainWindow()
    if (!parent) return
    parent.webContents.send(IPC.multiwinStatus, { id, status })
  }
}

export const multiWinManager = new MultiWinManager()
