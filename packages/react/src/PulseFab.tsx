import { useEffect, useRef } from 'react'
import type { EventMap, PulseVariant } from '@pulse/types'
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

import '@pulse/web-component'

export interface PulseFabProps {
  variant?: PulseVariant
  pulso?: boolean
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

  // `pulso` is a boolean presence attribute. React 18 doesn't reliably
  // serialise a `false` boolean to "remove the attribute" — we
  // imperatively set / remove it for correctness across versions.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (pulso) el.setAttribute('pulso', '')
    else el.removeAttribute('pulso')
  }, [pulso])

  return <pulse-fab ref={ref} variant={variant} class={className} style={style} />
}
