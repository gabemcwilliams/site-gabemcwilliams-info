// app/(landing)/useWarmPremiereAssets.ts
'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function useWarmPremiereAssets(manifestUrl = '/api/v1/premiere-manifest') {
  const router = useRouter()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    // Warm route code
    router.prefetch('/premiere')

    const warm = async () => {
      // Be polite on constrained networks
      const cn = (navigator as any).connection
      if (cn?.saveData) return

      let urls: string[] = []
      try {
        const res = await fetch(manifestUrl, { cache: 'no-cache' })
        urls = await res.json()
      } catch {
        return
      }

      if ('caches' in window) {
        const cache = await caches.open('premiere-assets-v1')
        const CHUNK = 32
        for (let i = 0; i < urls.length; i += CHUNK) {
          const batch = urls.slice(i, i + CHUNK)
          await Promise.allSettled(batch.map(u => cache.add(u).catch(() => {})))
        }
      } else {
        // Fallback warm via Image()
        urls.forEach(src => {
          const img = new Image()
          img.decoding = 'async'
          img.loading = 'eager'
          img.src = src
        })
      }
    }

    // Don’t block interaction; run when idle
    if ('requestIdleCallback' in window) {
      ;(window as any).requestIdleCallback(warm)
    } else {
      setTimeout(warm, 0)
    }
  }, [router, manifestUrl])
}
