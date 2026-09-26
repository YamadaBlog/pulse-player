# @pulse-music/tokens

Design tokens for [Pulse](https://github.com/YamadaBlog/pulse-player): the nine theme variants and the spring motion curves, as typed data plus CSS generators.

```bash
npm i @pulse-music/tokens
```

```ts
import { VARIANTS, EASING, createVariantCss, createMotionCss } from '@pulse-music/tokens'

VARIANTS.midnight.accent // '#a78bfa'
EASING.pop // a damped spring sampled into a CSS linear() easing

// Match your own UI to the player's motion:
document.head.append(
  Object.assign(document.createElement('style'), { textContent: createMotionCss(':root') }),
)
```

The Web Components consume these tokens; the React Native renderer reads the same data.

MIT © YamadaBlog
