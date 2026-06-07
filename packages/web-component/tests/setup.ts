/**
 * Test bootstrap for @pulse/web-component — same stubs as @pulse/core
 * via @pulse/test-utils. Lit's reactive controllers work out of the
 * box under jsdom; no additional setup needed.
 */
import { beforeEach, vi } from 'vitest'
import { installAllStubs } from '@pulse/test-utils'

installAllStubs()

beforeEach(() => {
  vi.clearAllMocks()
})
