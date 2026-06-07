# Events & telemetry

[← back to README](../README.md)

`pulse-player` ships with a small, opt-in event bus on the audio store. **Default behaviour: zero listeners, zero side effects, zero network.** Integrators wire what they need.

## Design

- **No third-party tracking.** The library never opens a socket, never loads an analytics SDK, never reads identifiers off `navigator`.
- **Opt-in.** Listeners are registered by you. If nothing subscribes, the dispatch is one `Map.get()` per emit — effectively free.
- **Crash-safe.** A listener that throws is logged via `console.error` and never breaks the store.
- **Per-session counters in plain refs.** `playCount`, `pauseCount`, `trackChangeCount` are Vue refs you can read and reset. They live in memory only — no persistence, no leakage across sessions.

## The events

| Event           | When it fires                                                                                                       | Payload                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `'play'`        | After `audio.play()` is called (so just after the user gesture or after `toggle()` resumes from pause).             | `{ track: Track, time: number }`             |
| `'pause'`       | After `audio.pause()` is called.                                                                                    | `{ track: Track, time: number }`             |
| `'trackchange'` | After `loadTrack(i)` changes the index (or `next()` / `prev()` lands on a different track). No-op moves don't fire. | `{ from: number, to: number, track: Track }` |

## Subscribing

```ts
import { useAudioStore } from 'pulse-player'

const store = useAudioStore()

const off = store.subscribe('play', ({ track, time }) => {
  console.log('played', track.title, 'at', time, 's')
})

// later
off() // unsubscribe — the listener stops firing
```

`subscribe` returns an unsubscribe function. Wire it into `onScopeDispose` / `onBeforeUnmount` if you're calling from inside a Vue component:

```ts
import { onBeforeUnmount } from 'vue'

const off = store.subscribe('trackchange', ({ to, track }) => {
  myAnalytics.send({ event: 'track', index: to, title: track.title })
})
onBeforeUnmount(off)
```

## Counters

`playCount`, `pauseCount` and `trackChangeCount` are exposed as reactive refs:

```ts
const store = useAudioStore()

console.log(store.playCount.value) // → 0 on first read

// later, after the user plays a few tracks:
console.log(store.playCount.value) // → 3
console.log(store.pauseCount.value) // → 2
console.log(store.trackChangeCount.value) // → 4
```

Reset them by assigning `.value = 0` — they're plain `ref`s, no fancy machinery.

## Wire-up examples

### Send to your own backend

```ts
const store = useAudioStore()

store.subscribe('play', ({ track, time }) => {
  fetch('/api/telemetry/play', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ track: track.title, time, at: Date.now() }),
  })
})
```

### Display a "you've played N tracks today" badge

```vue
<script setup>
import { useAudioStore } from 'pulse-player'
const store = useAudioStore()
</script>

<template>
  <span v-if="store.playCount > 0">{{ store.playCount }} plays</span>
</template>
```

### Persist across reloads (your choice, not ours)

```ts
import { watch } from 'vue'

const KEY = 'pulse-listens'
store.playCount.value = Number(localStorage.getItem(KEY) || 0)
watch(
  () => store.playCount.value,
  (n) => {
    localStorage.setItem(KEY, String(n))
  },
)
```

## What's NOT shipped

We deliberately don't ship:

- Session IDs, device fingerprints, or anything resembling a user identifier.
- Network calls in the default code path.
- A consent banner. You're integrating into your own product — bring your own privacy posture.

If you need any of these, layer them in your integration code. The event bus + counters give you the surface; the policy is up to you.

## Related

- Demo tour state is reactive on `useDemoTour()` — `isRunning`, `isPaused`, `currentStep`, `title`, `message`, `progress`. Watch them directly; no separate event bus.
- The standard Vue reactivity is always available — `watch(() => store.isPlaying, …)` works fine if you don't need event payloads.
