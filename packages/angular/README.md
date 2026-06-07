# @pulse-music/angular

Angular 17+ wrapper for pulse-player. Thin `PulseModule` + Custom Elements registration on top of `@pulse-music/web-component`.

## Status

✅ **v3.0.0-alpha.7** — minimal real implementation. The module side-effect-registers `<pulse-player>` and `<pulse-fab>`, then re-exports the engine + types. Angular's `CUSTOM_ELEMENTS_SCHEMA` makes the elements available in every template.

The package is currently marked `private: true` because the floor peer dependency `@angular/core` >= 17.3.12 is required to avoid known CVEs (older 17.x has XSS issues per `npm audit`). Once v3.0.0 stable raises the floor to 19+, the package goes public.

## Usage (once published)

```ts
// app.module.ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { PulseModule } from '@pulse-music/angular'

@NgModule({
  imports: [PulseModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
```

```html
<!-- app.component.html -->
<pulse-player
  variant="midnight"
  [attr.ambient-eq]="true"
  (pulse-play)="onPlay($event)"
></pulse-player>
<pulse-fab variant="vinyl" [attr.pulso]="true"></pulse-fab>
```

Notes:

- **Boolean attributes** like `ambient-eq`, `pulso`, `data-fab`, `resizable`, `draggable` use `[attr.<name>]="true"` syntax. Angular doesn't reliably serialise `false` to "remove the attribute" otherwise.
- **Custom events** like `pulse-play`, `pulse-pause`, `pulse-trackchange`, `pulse-error` use native DOM event binding: `(pulse-play)="handler($event)"`.

## License

MIT.
