# @pulse-music/svelte

Svelte 4 / 5 bindings for [Pulse](https://github.com/YamadaBlog/pulse-player). Svelte renders Custom Elements natively, so this package registers `<pulse-player>` / `<pulse-fab>` and adds `usePulseAudio()`, a readable store over the audio session.

```bash
npm i @pulse-music/svelte
```

```svelte
<script lang="ts">
  import { usePulseAudio } from '@pulse-music/svelte'

  const tracks = [{ title: 'Projector Screen', artist: 'HoliznaCC0', src: '/projector-screen.mp3' }]
  const audio = usePulseAudio()
</script>

<pulse-player {tracks} variant="sunset" ambient-eq></pulse-player>
<button on:click={audio.toggle}>{$audio.isPlaying ? 'Pause' : 'Play'} {$audio.track?.title}</button>
<pulse-fab pulso></pulse-fab>
```

**Docs:** [Svelte guide](https://github.com/YamadaBlog/pulse-player/blob/main/docs/frameworks.md#svelte) · [element reference](https://github.com/YamadaBlog/pulse-player/blob/main/docs/reference/elements.md)

MIT © YamadaBlog
