import { frame, subscribeFrames } from './audio'
import { createSurface, hexToRgb } from './gl'
import { $, onPage, reducedMotion, whileVisible } from './lifecycle'

const BANDS = 24
const ROWS = 48

/**
 * Ridgelines of the live spectrum — an Unknown Pleasures homage. Each
 * line is one past frame (newest in front); lines hide the ones behind
 * them, so the shader walks front → back and stops at the first hit.
 */
const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform vec2 uRes;
uniform sampler2D uHist;
uniform float uHead;
uniform vec3 uBg;
uniform vec3 uInk;
uniform vec3 uAccent;

// The row count is a uniform, not a constant: a constant-bound loop is
// unrolled by the Direct3D compiler (ANGLE), which then takes seconds.
uniform int uN;

float hash(float n) { return fract(sin(n) * 43758.5453); }
// Continuous value noise: a stepped hash turns each line into a staircase.
float vnoise(float x, float seed) {
  float i = floor(x);
  float f = fract(x);
  return mix(hash(i + seed), hash(i + 1.0 + seed), f * f * (3.0 - 2.0 * f));
}

float sampleRow(float x, float age) {
  float row = mod(uHead - age + ${ROWS}.0, ${ROWS}.0);
  float f = abs(x - 0.5) * 2.0;
  float band = (1.0 - f) * ${BANDS - 1}.0;
  return texture(uHist, vec2((band + 0.5) / ${BANDS}.0, (row + 0.5) / ${ROWS}.0)).r;
}

