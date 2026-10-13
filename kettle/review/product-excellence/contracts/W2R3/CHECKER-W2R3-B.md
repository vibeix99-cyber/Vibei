# CHECKER W2R3 · Maker B: "Warm Streak" → "Warm Days" (display name only)

**Status: DRAFT. Waiting for Lane B's receipt (`review/LB/RECEIPT-LB.md`). My own verification is complete; the verdict line is filled in when the receipt has been read.**

| | |
|---|---|
| Lead checker | LEAD-3. I implemented none of this work |
| Revision under review | `pe/w2r3-badge@2994005` (code `0a95fbc`; kettle/src `f40b306`; `git rev-parse 0a95fbc:kettle/src` = `2994005:kettle/src` = `f40b3063…`) |
| Trial | `e1ddf9d` = integration `61aba17` + `2994005`; worktree `/home/user/wt/w4tr-b`; kettle/src `f40b306`; dev :5475 (serves `badges.ts` with "Warm Days"), preview :5485 (dist built 20:21:13 from `e1ddf9d`, committed 20:21:09; bundle has `title:"Warm Days"`, no "Warm Streak") |
| Base / control | `61aba17` (kettle/src `4556926`); dev :5470 (serves "Warm Streak"), preview :5480 |
| Packet | `/home/user/wt/w4b/kettle/review/product-excellence/contracts/W2R3/B-READY-FOR-REVIEW.md`; evidence `…/W2R3/B/` |
| My evidence | `contracts/W2R3/review/LEAD/B/` (`results.json`, `results-reload.json`, `orphan-numerals.json`, `sweep.json`, the pre-rename storage dumps, `shots/`, the four probes). Working copies in `/home/user/wt/w4-base/kettle/.tmp/LEAD3/` |

## 1. What I did

### Read
- The packet in full and the diff `git diff 61aba17 e1ddf9d -- kettle/src kettle/tests`: 7 files, +62 / −15.
- The display paths:
  - `badgeEngine.ts`: awards and the Stats list take `def.title` from the catalogue.
  - `summary.ts:100,111`: the pill and the announcement read the report's `b.title`.
  - `store.ts:238`: the badge toast reads the award's catalogue title.
  - `Badges.tsx:85,88,121`: the Stats name, aria label and sheet title.
  - `art/Badge.tsx:578`: the art label from `BADGE_BY_ID`.
  - `art/Gallery.tsx`.
- The persistence paths: `store.ts` persist `migrate`/`merge`, `readStored` (cross-tab) → `reconcile` (`hasExtra` compares ids, not titles), `portability.ts` (exports and imports null `lastReport`), `merge.ts:148`.

### The design is sound
- `badgeTitle(id, stored)` returns the catalogue title for a known id and the stored one otherwise. It uses `hasOwnProperty`, so an id like `constructor` cannot resolve through the prototype.
- `withCatalogTitles` builds a new report and a new `badges` array, and touches only `title` on well-formed entries.
- `coerceData` is the only way stored progress enters memory: hydrate, `merge`, cross-tab `readStored` and imports. Imports null the report anyway.
- Nothing is written on read. Zustand persist writes on hydrate only when it migrated (version < 2), and this change adds no version bump.
- **No ids, stored data or arithmetic changed:**
  - In `badges.ts` only the title string changed.
  - `badgeEngine.ts`, `streak.ts`, tiers and descriptions are untouched.
  - `summary.ts` has a one-line comment change only (it is P's merged file, owned by no maker this round; T2's working tree does not touch it).

### Migration, made myself
Probe `b-migration.mjs`, one browser through the slot gate. It ran at 390×844 light, 1440×900 dark, and 375×667 light @200 %.

