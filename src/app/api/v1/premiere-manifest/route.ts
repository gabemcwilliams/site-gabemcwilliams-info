// Node runtime because we need fs/glob
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import fg from 'fast-glob'
import path from 'node:path'

export async function GET() {
  const exts = ['svg','png','jpg','jpeg','webp','gif','avif','mp4','webm']
  const pattern = `public/assets/showcase/premiere/stage_setting/**/*.{${exts.join(',')}}`

  const files = await fg(pattern, { onlyFiles: true, unique: true })
  const urls = files.map(f => `/${f.replace(/^public[\\/]/, '').split(path.sep).join('/')}`)

  // Cache for a day at the edge; revalidate as needed
  return NextResponse.json(urls, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
    }
  })
}
