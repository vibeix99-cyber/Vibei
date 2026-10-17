# W3R2 · Maker TH: `Toast.tsx` unconditional hooks — packet (in stages)

- **Branch:** `pe/w3r2-toast-hook` (worktree `/home/user/wt/w8t`), base `494748b` (src `b74e6b3`); local commits only, never pushed.
- **Code commit:** `203b057` · **kettle/src tree `07df367`**. One file: `kettle/src/ui/Toast.tsx` (+5 −1). The diff is `change.diff`.
- **Dev servers:** FIX `:5582` (this worktree, serves `203b057`), BEFORE / control `:5560` (integration `494748b`). Both verified to serve the file they should (`curl …/src/ui/Toast.tsx`: `:5582` has `layerLeaving`, `:5560` has the one-line form).
- **Tools** (`tools/`, scratch copies of what ran from the git-ignored `kettle/.tmp/th/`): `console-hook.cjs`, `pw.config.ts`, `run-suite.sh`, `capture.cjs`, `diff.cjs`, `hooks-audit.cjs`. Logs: `logs/*.log.txt`.

## 1. The change and the audit

### The change (`Toast.tsx`, `NoticeStrip`, line 482 on base → 482–486)

```diff
-  const leaving = useContext(Leaving) || !useIsPresent() || off;
+  // Both reads are made on every render, in this order: `||` would skip `useIsPresent()` whenever the layer is already
+  // leaving, and the hooks called would then differ from one render to the next (React's rules of hooks).
+  const layerLeaving = useContext(Leaving);
+  const present = useIsPresent();
+  const leaving = layerLeaving || !present || off;
```

**Same value in every state.** `a || !b || off` and `a || !p || off` (with `p` the value `useIsPresent()` would have returned) differ only in *when* `useIsPresent()` is called, and `useIsPresent()` has no side effect (below). Truth table, `Leaving` × `present` × `off` (8 rows): both forms give `true` iff `Leaving || !present || off`. When `Leaving` is true the base returns `true` without reading presence, and the fix returns `true` as well, ignoring the value it read.

**Why the number of hooks changed on base.** A route layer going away flips `Leaving` from false to true (`src/app/App.tsx` `Dissolve` → `NoticeLayer leaving={!present}`). On that render the base skipped `useIsPresent()`, so React's dev hook-type list for `NoticeStrip` was one entry shorter than on the render before ("React has detected a change in the order of Hooks called by NoticeStrip"). The fix reads both on every render.

**No change in exit timing — from the `motion` source** (`motion@13.4.4` re-exports `framer-motion@13.4.4`: `node_modules/motion/dist/es/react.mjs:1-2`):
- `node_modules/framer-motion/dist/es/components/AnimatePresence/use-presence.mjs:64-69`: `useIsPresent()` is `return isPresent(useContext(PresenceContext))` and `isPresent(context)` is `context === null ? true : context.isPresent`. A read of the context, nothing else.
- `usePresence()` (`:28-43`) is the one that matters for exit timing: it calls `useId()`, `useEffect(() => register(id))` and returns `safeToRemove`. `register` (`PresenceChild.mjs:37-45`) puts a child in `presenceChildren` and `AnimatePresence` waits for `onExitComplete` (`:29-36`). `useIsPresent()` never calls `register`, so it can neither hold an exit nor release one. Calling it on every render instead of on some renders adds a context read and nothing else.
- Repo-wide: the other two users of `useIsPresent()` (`src/app/App.tsx:113`, `src/ui/Sheet.tsx:120`) already call it unconditionally; neither file is touched.

### Audit of the rest of `Toast.tsx` (every hook call, file:line on the fix)

Method: read the file end to end, and run `tools/hooks-audit.cjs` (a rules-of-hooks pass over the AST: flags a hook call under `if` / `?:` / the right side of `&& || ??`, in a loop, `switch`, `try`/`catch`, in a nested function, in a non-component, or after an earlier `return` in the same function). Logs: `logs/hooks-audit-base.log.txt` (**21 hook calls, 1 flagged: `:482 useIsPresent <-- ||-right`**) and `logs/hooks-audit-fix.log.txt` (**21 calls, 0 flagged**).

