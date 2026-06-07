import { LitElement, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import type { PulseEngine } from '@pulse-music/core'
import type { PulseState, PulseVariant, Unsubscribe } from '@pulse-music/types'
import { ALL_VARIANTS } from '@pulse-music/types'
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

  /**
   * Allow the user to drag the FAB to any position on the viewport.
   * The chosen position persists across reloads via `localStorage`
   * under the key configured by `persistKey`. Mirrors v2.3.4
   * MiniPlayer.
   */
  @property({ type: Boolean, reflect: true })
  draggable = false

  /** localStorage key used by the drag persistence. Default `pulse-fab-pos`. */
  @property({ type: String, attribute: 'persist-key' })
  persistKey = 'pulse-fab-pos'

  /**
   * Opt into the radial menu that lets the user pick a variant and
   * toggle pulso / fullscreen at runtime. When `true`, a small chevron
   * appears next to the FAB; clicking it opens the menu.
   */
  @property({ type: Boolean, attribute: 'show-menu', reflect: true })
  showMenu = false

  /** Whether the radial menu is currently open. Internal state. */
  @state()
  private menuOpen = false

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

  private onDocumentClick = (): void => {
    if (this.menuOpen) this.menuOpen = false
  }

  /**
   * Keyboard navigation inside the open radial menu.
   *
   * Listens on `keydown` so `Escape` closes the menu (and returns
   * focus to the toggle) and `ArrowDown` / `ArrowUp` move through
   * the menu items, wrapping at the edges. Mirrors the WAI-ARIA
   * "Menu Button" pattern.
   */
  private onMenuKeydown = (e: KeyboardEvent): void => {
    if (!this.menuOpen) return
    if (e.key === 'Escape') {
      e.preventDefault()
      this.menuOpen = false
      // Return focus to the chevron toggle.
      const toggle = this.shadowRoot?.querySelector(
        '.fab__menu-toggle',
      ) as HTMLButtonElement | null
      toggle?.focus()
      return
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const items = Array.from(
      this.shadowRoot?.querySelectorAll<HTMLElement>(
        '.fab__chip, .fab__menu-item',
      ) ?? [],
    )
    if (!items.length) return
    const active = (this.shadowRoot?.activeElement ?? null) as HTMLElement | null
    const idx = active ? items.indexOf(active) : -1
    const next =
      e.key === 'ArrowDown'
        ? items[(idx + 1) % items.length]
        : items[(idx - 1 + items.length) % items.length]
    next?.focus()
  }

  override connectedCallback(): void {
    super.connectedCallback()
    document.addEventListener('click', this.onDocumentClick)
    this.addEventListener('keydown', this.onMenuKeydown)
    this.offState = this.engine.onStateChange((s) => {
      this.state = { ...s }
    })
    this.offPlay = this.engine.subscribe('play', (detail) => this.fire('pulse-play', detail))
    this.offPause = this.engine.subscribe('pause', (detail) => this.fire('pulse-pause', detail))
    this.offTrackChange = this.engine.subscribe('trackchange', (detail) =>
      this.fire('pulse-trackchange', detail),
    )
    this.offError = this.engine.subscribe('error', (detail) => this.fire('pulse-error', detail))

    // Restore persisted FAB position if drag is enabled.
    if (this.draggable && typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(this.persistKey)
        if (raw) {
          const { x, y } = JSON.parse(raw) as { x: number; y: number }
          this.style.position = 'fixed'
          this.style.left = `${x}px`
          this.style.top = `${y}px`
          this.style.right = 'auto'
          this.style.bottom = 'auto'
        }
      } catch {
        /* malformed localStorage — ignore */
      }
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    document.removeEventListener('click', this.onDocumentClick)
    this.removeEventListener('keydown', this.onMenuKeydown)
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

  // ─── Drag-to-reposition (draggable) ──────────────────────────
  // Pointer events on the FAB button reposition the host element on
  // the viewport. Pointer capture survives mouse leaving the FAB.
  // Position persists to localStorage under `persistKey`. Click vs.
  // drag is distinguished by `didMove` — a pointerdown that never
  // exceeds 4 px of displacement is forwarded as a normal click
  // (engine.toggle()). Mirrors v2.3.4 MiniPlayer.
  private dragStartX = 0
  private dragStartY = 0
  private dragOffsetX = 0
  private dragOffsetY = 0
  private didMove = false

  private onFabPointerDown(e: PointerEvent): void {
    if (!this.draggable) return
    e.preventDefault()
    const rect = this.getBoundingClientRect()
    this.dragStartX = e.clientX
    this.dragStartY = e.clientY
    this.dragOffsetX = e.clientX - rect.left
    this.dragOffsetY = e.clientY - rect.top
    this.didMove = false
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    ;(e.currentTarget as Element).addEventListener(
      'pointermove',
      this.onFabPointerMove as unknown as EventListener,
    )
    ;(e.currentTarget as Element).addEventListener(
      'pointerup',
      this.onFabPointerUp as unknown as EventListener,
    )
  }

  private onFabPointerMove = (e: PointerEvent): void => {
    const dx = e.clientX - this.dragStartX
    const dy = e.clientY - this.dragStartY
    if (!this.didMove && Math.hypot(dx, dy) > 4) this.didMove = true
    if (!this.didMove) return
    this.style.position = 'fixed'
    this.style.left = `${e.clientX - this.dragOffsetX}px`
    this.style.top = `${e.clientY - this.dragOffsetY}px`
    this.style.right = 'auto'
    this.style.bottom = 'auto'
  }

  private onFabPointerUp = (e: PointerEvent): void => {
    const target = e.currentTarget as Element
    target.releasePointerCapture(e.pointerId)
    target.removeEventListener(
      'pointermove',
      this.onFabPointerMove as unknown as EventListener,
    )
    target.removeEventListener('pointerup', this.onFabPointerUp as unknown as EventListener)

    if (this.didMove) {
      // Persist the final position.
      try {
        const rect = this.getBoundingClientRect()
        window.localStorage.setItem(
          this.persistKey,
          JSON.stringify({ x: rect.left, y: rect.top }),
        )
      } catch {
        /* localStorage unavailable (Safari private mode, etc.) — drop silently */
      }
    } else {
      // Below the displacement threshold — treat as a click.
      this.engine.toggle()
    }
  }

  // ─── Menu controls ─────────────────────────────────────────
  private toggleMenu = (e: Event): void => {
    e.stopPropagation()
    this.menuOpen = !this.menuOpen
  }

  private closeMenu = (): void => {
    this.menuOpen = false
  }

  private pickVariant(v: PulseVariant): void {
    this.variant = v
    this.menuOpen = false
  }

  private togglePulso(): void {
    this.pulso = !this.pulso
  }

  /**
   * Request fullscreen on `<html>` (the whole document). Most consumers
   * want the page chrome to disappear when they tap fullscreen on the
   * FAB, not just the FAB element. Mirrors the v2.3.4 demo.
   * Re-tapping toggles back. Catches the promise rejection so a
   * refusal (mobile Safari without user gesture, iframe sandboxed)
   * doesn't crash.
   */
  private toggleFullscreen = (): void => {
    if (typeof document === 'undefined') return
    const doc = document as Document & {
      webkitFullscreenElement?: Element
      webkitExitFullscreen?: () => Promise<void>
    }
    const docEl = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>
    }
    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      const exit = doc.exitFullscreen ?? doc.webkitExitFullscreen
      void exit?.call(doc)
    } else {
      const enter = docEl.requestFullscreen ?? docEl.webkitRequestFullscreen
      void enter?.call(docEl).catch(() => {
        /* refusal (no user gesture, iframe sandbox) — drop silently */
      })
    }
    this.menuOpen = false
  }

  override render() {
    const isPlaying = this.state.isPlaying
    const classes = `fab ${isPlaying ? 'fab--playing' : ''} ${this.pulso && isPlaying ? 'fab--pulso' : ''} ${this.draggable ? 'fab--draggable' : ''}`
    // If `draggable` is on, the click is forwarded by the pointer-up
    // handler (when displacement < 4 px). Otherwise wire a normal
    // click → toggle.
    return html`
      <div class="fab-wrapper">
        <button
          class=${classes}
          type="button"
          data-variant=${this.variant}
          aria-label=${isPlaying ? 'Pause' : 'Play'}
          aria-pressed=${isPlaying}
          @pointerdown=${this.onFabPointerDown}
          @click=${(e: MouseEvent) => {
            if (this.draggable) {
              // Drag mode swallows the click — pointer-up emits toggle.
              e.preventDefault()
              return
            }
            this.engine.toggle()
          }}
        >
          ${isPlaying ? '⏸' : '▶'}
        </button>

        ${this.showMenu
          ? html`
              <button
                class="fab__menu-toggle"
                type="button"
                aria-label="Options"
                aria-expanded=${this.menuOpen}
                @click=${this.toggleMenu}
              >
                ⋮
              </button>

              ${this.menuOpen
                ? html`
                    <div class="fab__menu" role="menu" @click=${(e: Event) => e.stopPropagation()}>
                      <div class="fab__menu-section">
                        <p class="fab__menu-label">Variant</p>
                        <div class="fab__palette">
                          ${ALL_VARIANTS.filter((v) => v !== 'custom').map(
                            (v) => html`
                              <button
                                class=${`fab__chip ${this.variant === v ? 'fab__chip--active' : ''}`}
                                type="button"
                                data-variant=${v}
                                aria-pressed=${this.variant === v}
                                aria-label=${`Variant ${v}`}
                                title=${v}
                                @click=${() => this.pickVariant(v)}
                              ></button>
                            `,
                          )}
                        </div>
                      </div>

                      <div class="fab__menu-section">
                        <button
                          class="fab__menu-item"
                          role="menuitemcheckbox"
                          aria-checked=${this.pulso}
                          @click=${this.togglePulso}
                        >
                          <span>Pulso</span>
                          <span class="fab__menu-check">${this.pulso ? '●' : '○'}</span>
                        </button>
                        <button
                          class="fab__menu-item"
                          role="menuitem"
                          @click=${this.toggleFullscreen}
                        >
                          Fullscreen ⤢
                        </button>
                      </div>
                    </div>
                  `
                : ''}
            `
          : ''}
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pulse-fab': PulseFabElement
  }
}
