import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { setAudioTracks } from './lib'
// alpha.34 — premium gradient overlays for the 4 mood variants.
// Loaded AFTER `src/lib/shared/variants.css` (which Vue imports via
// `src/lib/index.ts` when MusicPlayer mounts) so this file's
// re-declaration of `--variant-bg-gradient` wins the cascade.
import './styles/variants-premium.css'
// alpha.35 — large-screen densification (Pick a mood 3-col cap on 2K/4K,
// fluid typo for FAB chips/footer, section--narrow breathing). Loads
// AFTER variants-premium so its @media min-width rules win at the same
// specificity.
import './styles/responsive-fix.css'
// alpha.37 — unified halo / glow system (CSS tokens + `.glow-frame`
// utility + `:has(.mp[data-variant])` auto-applied accent washes on
// known mood-bearing containers + premium layered box-shadows).
// Loads LAST so it can override the variants-premium.css single-glow
// rule with the new multi-layer shadow stack.
import './styles/glow-system.css'

// ─── Demo playlist (audit round-5 — fixes the public Pages vitrine) ──
//
// The library's DEFAULT_TRACKS use root-absolute paths ('/audio/…')
// which break under any sub-path deployment : on GitHub Pages
// (https://yamadablog.github.io/pulse-player/) the players requested
// https://yamadablog.github.io/audio/cover.webp → 404 → native
// broken-image icon in the hero of the public demo, 10-15 console
// errors per visit.
//
// Fix — two combined moves, ZERO change to src/lib/ :
//   1. `setAudioTracks()` (public lib API) re-points the playlist at
//      `import.meta.env.BASE_URL`-aware paths, so any base
//      ('/', '/pulse-player/', a fork's own path) resolves correctly.
//   2. Covers are environment-split :
//        - dev server → the maintainer's local .webp covers
//          (provenance undocumented → gitignored, NEVER distributed ;
//          see NOTICE.md §3).
//        - any build (Pages, previews, forks) → original SVG covers
//          COMMITTED in public/audio/*.svg — in-tree creations, MIT
//          like the rest of the source, legally deployable.
//      Audio (.webm) stays BASE_URL-pathed in both modes : present
//      locally after `npm run setup:demo-audio`, intentionally absent
//      on Pages (the play Promise rejection is handled by the store's
//      safePlay()).
const base = import.meta.env.BASE_URL
const coverExt = import.meta.env.DEV ? 'webp' : 'svg'
setAudioTracks([
  {
    title: 'MIDNIGHT RUN',
    src: `${base}audio/track1.webm`,
    cover: `${base}audio/cover.${coverExt}`,
    coverPos: import.meta.env.DEV ? '20% center' : '50% 50%',
  },
  {
    title: 'DEEP FOCUS',
    src: `${base}audio/track2.webm`,
    cover: `${base}audio/cover2.${coverExt}`,
    coverPos: import.meta.env.DEV ? '50% 60%' : '50% 50%',
    coverScale: import.meta.env.DEV ? 1.25 : undefined,
  },
])

createApp(App).use(createPinia()).mount('#app')
