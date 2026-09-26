import { reactive } from 'vue'
import { PulseEngine, setSharedEngine, type PulseVariant } from '@pulse-music/vue'
import { demoTracks } from '../../../shared-tracks'

export const tracks = demoTracks(import.meta.env.BASE_URL)

/** One engine for the whole page: every player on the site shares this session. */
export const engine = new PulseEngine({ tracks, volume: 0.85 })
setSharedEngine(engine)

/** Page-wide look, driven by the theme gallery and the playground. */
export const look = reactive<{ variant: PulseVariant; accent: string | null }>({
  variant: 'auto',
  accent: null,
})

export const prefersReducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Run a DOM update inside a View Transition when the browser supports it. */
export function withViewTransition(update: () => void): void {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  if (!doc.startViewTransition || prefersReducedMotion()) update()
  else doc.startViewTransition(update)
}
