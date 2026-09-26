import { LitElement, html, nothing, type PropertyDeclarations, type PropertyValues } from 'lit'
import { keyed } from 'lit/directives/keyed.js'
import { styleMap } from 'lit/directives/style-map.js'
import { formatTime, type PulseEngine } from '@pulse-music/core'
import type { AudioFrame, PulseState, PulseVariant, Track } from '@pulse-music/types'
import { EngineController } from './controllers/engine'
import { FrameController } from './controllers/frames'
import {
  gripIcon,
  mutedIcon,
  nextIcon,
  noteIcon,
  pauseIcon,
  playIcon,
  previousIcon,
  volumeIcon,
} from './icons'
import { mergeLabels, type PulseLabels } from './labels'
import { baseStyles, motionStyles, variantStyles } from './styles/shared'
import { playerStyles } from './styles/player'
import { hueFrom, sampleAccent } from './utils/color'
import { registerAnimatableAccent } from './utils/motion'
import { readTracks, TRACK_ATTRIBUTES } from './PulseTrack'

const AMBIENT_BARS = 28
const EQ_GROUPS: Array<[number, number]> = [
  [0, 3],
  [4, 8],
  [9, 15],
  [16, 23],
]

/**
 * `<pulse-player>` — the inline music player card.
 *
 * @tagname pulse-player
 *
 * Sizes itself from its container: full card → narrow → compact → a
 * round disc below 128 px, all driven by CSS container queries.
 *
 * @fires pulse-play        — playback started. `detail: { track, time }`
 * @fires pulse-pause       — playback paused. `detail: { track, time }`
 * @fires pulse-trackchange — the active track changed. `detail: { from, to, track }`
 * @fires pulse-ended       — a track reached its end. `detail: { track }`
 * @fires pulse-error       — playback failed. `detail: { track, reason, detail }`
 * @fires pulse-resize      — the user resized the player. `detail: { width }`
 *
 * @slot actions - Extra controls shown top-right on wide players (links, buttons…).
 *
 * @csspart player   - The card.
 * @csspart artwork  - The cover art.
 * @csspart title    - The track title.
 * @csspart artist   - The artist line.
 * @csspart controls - The transport row.
 * @csspart progress - The seek bar.
 *
 * @cssprop --pulse-accent - Accent colour (progress, equaliser, focus rings).
 * @cssprop --pulse-bg     - Card background.
 * @cssprop --pulse-fg     - Text and icon colour.
 * @cssprop --pulse-muted  - Secondary text colour.
 * @cssprop --pulse-radius - Corner radius.
 * @cssprop --pulse-font   - Font family (inherits from the page by default).
 * @cssprop --pulse-shadow - Outer shadow.
 */
export class PulsePlayerElement extends LitElement {
  static override styles = [variantStyles, motionStyles, baseStyles, playerStyles]

  static override properties: PropertyDeclarations = {
    variant: { type: String, reflect: true },
    accentColor: { type: String, attribute: 'accent-color' },
    customBackground: { type: String, attribute: 'custom-background' },
    ambientEq: { type: Boolean, attribute: 'ambient-eq' },
    grain: {
      type: Boolean,
      converter: { fromAttribute: (v: string | null) => v !== 'false' },
    },
    resizable: { type: Boolean, reflect: true },
    resizeMin: { type: Number, attribute: 'resize-min' },
    resizeMax: { type: Number, attribute: 'resize-max' },
    session: { type: String },
    engine: { attribute: false },
    tracks: { attribute: false },
    labels: { attribute: false },
    scrubbing: { state: true },
    hoverFraction: { state: true },
    previousCover: { state: true },
    sampledAccent: { state: true },
    resizing: { state: true },
  }

  /** Visual theme. */
  declare variant: PulseVariant
  /** Accent colour — any CSS colour. Defaults to the variant's (or the cover's, on `auto`). */
  declare accentColor: string | undefined
  /** CSS `background` used by `variant="custom"`. */
  declare customBackground: string | undefined
  /** Show the ambient equaliser behind the card. Defaults to the engine's `ambientEq`. */
  declare ambientEq: boolean | undefined
  /** Film-grain overlay. On by default; `grain="false"` removes it. */
  declare grain: boolean
  /** Show a corner handle to resize the player (pointer or arrow keys). */
  declare resizable: boolean
  declare resizeMin: number
  declare resizeMax: number
  /** Named audio session to join (`'default'` is shared page-wide). */
  declare session: string
  /** Bind to an explicit engine instead of a shared session. */
  declare engine: PulseEngine | undefined
  /** Replace the session's playlist. */
  declare tracks: Track[] | undefined
  /** Localised strings. */
  declare labels: Partial<PulseLabels> | undefined

