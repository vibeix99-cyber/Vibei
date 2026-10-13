# RECEIPT-LB — Lane B, W2R3, badge rename "Warm Streak" → "Warm Days"

Raw results only: no verdict, no visual judgement. Written 2026-10-13 ~20:41 UTC (started 20:22:23 UTC, inside the 45-minute box).

## 0. What was reviewed

| | |
|---|---|
| Trial | `e1ddf9d` (`/home/user/wt/w4tr-b`, worktree clean: `git status --short` empty; only ignored dirs `.tmp/`, `node_modules`, `test-results/`) |
| Under review | `pe/w2r3-badge@2994005` (code `0a95fbc`); `git rev-parse HEAD:kettle/src` = `f40b3063…`, same as `2994005:kettle/src` |
| Base | `61aba17`, `kettle/src` = `4556926…` |
| Servers (verified HTTP 200, never started or stopped by me) | trial dev :5475, trial preview :5485, base dev :5470, base preview :5480 |
| Evidence dir | `/home/user/Vibei/kettle/review/product-excellence/contracts/W2R3/review/LB/` (3.4 MB) |
| Scripts used | copied to `…/LB/scripts/` (`live.mjs`, `migrate.mjs`, `roundtrip.mjs`, `crosstab.mjs`, `kit.mjs`, `toast.mjs`, `common.mjs`, chain `.sh` files) |

Browser gate: every browser ran as `python3 -I …/round7-review/tools/slots.py run --lane LB --n 1 -- <cmd>` (one browser per job, a second job at most while no other lane waited). No process of mine is left running (`ps` check at ~20:37: none). Contexts: light, `timezoneId UTC`, `locale en-GB`, service workers blocked, clock frozen at 2026-10-11T07:40Z then resumed (same as the BEFORE set).

## 1. Every occurrence

### 1a. Source diff scope (`git diff 61aba17 HEAD --name-only -- kettle/src kettle/tests kettle/public kettle/index.html kettle/art-src kettle/docs kettle/scripts kettle/package.json kettle/vite.config.ts`)

7 files: `src/progress/{badges.ts, engine.test.ts, seed.ts, validate.ts}`, `src/screens/done/{rank.test.ts, summary.ts}`, `tests/w2-summary.spec.ts`. Numstat: badges.ts +10/-1, engine.test.ts +26/-2, seed.ts +2/-2, validate.ts +15/-1, rank.test.ts +3/-3, summary.ts +1/-1, w2-summary.spec.ts +5/-5.

### 1b. `grep -rn "Warm Streak\|Warm Days" kettle/src kettle/tests` (full output: `check1-grep.txt`)

| File:line | BASE `61aba17` | TRIAL `e1ddf9d` | Kind |
|---|---|---|---|
| `src/progress/badges.ts:18` | `title: 'Warm Streak'` | `title: 'Warm Days'` | catalogue title (the one runtime source) |
| `src/progress/badges.ts:33-39` | — | new `badgeTitle(id, stored)` (no name literal) | resolver |
| `src/progress/validate.ts:168` | — | comment "renamed (Warm Streak → Warm Days)" | comment; `coerceData` now maps `lastReport.badges[].title` through `badgeTitle` |
| `src/progress/seed.ts:19, :247` | "Warm Streak II" (2) | "Warm Days II" (2) | comments |
| `src/screens/done/summary.ts:14` | e.g. "Warm Streak" | e.g. "Warm Days" | comment |
| `src/progress/engine.test.ts:94 / :95` | name "Warm Streak II" | "Warm Days II" | test title |
| `src/progress/engine.test.ts:101` | — | `toMatchObject({ tier: 2, title: 'Warm Days' })` | test |
| `src/progress/engine.test.ts:104, :110, :115` | — | new migration test; old string "Warm Streak" used deliberately as the stored value (:104, :110), "Warm Days" expected (:115) | test |
| `src/screens/done/rank.test.ts:59, :91, :103` | "Warm Streak" / "Warm Streak II" (3) | "Warm Days" / "Warm Days II" (3) | tests |
| `tests/w2-summary.spec.ts:14` | comment "Warm Streak" | comment "Warm Days" | comment |
| `tests/w2-summary.spec.ts:246` | `'Badge: Warm Streak II'` | `'Badge: Warm Days II'` | assertion |
| `tests/w2-summary.spec.ts:335-336` (base) / `:334-336` (trial) | `const own = words.replace(/Warm Streak/g, '')` + `not.toMatch(/streak/i)` on `own` | `expect(words).not.toMatch(/streak/i)` + `toContain('Warm Days II')` | assertion (exemption removed) |

