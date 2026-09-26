import { defineComponent, h, toRaw, type PropType } from 'vue'
import '@pulse-music/web-component'
import type { PulseEngine } from '@pulse-music/core'
import type { FabPlacement, PulseLabels } from '@pulse-music/web-component'
import type { EventMap, PulseVariant, Track } from '@pulse-music/types'

// Undefined props are left out so the element keeps its own defaults, and
// objects are unwrapped: the element must receive the real engine / arrays,
// not Vue reactive proxies.
const defined = (props: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(props)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, typeof v === 'object' && v !== null ? toRaw(v) : v]),
  )

type Emit = (event: string, detail: unknown) => void

const forward =
  (emit: Emit, name: string) =>
  (e: Event): void =>
    emit(name, (e as CustomEvent).detail)

const optionalBoolean = { type: Boolean, default: undefined }

/** `<PulsePlayer>` — the inline player card (`<pulse-player>`). */
export const PulsePlayer = defineComponent({
  name: 'PulsePlayer',
  props: {
    variant: String as PropType<PulseVariant>,
    accentColor: String,
    customBackground: String,
    ambientEq: optionalBoolean,
    grain: optionalBoolean,
    resizable: optionalBoolean,
    resizeMin: Number,
    resizeMax: Number,
    session: String,
    engine: Object as PropType<PulseEngine>,
    tracks: Array as PropType<Track[]>,
    labels: Object as PropType<Partial<PulseLabels>>,
  },
  emits: {
    play: (_detail: EventMap['play']) => true,
    pause: (_detail: EventMap['pause']) => true,
    trackchange: (_detail: EventMap['trackchange']) => true,
    ended: (_detail: EventMap['ended']) => true,
    error: (_detail: EventMap['error']) => true,
    resize: (_detail: { width: number }) => true,
  },
  setup(props, { emit, slots }) {
    const on = (name: string) => forward(emit as Emit, name)
    return () =>
      h(
        'pulse-player',
        {
          ...defined({ ...props }),
          'onPulse-play': on('play'),
          'onPulse-pause': on('pause'),
          'onPulse-trackchange': on('trackchange'),
          'onPulse-ended': on('ended'),
          'onPulse-error': on('error'),
          'onPulse-resize': on('resize'),
        },
        slots.default?.(),
      )
  },
})

/** `<PulseFab>` — the floating, draggable mini player (`<pulse-fab>`). */
export const PulseFab = defineComponent({
  name: 'PulseFab',
  props: {
    variant: String as PropType<PulseVariant>,
    accentColor: String,
    placement: String as PropType<FabPlacement>,
    reveal: String as PropType<'on-play' | 'always'>,
    size: Number,
    pulso: optionalBoolean,
    locked: optionalBoolean,
    persistKey: String,
    session: String,
    engine: Object as PropType<PulseEngine>,
    labels: Object as PropType<Partial<PulseLabels>>,
  },
  emits: {
    play: (_detail: EventMap['play']) => true,
    pause: (_detail: EventMap['pause']) => true,
    trackchange: (_detail: EventMap['trackchange']) => true,
    ended: (_detail: EventMap['ended']) => true,
    error: (_detail: EventMap['error']) => true,
  },
  setup(props, { emit }) {
    const on = (name: string) => forward(emit as Emit, name)
    return () =>
      h('pulse-fab', {
        ...defined({ ...props }),
        'onPulse-play': on('play'),
        'onPulse-pause': on('pause'),
        'onPulse-trackchange': on('trackchange'),
        'onPulse-ended': on('ended'),
        'onPulse-error': on('error'),
      })
  },
})
