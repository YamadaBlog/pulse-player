import { beforeEach, vi } from 'vitest'
import { installAllStubs } from '@pulse/test-utils'

installAllStubs()

beforeEach(() => {
  vi.clearAllMocks()
})
