import { css, unsafeCSS } from 'lit'
import { baseCss, variantsCss } from '@pulse/tokens'

/**
 * Shared CSS for the Web Component layer.
 *
 * Mirrors the validated v2.3.4 base chrome (mp/mp__art/mp__title/
 * mp__progress).
 *
 * BOTH the `--pulse-scale` system tokens (base.ts) AND the variant
 * gradient / accent RGB triplets (variants.ts) now come from
 * `@pulse/tokens` (single source of truth). The previous version
 * inlined the base tokens in a local TOKENS string — that worked but
 * meant adding a new token required edits in two places. Closes
 * audit item P2 from v3.0.0-alpha.5.
 *
 * The inner `<div class="mp" data-variant=${variant}>` rendered by
 * each Custom Element triggers the `[data-variant='X']` selectors
 * declared in the tokens, so the SAME gradients land in both the
 * document (Vue v2.3.4 chrome) and the Shadow DOM — no duplication,
 * no drift.
 */
const BASE_TOKENS = unsafeCSS(baseCss)

// Variant gradients + accent RGB triplets, imported from @pulse/tokens.
// Selectors are `[data-variant='X']` (no host prefix); they match the
// inner <div class="mp" data-variant=${variant}> rendered by each
// element, and CSS custom properties cascade down to the chrome.
const VARIANT_TOKENS = unsafeCSS(variantsCss)

export const baseStyles = css`
  ${BASE_TOKENS}
  ${VARIANT_TOKENS}

  :host {
    display: block;
    color: #f5f5f7;
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      'Helvetica Neue',
      Arial,
      sans-serif;
  }
`