Totals (per file, base → trial): `badges.ts` 1 → 1, `engine.test.ts` 1 → 5, `seed.ts` 2 → 2, `validate.ts` 0 → 1, `rank.test.ts` 3 → 3, `summary.ts` 1 → 1, `w2-summary.spec.ts` 3 → 4; BASE 11 matching lines in `src`+`tests`, TRIAL 17. The old string "Warm Streak" remains in `src`/`tests` only in `engine.test.ts:104,110` (the new migration test, as the stored value) and the `validate.ts:168` comment. Outside `src`/`tests`: `kettle/docs/areas/progress.md:69` still says "Warm Streak II" (changelog line, untouched by the diff). No match in `kettle/public`, `kettle/index.html`. Trial preview bundle (`/tmp/rv7-servers/dist-w4tr-b`): runtime `.js` has `title:\`Warm Days\`` once (in `settings-*.js`) and zero "Warm Streak"; the one "Warm Streak" hit is inside `timer-*.js.map` (source text of the `validate.ts` comment). Base bundle (`dist-w4base`): "Warm Streak" in the matching chunk, "Warm Days" none (`served-bundles-dist.txt`). Dev :5475 serves `badges.ts` with `id: "warm-streak"` / `title: "Warm Days"` (`served-bundles.txt`).

### 1c. `warm-streak` ids

| Scope | BASE | TRIAL |
|---|---|---|
| `src`+`tests` all lines | 20 | 23 |
| `src` non-test lines | 5 | 5 |

Non-test locations, identical on both: `src/art/Badge.tsx:385` (art map key), `src/progress/badgeEngine.ts:53` (metric key), `src/progress/badges.ts:18` (catalogue id), `src/screens/stats/Badges.tsx:18` (unit map key), `src/screens/done/summary.ts:197` (`pill.id === 'warm-streak'`). The +3 are all in the new test in `engine.test.ts` (lines 110, 115, 119); `engine.test.ts` 1 vs 4 (the new test), `rank.test.ts` 3 vs 3, `badges.test.ts` 10 vs 10, `seed.test.ts` 1 vs 1 unchanged. Art: `git rev-parse` of `kettle/src/art` is `9a0ebbf1…` on both; `kettle/src/screens/stats` `f50b0e31…` on both; blob `src/art/Badge.tsx` `495959fe…` on both; `git diff --stat -- kettle/src/art kettle/src/screens/stats kettle/src/progress/badgeEngine.ts` is empty (`check1-art-and-diff.txt`).

### 1d. Persisted places (grep of `kettle:` storage keys in non-test src, `check1-storage-and-usage.txt`)

Keys: `kettle:progress`, `kettle:settings`, `kettle:flow` (sessionStorage), `kettle:timer`, `kettle:leader`, `kettle:nook-hint-seen`, `kettle:nook-static-hint-seen`, `kettle:home:lastVisit`. Regex `Warm (Streak|Days)` over every key of a real post-brew profile on the base (`dump-base-390x844.json`): hits only in `kettle:progress`, as `state.lastReport.badges[0].title`. Callers of `coerceData` in non-test src: `store.ts:71` (migrate), `:93` (readStored), `:212` (hydrate), `:214` (persist merge), `portability.ts:142` (import). Export writes `lastReport: null` (`portability.ts:87`).

### 1e. Other "warm streak" wording that is NOT the badge name (identical on base and trial: sorted grep diff is empty, `check1-other-streak-strings.txt`)

User-facing strings still present on both: `app/Rail.tsx:66` "Start a warm streak", `:233` title "Warm streak", `:236` sr-only "{n} day(s) warm streak"; `screens/stats/StreakCard.tsx:48` "Finish a brew to start your warm streak.", `:100` caption "Warm streak calendar for {monthName}"; `screens/settings/SettingsScreen.tsx:105` "Your warm streak only needs one brew a day…"; `screens/settings/DataSection.tsx:216` "This clears your brews, warm streak, leaves…"; `ui/Gallery.tsx:193` overline "Warm streak"; `progress/badges.ts:18` description "Keep a {n}-day warm streak" (shown in the Stats badge sheet as "Keep a 14-day warm streak" on both builds). The Stats page also exposes the sr-only text "7 days warm streak" on both builds (live JSON: `stats.leafText`).

