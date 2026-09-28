# Progress & Stats — area log

Owner: progress area (`src/progress/**`, `src/screens/stats/**`). Dev port 5186.

## Architecture (decisions)

- **One pure engine** (`engine.ts › applyRecord`) computes leaves, goal, recipes,
  badges, streak deltas and the `CompletionReport`. The store only adds persistence,
  cross-tab sync and events. Seeds, the v1→v2 migration and imports all *replay*
  history through the same engine, so every path yields the same auditable ledger.
- **Leaves ledger**: every leaf has exactly one `LeafEntry` with a deterministic id
  (`focus:<sid>`, `full:<sid>`, `first:<day>`, `deep:<sid>`, `goal:<day>`,
  `quest:<day>:<qid>`, `recipes:<day>`, `carry:*`, `gift:*`). Grants are idempotent
  by id; `leaves` is a cached sum. Deleting a session keeps its leaves (and levels).
- **Warm streak is a replay** (`streak.ts › streakTimeline`) over local day keys —
  DST-safe (calendar stepping, never +24h), always consistent after delete/import.
  Tea Cozy: +1 at every 7 warm days (max 2), auto-spent on a missed day (no
  look-ahead), cozy days bridge the run but don't add to the count.
- **Recipes**: 3/day (easy · medium · hard). Hard cycles through its pool per seeded
  permutation (never identical two days running); easy/medium are weighted picks that
  avoid yesterday's kinds; no duplicate kind or icon per day; scaled to the goal; the
  list is snapshotted per day (goal changes before any activity rescale it); time-window
  recipes that are already closed when the day is first opened are left out.
- **Level curve**: step(l→l+1) = 25 + 12·(l−1)^1.5 (rounded to 5). First brew → L2,
  ~90 leaves/day → L10 at 2 weeks, L20 at ~12 weeks.
- **Multi-tab**: every write bumps `rev`; `recordSession` re-reads storage first and adopts
  a newer revision, then applies idempotently; a `storage` listener keeps idle tabs synced;
  deleted ids are tombstoned so a stale tab can't resurrect them.
- **Persisted schema v2** with `migrate` (v1 placeholder → replay + `carryOver` so nobody
  loses leaves) and a defensive `merge` (`validate.ts` coerces anything).

## Iterations

1. **Data layer + first Stats pass.** Engine, streak/cozies, recipes, badges, levels,
   report, portability, seeds, 60 unit tests. Screen: tiles, level, week bars vs goal,
   streak calendar with joined runs, rhythm, tags, badges, history. Found: sr-only
   tables caused horizontal overflow (table ignores 1px width) → wrapped in a div;
   counters animating on a stats page read as noise → static numbers.
2. **Critique → fixes.** Tiles had wrapping hints (cluttered vs Duo's clean tiles) →
   value + label only (at-risk hint kept). Level card said "12" twice and its unlock row
   broke into columns → "Cozy level 12" + leaves, progress with fraction, nook unlock row.
   Calendar week on a Monday was an empty chart → rolling "Last 7 days" (today always at
   the right edge). Value label collided with the goal line → text halo. Today's black ring
   was harsh and didn't match the legend → ink-2 ring + matching legend key. Calendar
   stretched on desktop → capped at 460px. Locale week start fell back to Monday in
   headless Chrome → try `navigator.languages` + `Intl.DateTimeFormat` locale.
3. **320px + charm.** Tiles stack icon-over-value in narrow containers; x-axis uses narrow
   weekday letters when bands are tight; history rows move the tag pill into the meta line;
   cozy copy shortened. Chai joins the header (proud when today is warm, think when at
   risk, sleep late at night, idle otherwise). Rhythm said "evening brewer" while 56% was
   morning → chronotype = dominant part of day, sweet spot searched inside it, "based on N
   brews" for small samples. Replay perf: badges/streak evaluated per day boundary in
   replays (1.1s for 1,200 sessions over 400 days).
4. **Celebrate seed + records.** Celebrate seed fired 3 badges → parked at level 7→8 so it
   fires exactly Warm Streak II; gift no longer counts toward "Earn N leaves". Added
   Personal bests (best day / week, longest brew, most brews in a day). Badges moved above
   the rhythm section. Tooltip compacted to one line. Roman numerals in Nunito (Fredoka's
   "IV" read as "N"). axe: 0 violations (veteran light/dark, blank, newbie desktop dark).

5. **Tablet/320/delight.** 4-across tiles at 560–760px stack icon-over-value (labels were
   wrapping); 320px: Personal bests become rows, history tag moves to its own meta line,
   header Chai shrinks; date ranges compact ("Sep 22–28"). Bars and tag fills grow in with
   the cozy spring (staggered), off under reduced motion (`html[data-motion]` + media query).
   Broken-streak copy verified ("Start a new streak — one brew today warms the kettle
   again"), empty month says "A fresh month to fill". Full suite: tsc clean, 192 tests /
   17 files green, `vite build` ok (Stats chunk 13.5 kB gz), axe 0 violations.

Screenshots (final): `.shots/progress/final/*` — `{fresh,blank,newbie,veteran}-stats-{mobile,desktop}-{light,dark}.png`,
`vet-scroll-*.png` (390 light, full scroll), `broken-streakcard.png`; interactions in
`.shots/progress/it3-i-{badge,edit,delete,deleted,kbd}.png`; tablet `it4s-vet-t-dark-*.png`.

## Public API (for other areas)

- Hooks: `useProgress`, `useLevel`, `useStreak` (current, best, todayDone, cozies, maxCozies,
  atRisk, toNextCozy, lastCozyDay, runs, days), `useToday` (+goalMet, leaves, breaks),
  `useQuests` (snapshots today's recipes), `useUnlockedItems`, `useBadges`, `useDayKey`, `useHour`.
- Store actions: `recordSession`, `editSession`, `deleteSession`, `restoreSession`,
  `ensureToday`, `clearReport`, `resetAll`, `load`.
- `CompletionReport`: see `types.ts` — leaves {base, bonuses[{kind,label,amount}], total,
  before, after}, goal {beforeMin, afterMin, goalMin, justMet, alreadyMet, metDays},
  streak {before, after, extended, best, newBest, cozies, cozyEarned, milestone, week[]},
  level {before, after, leavesBefore/After, intoBefore/sizeBefore, intoAfter/sizeAfter,
  unlocked[]}, quests[{id,title,icon,before,after,target,justCompleted,done,reward}],
  allQuestsJustDone, badges[{id,tier,title,description}], firstEver, whileAway.
- Events: `progress:report` (completed brews only), `progress:streak`, `progress:levelup`,
  `progress:quest`, `progress:badge`; `ui:toast` for recipes/badges/level-ups earned
  outside the celebration (tea breaks, brews ended early).
- Portability: `exportData()`, `previewImport(json)`, `importData(json, {mode, settings})`
  → `{ok, summary}` | `{ok:false, error}` (friendly copy), `resetAllData({keepSettings})`,
  `backupFileName()`.
- Seeds: `fresh`, `blank`, `newbie`, `veteran`, `celebrate`, `atRisk` (`SEED_NAMES`).

## Open issues / requests

- Shell caps `main` at ~680px, so the Stats two-column layout (container ≥ 880px) never
  triggers on desktop; the right rail fills the space well, so this is fine for now.
- Tag metadata is duplicated (home `TAG_OPTIONS` icons, focus `TAGS` colors, stats
  `TAG_META`) → suggest a shared `src/state/tags.ts`.
- Art: badge medallions are drawn in Stats from `Icon`s; if art ships per-badge artwork,
  swap `BadgeMedal`'s face.
