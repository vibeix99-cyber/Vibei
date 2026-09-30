# Valeoforth — checkpoint notes

Running log so an interrupted session can resume. Newest at the bottom.

## Discovery (done)
- Repo root has only `index.html` = PERIHELION arcade game (untouched). New site lives in `valeoforth/`.
- **Kettle source is NOT in this repo.** It is a built Vite/React app published as a *private* Claude artifact
  (`claude.ai/artifact/5hNMPAMRV5PK2gZ8c3rjFA`, 55 built files, no sources). Built files were downloaded to the
  session scratchpad and served locally to capture real screenshots. Kettle itself is untouched.
- Skills named in the brief (Impeccable, Taste Skill, UI UX Pro Max, GSAP) are **not installed** in this
  environment. Design judgment applied directly; no GSAP added (CSS + tiny vanilla JS is enough).
- Verified facts about Kettle from the built bundle (safe to state on the site): React + three.js (WebGL 3D nook, static
  fallback when no WebGL), zustand-persisted local stores (`kettle:*`), timer driven by start/end timestamps + Web Worker
  tick, WebAudio-synthesised ambient sounds (no audio files), PWA (service worker + manifest), light/dark themes,
  reduced-motion setting, haptics, wake lock, optional notifications, JSON backup import/export, all data on-device.
- Kettle names: mascot **Chai** (capybara wearing a yuzu), "leaves" currency, "Nook" = the 3D cozy room, "brews" = focus
  sessions, "tea breaks". Tagline: "Put the kettle on. Get cozy. Get it done."
- No public Kettle URL. **No live-demo link** is published (artifact is private).

## Checkpoint 2 — build complete, gauntlet round 1 started
- Direction B chosen (see DESIGN-BRIEF.md). Static Node generator (`build.mjs`), sharp image pipeline, no runtime deps.
- Pushed commit "static site with hall + Kettle room…". `npm run build && npm run check && node tools/e2e.mjs` all green.
- Real captures live in scratchpad `raw/` (not committed); processed WebP + Chai SVGs in `public/img`.
- Gauntlet: screenshots via `node tools/shots.mjs <dir>`; critic round 1 launched (read-only agent). Findings → fix → re-shoot → round 2 (max 3 rounds).
- Known nits to consider: Kettle hero on phones shows the arch below the fold; landscape hall CTA sits at the fold edge.

## Checkpoint 3 — gauntlet complete (3 critic rounds), final
- Round 1 (independent read-only critic on rendered pages): BLOCKER scroll-on-load (scrollIntoView on init), MAJOR wordmark/copy overlap at 900–1100 px, MAJOR accidental-looking screenshot crops, plus minors. All fixed.
- Round 2: MAJOR scrollspy wrong (IntersectionObserver ratio) → rewritten; MAJOR Kettle hero two-column breakpoint (900 px) with fluid h1; minors (header opacity, landscape rail, ghost-door plaque). All fixed.
- Round 3: "blocking and major issues resolved". One minor (Room 02 plaque clipped at 1280 px) fixed by raising its breakpoint to 1360 px.
- Regressions from the rounds are now encoded in `tools/e2e.mjs` (no scroll on load; no headline/door overlap at 320–1440; CTA in first screen; scrollspy accuracy).
- Remaining minor/nit (not fixed): tour tab pill text clips at the strip edge on 390 px (it scrolls); "Night" chip wraps alone on 390 px; Chai pose picker wraps 5+5+1 on phones; desktop masonry columns end unevenly; the Sounds tile has ~60 px of empty cream under its caption.
- Not verified by the critic: the cross-document View Transition animation itself (only the end state). It is feature-detected and disabled under reduced motion; the single-file preview uses the same-document API.
- Private preview: single-file build (`npm run preview:single`) published as a private Claude artifact. Kettle's own private artifact link appears nowhere in the site.
