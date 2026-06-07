/**
 * @pulse-music/web-component — Universal Custom Elements for pulse-player.
 *
 * Defines:
 *   - `<pulse-player>` — inline card (mirrors MusicPlayer.vue)
 *   - `<pulse-fab>`    — floating action button (mirrors MiniPlayer.vue)
 *
 * These are real Custom Elements built with Lit. They work natively in
 * React (19+), Vue, Angular, Svelte, Solid, vanilla JS, Astro and Qwik.
 * Every framework wrapper (`@pulse-music/react`, `@pulse-music/vue`, etc.) consumes
 * these elements internally and just maps the framework's event /
 * prop conventions to the Custom Elements' DOM events / attributes.
 *
 * Status: v3.0.0-alpha.2 — first real release. Both elements ship a
 * minimum-viable inline card / FAB chrome. The remaining v2.3.4
 * features (ambient EQ, drag-to-resize, three responsive states,
 * pulso heartbeat keyframes, social icons, drag-the-FAB) land
 * additively in alpha.2.x as the Playwright visual regression gates
 * close the parity gap.
 *
 * Side-effect registration: importing this module registers BOTH
 * Custom Elements with the global registry. Consumers that need
 * lazy registration can import the individual classes from
 * `@pulse-music/web-component/PulsePlayer` and call
 * `customElements.define('pulse-player', PulsePlayerElement)`
 * themselves.
 */
export { PulsePlayerElement } from './PulsePlayer'
export { PulseFabElement } from './PulseFab'

export { getSharedEngine, setSharedEngine } from './engine-singleton'

// Re-export the engine + types so framework wrappers can pull
// everything from one module.
export { PulseEngine } from '@pulse-music/core'

export type {
  AudioEvent,
  ErrorReason,
  EventListener,
  EventMap,
  PulseState,
  PulseVariant,
  Track,
  Unsubscribe,
} from '@pulse-music/types'

export { ALL_VARIANTS } from '@pulse-music/types'
