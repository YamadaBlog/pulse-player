import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
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

createApp(App).use(createPinia()).mount('#app')
