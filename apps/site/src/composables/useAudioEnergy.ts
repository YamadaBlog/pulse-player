import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import { engine } from '../lib/site'

/**
 * Pipe the live spectrum into CSS: `--energy` (overall) and `--bass`
 * (low end), both 0..1, written on `target` at display rate while music
 * plays. Runs only while `target` is on screen and motion is allowed.
 */
export function useAudioEnergy(target: Ref<HTMLElement | null>): void {
  let off: (() => void) | null = null
  let io: IntersectionObserver | null = null
  let motion: MediaQueryList | null = null

  const write = (energy: number, bass: number): void => {
    const el = target.value
    if (!el) return
    el.style.setProperty('--energy', energy.toFixed(3))
    el.style.setProperty('--bass', bass.toFixed(3))
  }
  const start = (): void => {
    if (off || motion?.matches) return
    off = engine.onFrame((f) =>
      write(f.energy, ((f.bands[0] ?? 0) + (f.bands[1] ?? 0) + (f.bands[2] ?? 0)) / 3),
    )
  }
  const stop = (): void => {
    off?.()
    off = null
    write(0, 0)
  }
  const onMotion = (): void => (motion?.matches ? stop() : start())

  onMounted(() => {
    if (!target.value) return
    motion = matchMedia('(prefers-reduced-motion: reduce)')
    motion.addEventListener('change', onMotion)
    io = new IntersectionObserver(([entry]) => (entry?.isIntersecting ? start() : stop()))
    io.observe(target.value)
  })
  onBeforeUnmount(() => {
    io?.disconnect()
    motion?.removeEventListener('change', onMotion)
    stop()
  })
}
