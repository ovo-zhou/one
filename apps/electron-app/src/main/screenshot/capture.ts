import type { Display } from 'electron'
import { desktopCapturer } from 'electron'

export interface CapturedDisplay {
  /** Electron display id. */
  index: number
  /** CSS px bounds in desktop coordinates. */
  bounds: Electron.Rectangle
  scaleFactor: number
  /** Unique key into the in-memory buffer map. */
  id: string
}

/** In-memory JPEG buffers keyed by capture id. Avoids disk I/O on the critical path. */
const bufferStore = new Map<string, Buffer>()

function makeId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Detects the "all-black thumbnail" failure mode: macOS without screen
 * recording permission sometimes returns non-empty but fully black frames
 * instead of failing. Probes a 1×1 downsample and checks RGB values.
 */
function isLikelyBlack(image: Electron.NativeImage): boolean {
  try {
    const probe = image.resize({ width: 1, height: 1 })
    const buf = probe.toBitmap()
    return buf.length >= 4 && buf[0] === 0 && buf[1] === 0 && buf[2] === 0
  } catch {
    return false
  }
}

/**
 * Captures a single display at its native pixel size. Used lazily: only the
 * display currently under the cursor is captured, when the cursor enters it.
 */
export async function captureOneDisplay(display: Display): Promise<CapturedDisplay> {
  const width = Math.max(1, Math.round(display.bounds.width * display.scaleFactor))
  const height = Math.max(1, Math.round(display.bounds.height * display.scaleFactor))
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width, height }
  })
  // macOS (ScreenCaptureKit) sometimes reports empty/mismatched display ids,
  // which silently falls back to the first source (usually the primary
  // display) and makes the overlay content not align with the display under
  // the cursor. The requested thumbnail size is a reliable fingerprint for
  // the display, so prefer id match, then size match.
  const byId = sources.find((s) => s.display_id === String(display.id))
  const bySize = sources.find(
    (s) =>
      !s.thumbnail.isEmpty() &&
      s.thumbnail.getSize().width === width &&
      s.thumbnail.getSize().height === height
  )
  const source = byId ?? bySize ?? sources[0]
  if (!source || source.thumbnail.isEmpty()) {
    throw new Error(
      '未能捕获屏幕画面。请前往 系统设置 → 隐私与安全性 → 屏幕录制，勾选本应用后重启。\n\n' +
        '开发模式下权限归属于启动应用的终端（如 VS Code 或 Terminal），请勾选对应程序。'
    )
  }
  if (isLikelyBlack(source.thumbnail)) {
    console.error(
      `[screenshot] display ${display.id} captured a fully black frame (` +
        `${source.thumbnail.getSize().width}x${source.thumbnail.getSize().height}) - ` +
        'screen recording permission is likely missing or not yet effective'
    )
    throw new Error(
      '捕获到的屏幕画面是黑色的。请前往 系统设置 → 隐私与安全性 → 屏幕录制，勾选本应用后重启。\n\n' +
        '开发模式下权限归属于启动应用的终端（如 VS Code 或 Terminal），请勾选对应程序。'
    )
  }
  // JPEG encoding is ~10x faster than PNG and avoids disk I/O on the critical path.
  const buf = Buffer.from(source.thumbnail.toJPEG(90))
  const id = makeId()
  bufferStore.set(id, buf)
  console.log(
    `[screenshot] captured display ${display.id}: ${width}x${height}, jpeg ${buf.length} bytes`
  )
  return {
    index: display.id,
    bounds: display.bounds,
    scaleFactor: display.scaleFactor,
    id
  }
}

/** Retrieves the in-memory JPEG buffer for a capture id. */
export function getCapturedBuffer(id: string): Buffer | null {
  return bufferStore.get(id) ?? null
}

/** Removes a captured buffer from memory. */
export function removeCapturedBuffer(id: string): void {
  bufferStore.delete(id)
}
