# Next.js (App Router)

```bash
npm i @pulse-music/react
```

Custom Elements render on the client, so keep the players in a client component. Importing the package on the server is safe — it never touches the DOM at module load.

```tsx
// app/components/Player.tsx
'use client'

import { PulsePlayer, PulseFab, type Track } from '@pulse-music/react'

const tracks: Track[] = [
  {
    title: 'Protofunk',
    artist: 'Kevin MacLeod',
    src: '/audio/protofunk.mp3',
    cover: '/audio/protofunk.jpg',
  },
]

export function Player() {
  return <PulsePlayer tracks={tracks} variant="midnight" ambientEq />
}

export function FloatingPlayer() {
  return <PulseFab pulso />
}
```

```tsx
// app/layout.tsx — mount the floating player once: it survives client-side navigation
import { FloatingPlayer } from './components/Player'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <FloatingPlayer />
      </body>
    </html>
  )
}
```

Put audio and covers in `public/` (same origin) to get the real spectrum and cover-sampled accents without CORS configuration.

To avoid layout shift before hydration:

```css
pulse-player:not(:defined) {
  display: block;
  min-height: 132px;
}
```
