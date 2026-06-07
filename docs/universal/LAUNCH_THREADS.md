# Pulse — ready-to-post launch threads

Pre-written posts the maintainer can copy-paste verbatim once `npm publish @pulse/*` lands. Each thread targets one specific audience and follows that audience's posting conventions (Reddit = no over-promotion, Bluesky = motion-rich, HN = no superlatives, dev.to = long-form).

Replace the bracketed `[STARS]` / `[DOWNLOADS]` placeholders with the real numbers at post time.

## 1. Reddit — r/vuejs (post AFTER npm publish)

**Title:** `I built a Vue 3 music player with 9 themes + multi-framework wrappers — feedback wanted`

**Body:**

```
Hey r/vuejs,

I just shipped Pulse — a Vue 3 music player I've been refactoring into a
multi-framework component over the past month. Open-sourced under MIT.

What it does:
- Drop-in `<MusicPlayer />` + `<MiniPlayer />` Vue components
- 9 curated themes (auto / transparent / midnight / sunset / vinyl / aurora / …)
- Ambient EQ + pulso heartbeat
- Drag-to-resize + FAB radial menu + fullscreen + keyboard shortcuts
- 14 kB gzip (Vue lib)
- 132 unit tests + Axe-core WCAG 2.1 AA strict gate

Why I'm posting:
v3.0.0-rc.0 is the first release I'd actually want feedback on. The Vue
v2.3.4 reference is bit-for-bit stable (16 alphas), and the @pulse/vue
package is a soft re-export so existing consumers don't break.

Live demo: https://yamadablog.github.io/pulse-player/
GitHub: https://github.com/YamadaBlog/pulse-player
YouTube walkthrough: https://youtu.be/q_FJ1GWaCc8
npm: https://www.npmjs.com/package/@pulse/vue

What I'd love feedback on:
- The dual-track `pulse-player` v2.3.4 vs `@pulse/vue` v3.0.0-rc.0 naming.
  Confusing? Right call?
- The 9-theme palette — too many? Wrong colours?
- Performance on lower-end devices — backdrop-filter is expensive, would
  love crash reports if anyone hits FPS issues.

Comparison page with Plyr / Vidstack / Howler is in the repo if you want
the honest "when to use Pulse vs the alternatives" read.

Happy to answer anything in the thread.
```

## 2. Reddit — r/reactjs (post AFTER npm publish)

**Title:** `@pulse/react — a 1 kB music player wrapper around a 8 kB Web Component`

**Body:**

````
Hi r/reactjs,

Shipped @pulse/react today — a React 18 / 19 wrapper for Pulse, a
multi-framework music player I've been building.

The bundle math:
- @pulse/react: 1 kB gzip (wrapper)
- @pulse/web-component: 8.5 kB gzip (shared chrome runtime)
- @pulse/core: 2 kB gzip (audio engine)

Total cost if you only use the audio + minimal chrome: ~3 kB gzip.
Full chrome (ambient EQ + pulso + FAB + themes): ~12 kB gzip.

API:
```jsx
import { PulsePlayer, PulseFab, usePulseAudio } from '@pulse/react'

export function App() {
  const { isPlaying, track, toggle } = usePulseAudio()
  return (
    <>
      <PulsePlayer variant="midnight" ambientEq resizable />
      <PulseFab variant="vinyl" pulso draggable showMenu />
    </>
  )
}
````

useDomEvent + useEffect cleanup handled internally so consumers don't
worry about listener leaks. 16 RTL tests covering the wrapper surface.

If you're building a portfolio site / content blog / marketing landing
and want a polished audio widget, this is the smallest React component
in that category I know of.

Live demo: https://yamadablog.github.io/pulse-player/
GitHub: https://github.com/YamadaBlog/pulse-player
Next.js integration snippet: https://github.com/YamadaBlog/pulse-player/blob/main/examples/integrations/next-app-router.md

Feedback welcome — especially on the SSR / hydration pattern (the README
documents the suppressHydrationWarning gotcha).

```

## 3. Reddit — r/sveltejs (post AFTER npm publish)

**Title:** `@pulse/svelte — plain TS hook, no Svelte compiler dependency`