| Function | Hook calls (line) | Result |
|---|---|---|
| `useItems` | `useSyncExternalStore` :127 | top level of a custom hook; unconditional |
| `useCtl` | `useSyncExternalStore` :214 | same |
| `Toaster` | `useItems` :424, `useCtl` :425, `useRef` :426, `useEffect` :427, `useLayoutEffect` :441, `useEffect` :448 | no condition, no early return (single `return` at :451), no loop |
| `NoticeLayer` | `useContext` :458 | unconditional |
| `NoticeStrip` | `useContext` :484, `useIsPresent` :485 (**was :482, short-circuited**), `useRef` :487, :490, `useReducedMotion` :491, `useLayoutEffect` :492, :497, `useCtl` :504, `useLayoutEffect` :510 | `:482` was the only violation. The `if (!idRef.current) idRef.current = ++stripSeq;` at :488 is a plain assignment, not a hook; the `return` statements inside the layout-effect callbacks (:511) return from the callback, not from the component; the one component `return` is :516 and all hooks precede it |
| `NoticeView` | `useRef` :549, `useEffect` :550, :557 | no condition, no early return before them (the `if (!el) return;` at :559 is inside an effect callback); the single component `return` is :589 |

Not hooks, checked so they are not mistaken for violations: `toast()`, `toast.dismiss`, `decide`, `tick`, `startClock` (module functions called from components and effects); `renderIcon` (a plain function). **Other violations found: none. Nothing else changed.**

## 2. Hook-order errors, base vs fix (own runs, every browser run through the slot gate, lane TH)

