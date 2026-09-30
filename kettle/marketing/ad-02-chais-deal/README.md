# Kettle · Ad 02 · "Chai's deal" (18 s, 9:16)

**Export:** `exports/kettle-ad02-chais-deal-v1.mp4`
- 1080×1920, 30 fps, 18.00 s, H.264 High + AAC 48 kHz 192 kb/s, 11 MB.
- −14.1 LUFS integrated, LRA 6.3 LU, true peak −1.4 dBFS.
- Cover: `exports/cover.jpg` (1.9 s, "Chai has a deal.").
- Phone review: `exports/review-phone-size.png` (every 0.5 s at 360×640, with the platform UI zones in red).
- Waveform: `exports/audio-waveform.png`.

Not published anywhere. The Kettle app is unchanged: no source edits, and the capture ran on a throwaway debug profile.

## The ad
**Audience:** students, and anyone who stalls before starting.

**Arc:** stuck → a friendly invitation → one small step → a deserved tea break.

| Time | Picture | Source | Text | Sound |
|---|---|---|---|---|
| 0.00–0.30 | Chai rises and peeks over a towering task list; a pencil lies still on top | drawn (app `Mascot` peek + `KettleMark`) | Stuck on the **first line**? | hesitant pencil taps (0.10, 0.62, 0.78) |
| 0.30–2.20 | Chai squints, looks, and nudges the tiny kettle out from behind its head | **generated G1** (retimed ×1.39 → ×1.5) | → at 1.2 s: Chai has a **deal**. | ceramic clink at 1.83 |
| 2.20–2.67 | The tower settles into one card, "Chapter 3 notes"; gentle push-in | drawn | Chai has a **deal**. | paper settle |
| 2.67–3.73 | Real Home: "Chapter 3 notes" + Study; push-in on **Put the kettle on · 25 min**; tap at 3.60 (ripple at the recorded tap point) | real recording | — | app `tap` + `start` |
| 3.73–7.00 | Real Focus: close on Chai napping beside the kettle, easing out to 25:00 → 24:56 | real recording | Chai **naps**. You start. | rain, simmer, motif begins |
| 7.00–10.00 | A blank page: one uneven first line, then the hand carries on | **generated G2R** (×1.1) | One **little** step. | pencil on paper, the motif lifts |
| 10.00–12.00 | Same nook and timer framing: 24:55 → flash → 00:03, and the kettle begins to steam | real recording | 25 minutes later… | whoosh, music ducks |
| 12.00–14.00 | 00:00, whistle, steam jet, green ring "Tea's ready", Chai cheering, then "The kettle's whistling!" | real recording | You **began**. That counts. (from 12.83) | app `complete` (whistle → chime), `pop` |
| 14.00–15.00 | Tea time: "Stretch, sip, look out the window." | real recording | — | rain |
| 15.00–16.20 | The hand lays the pencil down and reaches for the orange mug | **generated G2**, shot B (×1.6) | — | pencil set down, soft mug clink |
| 16.20–18.00 | Chai sipping, the Kettle wordmark | drawn end card | Kettle · A cozy focus timer · **Follow for launch.** | `pop`, the motif resolves |

**Lettering:** every readable word is set in the edit with the app's own fonts (Fredoka and Nunito). There is no handle, link, store listing or availability claim.

**Captions:** they sit in y 250–470, x 90–960. "25 minutes later…" is a smaller right-hand pill so the steam stays visible.

## Models and spend (Higgsfield API)
Models were chosen from the current docs (`docs.higgsfield.ai/docs/llms-full.txt`, re-fetched today). Every job was estimated for free first. The account's **45% Kling promotion** applied to all three jobs.

