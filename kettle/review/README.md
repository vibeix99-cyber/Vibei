# Critic review kit

Everything the critic uses to judge Kettle against the Duolingo bar. Run all commands from `kettle/`.
Nothing here touches `src/**`.

| File | What |
|---|---|
| `RUBRIC.md` | 8 criteria with 4/6/8/10 anchors, hard fails, per-screen checklists, blind protocol, round-report format |
| `refs-manifest.json` + `fetch-refs.mjs` | Public Duolingo reference set: URLs only → `refs/duolingo/<category>/` + `SOURCES.md` (gitignored) |
| `blind-plan.json` + `blind.mjs` | Blind side-by-side pairs: Kettle capture recipe + Duolingo comparables per screen |
| `functional.spec.ts` + `playwright.config.ts` | Functional, a11y (axe) and responsive test plan (69 tests) |
| `contact.mjs` | Tile many screenshots into one sheet for fast visual review |
| `summarize.mjs` | One-screen summary of `test-results/results.json` (fails, first error, hmr / axe-minor / tap-target notes) |

## 1. Reference set (once, or `--force` to refresh)
```bash
node review/fetch-refs.mjs            # → review/refs/duolingo/**, SOURCES.md (never commit: gitignored)
```

## 2. Functional / a11y / responsive
```bash
npx playwright test -c review/playwright.config.ts                     # starts or reuses vite on :5190
npx playwright test -c review/playwright.config.ts -g "axe|layout: home" # subset
KETTLE_SNAPSHOT=1 npx playwright test -c review/playwright.config.ts   # build + preview (no HMR churn; nook catalog test skips)
node review/summarize.mjs                                              # fails + annotations (don't pass --reporter: it bypasses results.json)
```
A test annotated `hmr-during-test` saw a builder's edit hot-reload the page mid-test. Re-run it before
blaming the app.
Output goes to `review/test-results/`: `functional/*.png` (flow shots, `resp-<vp>-<scene>.png`),
`functional/axe-*.json`, `functional/layout-*.json`, `report/` (HTML) and `results.json`. Test outputs live
under a `test-results` directory because Vite ignores it by default, so reports never
hot-reload anyone's dev server.

## 3. Blind review
```bash
npx vite --port 5190 --strictPort &                       # or a snapshot: vite build --outDir review/test-results/dist && vite preview --outDir … --port 5190
node review/blind.mjs --round 1 [--only home,focus] [--theme light] [--seed 123]
#  → review/out/round-1/kettle/<screen>.png + capture-log.json   (check warnings: a failed step = wrong screen)
#  → review/pairs/round-1/pair-NN.png + JUDGE.md                (give ONLY this folder to the blind judge)
#  → review/pairs/round-1-key/key.json                          (keep; never show the judge)
node review/blind.mjs --round x --pair a.png refs/duolingo/home/home-path-2026.png --kind "home screen"   # ad-hoc
node review/blind.mjs --aggregate review/pairs/round-1/scores.json   # judge's JSON + key → per-screen verdict table
```

## 4. Looking at shots
```bash
node review/contact.mjs --out /tmp/sheet.png --h 520 --cols 6 review/test-results/functional/
```
