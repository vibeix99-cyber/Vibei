# W2R3 B — Badge rename: "Warm Streak" → "Warm Days" (display name only)

Maker B. Status at the end of this file. Evidence: `W2R3/B/`.

## Hashes
| | |
|---|---|
| Branch | `pe/w2r3-badge` |
| Base | `61aba17` (integration; kettle/src tree `4556926`) |
| Code commit | `0a95fbc` (kettle/src tree **`f40b306`**) |
| Packet commit | the commit that adds this file (touches only `kettle/review/…/W2R3/`; kettle/src tree stays `f40b306`) |
| Trial-merge target | `origin/claude/wizardly-galileo-uy89d9` @ `16b5f85` (code commit), `2a380ab` (packet commit) |

**Trial merge:** `git merge-tree --write-tree HEAD origin/claude/wizardly-galileo-uy89d9` → exit 0, no conflicts
(tree `df3630d` at the code commit vs `16b5f85`; re-run at packet commit `f44970c` vs `2a380ab` → exit 0, tree `c78ee5a`, see `B/trial-merge.txt`). `61aba17` is an ancestor of the
target and the target changes nothing under `kettle/src` or `kettle/tests` since it.

## What changed (7 files, all in-scope)
| File | Change |
|---|---|
| `src/progress/badges.ts` | `warm-streak` title `'Warm Streak'` → `'Warm Days'`. New `badgeTitle(id, stored)`: the catalogue name by id (unknown id keeps its stored name). |
| `src/progress/validate.ts` | `coerceData` (every read of stored progress: hydrate, `merge`, cross-tab `readStored`) resolves `lastReport.badges[].title` from the id, on a copy. Nothing else in the report is touched. |
| `src/progress/seed.ts` | comments: "Warm Streak II" → "Warm Days II" (2). |
| `src/progress/engine.test.ts` | name assertion → "Warm Days"; **new test**: a pre-rename stored profile reads back as Warm Days, ids/tiers/data unchanged, stored object not mutated, unknown id keeps its name. |
| `src/screens/done/rank.test.ts` | fixture + 2 assertions → "Warm Days II". |
| `tests/w2-summary.spec.ts` | "Badge: Warm Days II"; the "no *streak* word on the summary" check no longer exempts the badge (now strict) and asserts `Warm Days II` is present. |
| `src/screens/done/summary.ts` | **comment only** (header line 14: e.g. "Warm Days"). Not in my listed files and not T2's; flagged for the Checker. No code change. |

Not changed: ids (`warm-streak` count in non-test src: 5 before / 5 after), `badgeEngine.ts`, art maps
(`src/art/Badge.tsx`, `src/screens/stats/Badges.tsx`), thresholds, descriptions, any stored data. No T2 file touched —
the name is not hard-coded in any T2 file (Stats › Badges, toasts and the art label all read `def.title`), so **no HANDOFF needed**.

## Where the name shows — BEFORE vs AFTER
Source (`B/grep-before-after.txt`): BEFORE, "Warm Streak" in 13 lines (1 catalogue, 2 seed comments, 1 summary.ts comment,
6 test lines, 1 spec header, 1 docs line). AFTER, "Warm Streak" remains only in the new migration test/comment (deliberately,
as the old stored value) and `docs/areas/progress.md:69` (a dated changelog entry; left as history — see follow-ups).
Built bundle `/tmp/rv7-servers/dist-w4b`: `title:"Warm Days"`, zero "Warm Streak".

Live (`B/captures/live-check.json`; same session, same browser, seed `celebrate`, light, clock 2026-10-11T07:40Z):

| Surface | BEFORE :5480 (61aba17) | AFTER :5482 (this branch) |
|---|---|---|
| Summary badge pill (big day) | `Badge: Warm Streak II` | `Badge: Warm Days II` |
| Pill `aria-label` | `Warm Streak II` | `Warm Days II` |
| Summary screen-reader announcement (live region) | `… New badge: Warm Streak. New badge: Weekend Warmth.` | `… New badge: Warm Days. New badge: Weekend Warmth.` |
| Stats › Badges name | `Warm Streak` | `Warm Days` |
| Stats › Badges button `aria-label` | `Warm Streak, tier 2 of 5. 7 of 14 toward the next tier.` | `Warm Days, tier 2 of 5. 7 of 14 toward the next tier.` |
| Badge-earned toast (break / ended-early path, `store.ts`) | `New badge: ${title} II` from catalogue | same code → `Warm Days` (catalogue) |
| Art label (`src/art/Badge.tsx`) / Gallery | `def.title` | `Warm Days` (catalogue) |

