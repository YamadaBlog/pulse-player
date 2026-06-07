# @pulse/tokens

CSS design tokens for pulse-player. Shared by every web renderer.

## What's in here

- `variants.css` — the 4 mood gradients (sunset, midnight, aurora, vinyl) + accent RGB triplets, declared at the `[data-variant='X']` attribute level
- `base.css` — base palette, `--pulse-scale` system, shadow tokens
- `animations.css` — shared `@keyframes` (ambient EQ wave, pulso heartbeat, pulso lub/dub waves)

## Import

```css
/* Everything */
@import '@pulse/tokens';

/* Or pick what you need */
@import '@pulse/tokens/variants.css';
@import '@pulse/tokens/animations.css';
```

`sideEffects: ["**/*.css"]` is set, so tree-shaking-aware bundlers preserve the styles when only one consumer imports the package.

## Status

⏳ **Scaffold** — the actual tokens are extracted from the validated Vue v2.3.4 in v3.0.0-alpha.1. The shapes (file layout, `[data-variant]` selectors, variable naming) are stable.

## License

MIT.
