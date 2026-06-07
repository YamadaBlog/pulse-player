/**
 * Test bootstrap for @pulse/react — shared stubs from @pulse/test-utils
 * plus @testing-library/jest-dom matchers for clearer React assertions.
 */
import { beforeEach, vi } from 'vitest'
import { installAllStubs } from '@pulse/test-utils'
import '@testing-library/jest-dom/vitest'

installAllStubs()

beforeEach(() => {
  vi.clearAllMocks()
})
