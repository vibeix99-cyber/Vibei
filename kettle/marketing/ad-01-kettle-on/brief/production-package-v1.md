# Ad 01 · "Put the kettle on" · production package v1 (before critique)

## Audience
University students (roughly 18–25) studying at a desk in the evening, especially around exam season, who already like cozy aesthetics: cozy games, lo-fi "study with me" streams, capybara memes.
Their problem: starting. Timers feel like pressure; they put off opening their notes.

## One truthful message
**Kettle turns a study session into a cozy tea ritual: put the kettle on, focus while Chai naps, and when it whistles, take a tea break.**

Every part of this is real app behaviour:
- The start button reads "Put the kettle on".
- The default Classic rhythm is 25 minutes of focus, then a 5-minute tea break.
- During focus, 3D Chai naps in the nook.
- At the end the kettle whistles: the `complete` sound plus the "The kettle's whistling!" screen.
- The break screen reads "Tea time", with Chai sipping.

Not claimed: price, "free", platforms or app stores, productivity results, testimonials, user numbers.

## Concept options and choice
| Concept | Strength | Problem for ad #1 |
|---|---|---|
| Cozy brand film (fully generated) | Mood | Most generation; Chai and the room drift from the real app; shows nothing true about how it works |
| UGC-style study story | Relatable | Needs a person. A generated "student" speaking is a fake testimonial; a silent one is uncanny and generic, and realistic AI people need platform AI labels |
| **Real app demonstration with one cinematic hook (chosen)** | True, specific, cheap. The app's own 3D world is ownable and cozy-game fans respond to it | Demos can feel flat, so the first 2.5 s get the one generated shot |

## Format
- 9:16, 1080×1920, 30 fps, 18.0 s, H.264 + AAC, loudness −14 LUFS integrated, peak ≤ −1 dBTP.
- Dark (night) theme throughout; rain ambience; app clock at 21:15 ("Good evening").
- Safe zones: key text within y 220–1540 and x 90–990; the bottom 380 px and right 120 px may be covered by TikTok/Reels UI.

## Timed shot list (v1)
| # | Time | Source | Picture | On-screen words (edit layer) | Sound (all real app audio) |
|---|---|---|---|---|---|
| 1 | 0.00–2.80 | **Generated** (image-to-video from real engine frames) | Close-up in Chai's nook at night: the orange kettle on the glowing stove, rainy arched window with the moon; steam starts to rise; slow push-in | "Can't make yourself start studying?" | rain + kettle simmer rising |
| 2 | 2.80–5.40 | Real recording, Home | "What are you brewing?" gets "Chapter 3 notes", tap Study, tap **Put the kettle on · 25 min**, dissolve to Focus | "Put the kettle on." | toggle on Study; `start` on the tap |
| 3 | 5.40–9.40 | Real recording, Focus | Nook with rain, Chai napping, timer 25:00 → 24:56, "Kettle's warming up…" | "Chai naps. You focus." | rain + simmer |
| 4 | 9.40–12.60 | Real recording, debug fast-forward to the end of focus | Whistle beat → "The kettle's whistling!" card, Focus 25 min, Leaves +40 | "25 minutes later…" (small, 9.4–10.2), then "It whistles. Tea time." | `complete` (whistle → chime) + count-up ticks (`celebration` mix) |
| 5 | 12.60–15.40 | Real recording, Break | "Tea time: Stretch, sip, look out the window", Chai sipping, break timer 04:59 → 04:57 | "Tea break with Chai." | rain, softer |
| 6 | 15.40–18.00 | End card, real artwork | Chai waving (2D art) + Kettle wordmark | "Put the kettle on. Get cozy. Get it done." | `pop` on Chai; rain fades out |

**Voiceover: none in v1, on purpose.** Most feeds play muted; captions carry the message, and the sound track is the app's own ASMR (rain, simmer, whistle). No voice talent or natural TTS is available here, and a robotic TTS voice would cheapen it.
Optional VO for a later human-recorded cut: "Can't start studying? Put the kettle on. Chai naps, you focus… and when it whistles, it's tea time."

**Ending action:** there is no public destination yet, so none is invented. The end card closes on the brand line. Add a destination line in the edit only when a real, public one exists.

## Real sources
- **App recordings:** Kettle dev build, dark theme, seed `newbie`, clock pinned to 21:15, ambient rain, 390×844 CSS at DPR 3. Captured frame by frame with a controlled clock (Playwright clock plus paused CSS/WAAPI animations stepped each frame), so the 3D nook runs at a true 30 fps even on this software renderer.
- **Artwork:** `Mascot` (wave pose) and `Logo` from `src/art`, rendered by the app's own components for the end card.
- **Audio** (`sources/audio`, rendered by `scripts/audio-check.mjs` through the app's mixing graph): ambient-rain, ambient-simmer, sfx-start, sfx-toggle, sfx-tap, sfx-complete, scenario-celebration, sfx-pop.

## The one generated scene (shot 1)
**Why this scene:** the first 2.5 s decide whether anyone watches, and the real UI is the weakest possible opener. A cinematic close-up of the app's own nook is ownable, true to the product's world, and involves no realistic people.
**Why not render it in the engine for free:** a free engine-only version of the same shot is the fallback. The model is asked for what the real-time renderer does poorly: soft volumetric steam that catches the lamp light, rain trickling on the glass, and a smooth dolly with shallow depth of field.

- **Start frame:** `sources/keyframes/g1-start.png`, the real engine at 1080×1920. Camera `pos [-3.05,1.6,3.25] → at [-0.95,1.5,-2.4]`, fov 44, steam progress 0.12, rain, night.
- **End frame:** `sources/keyframes/g1-end.png`, the same engine timeline 1.5 s later. Camera `pos [-2.9,1.6,2.85]`, fov 40, steam 0.5.
- **Model:** Kling 3.0 Pro image-to-video (`kling-video/v3.0/pro/image-to-video`). It takes first and last frames, its 3 s minimum is the shortest usable length, its own audio can be turned off, and it holds a start image faithfully.
- **Settings:** `duration 3`, `sound "off"`, `cfg_scale 0.5`, `image_url` = start, `last_image_url` = end.
- **Prompt:** see `generated/g1-prompt-v1.txt`.

## Consistency constraints for shot 1
- Keep the exact stylised 3D look of the frames: rounded toy-like shapes, soft plastic/clay materials, warm lamp and stove light, plum walls, orange enamel kettle with a honey-yellow knob, black iron stove with a glowing firebox, arched window with crescent moon and rain.
- Motion only: steam rising and curling, rain on the glass, fairy lights and candle flickering gently, a slow smooth push-in.
- No characters, animals, people or hands (Chai must not appear), no text, no new objects, no cuts, no shake, no style change towards photoreal, no morphing of kettle, stove or window.

**Rejection criteria after generation** (then stop and ask, no automatic retry): a character appears; objects melt or morph; text or a watermark appears; a photoreal restyle; smoke or fire in place of steam; a cut or camera shake.