**Body:**

```

r/sveltejs,

Shipped @pulse/svelte — a Svelte 5 wrapper for a multi-framework music
player I've been refactoring.

Design choice: no .svelte component, just a plain TypeScript hook
implementing the classic-store contract. The Custom Elements
(<pulse-player>, <pulse-fab>) work directly in any Svelte template,
so wrapping them in a Svelte component would add a one-line passthrough
without DX gain.

usePulseAudio() returns:

- subscribe(callback) — classic store contract for $audio.X autosubscribe
- engine — escape hatch for advanced use
- actions: toggle, next, prev, seek, setAudioTracks, setAmbientEq
- fmt(seconds) — time formatter

Example:

```svelte
<script lang="ts">
  import { usePulseAudio } from '@pulse/svelte'
  const audio = usePulseAudio()
</script>

<pulse-player variant="midnight" ambient-eq resizable></pulse-player>
<pulse-fab variant="vinyl" pulso draggable></pulse-fab>

<button onclick={audio.toggle}>{$audio.isPlaying ? '⏸' : '▶'}</button>
```

Package size: 0.4 kB gzip. The Lit chrome under the hood is 8.5 kB.
SvelteKit integration snippet in the repo covers the {#if browser}
hydration pattern.

Live demo: https://yamadablog.github.io/pulse-player/
GitHub: https://github.com/YamadaBlog/pulse-player

8 store contract tests. Curious if the no-.svelte-component decision
matches Svelte community norms — happy to be wrong on it.

```

## 4. Hacker News — Show HN (post AFTER npm publish)

**Title:** `Show HN: Pulse — a multi-framework music player (Vue, React, Svelte, Angular, WC)`

**Text (HN allows no body for Show HN with URL, but if posting as Text-only):**

```

Pulse is a drop-in music player I've been refactoring into a
multi-framework component over a focused audit-driven cycle.

What's in the box:

- Vue 3 reference build (14 kB gzip, v2.3.4 — production-stable)
- @pulse/react, @pulse/svelte, @pulse/web-component (3-9 kB gzip
  each, v3.0.0-rc.0)
- @pulse/angular shipped as a NgModule
- Shared audio engine (@pulse/core), shared tokens (@pulse/tokens)

Differentiators vs Plyr / Howler / Vidstack:

- Audio-only scope (smaller bundle than the multi-format players)
- 9 curated mood themes + ambient EQ + pulso heartbeat (chrome
  polish vs the system-standard Plyr / Vidstack defaults)
- Native multi-framework wrappers (not just React)

The comparison page on the repo is the honest "when to use Pulse vs
when not to" read — Pulse loses on adoption (1 day public), scale
(0 production users), feature breadth (no video, no HLS, no YouTube
embed). Where it wins is bundle size + visual identity.

132 unit tests + Playwright visual regression + Axe-core WCAG 2.1 AA
strict gate, all green on the public CI.

Live: https://yamadablog.github.io/pulse-player/
Walkthrough: https://youtu.be/q_FJ1GWaCc8
Repo: https://github.com/YamadaBlog/pulse-player

Feedback welcome — particularly on the API stability ahead of v3.0.0
stable.

```

## 5. dev.to article (long-form, ~1500 words)

**Title:** `Building a multi-framework music player — what I learned from 20 honest alphas`

**TL;DR:**

> I shipped a music player across Vue, React, Svelte, Angular, and Web Components in 20 alphas. Here's what the audit-driven cycle taught me about architecture, multi-framework consistency, and the honest cost of "going universal".

**Outline (full draft to write in the dev.to editor):**

1. The original (Vue v2.3.4) — what worked, why it shipped, why I refactored
2. The "going universal" choice — could have stayed Vue-only forever, why I didn't
3. The architecture that makes it work — single @pulse/core engine, single @pulse/tokens variants, framework wrappers as thin adapters
4. The brutal CTO audit cycle — every 24 hours, the audit told me what was real vs what I'd over-claimed. Examples: "CI is red since alpha.12" (alpha.14 fixed), "tests pass locally but not CI" (alpha.17 a11y triage), "0 stars on a 1-day-old repo is fine, stop self-evaluating at 9/10" (alpha.18)
5. The honest comparison vs alternatives — Plyr, Howler, Vidstack
6. The publishing decision — open MIT + GitHub Sponsors + optional premium themes later (the Tailwind / MUI / shadcn playbook)
7. What I'd do differently
8. Try it: GitHub + npm + YouTube + live demo

