import { hexToRgb, createSurface, uploadTexture } from './gl'
import { drawLabel, drawLabelB } from './record-label'
import { RECORD_FRAG } from './record-shader'

/**
 * The hero's record, again — for the interlude, where it is turned over to
 * side B. Same shader, same labels: the object carries the story from one
 * chapter to the next. Rendered on demand (only while it turns).
 */
export interface FlipRecord {
  draw(flip: number): void
  ready: Promise<void>
  dispose(): void
}

const SCALE = 0.8 // disc radius / half-canvas: leaves room for the shadow

export function createFlipRecord(canvas: HTMLCanvasElement): FlipRecord | null {
  let s: ReturnType<typeof createSurface> = null
  try {
    s = createSurface(canvas, RECORD_FRAG)
  } catch (error) {
    console.warn('[pulse-site] interlude record disabled:', error)
  }
  if (!s) return null
  const surface = s
  const { gl } = surface
  gl.uniform1f(surface.u('uScale'), SCALE)
  gl.uniform3fv(surface.u('uAccent'), hexToRgb('#ff4f1a'))
  gl.uniform1fv(surface.u('uBands'), new Float32Array(24))
  gl.uniform1f(surface.u('uPlaying'), 0.35)
  let flip = 0
  const draw = (f: number): void => {
    flip = f
    surface.resize()
    gl.uniform2f(surface.u('uRes'), surface.canvas.width, surface.canvas.height)
    gl.uniform1f(surface.u('uFlip'), f)
    // The record lifts a little as it turns, so the turn reads in depth.
    gl.uniform2f(surface.u('uTilt'), 0, 0.22 * Math.sin(f))
    gl.uniform1f(surface.u('uRot'), 0)
    gl.uniform1f(surface.u('uLight'), 2.2 - f * 0.35)
    surface.draw()
  }
  const ready = Promise.all([drawLabel(), drawLabelB()]).then(([a, b]) => {
    uploadTexture(gl, a, 0, null)
    uploadTexture(gl, b, 1, null)
    gl.uniform1i(surface.u('uLabel'), 0)
    gl.uniform1i(surface.u('uLabelB'), 1)
    draw(flip)
  })
  return { draw, ready, dispose: () => surface.dispose() }
}
