# Customization

[← back to README](../README.md)

## Background variants

Pass the `variant` prop to switch the visual preset. Pass `accentColor` to retune the EQ bars + progress hue locally.

<table>
  <tr>
    <td align="center" width="50%">
      <img src="./screenshots/variant-vinyl.png" width="100%" alt="vinyl variant" />
      <br><sub><strong>Vinyl</strong> · <code>variant="vinyl"</code></sub>
    </td>
    <td align="center" width="50%">
      <img src="./screenshots/variant-sunset.png" width="100%" alt="sunset variant" />
      <br><sub><strong>Sunset</strong> · <code>variant="sunset"</code></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="./screenshots/variant-midnight.png" width="100%" alt="midnight variant" />
      <br><sub><strong>Midnight</strong> · <code>variant="midnight"</code></sub>
    </td>
    <td align="center">
      <img src="./screenshots/variant-aurora.png" width="100%" alt="aurora variant" />
      <br><sub><strong>Aurora</strong> · <code>variant="aurora"</code></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="./screenshots/variant-light.png" width="100%" alt="light variant" />
      <br><sub><strong>Light</strong> · <code>variant="light"</code></sub>
    </td>
    <td align="center" valign="middle">
      Also available:<br/><br/>
      • <code>auto</code> — live cover-art blur (default)<br/>
      • <code>transparent</code> — frameless<br/>
      • <code>dark</code> — neutral dark surface<br/>
      • <code>solid</code> — your <code>--pulse-bg</code><br/>
      • <code>custom</code> — your <code>customBackground</code> CSS
    </td>
  </tr>
</table>

## Global theming via CSS variables

```css
:root {
  --pulse-accent: #ff3da8; /* EQ bars, progress ring, scrub hover, focus */
  --pulse-bg: #0e0e14; /* `solid` variant background */
}
```

Both components fall back to teal (`#3DBDA7`) when the variables are absent, so they work out of the box without theming work.

## Examples

```vue
<!-- Vinyl Dark — warm analog with gold accent -->
<MusicPlayer variant="vinyl" accent-color="#C8A97E" />

<!-- Midnight with a Spotify deep link -->
<MusicPlayer
  variant="midnight"
  accent-color="#8B5CF6"
  spotify-url="https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
/>

<!-- Fully custom background -->
<MusicPlayer
  variant="custom"
  :custom-background="'linear-gradient(135deg, #2c1610 0%, #4a2c1f 45%, #6b4226 100%)'"
  accent-color="#E8A87C"
/>

<!-- Transparent — sits over your own backdrop (matches the README hero) -->
<MusicPlayer variant="transparent" />

<!-- Sidebar widget — pinned compact, no icons -->
<MusicPlayer variant="dark" :size="0.75" hide-icons />

<!-- Bigger FAB, pinned higher -->
<MiniPlayer variant="aurora" :size="72" :offset="{ bottom: 56, right: 24 }" />

<!-- User-resizable hero with the ambient EQ baked in -->
<MusicPlayer
  variant="midnight"
  accent-color="#8B5CF6"
  resizable
  :min-width="60"
  :max-width="720"
  ambient-eq
/>

<!-- Quiet inline player — no grain, no ambient EQ -->
<MusicPlayer variant="auto" :noise="false" :ambient-eq="false" />

<!-- FAB with heartbeat ripple and a custom localStorage key -->
<MiniPlayer variant="midnight" pulso persist-key="my-app-fab-pos" />
```

### Toggle the ambient EQ from anywhere

```ts
import { useAudioStore } from 'pulse-player'

const store = useAudioStore()
store.ambientEq = true // every <MusicPlayer /> without a local override lights up
```

A local `:ambient-eq="false"` prop on a specific instance opts that instance out, even when the global flag is on.

## Want a new variant?

Open `src/lib/MusicPlayer.vue`, find the `/* ─── Variants ─── */` block, and add a `.mp[data-variant="yours"] { background: ...; }` rule. The variant type stays in `MusicPlayerVariant` if you want type safety — extend it in the same file.
