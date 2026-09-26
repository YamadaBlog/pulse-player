const cache = new Map<string, Promise<string | null>>()

function isCrossOrigin(url: string): boolean {
  try {
    const u = new URL(url, location.href)
    return u.origin !== location.origin && u.protocol !== 'data:' && u.protocol !== 'blob:'
  } catch {
    return true
  }
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [h * 60, s, l]
}

/**
 * Pick a vivid accent colour from an image. Pixels are bucketed by hue,
 * weighted towards saturated mid-tones, and the winning hue is returned
 * as a legible `hsl()` colour. Resolves `null` when the image can't be
 * read (tainted cross-origin canvas, decode error, no DOM).
 */
export function sampleAccent(url: string): Promise<string | null> {
  const cached = cache.get(url)
  if (cached) return cached
  const job = new Promise<string | null>((resolve) => {
    if (typeof document === 'undefined' || typeof Image === 'undefined') return resolve(null)
    const img = new Image()
    if (isCrossOrigin(url)) img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onerror = () => resolve(null)
    img.onload = () => {
      try {
        const size = 32
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return resolve(null)
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)
        const buckets = Array.from({ length: 12 }, () => ({ w: 0, h: 0, s: 0 }))
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue
          const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2])
          const weight = s * s * (1 - Math.abs(l - 0.55) * 1.6)
          if (weight <= 0.02) continue
          const b = buckets[Math.floor(h / 30) % 12]
          b.w += weight
          b.h += h * weight
          b.s += s * weight
        }
        const best = buckets.reduce((a, b) => (b.w > a.w ? b : a))
        if (best.w < 1) return resolve(null)
        const hue = Math.round(best.h / best.w)
        const sat = Math.round(Math.max(0.6, Math.min(0.9, best.s / best.w)) * 100)
        resolve(`hsl(${hue} ${sat}% 64%)`)
      } catch {
        resolve(null)
      }
    }
    img.src = url
  })
  cache.set(url, job)
  return job
}

/** Deterministic hue from a string — used for artwork placeholders. */
export function hueFrom(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return h % 360
}

/**
 * Wrap a URL in a CSS `url()` as a quoted string. Only the characters that
 * could end the string are escaped, so already-encoded URLs stay intact.
 */
export function cssUrl(url: string): string {
  const escaped = url.replace(/["\\\n\r\f]/g, (c) => (c === '"' || c === '\\' ? `\\${c}` : ''))
  return `url("${escaped}")`
}
