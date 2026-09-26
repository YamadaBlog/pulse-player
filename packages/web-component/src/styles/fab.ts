import { css } from 'lit'

export const fabStyles = css`
  :host {
    --size: 64px;
    --inset: 20px;
    position: fixed;
    z-index: var(--pulse-fab-z, 1000);
    right: calc(var(--inset) + env(safe-area-inset-right, 0px));
    bottom: calc(var(--inset) + env(safe-area-inset-bottom, 0px));
    width: var(--size);
    height: var(--size);
    color-scheme: dark;
  }
  :host([placement='bottom-start']) {
    right: auto;
    left: calc(var(--inset) + env(safe-area-inset-left, 0px));
  }
  :host([placement='top-end']) {
    bottom: auto;
    top: calc(var(--inset) + env(safe-area-inset-top, 0px));
  }
  :host([placement='top-start']) {
    bottom: auto;
    right: auto;
    top: calc(var(--inset) + env(safe-area-inset-top, 0px));
    left: calc(var(--inset) + env(safe-area-inset-left, 0px));
  }
  :host([placement='inline']) {
    position: relative;
    inset: auto;
    display: inline-block;
    vertical-align: middle;
  }
  :host([data-snapping]) {
    transition: translate var(--pulse-dur-spring) var(--pulse-ease-pop);
  }
  :host([variant='light']) {
    --_ink: #ffffff;
  }

  .fab {
    --sx: -1;
    --sy: -1;
    position: relative;
    width: 100%;
    height: 100%;
    transition:
      opacity var(--pulse-dur-base) var(--pulse-ease-out),
      scale var(--pulse-dur-spring) var(--pulse-ease-pop),
      visibility var(--pulse-dur-spring) allow-discrete;
  }
  .fab:not([data-shown]) {
    opacity: 0;
    scale: 0.3;
    visibility: hidden;
    pointer-events: none;
  }
  @starting-style {
    .fab[data-shown] {
      opacity: 0;
      scale: 0.3;
    }
  }
  :host([placement$='start']) .fab {
    --sx: 1;
  }
  :host([placement^='top']) .fab {
    --sy: 1;
  }

  /* ─── Halo + heartbeat ─────────────────────────────────────────── */
  .halo {
    position: absolute;
    inset: -30%;
    border-radius: 50%;
    background: radial-gradient(
      closest-side,
      color-mix(in oklab, var(--accent) 55%, transparent),
      transparent
    );
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--pulse-dur-slow) var(--pulse-ease-out);
    will-change: transform, opacity;
  }
  .fab[data-playing] .halo {
    opacity: 0.35;
  }
  .pulso::before,
  .pulso::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1.5px solid color-mix(in oklab, var(--accent) 70%, #fff);
    opacity: 0;
    pointer-events: none;
  }
  .fab[data-pulso][data-playing] .pulso::before {
    animation: wave 2.6s var(--pulse-ease-out) infinite;
  }
  .fab[data-pulso][data-playing] .pulso::after {
    animation: wave 2.6s var(--pulse-ease-out) 0.28s infinite;
  }
  .fab[data-pulso][data-playing] .disc {
    animation: beat 2.6s var(--pulse-ease-out) infinite;
  }

  /* ─── Disc ─────────────────────────────────────────────────────── */
  .disc {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    overflow: hidden;
    isolation: isolate;
    color: #fff;
    background: var(--bg);
    box-shadow:
      0 14px 34px -10px rgb(0 0 0 / 0.65),
      0 0 0 1px var(--border),
      0 0 26px -6px color-mix(in oklab, var(--accent) 60%, transparent);
    cursor: pointer;
    touch-action: none;
    user-select: none;
    transition:
      scale var(--pulse-dur-spring) var(--pulse-ease-pop),
      box-shadow var(--pulse-dur-base) var(--pulse-ease-out);
  }
  .disc:hover {
    scale: 1.06;
  }
  .disc:active {
    scale: 0.92;
    transition-duration: var(--pulse-dur-instant);
  }
  .fab[data-dragging] .disc {
    scale: 1.1;
    cursor: grabbing;
    box-shadow:
      0 26px 50px -12px rgb(0 0 0 / 0.7),
      0 0 0 1px var(--border),
      0 0 34px -4px color-mix(in oklab, var(--accent) 70%, transparent);
  }
  .disc__cover,
  .disc__placeholder {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: -2;
  }
  .disc__cover {
    animation: fade-in 700ms var(--pulse-ease-out) both;
  }
  .disc__scrim {
    position: absolute;
    inset: 0;
    z-index: -1;
    background: radial-gradient(circle, rgb(0 0 0 / 0.2), rgb(0 0 0 / 0.5));
  }
  :host(:not([variant='auto']):not([variant=''])) .disc__scrim {
    display: none;
  }
  :host(:not([variant='auto'])) .disc {
    color: var(--fg);
  }
  .disc > .glyphs {
    position: absolute;
    inset: 33%;
    filter: drop-shadow(0 1px 4px rgb(0 0 0 / 0.45));
  }
  .disc .eq {
    position: absolute;
    left: 50%;
    bottom: 15%;
    translate: -50% 0;
    --eq-h: 12%;
    --eq-w: 2px;
    height: 11%;
    opacity: 0;
    transition: opacity var(--pulse-dur-base) var(--pulse-ease-out);
  }
  .fab[data-playing] .disc .eq {
    opacity: 1;
  }
  .ring {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    rotate: -90deg;
    pointer-events: none;
  }
  .ring circle {
    fill: none;
    stroke-width: 3.5;
  }
  .ring__track {
    stroke: rgb(255 255 255 / 0.12);
  }
  .ring__progress {
    stroke: var(--accent);
    stroke-linecap: round;
    stroke-dasharray: 100 100;
    stroke-dashoffset: calc(100 - var(--progress, 0) * 100);
    transition: stroke-dashoffset 300ms linear;
  }

  /* ─── Options button ───────────────────────────────────────────── */
  .more {
    position: absolute;
    top: -4px;
    right: -4px;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    color: #fff;
    background: rgb(20 20 26 / 0.86);
    backdrop-filter: blur(10px);
    box-shadow:
      0 0 0 1px rgb(255 255 255 / 0.16),
      0 4px 12px rgb(0 0 0 / 0.4);
    opacity: 0;
    scale: 0.6;
    transition:
      opacity var(--pulse-dur-fast) var(--pulse-ease-out),
      scale var(--pulse-dur-spring) var(--pulse-ease-pop);
  }
  :host([placement$='start']) .more {
    right: auto;
    left: -4px;
  }
  .more > .icon {
    width: 14px;
    height: 14px;
  }
  .fab:hover .more,
  .more:focus-visible,
  .fab[data-menu] .more {
    opacity: 1;
    scale: 1;
  }
  .fab[data-dragging] .more {
    opacity: 0;
  }

  /* ─── Radial menu ──────────────────────────────────────────────── */
  .menu {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .item {
    --r: calc(var(--size) * 1.15);
    --a: calc(var(--i) * 45deg);
    position: absolute;
    left: calc(50% - 21px);
    top: calc(50% - 21px);
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    color: #fff;
    background: rgb(20 20 26 / 0.9);
    backdrop-filter: blur(14px);
    box-shadow:
      0 0 0 1px rgb(255 255 255 / 0.14),
      0 10px 24px -8px rgb(0 0 0 / 0.6);
    opacity: 0;
    scale: 0.3;
    translate: 0 0;
    transition:
      translate var(--pulse-dur-spring) var(--pulse-ease-pop),
      scale var(--pulse-dur-spring) var(--pulse-ease-pop),
      opacity var(--pulse-dur-fast) var(--pulse-ease-out),
      background-color var(--pulse-dur-fast) var(--pulse-ease-out);
  }
  .item > .icon {
    width: 18px;
    height: 18px;
  }
  .fab[data-menu] .menu {
    pointer-events: auto;
  }
  .fab[data-menu] .item {
    opacity: 1;
    scale: 1;
    translate: calc(var(--sx) * cos(var(--a)) * var(--r)) calc(var(--sy) * sin(var(--a)) * var(--r));
    transition-delay: calc(var(--i) * 45ms);
  }
  .item:hover,
  .item:focus-visible {
    background: color-mix(in oklab, var(--accent) 45%, rgb(20 20 26));
  }
  .item--close:hover,
  .item--close:focus-visible {
    background: #c43d4b;
  }

  /* ─── Peek label ───────────────────────────────────────────────── */
  .peek {
    position: absolute;
    top: 50%;
    right: calc(100% + 12px);
    max-width: min(260px, 60vw);
    padding: 8px 12px;
    border-radius: 12px;
    font-size: 12.5px;
    line-height: 1.3;
    white-space: nowrap;
    color: #fff;
    background: rgb(18 18 24 / 0.9);
    backdrop-filter: blur(14px);
    box-shadow:
      0 0 0 1px rgb(255 255 255 / 0.12),
      0 12px 28px -10px rgb(0 0 0 / 0.6);
    opacity: 0;
    translate: 10px -50%;
    pointer-events: none;
    transition:
      opacity var(--pulse-dur-base) var(--pulse-ease-out),
      translate var(--pulse-dur-spring) var(--pulse-ease-gentle);
  }
  :host([placement$='start']) .peek {
    right: auto;
    left: calc(100% + 12px);
    translate: -10px -50%;
  }
  .peek strong,
  .peek span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .peek span {
    color: rgb(255 255 255 / 0.62);
  }
  @media (hover: hover) {
    .fab:not([data-menu]):not([data-dragging]):hover .peek {
      opacity: 1;
      translate: 0 -50%;
    }
  }
  .fab:not([data-menu]):has(.disc:focus-visible) .peek {
    opacity: 1;
    translate: 0 -50%;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }
  @keyframes wave {
    0% {
      opacity: 0.55;
      scale: 1;
    }
    70%,
    100% {
      opacity: 0;
      scale: 1.75;
    }
  }
  @keyframes beat {
    0%,
    24%,
    100% {
      scale: 1;
    }
    6%,
    18% {
      scale: 1.05;
    }
    12% {
      scale: 1.01;
    }
  }
`
