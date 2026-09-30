# Kettle UGC pack: asset index

**Where everything lives:** `kettle/marketing/ugc-pack/` in the repository. `kettle-ugc-pack.zip` holds everything below except `build/`.

**Captured build:**
- Kettle **0.1.0** (Settings → Version).
- Production build of commit `334cb47` (app source last changed in `210e750`), built 2026-09-30 22:16 UTC.
- Main bundle `index-CcNIWrBl.js`.
- The app was not changed for this pack.

**Demo data:** the same demo profile throughout (fictional "Mika"):
- 6 days warm, 655 leaves, cozy level 7 → 8;
- 12 of 30 minutes toward today's goal before the brew;
- intention "Chapter 3 notes", tag Study, ambient Rain.

The screens follow one continuous session.

**Clean:**
- No browser chrome, no debug controls; `?debug` only loads the demo profile and draws nothing.
- No personal data.
- Phone viewport 390 × 844 at 3×, so each screenshot is 1170 × 2532 px.

## Brief
| File | What |
|---|---|
| `KETTLE-UGC-BRIEF.md` | Product, ritual, working features, audiences (hypotheses), availability (with unconfirmed items), three ad angles, claims to avoid |
| `ASSET-INDEX.md` | This file |

## A. Current app screenshots: REAL, from the build above
| File (light) | Dark version | Screen |
|---|---|---|
| `screenshots/light/01-home.png` | `screenshots/dark/01-home.png` | Home: greeting, daily goal (12/30), intention "Chapter 3 notes" · Study, **Put the kettle on · 25 min** |
| `screenshots/light/02-focus.png` | `screenshots/dark/02-focus.png` | Active Focus at 12:25: the 3D nook with the steaming kettle, the countdown ring, +5 / Pause / End. *The app clock was advanced 12.5 min to show mid-brew; the screen is otherwise untouched.* |
| `screenshots/light/03a-whistle.png` | `screenshots/dark/03a-whistle.png` | The whistle: "Tea's ready", Chai cheering in the ring, steam in the room |
| `screenshots/light/03-completion.png` | `screenshots/dark/03-completion.png` | Completion: "The kettle's whistling!", Done / Carry forward, 25 min · +43 leaves · 37/30 today |
| `screenshots/light/04-tea-break.png` | `screenshots/dark/04-tea-break.png` | Tea break: "Tea time. Stretch, sip, look out the window.", 04:58 left to sip, a break idea, Skip break / Start next brew |
| `screenshots/light/05-nook.png` | `screenshots/dark/05-nook.png` | Nook: the 3D room, cozy level 8, 7 of 14 cozy things |

## B. Recording: REAL, one labelled time skip
| File | What |
|---|---|
| `recording/kettle-core-loop-real-TIME-SKIPPED.mp4` | **25.7 s, 780 × 1688, 30 fps, no audio.** A real recording of the build above, light theme, same demo profile. See the timeline below. |

**Timeline**
| Time | What |
|---|---|
| 0–5.3 s | Home (tap **Put the kettle on**), then Focus starting at 24:59 |
| 5.3–7.1 s | A full-screen **"Time skipped"** card: the app's own clock jumps about 25 minutes, to 3 s before the whistle |
| 7.1–9.3 s | A "⏩ 25 min skipped" tag on screen |
| 7.1–15 s | 00:03 → 00:00 → the whistle ("Tea's ready", Chai cheering) → the completion screen |
| 15–20.5 s | The reward cards, tapped through at a normal pace |
| 20.5–25.7 s | The tea break |

**Notes**
- **Speed:** everything except the one labelled skip plays at real speed. Frames were stepped at 1/30 s against a virtual clock, so animations and the countdown run at true speed.
- **Hand-off gap:** about 1 s of nearly empty screen between the whistle and the completion screen is the current build's real hand-off (a known issue the redesign addresses). Trim it in an edit if you like, but don't cut the time-skip disclosure.
- **Sound:** none, because the capture is silent. The app's real sounds (rain, the whistle then chime) are in `kettle/marketing/ad-01-kettle-on/sources/audio/` if an editor needs them.

## C. Brand art
| File | What |
|---|---|
| `brand/kettle-logo-wordmark-for-light-backgrounds.png` | The existing logo (kettle mark + "Kettle"), transparent, 1040 × 320 |
| `brand/kettle-logo-wordmark-for-dark-backgrounds.png` | The same, with light lettering for dark backgrounds |
| `brand/kettle-logo-mark.png` | The kettle mark alone, transparent, 1024 × 1024 |
| `brand/kettle-app-icon-512.png` | The app icon as installed (512 × 512) |
| `brand/chai-approved-reference/chai-approved-sheet.png` | **The approved Chai art direction** (8 poses). It is *not yet in the app*: the app's screens show the current vector Chai. |
| `brand/chai-approved-reference/chai-reading.png` | Approved Chai, reading: for Focus moments. Transparent. |
| `brand/chai-approved-reference/chai-sipping.png` | Approved Chai, sipping: for the tea break. Transparent. |
| `brand/chai-approved-reference/chai-cheering.png` | Approved Chai, cheering: for the whistle and completion. Transparent. |
| `brand/chai-approved-reference/chai-concerned.png` | Approved Chai, concerned: only for gentle support. Transparent. |
| `brand/chai-approved-reference/chai-happy.png` | Approved Chai, content: for greetings. Transparent. |

## D. PROPOSED REDESIGN: NOT IN THE CURRENT APP
Mockups from the ongoing redesign review, in `proposed-redesign-NOT-IN-APP/`. Each image has a permanent orange "PROPOSED REDESIGN · NOT IN THE CURRENT APP" band. **Never present these as the app.** Use them only for internal planning, or clearly labelled as "coming soon" if the owner approves.

| File | What |
|---|---|
| `PROPOSED-01-home.png` | Proposed Home: minutes brewed and to go stated in words |
| `PROPOSED-02-focus.png`, `PROPOSED-02b-focus-dark.png` | Proposed Focus: the kettle is the timer, approved Chai reading on a shared counter |
| `PROPOSED-03-whistle.png` | Proposed whistle |
| `PROPOSED-03b-completion-summary.png` | Proposed single completion summary |
| `PROPOSED-03c-completion-room-unlock.png` | Proposed summary with a room unlock |
| `PROPOSED-04-tea-break.png` | Proposed tea break, with approved Chai sipping |

## Rebuild (from `kettle/`, no paid services)
1. Build and serve the app:
   ```
   npm run build && npx vite preview --port 4173
   ```
   For the logo and card fonts, also run `npx vite --port 5191`.
2. Screenshots:
   ```
   node marketing/ugc-pack/build/capture-screens.mjs light|dark
   python3 marketing/ugc-pack/build/pick-whistle.py marketing/ugc-pack/screenshots/<theme>
   ```
3. Recording:
   ```
   node marketing/ugc-pack/build/record-core-loop.mjs .tmp/ugc-rec
   node marketing/ugc-pack/build/encode-core-loop.mjs .tmp/ugc-rec
   ```
4. Art and labels:
   - `node marketing/ugc-pack/build/render-logo.mjs`
   - `node marketing/ugc-pack/build/label-proposed.mjs`
