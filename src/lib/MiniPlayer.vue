<script setup lang="ts">
/**
 * MiniPlayer — Floating circle FAB (Floating Action Button).
 *
 * A single round button in the bottom-right corner. Persistent across pages
 * via the global audio store. Tap to toggle play/pause. Long-press or
 * right-click opens a compact radial menu (next, close). Draggable. Swipe
 * down or right to dismiss.
 *
 * Renders only when `store.isVisible === true`. Teleports to `<body>` so it
 * is never clipped by parents.
 *
 * Props:
 *  - `variant`: visual preset. `'auto'` (default) uses the track cover art.
 *    Other presets ignore the cover and use a solid/gradient background.
 *  - `customBackground`: any CSS background value (used with `variant='custom'`).
 *  - `accentColor`: overrides the ring + EQ accent.
 *  - `size`: diameter in px. Defaults to 56. Min recommended 40.
 *  - `offset`: bottom/right offset in px. Defaults to `{ bottom: 32, right: 16 }`.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Play, Pause, SkipForward, X } from 'lucide-vue-next'
import { useAudioStore } from './useAudioStore'

export type MiniPlayerVariant =
  | 'auto'
  | 'transparent'
  | 'solid'
  | 'dark'
  | 'light'
  | 'sunset'
  | 'midnight'
  | 'aurora'
  | 'vinyl'
  | 'custom'

const props = withDefaults(defineProps<{
  variant?: MiniPlayerVariant
  customBackground?: string
  accentColor?: string
  size?: number
  offset?: { bottom?: number; right?: number }
  /** Persist the dragged position to localStorage under this key. Set to
   *  an empty string to disable persistence. */
  persistKey?: string
  /** Add a subtle pulse + audio-wave ripple around the FAB. Off by default. */
  pulso?: boolean
}>(), {
  variant: 'auto',
  size: 56,
  persistKey: 'pulse-player-fab-pos',
  pulso: false,
})

const store = useAudioStore()

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

  longPressTimer = setTimeout(() => {
    if (!hasMoved.value) openMenu()
  }, 500)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  const dx = e.clientX - dragStartMouse.x
  const dy = e.clientY - dragStartMouse.y
  // Threshold raised from 5 → 10 (Euclidean distance) so a tap with a
  // tiny mouse jitter still registers as a click instead of a drag.
  if (!hasMoved.value && Math.sqrt(dx * dx + dy * dy) > 10) {
    hasMoved.value = true
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null }
    menuOpen.value = false
  }
  // Free drag — no clamp. The user can pull the FAB anywhere, even off
  // the viewport. On release we check if it landed somewhere usable
  // (see onPointerUp).
  position.value = { x: dragStartPos.x + dx, y: dragStartPos.y + dy }
}

/** Returns true when the FAB at translate offset `p` is fully visible
 *  inside the viewport. */
function isFullyVisible(p: { x: number; y: number }): boolean {
  if (typeof window === 'undefined') return true
  const size = props.size
  const anchorRight = props.offset?.right ?? 16
  const anchorBottom = props.offset?.bottom ?? 32
  const left = window.innerWidth - anchorRight - size + p.x
  const top = window.innerHeight - anchorBottom - size + p.y
  return (
    left >= 0 &&
    top >= 0 &&
    left + size <= window.innerWidth &&
    top + size <= window.innerHeight
  )
}

function onPointerUp() {
  if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null }
  if (!isDragging.value) return
  isDragging.value = false

  if (!hasMoved.value) return

  // If the FAB was released somewhere where the user can't see / reach it,
  // snap it back to the original bottom-right anchor. This way the user
  // can drag freely (even outside the window) but never loses the FAB.
  if (!isFullyVisible(position.value)) {
    position.value = { x: 0, y: 0 }
    persistPosition()
    return
  }

  // Otherwise: KEEP the dragged position. Persist it so the FAB stays
  // put even after a page reload.
  persistPosition()
}

function persistPosition() {
  if (!props.persistKey || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(props.persistKey, JSON.stringify(position.value))
  } catch { /* private mode / quota — ignore */ }
}

function restorePosition() {
  if (!props.persistKey || typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(props.persistKey)
    if (!raw) return
    const parsed = JSON.parse(raw) as { x: number; y: number }
    if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') return
    // A saved position from a previously wider window could be off-screen
    // now. Snap back to bottom-right if so.
    position.value = isFullyVisible(parsed) ? parsed : { x: 0, y: 0 }
  } catch { /* corrupt entry — ignore */ }
}

// If the window resizes such that the FAB ends up off-screen, snap it
// back to the original bottom-right anchor.
function onWindowResize() {
  if (position.value.x === 0 && position.value.y === 0) return
  if (!isFullyVisible(position.value)) {
    position.value = { x: 0, y: 0 }
    persistPosition()
  }
}

