import { svg, type TemplateResult } from 'lit'

/**
 * Inline SVG icons used by `<pulse-player>` and `<pulse-fab>`.
 *
 * All icons render at the `mp__icon` font-size and inherit `color`
 * from the chrome via `currentColor`. They're extracted into this
 * single file so the geometry stays one source of truth and the
 * `PulsePlayer.ts` element file stays focused on lifecycle + render
 * orchestration.
 *
 * Provenance:
 *
 *   - **GitHub Octocat** — silhouette borrowed from Lucide (MIT). Used
 *     when `github-url` is set on the host; renders an inert span
 *     with the same aria-label otherwise. Compliant with GitHub's
 *     logo policy for developer integrations (https://github.com/logos).
 *
 *   - **Streaming icon** — generic music-note geometry (Lucide MIT).
 *     Deliberately NOT the Spotify mark to avoid trademark exposure
 *     per Spotify's developer brand guidelines
 *     (https://developer.spotify.com/documentation/design). Consumers
 *     pass any streaming-provider URL via `spotify-url` (Apple Music,
 *     YouTube Music, Tidal, Deezer, self-hosted, etc.).
 */
export const GITHUB_SVG: TemplateResult = svg`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.03c-3.2.69-3.87-1.38-3.87-1.38-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.49 3.18-1.18 3.18-1.18.62 1.58.23 2.75.11 3.04.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14v3.18c0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>`

export const STREAM_SVG: TemplateResult = svg`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`