| Job | Model / endpoint | Request ID | Result | Credits | USD |
|---|---|---|---|---|---|
| G1: illustrated opening | Kling O3 first-last-frame, pro, 3 s, 9:16, sound off (`kling-video/o3/first-last-frame`) | `d40ae7a0-cda1-44a6-abfc-36116aa807fb` | completed first time; used | 2.957 | 0.185 |
| G2: pencil + mug, 2 custom shots (4 s + 3 s) | Kling 3.0 Pro text-to-video (`kling-video/v3.0/pro/text-to-video`) | `d2605f19-6962-4399-b007-21733c050094` | completed; shot B used, shot A rejected (below) | 6.900 | 0.432 |
| G2R: the one targeted replacement (shot A) | Kling 3.0 Pro image-to-video, 4 s (`kling-video/v3.0/pro/image-to-video`) | `0a399b08-0fde-4ae1-9497-54de2f38b4cd` | completed; used | 3.943 | 0.247 |
| **Total** | | | | **13.800** | **$0.864** |

**Why these models:**
- **G1:** O3's first-last-frame endpoint is built to hold both supplied frames. It kept Chai on-model (face, yuzu, proportions, flat shading) at the same price as Kling 3.0 Pro image-to-video.
- **G2:** Kling 3.0 Pro produced ad 01's photoreal desk, and custom shots keep one desk, hand and mug across both moments.

**Why the replacement:** G2's shot A started on a page already carrying two lines of pseudo-handwriting, so there was no "first line", and made-up word shapes were the focal point.

The fix:
- `build/clean-plate.py` removed only those strokes from G2's own first frame (`generated/refs/g2r-first-frame.png`).
- That frame seeded one image-to-video job.

That was the single replacement the brief allowed; no other generation ran.

**What the costs are:**
- The credit figures are the estimate endpoint's price for each completed job; the status API returns no separate charge field.
- Please confirm against the Higgsfield Console billing page.
- Failed and nsfw jobs are not charged; none occurred.

**Duplicate-charge protection** (`build/hf-run.py`):
- An Idempotency-Key is stored before sending.
- The request ID is saved on acceptance.
- Status is polled on the API host.
- A 4xx is never retried; a timeout or 5xx is retried only with the same key.

**Uploads:** the references were sent through the documented presigned upload. `generated/uploads.json` holds only public file URLs.

**Credentials:** none appear in any file; the credential proxy adds auth.

## Verification
**Checked by viewing frames:**
- Full-resolution seams.
- Contact sheets of every clip.
- The 360×640 phone sheet with the platform overlay zones.

**Checked by measurement:** EBU R128 loudness per section.

**What works:**
- **First second:** the hook caption is fully on screen from frame 0, and Chai is already rising over the list. The cover frame reads at thumbnail size.
- **Chai consistency:**
  - G1 holds the character: the same face, yuzu, ears, paws and palette as the supplied art, with no redesign. Its end frame matches the drawn settle frame, and the cut is invisible.
  - Everywhere else Chai is the app's own component or the real 3D nook.
- **Focus timer:** it reads clearly: tap "Put the kettle on" → 25:00 → Chai napping by the kettle → 24:56. After the time jump the same framing shows 00:03 → 00:00 → green ring "Tea's ready".
- **Pencil payoff:** G2R starts on a blank page, writes one uneven line, then moves on to a second. The page is visibly unfinished. At 15 s the page holds a few lines and the pencil is set down.
- **Muted viewing:** every caption and key UI label reads at 360 px wide. The whistle is also shown visually: the steam jet, the green ring and Chai cheering.
- **Sound balance (measured, momentary loudness):**

  | Section | Loudness |
  |---|---|
  | Whistle peak | −6.6 LUFS |
  | Music sections (median) | −13 to −14 LUFS |
  | Tea / mug bed | −20 LUFS |
  | Hook | about −25 LUFS (quiet on purpose: pencil taps in a still room) |

  The whistle sits about 4 LU above the loudest music and about 7 LU above the bed.
- **Ending:** it closes on one clear action, the hand reaching for the mug, and cuts to the end card.