function onContextMenu(e: Event) {
  e.preventDefault()
  openMenu()
}

// ═ PROGRESS RING — sized off `size` prop
const STROKE = 3
const RADIUS = computed(() => (props.size - STROKE) / 2)
const CIRCUMFERENCE = computed(() => 2 * Math.PI * RADIUS.value)
const ringOffset = computed(() => CIRCUMFERENCE.value - (store.progress / 100) * CIRCUMFERENCE.value)

const fabStyle = computed(() => {
  const base: Record<string, string> = {
    '--fab-size': props.size + 'px',
    '--fab-bottom': (props.offset?.bottom ?? 32) + 'px',
    '--fab-right': (props.offset?.right ?? 16) + 'px',
  }
  if (props.accentColor) base['--pulse-accent'] = props.accentColor
  if (props.variant === 'custom' && props.customBackground) {
    base['--pulse-custom-bg'] = props.customBackground
  }
  if (position.value.x !== 0 || position.value.y !== 0) {
    base.transform = `translate(${position.value.x}px, ${position.value.y}px)`
    base.transition = isDragging.value ? 'none' : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
  }
  return base
})

onMounted(() => {
  restorePosition()
  document.addEventListener('click', onDocClick)
  window.addEventListener('resize', onWindowResize)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('resize', onWindowResize)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fab-pop">
      <div
        v-if="store.isVisible"
        class="fab"
        :class="{
          'fab--dragging': isDragging,
          'fab--menu-open': menuOpen,
          'fab--pulso': pulso && store.isPlaying,
        }"
        :data-variant="variant"
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
          <!-- Cover art (auto variant only) -->
          <div v-if="variant === 'auto'" class="fab__cover">
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
            <Pause v-if="store.isPlaying" :size="Math.round(size * 0.36)" :stroke-width="2.5" />
            <Play v-else :size="Math.round(size * 0.36)" :stroke-width="2.5" :style="{ marginLeft: '2px' }" />
          </div>

          <span v-if="store.isPlaying" class="fab__eq">
            <i v-for="(v, idx) in store.eqBars" :key="idx" :style="{ height: Math.max(20, v * 100) + '%' }"></i>
          </span>

          <svg class="fab__ring" :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
            <circle
              class="fab__ring-track"
              :cx="size / 2" :cy="size / 2" :r="RADIUS"
              fill="none"
              :stroke-width="STROKE"
            />
            <circle
              class="fab__ring-progress"
              :cx="size / 2" :cy="size / 2" :r="RADIUS"
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
  bottom: var(--fab-bottom, 32px);
  right: var(--fab-right, 16px);
  z-index: 900;
  touch-action: none;
  user-select: none;
}
.fab--dragging { cursor: grabbing; }

/* ─── Pulso effect ──────────────────────────────────────────
   Heartbeat rhythm: lub-dub · pause · lub-dub · pause …
   Only active while audio is playing (the class is applied via
   `:class="{ 'fab--pulso': pulso && store.isPlaying }"` in the
   template), so the FAB is perfectly still when paused.

   Timing (1.4 s cycle):
     0 %  → 1st thump up
     11 % → 1st thump down (~150 ms)
     20 % → 2nd thump up
     31 % → 2nd thump down (~150 ms)
     31 → 100 % → long pause (~970 ms)
   A wave is emitted at each thump, in sync with the scale peak. */

/* Button heartbeat — subtle scale, two quick beats, then rest. */
.fab--pulso .fab__btn {
  animation: pulso-heartbeat 5s ease-out infinite;
}
.fab--pulso .fab__btn:hover { animation: none; transform: scale(1.06); }
.fab--pulso.fab--dragging .fab__btn { animation: none; }

@keyframes pulso-heartbeat {
  0%   { transform: scale(1); }
  6%   { transform: scale(1.05); }   /* lub */
  12%  { transform: scale(1); }
  20%  { transform: scale(1.05); }   /* dub */
  26%  { transform: scale(1); }
  100% { transform: scale(1); }      /* long pause */
}

/* Two waves — one per heartbeat thump. They live on the PARENT so
   the button's overflow: hidden never clips them. Light, transparent,
   they only flash for ~250 ms each time the FAB grows. */
.fab--pulso::before,
.fab--pulso::after {
  content: '';
  position: absolute;
  inset: 0;
  width: var(--fab-size, 56px);
  height: var(--fab-size, 56px);
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  pointer-events: none;
  opacity: 0;
  z-index: 1;
  animation: pulso-wave-lub 5s ease-out infinite;
}
/* Second ring fires on the "dub" beat instead. */
.fab--pulso::after { animation-name: pulso-wave-dub; }