**How counted.** The five notice specs, **unmodified, from `tests/`**, run with a console listener that is injected from outside (`tools/console-hook.cjs`, loaded with `NODE_OPTIONS=--require`; it wraps `BrowserType.launch` so every page the runner opens gets `page.on('console')` and `page.on('pageerror')`). Nothing in `tests/` or `src/` is touched. Every `console.error` and warning and every page error is written as one JSON line tagged with the running spec and test. A line is a **hook-order error** if its text matches `change in the order of Hooks`, `Rendered more hooks`, `Rendered fewer hooks` or `Rules of Hooks`. Run: `tools/run-suite.sh <base|fix> <port>` (`--project=chromium --workers=2`, `KETTLE_PORT` picks the server, as the repo's `playwright.config.ts` does; `tools/pw.config.ts` is that config with the web server off).

- BEFORE: `:5560` (integration `494748b`), 16:11–16:33 UTC, log `logs/base-notice-suite.log.txt`, console lines `logs/base-console.jsonl.txt`.
- AFTER: `:5582` (`203b057`, src `07df367`), 16:49–17:10 UTC, log `logs/fix-notice-suite.log.txt`, console lines `logs/fix-console.jsonl.txt` (**empty: the listener saw no `console.error`, warning or page error at all**).
- Report: `logs/console-report.md` (made by `tools/console-report.cjs`).

| Spec (tests) | hook-order errors base `:5560` | fix `:5582` | other `console.error` base / fix | warnings base / fix | page errors base / fix |
|---|---:|---:|---:|---:|---:|
| `notice-strip` (25) | **24** | **0** | 0 / 0 | 0 / 0 | 0 / 0 |
| `w3-notices` (9) | **9** | **0** | 0 / 0 | 0 / 0 | 0 / 0 |
| `w3-notices-idle` (12) | **0** | **0** | 0 / 0 | 0 / 0 | 0 / 0 |
| `summary-notice` (14) | **28** | **0** | 0 / 0 | 0 / 0 | 0 / 0 |
| `toast-room` (14) | **12** | **0** | 0 / 0 | 0 / 0 | 0 / 0 |
| **all five (74)** | **73** | **0** | **0 / 0** | **0 / 0** | **0 / 0** |

- Every base record names `NoticeStrip` and shows the same diff: previous render `1. useContext 2. useContext`, next render `1. useContext 2. useRef` (the second `useContext` is `useIsPresent()`, skipped).
- **One spec reads 0 on base, as the brief did not expect: `w3-notices-idle`.** It never leaves the Today screen (`location.hash` stays `#/`, spec line 162), so no route layer ever flips to leaving while a strip is mounted, and the base code path never skips the hook there. It is 0 on both. The 73 are in the four specs that leave a screen (starting or ending a brew, a route change).
- **The counts are per page load, not per occurrence.** React warns once per component name per page, so each test page contributes at most 1 (`summary-notice` has two pages per test, hence 28 for 14 tests; the one `notice-strip` test that reads 0 on base is the one that failed before it left Today, see §3).
- **No new console line on the fix.** The base also has 0 other `console.error` lines, 0 warnings and 0 page errors in all five specs, so "other lines per spec, base vs fix" is 0 vs 0 everywhere; nothing is new.
- **Minimal reproducer** (`tools/repro.spec.ts`, scratch; 3 runs of: start a brew on Today, fast-forward, end it, back on Today; this swaps the whole route layer, which is what flips `Leaving`): see the line below.

**Minimal reproducer result** (`logs/repro-{base,fix}.log.txt`, `logs/repro-{base,fix}-console.jsonl.txt`): on `:5560` each of the 3 runs logs **1** `NoticeStrip` hook-order error; on `:5582` each of the 3 runs logs **0**. Every run (6 of 6) also logs the one deliberate `TH-LIVENESS` line the spec raises with `console.error`, so the listener was live on the fix server too: the 0 is a real zero.

## 3. Suites (fix `:5582`, src `07df367`; base `:5560` for comparison)

The specs are the repo's own, untouched (`git diff 494748b HEAD -- kettle/tests` is empty), run with `--project=chromium --workers=2`.

| Suite | Base `:5560` | Fix `:5582` | Logs |
|---|---|---|---|
| `notice-strip` | 24/25 (the one failure is the tap-helper re-aim, below) | **25/25** | `logs/{base,fix}-notice-suite.log.txt` |
| `w3-notices` | 9/9 | 9/9 | same |
| `w3-notices-idle` | 12/12 | 12/12 | same |
| `summary-notice` | 14/14 | 14/14 | same |
| `toast-room` | 14/14 | 14/14 | same |
| **notice suite, 74 tests** | 73/74 (22.3 min) | **74/74 (21.1 min)** | JSON reports `logs/*.report.json.txt` |
| `tsc --noEmit` (tsc 7.0.2) | | **exit 0** | `logs/tsc.log.txt` |
| `vitest run` | | **33 files, 314/314** | `logs/vitest.log.txt` |

- **The base failure** (`notice-strip.spec.ts:338` "…real input (844×390 light 200 % reduced motion)", 1.7 s in): `getByRole('textbox', { name: /What are you brewing/ }) still on top as the tap is aimed` at `press` (spec line 300), the setup tap before any notice is raised. It is the "tap-helper re-aim" flake that Maker TS owns (W3R2 item 3); it did not recur on the fix, and it is not related to this change (it happens before the strip's route layer ever leaves).
- Machine load during the runs was 10–20 (three makers, nproc 4); both runs were taken under similar load.
- Not run (not asked): the rest of the chromium project, `timer-*`, `pwa`.

## 4. Captures: REFERENCE → BEFORE → AFTER (full size, DPR 1)

- **REFERENCE:** `shots/REFERENCE-K01-01-home.png` (K01, copied from `contracts/W3R1/F/REFERENCE-K01-01-home.png`; the Today home design the notice work was measured against).
- **BEFORE** `:5560` (integration `494748b`) and **AFTER** `:5582` (`203b057`): `shots/before/<w>x<h>-<theme>-t<pct>/<state>.png` and `shots/after/…`, **192 + 192 PNG**, the same 12 states in each of the 16 configurations {390×844, 375×667, 844×390, 1440×900} × {light, dark} × {100 %, 200 %}. Conditions are W3R1 Maker F's (`contracts/W3R1/F-READY-FOR-REVIEW.md` §6): frozen date 2026-10-12T07:40Z (Monday), the same seeds, the same settings (scene off, muted, onboarded), the "missed" states = seed then the app clock +2 days; DPR 1; text size by `html{font-size:pct%}`. Capture script `tools/capture3.cjs` (F's `capture.cjs`, extended below).
- **States (12):** `today-blank`, `today-newbie`, `today-atRisk`, `today-missed-cozy`, `today-missed-nocozy` (Today); `sheet-warm-atRisk`, `sheet-warm-missed-cozy` (the warm sheets); `session-running`; `end-sheet` (the End sheet); `today-after-end-gone` (Today after End, the notice gone and its room kept); **new:** `today-after-end-notice` (the toast End raises, "Saved 3 minutes of focus", drawn in Today's strip) and `stats-brew-updated` (a live notice strip, "Brew updated", on Stats). Not captured: `today-veteran` and the rail states of F's set (not in this brief's list).
- **How the shots were made repeatable (so a pixel diff means something).** A first pair of passes (`before`, `after`, one shot per state, 16:15–16:46 UTC) was **discarded**: under machine load of 15–20 the BEFORE pass caught a blank Today at 1440×900 @200 % (content layer still fading in), the toast shot depended on its 3.2 s lifetime, and the mascot's idle animation and the session timer's seconds made most pairs differ. Final capture: for every state and configuration the three shots (BEFORE, AFTER, BEFORE2) are taken back to back in one browser, so they see the same load; each waits until the screen is settled (every ancestor of `main` at opacity 1, no leaving route layer, a dialog's box still) and is retaken if blank; the toast shot holds the notice's clock with the pointer over it; the page clock is paused and CSS animations are disabled for the frame (`animations: 'disabled'`).
- **Noise floor.** BEFORE2 is the same base (`:5560`) captured a second time, so BEFORE vs BEFORE2 is base against base (`tools/diff3.cjs`). A pixel counts as a real AFTER difference only if AFTER differs from BOTH base captures by more than 2 of 255 levels and lies outside the noise region (pixels where the two base captures differ, grown by 6 px). The session timer's readout rectangle (recorded at capture time, `readout` in `shots/facts-*.json`) is left out of the comparison: the seconds fall on a different side of a boundary in each capture. **I** = identical (0 differing pixels), **N** = within the noise floor, **D** = a difference by this rule (crop in `crops/`: BEFORE | AFTER | mask, real pixels red, noise grey).

Pairs: 192. **identical 148**, **within the noise floor 34**, **difference 10**, incomplete 0.
Noise floor (BEFORE vs BEFORE2, same build twice): pixel-identical in 145 of 192 states; where not, median 55 px, max 237538 px, largest channel delta 250/255; states where the base differs from itself by more than 2 levels: 30.

| Configuration | end-sheet | session-running | sheet-warm-atRisk | sheet-warm-missed-cozy | stats-brew-updated | today-after-end-gone | today-after-end-notice | today-atRisk | today-blank | today-missed-cozy | today-missed-nocozy | today-newbie |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 1440x900-dark-t100 | N | **D** | N | N | **D** | I | I | I | I | I | I | I |
| 1440x900-dark-t200 | N | **D** | N | I | N | I | **D** | I | I | I | I | I |
| 1440x900-light-t100 | N | I | N | N | I | I | I | I | I | I | N | I |
| 1440x900-light-t200 | N | **D** | I | N | N | I | I | I | I | I | I | I |
| 375x667-dark-t100 | **D** | N | I | I | I | N | I | I | I | I | I | I |
| 375x667-dark-t200 | I | I | I | I | I | I | I | I | I | I | I | I |
| 375x667-light-t100 | **D** | I | I | I | I | I | I | I | I | I | I | I |
| 375x667-light-t200 | I | I | I | I | I | I | I | I | I | I | I | I |
| 390x844-dark-t100 | N | N | I | I | I | I | I | I | I | I | I | I |
| 390x844-dark-t200 | **D** | I | I | I | **D** | I | I | I | I | I | I | I |
| 390x844-light-t100 | N | N | I | I | I | I | I | I | I | I | I | I |
| 390x844-light-t200 | I | N | I | I | N | I | I | I | I | I | I | I |
| 844x390-dark-t100 | N | I | N | N | I | I | N | I | I | I | I | I |
| 844x390-dark-t200 | N | N | I | N | I | I | I | I | I | I | I | I |
| 844x390-light-t100 | I | N | N | N | I | I | I | I | I | I | I | I |
| 844x390-light-t200 | N | **D** | N | N | I | I | I | I | I | I | I | I |

I = identical, N = within the noise floor, D = difference, ? = not captured, S = size differs.

Differences:

- `1440x900-dark-t100/session-running`: differing px 11624, real 1499 (max delta 53), bbox [370,505,328,286], noise px 0, crop `crops/1440x900-dark-t100/session-running.png`
- `1440x900-dark-t100/stats-brew-updated`: differing px 4, real 4 (max delta 5), bbox [11,95,216,38], noise px 0, crop `crops/1440x900-dark-t100/stats-brew-updated.png`
- `1440x900-dark-t200/session-running`: differing px 66056, real 8804 (max delta 90), bbox [22,22,1377,860], noise px 0, crop `crops/1440x900-dark-t200/session-running.png`
- `1440x900-dark-t200/today-after-end-notice`: differing px 5, real 5 (max delta 59), bbox [1339,267,2,3], noise px 0, crop `crops/1440x900-dark-t200/today-after-end-notice.png`
- `1440x900-light-t200/session-running`: differing px 11508, real 1 (max delta 14), bbox [389,757,1,1], noise px 11454, crop `crops/1440x900-light-t200/session-running.png`
- `375x667-dark-t100/end-sheet`: differing px 7260, real 121 (max delta 5), bbox [49,27,249,149], noise px 1, crop `crops/375x667-dark-t100/end-sheet.png`
- `375x667-light-t100/end-sheet`: differing px 4, real 4 (max delta 4), bbox [25,458,39,149], noise px 1, crop `crops/375x667-light-t100/end-sheet.png`
- `390x844-dark-t200/end-sheet`: differing px 2054, real 664 (max delta 7), bbox [245,59,67,25], noise px 0, crop `crops/390x844-dark-t200/end-sheet.png`
- `390x844-dark-t200/stats-brew-updated`: differing px 2, real 2 (max delta 5), bbox [37,770,30,1], noise px 0, crop `crops/390x844-dark-t200/stats-brew-updated.png`
- `844x390-light-t200/session-running`: differing px 4, real 4 (max delta 51), bbox [205,243,11,5], noise px 0, crop `crops/844x390-light-t200/session-running.png`

**Reading of the 10 D pairs (I looked at each crop; none is in the notice strip or at a notice):**
- `1440x900-dark-t100/session-running` and `1440x900-dark-t200/session-running`: sub-pixel outline shifts on the kettle and the capybara in the focus scene (the scene's JS-driven idle motion, a different phase in each capture; the kettle and capybara are not drawn by `Toast.tsx`).
- `375x667-dark-t100/end-sheet`, `390x844-dark-t200/end-sheet` (and `375x667-light-t100/end-sheet`, 4 px): the blurred backdrop behind the End sheet, a few pixels of the "Rain" button and steam, at most 7 of 255 levels.
- `1440x900-dark-t100/stats-brew-updated` (4 px, max 5), `390x844-dark-t200/stats-brew-updated` (2 px, max 5), `1440x900-dark-t200/today-after-end-notice` (5 px: the tip of the progress bar), `844x390-light-t200/session-running` (4 px), `1440x900-light-t200/session-running` (1 px counted, the base differs from itself in 11454 px there): isolated pixels far from the strip.
- The two states that carry a live notice (`stats-brew-updated`, `today-after-end-notice`; 32 pairs) are identical in 25, within the noise floor in 4, and D in 3 (2, 4 and 5 isolated pixels, listed above).
RECAP_PLACEHOLDER
**Noise floor in numbers:** the base differs from itself in 47 of 192 states (145 pixel-identical); mostly the blurred End and warm sheets (maximum 2 levels) and the focus scene; two states had a gross variation between two base captures (`1440x900-light-t200/sheet-warm-missed-cozy`, 237 538 px, and `1440x900-light-t100/today-missed-nocozy`, 107 494 px: a layout moved between two base captures). Machine load during the capture was 15–20.

Files: `shots/{before,after}/`, `shots/before2-flagged/` (BEFORE2 for the 10 D pairs only; the full BEFORE2 set, 22 MB, is not committed, its per-pair numbers are in the JSON), `crops/`, `logs/diff-before-after.json.txt` (every pair: differing px, noise px, real px, max delta, bbox), `logs/summary3.md`.
