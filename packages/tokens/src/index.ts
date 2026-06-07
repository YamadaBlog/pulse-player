/**
 * @pulse/tokens — TypeScript exports for design tokens.
 *
 * For framework wrappers and Shadow DOM renderers that consume CSS
 * via JavaScript (Lit `unsafeCSS`, Constructable StyleSheets, etc.).
 *
 * For plain-CSS document-level consumers (Vue v2.3.4, vanilla HTML),
 * the `.css` files at `src/{variants,base,animations,index}.css` are
 * still the right import — they declare the same tokens at the
 * `[data-variant]` attribute level so they cascade naturally.
 */
export { variantsCss } from './variants'
export { baseCss } from './base'
