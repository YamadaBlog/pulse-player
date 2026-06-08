/**
 * Vitest mock for `expo-av` Audio.Sound.
 *
 * Used by PulseEngineRN unit tests to exercise the state machine
 * without booting React Native or expo's native bridge.
 */

type StatusListener = (status: {
  isLoaded: boolean
  isPlaying: boolean
  positionMillis: number
  durationMillis: number
  didJustFinish: boolean
  isLooping: boolean
  error?: string
}) => void

class MockSound {
  private listener: StatusListener | null = null
  private isPlaying = false
  private position = 0
  private duration = 30_000

  setStatusListener(cb: StatusListener) {
    this.listener = cb
  }

  async playAsync() {
    this.isPlaying = true
    this.emit()
  }

  async pauseAsync() {
    this.isPlaying = false
    this.emit()
  }

  async setPositionAsync(ms: number) {
    this.position = ms
    this.emit()
  }

  async unloadAsync() {
    this.listener = null
  }

  private emit() {
    this.listener?.({
      isLoaded: true,
      isPlaying: this.isPlaying,
      positionMillis: this.position,
      durationMillis: this.duration,
      didJustFinish: false,
      isLooping: false,
    })
  }
}

export const Audio = {
  Sound: {
    createAsync: async (
      _src: { uri: string },
      _opts: { shouldPlay: boolean },
      onStatus: StatusListener,
    ) => {
      const sound = new MockSound()
      sound.setStatusListener(onStatus)
      return { sound }
    },
  },
}

export type AVPlaybackStatus = ReturnType<typeof Object> // structural placeholder
