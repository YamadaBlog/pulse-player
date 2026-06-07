/**
 * Test bootstrap for @pulse-music/web-component — same stubs as @pulse-music/core
 * via @pulse-music/test-utils. Lit's reactive controllers work out of the
 * box under jsdom; no additional setup needed.
 */
import { beforeEach, vi } from 'vitest'
import { installAllStubs } from '@pulse-music/test-utils'

installAllStubs()

beforeEach(() => {
  vi.clearAllMocks()
})
