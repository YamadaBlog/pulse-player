# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: vue-demo.spec.ts >> Vue v2.3.4 demo — visual regression baselines >> variants gallery — 9 themes
- Location: tests\visual\vue-demo.spec.ts:54:3

# Error details

```
TimeoutError: locator.scrollIntoViewIfNeeded: Timeout 14773.678ms exceeded.
Call log:
  - attempting scroll into view action
    2 × waiting for element to be stable
      - element is not stable
    - retrying scroll into view action
    - waiting 20ms
    2 × waiting for element to be stable
      - element is not stable
    - retrying scroll into view action
      - waiting 100ms
    24 × waiting for element to be stable
       - element is not stable
     - retrying scroll into view action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - generic [ref=e7]: v0.11 · Vue 3 · MIT · ~47 kB gzip
    - heading "Premium drop-in music for Vue 3." [level=1] [ref=e8]
    - paragraph [ref=e9]: An inline card and a floating FAB. One global audio session. FFT visualiser, nine themes, container-aware sizing — and a guided demo that walks you through the whole thing. Drop in. Ship.
    - generic [ref=e11]:
      - button "Play" [ref=e12] [cursor=pointer]:
        - img [ref=e14]
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e24]: NOW PLAYING
          - generic [ref=e25]:
            - link "GitHub" [ref=e26] [cursor=pointer]:
              - /url: https://github.com/YamadaBlog/pulse-player
              - img [ref=e27]
            - link "Open on Spotify" [ref=e29] [cursor=pointer]:
              - /url: https://open.spotify.com/
              - img [ref=e30]
        - heading "MIDNIGHT RUN" [level=2] [ref=e33]
        - generic [ref=e34]:
          - button "Previous" [ref=e35] [cursor=pointer]:
            - img [ref=e36]
          - button "Next" [ref=e38] [cursor=pointer]:
            - img [ref=e39]
      - slider "Seek" [ref=e41] [cursor=pointer]
    - generic [ref=e42]:
      - button "Watch demo" [ref=e43] [cursor=pointer]:
        - img [ref=e45]
        - text: Watch demo
      - link "View on GitHub →" [ref=e47] [cursor=pointer]:
        - /url: https://github.com/YamadaBlog/pulse-player
        - text: View on GitHub
        - generic [ref=e48]: →
      - button "Play music" [ref=e49] [cursor=pointer]
  - generic [ref=e50]:
    - paragraph [ref=e51]: Live · Interactive
    - heading "Resize it. Everything follows." [level=2] [ref=e52]
    - paragraph [ref=e53]:
      - text: One
      - code [ref=e54]: "--pulse-scale"
      - text: variable drives the artwork, title, icons, buttons, padding, radius, shadows, EQ bars, progress and gaps. Move the slider — there is no breakpoint trick.
    - generic [ref=e55]:
      - generic [ref=e57]:
        - button "Play" [ref=e58] [cursor=pointer]:
          - img [ref=e60]
        - generic [ref=e62]:
          - generic [ref=e63]:
            - generic [ref=e70]: NOW PLAYING
            - generic [ref=e71]:
              - link "GitHub" [ref=e72] [cursor=pointer]:
                - /url: https://github.com/YamadaBlog/pulse-player
                - img [ref=e73]
              - link "Open on Spotify" [ref=e75] [cursor=pointer]:
                - /url: https://open.spotify.com/
                - img [ref=e76]
          - heading "MIDNIGHT RUN" [level=2] [ref=e79]
          - generic [ref=e80]:
            - button "Previous" [ref=e81] [cursor=pointer]:
              - img [ref=e82]
            - button "Next" [ref=e84] [cursor=pointer]:
              - img [ref=e85]
        - slider "Seek" [ref=e87] [cursor=pointer]
      - generic [ref=e88]:
        - group "Size presets" [ref=e89]:
          - button "XS" [ref=e90] [cursor=pointer]
          - button "S" [ref=e91] [cursor=pointer]
          - button "M" [ref=e92] [cursor=pointer]
          - button "L" [ref=e93] [cursor=pointer]
          - button "XL" [ref=e94] [cursor=pointer]
        - generic [ref=e95]:
          - generic [ref=e96]: Width
          - slider "Component width in pixels" [ref=e97]: "440"
          - generic [ref=e98]: 440 px
  - generic [ref=e99]:
    - paragraph [ref=e100]: Drag · Pointer events
    - heading "Grab the corner. Resize it yourself." [level=2] [ref=e101]
    - paragraph [ref=e102]:
      - text: Pass
      - code [ref=e103]: resizable
      - text: to the inline player and a diagonal handle appears in the bottom-right corner. Mouse, finger or stylus — same code path (pointer events +
      - code [ref=e104]: setPointerCapture
      - text: ). Pull it small enough and it collapses to compact mode automatically.
    - generic [ref=e105]:
      - generic [ref=e106]:
        - text: Grab the
        - img [ref=e109]
        - text: handle in the bottom-right corner
      - generic [ref=e111]:
        - button "Play" [ref=e112] [cursor=pointer]:
          - img [ref=e114]
        - generic [ref=e116]:
          - generic [ref=e117]:
            - generic [ref=e124]: NOW PLAYING
            - generic [ref=e125]:
              - link "GitHub" [ref=e126] [cursor=pointer]:
                - /url: https://github.com/YamadaBlog/pulse-player
                - img [ref=e127]
              - link "Open on Spotify" [ref=e129] [cursor=pointer]:
                - /url: https://open.spotify.com/
                - img [ref=e130]
          - heading "MIDNIGHT RUN" [level=2] [ref=e133]
          - generic [ref=e134]:
            - button "Previous" [ref=e135] [cursor=pointer]:
              - img [ref=e136]
            - button "Next" [ref=e138] [cursor=pointer]:
              - img [ref=e139]
        - slider "Seek" [ref=e141] [cursor=pointer]
        - separator "Resize player" [ref=e142]:
          - img [ref=e143]
      - generic [ref=e145] [cursor=pointer]:
        - checkbox "Ambient EQ — global"
        - generic [ref=e147]: Ambient EQ — global
  - generic [ref=e149]:
    - article [ref=e150]:
      - generic [ref=e151]: "01"
      - heading "Truly proportional" [level=3] [ref=e152]
      - paragraph [ref=e153]: One CSS variable scales every dimension at once. Artwork, type, chrome and shadows all breathe together.
    - article [ref=e154]:
      - generic [ref=e155]: "02"
      - heading "Container-aware" [level=3] [ref=e156]
      - paragraph [ref=e157]: Sizes itself off the container, not the viewport. Sidebar, hero, modal — it always looks intentional.
    - article [ref=e158]:
      - generic [ref=e159]: "03"
      - heading "Persistent session" [level=3] [ref=e160]
      - paragraph [ref=e161]: One Pinia store, one audio element. Mount the FAB at the root and playback survives every route change.
  - generic [ref=e162]:
    - paragraph [ref=e163]: Library · 9 presets
    - heading "Pick a mood." [level=2] [ref=e164]
    - paragraph [ref=e165]:
      - text: Nine curated background presets, including the new
      - code [ref=e166]: vinyl
      - text: warm analog look.
      - code [ref=e167]: accentColor
      - text: retunes the EQ + progress.
    - generic [ref=e168]:
      - article [ref=e169]:
        - generic [ref=e170]:
          - generic [ref=e171]: Auto
          - code [ref=e172]: auto
        - generic [ref=e173]:
          - button "Play" [ref=e174] [cursor=pointer]:
            - img [ref=e176]
          - generic [ref=e178]:
            - generic [ref=e179]:
              - generic [ref=e186]: NOW PLAYING
              - generic [ref=e187]:
                - generic:
                  - img
                - generic:
                  - img
            - heading "MIDNIGHT RUN" [level=2] [ref=e189]
            - generic [ref=e190]:
              - button "Previous" [ref=e191] [cursor=pointer]:
                - img [ref=e192]
              - button "Next" [ref=e194] [cursor=pointer]:
                - img [ref=e195]
          - slider "Seek" [ref=e197] [cursor=pointer]
        - paragraph [ref=e198]: Live cover art blur — signature look.
      - article [ref=e199]:
        - generic [ref=e200]:
          - generic [ref=e201]: Vinyl
          - code [ref=e202]: vinyl
        - generic [ref=e203]:
          - button "Play" [ref=e204] [cursor=pointer]:
            - img [ref=e206]
          - generic [ref=e208]:
            - generic [ref=e209]:
              - generic [ref=e216]: NOW PLAYING
              - generic [ref=e217]:
                - generic:
                  - img
                - generic:
                  - img
            - heading "MIDNIGHT RUN" [level=2] [ref=e219]
            - generic [ref=e220]:
              - button "Previous" [ref=e221] [cursor=pointer]:
                - img [ref=e222]
              - button "Next" [ref=e224] [cursor=pointer]:
                - img [ref=e225]
          - slider "Seek" [ref=e227] [cursor=pointer]
        - paragraph [ref=e228]: Warm analog · vinyl + leather.
      - article [ref=e229]:
        - generic [ref=e230]:
          - generic [ref=e231]: Sunset
          - code [ref=e232]: sunset
        - generic [ref=e233]:
          - button "Play" [ref=e234] [cursor=pointer]:
            - img [ref=e236]
          - generic [ref=e238]:
            - generic [ref=e239]:
              - generic [ref=e246]: NOW PLAYING
              - generic [ref=e247]:
                - generic:
                  - img
                - generic:
                  - img
            - heading "MIDNIGHT RUN" [level=2] [ref=e249]
            - generic [ref=e250]:
              - button "Previous" [ref=e251] [cursor=pointer]:
                - img [ref=e252]
              - button "Next" [ref=e254] [cursor=pointer]:
                - img [ref=e255]
          - slider "Seek" [ref=e257] [cursor=pointer]
        - paragraph [ref=e258]: Sepia · brown gradient.
      - article [ref=e259]:
        - generic [ref=e260]:
          - generic [ref=e261]: Midnight
          - code [ref=e262]: midnight
        - generic [ref=e263]:
          - button "Play" [ref=e264] [cursor=pointer]:
            - img [ref=e266]
          - generic [ref=e268]:
            - generic [ref=e269]:
              - generic [ref=e276]: NOW PLAYING
              - generic [ref=e277]:
                - generic:
                  - img
                - generic:
                  - img
            - heading "MIDNIGHT RUN" [level=2] [ref=e279]
            - generic [ref=e280]:
              - button "Previous" [ref=e281] [cursor=pointer]:
                - img [ref=e282]
              - button "Next" [ref=e284] [cursor=pointer]:
                - img [ref=e285]
          - slider "Seek" [ref=e287] [cursor=pointer]
        - paragraph [ref=e288]: Deep navy · violet.
      - article [ref=e289]:
        - generic [ref=e290]:
          - generic [ref=e291]: Aurora
          - code [ref=e292]: aurora
        - generic [ref=e293]:
          - button "Play" [ref=e294] [cursor=pointer]:
            - img [ref=e296]
          - generic [ref=e298]:
            - generic [ref=e299]:
              - generic [ref=e306]: NOW PLAYING
              - generic [ref=e307]:
                - generic:
                  - img
                - generic:
                  - img
            - heading "MIDNIGHT RUN" [level=2] [ref=e309]
            - generic [ref=e310]:
              - button "Previous" [ref=e311] [cursor=pointer]:
                - img [ref=e312]
              - button "Next" [ref=e314] [cursor=pointer]:
                - img [ref=e315]
          - slider "Seek" [ref=e317] [cursor=pointer]
        - paragraph [ref=e318]: Teal · cyan night.
      - article [ref=e319]:
        - generic [ref=e320]:
          - generic [ref=e321]: Dark
          - code [ref=e322]: dark
        - generic [ref=e323]:
          - button "Play" [ref=e324] [cursor=pointer]:
            - img [ref=e326]
          - generic [ref=e328]:
            - generic [ref=e329]:
              - generic [ref=e336]: NOW PLAYING
              - generic [ref=e337]:
                - generic:
                  - img
                - generic:
                  - img
            - heading "MIDNIGHT RUN" [level=2] [ref=e339]
            - generic [ref=e340]:
              - button "Previous" [ref=e341] [cursor=pointer]:
                - img [ref=e342]
              - button "Next" [ref=e344] [cursor=pointer]:
                - img [ref=e345]
          - slider "Seek" [ref=e347] [cursor=pointer]
        - paragraph [ref=e348]: Pure neutral dark.
      - article [ref=e349]:
        - generic [ref=e350]:
          - generic [ref=e351]: Light
          - code [ref=e352]: light
        - generic [ref=e353]:
          - button "Play" [ref=e354] [cursor=pointer]:
            - img [ref=e356]
          - generic [ref=e358]:
            - generic [ref=e359]:
              - generic [ref=e366]: NOW PLAYING
              - generic [ref=e367]:
                - generic:
                  - img
                - generic:
                  - img
            - heading "MIDNIGHT RUN" [level=2] [ref=e369]
            - generic [ref=e370]:
              - button "Previous" [ref=e371] [cursor=pointer]:
                - img [ref=e372]
              - button "Next" [ref=e374] [cursor=pointer]:
                - img [ref=e375]
          - slider "Seek" [ref=e377] [cursor=pointer]
        - paragraph [ref=e378]: Light-mode inversion.
      - article [ref=e379]:
        - generic [ref=e380]:
          - generic [ref=e381]: Transparent
          - code [ref=e382]: transparent
        - generic [ref=e383]:
          - button "Play" [ref=e384] [cursor=pointer]:
            - img [ref=e386]
          - generic [ref=e388]:
            - generic [ref=e389]:
              - generic [ref=e396]: NOW PLAYING
              - generic [ref=e397]:
                - generic:
                  - img
                - generic:
                  - img
            - heading "MIDNIGHT RUN" [level=2] [ref=e399]
            - generic [ref=e400]:
              - button "Previous" [ref=e401] [cursor=pointer]:
                - img [ref=e402]
              - button "Next" [ref=e404] [cursor=pointer]:
                - img [ref=e405]
          - slider "Seek" [ref=e407] [cursor=pointer]
        - paragraph [ref=e408]: Frameless — over your bg.
      - article [ref=e409]:
        - generic [ref=e410]:
          - generic [ref=e411]: Custom
          - code [ref=e412]: custom
        - generic [ref=e413]:
          - button "Play" [ref=e414] [cursor=pointer]:
            - img [ref=e416]
          - generic [ref=e418]:
            - generic [ref=e419]:
              - generic [ref=e426]: NOW PLAYING
              - generic [ref=e427]:
                - generic:
                  - img
                - generic:
                  - img
            - heading "MIDNIGHT RUN" [level=2] [ref=e429]
            - generic [ref=e430]:
              - button "Previous" [ref=e431] [cursor=pointer]:
                - img [ref=e432]
              - button "Next" [ref=e434] [cursor=pointer]:
                - img [ref=e435]
          - slider "Seek" [ref=e437] [cursor=pointer]
        - paragraph [ref=e438]: Any CSS background.
  - generic [ref=e439]:
    - paragraph [ref=e440]: Responsive · Container queries
    - heading "Same component. Three widths." [level=2] [ref=e441]
    - paragraph [ref=e442]:
      - text: At 320 px the artwork is compact, the title sits tight. At 720 px the same component fills its space — bigger artwork, larger type, deeper chrome — not because there is a media query, but because every dimension is a function of
      - code [ref=e443]: "--pulse-scale"
      - text: .
    - generic [ref=e444]:
      - generic [ref=e445]:
        - generic [ref=e446]: 320 px
        - generic [ref=e448]:
          - button "Play" [ref=e449] [cursor=pointer]:
            - img [ref=e451]
          - generic [ref=e453]:
            - generic [ref=e454]:
              - generic [ref=e461]: NOW PLAYING
              - generic [ref=e462]:
                - link "GitHub" [ref=e463] [cursor=pointer]:
                  - /url: https://github.com/YamadaBlog/pulse-player
                  - img [ref=e464]
                - link "Open on Spotify" [ref=e466] [cursor=pointer]:
                  - /url: https://open.spotify.com/
                  - img [ref=e467]
            - heading "MIDNIGHT RUN" [level=2] [ref=e470]
            - generic [ref=e471]:
              - button "Previous" [ref=e472] [cursor=pointer]:
                - img [ref=e473]
              - button "Next" [ref=e475] [cursor=pointer]:
                - img [ref=e476]
          - slider "Seek" [ref=e478] [cursor=pointer]
      - generic [ref=e479]:
        - generic [ref=e480]: 480 px
        - generic [ref=e482]:
          - button "Play" [ref=e483] [cursor=pointer]:
            - img [ref=e485]
          - generic [ref=e487]:
            - generic [ref=e488]:
              - generic [ref=e495]: NOW PLAYING
              - generic [ref=e496]:
                - link "GitHub" [ref=e497] [cursor=pointer]:
                  - /url: https://github.com/YamadaBlog/pulse-player
                  - img [ref=e498]
                - link "Open on Spotify" [ref=e500] [cursor=pointer]:
                  - /url: https://open.spotify.com/
                  - img [ref=e501]
            - heading "MIDNIGHT RUN" [level=2] [ref=e504]
            - generic [ref=e505]:
              - button "Previous" [ref=e506] [cursor=pointer]:
                - img [ref=e507]
              - button "Next" [ref=e509] [cursor=pointer]:
                - img [ref=e510]
          - slider "Seek" [ref=e512] [cursor=pointer]
      - generic [ref=e513]:
        - generic [ref=e514]: 720 px
        - generic [ref=e516]:
          - button "Play" [ref=e517] [cursor=pointer]:
            - img [ref=e519]
          - generic [ref=e521]:
            - generic [ref=e522]:
              - generic [ref=e529]: NOW PLAYING
              - generic [ref=e530]:
                - link "GitHub" [ref=e531] [cursor=pointer]:
                  - /url: https://github.com/YamadaBlog/pulse-player
                  - img [ref=e532]
                - link "Open on Spotify" [ref=e534] [cursor=pointer]:
                  - /url: https://open.spotify.com/
                  - img [ref=e535]
            - heading "MIDNIGHT RUN" [level=2] [ref=e538]
            - generic [ref=e539]:
              - button "Previous" [ref=e540] [cursor=pointer]:
                - img [ref=e541]
              - button "Next" [ref=e543] [cursor=pointer]:
                - img [ref=e544]
          - slider "Seek" [ref=e546] [cursor=pointer]
  - generic [ref=e547]:
    - paragraph [ref=e548]: Floating FAB
    - heading "Persistent, draggable, dismissible." [level=2] [ref=e549]
    - paragraph [ref=e550]: Mount once at the root. Drag to move, swipe down/right to dismiss, long-press for the radial menu. The ring around it tracks progress.
    - group "Mini-player variant" [ref=e551]:
      - button "Auto" [ref=e552] [cursor=pointer]
      - button "Vinyl" [ref=e553] [cursor=pointer]
      - button "Sunset" [ref=e554] [cursor=pointer]
      - button "Midnight" [ref=e555] [cursor=pointer]
      - button "Aurora" [ref=e556] [cursor=pointer]
      - button "Dark" [ref=e557] [cursor=pointer]
      - button "Light" [ref=e558] [cursor=pointer]
    - paragraph [ref=e559]: Options
    - generic [ref=e560]:
      - button "Show FAB" [ref=e561] [cursor=pointer]
      - button "Hide FAB" [ref=e562] [cursor=pointer]
      - generic [ref=e563] [cursor=pointer]:
        - checkbox "Pulso"
        - generic [ref=e565]: Pulso
    - paragraph [ref=e566]:
      - code [ref=e567]: pulso
      - text: adds a subtle audio-wave ripple around the FAB. Try it once the FAB is visible.
  - contentinfo [ref=e568]:
    - generic [ref=e569]:
      - generic [ref=e570]: pulse-player
      - generic [ref=e571]: Floating + inline music for Vue 3
      - link "github →" [ref=e572] [cursor=pointer]:
        - /url: https://github.com/YamadaBlog/pulse-player
```

