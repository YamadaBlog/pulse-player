import type { PulseVariant } from '@pulse-music/types'

export interface VariantTokens {
  /** Human-readable name. */
  label: string
  /** One-line description, used by pickers and docs. */
  description: string
  /** CSS `background` value (may be a layered gradient). */
  background: string
  /** Flat approximation of `background` — for native renderers and fallbacks. */
  surface: string
  /** Primary text / icon colour. */
  foreground: string
  /** Secondary text colour. */
  muted: string
  /** Default accent (progress, EQ, focus rings, play button). */
  accent: string
  /** Hairline border drawn inside the card. */
  border: string
  /** Colour scheme of the surface — drives native form controls and contrast choices. */
  scheme: 'dark' | 'light'
}

export type NamedVariant = Exclude<PulseVariant, 'custom'>

/**
 * The nine built-in moods. `auto` paints a blurred copy of the cover
 * behind the card (drawn by the renderer, `background` is its fallback)
 * and derives its accent from the artwork.
 */
export const VARIANTS: Readonly<Record<NamedVariant, VariantTokens>> = Object.freeze({
  auto: {
    label: 'Auto',
    description: 'Blurred cover art, accent sampled from the artwork.',
    background: 'linear-gradient(140deg, #16131f 0%, #0d0c14 100%)',
    surface: '#121019',
    foreground: '#ffffff',
    muted: 'rgb(255 255 255 / 0.62)',
    accent: '#3dbda7',
    border: 'rgb(255 255 255 / 0.1)',
    scheme: 'dark',
  },
  transparent: {
    label: 'Transparent',
    description: 'No surface at all — sits on top of your own background.',
    background: 'transparent',
    surface: 'transparent',
    foreground: '#ffffff',
    muted: 'rgb(255 255 255 / 0.68)',
    accent: '#3dbda7',
    border: 'rgb(255 255 255 / 0.14)',
    scheme: 'dark',
  },
  solid: {
    label: 'Solid',
    description: 'Neutral graphite card.',
    background: '#15151b',
    surface: '#15151b',
    foreground: '#f5f5f7',
    muted: 'rgb(245 245 247 / 0.6)',
    accent: '#3dbda7',
    border: 'rgb(255 255 255 / 0.08)',
    scheme: 'dark',
  },
  dark: {
    label: 'Dark',
    description: 'Near-black, for OLED-dark interfaces.',
    background: '#08080c',
    surface: '#08080c',
    foreground: '#f5f5f7',
    muted: 'rgb(245 245 247 / 0.58)',
    accent: '#6d8bff',
    border: 'rgb(255 255 255 / 0.07)',
    scheme: 'dark',
  },
  light: {
    label: 'Light',
    description: 'Inverted palette for light interfaces.',
    background: 'linear-gradient(160deg, #ffffff 0%, #f1f1f5 100%)',
    surface: '#f6f6f9',
    foreground: '#15151b',
    muted: 'rgb(21 21 27 / 0.62)',
    accent: '#0e8f7c',
    border: 'rgb(21 21 27 / 0.1)',
    scheme: 'light',
  },
  sunset: {
    label: 'Sunset',
    description: 'Ember, coral and amber.',
    background: [
      'radial-gradient(ellipse 70% 60% at 18% 12%, rgb(255 138 76 / 0.5) 0%, transparent 60%)',
      'radial-gradient(ellipse 60% 50% at 82% 22%, rgb(236 72 153 / 0.36) 0%, transparent 65%)',
      'radial-gradient(ellipse 80% 70% at 50% 100%, rgb(245 158 11 / 0.38) 0%, transparent 70%)',
      'linear-gradient(135deg, #1a0a05 0%, #2d140c 50%, #3d1c0e 100%)',
    ].join(', '),
    surface: '#2d140c',
    foreground: '#fff7ef',
    muted: 'rgb(255 240 225 / 0.66)',
    accent: '#ff9f5a',
    border: 'rgb(255 170 110 / 0.18)',
    scheme: 'dark',
  },
  midnight: {
    label: 'Midnight',
    description: 'Deep indigo with violet light.',
    background: [
      'radial-gradient(ellipse 70% 60% at 20% 15%, rgb(139 92 246 / 0.5) 0%, transparent 60%)',
      'radial-gradient(ellipse 55% 60% at 80% 12%, rgb(99 102 241 / 0.4) 0%, transparent 60%)',
      'radial-gradient(ellipse 60% 50% at 95% 75%, rgb(236 72 153 / 0.3) 0%, transparent 60%)',
      'linear-gradient(140deg, #07071a 0%, #0e0c2a 45%, #161438 100%)',
    ].join(', '),
    surface: '#0e0c2a',
    foreground: '#f4f2ff',
    muted: 'rgb(230 225 255 / 0.64)',
    accent: '#a78bfa',
    border: 'rgb(167 139 250 / 0.2)',
    scheme: 'dark',
  },
  aurora: {
    label: 'Aurora',
    description: 'Teal and emerald polar light.',
    background: [
      'radial-gradient(ellipse 70% 60% at 18% 18%, rgb(6 182 212 / 0.45) 0%, transparent 60%)',
      'radial-gradient(ellipse 55% 60% at 85% 22%, rgb(16 185 129 / 0.38) 0%, transparent 60%)',
      'radial-gradient(ellipse 70% 50% at 50% 100%, rgb(45 212 191 / 0.4) 0%, transparent 65%)',
      'linear-gradient(135deg, #02161b 0%, #052a30 45%, #073846 100%)',
    ].join(', '),
    surface: '#052a30',
    foreground: '#effffc',
    muted: 'rgb(220 255 250 / 0.64)',
    accent: '#2dd4bf',
    border: 'rgb(45 212 191 / 0.2)',
    scheme: 'dark',
  },
  vinyl: {
    label: 'Vinyl',
    description: 'Warm analog brown with a brass accent.',
    background: [
      'radial-gradient(ellipse 65% 55% at 25% 20%, rgb(212 175 121 / 0.28) 0%, transparent 60%)',
      'radial-gradient(ellipse 55% 60% at 78% 30%, rgb(200 120 70 / 0.24) 0%, transparent 60%)',
      'radial-gradient(ellipse 80% 60% at 50% 100%, rgb(150 90 50 / 0.3) 0%, transparent 70%)',
      'linear-gradient(135deg, #07050a 0%, #110b08 50%, #1f160f 100%)',
    ].join(', '),
    surface: '#150e0a',
    foreground: '#f5ede2',
    muted: 'rgb(245 237 226 / 0.6)',
    accent: '#d4af79',
    border: 'rgb(212 175 121 / 0.2)',
    scheme: 'dark',
  },
})

/** Look up a variant's tokens; `custom` and unknown values fall back to `solid`. */
export function resolveVariant(variant: PulseVariant | string | undefined): VariantTokens {
  return VARIANTS[variant as NamedVariant] ?? VARIANTS.solid
}

/**
 * Build the CSS that maps each variant onto the renderer's private
 * custom properties. `selector` receives a variant name and returns the
 * rule's selector — e.g. `v => \`:host([variant='${v}'])\``.
 *
 * Public overrides always win: consumers set `--pulse-accent`,
 * `--pulse-bg`, `--pulse-fg`… and the renderer reads
 * `var(--pulse-accent, var(--_accent))`.
 */
export function createVariantCss(selector: (variant: NamedVariant) => string): string {
  return (Object.keys(VARIANTS) as NamedVariant[])
    .map((name) => {
      const v = VARIANTS[name]
      return `${selector(name)} {
  --_bg: ${v.background};
  --_surface: ${v.surface};
  --_fg: ${v.foreground};
  --_muted: ${v.muted};
  --_accent: ${v.accent};
  --_border: ${v.border};
  color-scheme: ${v.scheme};
}`
    })
    .join('\n')
}
