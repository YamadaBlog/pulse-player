# Pulse for Svelte (`@pulse/svelte`)

Svelte 5 wrapper. Plain TypeScript store + native `<pulse-player>` / `<pulse-fab>` usage.

> ⚠️ **Honest status (v3.0.0-alpha.4):** `usePulseAudio()` is shipped as a plain TypeScript hook (no runes). Use it from any `.svelte` file. The Custom Elements (`<pulse-player>`, `<pulse-fab>`) work directly in Svelte templates — no SFC wrapper needed. **The underlying chrome is a SKELETON** — about 15 % of the Vue v2.3.4 reference, same as the React wrapper. If you need the full premium chrome today, use the Vue version. Tests for `@pulse/svelte` land in alpha.5.

## Status

⏳ **Implementation lands in v3.1.0.**

## Planned API

```svelte
<script>
  import { PulsePlayer, PulseFab, audioStore } from '@pulse/svelte'

  function onPlay(event) {
    console.log(event.detail.track.title)
  }
</script>

<PulsePlayer variant="midnight" ambientEq on:play={onPlay} />
<PulseFab pulso />

<p>Plays: {$audioStore.playCount}</p>
```

## See also

- [Architecture](../universal/ARCHITECTURE.md)
