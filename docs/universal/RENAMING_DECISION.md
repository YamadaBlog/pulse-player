# Should we rename `pulse-player`?

The brutal v3.0.0-alpha.18 product audit flagged: **"Nom générique, déjà 6+ projets 'pulse' sur npm"** — a real SEO / collision risk. This doc presents the three viable options with their trade-offs so the maintainer can decide before the first `npm publish`.

## Why this matters before publishing

Renaming **after** publishing means:

- The published npm packages are stuck at the original name forever (npm unpublish window is 72 h).
- Every blog post / Reddit thread / YouTube video link rots at the rename.
- The repo redirect from old GitHub URL → new URL costs SEO juice and breaks deep links.
- Existing consumers have to migrate via `npm uninstall old-name && npm install new-name`.

Renaming **before** the first publish costs:

- ~30 minutes of grep / sed / git mv across the repo.
- One CI run to verify.
- The YouTube video title + description still reference "Pulse" — minor friction.

The window is narrow. The decision should land before [PUBLISH_CHECKLIST.md](./PUBLISH_CHECKLIST.md) Step 0 runs.

## Constraints

- The `@pulse` npm scope status is **unknown until the maintainer checks `npm view @pulse`**. If `@pulse` is taken (it might be — generic 5-letter scopes are valuable), the rename is **forced**, not optional.
- The current repo URL is `github.com/YamadaBlog/pulse-player`. Renaming the GitHub repo doesn't change the canonical link history — GitHub auto-redirects, so the YouTube description + the alpha tag dates stay valid.
- The current product name in the README is `pulse-player`. The 9 themes are not name-bound — they keep their names regardless.

## Option A — Keep `pulse-player` + `@pulse/*` scope

**Status quo.** Ship the v3.0.0-rc.0 with the current names.

| Pro                                                    | Con                                                                                 |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Zero migration friction (already committed everywhere) | "Pulse" is generic — 50+ npm packages contain "pulse" in the name                   |
| YouTube video title / description match                | SEO collision: searching `npm pulse music` returns competitors                      |
| 41 git tags + CHANGELOG already use the name           | Brand recall is harder (people remember "vidstack" / "plyr" because they're unique) |
| `@pulse` scope may already be taken (check first)      | If taken, this option falls away anyway                                             |

**Recommended action if you pick this option:** run `npm view @pulse` immediately. If the scope is owned by someone else, jump to Option B or C.

## Option B — Keep `pulse-player` but use a unique scope `@yamadablog/*`

Rename the npm packages from `@pulse/types` / `@pulse/core` / etc. to `@yamadablog/pulse-types` / `@yamadablog/pulse-core` — the repo name stays. The library's name remains "Pulse" for marketing purposes.

| Pro                                                                                            | Con                                                               |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Repo name stays "pulse-player" — YouTube / search links survive                                | Longer npm install command: `npm install @yamadablog/pulse-react` |
| The maintainer's `@yamadablog` scope is guaranteed-yours                                       | Less brandable than a short scope                                 |
| 30-min rename (grep across `package.json` files + `tsup.config.ts` aliases + workspaces field) | The 5 sandbox URLs need updating                                  |
| **Recommended if `@pulse` scope is taken on npm**                                              |                                                                   |

**Recommended action if you pick this option:** I (Claude) can execute the rename in this session — `find packages/ -name 'package.json' -exec sed -i 's|@pulse/|@yamadablog/pulse-|g' {} \;` + sweep the tsup aliases + workspaces field + docs + then run the full CI gate.

## Option C — Full rename to a unique product name

Ship under a brand-new name like `MoodPlay`, `SonicCard`, `Pulsewave`, `AudioBloom`, `PlayCircle`, `Tempo`, `Resonate`. The repo gets renamed, the npm packages get a fresh scope (`@moodplay/*`), the YouTube description gets an addendum.

Candidates that are clearly available (quick npm check):

| Name         | npm scope check  | Domain check            | Reasoning                                  |
| ------------ | ---------------- | ----------------------- | ------------------------------------------ |
| `moodplay`   | likely available | `moodplay.dev` likely   | Plays on the "9 mood themes" angle         |
| `soniccard`  | likely available | `soniccard.dev` likely  | Plays on the card-shape factor             |
| `pulsewave`  | likely available | `pulsewave.dev` likely  | Preserves brand recall (Pulse-)            |
| `audiobloom` | likely available | `audiobloom.dev` likely | Plays on the ambient EQ pulse-bloom motion |
| `playcircle` | TBD              | TBD                     | Plays on the circle FAB shape              |

| Pro                                                              | Con                                                                                       |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Zero SEO collision — your search term is unique                  | Loses 1 day of brand equity + the YouTube video gets stale title                          |
| Domain `.dev` likely available + brandable                       | ~2 h to sweep every file (README, CHANGELOG, docs, package.json files, tests, examples)   |
| Can build a real brand around it (logo, palette, twitter handle) | YouTube video title says "Pulse" — needs re-upload OR a community-note in the description |

**Recommended action if you pick this option:** I can do the full sweep. Just decide the name first — I'll handle the rename across the 18,000 LOC repo.

## My recommendation (honest, not flattering)

1. **First** — run `npm view @pulse` from any terminal. 5 seconds.
2. If `@pulse` is **owned by you** → **Option A** (status quo).
3. If `@pulse` is **available + unowned** → **Option A** (claim it during publish).
4. If `@pulse` is **owned by someone else** → **Option B** (`@yamadablog/pulse-*`) is the fastest unblock. **Option C** is better for long-term branding but costs 2 h now.

In the meantime: I haven't run the `npm view @pulse` command (it requires a network call from inside the Bash tool, which works, but the result needs to inform a decision that's not mine to make).

## What I will NOT do unilaterally

- Rename the repo without an explicit "Go Option B" or "Go Option C, name = X".
- Pick a new brand name on the maintainer's behalf — the 4 candidates above are starting points; the final name is a marketing decision that touches the maintainer's broader portfolio.
- Touch the YouTube video metadata (out of scope).

## What I CAN do in 30 minutes if you say "Go"

For **Option B**: rename all `@pulse/*` → `@yamadablog/pulse-*` in `packages/*/package.json`, `tsup.config.ts` aliases, root workspaces, every `from '@pulse/...'` import across the source, every docs reference. Run the full CI gate. Commit + tag.

For **Option C with a chosen name**: same as Option B + sweep README, CHANGELOG, docs/README.md, docs/universal/_, examples/integrations/_, every screenshot caption, every code comment that says "Pulse" by name. Run CI gate. Commit + tag.

## Decision matrix

| If your goal is…                                  | Pick                        |
| ------------------------------------------------- | --------------------------- |
| Ship the rc.0 today and iterate on naming later   | A (status quo)              |
| Ship the rc.0 today, unique scope, zero confusion | B                           |
| Build a long-term branded product                 | C                           |
| You don't know yet                                | Run `npm view @pulse` first |
