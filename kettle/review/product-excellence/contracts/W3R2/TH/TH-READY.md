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

(Sections 2–5 follow as the work completes.)
