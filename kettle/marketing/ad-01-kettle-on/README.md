# Kettle · Ad 01 · "Put the kettle on" (15 s, 9:16)

**Export:** `exports/kettle-ad01-put-the-kettle-on-v1.mp4`
- 1080×1920, 30 fps, 15.0 s, H.264 High + AAC 48 kHz 192 kb/s, 5.5 MB.
- −14.5 LUFS integrated, LRA 7.4 LU, peak −1.2 dB.
- `exports/poster.jpg` is the end-card frame. `exports/review-phone-size.png` shows 12 frames at 360×640 with platform overlay zones in red.

## What it is
| | |
|---|---|
| Audience | University students studying in the evening who like cozy things (cozy games, lo-fi study streams, capybaras) |
| Message (all real app behaviour) | Put the kettle on: focus while Chai naps, and when the kettle whistles, it's tea time |
| Concept | A real app demonstration with one generated hook. A cozy brand film was rejected (drift, shows nothing true); so was a UGC story (a generated "student" would be a fake testimonial) |
| Hook | 0–1.5 s: faceless, photoreal desk at night, a pencil tapping on a blank page. **"Can't start studying?"** |
| Ending | End card with real Chai art: **"Put the kettle on."** · "a cozy focus timer". There is no public destination yet, so none is shown. Add one to the end card only when a real one exists |
| Voiceover | None, on purpose. Captions plus the app's own sounds. An optional VO line for a human-recorded cut is in `brief/production-package-v2.md` |

## Shots (final)
| Time | Source | Caption |
|---|---|---|
| 0.00–1.50 | **Generated** (Kling 3.0 Pro): desk, orange mug, pencil tapping | Can't start **studying**? |
| 1.50–2.70 | Real: Home, "Chapter 3 notes" · Study, tap **Put the kettle on · 25 min** (ripple drawn in the edit) | Put the **kettle** on. |
| 2.70–5.70 | Real: Focus, close on Chai napping in the nook, easing out to the timer 24:58 → 24:56 | Chai **naps**. You focus. |
| 5.70–6.50 | Edit card | 25 minutes later… |
| 6.50–9.67 | Real: 00:01 → the kettle whistles in the room → "Tea's ready" → "The kettle's whistling!" | It **whistles**. Tea time. |
| 9.67–12.20 | Real: tea break, "Tea time: Stretch, sip, look out the window" | Tea break with **Chai**. |
| 12.20–15.00 | End card from the app's `Mascot` and `Logo` components | Put the kettle on. |

**Sound (all Kettle's own audio, rendered by `scripts/audio-check.mjs` through the app's mixing graph):**
- Rain throughout, with a quiet bed of the app's lo-fi ambience.
- `start` on the tap (2.2 s); kettle simmer during focus.
- `complete` (whistle → chime) at 00:00 (7.33 s), about 7 LU above the bed.
- `pop` when Chai appears (12.3 s).

## Honesty notes
- Every app screen is a real recording of the dev build (seed `blank`, day one, app clock 21:15, rain). Nothing on screen was generated or redrawn.
- **Time jump:** the app's debug clock jumps to 3 s before the end of the 25 minutes; everything after that is the natural completion path. The "25 minutes later…" card discloses it.
- **Edited out:**
  - a near-blank hand-off frame between "Tea's ready" and the card (a known app transition issue from the design reviews);
  - the leaves tiles (not explained in the ad, so kept off screen).
- **Shot 1 is realistic AI-generated video.** Label the post as AI-generated where the platform requires it.
- **Deviation in shot 1:** the window shows a soft, faceless reflection of the student's sleeve, mug and notebook, despite "no reflections" in the prompt. It was not regenerated. The caption scrim and a slight punch-in subdue it.

## Spend (Higgsfield API)
| Request | Model | Status | Charged |
|---|---|---|---|
| `7fe14d49-b1f0-4807-8422-cd26c9422534` | `kling-video/v3.0/pro/text-to-video`, 3 s, 9:16, sound off | completed first time | **2.957 credits ($0.185)** after the account's 45% Kling 3.0 promotion (2.420 credits saved) |

That was the only paid request. Every estimate call is free. `generated/ledger.jsonl` and `generated/g1-desk.state.json` hold the idempotency key and request ID; they contain no credentials.

## Review at phone size
**Sound off works:**
- Every caption reads at 360 px wide, in the band y 250–470, clear of the platform's bottom and right overlays.
- The whistle is visible without sound: the steam jet, the ring turning green, Chai cheering.

**Sound on (measured, not listened to):**
- Rain from frame 0; the tap, simmer and whistle land on their frames.
- The whistle peaks at about −11.8 LUFS momentary against a bed of about −19.
- A person should still listen once on a phone speaker and headphones before posting.

**Weaker:**
- The Home punch-in (1.2 s) still shows a lot of UI around the button.
- Chai first appears at 2.7 s (the critique wanted about 1.5 s).
- The jump from photoreal to flat UI is only bridged by the orange mug and orange button.
- The hook shot is well made but generic.
- The window reflection is visible if you look for it.

## Folder
| Folder | Contents |
|---|---|
| `brief/` | Package v1, package v2 (final), paper critique and responses, storyboard board |
| `generated/` | Prompts v1 → v2 → final, the exact request JSON, the downloaded clip `g1-desk-0.mp4`, request state and ledger |
| `sources/app/` | The real recording (3 segments, H.264 CRF 14 masters of the frame-by-frame capture) plus `events.json` (tap position, marks) |
| `sources/art/` | Rendered captions, time card, scrim, animated end card |
| `sources/audio/` | App sounds (FLAC) |
| `build/` | `record-app.mjs` (deterministic 30 fps capture), `overlay.html`/`overlay.tsx` + `render-overlays.mjs` (edit layer from app styles/art), `compose.mjs` (edit list + camera moves), `encode.sh` (mix + two-pass loudness + H.264), `extract.sh` (masters → working frames), `hf-run.py` (duplicate-safe Higgsfield submit/poll/download) |

## Rebuild (no paid calls)
Run these from `kettle/`, with the dev server on 5191 (`npx vite --port 5191`) and `FFMPEG` pointing at an ffmpeg with libx264.

1. Re-record the app, or extract the saved masters:
   - `node marketing/ad-01-kettle-on/build/record-app.mjs http://localhost:5191 .tmp/ad/rec`
   - or, from `marketing/ad-01-kettle-on`: `build/extract.sh ../../.tmp/ad`
2. Edit layer: `node marketing/ad-01-kettle-on/build/render-overlays.mjs http://localhost:5191 .tmp/ad/ov`
3. Compose frames: `node marketing/ad-01-kettle-on/build/compose.mjs http://localhost:5191 .tmp/ad .tmp/ad/out`
4. Mix and encode (from `marketing/ad-01-kettle-on`): `build/encode.sh ../../.tmp/ad/out exports/kettle-ad01-put-the-kettle-on-v1.mp4`
