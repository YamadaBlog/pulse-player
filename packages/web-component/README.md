# @pulse/web-component

Universal Custom Elements for pulse-player. Lit-based `<pulse-player>` and `<pulse-fab>`.

## Why

Web Components are the W3C standard for cross-framework UI. By implementing the renderer once as Custom Elements, every framework wrapper becomes a thin adapter — no duplicated rendering code, no drift, no maintenance burden growing linearly with framework count.

The wrappers (`@pulse/react`, `@pulse/vue`, …) consume these elements internally and map framework conventions (camelCase props, synthetic events) to the Custom Elements' DOM attributes and `CustomEvent`s.

## Usage (once implemented)

```html
<script type="module" src="https://unpkg.com/@pulse/web-component"></script>

<pulse-player variant="midnight" ambient-eq></pulse-player>
<pulse-fab variant="vinyl" pulso></pulse-fab>
```

## Status

⏳ **Scaffold** — implementation lands in v3.0.0-alpha.2 (after `@pulse/core` extraction in alpha.1).

## License

MIT.
