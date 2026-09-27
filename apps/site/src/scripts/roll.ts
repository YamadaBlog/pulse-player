import { EASING } from '@pulse-music/tokens'
import { reducedMotion } from './lifecycle'
import { SIXTEENTH } from './tempo'

/**
 * Text that changes in place rolls through its mask like the counter on a
 * tape deck: the new value rides in right under the old one and a single
 * motion carries both, so no frame shows an empty slot. At the end the new
 * text takes the old one's place, exactly where it already stands. The
 * slot's parent must clip it. Changes that arrive mid-roll are not queued
 * one by one: the roll lands on the latest value.
 */
export function createRoll(
  slot: HTMLElement,
  { duration = SIXTEENTH * 1.5, gap = 0.1 }: { duration?: number; gap?: number } = {},
): (text: string, instant?: boolean) => void {
  let shown = slot.textContent ?? ''
  let target = shown
  let busy = false
  if (getComputedStyle(slot).position === 'static') slot.style.position = 'relative'
  const step = `${(1 + gap) * 100}%`

  const run = (): void => {
    busy = true
    const next = target
    const incoming = document.createElement('span')
    incoming.textContent = next
    incoming.setAttribute('aria-hidden', 'true')
    incoming.style.cssText = `position:absolute;left:0;top:${step};white-space:nowrap`
    slot.append(incoming)
    const roll = slot.animate([{ transform: 'none' }, { transform: `translateY(-${step})` }], {
      duration: duration * 1000,
      easing: EASING.inOut,
      fill: 'forwards',
    })
    roll.onfinish = () => {
      shown = next
      slot.textContent = next // drops the rider: same text, same place
      roll.cancel()
      busy = false
      if (target !== shown) run()
    }
  }

  return (text, instant = false) => {
    target = text
    if (instant || reducedMotion()) {
      slot.getAnimations().forEach((a) => a.cancel())
      busy = false
      shown = text
      slot.textContent = text
      return
    }
    if (!busy && text !== shown) run()
  }
}
