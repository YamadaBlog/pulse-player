/** Every user-facing string, overridable through the `labels` property. */
export interface PulseLabels {
  player: string
  nowPlaying: string
  play: string
  pause: string
  previous: string
  next: string
  seek: string
  mute: string
  unmute: string
  loading: string
  error: string
  empty: string
  resize: string
  options: string
  close: string
  /** `{current}` and `{duration}` are replaced. */
  timeText: string
}

export const DEFAULT_LABELS: Readonly<PulseLabels> = Object.freeze({
  player: 'Music player',
  nowPlaying: 'Now playing',
  play: 'Play',
  pause: 'Pause',
  previous: 'Previous track',
  next: 'Next track',
  seek: 'Seek',
  mute: 'Mute',
  unmute: 'Unmute',
  loading: 'Loading…',
  error: "Couldn't play this track",
  empty: 'Nothing queued',
  resize: 'Resize player',
  options: 'Player options',
  close: 'Close player',
  timeText: '{current} of {duration}',
})

export function mergeLabels(overrides?: Partial<PulseLabels> | null): PulseLabels {
  return overrides ? { ...DEFAULT_LABELS, ...overrides } : DEFAULT_LABELS
}
