# Pulse for Angular (`@pulse-music/angular`)

Angular 17+ wrapper. Thin `PulseModule` + Custom Elements registration on top of `@pulse-music/web-component`.

> ✅ **Honest status (v3.0.0-alpha.10):** `PulseModule` is shipped and **tested via Vitest smoke tests (5 / 5)** that verify Custom Element registration + re-export integrity. The package is currently marked `private: true` because the floor peer dependency `@angular/core` >= 17.3.12 is required to avoid known CVEs (older 17.x has XSS issues per `npm audit`). Once v3.0.0 stable raises the floor to 19+, the package goes public. Chrome parity vs Vue v2.3.4 is **~95 %** (inherited from `<pulse-player>`).

## Install

```bash
npm install @pulse-music/angular
# Peer dep: @angular/core >= 17.3.12
```

`@pulse-music/angular` side-effect-imports `@pulse-music/web-component`, which registers `<pulse-player>` and `<pulse-fab>` Custom Elements globally.

## Setup

```ts
// app.module.ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { AppComponent } from './app.component'
import { PulseModule } from '@pulse-music/angular'

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, PulseModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // ← required for the <pulse-*> tags
  bootstrap: [AppComponent],
})
export class AppModule {}
```

If you're on standalone components (Angular 17+):

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { PulseModule } from '@pulse-music/angular'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PulseModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.component.html',
})
export class AppComponent {}
```

## Usage

```html
<!-- app.component.html -->
<pulse-player
  variant="midnight"
  [attr.ambient-eq]="true"
  [attr.resizable]="true"
  [attr.github-url]="'https://github.com/YamadaBlog/pulse-player'"
  (pulse-play)="onPlay($event)"
  (pulse-error)="onError($event)"
></pulse-player>

<pulse-fab variant="vinyl" [attr.pulso]="true" [attr.show-menu]="true"></pulse-fab>
```

```ts
// app.component.ts
import { Component } from '@angular/core'
import type { EventMap } from '@pulse-music/angular'

@Component({
  /* … */
})
export class AppComponent {
  onPlay(e: CustomEvent<EventMap['play']>) {
    console.log('▶', e.detail.track.title, e.detail.time)
  }
  onError(e: CustomEvent<EventMap['error']>) {
    console.warn('audio error:', e.detail.reason)
  }
}
```

## Important: boolean attribute binding

Angular's standard `[prop]="true"` binding sets a JavaScript property. For boolean **presence attributes** on Custom Elements (`ambient-eq`, `pulso`, `data-fab`, `resizable`, `draggable`, `show-menu`), you must use `[attr.<name>]="…"`:

```html
<!-- Wrong — Angular binds an isolated property, not an HTML attribute -->
<pulse-player [ambientEq]="true"></pulse-player>

<!-- Right — sets / removes the HTML attribute -->
<pulse-player [attr.ambient-eq]="true"></pulse-player>
```

Otherwise the Custom Element won't see the attribute change reactively.

## Custom event binding

`<pulse-player>` and `<pulse-fab>` emit DOM `CustomEvent`s (`pulse-play`, `pulse-pause`, `pulse-trackchange`, `pulse-error`). Angular handles these via standard native-event binding:

```html
<pulse-player
  (pulse-play)="onPlay($event)"
  (pulse-pause)="onPause($event)"
  (pulse-trackchange)="onTrackChange($event)"
  (pulse-error)="onError($event)"
></pulse-player>
```

The `$event` argument is a `CustomEvent` whose `detail` matches the typed `EventMap[…]` shape.

## Programmatic access — the singleton engine

For Angular services or imperative control flow, use the singleton `PulseEngine`:

```ts
import { Injectable } from '@angular/core'
import { getSharedEngine, type PulseState } from '@pulse-music/angular'

@Injectable({ providedIn: 'root' })
export class AudioService {
  private engine = getSharedEngine()

  play() {
    this.engine.toggle()
  }
  next() {
    this.engine.next()
  }
  setVolume(_v: number) {
    /* future API */
  }

  /** Subscribe Angular components to state changes. */
  onStateChange(cb: (state: PulseState) => void) {
    return this.engine.onStateChange(cb)
  }
}
```

`getSharedEngine()` returns the same engine the `<pulse-player>` Custom Element uses internally, so toggling from the service updates the rendered chrome instantly.

## TypeScript

The package ships `.d.ts` types for `PulseEngine`, `PulseState`, `Track`, `PulseVariant`, `EventMap`, `Unsubscribe`. Angular's template type checker accepts `<pulse-player>` and `<pulse-fab>` because of `CUSTOM_ELEMENTS_SCHEMA`.

## Keyboard shortcuts

Same as the other wrappers: `Space`/`K` (toggle), `J`/`←` (prev), `L`/`→` (next) on focused `<pulse-player>`.

## License

MIT.

## See also

- [`docs/frameworks/web-component.md`](./web-component.md) — underlying Custom Element API
- [Angular Elements](https://angular.dev/guide/elements) — the Angular team's own pattern that `PulseModule` mirrors
