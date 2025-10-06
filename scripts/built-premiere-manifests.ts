// Debug-friendly manifest builder
import fg from 'fast-glob'
import path from 'node:path'
import fs from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'

/**
 * If you're in a monorepo, set APP_DIR to your Next app root:
 *   APP_DIR=apps/web  npm run dev
 */
const APP_DIR = process.env.APP_DIR || process.cwd()

// Where your Next app's public folder is:
const PUBLIC_DIR = path.join(APP_DIR, 'public')

// Adjust roots/pattern as needed:
const ASSET_ROOT = 'assets/showcase/premiere'
const EXTS = ['svg','png','jpg','jpeg','webp','gif','avif','mp4','webm']
const PATTERN = path.join(PUBLIC_DIR, `${ASSET_ROOT}/**/*.{${EXTS.join(',')}}`)

// Output file (served at /assets/premiere-manifest.json)
const OUT_FILE = path.join(PUBLIC_DIR, 'assets', 'premiere-manifest.json')

async function main() {
  console.log('--- build-premiere-manifest ---')
  console.log('process.cwd() =', process.cwd())
  console.log('APP_DIR        =', APP_DIR)
  console.log('PUBLIC_DIR     =', PUBLIC_DIR)
  console.log('GLOB PATTERN   =', PATTERN)
  console.log('OUT FILE       =', OUT_FILE)

  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error('ERROR: public/ directory not found at', PUBLIC_DIR)
    process.exit(1)
  }

  const files = await fg(PATTERN, { onlyFiles: true, unique: true })
  console.log('Matched files  =', files.length)

  // Convert absolute disk paths -> web URLs
  const urls = files.map((abs) => {
    // Split at /public/ and normalize slashes
    const idx = abs.replace(/\\/g, '/').indexOf('/public/')
    const rel = idx >= 0 ? abs.replace(/\\/g, '/').slice(idx + '/public'.length) : abs
    return rel.startsWith('/') ? rel : `/${rel}`
  })

  // Ensure parent dir exists
  await mkdir(path.dirname(OUT_FILE), { recursive: true })

  await writeFile(OUT_FILE, JSON.stringify(urls, null, 2), 'utf8')
  console.log(`Wrote ${urls.length} URLs → ${OUT_FILE}`)
}

main().catch((e) => {
  console.error('Manifest build failed:', e)
  process.exit(1)
})
