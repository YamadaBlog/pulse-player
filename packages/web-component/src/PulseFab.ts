import { LitElement, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import type { PulseEngine } from '@pulse/core'
import type { PulseState, PulseVariant, Unsubscribe } from '@pulse/types'
import { getSharedEngine } from './engine-singleton'
import { baseStyles, fabStyles } from './styles'

/**
 * `<pulse-fab>` — universal floating action button Custom Element.
 *
 * Compact disc-shaped player. Same singleton engine as
 * `<pulse-player>` — toggling one toggles both. Mirrors the
 * v2.3.4 MiniPlayer.vue behaviour for the play / pause + variant
 * surface.
 *
 * Attributes:
 *   - `variant` : PulseVariant (default 'auto')
 *   - `pulso`   : presence attribute (`<pulse-fab pulso>`) enables the
 *                 heartbeat ring while audio plays
 *
 * Events: same as `<pulse-player>` (events bubble + compose, so a
 * single parent listener covers both elements).
 *
 * Status: v3.0.0-alpha.2 SKELETON. Renders the disc + play/pause +
 * variant. Drag-to-reposition, radial menu, pulso heartbeat
 * keyframes land in subsequent alphas. The Lit controller pattern is
 * in place — adding drag is additive logic, not architectural
 * refactor.
 */
@customElement('pulse-fab')
export class PulseFabElement extends LitElement {
  static override styles = [baseStyles, fabStyles]

  @property({ type: String, reflect: true })
  variant: PulseVariant = 'auto'

  @property({ type: Boolean, reflect: true })
  pulso = false

  @state()
  private state: PulseState = {
    currentTrack: 0,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isVisible: false,
    hasBeenOpened: false,
    ambientEq: false,
    playCount: 0,
    pauseCount: 0,
    trackChangeCount: 0,
  }

  private engine: PulseEngine = getSharedEngine()
  private offState: Unsubscribe | undefined
  private offPlay: Unsubscribe | undefined
  private offPause: Unsubscribe | undefined
  private offTrackChange: Unsubscribe | undefined
  private offError: Unsubscribe | undefined

  override connectedCallback(): void {
    super.connectedCallback()
    this.offState = this.engine.onStateChange((s) => {
      this.state = { ...s }
    })
    this.offPlay = this.engine.subscribe('play', (detail) => this.fire('pulse-play', detail))
    this.offPause = this.engine.subscribe('pause', (detail) => this.fire('pulse-pause', detail))
    this.offTrackChange = this.engine.subscribe('trackchange', (detail) =>
      this.fire('pulse-trackchange', detail),
    )
    this.offError = this.engine.subscribe('error', (detail) => this.fire('pulse-error', detail))
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.offState?.()
    this.offPlay?.()
    this.offPause?.()
    this.offTrackChange?.()
    this.offError?.()
  }

  private fire<T>(name: string, detail: T): void {
    this.dispatchEvent(
      new CustomEvent(name, { detail, bubbles: true, composed: true }),
    )
  }

  override render() {
    const isPlaying = this.state.isPlaying
    const classes = `fab ${isPlaying ? 'fab--playing' : ''} ${this.pulso && isPlaying ? 'fab--pulso' : ''}`
    return html`
      <button
        class=${classes}
        type="button"
        data-variant=${this.variant}
        aria-label=${isPlaying ? 'Pause' : 'Play'}
        aria-pressed=${isPlaying}
        @click=${() => this.engine.toggle()}
      >
        ${isPlaying ? '⏸' : '▶'}
      </button>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pulse-fab': PulseFabElement
  }
}
