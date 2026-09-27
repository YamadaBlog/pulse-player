/**
 * The stage: one record on a sheet of paper, seen through a real camera.
 *
 * The page is the table. Seen straight from above (the camera's rest), the
 * floor is the page's own paper and the record lies on it exactly where the
 * layout puts it; lift the camera and the page becomes a floor that runs to
 * a horizon, the record gets its thickness and its shadow, and the tonearm
 * stands on the table beside it.
 *
 * Everything is analytic — a cylinder, a few capsules and a plane, one
 * full-screen pass, no marching — so it stays cheap at full resolution:
 *   - the record: grooves that follow the live spectrum, an anisotropic
 *     sheen computed from the real light and eye (it pivots as the camera
 *     moves, like a real record's does), paper labels on both sides, a
 *     glossy rim, the arm's shadow;
 *   - the tonearm: base, pin, tube and headshell, lifted or down;
 *   - the floor: paper, soft analytic shadows of the disc and the arm, a
 *     contact shadow, the night spreading from under the record like ink,
 *     and fog towards the horizon when the camera looks across it.
 */
export const STAGE_FRAG = `#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2 uRes;       // canvas, device px
uniform vec2 uPP;        // principal point, device px from the top-left
uniform float uFocal;    // focal length, device px
uniform vec3 uEye;
uniform mat3 uCam;       // columns: right, up, forward
uniform mat3 uRec;       // record orientation, local -> world (Y = side A's normal)
uniform vec3 uRecPos;
uniform float uRot;      // spin
uniform vec2 uArm;       // x: swing (rad, clockwise seen from above), y: lift 0..1
uniform vec3 uPivot;     // tonearm base, on the floor
uniform float uArmOn;
uniform int uSamples;    // 4: a uniform, so the compiler keeps one copy of the loop
uniform vec3 uArmBox;   // the tonearm on screen: centre (device px, from the top left), radius
uniform vec3 uLight;     // direction to the key light (shading, shadows)
uniform vec3 uSheenL;    // the light the grooves catch (follows the hand)
uniform vec3 uPaper;
uniform vec3 uInk;       // the night
uniform float uFlood;    // radius of the night on the floor (world), < 0: none
uniform float uDepth;    // 0: the flat page .. 1: a room (fog, vignette, falloff)
uniform vec3 uFog;
uniform vec3 uLightCol;  // the key light's colour (white on the page)
uniform float uGlow;     // a pool of that light around the record (0 on the page)
uniform float uTime;
uniform float uBands[24];
uniform float uEnergy;
uniform vec3 uAccent;
uniform float uProgress;
uniform float uPlaying;
uniform sampler2D uLabel;
uniform sampler2D uLabelB;
uniform vec3 uRing;      // record-local (x, z) of the ring's centre, radius
uniform float uRingA;

const float PI = 3.14159265;
const float T = 0.02;            // thickness (the radius is 1)
const float LABEL_R = 0.335;
const float GROOVE_IN = 0.36;
const float GROOVE_OUT = 0.962;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float band(float i) {
  float f = clamp(i, 0.0, 23.0);
  int a = int(floor(f));
  int b = min(a + 1, 23);
  return mix(uBands[a], uBands[b], fract(f));
}

// ─── Intersections (Inigo Quilez's analytic forms) ─────────────────
// Capped cylinder from pa to pb, radius ra: (t, normal) or t < 0.
vec4 iCylinder(vec3 ro, vec3 rd, vec3 pa, vec3 pb, float ra) {
  vec3 ba = pb - pa;
  vec3 oc = ro - pa;
  float baba = dot(ba, ba);
  float bard = dot(ba, rd);
  float baoc = dot(ba, oc);
  float k2 = baba - bard * bard;
  float k1 = baba * dot(oc, rd) - baoc * bard;
  float k0 = baba * dot(oc, oc) - baoc * baoc - ra * ra * baba;
  float h = k1 * k1 - k2 * k0;
  if (h < 0.0) return vec4(-1.0);
  h = sqrt(h);
  float t = (-k1 - h) / k2;
  float y = baoc + t * bard;
  if (y > 0.0 && y < baba) return vec4(t, (oc + t * rd - ba * y / baba) / ra);
  t = (((y < 0.0) ? 0.0 : baba) - baoc) / bard;
  if (abs(k1 + k2 * t) < h) return vec4(t, ba * sign(y) / sqrt(baba));
  return vec4(-1.0);
}
// Capsule: t or < 0.
float iCapsule(vec3 ro, vec3 rd, vec3 pa, vec3 pb, float r) {
  vec3 ba = pb - pa;
  vec3 oa = ro - pa;
  float baba = dot(ba, ba);
  float bard = dot(ba, rd);
  float baoa = dot(ba, oa);
  float rdoa = dot(rd, oa);
  float oaoa = dot(oa, oa);
  float a = baba - bard * bard;
  float b = baba * rdoa - baoa * bard;
  float c = baba * oaoa - baoa * baoa - r * r * baba;
  float h = b * b - a * c;
  if (h >= 0.0) {
    float t = (-b - sqrt(h)) / a;
    float y = baoa + t * bard;
    if (y > 0.0 && y < baba) return t;
    vec3 oc = (y <= 0.0) ? oa : ro - pb;
    b = dot(rd, oc);
    c = dot(oc, oc) - r * r;
    h = b * b - c;
    if (h > 0.0) return -b - sqrt(h);
  }
  return -1.0;
}
vec3 nCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 ba = b - a;
  vec3 pa = p - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return (pa - h * ba) / r;
}
// Closest approach of a ray to a segment: (distance, ray t).
vec2 raySeg(vec3 ro, vec3 rd, vec3 a, vec3 b) {
  vec3 ba = b - a;
  vec3 oa = ro - a;
  float oad = dot(oa, rd);
  float dba = dot(rd, ba);
  float baba = dot(ba, ba);
  float oaba = dot(oa, ba);
  vec2 th = vec2(-oad * baba + dba * oaba, oaba - oad * dba) / max(baba - dba * dba, 1e-6);
  th.x = max(th.x, 0.0);
  th.y = clamp(th.y, 0.0, 1.0);
  return vec2(length(a + ba * th.y - (ro + rd * th.x)), th.x);
}

// ─── The tonearm ───────────────────────────────────────────────────
// Drawn like the flat one it replaces — a paper base, a black post, a bent
// tube, a rectangular headshell — in world units around its pivot; it
// swings about the post and lifts at the headshell.
vec3 armPts[3];   // tube: post top, elbow, headshell centre
vec3 headU;       // the headshell's long axis
const float TUBE_R = 0.012;
const float BASE_R = 0.079;
const float BASE_H = 0.03;
const float POST_R = 0.028;
const vec3 HEAD_HS = vec3(0.0513, 0.016, 0.0327); // half sizes (long, up, across)
float postTop() { return uRecPos.y + 0.05; }

void buildArm() {
  float s = sin(uArm.x), c = cos(uArm.x);
  mat2 swing = mat2(c, s, -s, c); // clockwise seen from above (x right, z down)
  float top = postTop();
  float head = uRecPos.y + T * 0.5 + HEAD_HS.y + 0.004 + uArm.y * 0.06;
  vec2 e = swing * vec2(-0.093, 0.457);
  vec2 h = swing * vec2(-0.285, 0.602);
  vec2 u = swing * vec2(0.788, -0.616);
  armPts[0] = uPivot + vec3(0.0, top, 0.0);
  armPts[1] = uPivot + vec3(e.x, mix(top, head, 0.45), e.y);
  armPts[2] = uPivot + vec3(h.x, head, h.y);
  headU = normalize(vec3(u.x, 0.0, u.y));
}

// Oriented box (Inigo Quilez): (t, normal) or t < 0.
vec4 iBox(vec3 ro, vec3 rd, vec3 c, vec3 u, vec3 v, vec3 w, vec3 hs) {
  vec3 o = vec3(dot(ro - c, u), dot(ro - c, v), dot(ro - c, w));
  vec3 d = vec3(dot(rd, u), dot(rd, v), dot(rd, w));
  vec3 m = 1.0 / d;
  vec3 n = m * o;
  vec3 k = abs(m) * hs;
  vec3 t1 = -n - k;
  vec3 t2 = -n + k;
  float tN = max(max(t1.x, t1.y), t1.z);
  float tF = min(min(t2.x, t2.y), t2.z);
  if (tN > tF || tF < 0.0) return vec4(-1.0);
  vec3 nl = -sign(d) * step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz);
  return vec4(tN, nl.x * u + nl.y * v + nl.z * w);
}

// The nearest piece of the arm along a ray: (t, part) and its normal.
// Parts: 0 base (paper), 1 metal (post, tube), 2 headshell.
vec2 hitArm(vec3 ro, vec3 rd, out vec3 nrm) {
  float t = 1e9;
  float part = -1.0;
  nrm = vec3(0.0, 1.0, 0.0);
  vec4 b = iCylinder(ro, rd, uPivot, uPivot + vec3(0.0, BASE_H, 0.0), BASE_R);
  if (b.x > 0.0) { t = b.x; part = 0.0; nrm = b.yzw; }
  // The pillar is the base's paper; only its cap — the pin — is black.
  vec4 p = iCylinder(ro, rd, uPivot, armPts[0] - vec3(0.0, 0.012, 0.0), POST_R);
  if (p.x > 0.0 && p.x < t) { t = p.x; part = 0.0; nrm = p.yzw; }
  vec4 pin = iCylinder(ro, rd, armPts[0] - vec3(0.0, 0.012, 0.0), armPts[0] + vec3(0.0, 0.004, 0.0), POST_R * 1.04);
  if (pin.x > 0.0 && pin.x < t) { t = pin.x; part = 1.0; nrm = pin.yzw; }
  for (int i = 0; i < 2; i++) {
    float tc = iCapsule(ro, rd, armPts[i], armPts[i + 1], TUBE_R);
    if (tc > 0.0 && tc < t) { t = tc; part = 1.0; nrm = nCapsule(ro + rd * tc, armPts[i], armPts[i + 1], TUBE_R); }
  }
  vec3 w = normalize(cross(headU, vec3(0.0, 1.0, 0.0)));
  vec4 h = iBox(ro, rd, armPts[2], headU, vec3(0.0, 1.0, 0.0), w, HEAD_HS);
  if (h.x > 0.0 && h.x < t) { t = h.x; part = 2.0; nrm = h.yzw; }
  return vec2(t, part);
}

// ─── Soft shadows ──────────────────────────────────────────────────
// How much light reaches p along the key light (1 = all of it).
float shadowOf(vec3 p, bool fromRecord) {
  float lit = 1.0;
  // The record, as a disc (its thickness does not show in a soft shadow).
  if (!fromRecord) {
    vec3 n = uRec[1];
    float dn = dot(uLight, n);
    if (abs(dn) > 1e-4) {
      float t = dot(uRecPos - p, n) / dn;
      if (t > 0.0) {
        vec3 q = p + uLight * t - uRecPos;
        float r = length(q - n * dot(q, n));
        float pen = 0.03 + t * 0.9;
        // Farther from the table, a wider and fainter shadow (the light
        // wraps around the occluder): the peak fades as the gap grows.
        lit *= mix(1.0, smoothstep(1.0 - pen, 1.0 + pen, r), 0.3 / (1.0 + t * 1.5));
      }
    }
  }
  // The arm: post, tube and headshell, as soft capsules. Its shadow stays
  // light and close — the flat arm had none.
  // Only near the arm: its shadow can't reach further than this.
  if (uArmOn > 0.0 && length(p.xz - uPivot.xz) < 0.95 + uRecPos.y * 0.9) {
    float k = 0.0;
    vec2 dp = raySeg(p, uLight, uPivot, armPts[0]);
    if (dp.y > 0.0) k = max(k, 1.0 - smoothstep(0.0, 0.008 + dp.y * 0.12, dp.x - POST_R));
    for (int i = 0; i < 2; i++) {
      vec2 d = raySeg(p, uLight, armPts[i], armPts[i + 1]);
      if (d.y > 0.0) k = max(k, 1.0 - smoothstep(0.0, 0.008 + d.y * 0.12, d.x - TUBE_R));
    }
    vec2 dh = raySeg(p, uLight, armPts[2] - headU * 0.035, armPts[2] + headU * 0.035);
    if (dh.y > 0.0) k = max(k, 1.0 - smoothstep(0.0, 0.008 + dh.y * 0.12, dh.x - 0.028));
    lit *= 1.0 - 0.22 * k * uArmOn;
  }
  return lit;
}

// ─── Surfaces ──────────────────────────────────────────────────────
vec3 background(vec3 rd) {
  // Above the horizon: the far paper wall, a little lighter higher up.
  float h = clamp(rd.y, 0.0, 1.0);
  return mix(uFog, uFog * 1.03, h);
}

vec3 floorColor(vec3 p, vec3 rd, float dist) {
  vec3 col = uPaper;
  // The night spreads on the floor from under the record, like ink.
  if (uFlood >= 0.0) {
    float d = length(p.xz - uRecPos.xz);
    float edge = 0.015 + 0.004 * uFlood; // a clean edge, like the page's own wipes
    col = mix(col, uInk, smoothstep(uFlood + edge, uFlood - edge, d));
  }
  float lit = shadowOf(p, false);
  // Contact shadow under the disc, and at the foot of the tonearm.
  float rho = length(p.xz - uRecPos.xz);
  float gap = max(uRecPos.y, 0.02);
  // Contact shadow: only while the record is close to the table.
  float aoK = mix(0.06, 0.22, uDepth) * clamp(0.12 / gap, 0.0, 1.0);
  float ao = 1.0 - aoK * smoothstep(1.0 + gap * 4.0, 1.0 - gap, rho);
  float rb = length(p.xz - uPivot.xz);
  ao *= 1.0 - (0.12 * uArmOn) * smoothstep(BASE_R * 1.5, BASE_R, rb);
  col *= lit * ao;
  // A room, once the camera leaves the page: a pool of light around the
  // record and fog towards the horizon.
  float pool = mix(1.0, 0.9 + 0.1 * smoothstep(6.0, 1.0, rho), uDepth);
  col *= pool;
  // A coloured light pooling around the record (the moods' glows).
  col += uLightCol * uGlow * lit * (0.55 * exp(-rho * rho * 0.35) + 0.12 * exp(-rho * 0.25));
  float fog = 1.0 - exp(-max(dist - 3.0, 0.0) * 0.08 * uDepth);
  return mix(col, background(rd), fog);
}

vec3 vinyl(vec3 lp, vec3 wp, vec3 rd, bool back, bool rimHit, vec3 wn, float px) {
  vec2 q = vec2(lp.x, -lp.z);
  if (back) q.x = -q.x;
  float r = length(q);
  float a = atan(q.y, q.x);
  float ar = a - uRot;
  vec3 V = -rd;
  vec3 col;
  if (rimHit) {
    col = vec3(0.035);
  } else if (r < LABEL_R) {
    float c = cos(-uRot), s = sin(-uRot);
    vec2 lq = mat2(c, s, -s, c) * q;
    vec2 luv = lq / LABEL_R * 0.5 + 0.5;
    vec4 label = back ? texture(uLabelB, luv) : texture(uLabel, luv);
    col = mix(vec3(0.07), label.rgb, label.a);
    col = mix(vec3(0.04), col, smoothstep(0.018, 0.024, r));
    col *= 0.94 + 0.06 * smoothstep(LABEL_R, LABEL_R - 0.05, r);
  } else {
    float bi = (GROOVE_OUT - r) / (GROOVE_OUT - GROOVE_IN) * 23.0;
    float amp = band(bi);
    float inGroove = smoothstep(GROOVE_IN, GROOVE_IN + 0.006, r) * smoothstep(GROOVE_OUT, GROOVE_OUT - 0.006, r);
    float wobble = amp * 0.0035 * sin(ar * 22.0 + uTime * 3.0);
    float freq = 230.0;
    float g = sin((r + wobble) * freq * 2.0 * PI);
    float aa = 1.0 - smoothstep(0.25, 0.7, px * freq);
    float grooves = g * aa;
    float sep = smoothstep(0.004, 0.0, abs(r - 0.76)) + smoothstep(0.004, 0.0, abs(r - 0.56));
    float grain = hash(floor(vec2(ar * 60.0, r * 90.0)));
    col = vec3(0.055, 0.052, 0.05) + grain * 0.012 * inGroove;
    col += grooves * 0.018 * inGroove;
    col += sep * 0.05;
    // Anisotropic sheen from the real light and eye: light catches the
    // walls of the grooves where they run across the half-vector, so the
    // bright bow-tie pivots with the camera, as on a real record.
    vec3 tang = normalize(uRec * vec3(-lp.z, 0.0, lp.x));
    // Seen along the camera's axis, as from far away: straight radial lobes.
    vec3 H = normalize(uSheenL - uCam[2]);
    float th = dot(tang, H);
    float sinTH = sqrt(max(0.0, 1.0 - th * th));
    float sheen = pow(sinTH, 420.0) * 0.55 + pow(sinTH, 60.0) * 0.07;
    sheen *= inGroove * (0.75 + 0.25 * grooves) * smoothstep(0.0, 0.2, dot(wn, uSheenL));
    // When the half-vector stands on the record (the camera at the light's
    // mirror angle) every groove would catch it and the whole disc would
    // glow; a real record shows the lamp's reflection there, not a grey disc.
    float hp = length(H - wn * dot(H, wn));
    sheen *= smoothstep(0.08, 0.3, hp);
    col += mix(vec3(1.0, 0.97, 0.92), uLightCol, clamp(uGlow, 0.0, 1.0)) * sheen;
    float shimmer = 0.4 + 0.6 * sin(ar * 3.0 + r * 30.0 - uTime * 1.2);
    col += uAccent * pow(amp, 2.2) * 0.3 * max(shimmer, 0.0) * (0.35 + 0.65 * (0.5 + 0.5 * g)) * inGroove * uPlaying;
    float needleR = GROOVE_OUT - 0.012 - uProgress * (GROOVE_OUT - GROOVE_IN - 0.03);
    col += uAccent * smoothstep(0.006, 0.0, abs(r - needleR)) * 0.55 * uPlaying * (back ? 0.0 : 1.0);
    float rim = smoothstep(0.972, 0.995, r);
    col += rim * (0.06 + 0.25 * pow(sinTH, 30.0));
  }
  // The landing ring travels through the groove from the stylus.
  if (uRingA > 0.0 && !back && !rimHit) {
    float d = length(vec2(lp.x, lp.z) - uRing.xy);
    float w = 0.004 + 0.014 * uRingA;
    col = mix(col, uAccent, uRingA * smoothstep(w, 0.0, abs(d - uRing.z)) * step(r, 0.98));
  }
  // Glossy lacquer: the room is reflected at grazing angles.
  float fres = pow(1.0 - max(dot(wn, V), 0.0), 5.0);
  col = mix(col, background(reflect(rd, wn)), fres * (rimHit ? 0.35 : 0.5));
  col *= 0.9 + 0.1 * max(dot(wn, normalize(vec3(-0.4, 0.8, -0.5))), 0.0);
  if (!rimHit) col *= mix(1.0, shadowOf(wp, true), 0.85);
  return col;
}

vec3 armColor(float part, vec3 p, vec3 n, vec3 rd) {
  vec3 albedo = part < 0.5 ? vec3(0.851, 0.824, 0.769) : vec3(0.075, 0.07, 0.066);
  float dif = max(dot(n, uLight), 0.0);
  float amb = 0.6 + 0.4 * n.y;
  vec3 col = albedo * (0.6 * amb + 0.45 * dif);
  vec3 H = normalize(uLight - rd);
  col += (part < 0.5 ? 0.04 : 0.14) * pow(max(dot(n, H), 0.0), 36.0);
  if (part < 0.5 && n.y > 0.5 && p.y < BASE_H + 0.001) {
    // The base's top is the flat disc it was, outline included.
    float rr = length(p.xz - uPivot.xz);
    col = mix(col, vec3(0.5, 0.48, 0.45), smoothstep(BASE_R - 0.009, BASE_R - 0.004, rr));
  }
  return col;
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 sp = (frag - uPP) / uFocal;
  vec3 ro = uEye;
  vec3 rd = normalize(uCam[0] * sp.x - uCam[1] * sp.y + uCam[2]);
  // One world unit, in device px, at distance t: for analytic edges.
  float pxScale = 1.0 / uFocal;

  buildArm();

  // ── Layer 1: the floor (or the far wall) ──
  vec3 col;
  float tFloor = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  if (tFloor < 1e8) col = floorColor(ro + rd * tFloor, rd, tFloor);
  else col = background(rd);

  // ── Layer 2: the record ──
  vec3 n = uRec[1];
  vec4 hit = iCylinder(ro, rd, uRecPos - n * (T * 0.5), uRecPos + n * (T * 0.5), 1.0);
  float tRec = hit.x;
  // Analytic edge: coverage from the distance to the rim on the face plane.
  float cover = 0.0;
  vec3 recCol = vec3(0.0);
  {
    // The face towards the eye, as a plane: the rim's distance on it, in
    // pixels (depth over focal, stretched by the foreshortening), gives an
    // exact anti-aliased edge without screen-space derivatives.
    float dn = dot(rd, n);
    float side = dot(ro - uRecPos, n) > 0.0 ? 1.0 : -1.0;
    float tp = abs(dn) > 1e-5 ? (dot(uRecPos + n * (T * 0.5 * side) - ro, n)) / dn : -1.0;
    float foot = max(tp, 0.0) * pxScale / max(abs(dn), 0.03);
    if (tp > 0.0) {
      vec3 lp = transpose(uRec) * (ro + rd * tp - uRecPos);
      cover = clamp(0.5 - (length(lp.xz) - 1.0) / max(foot, 1e-5), 0.0, 1.0);
      if (tRec < 0.0 && cover > 0.0) { tRec = tp; hit = vec4(tp, n * side); }
    }
    if (tRec > 0.0) {
      vec3 wp = ro + rd * tRec;
      vec3 lp = transpose(uRec) * (wp - uRecPos);
      vec3 wn = hit.yzw;
      float ny = dot(wn, n);
      bool rimHit = abs(ny) < 0.5;
      bool back = ny < 0.0;
      if (rimHit) cover = 1.0;
      float px = tRec * pxScale / max(abs(dot(rd, wn)), 0.03);
      recCol = vinyl(lp, wp, rd, back, rimHit, wn, px);
    }
  }

  // ── Layer 3: the tonearm ──
  // Small and full of edges: where a ray passes near it, four rotated-grid
  // samples give exact coverage (a few thousand pixels, not the screen).
  float tArm = 1e9;
  vec3 armCol = vec3(0.0);
  float armCover = 0.0;
  // Only inside the arm's screen bounds (computed in JS each frame).
  if (uArmOn > 0.0 && length(frag - uArmBox.xy) < uArmBox.z) {
    float near = 1e9;
    for (int i = 0; i < 2; i++) {
      vec2 d = raySeg(ro, rd, armPts[i], armPts[i + 1]);
      near = min(near, (d.x - 0.06) / max(d.y * pxScale, 1e-6));
    }
    vec2 dp = raySeg(ro, rd, uPivot, armPts[0]);
    near = min(near, (dp.x - BASE_R - 0.01) / max(dp.y * pxScale, 1e-6));
    if (near < 2.0) {
      vec2 offs[4] = vec2[4](vec2(-0.125, -0.375), vec2(0.375, -0.125), vec2(0.125, 0.375), vec2(-0.375, 0.125));
      for (int i = 0; i < uSamples; i++) {
        vec2 so = (frag + offs[i] - uPP) / uFocal;
        vec3 rdo = normalize(uCam[0] * so.x - uCam[1] * so.y + uCam[2]);
        vec3 an;
        vec2 h = hitArm(ro, rdo, an);
        if (h.y >= 0.0) {
          armCover += 0.25;
          armCol += armColor(h.y, ro + rdo * h.x, an, rdo);
          tArm = min(tArm, h.x);
        }
      }
      if (armCover > 0.0) armCol /= armCover * 4.0;
      armCover *= uArmOn;
    }
  }

  // ── Composite, far to near ──
  bool armFront = tArm < (tRec > 0.0 ? tRec : 1e9);
  if (armFront) {
    col = mix(col, recCol, cover);
    col = mix(col, armCol, armCover);
  } else {
    col = mix(col, armCol, armCover);
    col = mix(col, recCol, cover);
  }

  // ── The lens: a little vignette and grain once we are in a room ──
  vec2 uv = frag / uRes;
  float vig = 1.0 - uDepth * 0.22 * pow(length((uv - 0.5) * vec2(1.1, 1.0)), 2.2);
  col *= vig;
  // Static grain: a moving one would redraw the whole screen every frame.
  col += uDepth * (hash(frag) - 0.5) * 0.02;
  outColor = vec4(col, 1.0);
}
`
