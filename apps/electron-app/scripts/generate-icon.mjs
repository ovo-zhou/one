// Regenerates app icons from an embedded SVG (Faceless prompt mark).
// Usage: node scripts/generate-icon.mjs
// Outputs: build/icon.icns, build/icon.ico, build/icon.png, resources/icon.png
import { existsSync, readdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP = path.resolve(__dirname, '..')

// pnpm keeps sharp out of the hoisted tree; resolve it from the root store.
function loadSharp() {
  const req = createRequire(import.meta.url)
  try {
    return req('sharp')
  } catch {
    let dir = APP
    while (!existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
      const parent = path.dirname(dir)
      if (parent === dir) throw new Error('workspace root not found')
      dir = parent
    }
    const store = path.join(dir, 'node_modules', '.pnpm')
    const hit = readdirSync(store)
      .filter((d) => /^sharp@\d/.test(d))
      .sort()
      .at(-1)
    if (!hit) throw new Error('sharp not found in pnpm store')
    return req(path.join(store, hit, 'node_modules', 'sharp'))
  }
}

const SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fbf8f2"/>
      <stop offset="1" stop-color="#e9e4da"/>
    </linearGradient>
  </defs>

  <rect width="1024" height="1024" rx="230" fill="url(#bg)"/>
  <path d="M 334 332 L 512 512 L 334 692" fill="none" stroke="#242321" stroke-width="84" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 584 690 H 748" fill="none" stroke="#56534e" stroke-width="84" stroke-linecap="round"/>
  <rect x="4" y="4" width="1016" height="1016" rx="226" fill="none" stroke="#242321" stroke-opacity="0.1" stroke-width="8"/>
</svg>
`

async function main() {
  const sharp = loadSharp()
  const sizes = [16, 32, 48, 64, 128, 256, 512, 1024]
  const png = {}
  for (const s of sizes) {
    png[s] = await sharp(Buffer.from(SVG)).resize(s, s).png().toBuffer()
  }

  // ---- icns ----
  // Store the PNG representations directly. This is the modern ICNS format
  // and avoids relying on iconutil, which is unavailable in CI and rejects
  // valid iconsets on some macOS releases.
  const icnsEntries = [
    ['icp4', 16],
    ['icp5', 32],
    ['icp6', 64],
    ['ic07', 128],
    ['ic08', 256],
    ['ic09', 512],
    ['ic10', 1024]
  ]
  const icnsChunks = icnsEntries.map(([type, size]) => {
    const image = png[size]
    const chunk = Buffer.alloc(8 + image.length)
    chunk.write(type, 0, 4, 'ascii')
    chunk.writeUInt32BE(chunk.length, 4)
    image.copy(chunk, 8)
    return chunk
  })
  const icnsSize = 8 + icnsChunks.reduce((total, chunk) => total + chunk.length, 0)
  const icnsHeader = Buffer.alloc(8)
  icnsHeader.write('icns', 0, 4, 'ascii')
  icnsHeader.writeUInt32BE(icnsSize, 4)
  await writeFile(path.join(APP, 'build', 'icon.icns'), Buffer.concat([icnsHeader, ...icnsChunks]))

  // ---- ico (PNG-compressed entries) ----
  const icoSizes = [16, 32, 48, 64, 128, 256]
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(icoSizes.length, 4)
  let offset = 6 + icoSizes.length * 16
  const dir = Buffer.alloc(icoSizes.length * 16)
  const blobs = []
  icoSizes.forEach((s, i) => {
    const o = i * 16
    dir.writeUInt8(s >= 256 ? 0 : s, o)
    dir.writeUInt8(s >= 256 ? 0 : s, o + 1)
    dir.writeUInt8(0, o + 2)
    dir.writeUInt8(0, o + 3)
    dir.writeUInt16LE(1, o + 4)
    dir.writeUInt16LE(32, o + 6)
    dir.writeUInt32LE(png[s].length, o + 8)
    dir.writeUInt32LE(offset, o + 12)
    offset += png[s].length
    blobs.push(png[s])
  })
  await writeFile(path.join(APP, 'build', 'icon.ico'), Buffer.concat([header, dir, ...blobs]))

  // ---- png ----
  await writeFile(path.join(APP, 'build', 'icon.png'), png[512])
  await writeFile(path.join(APP, 'resources', 'icon.png'), png[512])

  console.log('icons generated: build/icon.icns, build/icon.ico, build/icon.png, resources/icon.png')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