Identical at 390×844 and 1440×900.

## Migration proof
**What stores a badge title?** Checked all persisted keys: `kettle:progress` (badges = `id → {tier, unlockedAt}`, no title;
ledger/sessions/quests: no badge names), backups/export (`portability.ts` nulls `lastReport`; badges by id), `kettle:flow`
(sessionStorage: ids only), `kettle:timer`, `kettle:settings`, home/nook hint keys — none. **One place does:**
`kettle:progress` → `state.lastReport.badges[].title` (the summary's report, kept so a reload of the summary shows it).

**Fix:** resolve it from the id when stored data is read (`coerceData`), on a copy. No migration step, no version bump, no write.

**Proof with a real pre-rename profile** (`B/captures/pre-rename-profile.json`): created by the BEFORE build (61aba17, :5480)
— celebrate seed, one brew finished — its `lastReport` stores `warm-streak / "Warm Streak" / tier 2`. Loaded unchanged into the
AFTER build (:5482, no seed, no debug) at `#/done`:
- summary shows `Badge: Warm Days II`, aria `Warm Days II`, announcement `New badge: Warm Days.` (`migration-after-summary-*.png`);
- Stats › Badges shows `Warm Days` (`migration-after-stats-badges-card-*.png`);
- localStorage after load: version 2 → 2; `badges, sessions, ledger, leaves, cozies, dayGoals, quests, tombstones, epoch`
  all byte-identical; `lastReport` otherwise identical; badge ids/tiers/descriptions identical; the stored title is still
  the old string (nothing was rewritten). Both viewports.
- Unit: `engine.test.ts` › "a profile stored before the rename … reads back as Warm Days; ids and data unchanged".

## Suites
| Suite | Result | File |
|---|---|---|
| `tsc --noEmit` | exit 0 | `B/tsc.txt` |
| vitest | 30 files, **290/290** passed | `B/vitest.txt` |
| chromium: `a11y.spec.ts` + `integrity.spec.ts` (summary / reload flows) | 24/24 run passed (the combined run hit my 900 s cap after these; `w2-summary` and `statusbar` re-run alone below) | `B/e2e-badge-specs.txt` |
| chromium: `statusbar.spec.ts` | **9/9** passed | `B/e2e-statusbar.txt` |
| chromium: `w2-summary.spec.ts` (badge pill "Badge: Warm Days II", strict "no streak" words incl. aria) | **18/18** passed | `B/e2e-w2-summary.txt` |
| full chromium `--workers=2` | **not run** (time; shared host runs ~1–5 min per test) | — |

## Captures (same session, light)
`B/captures/{before,after}-summary-{390x844,1440x900}.png`, `{before,after}-stats-badges-{…}.png` (+ `-card-` crops),
`migration-after-*.png`. At 390×844 the badge pill sits below the fold under the big room-unlock highlight (unchanged
layout); its text is in `live-check.json`.

## Follow-ups (not done, out of scope)
1. The description still reads "Keep a {n}-day warm streak" (catalogue) — Vibei to decide whether it becomes warm-days wording.
2. `docs/areas/progress.md:69` mentions "Warm Streak II" in a dated changelog entry; left as history.
3. Stats "warm streak" wording outside the badge (T2's files, not the badge name): `StreakCard.tsx` sr text
   "7 days warm streak" / caption "Warm streak calendar…", `Rail.tsx` "Start a warm streak" / title "Warm streak",
   `SettingsScreen.tsx`, `DataSection.tsx`, `ui/Gallery.tsx` overline. Not the badge; listed for completeness only.

## Status
All required evidence present except the optional full chromium `--workers=2` run (time). Servers I started (:5472 dev,
:5482 preview) and every browser I launched are stopped.

READY FOR REVIEW
