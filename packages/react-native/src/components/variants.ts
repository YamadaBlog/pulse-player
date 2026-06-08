/**
 * Variant gradient + accent colour table — RN equivalent of
 * @pulse-music/tokens variants.ts. Since RN has no CSS custom
 * properties, every variant ships as a tuple `{ bg, accent }`
 * consumed directly by StyleSheet objects in PulsePlayer / PulseFab.
 *
 * The list MUST stay in lockstep with @pulse-music/tokens — both
 * declare the same 8 named variants + 'auto' + 'custom'. When the
 * shared tokens package adds a new variant, mirror it here.
 */

import type { PulseVariant } from '@pulse-music/types'

interface VariantStyle {
  /** Background colour (solid fallback; RN doesn't support gradients
   *  natively — consumers can layer LinearGradient from
   *  expo-linear-gradient or react-native-linear-gradient on top). */
  bg: string
  /** Foreground accent colour (used for buttons, EQ bars, progress). */
  accent: string
  /** Display name. */
  label: string
}

export const VARIANTS: Record<Exclude<PulseVariant, 'auto' | 'custom'>, VariantStyle> = {
  transparent: { bg: 'transparent', accent: '#3DBDA7', label: 'Transparent' },
  solid: { bg: '#0E0E12', accent: '#3DBDA7', label: 'Solid' },
  dark: { bg: '#050508', accent: '#5B7BFE', label: 'Dark' },
  light: { bg: '#F4F4F6', accent: '#3A8DD8', label: 'Light' },
  sunset: { bg: '#3B1F1A', accent: '#E69470', label: 'Sunset' },
  midnight: { bg: '#0A0B23', accent: '#8B5CF6', label: 'Midnight' },
  aurora: { bg: '#062A33', accent: '#3DBDA7', label: 'Aurora' },
  vinyl: { bg: '#1E1612', accent: '#C8A97E', label: 'Vinyl' },
}

const FALLBACK: VariantStyle = VARIANTS.midnight

export function resolveVariant(
  variant: PulseVariant | undefined,
  accentColor?: string,
): VariantStyle {
  if (variant === 'custom' && accentColor) {
    return { ...FALLBACK, accent: accentColor }
  }
  if (!variant || variant === 'auto') {
    return FALLBACK
  }
  const style = VARIANTS[variant as Exclude<PulseVariant, 'auto' | 'custom'>]
  return style ?? FALLBACK
}
