/**
 * The record. Everything is procedural: a disc on a tilted plane seen
 * through a mild perspective, grooves whose brightness follows the live
 * spectrum (outer grooves = bass, like a real cut), an anisotropic sheen
 * that stays fixed to the light while the vinyl spins under it, a paper
 * label texture, and a soft contact shadow.
 */
export const RECORD_FRAG = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 uRes;
uniform float uRot;
uniform vec2 uTilt;
uniform float uLight;
uniform float uTime;
uniform float uBands[24];
uniform float uEnergy;
uniform vec3 uAccent;
uniform float uProgress;
uniform float uPlaying;
uniform sampler2D uLabel;

const float PI = 3.14159265;
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

mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1, 0, 0, 0, c, s, 0, -s, c); }
mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0, -s, 0, 1, 0, s, 0, c); }

void main() {
  float m = min(uRes.x, uRes.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / (0.5 * m) / 0.9;

  // Ray / tilted-plane intersection (camera on +z, gentle perspective).
  float D = 3.4;
  vec3 ro = vec3(0.0, 0.0, D);
  vec3 rd = normalize(vec3(p, -D));
  mat3 R = rotY(uTilt.x) * rotX(uTilt.y);
  vec3 n = R * vec3(0.0, 0.0, 1.0);
  float t = -dot(ro, n) / dot(rd, n);
  vec2 q = (transpose(R) * (ro + t * rd)).xy;
  float r = length(q);
  float px = fwidth(r);

  // Contact shadow, in screen space, below-right of the disc. It must
  // reach zero before the canvas edge (|p| = 1.11) or the square shows.
  vec2 sp = (p - vec2(0.03, -0.05)) * vec2(1.0, 1.04);
  float shadow = smoothstep(1.06, 0.84, length(sp)) * 0.3;

  if (r > 1.0 + px) {
    outColor = vec4(vec3(0.0), shadow);
    return;
  }

  float a = atan(q.y, q.x);
  float ar = a - uRot;
  vec3 col;

  if (r < LABEL_R) {
    // Paper label, rotating with the disc.
    float c = cos(-uRot), s = sin(-uRot);
    vec2 lq = mat2(c, s, -s, c) * q;
    vec4 label = texture(uLabel, lq / LABEL_R * 0.5 + 0.5);
    col = mix(vec3(0.07), label.rgb, label.a);
    // Spindle hole.
    col = mix(vec3(0.04), col, smoothstep(0.018, 0.024, r));
    // Label edge shading.
    col *= 0.94 + 0.06 * smoothstep(LABEL_R, LABEL_R - 0.05, r);
  } else {
    // Vinyl body.
    float bi = (GROOVE_OUT - r) / (GROOVE_OUT - GROOVE_IN) * 23.0;
    float amp = band(bi);
    float inGroove = smoothstep(GROOVE_IN, GROOVE_IN + 0.006, r) * smoothstep(GROOVE_OUT, GROOVE_OUT - 0.006, r);

    // Grooves: a fine cut whose phase wobbles with the music.
    float wobble = amp * 0.0035 * sin(ar * 22.0 + uTime * 3.0);
    float freq = 230.0;
    float g = sin((r + wobble) * freq * 2.0 * PI);
    float aa = 1.0 - smoothstep(0.25, 0.7, px * freq);
    float grooves = g * aa;

    // Track separators (three tracks on the side) and the lead-in.
    float sep = 0.0;
    sep += smoothstep(0.004, 0.0, abs(r - 0.76));
    sep += smoothstep(0.004, 0.0, abs(r - 0.56));

    // Base vinyl with a faint, rotating texture so the spin reads.
    float grain = hash(floor(vec2(ar * 60.0, r * 90.0)));
    col = vec3(0.055, 0.052, 0.05) + grain * 0.012 * inGroove;
    col += grooves * 0.018 * inGroove;
    col += sep * 0.05;

    // Anisotropic sheen: two lobes aligned with the light, fixed on screen.
    float lobe = abs(cos(a - uLight));
    float sheen = pow(lobe, 34.0) * 0.55 + pow(lobe, 6.0) * 0.07;
    sheen *= inGroove * (0.75 + 0.25 * grooves);
    col += vec3(1.0, 0.97, 0.92) * sheen;

    // The music, written in the groove: light caught by the cut, per ring.
    // Kept to the groove walls (0.5 + 0.5 g) so it reads as lacquer, not fog.
    float shimmer = 0.4 + 0.6 * sin(ar * 3.0 + r * 30.0 - uTime * 1.2);
    col += uAccent * pow(amp, 2.2) * 0.3 * max(shimmer, 0.0) * (0.35 + 0.65 * (0.5 + 0.5 * g)) * inGroove * uPlaying;

    // Where the needle is: a thin bright ring at the current position.
    float needleR = GROOVE_OUT - 0.012 - uProgress * (GROOVE_OUT - GROOVE_IN - 0.03);
    col += uAccent * smoothstep(0.006, 0.0, abs(r - needleR)) * 0.55 * uPlaying;

    // Rim bevel.
    float rim = smoothstep(0.972, 0.995, r);
    col += rim * (0.06 + 0.25 * pow(abs(cos(a - uLight - 0.3)), 8.0));
  }

  // Slight shading from the tilt, and a soft anti-aliased edge.
  col *= 0.9 + 0.1 * dot(n, normalize(vec3(-0.4, 0.6, 1.0)));
  float edge = smoothstep(1.0 + px, 1.0 - px, r);
  outColor = vec4(col * edge, edge) + vec4(0.0, 0.0, 0.0, shadow * (1.0 - edge));
}
`
