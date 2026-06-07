/**
 * Test bootstrap for @pulse/svelte — shared stubs from @pulse/test-utils.
 */
import { beforeEach, vi } from 'vitest'
import { installAllStubs } from '@pulse/test-utils'

installAllStubs()

beforeEach(() => {
  vi.clearAllMocks()
})
