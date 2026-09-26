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
  <pulse-track
    src="/audio/projector-screen.mp3"
    title="Projector Screen"
    artist="HoliznaCC0"
    cover="/audio/projector-screen.jpg"
  ></pulse-track>
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
