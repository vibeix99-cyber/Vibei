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
