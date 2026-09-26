import { css, unsafeCSS } from 'lit'

const GRAIN = unsafeCSS(
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
)

export const playerStyles = css`
  :host {
    display: block;
    width: 100%;
    min-width: 64px;
    position: relative;
    container: pulse / inline-size;
    color-scheme: dark;
  }
  :host([variant='light']) {
    --_ink: #ffffff;
  }

  /* ─── Card ─────────────────────────────────────────────────────── */
  .player {
    --pad: clamp(10px, 3.4cqi, 24px);
    --radius: var(--pulse-radius, clamp(14px, 4.4cqi, 28px));
    --art: clamp(52px, 27cqi, 196px);
    --title: clamp(15px, 4.6cqi, 30px);
    --meta: clamp(11.5px, 2.7cqi, 15px);
    --eyebrow: clamp(9.5px, 1.9cqi, 11.5px);
    --btn: clamp(30px, 7.6cqi, 44px);
    --btn-main: clamp(38px, 11cqi, 62px);
    --ink: var(--pulse-ink, var(--_ink, #0d0d12));
    --eq-h: clamp(9px, 2.3cqi, 13px);
    --eq-w: clamp(2px, 0.55cqi, 3px);

    position: relative;
    isolation: isolate;
    display: grid;
    grid-template-columns: var(--art) minmax(0, 1fr);
    align-items: center;
    gap: var(--pad);
    /* Room for the 24 px seek target at the bottom edge (WCAG 2.5.8). */
    padding: var(--pad) var(--pad) max(calc(var(--pad) + 8px), 26px);
    border-radius: var(--radius);
    overflow: hidden;
    color: var(--fg);
    background: var(--bg);
    box-shadow:
      inset 0 0 0 1px var(--border),
      inset 0 1px 0 0 rgb(255 255 255 / 0.06),
      var(--pulse-shadow, 0 30px 60px -30px rgb(0 0 0 / 0.6), 0 12px 24px -16px rgb(0 0 0 / 0.4));
    transition:
      border-radius var(--pulse-dur-spring) var(--pulse-ease-gentle),
      padding var(--pulse-dur-spring) var(--pulse-ease-gentle),
      background var(--pulse-dur-slow) var(--pulse-ease-out),
      color var(--pulse-dur-slow) var(--pulse-ease-out);
  }
  :host([variant='transparent']) .player {
    box-shadow: inset 0 0 0 1px var(--border);
  }

  /* ─── Backdrop layers ──────────────────────────────────────────── */
  .backdrop {
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    overflow: hidden;
    pointer-events: none;
  }
  .backdrop__cover {
    position: absolute;
    inset: -20%;
    background: center / cover no-repeat;
    filter: blur(32px) saturate(1.6) brightness(0.72);
    animation: fade-in 900ms var(--pulse-ease-out) both;
  }
  .backdrop__scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      100deg,
      rgb(8 8 12 / 0.1) 0%,
      rgb(8 8 12 / 0.45) 55%,
      rgb(8 8 12 / 0.6) 100%
    );
  }
  .backdrop__glow {
    position: absolute;
    left: calc(var(--pad) + var(--art) / 2);
    top: 50%;
    width: calc(var(--art) * 3.2);
    aspect-ratio: 1;
    translate: -50% -50%;
    border-radius: 50%;
    background: radial-gradient(
      closest-side,
      color-mix(in oklab, var(--accent) 60%, transparent),
      transparent
    );
    opacity: 0.22;
    will-change: transform, opacity;
  }
  .grain {
    position: absolute;
    inset: 0;
    background-image: ${GRAIN};
    background-size: 220px;
    mix-blend-mode: overlay;
    opacity: 0.32;
  }
  :host([variant='light']) .grain {
    mix-blend-mode: multiply;
    opacity: 0.1;
  }
  .ambient {
    position: absolute;
    inset: auto 0 0 0;
    height: 42%;
    display: flex;
    align-items: flex-end;
    gap: 2px;
    padding-inline: 2px;
    opacity: 0.38;
    mask-image: linear-gradient(to top, #000 30%, transparent);
  }
  .ambient i {
    flex: 1;
    height: 100%;
    border-radius: 3px 3px 0 0;
    background: linear-gradient(
      to top,
      var(--accent),
      color-mix(in oklab, var(--accent) 30%, transparent)
    );
    transform-origin: 50% 100%;
    transform: scaleY(0.06);
    transition: transform 500ms var(--pulse-ease-out);
  }
  .ambient[data-live] i {
    transition: none;
  }

  /* ─── Artwork ──────────────────────────────────────────────────── */
  .art {
    position: relative;
    width: var(--art);
    aspect-ratio: 1;
    border-radius: calc(var(--radius) * 0.62);
    overflow: hidden;
    cursor: pointer;
    background: color-mix(in oklab, var(--fg) 8%, transparent);
    box-shadow:
      0 18px 36px -14px rgb(0 0 0 / 0.65),
      inset 0 0 0 1px rgb(255 255 255 / 0.08);
    transition:
      scale var(--pulse-dur-spring) var(--pulse-ease-pop),
      border-radius var(--pulse-dur-spring) var(--pulse-ease-gentle),
      box-shadow var(--pulse-dur-slow) var(--pulse-ease-out);
  }
  .art:active {
    scale: 0.96;
    transition-duration: var(--pulse-dur-instant);
  }
  .art__img,
  .art__placeholder {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }
  .art__img--current {
    animation: art-in 760ms var(--pulse-ease-out) both;
  }
  .art__placeholder {
    display: grid;
    place-items: center;
    color: rgb(255 255 255 / 0.85);
  }
  .art__placeholder .icon {
    width: 34%;
    height: 34%;
  }
  .art__hover {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgb(0 0 0 / 0.42);
    color: #fff;
    opacity: 0;
    transition: opacity var(--pulse-dur-base) var(--pulse-ease-out);
  }
  .art__hover .icon {
    width: 30%;
    height: 30%;
    margin: auto;
  }
  @media (hover: hover) {
    .art:hover .art__hover {
      opacity: 1;
    }
  }

  /* ─── Body ─────────────────────────────────────────────────────── */
  .body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: clamp(4px, 1.4cqi, 10px);
    min-width: 0;
    align-self: stretch;
  }
  .eyebrow {
    display: flex;
    align-items: center;
    gap: clamp(6px, 1.5cqi, 10px);
    min-height: var(--eq-h);
    font-size: var(--eyebrow);
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .eyebrow__label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .player[data-error] .eyebrow__label {
    color: var(--pulse-error, #ff7a7a);
    letter-spacing: 0.06em;
  }
  .actions {
    display: flex;
    gap: 6px;
    margin-left: auto;
  }
  .meta {
    min-width: 0;
    animation: meta-in 620ms var(--pulse-ease-gentle) both;
  }
  .title {
    margin: 0;
    font-size: var(--title);
    font-weight: 750;
    line-height: 1.12;
    letter-spacing: -0.022em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-wrap: balance;
  }
  .artist {
    margin: 0.2em 0 0;
    font-size: var(--meta);
    font-weight: 500;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ─── Controls ─────────────────────────────────────────────────── */
  .controls {
    display: flex;
    align-items: center;
    gap: clamp(2px, 1.2cqi, 10px);
    margin-top: clamp(2px, 0.8cqi, 6px);
  }
  .btn {
    position: relative;
    display: grid;
    place-items: center;
    flex: none;
    width: var(--btn);
    height: var(--btn);
    border-radius: 50%;
    color: var(--muted);
    transition:
      color var(--pulse-dur-fast) var(--pulse-ease-out),
      background-color var(--pulse-dur-fast) var(--pulse-ease-out),
      box-shadow var(--pulse-dur-base) var(--pulse-ease-out),
      scale var(--pulse-dur-spring) var(--pulse-ease-pop);
  }
  .btn > .icon,
  .btn > .glyphs {
    width: 46%;
    height: 46%;
  }
  .btn:not(:disabled):hover {
    color: var(--fg);
    background: color-mix(in oklab, var(--fg) 10%, transparent);
  }
  .btn:not(:disabled):active {
    scale: 0.86;
    transition-duration: var(--pulse-dur-instant);
  }
  .btn--main {
    width: var(--btn-main);
    height: var(--btn-main);
    color: var(--ink);
    background: var(--fg);
    box-shadow: 0 10px 24px -10px color-mix(in oklab, var(--accent) 80%, transparent);
  }
  .btn--main > .glyphs {
    width: 42%;
    height: 42%;
  }
  .btn--main:not(:disabled):hover {
    color: var(--ink);
    background: var(--fg);
    scale: 1.06;
    box-shadow:
      0 0 0 clamp(4px, 1.2cqi, 7px) color-mix(in oklab, var(--accent) 26%, transparent),
      0 14px 30px -10px color-mix(in oklab, var(--accent) 90%, transparent);
  }
  .player[data-error] .btn--main {
    animation: shake 480ms var(--pulse-ease-out);
  }
  .spinner {
    position: absolute;
    inset: -4px;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
    opacity: 0;
    transition: opacity var(--pulse-dur-base) var(--pulse-ease-out);
    pointer-events: none;
  }
  .spinner circle {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-dasharray: 40 200;
    transform-origin: center;
    animation: spin 900ms linear infinite;
  }
  .player[data-loading] .spinner {
    opacity: 1;
  }
  .time {
    margin-left: auto;
    font-size: var(--meta);
    font-variant-numeric: tabular-nums;
    color: var(--muted);
    white-space: nowrap;
  }
  .time__sep {
    opacity: 0.5;
    margin-inline: 0.3em;
  }

  /* ─── Progress / scrubber ──────────────────────────────────────── */
  .progress {
    --h: 3px;
    position: absolute;
    inset: auto 0 0 0;
    z-index: 3;
    height: 24px;
    display: flex;
    align-items: flex-end;
    cursor: pointer;
    touch-action: none;
    outline: none;
  }
  .progress:hover,
  .progress:focus-visible,
  .progress[data-scrubbing] {
    --h: 6px;
  }
  .progress__rail {
    position: relative;
    width: 100%;
    height: var(--h);
    background: color-mix(in oklab, var(--fg) 12%, transparent);
    transition: height var(--pulse-dur-base) var(--pulse-ease-gentle);
  }
  .progress__buffer,
  .progress__fill {
    position: absolute;
    inset: 0;
    transform-origin: 0 50%;
  }
  .progress__buffer {
    background: color-mix(in oklab, var(--fg) 12%, transparent);
    transform: scaleX(var(--buffered, 0));
    transition: transform 600ms var(--pulse-ease-out);
  }
  .progress__fill {
    background: linear-gradient(
      90deg,
      color-mix(in oklab, var(--accent) 55%, var(--fg)),
      var(--accent)
    );
    transform: scaleX(var(--progress, 0));
    transition: transform 260ms linear;
  }
  .progress__thumb {
    position: absolute;
    top: 50%;
    left: 0;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: var(--fg);
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.45);
    translate: calc(var(--progress, 0) * 100cqi - 50%) -50%;
    scale: 0;
    transition:
      scale var(--pulse-dur-spring) var(--pulse-ease-pop),
      translate 260ms linear,
      box-shadow var(--pulse-dur-base) var(--pulse-ease-out);
  }
  .progress[data-scrubbing] .progress__fill,
  .progress[data-scrubbing] .progress__thumb {
    transition-property: scale, box-shadow;
  }
  .progress:hover .progress__thumb,
  .progress:focus-visible .progress__thumb,
  .progress[data-scrubbing] .progress__thumb {
    scale: 1;
  }
  .progress:focus-visible .progress__thumb {
    box-shadow: 0 0 0 4px color-mix(in oklab, var(--accent) 55%, transparent);
  }
  .progress__tip {
    position: absolute;
    left: 0;
    bottom: calc(var(--h) + 10px);
    padding: 3px 7px;
    border-radius: 7px;
    font-size: 11px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--ink);
    background: var(--fg);
    box-shadow: 0 6px 16px -6px rgb(0 0 0 / 0.5);
    translate: clamp(6px, calc(var(--hover, 0) * 100cqi - 50%), calc(100cqi - 100% - 6px)) 4px;
    opacity: 0;
    pointer-events: none;
    transition:
      opacity var(--pulse-dur-fast) var(--pulse-ease-out),
      translate var(--pulse-dur-fast) var(--pulse-ease-out);
  }
  @media (hover: hover) {
    .progress:hover .progress__tip {
      opacity: 1;
      translate: clamp(6px, calc(var(--hover, 0) * 100cqi - 50%), calc(100cqi - 100% - 6px)) 0;
    }
  }
  .progress[data-scrubbing] .progress__tip {
    opacity: 1;
    translate: clamp(6px, calc(var(--hover, 0) * 100cqi - 50%), calc(100cqi - 100% - 6px)) 0;
  }

  /* ─── Disc (tiny containers) ───────────────────────────────────── */
  .disc,
  .disc-toggle {
    display: none;
  }
  .disc {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: 50%;
  }
  .disc__ring {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    rotate: -90deg;
  }
  .disc__ring circle {
    fill: none;
    stroke-width: 3;
  }
  .disc__track {
    stroke: rgb(255 255 255 / 0.14);
  }
  .disc__progress {
    stroke: var(--accent);
    stroke-linecap: round;
    stroke-dasharray: 100 100;
    stroke-dashoffset: calc(100 - var(--progress, 0) * 100);
    transition: stroke-dashoffset 260ms linear;
  }
  .disc .eq {
    position: absolute;
    left: 50%;
    bottom: 18%;
    translate: -50% 0;
    --eq-h: 14%;
    --eq-w: 2px;
    height: 12%;
  }
  .disc-toggle {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    color: #fff;
    background: rgb(0 0 0 / 0.38);
    transition: background-color var(--pulse-dur-base) var(--pulse-ease-out);
  }
  .disc-toggle > .glyphs {
    width: 34%;
    height: 34%;
    margin: auto;
    filter: drop-shadow(0 1px 4px rgb(0 0 0 / 0.5));
  }
  .disc-toggle:hover {
    background: rgb(0 0 0 / 0.5);
  }

  /* ─── Resize handle ────────────────────────────────────────────── */
  .resize {
    position: absolute;
    right: 2px;
    bottom: 8px;
    z-index: 4;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    color: var(--muted);
    cursor: nwse-resize;
    touch-action: none;
    opacity: 0.55;
    transition:
      opacity var(--pulse-dur-fast) var(--pulse-ease-out),
      color var(--pulse-dur-fast) var(--pulse-ease-out),
      scale var(--pulse-dur-spring) var(--pulse-ease-pop);
  }
  .resize > .icon {
    width: 16px;
    height: 16px;
  }
  .resize:hover,
  .resize:focus-visible,
  .player[data-resizing] .resize {
    opacity: 1;
    color: var(--fg);
    scale: 1.12;
  }
  .player[data-resizing] {
    cursor: nwse-resize;
    user-select: none;
  }

  /* ─── Responsive tiers (container width) ───────────────────────── */
  .fold {
    transition:
      opacity var(--pulse-dur-base) var(--pulse-ease-out),
      scale var(--pulse-dur-spring) var(--pulse-ease-gentle),
      display var(--pulse-dur-base) allow-discrete;
  }
  @starting-style {
    .fold {
      opacity: 0;
      scale: 0.85;
    }
  }
  @container pulse (width < 460px) {
    .fold--wide {
      display: none;
      opacity: 0;
      scale: 0.85;
    }
  }
  @container pulse (width < 360px) {
    .fold--medium {
      display: none;
      opacity: 0;
      scale: 0.85;
    }
  }
  @container pulse (width < 280px) {
    .fold--narrow {
      display: none;
      opacity: 0;
      scale: 0.85;
    }
    .controls {
      gap: 4px;
    }
  }
  @container pulse (width < 210px) {
    .fold--compact {
      display: none;
      opacity: 0;
      scale: 0.85;
    }
    .player {
      --art: clamp(44px, 32cqi, 64px);
      --title: clamp(13px, 7.2cqi, 16px);
    }
  }
  @container pulse (width < 128px) {
    .player {
      grid-template-columns: 1fr;
      width: min(100%, 112px);
      aspect-ratio: 1;
      padding: 0;
      border-radius: 50%;
      margin-inline: auto;
    }
    .body,
    .progress,
    .art__hover {
      display: none;
    }
    .art {
      width: 100%;
      border-radius: 50%;
      box-shadow: none;
    }
    .disc,
    .disc-toggle {
      display: block;
    }
    .resize {
      right: -4px;
      bottom: -4px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      color: #fff;
      opacity: 1;
      background: rgb(0 0 0 / 0.72);
      box-shadow: 0 0 0 1px rgb(255 255 255 / 0.2);
    }
    .resize > .icon {
      width: 12px;
      height: 12px;
    }
  }

  /* ─── Keyframes ────────────────────────────────────────────────── */
  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }
  @keyframes art-in {
    from {
      opacity: 0;
      scale: 1.08;
    }
  }
  @keyframes meta-in {
    from {
      opacity: 0;
      translate: 0 0.45em;
      filter: blur(3px);
    }
  }
  @keyframes spin {
    to {
      rotate: 360deg;
    }
  }
  @keyframes shake {
    20%,
    60% {
      translate: -3px 0;
    }
    40%,
    80% {
      translate: 3px 0;
    }
  }

  @media (forced-colors: active) {
    .player {
      border: 1px solid CanvasText;
    }
    .progress__fill,
    .eq i {
      background: Highlight;
    }
  }
`
