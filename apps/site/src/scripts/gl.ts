/**
 * A deliberately tiny WebGL2 toolkit: one full-screen triangle, a program,
 * typed uniform setters and DPR-clamped resizing. The site's two shaders
 * don't need a scene graph, so they don't pay for one. Programs compile in
 * parallel, off the main thread where supported (see Surface.ready).
 */
const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

export interface Surface {
  gl: WebGL2RenderingContext
  program: WebGLProgram
  canvas: HTMLCanvasElement
  /**
   * Resolves once the program is compiled and linked. Shaders compile in
   * parallel where the browser can (KHR_parallel_shader_compile): nothing
   * may touch the program — uniforms, attributes, draws — before this, or
   * the main thread blocks until the GPU driver is done (seconds, with a
   * big fragment shader on ANGLE / Direct3D).
   */
  ready: Promise<void>
  isReady(): boolean
  u(name: string): WebGLUniformLocation | null
  resize(): boolean
  draw(): void
  dispose(): void
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return shader
}

export function createSurface(
  canvas: HTMLCanvasElement,
  fragment: string,
  maxDpr = 2,
  // A full-screen surface refuses a slow context (software rendering: no
  // GPU, some VMs and remote desktops) — the page falls back instead.
  needsGpu = false,
): Surface | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
    failIfMajorPerformanceCaveat: needsGpu,
    powerPreference: 'high-performance',
  })
  if (!gl) return null
  if (needsGpu && softwareRenderer(gl)) {
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return null
  }
  const parallel = gl.getExtension('KHR_parallel_shader_compile')
  const vs = compile(gl, gl.VERTEX_SHADER, VERT)
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragment)
  const program = gl.createProgram()!
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  const buffer = gl.createBuffer()

  let ok = false
  let lost = false
  // Finish the setup once linked (this is the first call that may wait).
  const finish = (): void => {
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getShaderInfoLog(fs) || gl.getProgramInfoLog(program)
      throw new Error(`Shader program failed: ${log}`)
    }
    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(program, 'aPos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    ok = true
  }
  const ready = new Promise<void>((resolve, reject) => {
    const poll = (): void => {
      if (lost) return
      if (parallel && !gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)) {
        setTimeout(poll, 16)
        return
      }
      try {
        finish()
        resolve()
      } catch (error) {
        reject(error)
      }
    }
    // Without the extension the link still blocks; do it after the page's
    // first work, not in the middle of it.
    setTimeout(poll, parallel ? 16 : 0)
  })

  const cache = new Map<string, WebGLUniformLocation | null>()
  const dpr = (): number =>
    Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.5 : maxDpr)

  return {
    gl,
    program,
    canvas,
    ready,
    isReady: () => ok,
    u(name) {
      if (!cache.has(name)) cache.set(name, gl.getUniformLocation(program, name))
      return cache.get(name) ?? null
    },
    resize() {
      const ratio = dpr()
      const w = Math.max(1, Math.round(canvas.clientWidth * ratio))
      const h = Math.max(1, Math.round(canvas.clientHeight * ratio))
      if (canvas.width === w && canvas.height === h) return false
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
      return true
    },
    draw() {
      if (!ok) return
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    dispose() {
      lost = true
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}

/** Upload a canvas (or image) as a texture on unit `unit`. */
export function uploadTexture(
  gl: WebGL2RenderingContext,
  source: TexImageSource,
  unit = 0,
  existing?: WebGLTexture | null,
): WebGLTexture {
  const tex = existing ?? gl.createTexture()!
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  // Canvas rows go top → bottom; texture space goes bottom → top.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  return tex
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace('#', ''), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

/**
 * Is this context drawn by the CPU? Chrome may hand out SwiftShader without
 * flagging a performance caveat. Unknown renderers count as GPUs.
 */
function softwareRenderer(gl: WebGL2RenderingContext): boolean {
  const info = gl.getExtension('WEBGL_debug_renderer_info')
  const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
  return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name)
}
