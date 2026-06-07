# Pulse in Next.js 14+ (App Router)

The Next.js App Router defaults to **React Server Components**. Pulse renders a Web Component and needs the browser to be present — it has to be a **client component** (`"use client"`).

## Install

```bash
npm install @pulse/react @pulse/core
```

Both packages are listed because `@pulse/react` declares `@pulse/core` as a peer in its tarball — npm will install them together once they're on the registry.

## The client component

`app/components/MusicPlayer.tsx`:

```tsx
'use client'

import { PulsePlayer, PulseFab, usePulseAudio } from '@pulse/react'
import type { Track } from '@pulse/react'

// Optional — replace the bundled demo playlist with your own URLs.
const tracks: Track[] = [
  {
    title: 'Ambient Test',
    artist: 'You',
    src: '/audio/ambient-test.webm',
    cover: '/covers/ambient-test.webp',
  },
]

export function MusicPlayer() {
  const { isPlaying, track, toggle } = usePulseAudio()

  return (
    <>
      <PulsePlayer
        variant="midnight"
        ambientEq
        resizable
        tracks={tracks}
        onPlay={({ track, time }) => {
          // Wire your analytics here.
          console.log('play', track.title, time)
        }}
      />
      <PulseFab variant="vinyl" pulso draggable showMenu />
      {/* If you want a server-rendered now-playing label too: */}
      <p suppressHydrationWarning>
        {isPlaying ? '▶' : '⏸'} {track.title}
      </p>
    </>
  )
}
```

The `suppressHydrationWarning` on the `<p>` matches Next.js's expectation that the initial server-rendered text might differ from the first client-rendered text — without it, you'd get a `Text content did not match` warning on the first toggle.

## Use it from a page

`app/page.tsx`:

```tsx
import { MusicPlayer } from './components/MusicPlayer'

export default function Page() {
  return (
    <main>
      <h1>My site</h1>
      <MusicPlayer />
    </main>
  )
}
```

`Page` stays a Server Component (no `"use client"`). The `MusicPlayer` import is a client component, so Next.js automatically code-splits it and ships only the client bundle to the browser.

## The SSR gotcha

`@pulse/react` internally renders `<pulse-player>` Custom Element + sets a few imperative properties via `ref`. The Custom Element registry doesn't exist on the Node.js server, so calling `customElements.define()` there is a no-op. The package handles this — it doesn't crash — but the host element does render as a bare unknown tag during SSR.

If you see `Hydration mismatch: server rendered <pulse-player>, client expected <pulse-player>` (which is fine — both render the same tag), suppress with:

```tsx
<PulsePlayer suppressHydrationWarning {...props} />
```

The Pulse team is tracking a future patch to emit a stable placeholder on SSR so the suppression isn't needed.

## Dynamic import (SSR-off mode)

If you'd rather skip SSR entirely for the Pulse subtree:

```tsx
'use client'
import dynamic from 'next/dynamic'

const MusicPlayer = dynamic(
  () => import('./MusicPlayer').then((mod) => mod.MusicPlayer),
  { ssr: false },
)

export default function Page() {
  return <MusicPlayer />
}
```

This adds one network round-trip to fetch the component bundle after hydration but eliminates every hydration warning.

## Tested against

- Next.js 14.x (App Router)
- Next.js 15.x (App Router)
- Node 20 + 22
- React 18.3 + React 19

## What this snippet doesn't cover

- Audio playback during route transitions (the engine is a singleton — playback survives a `<Link>` navigation automatically).
- Per-route variant theming (combine the `variant` prop with Next.js's `useSelectedLayoutSegment()` to swap themes per route).
- Server-side analytics for `onPlay` events (capture the event on the client and POST to your `/api/analytics` route).

For those, see the canonical [`docs/universal/API.md`](../../docs/universal/API.md).