**End matter:** ask readers what they'd want from a "premium themes" tier if it shipped.

## 6. Bluesky thread (5 posts max, 300 chars each)

**Post 1 (hero):**

> Just shipped Pulse — a drop-in music player for Vue, React, Svelte, Angular + Web Components.
>
> 9 themes. Ambient EQ. Pulso heartbeat. Drag-to-resize. FAB radial menu. 14 kB gzip (Vue lib).
>
> Live: https://yamadablog.github.io/pulse-player/

**Post 2 (motion):**

> The chrome's signature move: every visible dimension scales from ONE CSS variable.
>
> A ResizeObserver writes --pulse-scale on the host. Artwork, title, icons, padding, EQ bars all breathe together. Three responsive states: 220 / 130 / 110 px.
>
> No media queries. No layout breaks.

**Post 3 (multi-framework):**

> @pulse/react (1 kB gzip wrapper) + @pulse/svelte (0.4 kB hook) + @pulse/web-component (8 kB chrome) + @pulse/angular (NgModule).
>
> Vue stays as the v2.3.4 reference — 16 alphas, bit-for-bit identical. The migration is dual-track.

**Post 4 (honest):**

> Comparison page lists when NOT to use Pulse: media platforms at scale (use Vidstack), audio editors (use WaveSurfer), 3D games (use Howler).
>
> Pulse wins on bundle size + chrome polish for portfolio / content / landing pages.

**Post 5 (CTA):**

> Repo: https://github.com/YamadaBlog/pulse-player
> 3-min demo: https://youtu.be/q_FJ1GWaCc8
> Free + MIT. GitHub Sponsors if it helps. Feedback welcome.

## 7. Twitter / X thread (5 posts, 280 chars each)

Same content as Bluesky thread, ~5-10 % shorter per post to fit 280 chars. Tag #vuejs #react #svelte #typescript #opensource on the last post.

## When to post

| Channel | When |
| --- | --- |
| `npm publish @pulse/*` | Day 0 |
| GitHub Discussions "rc.0 feedback" | Day 0 |
| Reddit r/vuejs | Day 0 + 1 hour |
| Reddit r/reactjs | Day 0 + 4 hours (avoid double-posting) |
| Reddit r/sveltejs | Day 0 + 8 hours |
| Hacker News Show HN | Day 1 morning (US ET, ~9 AM) |
| Bluesky thread | Day 0 + 30 min |
| Twitter / X thread | Day 0 + 1 hour (parallel to Bluesky) |
| dev.to article | Day 1-3 (write longform after first feedback) |
| Discord / Slack communities you're already in | Day 0 (informal) |

## What not to do

- Don't post the same identical text in 4 subreddits within an hour — Reddit's spam filter triggers and bans the account.
- Don't pin "Sponsor me" or pricing in the Day 0 launch posts. The launch is for adoption signal; monetisation comes ~6 months later per `LICENSING.md` §3.
- Don't reply to negative feedback with defence. Read it, acknowledge it, fix it in the next rc patch. The audit-driven cycle is the brand — leaning into honest critique makes it stronger.
- Don't promise features that aren't shipped. RN runtime is documented as deferred — keep it that way until the renderer actually exists.

## Stars / downloads target

| Time | Star target | npm dl/week target | Action if missed |
| --- | --- | --- | --- |
| Day 7 | 50 | 200 | Re-evaluate landing message — what's confusing? |
| Day 30 | 200 | 2 000 | If under 50: rename consideration (Option C from RENAMING_DECISION.md) |
| Day 90 | 1 000 | 10 000 | If under 200: the niche is wrong, pivot or sunset |

Honest baseline: most indie OSS music components don't hit 1 K stars in 90 days. That's fine. Pulse's strategic upside is the multi-framework architecture, which compounds over years not months.
```
