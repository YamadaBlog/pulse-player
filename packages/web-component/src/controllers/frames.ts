import type { ReactiveController, ReactiveControllerHost } from 'lit'
import type { PulseEngine } from '@pulse-music/core'
import type { AudioFrame, Unsubscribe } from '@pulse-music/types'
import { onReducedMotionChange, prefersReducedMotion } from '../utils/motion'

type Host = ReactiveControllerHost & HTMLElement

/**
 * Streams visualiser frames to `draw` — but only while the element is on
 * screen and the user hasn't asked for reduced motion. Off-screen
 * players cost nothing per frame.
 */
export class FrameController implements ReactiveController {
  private off: Unsubscribe | null = null
  private observer: IntersectionObserver | null = null
  private offMotion: (() => void) | null = null
  private visible = true
  private reduced = prefersReducedMotion()

  constructor(
    private readonly host: Host,
    private readonly getEngine: () => PulseEngine,
    private readonly draw: (frame: AudioFrame | null) => void,
  ) {
    host.addController(this)
  }

  hostConnected(): void {
    // The preference may have changed while the element was detached.
    this.reduced = prefersReducedMotion()
    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(([entry]) => {
        this.visible = entry?.isIntersecting ?? true
        this.sync()
      })
      this.observer.observe(this.host)
    }
    this.offMotion = onReducedMotionChange((reduced) => {
      this.reduced = reduced
      this.sync()
    })
    this.sync()
  }

  hostDisconnected(): void {
    this.observer?.disconnect()
    this.observer = null
    this.offMotion?.()
    this.offMotion = null
    this.stop()
  }

  /** Re-evaluate after the engine changed. */
  refresh(): void {
    this.stop()
    this.sync()
  }

  private sync(): void {
    const wanted = this.host.isConnected && this.visible && !this.reduced
    if (wanted && !this.off) this.off = this.getEngine().onFrame(this.draw)
    else if (!wanted) this.stop()
  }

  private stop(): void {
    if (!this.off) return
    this.off()
    this.off = null
    this.draw(null)
  }
}