1. **BEFORE build (:5480):** `?debug&seed=celebrate` with a fixed clock of 2026-10-11 07:40Z. A real tap on "Put the kettle on", then `finish()`, which leads to the summary.
   - The stored `kettle:progress` is version 2.
   - Its `lastReport.badges` holds `{id:'warm-streak', tier:2, title:'Warm Streak', description:'Keep a 7-day warm streak'}` and Weekend Warmth.
   - Dumped as `pre-rename-storage-*.json`.
2. **AFTER build (:5485):** a clean origin with no seed and no debug (`window.__kettle` is undefined). The exact localStorage and sessionStorage were loaded before boot. Then `#/done`.

The AFTER results:

| Surface | BEFORE (pre-rename profile on :5480) | AFTER (same storage on :5485) |
|---|---|---|
| Summary pill | `Badge: Warm Streak II` | `Badge: Warm Days II` |
| Pill accessible name | `Warm Streak II` | `Warm Days II` |
| Summary announcement (live region) | `… New badge: Warm Streak. New badge: Weekend Warmth.` | `… New badge: Warm Days. New badge: Weekend Warmth.` |
| Stats › Badges name | `Warm Streak` | `Warm Days` |
| Stats › Badges button aria | `Warm Streak, tier 2 of 5. 7 of 14 toward the next tier.` | `Warm Days, tier 2 of 5. 7 of 14 toward the next tier.` |
| Badge sheet title (`aria-labelledby`) | `Warm Streak` | `Warm Days` |

All three configurations gave identical results.

**Stored data untouched:**
- `kettle:progress` is byte-identical to the injected string after load, after scrolling the summary, and after walking to Stats and opening the badge sheet.
- No localStorage key changed. The version is 2 → 2.
- All 11 state fields are equal at the end, and the stored title is still `"Warm Streak"`.

**Matched control** (`b-reload-control.mjs`): the same storage was reloaded at `#/done` on both builds, so the pair differs only by B.
- Both builds stayed byte-identical and showed the same room (the record player placed) and the same card.
- The only differences are the name and the animation phase (steam, flame, sparkles).
- My first arrival-vs-reload frames differed in the room. That difference is arrival versus reload, not B.

**Sweep** (`b-sweep.mjs`): the AFTER build with the pre-rename profile, at 390×844 and 1440×900. Real clicks went through Today, Stats (all badges expanded), Nook and Settings. "Warm Streak" occurs 0 times in visible text, `aria-label`, `title`, SVG titles, `.sr-only` or live regions. "Warm Days" appears on Stats only.

### Re-ran the maker's commands on the trial `e1ddf9d`

| Check | Result | Log |
|---|---|---|
| `npx tsc --noEmit --pretty false` | exit 0 | `review/LEAD/B/tsc.txt` |
| `npx vitest run` | 30 files, **290/290** | `review/LEAD/B/vitest.txt` |
| `w2-summary.spec.ts` (chromium, :5475, workers 1) | _pending_ | `review/LEAD/B/e2e-w2-summary.txt` |

### Opened at full size (REFERENCE → BEFORE → AFTER)

**References:**
- K02 `VISUAL_BENCHMARK_LIBRARY/assets/current/07-summary.png`;
- K03 `11-summary-unlock.png`;
- the Stats reference `live-stats-empty.jpg`.

**Mine** (`review/LEAD/B/shots/`):

| Surface | BEFORE | AFTER |
|---|---|---|
| Summary, 390×844 light | `before-summary-pill-390x844-light.png` | `migration-after-summary-pill-390x844-light.png` |
| Summary, 1440×900 dark | `reload-before-summary-pill-1440x900-dark.png` | `reload-after-summary-pill-1440x900-dark.png` |
| Summary, 375×667 light @200 | `reload-before-summary-pill-375x667-light-200.png` | `reload-after-summary-pill-375x667-light-200.png` |
| Stats › Badges card, 390×844 light | `before-stats-badges-card-390x844-light.png` | `migration-after-stats-badges-card-390x844-light.png` |
| Stats › Badges, 375×667 light @200 | `reload-before-stats-badges-375x667-light-200.png` | `reload-after-stats-badges-375x667-light-200.png` |
| Badge sheet, 1440×900 dark | `before-stats-badge-sheet-1440x900-dark.png` | `migration-after-stats-badge-sheet-1440x900-dark.png` |

