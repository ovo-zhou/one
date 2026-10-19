import { join } from 'path'
import { app } from 'electron'

/** Temp storage for captured screenshots and pin images. */
export function captureDir(): string {
  return join(app.getPath('temp'), 'one-screenshot', 'capture')
}

export function pinsDir(): string {
  return join(app.getPath('temp'), 'one-screenshot', 'pins')
}
