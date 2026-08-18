import { execFile } from 'child_process'
import { dirname, join } from 'path'
import { app, shell } from 'electron'

/**
 * TCC (privacy permission) helpers shared by screenshot (ScreenCapture) and
 * selection-translate (Accessibility).
 *
 * Ad-hoc signed builds get a new code hash on every release, so grants from
 * an older install go stale: System Settings still shows the app checked,
 * yet the API keeps reporting "not allowed". Clearing the stored grant via
 * `tccutil reset <service> <bundleId>` forces a clean re-grant that matches
 * the currently running binary.
 */

export type TccService = 'Accessibility' | 'ScreenCapture'

export const SCREEN_CAPTURE_SETTINGS_URL =
  'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'

/** Reads the running app's CFBundleIdentifier (Electron 39 has no getter). */
function readBundleId(callback: (bundleId: string) => void): void {
  if (!app.isPackaged) {
    callback('')
    return
  }
  // .../Contents/MacOS/<exe> -> .../Contents/Info.plist (defaults wants no extension)
  const infoPlist = join(dirname(dirname(process.execPath)), 'Info.plist')
  execFile(
    'defaults',
    ['read', infoPlist.replace(/\.plist$/, ''), 'CFBundleIdentifier'],
    (err, stdout) => callback(err ? '' : stdout.trim())
  )
}

export function resetTccService(service: TccService): void {
  readBundleId((bundleId) => {
    if (!bundleId) {
      console.error(`[tcc] could not determine bundle id for ${service} reset`)
      return
    }
    execFile('tccutil', ['reset', service, bundleId], (err) => {
      if (err) console.error(`[tcc] reset ${service} failed:`, err)
    })
  })
}

export function openPrivacySettings(url: string): void {
  void shell.openExternal(url)
}
