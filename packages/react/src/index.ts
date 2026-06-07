/**
 * @pulse/react — React wrapper for pulse-player.
 *
 * Exposes:
 *   - `<PulsePlayer />` — inline card (wraps `<pulse-player>` Custom Element)
 *   - `<PulseFab />`    — floating FAB (wraps `<pulse-fab>`)
 *   - `usePulseAudio()` — React hook over `@pulse/core` state (equivalent to Vue's `useAudioStore`)
 *
 * The components are THIN adapters — Lit handles the rendering, this
 * package just maps React conventions (camelCase props, synthetic
 * events, `useEffect` lifecycle) to the underlying Custom Element's
 * attributes and DOM events. Each component is ~30-60 lines.
 *
 * Status: SCAFFOLD. Implementation lands in v3.0.0-alpha.3, after
 * `@pulse/core` (alpha.1) and `@pulse/web-component` (alpha.2).
 */
export {} // placeholder export