# Test source

```ts
  1  | /**
  2  |  * Visual regression baseline for the Vue v2.3.4 demo.
  3  |  *
  4  |  * These tests capture the validated rendering of `src/App.vue` +
  5  |  * `src/lib/MusicPlayer.vue` + `src/lib/MiniPlayer.vue`. They serve
  6  |  * two purposes:
  7  |  *
  8  |  *   1. **Migration gate** — when alpha.9 migrates `src/lib/` into
  9  |  *      `packages/vue/` (wrapping `<pulse-player>` from
  10 |  *      `@pulse/web-component`), these screenshots must still match.
  11 |  *      Any pixel drift blocks the merge.
  12 |  *
  13 |  *   2. **Web-component parity ceiling** — when chrome Phase 2 / 3
  14 |  *      lands in `<pulse-player>`, side-by-side captures help quantify
  15 |  *      where the wrapper is vs the Vue reference.
  16 |  *
  17 |  * Scope is deliberately small: capture three high-signal viewports
  18 |  * (hero, resize stage at the documented size, variants gallery) at
  19 |  * the default theme. That's enough to detect typography drift,
  20 |  * variant gradient drift, and chrome geometry drift — the three
  21 |  * things that would matter to a consumer.
  22 |  */
  23 | import { test, expect } from '@playwright/test'
  24 | 
  25 | test.describe('Vue v2.3.4 demo — visual regression baselines', () => {
  26 |   test('hero — transparent variant + ambient EQ', async ({ page }) => {
  27 |     await page.goto('/')
  28 |     // Wait for the layout to settle (ResizeObserver tick, image
  29 |     // decode, font swap). The demo doesn't expose a "ready" signal;
  30 |     // a 600 ms idle is enough for the chrome to paint.
  31 |     await page.waitForLoadState('networkidle')
  32 |     await page.waitForTimeout(600)
  33 |     const hero = page.locator('.hero').first()
  34 |     await expect(hero).toHaveScreenshot('hero.png')
  35 |   })
  36 | 
  37 |   test('resize stage at default width', async ({ page, browserName }) => {
  38 |     // Emulate prefers-reduced-motion to freeze the ambient EQ + pulso
  39 |     // animations. The Vue demo's CSS honours this and snaps every
  40 |     // animation to its first frame — perfect for a stable screenshot.
  41 |     await page.emulateMedia({ reducedMotion: 'reduce' })
  42 |     await page.goto('/')
  43 |     await page.waitForLoadState('networkidle')
  44 |     await page.waitForTimeout(800)
  45 |     const stage = page.locator('.resize-stage').first()
  46 |     await stage.scrollIntoViewIfNeeded()
  47 |     await page.waitForTimeout(1000)
  48 |     await expect(stage).toHaveScreenshot('resize-stage.png', {
  49 |       maxDiffPixelRatio: 0.05,
  50 |       timeout: 15_000,
  51 |     })
  52 |   })
  53 | 
  54 |   test('variants gallery — 9 themes', async ({ page }) => {
  55 |     await page.emulateMedia({ reducedMotion: 'reduce' })
  56 |     await page.goto('/')
  57 |     await page.waitForLoadState('networkidle')
  58 |     await page.waitForTimeout(800)
  59 |     const variants = page.locator('section.variants, .variants').first()
> 60 |     await variants.scrollIntoViewIfNeeded()
     |                    ^ TimeoutError: locator.scrollIntoViewIfNeeded: Timeout 14773.678ms exceeded.
  61 |     await page.waitForTimeout(1000)
  62 |     await expect(variants).toHaveScreenshot('variants-gallery.png', {
  63 |       maxDiffPixelRatio: 0.05,
  64 |       timeout: 15_000,
  65 |     })
  66 |   })
  67 | 
  68 |   test('home page above the fold', async ({ page }) => {
  69 |     await page.goto('/')
  70 |     await page.waitForLoadState('networkidle')
  71 |     await page.waitForTimeout(800)
  72 |     await expect(page).toHaveScreenshot('home-fold.png', {
  73 |       fullPage: false,
  74 |       maxDiffPixelRatio: 0.01,
  75 |     })
  76 |   })
  77 | })
  78 | 
```