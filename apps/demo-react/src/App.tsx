import { useState } from 'react'
import {
  ALL_VARIANTS,
  PulseFab,
  PulsePlayer,
  usePulseAudio,
  type PulseVariant,
} from '@pulse-music/react'
import { demoTracks } from '../../shared-tracks'

const tracks = demoTracks()

export function App() {
  const [variant, setVariant] = useState<PulseVariant>('auto')
  const [events, setEvents] = useState<string[]>([])
  const { isPlaying, track, currentTime, duration, fmt, toggle } = usePulseAudio()
  const log = (line: string) => setEvents((prev) => [line, ...prev].slice(0, 6))

  return (
    <main>
      <h1>Pulse × React</h1>
      <div className="picker" role="group" aria-label="Theme">
        {ALL_VARIANTS.filter((v) => v !== 'custom').map((v) => (
          <button key={v} aria-pressed={variant === v} onClick={() => setVariant(v)}>
            {v}
          </button>
        ))}
      </div>

      <PulsePlayer
        variant={variant}
        tracks={tracks}
        ambientEq
        onPlay={({ track }) => log(`play · ${track.title}`)}
        onPause={({ time }) => log(`pause · ${fmt(time)}`)}
        onTrackChange={({ track }) => log(`track · ${track.title}`)}
      />

      <p className="status">
        {/* Any component can read the shared session through the hook. */}
        <button onClick={toggle}>{isPlaying ? 'Pause' : 'Play'}</button> {track?.title} ·{' '}
        {fmt(currentTime)} / {fmt(duration)}
      </p>
      <ul className="log" aria-live="polite">
        {events.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>

      <PulseFab variant={variant} pulso />
    </main>
  )
}
