import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { dialog } from 'electron'
import { getPrefs } from '../prefs'

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

/**
 * Saves a NativeImage. When a saveDir pref is configured it saves silently
 * there (Snipaste-style quick save); otherwise a save dialog is shown.
 * Returns the written path or null when cancelled.
 */
export async function saveNativeImage(image: Electron.NativeImage): Promise<string | null> {
  const prefs = getPrefs()
  const jpeg = prefs.screenshot.format === 'jpeg'
  const ext = jpeg ? 'jpg' : 'png'
  const name = `截图 ${stamp()}.${ext}`
  const buffer = jpeg ? image.toJPEG(92) : image.toPNG()

  let target: string
  if (prefs.screenshot.saveDir) {
    target = uniquePath(prefs.screenshot.saveDir, name)
  } else {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: '保存截图',
      defaultPath: name,
      filters: [{ name: jpeg ? 'JPEG 图片' : 'PNG 图片', extensions: [ext] }]
    })
    if (canceled || !filePath) return null
    target = filePath
  }
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, buffer)
  return target
}
