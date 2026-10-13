# CHECKER W2R3 · Maker B: "Warm Streak" → "Warm Days" (display name only)

**Verdict: APPROVE** `pe/w2r3-badge@2994005` (code `0a95fbc`, kettle/src `f40b306`), as merged in trial `e1ddf9d`. Any change to the branch after this invalidates it.

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
| Badge art `aria-label` in the pill (an svg under an `aria-hidden` ancestor; the pill text is what is reachable) | `Warm Streak II` | `Warm Days II` |
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
| `w2-summary.spec.ts` (chromium, :5475, workers 1) | **18/18** in effect (details below) | `review/LEAD/B/e2e-w2-summary.txt`, `e2e-w2-summary-rerun.txt` |

**How the w2-summary 18/18 was reached:**
- The full run gave 17 passed and 1 failed.
- The failure was the big-day test, at `ctx.close()` (line 248), after all its assertions had passed, `Badge: Warm Days II` included.
- The error was `ENOENT …/test-results/.playwright-artifacts-0/traces/…trace`. Lane B started the same spec in the same worktree at 20:36, and Playwright's start-of-run cleanup deleted my run's trace file.
- Rerun with a private `--output`: the big-day test and the "warm days, never streak" test passed **2/2**.
- That the trial's spec was the one run is confirmed by the compile cache entry my run wrote at 20:31: it contains "Warm Days II" twice and "Warm Streak II" zero times.
- **Process note:** two lanes running specs in one worktree must each pass `--output`.

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
| No ids, stored data or arithmetic changed | **Met.** Ids are 5/5. Only the title string changed in the catalogue. Engines are untouched. The stored profile is byte-identical after load and same-day use, until the app's next ordinary write (B-A1) |
| Migration-safe for existing users | **Met**, on a real pre-rename profile from the BEFORE build: the new name on every surface, nothing rewritten, no version bump. The unit test covers the same, plus an unknown id keeping its stored name. The first write after load (any normal state change) stores the current report as it is in memory, so "Warm Days". That is the transient summary copy, not a schema or id change |
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
| B-A1 | An ordinary later write (the next day, cross-tab adoption) stores the resolved title "Warm Days" in `lastReport` (Lane B 3c/3d) | **ACCEPTED** (intended; no id, badge state or arithmetic changes) | — |
| B-F6 | Base toast placement: the badge toast and "Saved …" sit over the tag chips and Brew length (Lane B's toast frames). Identical on the base | **FOLLOW-UP** (pre-existing, not worse) | T2 (I10, this round) |
| B-U1 | Real devices, WebKit, Firefox, real AT; mixed-build tabs at one origin; the service-worker update path | **UNKNOWN** (environment) | — |

## 4. Lane B receipt

Read in full: `review/LB/RECEIPT-LB.md`, written about 20:45 UTC. Its evidence is in `review/LB/`. Its facts agree with mine, and it adds the following.

**The toast path.** A brew ended early after a setup that removes the warm-streak state.
- Base: `New badge: Warm Streak`. Trial: `New badge: Warm Days`.
- I opened `toast-base-390x844.png` and `toast-trial-390x844.png`. The text changed and nothing else did.
- In both, the floating toasts sit over the tag chips and Brew length. That is the base toast defect (W2H-D1), which T2 owns this round, and B does not make it worse.

**Export and import.** The backup file holds `lastReport: null` and no badge name. After a restore, badges, sessions, ledger and leaves equal the file, on base → trial and on trial → trial.

**The next-day visit and cross-tab adoption** both write the resolved title back (3c: the new day's quests + rev 22 → 23 + title; 3d: same rev, title). I checked the raw files (`migration-390x844-nextday.json`, `crosstab-trial-390x844.json`) and the code:
- Zustand persist writes on every `setState`. Adoption via `syncFromStorage` writes back on the base too; only the title string differs.
- `reconcile` decides on epoch, rev and ids, never on titles, so the differing title cannot start a write loop between tabs.
- **ACCEPTED** as intended behaviour: a normal app write stores the current report, and no id, badge state, session or arithmetic changes.

**Ruling on the coordinator's question.** Persisting the display name on the next ordinary write is acceptable.
- `lastReport` is transient UI state: the summary's own copy, dropped when the summary is left, `null` in every export, and never read for arithmetic. The brief protects ids, stored data and arithmetic, meaning the earned state (`badges` by id with tier and `unlockedAt`, sessions, ledger, leaves). That state is byte-identical in Lane B's diffs.
- "Never rewritten" holds for reading: load, hydrate and cross-tab reads write nothing. A later write stores what is in memory, as the base also does on every write.
- **Downgrade:** an older build reading a report saved as "Warm Days" would show "Warm Days" on that one summary while its own Stats says "Warm Streak", only until the summary is left. This is harmless and not a supported path.

**Accessible name.** The pill's `aria-label="Warm Days II"` is on the art svg, under an `aria-hidden` ancestor. What a screen reader reaches is the pill text and the `role=status` announcement, both "Warm Days". The spec's reachable-text check asserts this and passed.

**Lane B's own runs:** `w2-summary` 18/18 (20:32–20:37), tsc 0, vitest 290/290.

**Lane B's §6 gaps:**
- Dark and 200 % are covered by my runs.
- The PWA update path is equivalent to my migration case: a reload of the new bundle on old storage.
- Mixed-build concurrency (an old and a new tab open at once) remains **UNKNOWN**. Each build simply shows what it resolves, and nothing can loop (see above).

## 5. BEFORE / AFTER pairs that best show each visible change

All are in `contracts/W2R3/review/LEAD/B/shots/`. Each pair is the same stored profile reloaded on both builds, unless a row says otherwise.

| Visible change | BEFORE (`61aba17`) | AFTER (`e1ddf9d`) |
|---|---|---|
| Summary badge pill, phone (pixel-matched except the name) | `reload-before-summary-pill-390x844-light.png` | `reload-after-summary-pill-390x844-light.png` |
| Summary badge pill, desktop dark | `reload-before-summary-pill-1440x900-dark.png` | `reload-after-summary-pill-1440x900-dark.png` |
| Summary badge pill, 375×667 @200 (the wrap, B-F1) | `reload-before-summary-pill-375x667-light-200.png` | `reload-after-summary-pill-375x667-light-200.png` |
| Stats › Badges tile | `before-stats-badges-card-390x844-light.png` | `migration-after-stats-badges-card-390x844-light.png` |
| Stats › Badges tile @200 | `reload-before-stats-badges-375x667-light-200.png` | `reload-after-stats-badges-375x667-light-200.png` |
| Badge sheet title | `before-stats-badge-sheet-1440x900-dark.png` | `migration-after-stats-badge-sheet-1440x900-dark.png` |
| Badge-earned toast (Lane B's capture) | `review/LB/toast-base-390x844.png` | `review/LB/toast-trial-390x844.png` |

Screen-reader text (announcement, Stats aria, sheet `aria-labelledby`) is in `review/LEAD/B/results.json` and `results-reload.json`.
