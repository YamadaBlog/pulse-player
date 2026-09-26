import { createElement, useState, type CSSProperties } from 'react'
import '@pulse-music/web-component'
import type { PulseEngine } from '@pulse-music/core'
import type { FabPlacement, PulseLabels } from '@pulse-music/web-component'
import type { EventMap, PulseVariant } from '@pulse-music/types'
import { useElementEvents, useElementProperties } from './element'

export interface PulseFabProps {
  variant?: PulseVariant
  accentColor?: string
  placement?: FabPlacement
  reveal?: 'on-play' | 'always'
  size?: number
  pulso?: boolean
  locked?: boolean
  persistKey?: string
  session?: string
  engine?: PulseEngine
  labels?: Partial<PulseLabels>
  onPlay?: (detail: EventMap['play']) => void
  onPause?: (detail: EventMap['pause']) => void
  onTrackChange?: (detail: EventMap['trackchange']) => void
  onEnded?: (detail: EventMap['ended']) => void
  onError?: (detail: EventMap['error']) => void
  className?: string
  style?: CSSProperties
}

/** `<PulseFab />` — the floating, draggable mini player (`<pulse-fab>`). */
export function PulseFab(props: PulseFabProps) {
  const [el, setEl] = useState<HTMLElement | null>(null)
  useElementProperties(el, {
    variant: props.variant,
    accentColor: props.accentColor,
    placement: props.placement,
    reveal: props.reveal,
    size: props.size,
    pulso: props.pulso,
    locked: props.locked,
    persistKey: props.persistKey,
    session: props.session,
    engine: props.engine,
    labels: props.labels,
    className: props.className,
  })
  useElementEvents(el, {
    'pulse-play': props.onPlay,
    'pulse-pause': props.onPause,
    'pulse-trackchange': props.onTrackChange,
    'pulse-ended': props.onEnded,
    'pulse-error': props.onError,
  })
  return createElement('pulse-fab', {
    ref: setEl,
    variant: props.variant,
    placement: props.placement,
    style: props.style,
  })
}
