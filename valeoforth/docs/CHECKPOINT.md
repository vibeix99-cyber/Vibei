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
