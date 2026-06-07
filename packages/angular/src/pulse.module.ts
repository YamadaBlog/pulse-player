/**
 * @pulse-music/angular — `PulseModule` for Angular 17+ consumers.
 *
 * Importing this module side-effect-registers `<pulse-player>` and
 * `<pulse-fab>` Custom Elements with the browser's global registry,
 * and declares `CUSTOM_ELEMENTS_SCHEMA` so Angular's template
 * compiler accepts the element tags without complaining about
 * "unknown component".
 *
 * Usage:
 *
 * ```ts
 * import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
 * import { PulseModule } from '@pulse-music/angular'
 *
 * @NgModule({
 *   imports: [PulseModule],
 *   schemas: [CUSTOM_ELEMENTS_SCHEMA],
 * })
 * export class AppModule {}
 * ```
 *
 * Template:
 *
 * ```html
 * <pulse-player variant="midnight" [attr.ambient-eq]="true" (pulse-play)="onPlay($event)"></pulse-player>
 * <pulse-fab variant="vinyl" [attr.pulso]="true"></pulse-fab>
 * ```
 *
 * Note the `[attr.<name>]="..."` binding syntax for boolean
 * presence attributes (Angular doesn't reliably serialise `false`
 * as "remove the attribute" otherwise), and the `(pulse-play)` etc.
 * native DOM event binding for the custom events.
 *
 * Status: v3.0.0-alpha.7 — first real implementation. The module
 * is intentionally minimal: it imports `@pulse-music/web-component` for
 * the side-effect registration and re-exports the engine + types
 * so consumers can pull everything from one import.
 */
import { NgModule } from '@angular/core'

// Side-effect import registers <pulse-player> + <pulse-fab>.
import '@pulse-music/web-component'

@NgModule({})
export class PulseModule {}

export {
  PulseEngine,
  getSharedEngine,
  setSharedEngine,
} from '@pulse-music/web-component'

export type {
  AudioEvent,
  ErrorReason,
  EventListener,
  EventMap,
  PulseState,
  PulseVariant,
  Track,
  Unsubscribe,
} from '@pulse-music/types'

export { ALL_VARIANTS } from '@pulse-music/types'
