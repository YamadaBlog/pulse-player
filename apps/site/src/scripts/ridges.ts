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
uniform float uTime;

const int N = ${ROWS - 6};

float hash(float n) { return fract(sin(n) * 43758.5453); }

float sampleRow(float x, float age) {
  float row = mod(uHead - age + ${ROWS}.0, ${ROWS}.0);
  float f = abs(x - 0.5) * 2.0;
  float band = (1.0 - f) * ${BANDS - 1}.0;
  return texture(uHist, vec2((band + 0.5) / ${BANDS}.0, (row + 0.5) / ${ROWS}.0)).r;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  float x = (uv.x - 0.5) * aspect / min(aspect, 1.6) + 0.5;
  float px = 1.0 / uRes.y;
  vec3 col = uBg;
  if (x > 0.06 && x < 0.94) {
    float env = exp(-pow((x - 0.5) / 0.19, 2.0));
    float spacing = 0.76 / float(N);
    for (int i = 0; i < N; i++) {
      float fi = float(i);
      float base = 0.1 + fi * spacing;
      float v = sampleRow(x, fi);
      float jitter = (hash(floor(x * 140.0) + fi * 13.0) - 0.5) * 0.012 * env;
      float y = base + (v * 0.22 + jitter + 0.004) * env * (0.4 + 0.6 * smoothstep(0.0, 0.06, v + 0.02));
      if (uv.y < y - 1.4 * px) break;               // hidden under this ridge's fill
      float d = abs(uv.y - y);
      if (d < 1.4 * px) {
        float fade = 1.0 - fi / float(N) * 0.72;
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
  let surface: ReturnType<typeof createSurface> = null
  try {
    surface = createSurface(canvas, FRAG, 1.75)
  } catch (error) {
    console.warn('[pulse-site] ridges disabled:', error)
  }
  if (!surface) {
    host.classList.add('is-fallback')
    return
  }
  const s = surface
  const { gl } = s
  host.classList.add('is-live')

  const history = new Uint8Array(BANDS * ROWS)
  const tex = gl.createTexture()
  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, BANDS, ROWS, 0, gl.RED, gl.UNSIGNED_BYTE, history)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.uniform1i(s.u('uHist'), 1)
  gl.uniform3fv(s.u('uBg'), hexToRgb('#0c0b0a'))
  gl.uniform3fv(s.u('uInk'), hexToRgb('#ece7dc'))
  gl.uniform3fv(s.u('uAccent'), hexToRgb('#ff4f1a'))

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

  function render(now: number): void {
    // ~24 rows per second: the landscape scrolls at a musical pace.
    if (now - lastPush > 42) {
      push(now)
      lastPush = now
    }
    s.resize()
    gl.uniform2f(s.u('uRes'), canvas!.width, canvas!.height)
    gl.uniform1f(s.u('uHead'), head)
    gl.uniform1f(s.u('uTime'), now / 1000)
    s.draw()
  }

  // Seed the history so the first paint already reads as a landscape.
  for (let i = 0; i < ROWS; i++) push(i * 400)

  let raf = 0
  const loop = (now: number): void => {
    render(now)
    raf = requestAnimationFrame(loop)
  }
  const stop = whileVisible(host, () => {
    if (reducedMotion()) {
      render(performance.now())
      return () => undefined
    }
    const off = subscribeFrames(() => undefined)
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      off()
    }
  })
  return () => {
    stop()
    gl.deleteTexture(tex)
    s.dispose()
  }
})
