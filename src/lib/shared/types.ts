/**
 * Shared types between `MusicPlayer` and `MiniPlayer`.
 *
 * The two component variant unions used to be declared separately
 * (and inevitably drifted). Both now alias `PulseVariant` from this
 * module — single source of truth, single place to add a new theme.
 */

export type PulseVariant =
  | 'auto'
  | 'transparent'
  | 'solid'
  | 'dark'
  | 'light'
  | 'sunset'
  | 'midnight'
  | 'aurora'
  | 'vinyl'
  | 'custom'

/** Sentinel list — useful for runtime checks (`ALL_VARIANTS.includes(...)`)
 *  and for documentation generators that need to enumerate themes. */
export const ALL_VARIANTS: readonly PulseVariant[] = [
  'auto',
  'transparent',
  'solid',
  'dark',
  'light',
  'sunset',
  'midnight',
  'aurora',
  'vinyl',
  'custom',
] as const
