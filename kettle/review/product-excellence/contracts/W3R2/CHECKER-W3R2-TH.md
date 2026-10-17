# CHECKER W3R2 · TH: the conditional hook in `Toast.tsx` (Vibei W3R2 item 2)

*Written in stages; the verdict is at the end.*

| | |
|---|---|
| Lead checker | LEAD-5. I implemented none of this work. I reported the finding (`CHECKER-W3R1-F1FIX.md` §9) |
| Under review | `pe/w3r2-toast-hook@203b057`, worktree `/home/user/wt/w8t`, src `07df367` |
| Trial | `0ad85b9` = integration `36402ba` (app `5f78af1`) + `203b057`; worktree `/home/user/wt/w8tr-t`. `git rev-parse 0ad85b9:kettle/src` = `07df367` (checked). The trial's tests (`17d135a`) equal the integration's. Dev **:5592** serves the trial: its `Toast.tsx` has `layerLeaving`, and pid 5954 runs in `/home/user/wt/w8tr-t/kettle` |
| Control | :5560 (`/home/user/wt/w6-int` at `494748b`, src `b74e6b3`, clean), serving the one-line form |
| Brief / decision | `BRIEF-TH.md`; `VB-DECISIONS-W3R2.md` §2 ("no hook-order error in the dev/test console across the notice suite; `notice-strip` 25/25; REFERENCE → BEFORE → AFTER notice captures showing no difference beyond noise") |
| Packet / gate | `contracts/W3R2/TH/TH-READY.md`; `review/GATE.md`, item 2 |
| My evidence | `contracts/W3R2/review/LEAD/TH/` |

## ◆1 · Scope, and the diff read in full
**Scope.** `git diff --stat 494748b 203b057` = `kettle/src/ui/Toast.tsx` only, +5/−1. The trial adds exactly that one file to the integration.

**The change** (`NoticeStrip`, line 482 → 482–486):
```diff
-  const leaving = useContext(Leaving) || !useIsPresent() || off;
+  const layerLeaving = useContext(Leaving);
+  const present = useIsPresent();
+  const leaving = layerLeaving || !present || off;
```

**`leaving` is identical in every state.**
- The new expression is the old one with the same operands in the same order.
- `||` returns the first truthy operand, otherwise the last one. With `a = useContext(Leaving)`, `p = useIsPresent()` and `off`, both forms are `a || !p || off`.
- They differ only in whether `useIsPresent()` is *called* when `a` is true. On base it is skipped; on the fix it is called and its value is ignored.
- `useIsPresent()` has no side effect (◆2), so its value and every later hook are unaffected.

**Audit of the rest of the file** (my read of the trial's `Toast.tsx`; there is no eslint in the repo, so I did not rerun the maker's AST pass):
- `useItems` (:127) and `useCtl` (:214) are custom hooks at the top level.
- `Toaster` (:424–448) has six hooks, no condition, and a single `return`.
- `NoticeLayer` (:458) has one `useContext`.
- `NoticeStrip` (:484–510) has `useContext`, `useIsPresent`, `useRef` ×2, `useReducedMotion`, `useLayoutEffect` ×2, `useCtl` and `useLayoutEffect`.
  - The only `if` before its `return` (:488) is a plain assignment.
  - The `return`s at :511 belong to an effect callback.
- `NoticeView` (:549–557) has `useRef` and `useEffect` ×2; its `if (!el) return` is inside an effect.
- **No other conditional hook, early return before a hook, or hook in a loop.** The maker's audit table (packet §1) matches my read line for line.

## ◆2 · The motion claim, against the installed source
- **The import resolves to framer-motion.** `Toast.tsx:35` imports `useIsPresent` from `motion/react`. `motion@13.4.4`'s `./react` export is `dist/es/react.mjs`, which is `export * from 'framer-motion'` (`framer-motion@13.4.4`). `framer-motion/dist/es/index.mjs:45` re-exports `useIsPresent` from `components/AnimatePresence/use-presence.mjs`.
- **`useIsPresent` only reads the context.** `use-presence.mjs:64-69` is `useIsPresent() { return isPresent(useContext(PresenceContext)); }` with `isPresent(context) = context === null ? true : context.isPresent`. The CJS build is the same (`feature-bundle-D08l3H09.js:68-72`).
- **It cannot hold or release an exit.** Exit timing belongs to `usePresence` (:28-43): `useId`, `useEffect(() => register(id))` and `safeToRemove`. `useIsPresent` calls none of these.
- **So calling it on every render adds one context read and nothing else; exit timing is unchanged.** The maker's citation is correct.
- **Side note:** a `useContext` read keeps no hook slot in React's fiber state. So on base the skip was never able to shift another hook's state in production; the visible effect was React's dev-mode hook-order error, which this fix removes.

## ◆3 · Hook-order console count, base :5560 vs trial :5592 (my runs, through the gate, `--lane LEAD --n 2`)
**My method is independent of the maker's listener.**
- Chromium is launched with `--enable-logging=stderr --v=0`, so it writes every page console message to its own log. The run uses `DEBUG=pw:browser`, so the runner prints that log.
- Config: `console-pw.config.ts.txt` is the repo's `playwright.config.ts` with those two launch arguments added and nothing else.
- I first smoke-tested that a page's `console.error` and `console.warn` appear (`smoke-console-log.mjs.txt`).
- Tests: the trial tree's unmodified specs (= integration).
- Counted by `console-summary.py.txt`: hook-order lines, page loads, and every distinct console message.

