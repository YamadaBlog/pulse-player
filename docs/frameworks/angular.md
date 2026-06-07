# Pulse for Angular (`@pulse/angular`)

Angular 17+ wrapper. Module + components on top of `@pulse/web-component`.

## Status

⏳ **Implementation lands in v3.1.0.**

## Planned API

```ts
// app.module.ts
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core'
import { PulseModule } from '@pulse/angular'

@NgModule({
  imports: [PulseModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
```

```html
<!-- app.component.html -->
<pulse-player variant="midnight" [ambientEq]="true" (play)="onPlay($event)"></pulse-player>
<pulse-fab [pulso]="true"></pulse-fab>
```

## See also

- [Architecture](../universal/ARCHITECTURE.md)
