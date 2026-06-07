import { css, unsafeCSS } from 'lit'

/**
 * Shared CSS for the Web Component layer.
 *
 * Mirrors the validated v2.3.4 base chrome (mp/mp__art/mp__title/
 * mp__progress) — pixel-perfect parity is enforced by the Playwright
 * visual regression suite that lands alongside this package.
 *
 * The `[data-variant]` attribute selectors from `@pulse/tokens` cascade
 * into the Shadow DOM only when we explicitly forward them via the
 * `:host([variant='X'])` selector — see the per-variant rules below.
 *
 * NOTE: this is the v3.0.0-alpha.2 SKELETON. Full chrome parity with
 * v2.3.4 (ambient EQ, pulso heartbeat, FAB drag, drag-to-resize)
 * lands in subsequent alphas as we close visual regression gaps.
 */
const TOKENS = unsafeCSS(`
  :host {
    /* ─── Geometry ─────────────────────────────────────────── */
    --pulse-scale: 1;
    --pulse-art: calc(140px * var(--pulse-scale));
    --pulse-title: calc(16px * var(--pulse-scale));
    --pulse-subtitle: calc(11px * var(--pulse-scale));
    --pulse-icon: calc(20px * var(--pulse-scale));
    --pulse-btn: calc(36px * var(--pulse-scale));
    --pulse-pad: calc(14px * var(--pulse-scale));
    --pulse-gap: calc(12px * var(--pulse-scale));
    --pulse-radius: calc(16px * var(--pulse-scale));
    --pulse-progress-h: calc(3px * var(--pulse-scale));

    /* ─── Default accent (overridable via accent-color attribute) ── */
    --pulse-accent: #3dbda7;
    --pulse-accent-rgb: 61, 189, 167;
  }

  /* ─── Variant tokens — duplicated from @pulse/tokens because
       Shadow DOM doesn't inherit the document-level [data-variant]
       cascade by default. Each :host([variant='X']) sets the same
       --variant-bg-gradient + --variant-accent-rgb that the
       document-level tokens would. ──────────────────────────── */
  :host([variant='sunset']) {
    --variant-bg-gradient: linear-gradient(135deg, #1a1410 0%, #2d241c 50%, #4a3527 100%);
    --variant-accent-rgb: 245, 158, 11;
  }
  :host([variant='midnight']) {
    --variant-bg-gradient: linear-gradient(135deg, #0a0a18 0%, #14142a 50%, #1a1a3a 100%);
    --variant-accent-rgb: 139, 92, 246;
  }
  :host([variant='aurora']) {
    --variant-bg-gradient: linear-gradient(135deg, #061a1a 0%, #0a2e2e 40%, #103040 100%);
    --variant-accent-rgb: 6, 182, 212;
  }
  :host([variant='vinyl']) {
    --variant-bg-gradient:
      radial-gradient(ellipse at 30% 20%, rgba(200, 169, 126, 0.06) 0%, transparent 60%),
      linear-gradient(135deg, #030302 0%, #0a0907 50%, #1a1712 100%);
    --variant-accent-rgb: 200, 169, 126;
  }
  :host([variant='dark']) {
    --variant-bg-gradient: linear-gradient(135deg, #0e0e12 0%, #1a1a22 100%);
    --variant-accent-rgb: 255, 255, 255;
  }
  :host([variant='light']) {
    --variant-bg-gradient: #f4f4f7;
    --variant-accent-rgb: 20, 20, 26;
  }
  :host([variant='solid']) {
    --variant-bg-gradient: #14141a;
    --variant-accent-rgb: 255, 255, 255;
  }
  :host([variant='transparent']) {
    --variant-bg-gradient: transparent;
    --variant-accent-rgb: 255, 255, 255;
  }
`)

export const baseStyles = css`
  ${TOKENS}

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

  @media (prefers-reduced-motion: reduce) {
    .mp,
    .mp__art,
    .mp__btn,
    .mp__progress-fill {
      transition: none !important;
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
`