| Spec | Base :5560: hook-order lines | Trial :5592: hook-order lines | Other console lines, base / trial |
|---|---|---|---|
| `notice-strip` | **4** in the 4 configs run on base (`(390×844 light 100 %\|1440×900 dark 200 %\|844×390 dark 200 %\|375×667 light 200 % reduced motion)`, 4 passed) | **0** in all 25 tests (48 page loads) | only `[vite] connecting…`, `[vite] connected.` and React's DevTools info, once per page load, on both |
| `summary-notice` | **28** (14 tests, 2 pages each) | **0** (28 page loads) | the same three, on both |
| `w3-notices` | **9** | **0** | the same three, on both |

**Conclusions:**
- **Every base hook-order line is React's "change in the order of Hooks called by NoticeStrip".** It appears once per page that leaves a screen, as the maker found (24 / 28 / 9 in their full-suite counts).
- **The trial has none**, and it has **no other console error, warning or message beyond the three informational ones.** Nothing new.
- Logs: `base-*.log.txt` and `trial-*.log.txt` (test lines plus Chromium's console lines); summary in `console-summary.txt`.
- I did not rerun `w3-notices-idle` (0 on both builds in the maker's run, since it never leaves Today) or `toast-room`.

## ◆5 · Captures: REFERENCE → BEFORE → AFTER, at full size (my own diff, and the 10 flagged pairs opened)
**REFERENCE:** `TH/shots/REFERENCE-K01-01-home.png` (K01 Today, 780×1688). I compared live notice states against it, for example `390x844-light-t100/today-after-end-notice` BEFORE and AFTER, opened at full size.
- K01's layout is kept: the stat chips, the greeting, the mascot bubble, the goal card, the composer and the docked start. The notice "Saved 3 minutes of focus" sits in Today's strip above them, the same in BEFORE and AFTER.

**My own pixel diff of all 192 pairs** (`pairdiff.py.txt`, stdlib decoder → `pairdiff-out.txt`):
- **148 pixel-identical**, as the maker reports (the committed shots equal the maker's final set `.tmp/th/shots3`, 192/192 by `cmp`).
- **44 not identical.** For each of these I also compared AFTER with the maker's second base capture BEFORE2 (`.tmp/th/shots3/before2`, all 192; `threeway.py.txt` → `threeway-out.txt`):
  - **28: AFTER equals one of the two base captures** (≤ 2 levels). This includes the two gross ones, `1440x900-light-t200/sheet-warm-missed-cozy` (205 965 px) and `1440x900-light-t100/today-missed-nocozy` (105 747 px). There BEFORE caught a different state (the "missed" date not yet applied), and AFTER equals BEFORE2 exactly. I opened the first pair at full size: BEFORE shows the at-risk Today under the sheet, AFTER the missed-cozy one.
  - **5: AFTER is within the spread between the two base captures.** These are End sheets and one 1440 session-running.
  - **11: AFTER differs from both base captures more than they differ from each other.** These are the maker's 10 D pairs, plus `844x390-dark-t100/end-sheet`, which the maker's rule counts as within noise because the difference lies in the session readout's rectangle. Opened at full size: the End sheet is pixel-equal, and behind it the countdown reads "55" vs "54".

**The 10 D pairs, opened** (crops BEFORE | AFTER | mask, and full-size frames for the large ones):
- **`1440x900-dark-t100` and `-t200 / session-running` (4 781 / 12 086 px):** outline shifts on the kettle and the capybara in the focus scene, plus the countdown seconds ("21:58" vs "21:57"). Everything else is identical. In the maker's recapture an AFTER frame reproduces a base frame exactly, so this is the scene's motion phase, not the build.
- **`390x844-dark-t200`, `375x667-dark-t100` and `375x667-light-t100 / end-sheet`:** the "Rain" chip and steam in the blurred backdrop behind the sheet, ≤ 7 levels.
- **`1440x900-dark-t200/today-after-end-notice`:** 5 px at the tip of the goal progress bar. The notice strip is identical.
- **`1440x900-dark-t100` and `390x844-dark-t200 / stats-brew-updated`:** 4 px and 2 px, ≤ 5 levels, in the side-nav "Today" row and near the bottom. The "Brew updated" strip is identical. At `1440x900-light-t200` and `390x844-light-t200` the same few pixels vary between the two base captures as well.
- **`844x390-light-t200/session-running`:** 4 px of the scene; the rest is the readout.
- **None is in a notice strip, a notice, or a part `Toast.tsx` draws.**
- The code change cannot alter any frame: `leaving` has the same value in every state (◆1).

**Vibei's bar, "no difference beyond noise": met.** Every non-identical pair is one of four things:
- a base frame that the base itself reproduces;
- the session countdown;
- the focus scene's motion phase;
- a few pixels (≤ 7 levels) in a blurred backdrop or away from any notice.