  declare private scrubbing: boolean
  declare private hoverFraction: number
  declare private previousCover: string | undefined
  declare private sampledAccent: string | undefined
  declare private resizing: boolean

  private readonly audio: EngineController
  private readonly frames: FrameController
  private internals: ElementInternals | null = null
  private trackObserver: MutationObserver | null = null
  private scrubFraction = 0
  private resizeStart: { x: number; width: number } | null = null

  constructor() {
    super()
    this.variant = 'auto'
    this.grain = true
    this.resizable = false
    this.resizeMin = 64
    this.resizeMax = 760
    this.session = 'default'
    this.scrubbing = false
    this.hoverFraction = 0
    this.resizing = false
    this.audio = new EngineController(this, (state, prev) => this.onEngineState(state, prev))
    this.frames = new FrameController(
      this,
      () => this.audio.engine,
      (frame) => this.draw(frame),
    )
    try {
      this.internals = this.attachInternals()
    } catch {
      this.internals = null
    }
    registerAnimatableAccent()
  }

  override connectedCallback(): void {
    // Resolve the engine before anything (tracks, controllers) touches it.
    this.audio.use(this.engine, this.session)
    super.connectedCallback()
    this.syncLightTracks()
    this.trackObserver = new MutationObserver(() => this.syncLightTracks())
    this.trackObserver.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [...TRACK_ATTRIBUTES],
    })
    this.addEventListener('keydown', this.onKeydown)
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.trackObserver?.disconnect()
    this.trackObserver = null
    this.removeEventListener('keydown', this.onKeydown)
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('engine') || changed.has('session')) {
      this.audio.use(this.engine, this.session)
      this.frames.refresh()
    }
    if (changed.has('tracks') && this.tracks) this.audio.engine.setTracks(this.tracks)
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has('variant') || changed.has('accentColor')) this.refreshAccent()
  }

  // ─── Engine bridge ────────────────────────────────────────────────

  private get state(): PulseState {
    return this.audio.state
  }

  private onEngineState(state: PulseState, prev: PulseState): void {
    if (
      state.currentTrack !== prev.currentTrack ||
      this.audio.engine.track?.cover !== this.lastCover
    ) {
      this.previousCover = this.lastCover
      this.lastCover = this.audio.engine.track?.cover
      this.refreshAccent()
    }
    const states = this.internals?.states
    if (states) {
      try {
        this.toggleState(states, 'playing', state.isPlaying)
        this.toggleState(states, 'loading', state.isPlaying && state.isLoading)
        this.toggleState(states, 'error', state.error !== null)
      } catch {
        /* CustomStateSet unsupported */
      }
    }
  }

  private lastCover: string | undefined

  private toggleState(states: CustomStateSet, name: string, on: boolean): void {
    if (on) states.add(name)
    else states.delete(name)
  }

  private refreshAccent(): void {
    const cover = this.audio.engine.track?.cover
    if (this.variant !== 'auto' || this.accentColor || !cover) {
      this.sampledAccent = undefined
      return
    }
    void sampleAccent(cover).then((color) => {
      if (this.audio.engine.track?.cover === cover) this.sampledAccent = color ?? undefined
    })
  }

  private syncLightTracks(): void {
    const tracks = readTracks(this)
    if (tracks.length) this.audio.engine.setTracks(tracks)
  }

  // ─── Visualiser ───────────────────────────────────────────────────

  private draw(frame: AudioFrame | null): void {
    const root = this.renderRoot as ShadowRoot | undefined
    if (!root) return
    const bands = frame?.bands
    root.querySelectorAll<HTMLElement>('.eq').forEach((eq) => {
      eq.toggleAttribute('data-live', !!frame)
      const bars = eq.children
      for (let i = 0; i < bars.length; i++) {
        const [from, to] = EQ_GROUPS[i] ?? [0, 0]
        let v = 0
        if (bands) {
          for (let b = from; b <= to && b < bands.length; b++) v = Math.max(v, bands[b])
        }
        ;(bars[i] as HTMLElement).style.transform = frame ? `scaleY(${0.18 + v * 0.82})` : ''
      }
    })
    const ambient = root.querySelector<HTMLElement>('.ambient')
    if (ambient) {
      ambient.toggleAttribute('data-live', !!frame)
      const bars = ambient.children
      for (let i = 0; i < bars.length; i++) {
        const v = bands ? bands[Math.floor((i / bars.length) * bands.length)] : 0
        ;(bars[i] as HTMLElement).style.transform = frame ? `scaleY(${0.06 + v * 0.94})` : ''
      }
    }
    const glow = root.querySelector<HTMLElement>('.backdrop__glow')
    if (glow) {
      const e = frame?.energy ?? 0
      glow.style.opacity = frame ? String(0.2 + e * 0.55) : ''
      glow.style.transform = frame ? `scale(${1 + e * 0.12})` : ''
    }
  }

  // ─── Seeking ──────────────────────────────────────────────────────

  private fractionAt(e: PointerEvent): number {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    return rect.width ? Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) : 0
  }

  private onProgressDown = (e: PointerEvent): void => {
    if (e.button !== 0 || !this.state.duration) return
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    this.scrubbing = true
    this.scrubFraction = this.fractionAt(e)
    this.hoverFraction = this.scrubFraction
  }

  private onProgressMove = (e: PointerEvent): void => {
    const f = this.fractionAt(e)
    this.hoverFraction = f
    if (this.scrubbing) this.scrubFraction = f
  }

  private onProgressUp = (e: PointerEvent): void => {
    if (!this.scrubbing) return
    this.scrubbing = false
    const target = e.currentTarget as HTMLElement
    if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId)
    this.audio.engine.seek(this.fractionAt(e))
  }

  private onProgressKey = (e: KeyboardEvent): void => {
    const engine = this.audio.engine
    const { duration, currentTime } = this.state
    if (!duration) return
    const step: Record<string, number> = {
      ArrowLeft: -5,
      ArrowDown: -5,
      ArrowRight: 5,
      ArrowUp: 5,
      PageDown: -30,
      PageUp: 30,
    }
    if (e.key in step) engine.seekTo(currentTime + step[e.key] * (e.shiftKey ? 0.2 : 1))
    else if (e.key === 'Home') engine.seekTo(0)
    else if (e.key === 'End') engine.seekTo(duration - 0.5)
    else return
    e.preventDefault()
    e.stopPropagation()
  }

  // ─── Keyboard shortcuts (focus anywhere inside the player) ───────

  private onKeydown = (e: KeyboardEvent): void => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
    const origin = e.composedPath()[0] as HTMLElement | undefined
    if (origin?.closest?.('input, textarea, select, [contenteditable]')) return
    const onButton = origin?.localName === 'button'
    const engine = this.audio.engine
    switch (e.key) {
      case ' ':
        if (onButton) return
        engine.toggle()
        break
      case 'k':
      case 'K':
        engine.toggle()
        break
      case 'j':
      case 'J':
        engine.seekBy(-10)
        break
      case 'l':
      case 'L':
        engine.seekBy(10)
        break
      case 'm':
      case 'M':
        engine.toggleMute()
        break
      case 'N':
        if (!e.shiftKey) return
        engine.next()
        break
      case 'P':
        if (!e.shiftKey) return
        engine.prev()
        break
      default:
        return
    }
    e.preventDefault()
  }

  // ─── Resizing ─────────────────────────────────────────────────────

  private clampWidth(width: number): number {
    const parent = this.parentElement?.clientWidth || Infinity
    return Math.round(Math.max(this.resizeMin, Math.min(this.resizeMax, parent, width)))
  }

  private applyWidth(width: number): void {
    const w = this.clampWidth(width)
    this.style.width = `${w}px`
    this.dispatchEvent(new CustomEvent('pulse-resize', { detail: { width: w } }))
  }

  private onResizeDown = (e: PointerEvent): void => {
    if (e.button !== 0) return
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    this.resizeStart = { x: e.clientX, width: this.getBoundingClientRect().width }
    this.resizing = true
  }

  private onResizeMove = (e: PointerEvent): void => {
    if (!this.resizeStart) return
    this.applyWidth(this.resizeStart.width + (e.clientX - this.resizeStart.x))
  }

  private onResizeUp = (e: PointerEvent): void => {
    if (!this.resizeStart) return
    this.resizeStart = null
    this.resizing = false
    const target = e.currentTarget as HTMLElement
    if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId)
  }

  private onResizeKey = (e: KeyboardEvent): void => {
    const delta = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key]
    if (!delta) return
    e.preventDefault()
    e.stopPropagation()
    this.applyWidth(this.getBoundingClientRect().width + delta * (e.shiftKey ? 64 : 16))
  }

  // ─── Render ───────────────────────────────────────────────────────

  private renderArt(track: Track | null) {
    const playing = this.state.isPlaying
    const cover = track?.cover
    const art = cover
      ? keyed(
          cover,
          html`<img
            class="art__img art__img--current"
            src=${cover}
            alt=""
            decoding="async"
            style=${styleMap({
              objectPosition: track?.coverPos ?? '50% 50%',
              scale: track?.coverScale ? String(track.coverScale) : null,
            })}
            @animationend=${() => (this.previousCover = undefined)}
          />`,
        )
      : html`<div
          class="art__placeholder"
          style=${styleMap({
            background: track
              ? `linear-gradient(135deg, hsl(${hueFrom(track.title)} 70% 52%), hsl(${(hueFrom(track.title) + 50) % 360} 70% 26%))`
              : null,
          })}
        >
          ${noteIcon}
        </div>`
    return html`<div
      class="art"
      part="artwork"
      aria-hidden="true"
      @click=${() => this.audio.engine.toggle()}
    >
      ${
        this.previousCover && this.previousCover !== cover
          ? html`<img class="art__img" src=${this.previousCover} alt="" />`
          : nothing
      }
      ${art}
      <span class="art__hover"
        ><span class="glyphs" ?data-playing=${playing}>${playIcon}${pauseIcon}</span></span
      >
    </div>`
  }

  protected override render() {
    const engine = this.audio.engine
    const state = this.state
    const track = engine.track
    const labels = mergeLabels(this.labels)
    const empty = !track
    const playing = state.isPlaying
    const loading = playing && state.isLoading
    const duration = Number.isFinite(state.duration) ? state.duration : 0
    const progress = this.scrubbing ? this.scrubFraction : engine.progress / 100
    const current = this.scrubbing
      ? this.scrubFraction * duration
      : Math.min(state.currentTime, duration)
    const ambient = this.ambientEq ?? state.ambientEq
    const playLabel = playing ? labels.pause : labels.play
    const status = state.error ? labels.error : loading ? labels.loading : labels.nowPlaying
    const timeText = labels.timeText
      .replace('{current}', formatTime(current))
      .replace('{duration}', formatTime(duration))

    return html`
      <div
        class="root player"
        part="player"
        role="group"
        aria-label=${track ? `${labels.player}: ${track.title}${track.artist ? `, ${track.artist}` : ''}` : labels.player}
        ?data-playing=${playing}
        ?data-loading=${loading}
        ?data-error=${state.error !== null}
        ?data-resizing=${this.resizing}
        style=${styleMap({
          '--_sampled-accent': this.sampledAccent ?? null,
          '--pulse-accent': this.accentColor ?? null,
          '--pulse-custom-bg': this.customBackground ?? null,
        })}
      >
        <div class="backdrop" aria-hidden="true">
          ${
            this.variant === 'auto' && track?.cover
              ? keyed(
                  track.cover,
                  html`<div
                    class="backdrop__cover"
                    style=${styleMap({ backgroundImage: `url("${encodeURI(track.cover)}")` })}
                  ></div>`,
                )
              : nothing
          }
          ${this.variant === 'auto' ? html`<div class="backdrop__scrim"></div>` : nothing}
          <div class="backdrop__glow"></div>
          ${
            ambient
              ? html`<div class="ambient">
                  ${Array.from({ length: AMBIENT_BARS }, () => html`<i></i>`)}
                </div>`
              : nothing
          }
          ${this.grain ? html`<div class="grain"></div>` : nothing}
        </div>

        ${this.renderArt(track)}

        <div class="body">
          <div class="eyebrow fold fold--compact">
            <span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
            <span class="eyebrow__label fold fold--narrow">${empty ? '' : status}</span>
            <slot name="actions" class="actions fold fold--medium"></slot>
          </div>
          ${keyed(
            track?.src ?? '',
            html`<div class="meta">
              <p class="title" part="title">${track?.title ?? labels.empty}</p>
              ${
                track?.artist
                  ? html`<p class="artist fold fold--compact" part="artist">${track.artist}</p>`
                  : nothing
              }
            </div>`,
          )}
          <div class="controls" part="controls">
            <button
              class="btn fold fold--narrow"
              type="button"
              aria-label=${labels.previous}
              ?disabled=${empty}
              @click=${() => engine.prev()}
            >
              ${previousIcon}
            </button>
            <button
              class="btn btn--main"
              type="button"
              aria-label=${playLabel}
              ?disabled=${empty}
              @click=${() => engine.toggle()}
            >
              <span class="glyphs" ?data-playing=${playing}>${playIcon}${pauseIcon}</span>
              <svg class="spinner" viewBox="0 0 50 50" aria-hidden="true">
                <circle cx="25" cy="25" r="23" />
              </svg>
            </button>
            <button
              class="btn fold fold--narrow"
              type="button"
              aria-label=${labels.next}
              ?disabled=${empty}
              @click=${() => engine.next()}
            >
              ${nextIcon}
            </button>
            <span class="time fold fold--medium" part="time" aria-hidden="true" ?hidden=${empty}
              >${formatTime(current)}<span class="time__sep">/</span>${formatTime(duration)}</span
            >
            <button
              class="btn fold fold--wide"
              type="button"
              aria-label=${state.muted ? labels.unmute : labels.mute}
              aria-pressed=${state.muted ? 'true' : 'false'}
              @click=${() => engine.toggleMute()}
            >
              ${state.muted ? mutedIcon : volumeIcon}
            </button>
          </div>
        </div>

        <div
          class="progress"
          part="progress"
          role="slider"
          tabindex=${empty ? '-1' : '0'}
          aria-label=${labels.seek}
          aria-valuemin="0"
          aria-valuemax=${Math.round(duration)}
          aria-valuenow=${Math.round(current)}
          aria-valuetext=${timeText}
          aria-disabled=${empty || !duration ? 'true' : 'false'}
          ?data-scrubbing=${this.scrubbing}
          style=${styleMap({
            '--progress': String(progress),
            '--buffered': String(state.buffered),
            '--hover': String(this.hoverFraction),
          })}
          @pointerdown=${this.onProgressDown}
          @pointermove=${this.onProgressMove}
          @pointerup=${this.onProgressUp}
          @pointercancel=${this.onProgressUp}
          @keydown=${this.onProgressKey}
        >
          <div class="progress__rail">
            <div class="progress__buffer"></div>
            <div class="progress__fill"></div>
            <div class="progress__thumb"></div>
          </div>
          <div class="progress__tip" aria-hidden="true">
            ${formatTime(this.hoverFraction * duration)}
          </div>
        </div>

        <div class="disc" aria-hidden="true" style=${styleMap({ '--progress': String(progress) })}>
          <svg class="disc__ring" viewBox="0 0 100 100">
            <circle class="disc__track" cx="50" cy="50" r="47" pathLength="100" />
            <circle class="disc__progress" cx="50" cy="50" r="47" pathLength="100" />
          </svg>
          <span class="eq"><i></i><i></i><i></i><i></i></span>
        </div>
        <button
          class="disc-toggle"
          type="button"
          aria-label=${track ? `${playLabel}: ${track.title}` : playLabel}
          ?disabled=${empty}
          @click=${() => engine.toggle()}
        >
          <span class="glyphs" ?data-playing=${playing}>${playIcon}${pauseIcon}</span>
        </button>

        ${
          this.resizable
            ? html`<button
                class="resize"
                type="button"
                aria-label=${labels.resize}
                title=${labels.resize}
                @pointerdown=${this.onResizeDown}
                @pointermove=${this.onResizeMove}
                @pointerup=${this.onResizeUp}
                @pointercancel=${this.onResizeUp}
                @keydown=${this.onResizeKey}
                @dblclick=${() => {
                  this.style.width = ''
                  this.dispatchEvent(
                    new CustomEvent('pulse-resize', {
                      detail: { width: this.getBoundingClientRect().width },
                    }),
                  )
                }}
              >
                ${gripIcon}
              </button>`
            : nothing
        }
      </div>
      <span class="sr-only" role="status" aria-live="polite"
        >${state.error ? labels.error : ''}</span
      >
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pulse-player': PulsePlayerElement
  }
}