float ridge(float x, float fi, float base) {
  float env = exp(-pow((x - 0.5) / 0.19, 2.0));
  float v = sampleRow(x, fi);
  float jitter = (vnoise(x * 140.0, fi * 13.0) - 0.5) * 0.012 * env;
  return base + (v * 0.22 + jitter + 0.004) * env * (0.4 + 0.6 * smoothstep(0.0, 0.06, v + 0.02));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  float x = (uv.x - 0.5) * aspect / min(aspect, 1.6) + 0.5;
  float px = 1.0 / uRes.y;
  vec3 col = uBg;
  if (x > 0.06 && x < 0.94) {
    float N = float(uN);
    float spacing = 0.76 / N;
    // x → screen pixels, for slopes measured on screen.
    float dx = 0.0015;
    float toPx = dx * min(aspect, 1.6);
    for (int i = 0; i < uN; i++) {
      float fi = float(i);
      float base = 0.1 + fi * spacing;
      float y = ridge(x, fi, base);
      if (uv.y < y - 1.4 * px) break;               // hidden under this ridge's fill
      // Distance across the line, not just vertically: steep flanks keep
      // their width instead of breaking into dashes.
      float slope = (ridge(x + dx, fi, base) - y) / toPx;
      float d = abs(uv.y - y) / sqrt(1.0 + slope * slope);
      if (d < 1.4 * px) {
        float fade = 1.0 - fi / N * 0.72;
        vec3 ink = mix(uAccent, uInk, smoothstep(0.0, 4.0, fi));
        col = mix(uBg, ink, fade * smoothstep(1.4 * px, 0.2 * px, d));
        break;
      }
    }
  }
  outColor = vec4(col, 1.0);
}`

onPage(() => {
  const host = $('[data-ridges]')
  const canvas = host?.querySelector('canvas')
  if (!host || !canvas) return
  // Nothing is created at load: the context, the program and its
  // compilation wait for the first quiet moment after the opening (so the
  // GPU's compile never lands in the middle of a scroll), or for the
  // landscape to come within a screen and a half — whichever is first.
  let teardown: (() => void) | null = null
  const create = (): void => {
    if (teardown) return
    near.disconnect()
    teardown = setup(host, canvas)
  }
  const near = new IntersectionObserver(([entry]) => entry?.isIntersecting && create(), {
    rootMargin: '150% 0px',
  })
  near.observe(host)
  const idle = (cb: () => void): number =>
    typeof requestIdleCallback === 'function'
      ? requestIdleCallback(cb, { timeout: 2000 })
      : window.setTimeout(cb, 200)
  let idleId = 0
  const early = window.setTimeout(() => (idleId = idle(create)), 3500)
  return () => {
    clearTimeout(early)
    if (typeof cancelIdleCallback === 'function') cancelIdleCallback(idleId)
    near.disconnect()
    teardown?.()
  }
})

function setup(host: HTMLElement, canvas: HTMLCanvasElement): () => void {
  let surface: ReturnType<typeof createSurface> = null
  try {
    surface = createSurface(canvas, FRAG, 1.5)
  } catch (error) {
    console.warn('[pulse-site] ridges disabled:', error)
  }
  if (!surface) {
    host.classList.add('is-fallback')
    return () => undefined
  }
  const s = surface
  const { gl } = s
  let alive = true
  let stop: () => void = () => undefined
  let tex: WebGLTexture | null = null

  // The canvas's size, observed rather than read every frame.
  let size: [number, number] = [canvas.clientWidth, canvas.clientHeight]
  let sized = true
  const ro = new ResizeObserver(([e]) => {
    if (!e) return
    size = [e.contentRect.width, e.contentRect.height]
    sized = true
  })
  ro.observe(canvas)

  s.ready
    .then(() => {
      if (!alive) return
      host.classList.add('is-live')
      tex = gl.createTexture()
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, BANDS, ROWS, 0, gl.RED, gl.UNSIGNED_BYTE, history)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.uniform1i(s.u('uHist'), 1)
      gl.uniform1i(s.u('uN'), ROWS - 6)
      gl.uniform3fv(s.u('uBg'), hexToRgb('#0c0b0a'))
      gl.uniform3fv(s.u('uInk'), hexToRgb('#ece7dc'))
      gl.uniform3fv(s.u('uAccent'), hexToRgb('#ff4f1a'))
      // Seed the history so the first paint already reads as a landscape.
      for (let i = 0; i < ROWS; i++) push(i * 400)
      draw()
      stop = whileVisible(host, () => {
        if (reducedMotion()) {
          draw()
          return () => undefined
        }
        const off = subscribeFrames(() => undefined)
        raf = requestAnimationFrame(loop)
        return () => {
          cancelAnimationFrame(raf)
          off()
        }
      })
    })
    .catch((error: unknown) => {
      console.warn('[pulse-site] ridges disabled:', error)
      host.classList.add('is-fallback')
    })

  const history = new Uint8Array(BANDS * ROWS)
  let head = 0
  let lastPush = 0
  const row = new Uint8Array(BANDS)
  const idle = (t: number, i: number): number =>
    0.05 + 0.04 * Math.sin(t * 0.8 + i * 0.7) * Math.sin(t * 0.37 + i)

  function push(now: number): void {
    for (let i = 0; i < BANDS; i++) {
      const live = frame.live ? (frame.bands[i] ?? 0) : 0
      row[i] = Math.round(Math.min(1, Math.max(live, idle(now / 1000, i))) * 255)
    }
    head = (head + 1) % ROWS
    gl.activeTexture(gl.TEXTURE1)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, head, BANDS, 1, gl.RED, gl.UNSIGNED_BYTE, row)
  }

  function draw(): void {
    if (sized) {
      const d = Math.min(devicePixelRatio || 1, 1.5)
      const w = Math.max(1, Math.round(size[0] * d))
      const h = Math.max(1, Math.round(size[1] * d))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
      sized = false
    }
    gl.uniform2f(s.u('uRes'), canvas.width, canvas.height)
    gl.uniform1f(s.u('uHead'), head)
    s.draw()
  }

  // The picture only changes when a row arrives (~24 per second: the
  // landscape scrolls at a musical pace) or the canvas is resized — so it
  // is drawn then, not on every display frame.
  let raf = 0
  const loop = (now: number): void => {
    let changed = sized
    if (now - lastPush > 42) {
      push(now)
      lastPush = now
      changed = true
    }
    if (changed) draw()
    raf = requestAnimationFrame(loop)
  }

  return () => {
    alive = false
    stop()
    cancelAnimationFrame(raf)
    ro.disconnect()
    if (tex) gl.deleteTexture(tex)
    s.dispose()
  }
}
