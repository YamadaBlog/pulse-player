import { describe, expect, it, vi } from 'vitest'
import { useDemoTour, type DemoStep } from '../src/composables/useDemoTour'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

const buildStep = (title: string, captureLog: string[]): DemoStep => ({
  title,
  run: async (ctx) => {
    captureLog.push(`enter:${title}`)
    ctx.setMessage(`${title}-msg`)
    await ctx.delay(40)
    captureLog.push(`leave:${title}`)
  },
})

// Bump the per-test timeout — every step burns through a setTimeout-
// backed rAF polyfill (~16 ms per frame), so multi-step natural-completion
// scenarios take longer than the default 5 s in the loaded CI runner.
describe('useDemoTour', { timeout: 15000 }, () => {
  it('runs every step in order and reports clean state when done', async () => {
    const tour = useDemoTour()
    const log: string[] = []
    const steps: DemoStep[] = [
      buildStep('one', log),
      buildStep('two', log),
      buildStep('three', log),
    ]
    await tour.start(steps)
    expect(log).toEqual([
      'enter:one', 'leave:one',
      'enter:two', 'leave:two',
      'enter:three', 'leave:three',
    ])
    expect(tour.isRunning.value).toBe(false)
    expect(tour.title.value).toBe('')
  })

  it('stop() aborts the running tour and fires onStop', async () => {
    const tour = useDemoTour()
    const onStop = vi.fn()
    const log: string[] = []
    const steps: DemoStep[] = [buildStep('a', log), buildStep('b', log)]
    const running = tour.start(steps, { onStop })
    await wait(10)
    tour.stop()
    await running
    expect(onStop).toHaveBeenCalledTimes(1)
    expect(tour.isRunning.value).toBe(false)
    expect(log).not.toContain('leave:b')
  })

  it('pause() freezes the timeline, resume() lands on the end value', async () => {
    const tour = useDemoTour()
    const captured: number[] = []
    const steps: DemoStep[] = [{
      title: 'tween',
      run: async (ctx) => {
        await ctx.tween((v) => captured.push(Math.round(v)), 0, 100, 160, 'inOutCubic')
      },
    }]
    const running = tour.start(steps)
    await wait(40)
    tour.pause()
    expect(tour.isPaused.value).toBe(true)
    const frozenLast = captured[captured.length - 1] ?? 0
    await wait(80)
    // Final captured value while paused should not have advanced near 100.
    expect(captured[captured.length - 1]).toBeLessThan(frozenLast + 30)
    tour.resume()
    await running
    expect(tour.isPaused.value).toBe(false)
    expect(captured[captured.length - 1]).toBe(100)
  })

  it('next() jumps to the next step without ending the tour', async () => {
    const tour = useDemoTour()
    const log: string[] = []
    const steps: DemoStep[] = [
      {
        title: 'first',
        run: async (ctx) => {
          log.push('first-start')
          await ctx.delay(1000)
          log.push('first-end')
        },
      },
      buildStep('second', log),
    ]
    const running = tour.start(steps)
    await wait(20)
    tour.next()
    await running
    expect(log).toContain('first-start')
    expect(log).not.toContain('first-end') // jumped before completion
    expect(log).toContain('enter:second')
    expect(log).toContain('leave:second')
  })

  it('goToStep(i) jumps to an arbitrary index', async () => {
    const tour = useDemoTour()
    const log: string[] = []
    const steps: DemoStep[] = [
      buildStep('a', log),
      buildStep('b', log),
      buildStep('c', log),
      buildStep('d', log),
    ]
    const running = tour.start(steps)
    await wait(10)
    tour.goToStep(2)
    await running
    // 'a' partially ran, 'c' and 'd' completed
    expect(log).toContain('enter:c')
    expect(log).toContain('leave:c')
    expect(log).toContain('enter:d')
    expect(log).toContain('leave:d')
  })

  it('next() on the last step ends the tour', async () => {
    const tour = useDemoTour()
    const log: string[] = []
    const steps: DemoStep[] = [buildStep('only', log)]
    const running = tour.start(steps)
    await wait(10)
    tour.next()
    await running
    expect(tour.isRunning.value).toBe(false)
  })

  it('start() is a no-op while already running', async () => {
    const tour = useDemoTour()
    const log: string[] = []
    const steps: DemoStep[] = [buildStep('only', log)]
    const first = tour.start(steps)
    await tour.start(steps) // second call ignored
    await first
    expect(log.filter((l) => l === 'enter:only')).toHaveLength(1)
  })

  it('setMessage updates the reactive caption', async () => {
    const tour = useDemoTour()
    const messages: string[] = []
    const steps: DemoStep[] = [{
      title: 'captioned',
      run: async (ctx) => {
        ctx.setMessage('hello')
        messages.push(tour.message.value)
        await ctx.delay(10)
        ctx.setMessage('world')
        messages.push(tour.message.value)
      },
    }]
    await tour.start(steps)
    expect(messages).toEqual(['hello', 'world'])
  })
})
