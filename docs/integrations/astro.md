# Astro

```bash
npm i @pulse-music/web-component
```

No framework integration needed — Astro ships the elements as plain HTML, and a `<script>` registers them in the browser:

```astro
---
// src/components/Player.astro
const { variant = 'auto' } = Astro.props
---

<pulse-player variant={variant} ambient-eq>
  <pulse-track src="/audio/protofunk.mp3" title="Protofunk" artist="Kevin MacLeod" cover="/audio/protofunk.jpg"></pulse-track>
</pulse-player>

<script>
  import '@pulse-music/web-component'
</script>
```

```astro
---
// src/layouts/Base.astro — add the floating player once
---
<slot />
<pulse-fab pulso transition:persist></pulse-fab>

<script>
  import '@pulse-music/web-component'
</script>
```

With View Transitions (`<ClientRouter />`), `transition:persist` keeps the floating player — and the music — alive across page changes.
