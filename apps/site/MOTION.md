# The showcase's motion system

The site moves like the record it presents. This page is its grammar: read it before you add or change an animation.

## Time: side A's tempo

Every duration is a fraction of the beat of “Projector Screen”, the first track, at 70.06 BPM:

| Value         | Duration | CSS        | TypeScript (`src/scripts/tempo.ts`) | Typical use                         |
| ------------- | -------- | ---------- | ----------------------------------- | ----------------------------------- |
| Beat          | 856 ms   | `--beat`   | `BEAT`                              | Reveals, wipes, a chapter's gesture |
| Eighth        | 428 ms   | `--beat-2` | `EIGHTH`                            | Morphs, secondary moves             |
| Sixteenth     | 214 ms   | `--beat-4` | `SIXTEENTH`                         | UI responses (hover, press, colour) |
| Thirty-second | 107 ms   | `--beat-8` | `THIRTY_SECOND`                     | Staggers, the smallest step         |

Dotted values (×1.5) and multiples are fine. Loops last half a bar (two beats). Do not write a literal duration. There are three exceptions:

- the 33⅓ RPM spins (1.8 s per turn), which follow physics rather than tempo;
- continuous follow-ups, such as the tonearm creeping in as the track plays;
- anything the reader drives, such as scrubs and drags.

## Curves: the player's own

The curves are the component's `EASING` tokens (`@pulse-music/tokens`), the ones every `<pulse-player>` on the page uses. In CSS they are `--ease-out`, `--ease-in-out`, `--ease-in`, `--ease-pop` and `--ease-gentle`. In GSAP they are `EASE.out`, `EASE.inOut`, `EASE.in`, `EASE.pop` and `EASE.gentle`, which are `CustomEase` curves built from the same values. There are no hand-made cubic-béziers, with one exception: Dialects' slot-machine roll needs its anticipation.

## Grammar

1. **One gesture per chapter.** A chapter opens the same way every time: the needle line draws, then its labels land a thirty-second apart and the headline rises out of its masks. After that it has a single gesture of its own:

   | Chapter      | Gesture                                                                     | Trigger             |
   | ------------ | --------------------------------------------------------------------------- | ------------------- |
   | A1 Hero      | Opening: title, record out of the sleeve, console, arm, meter sweep         | First load          |
   | A1 Needle    | Arm swings in, stylus lands, one ring through the groove, platter spins up  | Press               |
   | A2 Grows     | The player folds from 760 px down to a disc                                 | Scrubbed by scroll  |
   | A3 Moods     | The new mood spreads from the swatch (view transition)                      | Press               |
   | Interlude    | The record turns to side B, then the night floods out of it                 | Once, reversed back |
   | B2 Listens   | The camera straightens over the landscape                                   | Scrubbed by scroll  |
   | C1 The reel  | The film opens from the pointer, and its timeline follows it frame by frame | Press               |
   | C2 Pressings | The numbers count up                                                        | Once, in view       |

2. **Cause, then effect.** A change starts where it was caused:
   - moods, page changes and the reel open from the click or from the control's edge;
   - the ring starts at the stylus;
   - the reel's rewind runs back from where the tape stood.

3. **Masks, not fades.** Text rises out of masks and states wipe. No frame shows two states at half opacity. Chrome that changes state, like the header's side, cuts in one frame, because a fade would pass through grey.

4. **Continuity.** The same things carry across the page:
   - one record, in the hero, the interlude and the reel;
   - one chapter opening;
   - the header's track code and scroll playhead;
   - one roll for any text that changes in place (`createRoll`: the new value rides in under the old, so the slot is never empty).

5. **Sound and picture together.** The music starts when the stylus touches the groove, not at the click. The platter and the pitch spin up and run down together (`deck.ts`). The word “plays” is an equaliser.

6. **Scroll.** Only continuous things follow the scrollbar: A2's width and B2's camera. Events play once, and the interlude reverses when you scroll back above it.

7. **Every frame is composed.** Starting states exist before the first paint:
   - `html.intro` for the hero;
   - `[data-split]` headlines, held invisible until they are split;
   - `html.static`, the safety net if the scripts never boot.

   The page never shows a final state and then takes it away. A page being swapped out is stopped (`kill()`), not restored.

## Reduced motion

With reduced motion, everything is complete and still. There is no smooth scrolling and no opening; the interlude is already flipped and the counters show their values. Reveals are instant, and the reel still plays when asked.

## Checking a change

Review motion frame by frame, not in real time:

- **GSAP, timers and rAF.** Install Playwright's fake clock and pause it before `page.goto`, then step it with `clock.runFor()`, capturing a screenshot at each step. Never call `setTimeout` inside `evaluate` under the fake clock.
- **CSS animations, view transitions and video.** These run on the compositor's clock, so capture them in real time with the DevTools screencast (`Page.startScreencast`). Use Chrome (`channel: 'chrome'`) for H.264.

Check at 390 px and 1440 px wide, with and without reduced motion. Stop the capture at any frame: it should still look intended.
