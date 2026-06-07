import { useEffect, useRef } from 'react'
import type { EventMap, PulseVariant } from '@pulse/types'

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

  useEffect(() => {
    const el = ref.current
    if (!el || !onPlay) return
    const handler = (e: Event) => onPlay((e as CustomEvent<EventMap['play']>).detail)
    el.addEventListener('pulse-play', handler)
    return () => el.removeEventListener('pulse-play', handler)
  }, [onPlay])

  useEffect(() => {
    const el = ref.current
    if (!el || !onPause) return
    const handler = (e: Event) => onPause((e as CustomEvent<EventMap['pause']>).detail)
    el.addEventListener('pulse-pause', handler)
    return () => el.removeEventListener('pulse-pause', handler)
  }, [onPause])

  useEffect(() => {
    const el = ref.current
    if (!el || !onTrackChange) return
    const handler = (e: Event) =>
      onTrackChange((e as CustomEvent<EventMap['trackchange']>).detail)
    el.addEventListener('pulse-trackchange', handler)
    return () => el.removeEventListener('pulse-trackchange', handler)
  }, [onTrackChange])

  useEffect(() => {
    const el = ref.current
    if (!el || !onError) return
    const handler = (e: Event) => onError((e as CustomEvent<EventMap['error']>).detail)
    el.addEventListener('pulse-error', handler)
    return () => el.removeEventListener('pulse-error', handler)
  }, [onError])

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
