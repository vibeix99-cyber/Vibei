# Ad 01 · "Put the kettle on" · production package v2 (after the paper critique) — FINAL FOR SPEND

v1 and the critique that produced this version: `production-package-v1.md`, `critique-v1.md`.

## Audience
University students (roughly 18–25) studying in the evening, who like cozy aesthetics: cozy games, lo-fi study streams, capybaras. The problem: getting started.

## One truthful message
**Put the kettle on: focus while Chai naps, and when the kettle whistles, it's tea time.**

Everything shown is real app behaviour:
- The start button reads "Put the kettle on · 25 min" (the Classic rhythm is 25 minutes).
- During focus, 3D Chai naps in the nook.
- At 00:00 the kettle whistles: in the room, the lid rattles and notes float out; the "complete" sound plays; the "The kettle's whistling!" card appears.
- The break screen reads "Tea time", with Chai sipping.

Not claimed: price, "free", platforms or stores, productivity results ("get it done" removed), testimonials, leaves or levels (not explained, so kept off screen).

## Concept (unchanged)
A real app demonstration with one generated moment.

What changed is which moment is generated. The critique showed that everything inside Kettle, including the steam and the whistle, is rendered by the real engine and can be recorded for free. What the app cannot show is **the viewer's problem**. So the single paid scene is now the hook: a faceless, photoreal study desk at night, stuck. Every Kettle picture in the ad is a real recording.

## Format
- 9:16, 1080×1920, 30 fps, **15.0 s**, H.264 High + AAC 48 kHz, −14 LUFS integrated, true peak ≤ −1 dBTP.
- **Captions:** Fredoka (the app's display font), one band at y 250–470, x 90–960, from frame 0 of each shot. Nothing important in the bottom 400 px or right 120 px.
- **Recording:** one continuous real session in a 600×1000 portrait window (the app's single-column phone layout), DPR 2.5, non-touch so the 3D nook renders at 2×.
  - Dark theme, seed `blank` (Alex, day one, no history), app clock pinned to 21:15, ambient rain.
  - Captured frame by frame at a true 30 fps (`build/record-app.mjs`).

## Shot list v2
| # | Time | Source | Picture | Caption (edit) | Sound (all app audio, plus the app's own lo-fi as a quiet bed) |
|---|---|---|---|---|---|
| 1 | 0.00–1.50 | **Generated** (Kling 3.0 Pro, text-to-video) | Faceless over-the-shoulder view of a desk at night: blank notebook, a pencil tapping, drumming fingers, an orange mug steaming, rain on the window | **Can't start studying?** | rain (app ambience) from frame 0; lo-fi bed −10 dB |
| 2 | 1.50–2.70 | Real: Home | Punch-in on "What are you brewing? Chapter 3 notes · Study" and the orange **Put the kettle on · 25 min** button, large and centred just below the middle; tap at 2.2 s (ripple drawn in the edit). The orange mug cuts to the orange button | **Put the kettle on.** | `start` on the tap |
| 3 | 2.70–5.70 | Real: Focus | Opens close on Chai napping in the nook (zZ, rain in the window, kettle steaming); eases out to the room card and the timer counting from 24:58 | **Chai naps. You focus.** | rain + kettle simmer |
| 4 | 5.70–6.50 | Edit card | Plum dip with a full-size title | **25 minutes later…** | rain |
| 5 | 6.50–9.60 | Real: end of focus (clock jumped to 3 s before the end, then the natural finish) | 00:03 → 00:00; the nook kettle whistles (lid rattles, notes float); then "The kettle's whistling!" with Chai cheering (cropped above the leaves tiles) | **It whistles. Tea time.** | `complete` (whistle → chime) |
| 6 | 9.60–12.20 | Real: break | "Tea time: Stretch, sip, look out the window", Chai sipping (2D) and in the nook (3D) | **Tea break with Chai.** | rain, softer |
| 7 | 12.20–15.00 | End card, real artwork | Chai (waving pose, app component) pops in over paper, Kettle wordmark | **Put the kettle on.** Small: "a cozy focus timer" | `pop` on Chai; rain and lo-fi fade out |

- **Voiceover:** none, on purpose. Optional for a later human-recorded cut: "Can't start studying? Put the kettle on. Chai naps, you focus. When it whistles, it's tea time."
- **Ending action:** brand line only. There is no public destination, so none is invented. Add it in the edit's reserved end-card slot when a real one exists. Until then this is an organic or preview cut, not a performance ad.

## Real sources
| What | Where |
|---|---|
| App recording (one session: home → tap → focus → end-of-focus → whistle → break) | `build/record-app.mjs` → `sources/app/` |
| Chai waving + wordmark (app components `Mascot`, `Logo`) | `build/render-endcard.mjs` → `sources/art/` |
| Rain, simmer, lo-fi (`ambient-lofi.wav`), start, complete, pop | `sources/audio/` (rendered by `scripts/audio-check.mjs` through the app's audio graph) |

## The one generated scene (shot 1)
- **Why this one:** it is the only picture the product cannot provide. It shows the audience themselves and the problem in 1.5 s. The steam, whistle and Chai are all real footage.
- **Model:** Kling 3.0 Pro text-to-video (`kling-video/v3.0/pro/text-to-video`), chosen for its strong photoreal motion and hands at short lengths. Its 3 s minimum is the shortest billable length. It can turn native audio off, and the account has a **45% promotion** on Kling 3.0.
- **Settings:** `duration 3`, `aspect_ratio "9:16"`, `sound "off"`, `cfg_scale 0.5`, one output. About 1.5 s is used.
- **Reference image:** none. Text-to-video takes none, and a photoreal start frame would need an extra paid image. The scene contains no brand character. Consistency comes from the stated palette and lighting.
- **Prompt:** `generated/g1-prompt-final.txt`. This replaced v2 after the second critique pass: one action (pencil taps from frame 0) with the left hand still; a high angle with no head, hair or shoulders; no reflections; no laptop; plain, unprinted objects; the mug centred just below the middle, where the orange button lands after the shot 2 punch-in.
- **Estimate:** 2.957 credits ($0.185) after the 45% discount (2.420 credits off).

## Consistency constraints (shot 1 → the app)
- **Light and colour:** the same world as the nook at night. One warm honey-yellow lamp, a deep blue-violet rainy window, and a persimmon-orange mug that cuts to the orange button.
- **Nothing that impersonates the product:** no phone, no screen, no UI, no readable text (blank pages), no logos. The laptop stays closed.
- **No face:** hands and forearms only, which avoids uncanny faces and any hint of a testimonial.
- **Motion:** small and natural (pencil taps, drumming fingers, steam, rain). Locked-off camera, no cuts.
- Chai never appears in generated footage.

**Reject and stop, asking before any retry**, if any of these appear:
- malformed hands or fingers;
- a face;
- hair, ears or shoulders;
- reflections of a person in the window;
- a phone or screen;
- text or logos;
- morphing objects;
- a cut or shake;
- cartoon or 3D styling.

## Publishing notes
- Shot 1 is realistic AI-generated video. Label the post as AI-generated where the platform requires it (TikTok's AI-generated content label; Meta's "AI info").
- "25 minutes later…" discloses the time jump. The recording itself uses the app's debug clock to jump to 3 s before the end; everything after that is the natural completion path.
