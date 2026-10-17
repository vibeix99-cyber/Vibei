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

REPRO_PLACEHOLDER

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