**Maker's:** `B/captures/migration-after-summary-1440x900.png`. The unlock card shows the record-player drawing that appears while 3D loads (PRESERVE 8), where my frames show the close-up. That is capture timing, not B.

**Judgement:**
- The only visible change is the name: in the pill, the Stats tile, and the sheet title.
- The badge art, tier chips, pill size and order, the K02 summary composition, the K03 unlock card and the Stats card layout are unchanged.
- "Warm Days" is shorter than "Warm Streak". At 375×667 @200 the Stats tile now breaks between the two words; the base breaks mid-word for Weekend Warmth and Leaf Collector, which is unchanged.

## 2. Acceptance

| Criterion (brief / gate) | Result |
|---|---|
| The display name changes everywhere it shows | **Met.** Summary pill, its accessible name, the summary announcement, Stats tile, tile aria, sheet title, toast (code path from the catalogue) and art label. Zero "Warm Streak" anywhere in the UI or the built bundle |
| No ids, stored data or arithmetic changed | **Met.** Ids are 5/5. Only the title string changed in the catalogue. Engines are untouched. The stored profile is byte-identical after load and use |
| Migration-safe for existing users | **Met**, on a real pre-rename profile from the BEFORE build: the new name on every surface, nothing rewritten, no version bump. The unit test covers the same, plus an unknown id keeping its stored name |
| PRESERVE 9 (badge arithmetic) and 11 (compatible storage) | **Kept** |
| Tests test real behaviour | Yes. The new engine test goes through `coerceData` on a stored-shape profile. The summary spec's "no streak" check is now strict (no exemption) and asserts `Warm Days II` |
| File scope | In scope. `summary.ts` has a comment-only change (noted; no conflict with T2, whose tree does not touch it) |

## 3. Residuals

| # | Item | Class | Owner |
|---|---|---|---|
| B-F1 | **The tier numeral can sit alone on the pill's last line.** The summary pill joins the name and tier with a breaking space (`summary.ts:100`). Measured on all 12 names × 5 tiers at 8 configurations (`orphan-numerals.json`): "Warm Streak II" orphans at 390×844 @200 on the **base**; "Warm Days II" orphans at 375×667 @200 instead. The count is one of 8 configurations before and after, and Deep Steep, Morning Dew, Goal Getter, Nook Builder and Intentional do the same on the base. Text is complete and legible, and nothing is clipped or covered | **FOLLOW-UP** (pre-existing class, not worse) | Summary area (P's `summary.ts`): use a no-break space before the tier numeral |
| B-F2 | The badge description still reads "Keep a {n}-day warm streak" (Stats sheet: "Keep a 14-day warm streak" under "Warm Days"). Outside the brief, which covers the display name only | **FOLLOW-UP** | Vibei decides the wording; then `progress/badges.ts` |
| B-F3 | Non-badge "warm streak" wording: `StreakCard` sr "7 days warm streak" and caption "Warm streak calendar…", `Rail` "Start a warm streak" and title "Warm streak", `SettingsScreen`, `DataSection`, `ui/Gallery` overline | **FOLLOW-UP** | Wording pass (Vibei). The files belong to the stats, settings and ui areas |
| B-F4 | `docs/areas/progress.md:69` "Warm Streak II" is a dated history entry | **ACCEPTED** (history) | — |
| B-F5 | Stats tiles break mid-word at 375×667 @200 ("Week/end Warm/th", "Collec/tor") | **FOLLOW-UP** (pre-existing, unchanged) | Stats area |
| B-U1 | Real devices, WebKit, Firefox, real AT | **UNKNOWN** (environment) | — |

## 4. Lane B receipt

_Pending._
