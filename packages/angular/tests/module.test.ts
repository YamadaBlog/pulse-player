/**
 * `@pulse-music/angular` smoke tests.
 *
 * Verifies the module's contract:
 *   - Importing `@pulse-music/angular` side-effect-registers `<pulse-player>`
 *     and `<pulse-fab>` Custom Elements with the browser registry.
 *   - The re-exports (`PulseEngine`, `getSharedEngine`,
 *     `setSharedEngine`, `ALL_VARIANTS`) resolve to the same symbols
 *     `@pulse-music/web-component` exports.
 *
 * Full Angular component integration (template binding, change
 * detection) would need the Angular runtime — out of scope here.
 */
import { describe, expect, it } from 'vitest'

describe('@pulse-music/angular — smoke tests', () => {
  it('side-effect-registers <pulse-player> on import', async () => {
    await import('../src/index')
    expect(customElements.get('pulse-player')).toBeDefined()
  })

  it('side-effect-registers <pulse-fab> on import', async () => {
    await import('../src/index')
    expect(customElements.get('pulse-fab')).toBeDefined()
  })

  it('re-exports PulseEngine and the singleton helpers', async () => {
    const { PulseEngine, getSharedEngine, setSharedEngine } = await import('../src/index')
    expect(typeof PulseEngine).toBe('function')
    expect(typeof getSharedEngine).toBe('function')
    expect(typeof setSharedEngine).toBe('function')

    const fresh = new PulseEngine()
    setSharedEngine(fresh)
    expect(getSharedEngine()).toBe(fresh)
  })

  it('re-exports ALL_VARIANTS with the canonical 10 entries', async () => {
    const { ALL_VARIANTS } = await import('../src/index')
    expect(ALL_VARIANTS.length).toBe(10)
    expect(ALL_VARIANTS).toContain('midnight')
    expect(ALL_VARIANTS).toContain('vinyl')
    expect(ALL_VARIANTS).toContain('custom')
  })

  it('exports `PulseModule` (decorated, no-throw construction)', async () => {
    const { PulseModule } = await import('../src/index')
    expect(typeof PulseModule).toBe('function')
    // Construct it without crashing — the @NgModule({}) stub returns
    // the class as-is, so this verifies the export shape.
    expect(() => new PulseModule()).not.toThrow()
  })
})
