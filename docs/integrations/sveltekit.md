# SvelteKit

```bash
npm i @pulse-music/svelte
```

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '@pulse-music/svelte' // registers the elements (safe during SSR)
  let { children } = $props()
</script>

{@render children()}
<pulse-fab pulso></pulse-fab>
```

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { usePulseAudio, type Track } from '@pulse-music/svelte'

  const tracks: Track[] = [{ title: 'Projector Screen', artist: 'HoliznaCC0', src: '/audio/projector-screen.mp3' }]
  const audio = usePulseAudio()
</script>

<pulse-player {tracks} variant="sunset" ambient-eq></pulse-player>
<p>{$audio.isPlaying ? `Playing ${$audio.track?.title}` : 'Paused'}</p>
```

Static files in `static/` are served from your origin, which keeps the real spectrum and cover-sampled accents working without CORS.
