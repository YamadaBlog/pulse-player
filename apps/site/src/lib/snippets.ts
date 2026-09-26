import type { PulseVariant } from '@pulse-music/vue'

export type Framework = 'html' | 'vue' | 'react' | 'svelte' | 'angular'

export interface PlayerConfig {
  variant: PulseVariant
  accent: string | null
  ambientEq: boolean
  grain: boolean
  resizable: boolean
}

export const FRAMEWORKS: Array<{ id: Framework; label: string; install: string }> = [
  { id: 'html', label: 'HTML', install: 'npm i @pulse-music/web-component' },
  { id: 'vue', label: 'Vue', install: 'npm i @pulse-music/vue' },
  { id: 'react', label: 'React', install: 'npm i @pulse-music/react' },
  { id: 'svelte', label: 'Svelte', install: 'npm i @pulse-music/svelte' },
  { id: 'angular', label: 'Angular', install: 'npm i @pulse-music/web-component' },
]

const TRACK = `{ title: 'Protofunk', artist: 'Kevin MacLeod', src: '/protofunk.mp3', cover: '/protofunk.jpg' }`

type Style = 'html' | 'jsx' | 'vue'

function attrs(c: PlayerConfig, style: Style): string[] {
  const out: string[] = []
  if (c.variant !== 'auto') out.push(`variant="${c.variant}"`)
  if (c.accent)
    out.push(style === 'jsx' ? `accentColor="${c.accent}"` : `accent-color="${c.accent}"`)
  if (c.ambientEq) out.push(style === 'jsx' ? 'ambientEq' : 'ambient-eq')
  if (!c.grain)
    out.push(
      style === 'jsx' ? 'grain={false}' : style === 'vue' ? ':grain="false"' : 'grain="false"',
    )
  if (c.resizable) out.push('resizable')
  return out
}

/** Keep short attribute lists on one line, wrap long ones. */
const join = (parts: string[], indent: string): string =>
  parts.length ? ` ${parts.join(parts.length > 2 ? `\n${indent}` : ' ')}` : ''

/** The code a developer would write to get the playground's current player. */
export function snippet(framework: Framework, c: PlayerConfig): string {
  switch (framework) {
    case 'html':
      return [
        '<script type="module">',
        "  import '@pulse-music/web-component'",
        '</script>',
        '',
        `<pulse-player${join(attrs(c, 'html'), '  ')}>`,
        '  <pulse-track src="/protofunk.mp3" title="Protofunk"',
        '    artist="Kevin MacLeod" cover="/protofunk.jpg"></pulse-track>',
        '</pulse-player>',
        '',
        '<!-- Optional floating mini player, same audio session -->',
        '<pulse-fab></pulse-fab>',
      ].join('\n')
    case 'vue':
      return [
        '<script setup lang="ts">',
        "import { PulsePlayer, PulseFab } from '@pulse-music/vue'",
        '',
        `const tracks = [${TRACK}]`,
        '</script>',
        '',
        '<template>',
        `  <PulsePlayer :tracks="tracks"${join(attrs(c, 'vue'), '    ')} />`,
        '  <PulseFab />',
        '</template>',
      ].join('\n')
    case 'react':
      return [
        "import { PulsePlayer, PulseFab } from '@pulse-music/react'",
        '',
        `const tracks = [${TRACK}]`,
        '',
        'export function Player() {',
        '  return (',
        '    <>',
        `      <PulsePlayer tracks={tracks}${join(attrs(c, 'jsx'), '        ')} />`,
        '      <PulseFab />',
        '    </>',
        '  )',
        '}',
      ].join('\n')
    case 'svelte':
      return [
        '<script>',
        "  import '@pulse-music/svelte'",
        `  const tracks = [${TRACK}]`,
        '</script>',
        '',
        `<pulse-player {tracks}${join(attrs(c, 'html'), '  ')}></pulse-player>`,
        '<pulse-fab></pulse-fab>',
      ].join('\n')
    case 'angular':
      return [
        "import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'",
        "import '@pulse-music/web-component'",
        '',
        '@Component({',
        "  selector: 'app-player',",
        '  schemas: [CUSTOM_ELEMENTS_SCHEMA],',
        '  template: `',
        `    <pulse-player [tracks]="tracks"${join(attrs(c, 'html'), '      ')}></pulse-player>`,
        '    <pulse-fab></pulse-fab>',
        '  `,',
        '})',
        'export class PlayerComponent {',
        `  tracks = [${TRACK}]`,
        '}',
      ].join('\n')
  }
}
