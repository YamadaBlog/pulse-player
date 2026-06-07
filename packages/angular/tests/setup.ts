import { beforeEach, vi } from 'vitest'
import { installAllStubs } from '@pulse-music/test-utils'

installAllStubs()

beforeEach(() => {
  vi.clearAllMocks()
})
