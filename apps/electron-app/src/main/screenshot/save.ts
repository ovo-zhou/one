import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { dialog } from 'electron'
import { getPrefs } from '../prefs'
import type { ScreenshotFormat } from '../../shared/contracts'

function stamp(): string {
  const d = new Date()
  const pad = (n: number): string => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}.${pad(d.getMinutes())}.${pad(d.getSeconds())}`
  )
}

function uniquePath(dir: string, name: string): string {
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  let candidate = join(dir, name)
  for (let i = 2; i < 1000 && existsSync(candidate); i++) {
    candidate = join(dir, `${base} (${i})${ext}`)
  }
  return candidate
}

const EXT_BY_FORMAT: Record<ScreenshotFormat, string> = { png: 'png', jpeg: 'jpg', webp: 'webp' }

const LABEL_BY_EXT: Record<string, string> = {
  png: 'PNG 图片',
  jpg: 'JPEG 图片',
  webp: 'WebP 图片'
}

/**
 * Writes an already-encoded image buffer. When a saveDir pref is configured
 * it saves silently there (Snipaste-style quick save); otherwise a save
 * dialog is shown. Returns the written path or null when cancelled.
 */
async function saveBuffer(buffer: Buffer, ext: string): Promise<string | null> {
  const prefs = getPrefs()
  const name = `截图 ${stamp()}.${ext}`

  let target: string
  if (prefs.screenshot.saveDir) {
    target = uniquePath(prefs.screenshot.saveDir, name)
  } else {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: '保存截图',
      defaultPath: name,
      filters: [{ name: LABEL_BY_EXT[ext] ?? '图片', extensions: [ext] }]
    })
    if (canceled || !filePath) return null
    target = filePath
  }
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, buffer)
  return target
}

/**
 * Saves a screenshot data URL as-is: the renderer already encoded it per the
 * format pref (incl. WebP, which NativeImage cannot encode), so the bytes are
 * written directly without recompression.
 */
export async function saveDataUrl(dataUrl: string): Promise<string | null> {
  const match = /^data:image\/(png|jpeg|webp);base64,(.+)$/.exec(dataUrl)
  if (!match) throw new Error('unsupported image data')
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
  return saveBuffer(Buffer.from(match[2], 'base64'), ext)
}

/**
 * Saves a NativeImage (pin windows) per the format pref. NativeImage cannot
 * encode WebP, so pins fall back to PNG in that case.
 */
export async function saveNativeImage(image: Electron.NativeImage): Promise<string | null> {
  const format = getPrefs().screenshot.format
  const buffer = format === 'jpeg' ? image.toJPEG(92) : image.toPNG()
  return saveBuffer(buffer, format === 'webp' ? 'png' : EXT_BY_FORMAT[format])
}
