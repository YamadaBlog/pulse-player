/**
 * Test bootstrap for @pulse-music/react — shared stubs from @pulse-music/test-utils
 * plus @testing-library/jest-dom matchers for clearer React assertions.
 */
import { beforeEach, vi } from 'vitest'
import { installAllStubs } from '@pulse-music/test-utils'
import '@testing-library/jest-dom/vitest'

installAllStubs()

beforeEach(() => {
  vi.clearAllMocks()
})
