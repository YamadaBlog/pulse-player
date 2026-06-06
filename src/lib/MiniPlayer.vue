<script setup lang="ts">
/**
 * MiniPlayer — Floating circle FAB (Floating Action Button)
 *
 * A single round button in the bottom-right corner. Persistent across pages
 * via the global audio store. Tap to toggle play/pause. Long-press or
 * right-click opens a compact radial menu (next, close). Draggable. Swipe
 * down or right to dismiss.
 *
 * Renders only when `store.isVisible === true` (set by `store.toggle()` /
 * `store.open()`). Teleports to <body> so it's never clipped by parents.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Play, Pause, SkipForward, X } from 'lucide-vue-next'
import { useAudioStore } from './useAudioStore'

const store = useAudioStore()

// ═ MENU
const menuOpen = ref(false)

function togglePlay() {
  if (hasMoved.value) return
  if (menuOpen.value) { menuOpen.value = false; return }
  store.toggle()
}

function openMenu() { menuOpen.value = true }

function handleNext() {
  store.next()
  menuOpen.value = false
}

function handleClose() {
  store.close()
  menuOpen.value = false
  position.value = { x: 0, y: 0 }
}

// Close menu on outside click
function onDocClick(e: MouseEvent) {
  if (menuOpen.value && !(e.target as HTMLElement).closest('.fab')) {
    menuOpen.value = false
  }
}

// ═ DRAG
const isDragging = ref(false)
const position = ref({ x: 0, y: 0 })
const hasMoved = ref(false)
let dragStartPos = { x: 0, y: 0 }
let dragStartMouse = { x: 0, y: 0 }
let longPressTimer: ReturnType<typeof setTimeout> | null = null

function onPointerDown(e: PointerEvent) {
  if ((e.target as HTMLElement).closest('.fab__menu')) return
  isDragging.value = true
  hasMoved.value = false
  dragStartMouse = { x: e.clientX, y: e.clientY }
  dragStartPos = { ...position.value }
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)

  // Long press to open menu
  longPressTimer = setTimeout(() => {
    if (!hasMoved.value) openMenu()
  }, 500)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  const dx = e.clientX - dragStartMouse.x
  const dy = e.clientY - dragStartMouse.y
  if (!hasMoved.value && Math.abs(dx) + Math.abs(dy) > 5) {
    hasMoved.value = true
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null }
    menuOpen.value = false
  }
  position.value = { x: dragStartPos.x + dx, y: dragStartPos.y + dy }
}

function onPointerUp() {
  if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null }
  if (!isDragging.value) return
  isDragging.value = false

  // Swipe down or right to dismiss
  const dx = position.value.x - dragStartPos.x
  const dy = position.value.y - dragStartPos.y
  if ((dy > 80 || dx > 80) && hasMoved.value) {
    store.close()
    position.value = { x: 0, y: 0 }
    return
  }

  // Snap back if not moved much
  if (!hasMoved.value) return
  position.value = { x: 0, y: 0 }
}

function onContextMenu(e: Event) {
  e.preventDefault()
  openMenu()
}

// ═ PROGRESS RING
const SIZE = 56
const STROKE = 3
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const ringOffset = computed(() => CIRCUMFERENCE - (store.progress / 100) * CIRCUMFERENCE)

const fabStyle = computed(() => {
  const base: Record<string, string> = {}
  if (position.value.x !== 0 || position.value.y !== 0) {
    base.transform = `translate(${position.value.x}px, ${position.value.y}px)`
    base.transition = isDragging.value ? 'none' : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
  }
  return base
})

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <Teleport to="body">
    <Transition name="fab-pop">
      <div
        v-if="store.isVisible"
        class="fab"
        :class="{ 'fab--dragging': isDragging, 'fab--menu-open': menuOpen }"
        :style="fabStyle"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @contextmenu="onContextMenu"
      >
        <svg class="fab__svg-defs" aria-hidden="true">
          <defs>
            <filter id="pulseFabNoise">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
              <feBlend in="SourceGraphic" mode="multiply" />
            </filter>
          </defs>
        </svg>

        <button
          class="fab__btn"
          @click="togglePlay"
          :aria-label="store.isPlaying ? 'Pause' : 'Play'"
        >
          <div class="fab__cover">
            <img
              v-for="(t, i) in store.tracks"
              :key="t.cover"
              :src="t.cover"
              alt=""
              class="fab__cover-img"
              :class="{ 'fab__cover-img--active': store.currentTrack === i }"
              :style="{ objectPosition: t.coverPos }"
            />
            <div class="fab__overlay"></div>
            <div class="fab__noise"></div>
          </div>

          <div class="fab__icon">
            <Pause v-if="store.isPlaying" :size="20" :stroke-width="2.5" />
            <Play v-else :size="20" :stroke-width="2.5" style="margin-left: 2px;" />
          </div>

          <span v-if="store.isPlaying" class="fab__eq">
            <i v-for="(v, idx) in store.eqBars" :key="idx" :style="{ height: Math.max(20, v * 100) + '%' }"></i>
          </span>

          <svg class="fab__ring" :width="SIZE" :height="SIZE" viewBox="0 0 56 56">
            <circle
              class="fab__ring-track"
              :cx="SIZE / 2" :cy="SIZE / 2" :r="RADIUS"
              fill="none"
              :stroke-width="STROKE"
            />
            <circle
              class="fab__ring-progress"
              :cx="SIZE / 2" :cy="SIZE / 2" :r="RADIUS"
              fill="none"
              :stroke-width="STROKE"
              :stroke-dasharray="CIRCUMFERENCE"
              :stroke-dashoffset="ringOffset"
            />
          </svg>
        </button>

        <Transition name="menu-pop">
          <div v-if="menuOpen" class="fab__menu">
            <button class="fab__menu-btn fab__menu-btn--next" @click.stop="handleNext" aria-label="Next">
              <SkipForward :size="14" />
            </button>
            <button class="fab__menu-btn fab__menu-btn--close" @click.stop="handleClose" aria-label="Close">
              <X :size="14" />
            </button>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fab {
  position: fixed;
  bottom: 32px;
  right: 16px;
  z-index: 900;
  touch-action: none;
  user-select: none;
}
.fab--dragging { cursor: grabbing; }
.fab__svg-defs { position: absolute; width: 0; height: 0; overflow: hidden; }

.fab__btn {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 0 24px rgba(61, 189, 167, 0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.fab__btn:hover {
  transform: scale(1.08);
  box-shadow:
    0 6px 28px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.15),
    0 0 32px rgba(61, 189, 167, 0.25);
}
.fab__btn:active { transform: scale(0.95); }

.fab__cover { position: absolute; inset: 0; border-radius: inherit; overflow: hidden; }
.fab__cover-img {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; opacity: 0; transition: opacity 0.3s ease;
}
.fab__cover-img--active { opacity: 1; }

.fab__overlay {
  position: absolute; inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
.fab__noise {
  position: absolute; inset: 0;
  filter: url(#pulseFabNoise);
  opacity: 0.12;
  pointer-events: none;
}

.fab__icon {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255, 255, 255, 0.9);
  z-index: 2;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5));
}

.fab__eq {
  position: absolute;
  bottom: 6px; left: 50%;
  transform: translateX(-50%);
  display: flex; align-items: flex-end;
  gap: 1.5px;
  height: 8px;
  z-index: 2;
}
.fab__eq i {
  display: block; width: 2px;
  border-radius: 1px;
  background: var(--pulse-accent, #3DBDA7);
  transition: height 0.08s linear;
}

.fab__ring {
  position: absolute; top: 0; left: 0;
  pointer-events: none;
  z-index: 3;
  transform: rotate(-90deg);
}
.fab__ring-track { stroke: rgba(255, 255, 255, 0.08); }
.fab__ring-progress {
  stroke: var(--pulse-accent, #3DBDA7);
  stroke-linecap: round;
  transition: stroke-dashoffset 0.3s ease;
}

.fab__menu { position: absolute; inset: 0; pointer-events: none; }
.fab__menu-btn {
  position: absolute;
  width: 36px; height: 36px;
  border-radius: 50%;
  cursor: pointer;
  pointer-events: auto;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transition: all 0.15s ease;
}
.fab__menu-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.12); transform: scale(1.1); }
.fab__menu-btn--next { top: -10px; left: -40px; }
.fab__menu-btn--close { top: -10px; right: -40px; }
.fab__menu-btn--close:hover { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }

.fab-pop-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.fab-pop-leave-active { transition: all 0.2s ease-in; }
.fab-pop-enter-from { opacity: 0; transform: scale(0.3); }
.fab-pop-leave-to { opacity: 0; transform: scale(0.5) translateY(20px); }

.menu-pop-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.menu-pop-leave-active { transition: all 0.15s ease-in; }
.menu-pop-enter-from { opacity: 0; }
.menu-pop-enter-from .fab__menu-btn--next { transform: translate(20px, 10px) scale(0.5); }
.menu-pop-enter-from .fab__menu-btn--close { transform: translate(-20px, 10px) scale(0.5); }
.menu-pop-leave-to { opacity: 0; }

@media (max-width: 767px) {
  .fab {
    bottom: calc(88px + env(safe-area-inset-bottom, 0px));
    right: 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .fab__eq i { transition: none; }
  .fab-pop-enter-active, .fab-pop-leave-active { transition: opacity 0.1s; }
}
</style>
