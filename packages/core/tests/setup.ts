import { beforeEach } from 'vitest'
import { FakeAudio, installAudioContextStub, installManualRaf } from '@pulse-music/test-utils'

beforeEach(() => {
  FakeAudio.reset()
  installAudioContextStub()
  installManualRaf()
})
