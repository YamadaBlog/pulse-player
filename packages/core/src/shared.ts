import { PulseEngine } from './PulseEngine'

// Kept on globalThis under a registered symbol so two copies of this
// package in one bundle (a common monorepo / CDN accident) still share
// the same audio sessions instead of playing over each other.
const KEY = Symbol.for('@pulse-music/core:sessions')
type Holder = { [KEY]?: Map<string, PulseEngine> }

function sessions(): Map<string, PulseEngine> {
  const holder = globalThis as Holder
  return (holder[KEY] ??= new Map())
}

/**
 * The engine behind a named audio session — `'default'` unless you ask
 * otherwise. Every player bound to the same session shares one audio
 * element, so they stay in sync. Created lazily on first access.
 */
export function getSharedEngine(session = 'default'): PulseEngine {
  const map = sessions()
  let engine = map.get(session)
  if (!engine) {
    engine = new PulseEngine()
    map.set(session, engine)
  }
  return engine
}

/**
 * Install your own engine for a session — typically once at startup, to
 * pass options (`new PulseEngine({ tracks, crossOrigin })`). Players that
 * are already mounted keep the engine they captured.
 */
export function setSharedEngine(engine: PulseEngine, session = 'default'): void {
  sessions().set(session, engine)
}