## 2. Live check, base :5480 vs trial :5485 (light; celebrate seed → Start → `__kettle.finish()` → Summary → Stats › Badges)

Source files: `live-{base,trial}-{390x844,1440x900}.json`, `live-summary.txt`; screenshots `{base,trial}-{390x844,1440x900}-{summary-viewport,summary-pill,stats-badge-button}.png`. Zero page errors and zero console errors in all four runs. Runs: base 390 20:25:00–20:25:25, trial 390 20:26:25–20:26:49, base 1440 20:26:49–20:27:34, trial 1440 20:28:44–20:29:25.

| Surface | BASE (both viewports, identical) | TRIAL (both viewports, identical) |
|---|---|---|
| Summary badge pill text (`[aria-label="Rewards"] li`) | `Badge: Warm Streak II` (li text `7IIBadge: Warm Streak II`) | `Badge: Warm Days II` (li text `7IIBadge: Warm Days II`) |
| Pill aria-label | the pill span has none; the badge art `svg role=img` inside it has `aria-label="Warm Streak II"` and sits under an `aria-hidden="true"` ancestor | the same svg: `aria-label="Warm Days II"`, under an `aria-hidden="true"` ancestor |
| Live-region announcement (`<p class="sr-only" role="status" aria-live="polite">`, set ~600 ms after arrival) | `25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth.` | same sentence with `New badge: Warm Days.` |
| Other live region on that screen (unchanged) | `The kettle’s whistling! Focus session complete. Time for tea.` | same |
| Stats › Badges entry name (`span` in the badge button) | `Warm Streak` | `Warm Days` |
| Stats › Badges button aria-label | `Warm Streak, tier 2 of 5. 7 of 14 toward the next tier.` | `Warm Days, tier 2 of 5. 7 of 14 toward the next tier.` |
| Stats badge sheet (button clicked) heading / description | heading `Warm Streak`; "Keep a 14-day warm streak" | heading `Warm Days`; "Keep a 14-day warm streak" |
| Toasts present on Summary and on Stats | none | none |
| Body-text lines matching `warm (streak\|days)` on Summary | `…warm days keep going`, `Badge: Warm Streak II`, the announcement | `…warm days keep going`, `Badge: Warm Days II`, the announcement |
| Body-text lines matching on Stats | `Next in 7 warm days · each covers one missed day`, `Warm streak calendar for October 2026`, `October so far: 8 warm days`, `Warm Streak` | same four with last = `Warm Days` |
| Dev `#/kit` art gallery, 1440 (`kit-gallery.json`) | label `Warm Streak`; art titles `Warm Streak I…V`, `(locked)` | label `Warm Days`; `Warm Days I…V`, `(locked)` |

Badge-earned toast path (`store.ts:238`, shown for records that are not a completed focus brew). A completed brew shows no toast (rows above); only completed focus brews can raise the warm-streak metric. Probe (`toast-path-390x844.json`, `toast.mjs`, 20:38:20): celebrate seed, debug API removes the `warm-streak` entry from badge state (setup only), then through the UI: start a brew, fast-forward 3 min, End session. Toast text at 0.3, 0.9, 1.8 and 3.2 s, BASE: `New badge: Warm Streak` (+ `Saved 3 minutes of focus`); TRIAL: `New badge: Warm Days` (+ `Saved 3 minutes of focus`). The toast stack's live text mirrors it (`New badge: Warm DaysSaved 3 minutes of focus`). Stored state afterwards: `badges['warm-streak']` = `{tier:1, unlockedAt:[…]}` on both. Run at 390×844 only.

Fresh brew storage, base vs trial (`base-vs-trial-fresh-brew-diff.txt`): `kettle:progress` differs only in ids, timestamps and epoch generated per run, plus one non-generated value: `/state/lastReport/badges[0]/title` `"Warm Streak"` → `"Warm Days"`. `kettle:settings` and `kettle:home:lastVisit` byte-identical; `kettle:timer` differs only in `lastEnded.at` / `sessionId`. `badges`, `ledger` amounts, `leaves`, `quests` keys, tiers: identical in value.

## 3. Migration

### 3a. Profile built on the BASE (:5480)

