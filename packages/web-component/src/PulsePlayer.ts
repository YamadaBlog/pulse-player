import { LitElement, html, svg, type PropertyValues, type TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import type { PulseEngine } from '@pulse/core'
import type { PulseState, PulseVariant, Track, Unsubscribe } from '@pulse/types'
import { getSharedEngine } from './engine-singleton'
import { baseStyles, playerStyles } from './styles'

// GitHub Octocat mark. Geometry borrowed from Lucide (MIT). The
// mark itself is a GitHub trademark — by their brand guidelines
// (https://github.com/logos), the silhouette is approved for
// developer integrations linking back to a GitHub URL. The icon
// renders ONLY when the consumer passes `github-url`; otherwise an
// inert span is rendered with the same aria-label, preserving layout
// without trademark exposure.
const GITHUB_SVG: TemplateResult = svg`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.03c-3.2.69-3.87-1.38-3.87-1.38-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.49 3.18-1.18 3.18-1.18.62 1.58.23 2.75.11 3.04.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14v3.18c0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>`

// Generic music-streaming icon (musical note inside a circle).
// Deliberately NOT the Spotify mark — Spotify's brand guidelines
// (https://developer.spotify.com/documentation/design) restrict the
// official logo to approved partners. We expose a `spotifyUrl` prop
// for consumers who want to link to a Spotify URL, but the icon
// itself is provider-agnostic so the same chrome works for Apple
// Music, YouTube Music, Tidal, Deezer, or self-hosted streams without
// trademark exposure. Lucide-style geometry (MIT).
const STREAM_SVG: TemplateResult = svg`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`

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

  /** Toggle the ambient EQ background animation. Reflected as an attribute. */
  @property({ type: Boolean, attribute: 'ambient-eq', reflect: true })
  ambientEq = false

  /**
   * Force the FAB morph regardless of host width. When `true`, the
   * `data-size="fab"` state is applied unconditionally — useful for
   * consumers that want the disc shape inside a wide container
   * without going through a `resizable` interaction. Mirrors the
   * v2.3.4 MusicPlayer's `data-fab="true"` boolean.
   */
  @property({ type: Boolean, attribute: 'data-fab', reflect: true })
  dataFab = false

  /**
   * Enables a drag handle in the bottom-right corner. Pointer events
   * resize the host element directly via inline `width` and
   * `height`. Mirrors the v2.3.4 MusicPlayer `resizable` prop —
   * users can pull the player from any size down to FAB.
   */
  @property({ type: Boolean, reflect: true })
  resizable = false

  /** GitHub URL — when set, the GitHub icon becomes a link to it. */
  @property({ type: String, attribute: 'github-url' })
  githubUrl: string | undefined

  /** Spotify URL — when set, the Spotify icon becomes a link to it. */
  @property({ type: String, attribute: 'spotify-url' })
  spotifyUrl: string | undefined

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

  // Container-aware --pulse-scale system. A ResizeObserver on the host
  // computes a scale between --pulse-scale-min (0.30) and
  // --pulse-scale-max (1.30) based on the host's current width,
  // mirroring the v2.3.4 Vue MusicPlayer.vue logic so the chrome
  // (artwork, type, icons, padding, shadows, EQ bars, progress) all
  // breathe from one variable.
  private resizeObserver: ResizeObserver | undefined

  override connectedCallback(): void {
    super.connectedCallback()

    if (this.tracks && this.tracks.length) {
      this.engine.setAudioTracks(this.tracks)
    }

    // Keyboard shortcuts when the host element holds focus:
    //   Space / K    → toggle play/pause
    //   J / Left     → previous track
    //   L / Right    → next track
    // Mirrors v2.3.4 MusicPlayer keyboard surface. Listener is on
    // the host (not document) so multiple players on the page don't
    // intercept each other's keys.
    this.addEventListener('keydown', this.onHostKeydown)
    this.tabIndex = this.tabIndex >= 0 ? this.tabIndex : 0

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

    // Container-aware autoscale.
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect.width ?? 0
        if (!w) return
        // Linear map [110 px .. 680 px] → [0.3 .. 1.3], clamped.
        const min = 0.3
        const max = 1.3
        const ratio = Math.max(0, Math.min(1, (w - 110) / (680 - 110)))
        const scale = min + (max - min) * ratio
        this.style.setProperty('--pulse-scale', String(scale))

        // Three responsive states — same thresholds as the v2.3.4
        // Vue MusicPlayer. Sets `data-size` on the host so the
        // stylesheet can collapse / expand chrome elements without
        // touching JS render. Closes audit P1 (chrome Phase 2 step 1).
        //   narrow  < 220 px  → eyebrow + social icons hide
        //   compact < 130 px  → controls collapse, time read-out hides
        //   fab     < 110 px  → morph into disc shape, only art + play
        let size: 'classic' | 'narrow' | 'compact' | 'fab' = 'classic'
        if (w < 110) size = 'fab'
        else if (w < 130) size = 'compact'
        else if (w < 220) size = 'narrow'
        this.responsiveSize = size
      })
      this.resizeObserver.observe(this)
    }
  }

  /** Current responsive state, derived from host width. Drives the
   * `data-size` attribute on the inner `.mp` div via render(). */
  @state()
  private responsiveSize: 'classic' | 'narrow' | 'compact' | 'fab' = 'classic'

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('keydown', this.onHostKeydown)
    this.offState?.()
    this.offPlay?.()
    this.offPause?.()
    this.offTrackChange?.()
    this.offError?.()
    this.resizeObserver?.disconnect()
    this.resizeObserver = undefined
  }

  private onHostKeydown = (e: KeyboardEvent): void => {
    // Don't hijack typing in inputs that may live in slotted content.
    const target = e.target as HTMLElement | null
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return
    }
    switch (e.key) {
      case ' ':
      case 'k':
      case 'K':
        e.preventDefault()
        this.engine.toggle()
        break
      case 'j':
      case 'J':
      case 'ArrowLeft':
        e.preventDefault()
        this.engine.prev()
        break
      case 'l':
      case 'L':
      case 'ArrowRight':
        e.preventDefault()
        this.engine.next()
        break
      default:
        break
    }
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

  // ─── Drag-to-resize handle (resizable) ───────────────────────
  // Pointer events on the bottom-right handle resize the host
  // element directly via inline width / height. Mirrors the v2.3.4
  // MusicPlayer.vue logic: pointer capture so the drag survives
  // moving off the handle, clamp to [90 px .. 800 px], and use the
  // mouse / pen / touch unified pointer event interface.
  private dragStartX = 0
  private dragStartY = 0
  private dragStartWidth = 0
  private dragStartHeight = 0

  private onResizePointerDown(e: PointerEvent): void {
    e.preventDefault()
    e.stopPropagation()
    const rect = this.getBoundingClientRect()
    this.dragStartX = e.clientX
    this.dragStartY = e.clientY
    this.dragStartWidth = rect.width
    this.dragStartHeight = rect.height
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    ;(e.currentTarget as Element).addEventListener(
      'pointermove',
      this.onResizePointerMove as unknown as EventListener,
    )
    ;(e.currentTarget as Element).addEventListener(
      'pointerup',
      this.onResizePointerUp as unknown as EventListener,
    )
  }

  private onResizePointerMove = (e: PointerEvent): void => {
    const dx = e.clientX - this.dragStartX
    const dy = e.clientY - this.dragStartY
    const w = Math.max(90, Math.min(800, this.dragStartWidth + dx))
    const h = Math.max(90, Math.min(800, this.dragStartHeight + dy))
    this.style.width = `${w}px`
    this.style.height = `${h}px`
  }

  private onResizePointerUp = (e: PointerEvent): void => {
    const target = e.currentTarget as Element
    target.releasePointerCapture(e.pointerId)
    target.removeEventListener(
      'pointermove',
      this.onResizePointerMove as unknown as EventListener,
    )
    target.removeEventListener('pointerup', this.onResizePointerUp as unknown as EventListener)
  }

  override render() {
    const track = this.engine.track
    const progressPercent = this.engine.progress
    const playLabel = this.state.isPlaying ? 'Pause' : 'Play'

    // `data-fab` overrides the auto-detected responsiveSize.
    const effectiveSize = this.dataFab ? 'fab' : this.responsiveSize
    return html`
      <div class="mp" data-variant=${this.variant} data-size=${effectiveSize}>
        <!-- Cover blur backdrop (mp__bg). Same cover as the art, scaled large + blurred. Mirrors v2.3.4. -->
        <div
          class="mp__bg"
          aria-hidden="true"
          style=${`background-image: url('${track.cover}')`}
        ></div>

        <!-- SVG noise grain overlay (mp__noise). Hides gradient banding on dark variants. -->
        <div class="mp__noise" aria-hidden="true"></div>

        <!-- Ambient EQ — 12 bars. Visible only when the ambient-eq attribute is on the host. Pure CSS, zero JS per frame. -->
        <div class="mp__ambient" aria-hidden="true">
          ${Array.from({ length: 12 }).map(() => html`<span class="mp__ambient-bar"></span>`)}
        </div>

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
          <p class="mp__eyebrow">NOW PLAYING</p>
          <h3 class="mp__title">${track.title}</h3>

          <div class="mp__controls">
            <button
              class="mp__btn mp__btn--ghost"
              type="button"
              aria-label="Previous track"
              @click=${() => this.engine.prev()}
              title="Prev"
            >
              ⏮
            </button>
            <button
              class="mp__btn"
              type="button"
              aria-label=${playLabel}
              aria-pressed=${this.state.isPlaying}
              @click=${() => this.engine.toggle()}
            >
              ${this.state.isPlaying ? '⏸' : '▶'}
            </button>
            <button
              class="mp__btn mp__btn--ghost"
              type="button"
              aria-label="Next track"
              @click=${() => this.engine.next()}
              title="Next"
            >
              ⏭
            </button>
            <span class="mp__time">
              ${this.engine.fmt(this.state.currentTime)} / ${this.engine.fmt(this.state.duration)}
            </span>
            <span class="mp__icons">
              <!-- Social icons. Real SVG (24×24, currentColor) so they
                   inherit the chrome's text colour. Linked anchors when
                   the matching prop is set on the host; rendered as
                   inert <span> otherwise. Hidden on narrow / compact /
                   fab via CSS. -->
              ${this.githubUrl
                ? html`<a
                    class="mp__icon"
                    href=${this.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    title="GitHub"
                    >${GITHUB_SVG}</a
                  >`
                : html`<span class="mp__icon" aria-label="GitHub" title="GitHub"
                    >${GITHUB_SVG}</span
                  >`}
              ${this.spotifyUrl
                ? html`<a
                    class="mp__icon"
                    href=${this.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Listen on streaming"
                    title="Listen on streaming"
                    >${STREAM_SVG}</a
                  >`
                : html`<span class="mp__icon" aria-label="Streaming link" title="Streaming link"
                    >${STREAM_SVG}</span
                  >`}
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

        ${this.resizable
          ? html`
              <span
                class="mp__resize-handle"
                aria-label="Resize"
                role="separator"
                @pointerdown=${this.onResizePointerDown}
              ></span>
            `
          : ''}
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
