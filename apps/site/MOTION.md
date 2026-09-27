# The showcase's motion system

The site moves like the record it presents. This page is its grammar: read it before you add or change an animation.

## The stage: one object, one camera

The home page is a scene around a single object. One record lies on a sheet of paper, drawn by one full-screen WebGL2 pass (`src/scripts/stage/`) under the page: a fixed canvas at `z-index: -1`. Sections with a background cover it. The transparent ones, marked `[data-stage-window]` (the hero, the tour, the interlude), are windows onto it.

- **At rest, the page is the table.** The camera looks straight down, and the record lies exactly in its layout box (`[data-record]` in the hero, `[data-stage-dock]` at the end of the tour, `[data-flip-disc]` in the interlude). The floor is the page's own paper, so the flat design and the scene are the same picture.
- **Framing is written like a shot.** A `Shot` gives where the record is on screen and how big it looks (in CSS px), then where the camera stands around it (azimuth, elevation, distance). Framing and angle are independent: the focal length is the radius times the distance, so a dolly keeps the record's size.
- **The director** (`director.ts`) computes the shot as a pure function of the scroll position: the hero, the tour's keys, the landing, the interlude. Every scroll position is therefore one defined frame, in both directions. Positions and sizes are interpolated with an in-out ease, sizes and distances in log space: a zoom is perceived geometrically, and a record growing linearly would sweep through the words beside it.
- **Everyone writes to `stage`, the stage only draws.** The record's physics (spin, inertia, the hand's tilt and light), the needle (swing and lift), the tour (rooms, grooves) and the interlude (flip, ink) each own their fields. The canvas renders on GSAP's ticker (the frame shared with Lenis and ScrollTrigger), only while a window is on screen and only once the labels are painted. It refuses software WebGL (`failIfMajorPerformanceCaveat`, SwiftShader and llvmpipe) and lowers its pixel density if frames run over budget.
- **Without the stage** (no WebGL2, or a CPU renderer), the flat record, the SVG tonearm and the CSS interlude take over. The tour becomes its words, in order.

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
- anything the reader drives, such as scrubs, drags and the camera.

## Curves: the player's own

The curves are the component's `EASING` tokens (`@pulse-music/tokens`), the ones every `<pulse-player>` on the page uses. In CSS they are `--ease-out`, `--ease-in-out`, `--ease-in`, `--ease-pop` and `--ease-gentle`. In GSAP they are `EASE.out`, `EASE.inOut`, `EASE.in`, `EASE.pop` and `EASE.gentle`, which are `CustomEase` curves built from the same values. There are no hand-made cubic-béziers, with one exception: Dialects' slot-machine roll needs its anticipation.

## Grammar

1. **The motion is the journey, not a feature to launch.** It runs where the reader already is: the opening plays on arrival, the tour happens as you scroll, and the reel previews itself (muted) as it comes into view. Pressing things adds sound and control, never the motion itself.

2. **One gesture per chapter.** A chapter opens the same way every time: the needle line draws, then its labels land a thirty-second apart and the headline rises out of its masks. After that it has a single gesture of its own:

   | Chapter      | Gesture                                                                                                        | Trigger                     |
   | ------------ | -------------------------------------------------------------------------------------------------------------- | --------------------------- |
   | A1 Opening   | The camera starts low in a paper room and cranes up until the room is a page; the sleeve lands, the words rise | Arrival (any input skips)   |
   | A1 Needle    | The arm swings, lowers and lands; one ring runs through the groove; the platter and the pitch spin up          | Press                       |
   | A1 The tour  | Four shots around the record: lift-off, high above then down to the rim, three rooms lit by moods, the grooves | Scrubbed by scroll (pinned) |
   | A2 Grows     | The player folds from 760 px down to a disc                                                                    | Scrubbed by scroll          |
   | A3 Moods     | The new mood spreads from the swatch (view transition)                                                         | Press                       |
   | Interlude    | The record lifts, turns to side B in the air and lands; the night spreads over the table like ink              | Once, reversed back         |
   | B2 Listens   | The camera straightens over the landscape                                                                      | Scrubbed by scroll          |
   | C1 The reel  | Previews itself, muted; a press rewinds it and plays it with sound, its timeline following frame by frame      | In view, then press         |
   | C2 Pressings | The numbers count up                                                                                           | Once, in view               |

3. **Cause, then effect.** A change starts where it was caused:
   - moods, page changes and the reel open from the click or from the control's edge;
   - the ring starts at the stylus;
   - the ink starts under the record;
   - the reel's rewind runs back from where the tape stood.

4. **Masks, not fades.** Text rises out of masks and states wipe. No frame shows two states at half opacity. A shot's words roll out the top before the next shot's roll in from below, so two shots' words never share the screen. Chrome that changes state, like the header's side, cuts in one frame, because a fade would pass through grey. The tour's HUD is one colour, blended with `difference`, so it stays legible over paper, vinyl and every room.

5. **Continuity.** The same things carry across the page:
   - one record, from the hero through the tour to the interlude (and in the reel, on film);
   - one chapter opening;
   - the reel's HUD (slate, timecode, shot number) framing the tour;
   - the header's track code and scroll playhead;
   - one roll for any text that changes in place (`createRoll`: the new value rides in under the old, so the slot is never empty).

6. **Sound and picture together.** The music starts when the stylus touches the groove, not at the click. The platter and the pitch spin up and run down together (`deck.ts`). The grooves carry the live spectrum. When no music plays in the tour's last shot, they show a made-up one, and a button offers the real thing. The word “plays” is an equaliser.

7. **Scroll.** Continuous things follow the scrollbar: the camera, A2's width and B2's camera. Events play once, and the interlude reverses when you scroll back above it. Words don't linger when the camera moves: a shot holds while its words leave, and only then does the camera move on.

8. **Every frame is composed.** Starting states exist before the first paint:
   - `html.intro` for the hero: an empty table, then the opening;
   - `[data-split]` headlines, held invisible until they are split;
   - `html.static`, the safety net if the scripts never boot.

   The page never shows a final state and then takes it away. The stage shows nothing until its labels are painted. A page being swapped out is stopped (`kill()`), not restored.

## Reduced motion

With reduced motion, everything is complete and still:

- no smooth scrolling, no opening and no tour, so the record stays in the hero and the tour becomes its words;
- the interlude is already flipped;
- the counters show their values, and reveals are instant;
- the reel does not preview itself, but it still plays when asked.

## Checking a change

Review motion frame by frame, not in real time:

- **GSAP, timers and rAF (the stage included).** Install Playwright's fake clock and pause it before `page.goto`, then step it with `clock.runFor()`, capturing a screenshot at each step. Never call `setTimeout` inside `evaluate` under the fake clock.
- **CSS animations, WAAPI rolls, view transitions and video.** These run on the compositor's clock, so capture them in real time with the DevTools screencast (`Page.startScreencast`). A roll captured under the fake clock looks one step behind.
- **The scroll choreography.** Step through scroll positions (a fraction of a screen at a time), and also scroll for real with the wheel: fast scrolls reveal overlaps that slow ones never show.
- **The stage state.** `?stage-debug` exposes it as `window.__stage`, to frame a shot or read the camera from the console.

Check at 390 px and 1440 px wide, with and without reduced motion. Stop the capture at any frame: it should still look intended.
