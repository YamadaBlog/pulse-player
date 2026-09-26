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
  let visible = false

  const write = (energy: number, bass: number): void => {
    const el = target.value
    if (!el) return
    el.style.setProperty('--energy', energy.toFixed(3))
    el.style.setProperty('--bass', bass.toFixed(3))
  }
  // Single decision point: on screen, motion allowed → listen; otherwise don't.
  const sync = (): void => {
    const wanted = visible && !motion?.matches
    if (wanted && !off) {
      off = engine.onFrame((f) =>
        write(f.energy, ((f.bands[0] ?? 0) + (f.bands[1] ?? 0) + (f.bands[2] ?? 0)) / 3),
      )
    } else if (!wanted && off) {
      off()
      off = null
      write(0, 0)
    }
  }

  onMounted(() => {
    if (!target.value) return
    motion = matchMedia('(prefers-reduced-motion: reduce)')
    motion.addEventListener('change', sync)
    io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting
      sync()
    })
    io.observe(target.value)
  })
  onBeforeUnmount(() => {
    io?.disconnect()
    motion?.removeEventListener('change', sync)
    visible = false
    sync()
  })
}
