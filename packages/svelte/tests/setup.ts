/**
 * Test bootstrap for @pulse-music/svelte — shared stubs from @pulse-music/test-utils.
 */
import { beforeEach, vi } from 'vitest'
import { installAllStubs } from '@pulse-music/test-utils'

installAllStubs()

beforeEach(() => {
  vi.clearAllMocks()
})
