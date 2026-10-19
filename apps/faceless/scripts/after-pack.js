const fs = require('node:fs')
const path = require('node:path')

/**
 * electron-builder afterPack hook: copy the services node_modules tree into
 * the app bundle. extraResources intentionally does not copy directories
 * named node_modules, so we do it explicitly (symlinks dereferenced).
 */

function dereferenceSymlinks(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isSymbolicLink()) {
      const target = fs.realpathSync(p)
      const st = fs.statSync(target)
      fs.rmSync(p)
      if (st.isDirectory()) {
        fs.cpSync(target, p, { recursive: true, dereference: true })
        dereferenceSymlinks(p)
      } else {
        fs.copyFileSync(target, p)
      }
    } else if (entry.isDirectory()) {
      dereferenceSymlinks(p)
    }
  }
}

exports.default = async function afterPack(context) {
  const projectDir = context.packager.info.projectDir
  const src = path.join(projectDir, 'resources', 'services')

  let resourcesDir
  if (process.platform === 'darwin') {
    // appOutDir contains "<product>.app"
    const appBundle = path.join(
      context.appOutDir,
      `${context.packager.appInfo.productFilename}.app`
    )
    resourcesDir = path.join(appBundle, 'Contents', 'Resources')
  } else {
    resourcesDir = path.join(context.appOutDir, 'resources')
  }

  const dest = path.join(resourcesDir, 'services', 'node_modules')
  fs.cpSync(path.join(src, 'node_modules'), dest, {
    recursive: true,
    dereference: true
  })
  // fs.cpSync keeps absolute symlinks as-is even with dereference: true
  // (verified on Node 22/24), which breaks macOS code signing.
  dereferenceSymlinks(dest)
  console.log(`  • afterPack  copied services/node_modules -> ${resourcesDir}/services`)
}
