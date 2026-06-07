# Pulse for Svelte (`@pulse/svelte`)

Svelte 5 wrapper. Components + runes-based store on top of `@pulse/web-component`.

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
