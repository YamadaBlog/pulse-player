# @pulse/core

Framework-agnostic audio engine for pulse-player. Pure TypeScript, no DOM, no framework imports.

## What it owns

- The singleton `<audio>` element
- The `AudioContext` + `AnalyserNode` (Web Audio FFT pipeline)
- The state machine (`PulseState`)
- The typed event bus (`subscribe<E>(event, cb)` with discriminated payloads)
- The actions (`toggle`, `next`, `prev`, `loadTrack`, `seek`, `setAudioTracks`, `dispose`)

## Status

⏳ **Scaffold** — implementation lands in v3.0.0-alpha.1. The current reference is `src/lib/useAudioStore.ts` in the validated Vue v2.3.4 implementation; the extraction strips Pinia / Vue refs and re-expresses everything as a plain class with subscriber callbacks.

## License

MIT.
