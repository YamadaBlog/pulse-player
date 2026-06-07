import { LitElement, html, type PropertyValues } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import type { PulseEngine } from '@pulse/core'
import type { PulseState, PulseVariant, Track, Unsubscribe } from '@pulse/types'
import { getSharedEngine } from './engine-singleton'
import { baseStyles, playerStyles } from './styles'

/**
 * `<pulse-player>` — universal inline music player Custom Element.
 *
 * Wraps the singleton `@pulse/core` PulseEngine. Renders the inline
 * card chrome (artwork + title + play / pause + progress) and emits
 * DOM `CustomEvent`s for every state change, matching the v2.3.4
 * Vue emit surface 1-to-1:
 *
 *   - `pulse-play`        — fired on every play. detail: { track, time }
 *   - `pulse-pause`       — fired on every pause. detail: { track, time }
 *   - `pulse-trackchange` — fired on next/prev/loadTrack. detail: { from, to, track }
 *   - `pulse-error`       — fired on autoplay rejection or media error.
 *                            detail: { track, reason, detail? }
 *
 * Works natively in React 19+, Vue 3, Angular 17+, Svelte 5, Solid,
 * Lit, Astro, Qwik, vanilla HTML. Framework wrappers
 * (`@pulse/react`, `@pulse/vue`, …) thin-adapt the custom events
 * onto the framework's convention (`onPulsePlay` in React,
 * `@pulsePlay` in Vue, etc.).
 *
 * Attributes (all reflected to properties via @property):
 *   - `variant`        : PulseVariant (default 'auto')
 *   - `accent-color`   : CSS color (default unset — inherits theme)
 *   - `tracks`         : JSON array of Track objects (optional override)
 *
 * Status: v3.0.0-alpha.2 SKELETON. Renders the minimum chrome
 * (artwork, title, play/pause, progress, time). Full v2.3.4 parity
 * (ambient EQ, drag-to-resize, three responsive states, social icons,
 * `prev` / `next` controls) lands in subsequent alphas. The Lit
 * controller pattern is already in place — adding more chrome is
 * additive markup, not architectural refactor.
 */
@customElement('pulse-player')
export class PulsePlayerElement extends LitElement {
  static override styles = [baseStyles, playerStyles]

  @property({ type: String, reflect: true })
  variant: PulseVariant = 'auto'

  @property({ type: String, attribute: 'accent-color' })
  accentColor: string | undefined

  /**
   * Optional custom playlist override. Pass an array of Track objects
   * to replace the engine's playlist. Most consumers will configure
   * the playlist at the engine level via
   * `setSharedEngine(new PulseEngine(tracks))`; this attribute is a
   * convenience for declarative HTML usage.
   */
  @property({ attribute: false })
  tracks: Track[] | undefined

  // Mirror engine state into a reactive Lit state so the renderer
  // re-runs on every state change. The unsubscribe handle is detached
  // in disconnectedCallback() to prevent leaks on element removal.
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

    if (this.tracks && this.tracks.length) {
      this.engine.setAudioTracks(this.tracks)
    }

    // Bridge the engine's state subscription into Lit's reactivity.
    this.offState = this.engine.onStateChange((s) => {
      this.state = { ...s }
    })

    // Forward typed events as DOM CustomEvents so external listeners
    // (React onPulsePlay handlers, Vue @pulse-play templates, etc.)
    // get the same payload shape as the engine's subscribe() API.
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

  override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('accentColor') && this.accentColor) {
      this.style.setProperty('--pulse-accent', this.accentColor)
    }
  }

  private fire<T>(name: string, detail: T): void {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true,
      }),
    )
  }

  private onArtClick(): void {
    this.engine.toggle()
  }

  private onProgressClick(e: MouseEvent): void {
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const fraction = (e.clientX - rect.left) / rect.width
    this.engine.seek(fraction)
  }

  override render() {
    const track = this.engine.track
    const progressPercent = this.engine.progress
    const playLabel = this.state.isPlaying ? 'Pause' : 'Play'

    return html`
      <div class="mp" data-variant=${this.variant}>
        <div
          class="mp__art"
          role="button"
          tabindex="0"
          aria-label=${playLabel}
          aria-pressed=${this.state.isPlaying}
          style=${`background-image: url('${track.cover}'); background-position: ${track.coverPos}`}
          @click=${this.onArtClick}
          @keydown=${this.onArtKeydown}
        ></div>

        <div class="mp__body">
          <h3 class="mp__title">${track.title}</h3>

          <div class="mp__controls">
            <button
              class="mp__btn"
              type="button"
              aria-label=${playLabel}
              aria-pressed=${this.state.isPlaying}
              @click=${() => this.engine.toggle()}
            >
              ${this.state.isPlaying ? '⏸' : '▶'}
            </button>
            <span class="mp__time">
              ${this.engine.fmt(this.state.currentTime)} / ${this.engine.fmt(this.state.duration)}
            </span>
          </div>

          <div
            class="mp__progress"
            role="slider"
            tabindex="0"
            aria-label="Seek"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow=${Math.round(progressPercent)}
            @click=${this.onProgressClick}
          >
            <div
              class="mp__progress-fill"
              style=${`width: ${progressPercent}%`}
            ></div>
          </div>
        </div>
      </div>
    `
  }

  private onArtKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      this.engine.toggle()
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pulse-player': PulsePlayerElement
  }
}