`live.mjs` at 20:25:00 (390×844) and 20:26:49 (1440×900): celebrate seed, one brew finished, Summary shown, 1.5 s later full storage dump → `dump-base-390x844.json`, `dump-base-1440x900.json` (21,696 bytes each). localStorage keys: `kettle:progress` (17,638 chars, `version: 2`), `kettle:timer`, `kettle:settings`, `kettle:home:lastVisit`; sessionStorage: `kettle:flow`. In `kettle:progress`: `state.lastReport.badges` = `[{"id":"warm-streak","tier":2,"title":"Warm Streak","description":"Keep a 7-day warm streak"},{"id":"weekend-warmth","tier":1,"title":"Weekend Warmth","description":"Focus on 2 weekend days"}]`; `state.badges["warm-streak"]` = `{"tier":2,"unlockedAt":[1791367231000,1791734101801]}` (title string appears nowhere else in any key).

### 3b. Same storage into a fresh context on the TRIAL (:5485, no `?debug`, no seed)

`migrate.mjs`: fresh context; storage written on a blank same-origin page (`/__lb_blank`, a route I fulfilled in the context) before the app ever loaded (readback of what was injected: all 5 keys identical); then `/#/done`; app clock 40 min after the freeze (08:20Z, same day). Runs 20:29:27 (390), 20:30:26 (1440). Files: `migration-390x844.json`, `migration-1440x900.json`, `dump-trial-afterload-*.json`, `dump-trial-final-*.json`, screenshots `migration-*`.

| Surface on trial after loading the BASE storage | 390×844 | 1440×900 |
|---|---|---|
| `#/done` stays on Summary (no redirect) | yes | yes |
| Pill text | `Badge: Warm Days II`, `Badge: Weekend Warmth` | same |
| Pill svg aria-label | `Warm Days II` (under `aria-hidden`) | same |
| Announcement | `… New badge: Warm Days. New badge: Weekend Warmth.` | same |
| Same after a second page reload at `#/done` | identical to above | identical |
| Stats › Badges name / aria-label | `Warm Days` / `Warm Days, tier 2 of 5. 7 of 14 toward the next tier.` | same |
| Stats badge sheet heading | `Warm Days` | `Warm Days` |
| Toasts | none | none |
| Page errors (console errors were not recorded in this script) | 0 | 0 |

Storage diff, byte-for-byte per key (base dump vs trial storage after Summary → Stats → reload Summary): `kettle:progress` identical (17,638 = 17,638 chars, `===` true), `kettle:timer` identical, `kettle:settings` identical, `kettle:home:lastVisit` identical, sessionStorage `kettle:flow` identical. No key added or removed. Stored `lastReport.badges[0].title` after load is still `"Warm Streak"`.

### 3c. Variant: returning the next day (clock 2026-10-12T08:40Z, 390×844; `migration-390x844-nextday.json`, 20:34:07)

