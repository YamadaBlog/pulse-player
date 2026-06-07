/**
 * JSX intrinsic-element declarations for the pulse-* Custom Elements.
 *
 * React 19 has native Custom Element support: kebab-case attributes
 * and on-handlers Just Work. React 18 doesn't — the JSX type system
 * doesn't know about the elements unless we extend
 * `JSX.IntrinsicElements`. This file does exactly that, so consumers
 * importing `@pulse/react` (which side-effect-registers the elements)
 * also get the type completions on `<pulse-player />` and
 * `<pulse-fab />` in JSX.
 */
import type { CSSProperties, DetailedHTMLProps, HTMLAttributes, Ref } from 'react'
import type { PulseVariant, Track } from '@pulse/types'

type CustomElementProps<E extends HTMLElement> = DetailedHTMLProps<HTMLAttributes<E>, E> & {
  ref?: Ref<E>
  class?: string
  style?: CSSProperties
}

declare global {
  /* eslint-disable @typescript-eslint/no-namespace */
  namespace JSX {
    interface IntrinsicElements {
      'pulse-player': CustomElementProps<HTMLElement> & {
        variant?: PulseVariant
        'accent-color'?: string
        tracks?: Track[]
        'ambient-eq'?: boolean | ''
        'data-fab'?: boolean | ''
        resizable?: boolean | ''
        'github-url'?: string
        'spotify-url'?: string
      }
      'pulse-fab': CustomElementProps<HTMLElement> & {
        variant?: PulseVariant
        pulso?: boolean | ''
        'show-menu'?: boolean | ''
        draggable?: boolean | ''
        'persist-key'?: string
      }
    }
  }
}

export {}
