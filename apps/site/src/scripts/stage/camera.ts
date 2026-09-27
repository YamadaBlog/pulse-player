/**
 * The stage's camera, described the way a shot is: where the record sits
 * in the frame and how big it looks (in CSS px), then where the camera
 * stands around it (azimuth, elevation, distance).
 *
 * Framing and angle are independent. The record's centre always projects
 * to (x, y), and its radius to r pixels, whatever the angle: the focal
 * length is r × distance (a dolly moves the camera and keeps the record's
 * size, like a dolly zoom). That is what lets the record sit exactly in a
 * DOM box at rest — the camera straight above, the page as the table —
 * and fly anywhere from there.
 *
 * World: y up, the floor (the page) is y = 0; seen from above, screen
 * right is +x and screen down is +z. The record's radius is 1.
 */
export interface Shot {
  x: number // record centre on screen, CSS px
  y: number
  r: number // record radius on screen, CSS px
  az: number // azimuth, rad (0: the camera on +z, or above with page-up = -z)
  el: number // elevation, rad (π/2: straight above)
  dist: number // eye to the record's centre, in radii
}

export type Vec3 = [number, number, number]

export interface Camera {
  eye: Vec3
  right: Vec3
  up: Vec3
  forward: Vec3
  focal: number // CSS px
  pp: [number, number] // CSS px
}

export function cameraFor(shot: Shot, target: Vec3): Camera {
  const { az, el, dist } = shot
  const ce = Math.cos(el)
  const dir: Vec3 = [ce * Math.sin(az), Math.sin(el), ce * Math.cos(az)]
  const eye: Vec3 = [
    target[0] + dir[0] * dist,
    target[1] + dir[1] * dist,
    target[2] + dir[2] * dist,
  ]
  const forward: Vec3 = [-dir[0], -dir[1], -dir[2]]
  const right: Vec3 = [Math.cos(az), 0, -Math.sin(az)]
  const up = cross(right, forward)
  return { eye, right, up, forward, focal: shot.r * dist, pp: [shot.x, shot.y] }
}

/** World point → CSS px on screen (and its depth; < 0 behind the camera). */
export function project(cam: Camera, p: Vec3): { x: number; y: number; depth: number } {
  const d: Vec3 = [p[0] - cam.eye[0], p[1] - cam.eye[1], p[2] - cam.eye[2]]
  const z = dot(d, cam.forward)
  const k = cam.focal / Math.max(z, 1e-4)
  return { x: cam.pp[0] + dot(d, cam.right) * k, y: cam.pp[1] - dot(d, cam.up) * k, depth: z }
}

/** CSS px on screen → the ray through it. */
export function rayAt(cam: Camera, x: number, y: number): { o: Vec3; d: Vec3 } {
  const sx = (x - cam.pp[0]) / cam.focal
  const sy = (y - cam.pp[1]) / cam.focal
  const d: Vec3 = [
    cam.right[0] * sx - cam.up[0] * sy + cam.forward[0],
    cam.right[1] * sx - cam.up[1] * sy + cam.forward[1],
    cam.right[2] * sx - cam.up[2] * sy + cam.forward[2],
  ]
  const l = Math.hypot(d[0], d[1], d[2])
  return { o: cam.eye, d: [d[0] / l, d[1] / l, d[2] / l] }
}

export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

/** Rotation matrix (column-major, for a mat3 uniform) about a unit axis. */
export function rotation(axis: Vec3, angle: number): number[] {
  const [x, y, z] = axis
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const t = 1 - c
  // Columns.
  return [
    t * x * x + c,
    t * x * y + s * z,
    t * x * z - s * y,
    t * x * y - s * z,
    t * y * y + c,
    t * y * z + s * x,
    t * x * z + s * y,
    t * y * z - s * x,
    t * z * z + c,
  ]
}

export function mul3(a: number[], b: number[]): number[] {
  const out = new Array<number>(9)
  for (let c = 0; c < 3; c++)
    for (let r = 0; r < 3; r++)
      out[c * 3 + r] = a[r] * b[c * 3] + a[3 + r] * b[c * 3 + 1] + a[6 + r] * b[c * 3 + 2]
  return out
}

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
