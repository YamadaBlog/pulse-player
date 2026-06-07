import { useEffect, useRef } from 'react'
import type { EventMap, PulseVariant } from '@pulse-music/types'
import { useDomEvent } from './useDomEvent'

/**
 * `<PulseFab />` — React wrapper around `<pulse-fab>`.
 *
 * Thin adapter (~60 LOC). Shares the singleton engine with
 * `<PulsePlayer />`, so toggling one toggles both.
 *
 * Example:
 *
 * ```tsx
 * <PulseFab variant="vinyl" pulso />
 * ```
 */

import '@pulse-music/web-component'

export interface PulseFabProps {
  variant?: PulseVariant
  pulso?: boolean
  /** Show the radial menu (chevron toggle + popover with palette + Pulso/Fullscreen toggles). */
  showMenu?: boolean
  /** Allow drag-to-reposition. Position persists to localStorage. */
  draggable?: boolean
  /** localStorage key for the persisted FAB position. Default `pulse-fab-pos`. */
  persistKey?: string
  onPlay?: (payload: EventMap['play']) => void
  onPause?: (payload: EventMap['pause']) => void
  onTrackChange?: (payload: EventMap['trackchange']) => void
  onError?: (payload: EventMap['error']) => void
  className?: string
  style?: React.CSSProperties
}

export function PulseFab({
  variant = 'auto',
  pulso = false,
  showMenu = false,
  draggable = false,
  persistKey,
  onPlay,
  onPause,
  onTrackChange,
  onError,
  className,
  style,
}: PulseFabProps) {
  const ref = useRef<HTMLElement>(null)

  useDomEvent<EventMap['play']>(ref, 'pulse-play', onPlay)
  useDomEvent<EventMap['pause']>(ref, 'pulse-pause', onPause)
  useDomEvent<EventMap['trackchange']>(ref, 'pulse-trackchange', onTrackChange)
  useDomEvent<EventMap['error']>(ref, 'pulse-error', onError)

  // Boolean presence attributes. React 18 doesn't reliably serialise
  // `false` to "remove the attribute" — we imperatively set / remove
  // them for correctness across versions.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (pulso) el.setAttribute('pulso', '')
    else el.removeAttribute('pulso')
  }, [pulso])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (showMenu) el.setAttribute('show-menu', '')
    else el.removeAttribute('show-menu')
  }, [showMenu])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (draggable) el.setAttribute('draggable', '')
    else el.removeAttribute('draggable')
  }, [draggable])

  useEffect(() => {
    const el = ref.current
    if (!el || !persistKey) return
    el.setAttribute('persist-key', persistKey)
  }, [persistKey])

  return <pulse-fab ref={ref} variant={variant} class={className} style={style} />
}
