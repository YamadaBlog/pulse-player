# Plain HTML from a CDN

No bundler, no install — one module script:

```html
<!doctype html>
<html lang="en">
  <body>
    <pulse-player variant="midnight" ambient-eq>
      <pulse-track src="./song.mp3" title="My song" artist="Me" cover="./cover.jpg"></pulse-track>
    </pulse-player>
    <pulse-fab></pulse-fab>

    <script
      type="module"
      src="https://cdn.jsdelivr.net/npm/@pulse-music/web-component@3/+esm"
    ></script>
  </body>
</html>
```

Pin an exact version (`@3.0.0`) in production, or add a [Subresource Integrity](https://developer.mozilla.org/docs/Web/Security/Subresource_Integrity) hash, so a CDN change can never alter your page.

Serve the audio from the same origin as the page (or with CORS headers) to get the real spectrum — see [troubleshooting](../troubleshooting.md#the-visualiser-moves-but-doesnt-follow-the-music).