Display identical to 3b (pill `Badge: Warm Days II`, announcement `New badge: Warm Days.`, Stats `Warm Days` + aria `Warm Days, tier 2 of 5. …`). Storage: identical to the dump after loading the Summary (`diffAfterSummary`: all identical). After visiting Stats (a new calendar day) `kettle:progress` DIFFERS (17,638 → 18,067 chars). Structural diff, complete: (1) `/state/quests/2026-10-12` added (the new day's recipe snapshot), (2) `/state/rev` 22 → 23, (3) `/state/lastReport/badges/0/title` `"Warm Streak"` → `"Warm Days"`. Nothing else differs (`badges`, `sessions`, `ledger`, `leaves` identical). `kettle:timer`, `kettle:settings`, `kettle:home:lastVisit`, `kettle:flow` identical.

### 3d. Variant: cross-tab (390×844; `crosstab-trial-390x844.json`, 20:31:22)

Tab 1 on trial `#/done` with the base storage (pill `Badge: Warm Days II`). A second tab on the same origin wrote a newer document (rev 22 → 27, `lastReport.badges[0].title` still the old `"Warm Streak"`, tier changed 2 → 3 so adoption is observable). Tab 1 after 3 s: pill `Badge: Warm Days III`, svg aria `Warm Days III`, announcement unchanged (`New badge: Warm Days.`). Storage afterwards: rev 27 (as written), `lastReport.badges[0]` = `{tier:3, title:"Warm Days"}`, i.e. the adopting tab wrote the document back with the resolved title at the same rev.

### 3e. Export → import round trip on the trial (390×844; `roundtrip-*.json`, `backup-*.json`)

Method: Settings › "Export a backup" (download captured) from a context holding the base dump; then a fresh context on the trial holding only `kettle:settings`, Settings › "Import a backup" → sheet "Restore this backup?" (12 brews over 9 days, Cozy level 8, 723 leaves) → Restore; Stats checked; Settings › Export again.

| Check | trial → trial (20:32:06) | base → trial (20:32:17) |
|---|---|---|
| Backup file | `kettle-backup-2026-10-11.json`, schema 2, keys `app, kind, schema, exportedAt, progress, settings` | same |
| `progress.lastReport` in file | `null` | `null` |
| String "Warm Streak" / "Warm Days" anywhere in file | none | none |
| `progress.badges` in file vs stored `state.badges` | equal | equal |
| After import: stored `state.badges` vs file | equal (8 badges, `warm-streak` tier 2 `unlockedAt [1791367231000,1791734101801]`) | equal |
| After import: sessions/ledger/leaves/cozies/dayGoals/quests/tombstones vs file | equal | equal |
| After import: `lastReport` | `null` | `null` |
| After import: title string in stored `kettle:progress` | none | none |
| After import: Stats › Badges | `Warm Days, tier 2 of 5. 7 of 14 toward the next tier.` | same |
| Second export vs first (badges) | equal; whole-file diff = `/progress/rev` 22 → 23 and `/progress/epoch` only (`exportedAt` removed before comparing) | same two paths |

## 4. Specs and static checks on the trial

| Command (cwd `/home/user/wt/w4tr-b/kettle`) | Time | Result |
|---|---|---|
| `npx tsc --noEmit` (tsc 7.0.2) | 20:25:51–20:25:53 | exit 0, no output (`tsc.txt`); again with `--incremental false` 20:26:19–20:26:21: exit 0 (`tsc-nonincremental.txt`); `--listFilesOnly` lists 217 `kettle/src` files |
| `npx vitest run` | 20:25:53–20:26:00 | 30 files passed, **290/290** tests passed, exit 0 (`vitest.txt`) |
| `KETTLE_PORT=5475 npx playwright test tests/w2-summary.spec.ts --project=chromium --workers=1` (slot gate, `--reporter=list`; reused the running :5475 dev server) | 20:32:57–20:37:36 | **18 passed (4.6 m)**, exit 0 (`spec-w2-summary.txt`); includes test 18 "warm days, never "streak"…" (the exemption-free check) and test 7 big day (`Badge: Warm Days II`) |

Not run by me: `a11y`, `integrity`, `statusbar` specs, full chromium suite, pwa/timer projects (the maker reports a11y+integrity 24/24 and statusbar 9/9).

## 5. Observations that differ from, or add to, the maker's packet wording (facts only)

1. Packet: "storage is never rewritten." Measured: loading `#/done` and viewing Stats on the same day wrote nothing (all keys byte-identical, 3b). Any later ordinary write by the app persists the resolved title: next-day Stats visit (3c: new day's quests + rev 22 → 23 + title `Warm Days`), and cross-tab adoption (3d: same rev, title `Warm Days`).
2. Packet: pill `aria-label`. The aria-label `Warm Days II` is on the badge art `svg role=img`, which is under an `aria-hidden="true"` ancestor on the Summary; the pill's visible text span carries no aria-label. The announcement the screen reader hears comes from the `role=status` paragraph.
3. Packet: "Badge-earned toast (break / ended-early path)". Reached live only with a setup that removes the warm-streak badge state first (section 2); a completed brew shows no toast.
4. Persisted title sites: only `kettle:progress › state.lastReport.badges[].title`, as claimed (section 1d, regex over all keys).
5. `summary.ts` is in the diff (line 14, comment only), as the packet flags.

## 6. Incomplete / not covered

- Mixed-build concurrency (an old-build tab and a new-build tab at the same origin at the same time) was not run: the two builds are on different origins/ports.
- Service-worker / PWA update path (a cached old bundle) not exercised; contexts blocked service workers.
- Dark theme, other locales, 200 % text size not run for this check.
- The toast probe ran at 390×844 only.
- The full Playwright suite and the `a11y`/`integrity`/`statusbar` specs were not re-run.
- Timestamps in the tables are container clock (UTC); the script clock was frozen at 2026-10-11T07:40Z for the app under test.
