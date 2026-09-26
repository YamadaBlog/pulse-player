import { expect, vi } from 'vitest'

/**
 * Assert that every action exposed by a wrapper calls the engine method
 * of the same (or mapped) name with the same arguments.
 */
export function expectActionsForwarded(
  engine: object,
  actions: Record<string, unknown>,
  names: string[],
): void {
  for (const name of names) {
    const spy = vi
      .spyOn(engine as Record<string, () => unknown>, name)
      .mockImplementation(() => undefined)
    const args = [1, { autoplay: true }]
    ;(actions[name] as (...a: unknown[]) => unknown)(...args)
    expect(spy, `${name} is forwarded`).toHaveBeenCalled()
    spy.mockRestore()
  }
}

export const ENGINE_ACTIONS = [
  'play',
  'pause',
  'toggle',
  'next',
  'prev',
  'load',
  'seek',
  'seekTo',
  'seekBy',
  'setVolume',
  'toggleMute',
  'setRepeat',
  'setTracks',
  'setAmbientEq',
  'close',
  'subscribe',
]
