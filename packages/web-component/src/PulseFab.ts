import { LitElement, html, nothing, type PropertyDeclarations, type PropertyValues } from 'lit'
import { keyed } from 'lit/directives/keyed.js'
import { styleMap } from 'lit/directives/style-map.js'
import type { PulseEngine } from '@pulse-music/core'
import type { AudioFrame, PulseVariant } from '@pulse-music/types'
import { EngineController } from './controllers/engine'
import { FrameController } from './controllers/frames'
import { closeIcon, moreIcon, nextIcon, noteIcon, pauseIcon, playIcon, previousIcon } from './icons'
import { mergeLabels, type PulseLabels } from './labels'
import { baseStyles, motionStyles, variantStyles } from './styles/shared'
import { fabStyles } from './styles/fab'
import { hueFrom, sampleAccent } from './utils/color'
import { prefersReducedMotion, registerAnimatableAccent } from './utils/motion'

export type FabPlacement = 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start' | 'inline'

const DRAG_THRESHOLD = 6
const LONG_PRESS_MS = 480
const EDGE = 16

interface Offset {
  x: number
  y: number
}

/**
 * `<pulse-fab>` — a floating, draggable mini player.
 *
 * Tap to play / pause. Drag it anywhere: on release it springs to the
 * nearest screen edge and remembers the spot. Long-press, right-click,
 * the ⋯ badge or <kbd>Shift</kbd>+<kbd>F10</kbd> open the action menu.
 *
 * @tagname pulse-fab
 *
 * @fires pulse-play        — playback started. `detail: { track, time }`
 * @fires pulse-pause       — playback paused. `detail: { track, time }`
 * @fires pulse-trackchange — the active track changed. `detail: { from, to, track }`
 * @fires pulse-ended       — a track reached its end. `detail: { track }`
 * @fires pulse-error       — playback failed. `detail: { track, reason, detail }`
 *
 * @cssprop --pulse-accent - Accent colour.
 * @cssprop --pulse-fab-z  - Stacking order (default 1000).
 */
export class PulseFabElement extends LitElement {
  static override styles = [variantStyles, motionStyles, baseStyles, fabStyles]

  static override properties: PropertyDeclarations = {
    variant: { type: String, reflect: true },
    accentColor: { type: String, attribute: 'accent-color' },
    placement: { type: String, reflect: true },
    reveal: { type: String },
    size: { type: Number },
    pulso: { type: Boolean },
    locked: { type: Boolean },
    persistKey: { type: String, attribute: 'persist-key' },
    session: { type: String },
    engine: { attribute: false },
    labels: { attribute: false },
    menuOpen: { state: true },
    dragging: { state: true },
    sampledAccent: { state: true },
  }

  /** Visual theme. */
  declare variant: PulseVariant
  declare accentColor: string | undefined
  /** Screen corner, or `inline` to place it in the document flow. */
  declare placement: FabPlacement
  /** `on-play` (default) shows the FAB once playback starts; `always` shows it immediately. */
  declare reveal: 'on-play' | 'always'
  /** Diameter in px. */
  declare size: number
  /** Heartbeat ripple while playing. */
  declare pulso: boolean
  /** Disable dragging. */
  declare locked: boolean
  /** `localStorage` key for the dragged position; empty string disables persistence. */
  declare persistKey: string
  declare session: string
  declare engine: PulseEngine | undefined
  declare labels: Partial<PulseLabels> | undefined

  declare private menuOpen: boolean
  declare private dragging: boolean
  declare private sampledAccent: string | undefined

  private readonly audio: EngineController
  private readonly frames: FrameController
  private offset: Offset = { x: 0, y: 0 }
  private press: { x: number; y: number; origin: Offset; id: number } | null = null
  private longPress: ReturnType<typeof setTimeout> | null = null
  private swallowClick = false
  private snapTimer: ReturnType<typeof setTimeout> | undefined
  private nodes: { bars: HTMLCollection | null; halo: HTMLElement | null } = {
    bars: null,
    halo: null,
  }

