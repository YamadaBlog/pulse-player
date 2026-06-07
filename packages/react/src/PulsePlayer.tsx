import { useEffect, useRef } from 'react'
import type { EventMap, PulseVariant, Track } from '@pulse/types'
import { useDomEvent } from './useDomEvent'

/**
 * `<PulsePlayer />` — React wrapper around `<pulse-player>`.
 *
 * Thin adapter (~80 LOC). Lit handles the rendering; this component
 * just maps React conventions onto the Custom Element:
 *
 *   - camelCase props → kebab-case attributes (React 18 + 19)
 *   - `on{Event}` props → DOM event listeners via `useRef` + `useEffect`
 *   - Lifecycle cleanup detaches every listener on unmount
 *
 * The underlying `<pulse-player>` registers itself globally as soon as
 * `@pulse/web-component` is imported. This module side-effect imports
 * the package so consumers don't need a second import.
 *
 * Example:
 *
 * ```tsx
 * import { PulsePlayer } from '@pulse/react'
 *
 * function App() {
 *   return (
 *     <PulsePlayer
 *       variant="midnight"
 *       accentColor="#8B5CF6"
 *       onPlay={({ track, time }) => console.log('playing', track.title, time)}
 *       onError={({ reason }) => console.warn('audio error', reason)}
 *     />
 *   )
 * }
 * ```
 */

// Side-effect: register <pulse-player> globally.
import '@pulse/web-component'

export interface PulsePlayerProps {
  /** Mood variant. Default `'auto'`. */
  variant?: PulseVariant
  /** Override `--pulse-accent` (any CSS color). */
  accentColor?: string
  /** Optional playlist override. Replaces the singleton engine's playlist. */
  tracks?: Track[]
  /** Toggle the ambient EQ background animation. */
  ambientEq?: boolean
  /** Force the FAB morph regardless of host width. */
  dataFab?: boolean
  /** Enable the bottom-right drag-to-resize handle. */
  resizable?: boolean
  /** GitHub URL — turns the GitHub icon into a link. */
  githubUrl?: string
  /** Spotify URL — turns the Spotify icon into a link. */
  spotifyUrl?: string
  /** Fired on every play (synchronous with the engine action). */
  onPlay?: (payload: EventMap['play']) => void
  /** Fired on every pause. */
  onPause?: (payload: EventMap['pause']) => void
  /** Fired on next / prev / loadTrack. */
  onTrackChange?: (payload: EventMap['trackchange']) => void
  /** Fired on autoplay rejection or media error. */
  onError?: (payload: EventMap['error']) => void
  /** Pass-through className for layout / spacing. */
  className?: string
  /** Pass-through inline style. */
  style?: React.CSSProperties
}

export function PulsePlayer({
  variant = 'auto',
  accentColor,
  tracks,
  ambientEq = false,
  dataFab = false,
  resizable = false,
  githubUrl,
  spotifyUrl,
  onPlay,
  onPause,
  onTrackChange,
  onError,
  className,
  style,
}: PulsePlayerProps) {
  const ref = useRef<HTMLElement>(null)

  // Bridge React event-prop callbacks → DOM CustomEvent listeners.
  // The previous version copy-pasted the same useEffect block four
  // times; `useDomEvent` collapses each one to a single line and
  // keeps the typed `detail` payload intact.
  useDomEvent<EventMap['play']>(ref, 'pulse-play', onPlay)
  useDomEvent<EventMap['pause']>(ref, 'pulse-pause', onPause)
  useDomEvent<EventMap['trackchange']>(ref, 'pulse-trackchange', onTrackChange)
  useDomEvent<EventMap['error']>(ref, 'pulse-error', onError)

  // Push the `tracks` prop into the element's property channel.
  // `tracks` is an array, which can't be expressed as a HTML
  // attribute — we set it on the element instance directly.
  useEffect(() => {
    const el = ref.current as (HTMLElement & { tracks?: Track[] }) | null
    if (!el || !tracks) return
    el.tracks = tracks
  }, [tracks])

  // Boolean presence attributes (React 18 boolean serialisation safety).
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (ambientEq) el.setAttribute('ambient-eq', '')
    else el.removeAttribute('ambient-eq')
  }, [ambientEq])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (dataFab) el.setAttribute('data-fab', '')
    else el.removeAttribute('data-fab')
  }, [dataFab])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (resizable) el.setAttribute('resizable', '')
    else el.removeAttribute('resizable')
  }, [resizable])

  return (
    <pulse-player
      ref={ref}
      variant={variant}
      accent-color={accentColor}
      github-url={githubUrl}
      spotify-url={spotifyUrl}
      class={className}
      style={style}
    />
  )
}