export const playerStyles = css`
  .mp {
    display: grid;
    grid-template-columns: var(--pulse-art) 1fr;
    gap: var(--pulse-gap);
    padding: var(--pulse-pad);
    border-radius: var(--pulse-radius);
    background: var(--variant-bg-gradient, linear-gradient(135deg, #1a1a2e 0%, #16213e 100%));
    box-shadow: inset 0 0 0 1px rgb(var(--variant-accent-rgb) / 0.18);
    transition:
      max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
      background 0.3s ease,
      box-shadow 0.3s ease;
  }

  .mp__art {
    width: var(--pulse-art);
    height: var(--pulse-art);
    border-radius: calc(var(--pulse-radius) * 0.65);
    background-size: cover;
    background-position: 50% 50%;
    cursor: pointer;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mp__body {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
  }

  .mp__title {
    font-size: var(--pulse-title);
    font-weight: 600;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mp__controls {
    display: flex;
    align-items: center;
    gap: calc(var(--pulse-gap) * 0.5);
  }

  .mp__btn {
    width: var(--pulse-btn);
    height: var(--pulse-btn);
    border-radius: 50%;
    border: 0;
    background: rgba(255, 255, 255, 0.08);
    color: inherit;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition:
      background 0.2s ease,
      transform 0.15s ease;
  }
  .mp__btn:hover {
    background: rgba(255, 255, 255, 0.14);
  }
  .mp__btn:active {
    transform: scale(0.96);
  }
  .mp__btn:focus-visible {
    outline: 2px solid rgb(var(--pulse-accent-rgb));
    outline-offset: 2px;
  }

  .mp__progress {
    height: var(--pulse-progress-h);
    background: rgba(255, 255, 255, 0.12);
    border-radius: 999px;
    overflow: hidden;
    cursor: pointer;
  }
  .mp__progress-fill {
    height: 100%;
    background: var(--pulse-accent);
    width: var(--progress, 0%);
    transition: width 0.1s linear;
  }

  .mp__time {
    font-size: var(--pulse-subtitle);
    opacity: 0.7;
    font-variant-numeric: tabular-nums;
  }

  /* ─── Eyebrow / NOW PLAYING ──────────────────────────────── */
  .mp__eyebrow {
    font-size: var(--pulse-eyebrow, 9px);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    opacity: 0.55;
    margin: 0 0 calc(var(--pulse-gap) * 0.25) 0;
  }

  /* ─── Ghost (prev / next) buttons ─────────────────────────── */
  .mp__btn--ghost {
    background: transparent;
    width: calc(var(--pulse-btn) * 0.75);
    height: calc(var(--pulse-btn) * 0.75);
    opacity: 0.7;
  }
  .mp__btn--ghost:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.08);
  }

  /* ─── Social icons (GitHub / Spotify) ─────────────────────── */
  .mp__icons {
    display: inline-flex;
    gap: calc(var(--pulse-gap) * 0.4);
    margin-left: auto;
    align-items: center;
  }
  .mp__icon {
    font-size: var(--pulse-icon-sm, 16px);
    opacity: 0.55;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }
  .mp__icon:hover {
    opacity: 1;
  }

  /* ─── Three responsive states ──────────────────────────────
     Driven by [data-size] attribute set in render() from the
     ResizeObserver tick. Mirrors the v2.3.4 thresholds:
       narrow   < 220 px : eyebrow + social icons hide
       compact  < 130 px : prev/next + time hide
       fab      < 110 px : only art + play button remain. */
  .mp[data-size='narrow'] .mp__eyebrow,
  .mp[data-size='narrow'] .mp__icons,
  .mp[data-size='compact'] .mp__eyebrow,
  .mp[data-size='compact'] .mp__icons,
  .mp[data-size='fab'] .mp__eyebrow,
  .mp[data-size='fab'] .mp__icons {
    display: none;
  }
  .mp[data-size='compact'] .mp__btn--ghost,
  .mp[data-size='compact'] .mp__time,
  .mp[data-size='fab'] .mp__btn--ghost,
  .mp[data-size='fab'] .mp__time {
    display: none;
  }
  .mp[data-size='fab'] .mp__title,
  .mp[data-size='fab'] .mp__progress {
    display: none;
  }
  .mp[data-size='fab'] {
    grid-template-columns: 1fr;
    padding: 0;
    border-radius: 50%;
    aspect-ratio: 1 / 1;
  }
  .mp[data-size='fab'] .mp__art {
    border-radius: 50%;
    width: 100%;
    height: 100%;
  }
  .mp[data-size='fab'] .mp__body {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.35);
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .mp[data-size='fab']:hover .mp__body {
    opacity: 1;
  }
  .mp[data-size='fab'] .mp__controls {
    display: flex;
    justify-content: center;
  }

  /* ─── Ambient EQ — pure CSS, 0 JS / frame ───────────────────
     12 bars layered behind the chrome. Staggered animation-delay
     gives the impression of a moving wave under the audio without
     touching the FFT analyser. Toggled on via the ambient-eq
     attribute on the host. */
  .mp__ambient {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    pointer-events: none;
    padding: 0 12%;
    opacity: 0;
    transition: opacity 0.4s ease;
    z-index: 0;
  }
  :host([ambient-eq]) .mp__ambient {
    opacity: 0.28;
  }
  .mp__ambient-bar {
    width: 3px;
    height: calc(var(--pulse-art) * 0.42);
    border-radius: 999px;
    background: var(--pulse-accent);
    transform-origin: center;
    transform: scaleY(0.16);
    animation: mp-ambient-wave 1600ms ease-in-out infinite;
  }
  .mp__ambient-bar:nth-child(1) { animation-delay: 0ms; }
  .mp__ambient-bar:nth-child(2) { animation-delay: 80ms; }
  .mp__ambient-bar:nth-child(3) { animation-delay: 160ms; }
  .mp__ambient-bar:nth-child(4) { animation-delay: 240ms; }
  .mp__ambient-bar:nth-child(5) { animation-delay: 320ms; }
  .mp__ambient-bar:nth-child(6) { animation-delay: 400ms; }
  .mp__ambient-bar:nth-child(7) { animation-delay: 480ms; }
  .mp__ambient-bar:nth-child(8) { animation-delay: 400ms; }
  .mp__ambient-bar:nth-child(9) { animation-delay: 320ms; }
  .mp__ambient-bar:nth-child(10) { animation-delay: 240ms; }
  .mp__ambient-bar:nth-child(11) { animation-delay: 160ms; }
  .mp__ambient-bar:nth-child(12) { animation-delay: 80ms; }

  .mp {
    position: relative;
    overflow: hidden;
  }
  .mp__body, .mp__art {
    position: relative;
    z-index: 1;
  }

  @keyframes mp-ambient-wave {
    0%, 100% { transform: scaleY(0.16); }
    50%      { transform: scaleY(0.72); }
  }

  @media (prefers-reduced-motion: reduce) {
    .mp,
    .mp__art,
    .mp__btn,
    .mp__progress-fill,
    .mp__ambient-bar {
      transition: none !important;
      animation: none !important;
    }
  }
`

