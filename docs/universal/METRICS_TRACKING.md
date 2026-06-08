# Pulse — adoption metrics tracking

This file is the maintainer's measurement discipline for the Day 7 / Day 30 / Day 90 launch cycle described in [`LAUNCH_THREADS.md`](./LAUNCH_THREADS.md). The targets below are honest baselines for an indie OSS UI library in 2026, not stretch goals.

## How to fill in the snapshots

Run the bash block below at each checkpoint. Paste the output into the matching table below. Repeat at Day 7, Day 30, Day 90 (and at major milestones thereafter).

```bash
# Stars + forks
gh repo view YamadaBlog/pulse-player --json stargazerCount,forkCount,watchers,openIssuesCount

# npm downloads (last 7 days, per package)
for pkg in types core tokens web-component react svelte react-native; do
  dl=$(curl -s "https://api.npmjs.org/downloads/point/last-week/@pulse-music/$pkg" \
        | python -c "import json,sys; print(json.load(sys.stdin).get('downloads', 0))")
  echo "@pulse-music/$pkg: $dl"
done

# Open / closed issues + PRs
gh issue list --state open  --limit 100 | wc -l
gh issue list --state closed --limit 100 | wc -l
gh pr   list --state all    --limit 100 | wc -l

# Discussions
gh api graphql -f query='{ repository(owner: "YamadaBlog", name: "pulse-player") { discussions(first: 100) { totalCount nodes { comments { totalCount } } } } }' \
  --jq '.data.repository.discussions | {total: .totalCount, comments: ([.nodes[].comments.totalCount] | add)}'
```

## Targets

The numbers below are **realistic for an indie-authored multi-framework UI library launched in 2026** (extrapolated from [shadcn/ui's growth curve](https://www.untitledui.com/blog/react-component-libraries), [Vidstack's NPM trajectory](https://www.npmjs.com/package/vidstack), and the brutal alpha.24 audit comparing against established competitors at 30 000 / 25 000 / 104 000 stars).

| Day    | Stars       | npm dl / week (sum across all 7 packages) | External issues + PRs | Discussion comments (excl. self) | Verdict                                           |
| ------ | ----------- | ----------------------------------------- | --------------------- | -------------------------------- | ------------------------------------------------- |
| **7**  | **≥ 50**    | **≥ 100**                                 | **≥ 3**               | **≥ 5**                          | Soft launch survived. Continue.                   |
| **30** | **≥ 200**   | **≥ 1 000**                               | **≥ 10**              | **≥ 20**                         | Real adoption signal. Phase 2 prep can start.     |
| **90** | **≥ 1 000** | **≥ 5 000**                               | **≥ 30**              | **≥ 50**                         | Phase 2 trigger met — Premium Themes Pack viable. |

### Below-target action triage

| Day 7 outcome | What to do                                                                                                                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0-10 stars    | Launch posts didn't land. Re-evaluate the headline pitch (the comparison vs Plyr / Vidstack may be too defensive). Cross-post to Lobsters + Discord communities the maintainer is already in. |
| 11-30 stars   | Marginal signal. Iterate on the README hero — what's the ONE sentence that hooks?                                                                                                             |
| 31-50 stars   | On track. Engage every commenter <48 h. Don't ship more code; ship more conversations.                                                                                                        |
| ≥ 51 stars    | Ahead of plan. Schedule the dev.to article + Bluesky follow-up.                                                                                                                               |

| Day 30 outcome | What to do                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| < 100 stars    | The market doesn't want this shape. Consider niche pivot (e.g. "Pulse for Vue portfolio sites" instead of "multi-framework"). |
| 100-200 stars  | Slow but real. Continue Phase 1, no Phase 2 acceleration.                                                                     |
| ≥ 200 stars    | On track. Start drafting the Premium Themes Pack (Phase 2 prep).                                                              |

| Day 90 outcome                | What to do                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| < 500 stars                   | Sunset gracefully or hand off. The investment beyond this point doesn't return commercially. |
| 500-1 000 stars               | Phase 2 can ship but expect $0-2 000/year. Decide if worth the effort.                       |
| ≥ 1 000 stars + ≥ 5 000 dl/wk | Phase 2 trigger met. Build the Premium Themes Pack.                                          |

## Snapshot table (fill in at each checkpoint)

| Date           | Day   | Stars | Forks | Watchers | npm dl/wk (sum) | Open issues | PRs   | Discussion comments                     | Notes                                                           |
| -------------- | ----- | ----- | ----- | -------- | --------------- | ----------- | ----- | --------------------------------------- | --------------------------------------------------------------- |
| **2026-06-08** | **0** | **0** | **0** | **0**    | **0**           | **0**       | **0** | **1** (maintainer's own comment on #24) | Baseline. All packages just published. No external traffic yet. |
| _2026-06-15_   | _7_   | _TBD_ | _TBD_ | _TBD_    | _TBD_           | _TBD_       | _TBD_ | _TBD_                                   | _Fill in after Day 7_                                           |
| _2026-07-08_   | _30_  | _TBD_ | _TBD_ | _TBD_    | _TBD_           | _TBD_       | _TBD_ | _TBD_                                   | _Fill in after Day 30_                                          |
| _2026-09-06_   | _90_  | _TBD_ | _TBD_ | _TBD_    | _TBD_           | _TBD_       | _TBD_ | _TBD_                                   | _Fill in after Day 90_                                          |

## Sources / metric definitions

- **Stars** = absolute GitHub star count via `gh repo view`. Not "stars per week"; cumulative.
- **npm dl/wk** = `last-week` window from the npm registry API. Sum across all 7 `@pulse-music/*` packages.
  - Note: a single consumer typically pulls multiple packages (`@pulse-music/react` brings in `@pulse-music/core`, `@pulse-music/web-component`, `@pulse-music/types`). The sum overestimates "unique installers" by ~3-4x. Use it as a trend, not an absolute headcount.
- **External issues + PRs** = anything opened by a GitHub user other than `YamadaBlog`.
- **Discussion comments excl. self** = anything by a user other than the maintainer in [github.com/YamadaBlog/pulse-player/discussions](https://github.com/YamadaBlog/pulse-player/discussions). The seed thread `#24` doesn't count as "external traffic" since the maintainer opened it.

## Honesty discipline

When filling in the snapshots:

- **Don't round up.** If Day 7 shows 12 stars, write 12. Not "~15".
- **Don't include sock-puppet stars / downloads.** If the maintainer self-installs to test, that traffic doesn't count.
- **Update verdict against target in the same commit.** "47/50 stars, below target by 3" is more useful than "47 stars, almost there!".
- **If the verdict is "sunset"** at Day 90, ship a `SUNSET.md` doc explaining why + thanking early adopters + pointing at the alternatives (Vidstack / Plyr / Howler). Don't ghost.
