import { svg, type SVGTemplateResult } from 'lit'

/** 24 × 24 icons drawn for Pulse. They inherit `currentColor`. */
const icon = (content: SVGTemplateResult, cls = ''): SVGTemplateResult =>
  svg`<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${content}</svg>`

export const playIcon = icon(
  svg`<path fill="currentColor" d="M8.2 4.6c-.8-.5-1.7.1-1.7 1v12.8c0 .9 1 1.5 1.7 1l10.1-6.4a1.2 1.2 0 0 0 0-2L8.2 4.6Z"/>`,
  'icon--play',
)

export const pauseIcon = icon(
  svg`<rect fill="currentColor" x="6" y="4.8" width="4.2" height="14.4" rx="1.3"/><rect fill="currentColor" x="13.8" y="4.8" width="4.2" height="14.4" rx="1.3"/>`,
  'icon--pause',
)

export const previousIcon = icon(
  svg`<rect fill="currentColor" x="5" y="5.5" width="2.4" height="13" rx="1"/><path fill="currentColor" d="M18.2 6.3c0-.8-.9-1.3-1.6-.8l-7.6 5.6a1.1 1.1 0 0 0 0 1.8l7.6 5.6c.7.5 1.6 0 1.6-.8V6.3Z"/>`,
)

export const nextIcon = icon(
  svg`<rect fill="currentColor" x="16.6" y="5.5" width="2.4" height="13" rx="1"/><path fill="currentColor" d="M5.8 6.3c0-.8.9-1.3 1.6-.8l7.6 5.6c.6.4.6 1.4 0 1.8l-7.6 5.6c-.7.5-1.6 0-1.6-.8V6.3Z"/>`,
)

export const volumeIcon = icon(
  svg`<path fill="currentColor" d="M4 9.5v5c0 .6.4 1 1 1h2.6l3.8 3.2c.6.5 1.6.1 1.6-.8V6.1c0-.9-1-1.3-1.6-.8L7.6 8.5H5c-.6 0-1 .4-1 1Z"/><path d="M16 9a4.2 4.2 0 0 1 0 6M18.6 6.5a7.8 7.8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
)

export const mutedIcon = icon(
  svg`<path fill="currentColor" d="M4 9.5v5c0 .6.4 1 1 1h2.6l3.8 3.2c.6.5 1.6.1 1.6-.8V6.1c0-.9-1-1.3-1.6-.8L7.6 8.5H5c-.6 0-1 .4-1 1Z"/><path d="m16.5 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
)

export const closeIcon = icon(
  svg`<path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
)

export const moreIcon = icon(
  svg`<circle fill="currentColor" cx="6" cy="12" r="1.8"/><circle fill="currentColor" cx="12" cy="12" r="1.8"/><circle fill="currentColor" cx="18" cy="12" r="1.8"/>`,
)

export const gripIcon = icon(
  svg`<path d="M20 11 11 20M20 16l-4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
)

export const noteIcon = icon(
  svg`<path d="M9 18V6.5l10-2V16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.5" fill="currentColor"/><circle cx="16.5" cy="16" r="2.5" fill="currentColor"/>`,
)
