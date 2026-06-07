<script lang="ts">
  import { usePulseAudio, ALL_VARIANTS, type PulseVariant } from '@pulse-music/svelte'

  // Svelte 5 runes — the `usePulseAudio()` hook exposes a classic
  // store, so `$audio.isPlaying` auto-subscribes.
  const audio = usePulseAudio()
  let variant = $state<PulseVariant>('auto')
  let log = $state<string[]>([])

  function append(line: string) {
    log = [`[${new Date().toLocaleTimeString()}] ${line}`, ...log].slice(0, 40)
  }

  function onPlay(e: CustomEvent) {
    append(`pulse-play → ${e.detail.track.title}`)
  }
  function onPause(e: CustomEvent) {
    append(`pulse-pause → ${e.detail.track.title}`)
  }
  function onTrackChange(e: CustomEvent) {
    append(`pulse-trackchange → ${e.detail.from} → ${e.detail.to}`)
  }
</script>

<h1>Pulse — Svelte demo</h1>

<div class="picker" role="group" aria-label="Theme variant">
  {#each ALL_VARIANTS.filter((v) => v !== 'custom') as v}
    <button data-variant={v} aria-pressed={variant === v} onclick={() => (variant = v)}>
      {v}
    </button>
  {/each}
</div>

<div class="stage">
  <pulse-player
    variant={variant}
    ambient-eq
    onpulse-play={onPlay}
    onpulse-pause={onPause}
    onpulse-trackchange={onTrackChange}
  ></pulse-player>
</div>

<div class="controls">
  <button onclick={audio.prev}>⏮ Prev</button>
  <button onclick={audio.toggle}>{$audio.isPlaying ? '⏸ Pause' : '▶ Play'}</button>
  <button onclick={audio.next}>Next ⏭</button>
  <span class="stat">
    {audio.fmt($audio.currentTime)} / {audio.fmt($audio.duration)} · {$audio.track.title}
  </span>
</div>

<pulse-fab variant={variant} pulso></pulse-fab>

<div class="log" aria-live="polite">
  {#each log as line}
    <div>{line}</div>
  {/each}
</div>
