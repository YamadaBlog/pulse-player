<script setup lang="ts">
import { ref } from 'vue'
import { PulseFab, type FabPlacement } from '@pulse-music/vue'
import { look } from './lib/site'
import AccessibilitySection from './components/AccessibilitySection.vue'
import FabSection from './components/FabSection.vue'
import FrameworksSection from './components/FrameworksSection.vue'
import HeroSection from './components/HeroSection.vue'
import PlaygroundSection from './components/PlaygroundSection.vue'
import SiteFooter from './components/SiteFooter.vue'
import SiteNav from './components/SiteNav.vue'
import SizesSection from './components/SizesSection.vue'
import ThemesSection from './components/ThemesSection.vue'

const fab = ref<{ placement: FabPlacement; pulso: boolean }>({
  placement: 'bottom-end',
  pulso: true,
})
</script>

<template>
  <SiteNav />
  <main id="main" tabindex="-1">
    <HeroSection />
    <PlaygroundSection />
    <SizesSection />
    <ThemesSection />
    <FabSection v-model="fab" />
    <AccessibilitySection />
    <FrameworksSection />
  </main>
  <SiteFooter />

  <!-- The page-wide mini player: shares the session with every player above. -->
  <PulseFab
    :variant="look.variant"
    :accent-color="look.accent ?? undefined"
    :placement="fab.placement"
    :pulso="fab.pulso"
  />
</template>

<style>
main:focus {
  outline: none;
}
</style>
