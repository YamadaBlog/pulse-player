/**
 * Minimal typed event emitter. A throwing listener is reported and
 * skipped — it can never take the engine (or the other listeners) down.
 */
export class Emitter<Events extends object> {
  private readonly listeners = new Map<keyof Events, Set<(payload: never) => void>>()

  on<E extends keyof Events>(event: E, listener: (payload: Events[E]) => void): () => void {
    let set = this.listeners.get(event)
    if (!set) {
      set = new Set()
      this.listeners.set(event, set)
    }
    set.add(listener as (payload: never) => void)
    return () => {
      set.delete(listener as (payload: never) => void)
    }
  }

  emit<E extends keyof Events>(event: E, payload: Events[E]): void {
    const set = this.listeners.get(event)
    if (!set) return
    for (const listener of [...set]) {
      try {
        ;(listener as (payload: Events[E]) => void)(payload)
      } catch (error) {
        console.error(`[pulse] "${String(event)}" listener threw:`, error)
      }
    }
  }

  clear(): void {
    this.listeners.clear()
  }
}
