import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { getSharedEngine, type PulseEngine } from '@pulse-music/core'
import type { AudioEvent, PulseState, Unsubscribe } from '@pulse-music/types'

type Host = ReactiveControllerHost & HTMLElement

const FORWARDED: AudioEvent[] = ['play', 'pause', 'trackchange', 'ended', 'error']

/**
 * Binds a custom element to a `PulseEngine`: mirrors its state into the
 * element's render cycle and re-dispatches engine events as
 * `pulse-<event>` DOM events on the element itself (non-bubbling, so
 * several players on one page never produce duplicate notifications).
 */
export class EngineController implements ReactiveController {
  engine: PulseEngine
  state: PulseState
  private offs: Unsubscribe[] = []
  private connected = false
  private explicit: PulseEngine | null = null
  private session = 'default'

  constructor(
    private readonly host: Host,
    private readonly onChange?: (state: PulseState, previous: PulseState) => void,
  ) {
    this.engine = getSharedEngine()
    this.state = this.engine.state
    host.addController(this)
  }

  /** Bind to an explicit engine (`null` falls back to the named session). */
  use(engine: PulseEngine | null | undefined, session = 'default'): void {
    this.explicit = engine ?? null
    this.session = session || 'default'
    const next = this.explicit ?? getSharedEngine(this.session)
    if (next === this.engine) return
    this.detach()
    this.engine = next
    this.state = next.state
    if (this.connected) this.attach()
    this.host.requestUpdate()
  }

  hostConnected(): void {
    this.connected = true
    this.attach()
  }

  hostDisconnected(): void {
    this.connected = false
    this.detach()
  }

  private attach(): void {
    const engine = this.engine
    const previous = this.state
    this.state = engine.state
    this.offs.push(
      engine.onStateChange((state) => {
        const before = this.state
        this.state = state
        this.onChange?.(state, before)
        this.host.requestUpdate()
      }),
      ...FORWARDED.map((type) =>
        engine.subscribe(type, (detail) => {
          this.host.dispatchEvent(new CustomEvent(`pulse-${type}`, { detail }))
        }),
      ),
    )
    engine.prepare()
    if (previous !== this.state) this.onChange?.(this.state, previous)
  }

  private detach(): void {
    this.offs.forEach((off) => off())
    this.offs = []
  }
}
