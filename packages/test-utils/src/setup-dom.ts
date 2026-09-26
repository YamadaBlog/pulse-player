import { afterEach, beforeEach } from 'vitest'
import {
  FakeAudio,
  installAudioContextStub,
  installManualRaf,
  installResizeObserverStub,
} from './index'

// Shared setup for every renderer / wrapper suite: a fresh fake media
// stack per test and a clean document.
beforeEach(() => {
  FakeAudio.reset()
  installAudioContextStub()
  installManualRaf()
  installResizeObserverStub()
})

afterEach(() => {
  document.body.innerHTML = ''
  try {
    localStorage.clear()
  } catch {
    /* storage unavailable */
  }
})
