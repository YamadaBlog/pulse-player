<script lang="ts">
  import { ALL_VARIANTS, usePulseAudio, type PulseVariant } from '@pulse-music/svelte'
  import { demoTracks } from '../../shared-tracks'

  const audio = usePulseAudio()
  audio.setTracks(demoTracks())
  let variant: PulseVariant = $state('auto')
</script>

<main>
  <h1>Pulse × Svelte</h1>
  <div class="picker" role="group" aria-label="Theme">
    {#each ALL_VARIANTS.filter((v) => v !== 'custom') as v (v)}
      <button aria-pressed={variant === v} onclick={() => (variant = v)}>{v}</button>
    {/each}
  </div>

  <!-- Svelte renders Custom Elements natively and sets their properties. -->
  <pulse-player {variant} ambient-eq></pulse-player>

  <p class="status">
    <button onclick={audio.toggle}>{$audio.isPlaying ? 'Pause' : 'Play'}</button>
    {$audio.track?.title} · {audio.fmt($audio.currentTime)} / {audio.fmt($audio.duration)}
  </p>

  <pulse-fab {variant} pulso></pulse-fab>
</main>
