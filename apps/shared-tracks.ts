import type { Track } from '@pulse-music/types'

/** The demo playlist, shared by every example app (media lives in apps/site/public). */
export const demoTracks = (base = '/'): Track[] => [
  {
    title: 'Protofunk',
    artist: 'Kevin MacLeod',
    src: `${base}audio/protofunk.mp3`,
    cover: `${base}audio/protofunk.svg`,
  },
  {
    title: 'Lobby Time',
    artist: 'Kevin MacLeod',
    src: `${base}audio/lobby-time.mp3`,
    cover: `${base}audio/lobby-time.svg`,
  },
  {
    title: 'Deuces',
    artist: 'Kevin MacLeod',
    src: `${base}audio/deuces.mp3`,
    cover: `${base}audio/deuces.svg`,
  },
]
