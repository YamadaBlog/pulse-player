/**
 * The record's paper labels, painted with the site's real fonts. Side A is
 * the orange label of the hero; side B is the paper one the interlude turns
 * the record over to.
 */
async function fonts(): Promise<void> {
  await Promise.allSettled([
    document.fonts.load('800 120px "Archivo Variable"'),
    document.fonts.load('500 20px "Geist Mono"'),
  ])
}

type Ctx = CanvasRenderingContext2D & { fontStretch?: string }

function disc(fill: string | CanvasGradient): { c: HTMLCanvasElement; ctx: Ctx; mid: number } {
  const size = 1024
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')! as Ctx
  const mid = size / 2
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.arc(mid, mid, mid, 0, Math.PI * 2)
  ctx.fill()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fontStretch = 'condensed'
  return { c, ctx, mid }
}

function rim(ctx: Ctx, mid: number): void {
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgb(19 18 16 / 0.35)'
  ctx.beginPath()
  ctx.arc(mid, mid, mid - 26, 0, Math.PI * 2)
  ctx.stroke()
}

/** Side A: the orange label. */
async function paintLabel(): Promise<HTMLCanvasElement> {
  await fonts()
  const probe = document.createElement('canvas').getContext('2d')!
  const grad = probe.createRadialGradient(410, 358, 40, 512, 512, 512)
  grad.addColorStop(0, '#ff6a3d')
  grad.addColorStop(1, '#e8410f')
  const { c, ctx, mid } = disc(grad)
  ctx.fillStyle = '#131210'
  ctx.font = '800 188px "Archivo Variable", "Archivo", sans-serif'
  ctx.fillText('PULSE', mid, mid - 60)
  ctx.font = '500 30px "Geist Mono", monospace'
  ctx.fillText('SIDE A  ·  33⅓ RPM', mid, mid - 250)
  ctx.font = '500 25px "Geist Mono", monospace'
  const lines = ['A1  PROJECTOR SCREEN', 'A2  WARM FUZZ', 'A3  SUMMER BREAK']
  lines.forEach((line, i) => ctx.fillText(line, mid, mid + 150 + i * 38))
  ctx.font = '500 20px "Geist Mono", monospace'
  ctx.fillText('HOLIZNACC0 · PUBLIC DOMAIN', mid, mid + 300)
  ctx.fillText('℗ 2026 YAMADABLOG · MIT', mid, mid + 332)
  rim(ctx, mid)
  return c
}

/** Side B: the paper label — under the hood. */
async function paintLabelB(): Promise<HTMLCanvasElement> {
  await fonts()
  const { c, ctx, mid } = disc('#ece7dc')
  ctx.fillStyle = '#ff4f1a'
  ctx.font = '800 470px "Archivo Variable", "Archivo", sans-serif'
  ctx.fillText('B', mid, mid + 160)
  ctx.fillStyle = '#131210'
  ctx.font = '500 30px "Geist Mono", monospace'
  ctx.fillText('SIDE B  ·  UNDER THE HOOD', mid, mid - 280)
  ctx.font = '500 22px "Geist Mono", monospace'
  const lines = [
    'B1  FOLLOWS YOU',
    'B2  LISTENS BACK',
    'B3  SPEAKS EVERY FRAMEWORK',
    'B4  BUILT TO BE HEARD',
  ]
  lines.forEach((line, i) => ctx.fillText(line, mid, mid + 250 + i * 32))
  rim(ctx, mid)
  return c
}

// Painted once per visit: the stage mounts again on every return to the page.
let sideA: Promise<HTMLCanvasElement> | null = null
let sideB: Promise<HTMLCanvasElement> | null = null
export const drawLabel = (): Promise<HTMLCanvasElement> => (sideA ??= paintLabel())
export const drawLabelB = (): Promise<HTMLCanvasElement> => (sideB ??= paintLabelB())
