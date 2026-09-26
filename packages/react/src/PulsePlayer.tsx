import { createElement, useState, type CSSProperties, type ReactNode } from 'react'
import '@pulse-music/web-component'
import type { PulseEngine } from '@pulse-music/core'
import type { PulseLabels } from '@pulse-music/web-component'
import type { EventMap, PulseVariant, Track } from '@pulse-music/types'
import { useElementEvents, useElementProperties } from './element'

export interface PulsePlayerProps {
  variant?: PulseVariant
  accentColor?: string
  customBackground?: string
  ambientEq?: boolean
  grain?: boolean
  resizable?: boolean
  resizeMin?: number
  resizeMax?: number
  session?: string
  engine?: PulseEngine
  tracks?: Track[]
  labels?: Partial<PulseLabels>
  onPlay?: (detail: EventMap['play']) => void
  onPause?: (detail: EventMap['pause']) => void
  onTrackChange?: (detail: EventMap['trackchange']) => void
  onEnded?: (detail: EventMap['ended']) => void
  onError?: (detail: EventMap['error']) => void
  onResize?: (detail: { width: number }) => void
  className?: string
  style?: CSSProperties
  /** `<pulse-track>` elements and/or `slot="actions"` content. */
  children?: ReactNode
}

/**
 * `<PulsePlayer />` — the inline player card (`<pulse-player>`), with
 * typed props and camel-cased event callbacks.
 */
export function PulsePlayer(props: PulsePlayerProps) {
  const [el, setEl] = useState<HTMLElement | null>(null)
  useElementProperties(el, {
    variant: props.variant,
    accentColor: props.accentColor,
    customBackground: props.customBackground,
    ambientEq: props.ambientEq,
    grain: props.grain,
    resizable: props.resizable,
    resizeMin: props.resizeMin,
    resizeMax: props.resizeMax,
    session: props.session,
    engine: props.engine,
    tracks: props.tracks,
    labels: props.labels,
    className: props.className,
  })
  useElementEvents(el, {
    'pulse-play': props.onPlay,
    'pulse-pause': props.onPause,
    'pulse-trackchange': props.onTrackChange,
    'pulse-ended': props.onEnded,
    'pulse-error': props.onError,
    'pulse-resize': props.onResize,
  })
  return createElement(
    'pulse-player',
    // variant/session as attributes too: correct from the first render (and in SSR HTML).
    { ref: setEl, variant: props.variant, session: props.session, style: props.style },
    props.children,
  )
}
