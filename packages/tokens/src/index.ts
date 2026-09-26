/**
 * @pulse-music/tokens — design tokens shared by every Pulse renderer.
 *
 * Data first: the TypeScript objects are the single source of truth
 * (React Native reads them directly); the CSS helpers generate the
 * custom-property sheets the Web Components adopt.
 */
export {
  VARIANTS,
  resolveVariant,
  createVariantCss,
  type VariantTokens,
  type NamedVariant,
} from './variants'
export { EASING, DURATION, createMotionCss } from './motion'
