import { useEffect, useState } from 'react'
import { PulsePlayer, PulseFab, usePulseAudio, ALL_VARIANTS, type PulseVariant } from '@pulse-music/react'

/**
 * React demo for @pulse-music/react — proves the wrapper works in a real
 * React app, not just under vitest. Variant picker switches the
 * `variant` prop on both `<PulsePlayer />` and `<PulseFab />`,
 * `usePulseAudio()` drives a live transport row, and every
 * forwarded event is logged.
 *
 * Run:  npm install --workspace=@pulse-music/demo-react && npm run dev --workspace=@pulse-music/demo-react
 *       → http://localhost:5181
 */
export function App() {
  const [variant, setVariant] = useState<PulseVariant>('auto')
  const [log, setLog] = useState<string[]>([])
  const { isPlaying, track, currentTime, duration, fmt, toggle, next, prev } = usePulseAudio()

  function append(line: string) {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${line}`, ...prev].slice(0, 40))
  }

  useEffect(() => {
    append('React mounted — variant=' + variant)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <h1>Pulse — React demo</h1>

      <div className="picker" role="group" aria-label="Theme variant">
        {ALL_VARIANTS.filter((v) => v !== 'custom').map((v) => (
          <button
            key={v}
            data-variant={v}
            aria-pressed={variant === v}
            onClick={() => setVariant(v)}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="stage">
        <PulsePlayer
          variant={variant}
          onPlay={({ track, time }) => append(`onPlay → ${track.title} @ ${fmt(time)}`)}
          onPause={({ track, time }) => append(`onPause → ${track.title} @ ${fmt(time)}`)}
          onTrackChange={({ from, to, track }) =>
            append(`onTrackChange → ${from} → ${to} (${track.title})`)
          }
          onError={({ reason }) => append(`onError → ${reason}`)}
        />
      </div>

      <div className="controls">
        <button onClick={prev}>⏮ Prev</button>
        <button onClick={toggle}>{isPlaying ? '⏸ Pause' : '▶ Play'}</button>
        <button onClick={next}>Next ⏭</button>
        <span className="stat">
          {fmt(currentTime)} / {fmt(duration)} · {track.title}
        </span>
      </div>

      <PulseFab variant={variant} pulso />

      <div className="log" aria-live="polite">
        {log.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </>
  )
}