**Weaker, or worth knowing:**
- **Continuity between the pencil shots.** The handwriting at 7–10 s (G2R) doesn't match the lines on the page at 15 s (G2 shot B). They are different generations, with 25 minutes between them in the story, and the difference is only noticeable if you look for it.
- **G2R flaws:**
  - A faint second scribble appears slightly before the pencil reaches it (around 8.5 s). It seems to have grown from a leftover mark of the cleanup.
  - One frame of heavy motion blur as the hand lifts (about 9.4 s).
- **Shot B handwriting.** The page is filled with illegible pseudo-handwriting from the video model. It is not readable text, but it is generated letter-like marks.
- **Hands.** The hand in shot A looks older than the one in shot B.
- **Brief Focus frames.** For 2 frames after the tap, the Focus screen appears in the app's own intro state before the cut to the nook.
- **The Home push-in.** It trims the left edge of the task field near the tap. The full field is on screen earlier in the shot.
- **Generated footage.** 0.3–2.2 s is AI-animated from Kettle art, and 7–10 and 15–16.2 s are realistic AI-generated video. Label the post as AI-generated where the platform requires it.
- **Time jump.** As in ad 01, the app's debug clock jumps to 3 s before the end of the 25 minutes. The "25 minutes later…" caption discloses it.

**Limitation:** I can't hear audio. The mix was checked by loudness measurement, a waveform and cue timing against the picture, not by listening. Please listen once on a phone speaker and on headphones before posting. Things to check:
- whether the synthesized clink and pencil sound natural;
- that the motif is gentle rather than tinny;
- that the whistle is pleasant.

The cue times and levels live in `build/cues.json`, so each is a one-line change.

## Folder
| Folder | Contents |
|---|---|
| `brief/production-sheet.md` | the preflight: sources checked, shot plan, per-shot prompts and constraints, spend control, fallbacks |
| `generated/` | the 3 request bodies, state files (request ID, idempotency key, estimate, output URL), `ledger.jsonl`, the downloaded clips `g1-opening-0.mp4`, `g2-pencil-mug-0.mp4`, `g2r-first-line-0.mp4`, and `refs/` (the uploaded reference frames) |
| `sources/app/` | the real recording masters (reused from ad 01's deterministic capture: seed `blank`, 21:15, rain, "Chapter 3 notes" + Study) and `events.json` (tap position) |
| `sources/art/` | caption PNGs, drawn sequences `rise.mp4`, `settle.mp4`, `end.mp4` |
| `sources/audio/` | the app's own sounds (FLAC, rendered by `scripts/audio-check.mjs`) and the original synthesized stems `synth-motif.flac`, `synth-sfx.flac` |
| `build/` | see the rebuild steps below |
| `checkpoint.json` | request IDs, output locations, stage status. Read it before any paid call |

## Rebuild (no paid calls)
From `kettle/`, with the dev server on 5191 (`npx vite --port 5191`), `FFMPEG` pointing at an ffmpeg with libx264, and `PYTHONPATH` providing numpy and scipy:

1. `node marketing/ad-02-chais-deal/build/render-stage.mjs http://localhost:5191 .tmp/ad2/ov all`
   - drawn opening, settle, captions and end card from `stage.html`/`stage.tsx`;
   - every frame is a pure function of its URL.
2. `(cd marketing/ad-02-chais-deal && build/extract.sh ../../.tmp/ad2)`
   - app masters and generated clips → frames.
3. `node marketing/ad-02-chais-deal/build/compose.mjs http://localhost:5191 .tmp/ad2 .tmp/ad2/out`
   - the edit list, camera moves, retiming and captions;
   - writes 540 frames.
4. `(cd marketing/ad-02-chais-deal && build/encode.sh ../../.tmp/ad2/out exports/kettle-ad02-chais-deal-v1.mp4)`
   - the sound (`sound.py` + `cues.json`), two-pass loudness and H.264.

Paid scripts, only if new footage is ever approved:
- `build/hf-upload.py`: reference upload.
- `build/hf-run.py <job> <endpoint> <body.json>`: never resubmits a job whose state already has a request ID.
- `build/clean-plate.py`: removes the handwriting for the G2R seed frame.
