import type { Track } from '@pulse-music/types'

/** The demo playlist, shared by every example app (media lives in apps/site/public). */
export const demoTracks = (base = '/'): Track[] => [
  {
    title: 'Projector Screen',
    artist: 'HoliznaCC0',
    src: `${base}audio/projector-screen.mp3`,
    cover: `${base}audio/projector-screen.webp`,
  },
  {
    title: 'Warm Fuzz',
    artist: 'HoliznaCC0',
    src: `${base}audio/warm-fuzz.mp3`,
    cover: `${base}audio/warm-fuzz.webp`,
  },
  {
    title: 'Summer Break',
    artist: 'HoliznaCC0',
    src: `${base}audio/summer-break.mp3`,
    cover: `${base}audio/summer-break.webp`,
  },
]
