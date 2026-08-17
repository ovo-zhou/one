import { join } from 'path'
import { randomUUID } from 'crypto'
import { mkdir, rm, writeFile } from 'fs/promises'
import { BrowserWindow, clipboard } from 'electron'
import { is } from '@electron-toolkit/utils'
import type { ScreenshotPinAction } from '../../shared/contracts'
import { pinsDir } from './paths'
import { saveNativeImage } from './save'

interface PinEntry {
  win: BrowserWindow
  image: Electron.NativeImage
  file: string
}

let nextId = 1
const pins = new Map<number, PinEntry>()

/** In-memory PNG buffers keyed by absolute file path, served to pin windows. */
const pinBuffers = new Map<string, Buffer>()

/** Returns the in-memory PNG bytes for a pin image path (see readScreenshotImage). */
export function getPinBuffer(file: string): Buffer | null {
  return pinBuffers.get(file) ?? null
}

/** Creates an always-on-top pin window showing the given image. */
export async function createPin(
  image: Electron.NativeImage,
  width: number,
  height: number
): Promise<number> {
  const id = nextId++
  const file = `pin-${id}-${randomUUID().slice(0, 8)}.png`
  const path = join(pinsDir(), file)
  const png = image.toPNG()
  pinBuffers.set(path, png)
  await mkdir(pinsDir(), { recursive: true })
  await writeFile(path, png)

  const w = Math.max(40, Math.round(width))
  const h = Math.max(40, Math.round(height))

  const win = new BrowserWindow({
    width: w,
    height: h,
    minWidth: 40,
    minHeight: 40,
    useContentSize: true,
    frame: false,
    hasShadow: true,
    resizable: true,
    maximizable: false,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  win.setAlwaysOnTop(true, 'floating')

  const query: Record<string, string> = {
    id: String(id),
    file: path,
    w: String(w),
    h: String(h)
  }
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const url = new URL(`${process.env['ELECTRON_RENDERER_URL']}/pin.html`)
    url.search = new URLSearchParams(query).toString()
    void win.loadURL(url.toString())
  } else {
    void win.loadFile(join(__dirname, '../renderer/pin.html'), { query })
  }
  win.once('ready-to-show', () => {
    win.show()
  })
  win.on('closed', () => {
    pins.delete(id)
    pinBuffers.delete(path)
    void rm(path, { force: true })
  })

  pins.set(id, { win, image, file })
  return id
}

export async function handlePinAction(id: number, action: ScreenshotPinAction): Promise<void> {
  const entry = pins.get(id)
  if (!entry) return
  switch (action) {
    case 'close':
      entry.win.destroy()
      break
    case 'copy':
      clipboard.writeImage(entry.image)
      break
    case 'save':
      await saveNativeImage(entry.image)
      break
  }
}

export function resizePin(id: number, width: number, height: number): void {
  const entry = pins.get(id)
  if (!entry) return
  const b = entry.win.getBounds()
  entry.win.setBounds({
    x: b.x,
    y: b.y,
    width: Math.max(40, Math.round(width)),
    height: Math.max(40, Math.round(height))
  })
}

export function setPinOpacity(id: number, opacity: number): void {
  const entry = pins.get(id)
  if (!entry) return
  entry.win.setOpacity(Math.min(1, Math.max(0.1, opacity)))
}

export function closeAllPins(): void {
  for (const entry of pins.values()) {
    entry.win.destroy()
  }
}

export async function cleanupPinImages(): Promise<void> {
  await rm(pinsDir(), { recursive: true, force: true })
}
