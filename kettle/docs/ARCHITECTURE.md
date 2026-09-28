# Kettle — architecture, ownership & working agreement

Read `docs/BRIEF.md` first (product, brand, voice, visual language).

## Stack
Vite 8 · React 19 · TypeScript 7 (strict) · Zustand 5 (persist → localStorage) ·
`motion` (motion/react) for animation · Three.js (lazy chunk) · date-fns ·
Vitest (unit) · Playwright 1.56 + axe-core (e2e / screenshots).
Fonts are self-hosted via `@fontsource-variable/{fredoka,nunito}`.
Hash routing (`#/stats`) so it works on any static host and inside iframes.

## Commands (run inside `kettle/`)
| Command | What |
|---|---|
| `npx vite --port <yourPort> --strictPort` | your own dev server (see ports below) |
| `npx tsc --noEmit --pretty false` | typecheck — must be clean before you report |
| `npx vitest run` | unit tests |
| `node scripts/shoot.mjs --base http://127.0.0.1:<port> --out .shots/<area> --routes /,/focus --sizes mobile,desktop --themes light,dark [--seed veteran] [--eval "..."] [--motion reduce]` | screenshots (then **look at them** with the Read tool) |
| `npx vite build` | production build check |

Dev ports (so nobody kills anyone else's server): design 5181 · art 5182 ·
timer 5183 · audio 5184 · scene 5185 · progress 5186 · core-loop 5187 ·
home 5188 · a11y 5189 · critic 5190. The orchestrator runs 5173.

### Debug / screenshot API
Any URL with `?debug` (always on in dev) exposes `window.__kettle` and accepts
`?seed=fresh|newbie|veteran&theme=light|dark&motion=reduce|full&onboarded=0|1`.
`__kettle.timer.getState().startFocus()`, `__kettle.nearEnd()`, `__kettle.finish()`,
`__kettle.ff(ms)`, `__kettle.navigate('/stats')`, `__kettle.seed('veteran')`.
All time goes through `src/lib/clock.ts` (`clock.now()`) so fast-forward works —
never call `Date.now()` directly for app logic.

## Source map & ownership
Each area owns its directories. **Only edit files you own.** If you need a
change in someone else's area, make the smallest possible local workaround and
list the request in your report ("Requests for other areas") — the
orchestrator relays it.

| Area | Owns |
|---|---|
| **design-system** | `src/styles/**`, `src/ui/**`, `src/app/Shell*`, `src/app/Rail*`, `src/app/theme.ts`, `src/app/ErrorBoundary.tsx`, `src/lib/motion.ts` |
| **art** | `src/art/**`, `public/icons/**`, `public/favicon.svg` |
| **timer** (+PWA) | `src/timer/**`, `src/pwa/**`, `vite.config.ts` (PWA plugin section), `public/manifest*`, keyboard-shortcut infra `src/lib/shortcuts.ts` |
| **audio** | `src/audio/**`, `src/lib/haptics.ts` |
| **scene** (3D) | `src/scene/**`, `src/screens/nook/**` |
| **progress** | `src/progress/**`, `src/screens/stats/**` |
| **core-loop** | `src/screens/focus/**`, `src/screens/done/**`, `src/app/flow.ts` |
| **home** | `src/screens/home/**`, `src/screens/welcome/**`, `src/screens/settings/**` |
| shared (orchestrator; additive edits OK with care) | `src/app/App.tsx`, `src/app/router.ts`, `src/app/boot.ts`, `src/app/debug.ts`, `src/lib/{clock,events,dates,format,id,storage,useReducedMotion}.ts`, `src/state/settings.ts`, `index.html`, `package.json` |

Shared-file rule: additive, minimal edits only (e.g. a new event type in
`events.ts`, a new setting field with a default). Re-read the file right before
editing. Never reformat or rename in shared files. **Do not `npm install`** —
ask in your report. **Do not run git commands that change state** (commit,
checkout, stash, reset, rebase) — the orchestrator commits. Read-only git is fine.

## Contracts (stable public APIs — change only with a coordinated update)
- **Timer** `src/timer/index.ts`: `useTimer` (state + actions `startFocus`, `startBreak`,
  `pause`, `resume`, `toggle`, `addTime`, `end`, `tick`, `reset`, `setIntention`),
  `useRemaining()`, `remainingAt`, `progressAt`, `nextBreakKind`, `phaseLengthMs`.
- **Events** `src/lib/events.ts`: `timer:*`, `progress:*`, `ui:toast`. Timer emits;
  progress records sessions on `timer:complete`/`timer:stop` and emits `progress:report`.
- **Progress** `src/progress/index.ts`: `useProgress` (sessions, leaves, cozies,
  `lastReport: CompletionReport`), `useLevel`, `useStreak`, `useToday`,
  `useQuests`, `useUnlockedItems`, `ITEMS` catalog (ids shared with the scene).
- **Audio** `src/audio/index.ts`: `audio.play(SfxName, opts)`, `audio.setAmbient(kind)`,
  `audio.unlock()`, `audio.sync()`, `useSfx()`. `haptic(kind)` in `src/lib/haptics.ts`.
- **Art** `src/art/index.ts`: `<Mascot pose size animate title/>`, `<Icon name size title/>`,
  plus illustrations/badges the art area adds (export them from the index).
- **Scene** `src/scene/index.tsx`: `<Nook {...NookSceneProps}/>` (lazy, static fallback).
- **UI kit** `src/ui/index.ts`: `Button`, `Card`, `ProgressBar`, `Sheet` + whatever
  design-system adds (Ring, Toggle, Slider, Chip, SegmentedControl, SpeechBubble,
  IconButton, Toast, Stat…). Screens must use the kit, not ad-hoc styling of
  controls.
- **Settings** `src/state/settings.ts`: `useSettings`, `getSettings`, `RHYTHMS`, `DAILY_GOALS`.
- Icons for PWA: `public/icons/icon-192.png`, `icon-512.png`, `maskable-512.png`,
  `apple-touch-icon.png` (180), `public/favicon.svg`.

## Quality loop (every area)
Work in iterations — this is your `/loop`:
1. Implement the next most valuable improvement.
2. `tsc` clean. Unit tests where logic exists.
3. Screenshot the affected screens (mobile + desktop, light + dark, reduced
   motion where relevant) and **look at every image**. For interactions, script
   the interaction in `--eval` or a Playwright snippet and capture frames.
4. Critique yourself as a demanding Duolingo design lead: clarity, charm,
   polish, ease of use, accessibility, responsiveness. Write down what's weak.
5. Fix, repeat. Minimum 3 full iterations; stop only when you'd genuinely ship.

Keep a short running log at `docs/areas/<area>.md` (decisions, what changed per
iteration, open issues, requests). Your final report should list: what you
built, screenshots paths of the final state, known gaps, requests for other areas.