  constructor() {
    super()
    this.variant = 'auto'
    this.placement = 'bottom-end'
    this.reveal = 'on-play'
    this.size = 64
    this.pulso = false
    this.locked = false
    this.persistKey = 'pulse-fab-position'
    this.session = 'default'
    this.menuOpen = false
    this.dragging = false
    this.audio = new EngineController(this, (state, prev) => {
      if (state.currentTrack !== prev.currentTrack) this.refreshAccent()
    })
    this.frames = new FrameController(
      this,
      () => this.audio.engine,
      (frame) => this.draw(frame),
    )
    registerAnimatableAccent()
  }

  override connectedCallback(): void {
    // Resolve the engine before anything (tracks, controllers) touches it.
    this.audio.use(this.engine, this.session)
    super.connectedCallback()
    window.addEventListener('resize', this.onViewportResize)
    this.restoreOffset()
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    window.removeEventListener('resize', this.onViewportResize)
    document.removeEventListener('pointerdown', this.onOutside, true)
    this.clearLongPress()
    clearTimeout(this.snapTimer)
    this.removeAttribute('data-snapping')
    this.press = null
    this.dragging = false
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has('engine') || changed.has('session')) {
      this.audio.use(this.engine, this.session)
      this.frames.refresh()
    }
    if (changed.has('size')) this.style.setProperty('--size', `${this.size}px`)
    if (changed.has('menuOpen')) {
      if (this.menuOpen) document.addEventListener('pointerdown', this.onOutside, true)
      else document.removeEventListener('pointerdown', this.onOutside, true)
    }
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('variant') || changed.has('accentColor')) this.refreshAccent()
    // Cache what the visualiser writes to, so frames never query the DOM.
    this.nodes = {
      bars: this.renderRoot.querySelector('.eq')?.children ?? null,
      halo: this.renderRoot.querySelector<HTMLElement>('.halo'),
    }
    if (changed.has('menuOpen') && this.menuOpen) {
      this.renderRoot.querySelector<HTMLElement>('.item')?.focus()
    }
  }

  private get movable(): boolean {
    return !this.locked && this.placement !== 'inline'
  }

  private refreshAccent(): void {
    const cover = this.audio.engine.track?.cover
    if (this.variant !== 'auto' || this.accentColor || !cover) {
      this.sampledAccent = undefined
      return
    }
    void sampleAccent(cover).then((c) => {
      if (this.audio.engine.track?.cover === cover) this.sampledAccent = c ?? undefined
    })
  }

  private draw(frame: AudioFrame | null): void {
    const { bars, halo } = this.nodes
    if (bars) {
      for (let i = 0; i < bars.length; i++) {
        const v = frame ? frame.bands[Math.floor((i / bars.length) * frame.bands.length * 0.7)] : 0
        ;(bars[i] as HTMLElement).style.transform = frame ? `scaleY(${0.2 + v * 0.8})` : ''
      }
    }
    if (halo) halo.style.transform = frame ? `scale(${0.9 + frame.energy * 0.35})` : ''
  }

  // ─── Position ─────────────────────────────────────────────────────

  private applyOffset(offset: Offset): void {
    this.offset = offset
    this.style.translate = offset.x || offset.y ? `${offset.x}px ${offset.y}px` : ''
  }

  /** Snap to the nearest horizontal edge and keep fully on screen. */
  private snap(persist: boolean): void {
    if (!this.movable) return
    const rect = this.getBoundingClientRect()
    // Not laid out (detached, or inside display: none): nothing sensible to snap to.
    if (!this.isConnected || !rect.width) return
    const baseLeft = rect.left - this.offset.x
    const baseTop = rect.top - this.offset.y
    const toLeft = rect.left + rect.width / 2 < window.innerWidth / 2
    const left = toLeft ? EDGE : window.innerWidth - EDGE - rect.width
    const top = Math.min(Math.max(EDGE, rect.top), window.innerHeight - EDGE - rect.height)
    const next = { x: Math.round(left - baseLeft), y: Math.round(top - baseTop) }
    if (!prefersReducedMotion()) {
      this.toggleAttribute('data-snapping', true)
      clearTimeout(this.snapTimer)
      this.snapTimer = setTimeout(() => this.removeAttribute('data-snapping'), 700)
    }
    this.applyOffset(next)
    if (persist && this.persistKey) {
      try {
        localStorage.setItem(this.persistKey, JSON.stringify(next))
      } catch {
        /* storage unavailable (private mode, quota) */
      }
    }
  }

  private restoreOffset(): void {
    if (!this.movable || !this.persistKey) return
    try {
      const raw = localStorage.getItem(this.persistKey)
      if (!raw) return
      const saved = JSON.parse(raw) as Partial<Offset>
      if (typeof saved.x === 'number' && typeof saved.y === 'number') {
        this.applyOffset({ x: saved.x, y: saved.y })
        requestAnimationFrame(() => this.snap(false))
      }
    } catch {
      /* corrupt entry */
    }
  }

  private onViewportResize = (): void => {
    if (this.offset.x || this.offset.y) this.snap(false)
  }

  // ─── Pointer: tap / drag / long-press ─────────────────────────────

  private clearLongPress(): void {
    if (this.longPress) clearTimeout(this.longPress)
    this.longPress = null
  }

  private onDown = (e: PointerEvent): void => {
    if (e.button !== 0) return
    // A cancelled gesture never produces a click: never carry a stale swallow over.
    this.swallowClick = false
    this.press = { x: e.clientX, y: e.clientY, origin: { ...this.offset }, id: e.pointerId }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    this.clearLongPress()
    this.longPress = setTimeout(() => {
      this.longPress = null
      if (this.dragging || !this.press) return
      this.swallowClick = true
      this.menuOpen = true
    }, LONG_PRESS_MS)
  }

  private onMove = (e: PointerEvent): void => {
    const press = this.press
    if (!press || e.pointerId !== press.id) return
    const dx = e.clientX - press.x
    const dy = e.clientY - press.y
    if (!this.dragging) {
      if (!this.movable || Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      this.dragging = true
      this.menuOpen = false
      this.clearLongPress()
    }
    this.applyOffset({ x: press.origin.x + dx, y: press.origin.y + dy })
  }

  private onUp = (e: PointerEvent): void => {
    if (!this.press || e.pointerId !== this.press.id) return
    this.press = null
    this.clearLongPress()
    const target = e.currentTarget as HTMLElement
    if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId)
    if (this.dragging) {
      this.dragging = false
      // A click follows pointerup (not pointercancel): swallow it so a drag never toggles.
      this.swallowClick = e.type === 'pointerup'
      this.snap(true)
    }
  }

  private onClick = (): void => {
    if (this.swallowClick) {
      this.swallowClick = false
      return
    }
    if (this.menuOpen) {
      this.menuOpen = false
      return
    }
    this.audio.engine.toggle()
  }

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault()
    this.menuOpen = true
  }

  private onDiscKey = (e: KeyboardEvent): void => {
    if (e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey)) {
      e.preventDefault()
      this.menuOpen = true
    }
  }

  // ─── Menu ─────────────────────────────────────────────────────────

  private onOutside = (e: PointerEvent): void => {
    if (!e.composedPath().includes(this)) this.closeMenu(false)
  }

  /**
   * Every way of closing the menu goes through here, so focus is never
   * left on a hidden menu item: it returns to the disc, or is released.
   */
  private closeMenu(focusDisc = true): void {
    this.menuOpen = false
    const active = this.shadowRoot?.activeElement as HTMLElement | null
    if (focusDisc) this.renderRoot.querySelector<HTMLElement>('.disc')?.focus()
    else if (active?.classList.contains('item')) active.blur()
  }

  private onMenuKey = (e: KeyboardEvent): void => {
    const items = Array.from(this.renderRoot.querySelectorAll<HTMLElement>('.item'))
    const index = items.indexOf(this.shadowRoot?.activeElement as HTMLElement)
    let next = -1
    if (e.key === 'Escape') {
      e.preventDefault()
      this.closeMenu()
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      this.closeMenu()
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (index + 1) % items.length
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft')
      next = (index - 1 + items.length) % items.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    if (next < 0) return
    e.preventDefault()
    items[next]?.focus()
  }

  private act(action: 'prev' | 'next' | 'close'): void {
    const engine = this.audio.engine
    if (action === 'prev') engine.prev()
    else if (action === 'next') engine.next()
    else {
      engine.close()
      this.closeMenu(false)
      return
    }
    this.closeMenu()
  }

  // ─── Render ───────────────────────────────────────────────────────

  protected override render() {
    const engine = this.audio.engine
    const state = this.audio.state
    const track = engine.track
    const labels = mergeLabels(this.labels)
    const playing = state.isPlaying
    const shown = this.reveal === 'always' || state.isVisible
    const playLabel = playing ? labels.pause : labels.play

    return html`
      <div
        class="root fab"
        ?data-shown=${shown}
        ?data-playing=${playing}
        ?data-pulso=${this.pulso}
        ?data-menu=${this.menuOpen}
        ?data-dragging=${this.dragging}
        style=${styleMap({
          '--_sampled-accent': this.sampledAccent ?? null,
          '--pulse-accent': this.accentColor ?? null,
          '--progress': String(engine.progress / 100),
        })}
      >
        <div class="halo" aria-hidden="true"></div>
        <div class="pulso" aria-hidden="true"></div>
        <button
          class="disc"
          type="button"
          aria-label=${track ? `${playLabel}: ${track.title}` : playLabel}
          ?disabled=${!track}
          @pointerdown=${this.onDown}
          @pointermove=${this.onMove}
          @pointerup=${this.onUp}
          @pointercancel=${this.onUp}
          @click=${this.onClick}
          @contextmenu=${this.onContextMenu}
          @keydown=${this.onDiscKey}
        >
          ${
            this.variant === 'auto' && track?.cover
              ? keyed(
                  track.cover,
                  html`<img class="disc__cover" src=${track.cover} alt="" draggable="false" />`,
                )
              : this.variant === 'auto'
                ? html`<div
                    class="disc__placeholder"
                    style=${styleMap({
                      background: track
                        ? `linear-gradient(135deg, hsl(${hueFrom(track.title)} 70% 50%), hsl(${(hueFrom(track.title) + 50) % 360} 70% 24%))`
                        : null,
                    })}
                  ></div>`
                : nothing
          }
          <div class="disc__scrim"></div>
          <span class="glyphs" ?data-playing=${playing}
            >${track ? html`${playIcon}${pauseIcon}` : noteIcon}</span
          >
          <span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          <svg class="ring" viewBox="0 0 100 100" aria-hidden="true">
            <circle class="ring__track" cx="50" cy="50" r="47" pathLength="100" />
            <circle class="ring__progress" cx="50" cy="50" r="47" pathLength="100" />
          </svg>
        </button>

        <button
          class="more"
          type="button"
          aria-label=${labels.options}
          aria-haspopup="menu"
          aria-expanded=${this.menuOpen ? 'true' : 'false'}
          @click=${() => (this.menuOpen = !this.menuOpen)}
        >
          ${moreIcon}
        </button>

        <div class="menu" role="menu" aria-label=${labels.options} @keydown=${this.onMenuKey}>
          <button
            class="item"
            role="menuitem"
            style="--i: 0"
            tabindex=${this.menuOpen ? '0' : '-1'}
            aria-hidden=${this.menuOpen ? 'false' : 'true'}
            aria-label=${labels.previous}
            @click=${() => this.act('prev')}
          >
            ${previousIcon}
          </button>
          <button
            class="item"
            role="menuitem"
            style="--i: 1"
            tabindex=${this.menuOpen ? '0' : '-1'}
            aria-hidden=${this.menuOpen ? 'false' : 'true'}
            aria-label=${labels.next}
            @click=${() => this.act('next')}
          >
            ${nextIcon}
          </button>
          <button
            class="item item--close"
            role="menuitem"
            style="--i: 2"
            tabindex=${this.menuOpen ? '0' : '-1'}
            aria-hidden=${this.menuOpen ? 'false' : 'true'}
            aria-label=${labels.close}
            @click=${() => this.act('close')}
          >
            ${closeIcon}
          </button>
        </div>

        ${
          track
            ? html`<div class="peek" aria-hidden="true">
                <strong>${track.title}</strong
                >${track.artist ? html`<span>${track.artist}</span>` : nothing}
              </div>`
            : nothing
        }
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pulse-fab': PulseFabElement
  }
}
