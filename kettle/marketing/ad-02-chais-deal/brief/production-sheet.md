# Ad 02 · "Chai's deal": production sheet (internal preflight)

**Delivery:** 18.0 s, 9:16, 1080×1920, 30 fps, H.264 + AAC.

**Audience:** students, and anyone who feels overwhelmed before starting a task.

**Message:** starting feels easier when it becomes a small, comforting ritual.

**Emotional arc:** stuck → a friendly invitation → one small step → a deserved tea break.

## What makes it Kettle
- **Chai** is the app's own `Mascot` component: peek and sip poses, drawn by the app code, never redrawn or regenerated from scratch.
- **The tiny kettle** is the app's `KettleMark`, the same mark as the logo.
- **The kettle ritual:**
  - "Put the kettle on" starts the focus;
  - the kettle whistles at the end;
  - then Tea time.
- **App footage:** every app state is an authentic frame-by-frame recording of the real build.

## Sources checked before production
| | Source | Used for |
|---|---|---|
| Chai | `src/art/Mascot.tsx`: `peek` (opening), `sip` (end card) | opening refs, deterministic rise/settle, end card |
| Kettle mark and wordmark | `src/art/Objects.tsx` `KettleMark` / `Logo` | the tiny kettle; end card |
| Palette | `src/art/palette.ts`: persimmon #F2733A, honey #FFC23D, paper #FFF9F0, plum; dark theme bg #241a2d | all drawn layers |
| Fonts | Fredoka (display) and Nunito (body), from `src/styles/global.css` | every caption and end card |
| App states | Seed `blank` (profile "Alex", day one), app clock 21:15, rain; task "Chapter 3 notes" + Study. Captured with ad 01's deterministic recorder, reused here unchanged (`sources/app`) | Home, tap, focus + napping Chai, 00:03 → whistle, "The kettle's whistling!", Tea time |
| Sounds | The app's own audio graph (`scripts/audio-check.mjs`): tap, start, complete (whistle → chime), rain, simmer, pop | UI sounds and room |
| Original sound | Synthesized in `build/sound.py`: pencil tap, ceramic clink, pencil on paper, the Kettle motif | everything else |

The app and its saved data are untouched: the capture ran in a separate, throwaway browser profile with a debug seed, and no app source changed.

## Timeline and edit
| Time | Picture (source) | Text | Sound |
|---|---|---|---|
| 0.00–0.40 | **Drawn:** a towering task list; Chai rises and peeks over it; the pencil lies still on top | Stuck on the *first line*? | 2 hesitant pencil taps |
| 0.40–2.10 | **Generated G1:** Chai blinks, glances, and nudges the tiny kettle out from behind its head along the top edge | Stuck on… → at 1.20, Chai has a *deal*. | ceramic clink when the kettle stops |
| 2.10–2.60 | **Drawn:** the tower settles into one card, "Chapter 3 notes"; gentle push-in | Chai has a *deal*. | soft paper settle |
| 2.60–3.90 | **Real:** Home with "Chapter 3 notes" and Study; punch-in on the button; the tap (ripple drawn at the recorded tap point) | — (the button text is the message) | the app's `tap` + `start` |
| 3.90–7.00 | **Real:** Focus; close on the nook with Chai napping, easing out to the timer 25:00 → 24:57 | Chai *naps*. You start. | rain, simmer, motif begins |
| 7.00–10.00 | **Generated G2, shot A:** a hand writes one uneven first line, then keeps going; the page is mostly blank | One *little* step. | pencil on paper, motif lifts |
| 10.00–12.00 | **Real:** same nook and timer framing; time jump 24:57 → 00:02 (flash + whoosh); steam begins to rise | 25 minutes later… | music ducks, room tone |
| 12.00–14.00 | **Real:** 00:00, the whistle and the green ring "Tea's ready", then "The kettle's whistling!" with Chai cheering | You *began*. That counts. | the app's `complete` (whistle → chime) |
| 14.00–15.00 | **Real:** Tea time screen ("Tea time: Stretch, sip, look out the window") | — | rain, soft chord |
| 15.00–16.20 | **Generated G2, shot B:** the hand lays the pencil down and reaches for the orange mug; steam | — | pencil set down, a mug clink |
| 16.20–18.00 | **Drawn end card:** Chai sipping, the Kettle wordmark | Kettle · A cozy focus timer · Follow for launch. | motif resolves |