@keyframes pulso-wave-lub {
  /* Wave appears at the lub thump and fades quickly. Stays dormant
     the rest of the cycle. */
  0%   { transform: scale(1);   opacity: 0.30; }
  20%  { transform: scale(1.7); opacity: 0; }
  100% { transform: scale(1.7); opacity: 0; }
}
@keyframes pulso-wave-dub {
  /* Same shape, fired at 14 % so it lines up with the second thump
     peak (which is at 20 %). */
  0%, 14%  { transform: scale(1);   opacity: 0; }
  14.01%   { transform: scale(1);   opacity: 0.30; }
  34%      { transform: scale(1.7); opacity: 0; }
  100%     { transform: scale(1.7); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .fab--pulso::before,
  .fab--pulso::after,
  .fab--pulso .fab__btn { animation: none; }
}
.fab__svg-defs { position: absolute; width: 0; height: 0; overflow: hidden; }

.fab__btn {
  position: relative;
  width: var(--fab-size, 56px);
  height: var(--fab-size, 56px);
  border-radius: 50%;
  border: none;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 0 24px rgba(61, 189, 167, 0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.5s ease;
}

/* Variant backgrounds (when no cover art is rendered) */
.fab[data-variant="transparent"] .fab__btn {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}
.fab[data-variant="solid"] .fab__btn { background: var(--pulse-bg, #14141a); }
.fab[data-variant="dark"]  .fab__btn { background: #0a0a0f; }
.fab[data-variant="light"] .fab__btn {
  background: #f4f4f7;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.18),
    0 0 0 1px rgba(0, 0, 0, 0.08);
}
.fab[data-variant="sunset"] .fab__btn {
  background: linear-gradient(135deg, #1A1410 0%, #2D241C 50%, #4A3527 100%);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(245, 158, 11, 0.25),
    0 0 28px rgba(245, 158, 11, 0.20);
}
.fab[data-variant="midnight"] .fab__btn {
  background: linear-gradient(135deg, #0a0a18 0%, #14142a 50%, #1a1a3a 100%);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(139, 92, 246, 0.22),
    0 0 28px rgba(139, 92, 246, 0.18);
}
.fab[data-variant="aurora"] .fab__btn {
  background: linear-gradient(135deg, #061a1a 0%, #0a2e2e 40%, #103040 100%);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(6, 182, 212, 0.22),
    0 0 28px rgba(6, 182, 212, 0.18);
}
.fab[data-variant="vinyl"] .fab__btn {
  background:
    radial-gradient(ellipse at 30% 20%, rgba(200, 169, 126, 0.10) 0%, transparent 60%),
    linear-gradient(135deg, #030302 0%, #0A0907 50%, #1A1712 100%);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(200, 169, 126, 0.28),
    0 0 28px rgba(200, 169, 126, 0.18);
}
.fab[data-variant="custom"] .fab__btn { background: var(--pulse-custom-bg, transparent); }

.fab__btn:hover {
  transform: scale(1.08);
  box-shadow:
    0 6px 28px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.18),
    0 0 32px rgba(61, 189, 167, 0.28);
}
.fab__btn:active { transform: scale(0.95); }
.fab__btn:focus-visible {
  outline: 2px solid var(--pulse-accent, #3DBDA7);
  outline-offset: 4px;
}

.fab__cover { position: absolute; inset: 0; border-radius: inherit; overflow: hidden; }
.fab__cover-img {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; opacity: 0; transition: opacity 0.5s ease;
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
  color: rgba(255, 255, 255, 0.92);
  z-index: 2;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5));
}
.fab[data-variant="light"] .fab__icon { color: #14141a; filter: none; }

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
.fab[data-variant="light"] .fab__ring-track { stroke: rgba(0, 0, 0, 0.10); }
.fab__ring-progress {
  stroke: var(--pulse-accent, #3DBDA7);
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
}

.fab__menu { position: absolute; inset: 0; pointer-events: none; }
.fab__menu-btn {
  position: absolute;
  width: 36px; height: 36px;
  border-radius: 50%;
  cursor: pointer;
  pointer-events: auto;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transition: all 0.15s ease;
}
.fab__menu-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.14); transform: scale(1.1); }
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
    bottom: calc(var(--fab-bottom, 88px) + env(safe-area-inset-bottom, 0px));
    right: calc(var(--fab-right, 12px));
  }
}
@media (prefers-reduced-motion: reduce) {
  .fab__eq i { transition: none; }
  .fab__btn, .fab__ring-progress { transition: none; }
  .fab-pop-enter-active, .fab-pop-leave-active { transition: opacity 0.1s; }
}
</style>