export const fabStyles = css`
  :host {
    display: inline-block;
  }
  .fab {
    --fab-size: 56px;
    position: relative;
    width: var(--fab-size);
    height: var(--fab-size);
    border-radius: 50%;
    border: 0;
    background: var(--variant-bg-gradient, linear-gradient(135deg, #1a1a2e 0%, #16213e 100%));
    color: #fff;
    cursor: pointer;
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgb(var(--variant-accent-rgb, 255, 255, 255) / 0.25);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease;
  }
  .fab:hover {
    transform: translateY(-2px);
  }
  .fab:active {
    transform: translateY(0);
  }
  .fab:focus-visible {
    outline: 2px solid rgb(var(--pulse-accent-rgb));
    outline-offset: 2px;
  }
  .fab--playing {
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgb(var(--variant-accent-rgb, 255, 255, 255) / 0.4),
      0 0 28px rgb(var(--variant-accent-rgb, 255, 255, 255) / 0.25);
  }

  /* ─── Pulso heartbeat — lub-dub-rest ────────────────────────
     Cycle map (5 s):
       0 %  →  6 %  : compress to the lub peak (300 ms)
       6 %          : lub wave EMERGES at opacity 0.45
       6 % → 20 %   : lub wave expands to scale 1.6, fades (700 ms)
       20 %         : dub wave emerges
       20 % → 34 %  : dub wave expands, fades (700 ms)
       34 % → 100 % : rest (3.3 s)
     Waves fire AT the peak, not before — preserves cause/effect feel. */
  .fab--pulso {
    animation: pulso-heartbeat 5s ease-in-out infinite;
  }

  .fab--pulso::before,
  .fab--pulso::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--fab-size);
    height: var(--fab-size);
    margin-top: calc(var(--fab-size) / -2);
    margin-left: calc(var(--fab-size) / -2);
    box-sizing: border-box;
    border-radius: 50%;
    border: 1.5px solid rgba(255, 255, 255, 0.85);
    pointer-events: none;
    opacity: 0;
    z-index: 1;
    animation: pulso-wave-lub 5s ease-out infinite;
  }
  .fab--pulso::after {
    animation-name: pulso-wave-dub;
  }

  @keyframes pulso-heartbeat {
    0%   { transform: scale(1); }
    6%   { transform: scale(1.05); }
    12%  { transform: scale(1); }
    20%  { transform: scale(1.05); }
    26%  { transform: scale(1); }
    100% { transform: scale(1); }
  }
  @keyframes pulso-wave-lub {
    0%, 5%  { transform: scale(1); opacity: 0; }
    6%      { transform: scale(1); opacity: 0.45; }
    20%     { transform: scale(1.6); opacity: 0; }
    100%    { transform: scale(1.6); opacity: 0; }
  }
  @keyframes pulso-wave-dub {
    0%, 19% { transform: scale(1); opacity: 0; }
    20%     { transform: scale(1); opacity: 0.45; }
    34%     { transform: scale(1.6); opacity: 0; }
    100%    { transform: scale(1.6); opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .fab,
    .fab--pulso,
    .fab--pulso::before,
    .fab--pulso::after {
      animation: none !important;
      transition: none !important;
    }
  }
`
