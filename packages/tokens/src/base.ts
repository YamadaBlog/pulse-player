/**
 * Base tokens as a TypeScript string — for Shadow DOM consumers
 * (every `@pulse/web-component` Custom Element).
 *
 * The `[data-pulse-root]` selector used in `base.css` is the right
 * shape for document-level consumers (Vue v2.3.4 chrome) but doesn't
 * match anything in a Shadow DOM. The string below uses `:host` so
 * it can be folded into a Lit `static styles` block. Same token
 * values, same `--pulse-scale` system, different selector.
 *
 * Both files (`base.css` and `base.ts`) stay in sync because they're
 * both derived from the v2.3.4 reference — there's no automated
 * sync; touch both when adding a new token. Acceptable cost given
 * the file is ~30 lines total.
 */
export const baseCss = `
:host {
  --pulse-scale: 1;
  --pulse-scale-min: 0.3;
  --pulse-scale-max: 1.3;

  --pulse-art: calc(140px * var(--pulse-scale));
  --pulse-title: calc(16px * var(--pulse-scale));
  --pulse-subtitle: calc(11px * var(--pulse-scale));
  --pulse-eyebrow: calc(9px * var(--pulse-scale));
  --pulse-icon: calc(20px * var(--pulse-scale));
  --pulse-icon-sm: calc(16px * var(--pulse-scale));
  --pulse-btn: calc(36px * var(--pulse-scale));
  --pulse-pad: calc(14px * var(--pulse-scale));
  --pulse-gap: calc(12px * var(--pulse-scale));
  --pulse-radius: calc(16px * var(--pulse-scale));
  --pulse-bar-h: calc(28px * var(--pulse-scale));
  --pulse-bar-w: calc(3px * var(--pulse-scale));
  --pulse-progress-h: calc(3px * var(--pulse-scale));

  --pulse-shadow-soft: 0 calc(8px * var(--pulse-scale)) calc(24px * var(--pulse-scale))
    rgba(0, 0, 0, 0.18);
  --pulse-shadow-strong: 0 calc(16px * var(--pulse-scale)) calc(40px * var(--pulse-scale))
    rgba(0, 0, 0, 0.28);

  --pulse-accent: #3dbda7;
  --pulse-accent-rgb: 61, 189, 167;
}
`
