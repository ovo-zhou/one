const fs = require('node:fs')
const path = require('node:path')

/**
 * electron-builder afterPack hook: copy the services node_modules tree into
 * the app bundle. extraResources intentionally does not copy directories
 * named node_modules, so we do it explicitly (symlinks dereferenced).
 */
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

  fs.cpSync(path.join(src, 'node_modules'), path.join(resourcesDir, 'services', 'node_modules'), {
    recursive: true
  })
  console.log(`  • afterPack  copied services/node_modules -> ${resourcesDir}/services`)
}
