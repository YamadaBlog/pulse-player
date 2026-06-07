/**
 * Test bootstrap for @pulse/core.
 *
 * The four nearly-identical setup files (this one + web-component +
 * react + svelte) are now reduced to a one-line call to
 * `@pulse/test-utils`. Each package can still install only the stubs
 * it needs (e.g. a renderer-only package could skip audio stubs).
 */
import { beforeEach, vi } from 'vitest'
import { installAllStubs } from '@pulse/test-utils'

installAllStubs()

beforeEach(() => {
  vi.clearAllMocks()
})
