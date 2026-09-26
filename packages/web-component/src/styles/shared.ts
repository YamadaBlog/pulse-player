import { css, unsafeCSS } from 'lit'
import { createMotionCss, createVariantCss } from '@pulse-music/tokens'

const variantCss = createVariantCss((v) =>
  v === 'auto' ? `:host, :host([variant='auto'])` : `:host([variant='${v}'])`,
)

/** Variant tokens → private custom properties (`--_bg`, `--_accent`…). */
export const variantStyles = unsafeCSS(`${variantCss}
:host([variant='custom']) {
  --_bg: var(--pulse-custom-bg, #15151b);
  --_surface: #15151b;
  --_fg: #f5f5f7;
  --_muted: rgb(245 245 247 / 0.62);
  --_accent: #3dbda7;
  --_border: rgb(255 255 255 / 0.1);
  color-scheme: dark;
}`)

export const motionStyles = unsafeCSS(createMotionCss(':host'))

export const baseStyles = css`
  :host {
    box-sizing: border-box;
    font-family: var(--pulse-font, inherit);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  :host([hidden]) {
    display: none !important;
  }
  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }
  .root {
    --pulse-live-accent: var(--pulse-accent, var(--_sampled-accent, var(--_accent)));
    --fg: var(--pulse-fg, var(--_fg));
    --muted: var(--pulse-muted, var(--_muted));
    --bg: var(--pulse-bg, var(--_bg));
    --border: var(--pulse-border, var(--_border));
    --accent: var(--pulse-live-accent);
    transition: --pulse-live-accent 900ms var(--pulse-ease-out);
  }
  button {
    font: inherit;
    color: inherit;
    background: none;
    border: 0;
    padding: 0;
    margin: 0;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  button:disabled {
    cursor: default;
    opacity: 0.38;
  }
  :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }
  .icon {
    display: block;
    width: 100%;
    height: 100%;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  /* Play ⇄ pause: the two glyphs swap with a quick rotate-and-scale. */
  .glyphs {
    position: relative;
    display: grid;
  }
  .glyphs > .icon {
    grid-area: 1 / 1;
    transition:
      opacity var(--pulse-dur-fast) var(--pulse-ease-out),
      transform var(--pulse-dur-spring) var(--pulse-ease-pop);
  }
  .glyphs .icon--play {
    translate: 6% 0;
  }
  .glyphs[data-playing] .icon--play,
  .glyphs:not([data-playing]) .icon--pause {
    opacity: 0;
    transform: scale(0.4) rotate(-90deg);
  }

  /* Four-bar live equaliser. Bars are scaled from script, per frame. */
  .eq {
    display: inline-flex;
    align-items: flex-end;
    gap: var(--eq-gap, 2px);
    height: var(--eq-h, 12px);
  }
  .eq i {
    width: var(--eq-w, 3px);
    height: 100%;
    border-radius: 99px;
    background: var(--accent);
    transform-origin: 50% 100%;
    transform: scaleY(0.18);
    transition: transform 420ms var(--pulse-ease-out);
  }
  .eq[data-live] i {
    transition: none;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 1ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 1ms !important;
    }
  }
`