All readable words are added in the edit, with the app's own fonts. Captions sit in the band at y 250–470 and x 90–960, clear of the TikTok/Reels overlays (bottom ~400 px, right ~120 px). There is no handle, link, store or availability claim anywhere.

## Generated shots (at most 2 initial jobs)

**Why these two:**
- G1 gives Chai organic, living motion in the hook, which is hard to hand-animate from flat art. It is locked to the real art by first and last frames.
- G2 is the human moment of progress (a real hand, real pencil, real paper), which can't be recorded from the app.

Everything else is either real or drawn deterministically.

### G1: the illustrated opening (Kling O3 · first-last-frame · pro)

**Why this model:** it is built for first and last frames (reference fidelity), holds a still camera, and 3 s is its minimum length.

**Price:** the same as Kling 3.0 Pro i2v, 2.957 credits after the account's 45% Kling promotion (estimated for free).

| | |
|---|---|
| Subject and references | `generated/refs/opening-first.png` (Chai peeking, no kettle) and `generated/refs/opening-last.png` (the same frame with the tiny kettle beside Chai). Both are rendered from `Mascot pose="peek"` + `KettleMark` |
| Composition and camera | Frontal, locked off; the list's top edge at y 880; Chai centred at x 510; the caption band clear above |
| One action | Chai's paw slides the tiny kettle out from behind its head to the right. A blink and glance before it is the only secondary motion |
| Light and style | Flat 2D vector, no outlines, one highlight and one shade per form, warm lamp glow from the upper left on plum |
| Timing | Used from about 0.1 s to 1.8 s of the clip (retimed if needed); the out-frame must match `opening-last.png` so the drawn settle continues seamlessly |
| Consistency | No redesign, no texture, no text, no new objects; the list, notes and pencil stay still |
| Request | `generated/g1-opening.request.json` (sound off, 9:16, 3 s) |

### G2: pencil and mug (Kling 3.0 · pro · text-to-video, 2 custom shots)

**Why this model:**
- Kling 3.0 Pro made ad 01's photoreal desk well.
- Custom shots keep one desk, one notebook and one hand across both moments in a single job.
- It is covered by the promotion.

**Price:** 6.900 credits ($0.432) for 4 s + 3 s.

| | |
|---|---|
| Subject | One young adult's hand; a yellow pencil with a pink eraser (the same pencil as the drawn opening); a ruled notebook; a plain persimmon-orange mug (the kettle's colour). No logos |
| Composition and camera | Shot A: close, slightly high, on the top of the page, pencil tip in the centre. Shot B: a little wider, with the mug beside the notebook. Locked off |
| One action each | A: the hand writes one uneven first line, then continues. B: it lays the pencil down and reaches for the mug |
| Light and style | Photographed; warm table lamp from the upper left; plum shadows; shallow depth of field; soft grain. It matches the opening's lamp and palette |
| Timing | A: 3.0 s used (7–10). B: about 1.2 s used (15.0–16.2), ending on the fingers around the handle |
| Consistency | Handwriting must stay illegible (no readable words); five fingers; no face, reflections or screens |
| Request | `generated/g2-pencil-mug.request.json` |

### Spend control
- Estimates are free.
- Submissions go through `build/hf-run.py`:
  - the idempotency key is stored before sending;
  - a timeout or 5xx is retried with the same key;
  - a 4xx is never retried;
  - the request ID is saved immediately to `<job>.state.json` + `ledger.jsonl`.
- Status is polled on the API host until completed, failed, nsfw or canceled.

**Estimated total: 9.857 credits (≈ $0.62).** At most one targeted replacement is allowed, and only if a specific defect makes a clip unusable.

## Risks and fallbacks
- **G1 drifts Chai off-model** (face, yuzu, proportions): cut the generated clip down to the frames that hold. The opening can fall back to a drawn slide of the same kettle (the settle renderer already animates both endpoints). Report it.
- **G2 hands malformed or handwriting readable:** shorten the shot to the clean segment, or punch in on the pencil tip. Use the one replacement only if neither works.
- **App footage:** readability is handled with punch-ins, because the capture is 1500×2500 per frame.
