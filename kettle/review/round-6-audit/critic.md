# Round 6: the independent critic's challenge, and how it was reconciled

**How the critic ran.** One general-purpose agent with a focused brief. It had `initial-audit.md`, the brief, and selected shots and source files. It had no write access to the app and made no paid calls.

## What the critic argued, and what I checked
| Critic's point | My check | Outcome |
|---|---|---|
| **D1 Nook layering.** Cause: `.root` is its own size container, so its `@container` rule never applies | `NookScreen.module.css:3` sets `container-type` on `.root`, and the 860 px rule targets `.root` | **Confirmed.** Kept as a defect with the cause |
| **D2 static ≠ 3D is overstated.** Items sit in the same places; lighting, palette, camera and Chai differ | Compared `nook-desktop-dark-off.png` and `-high.png` | **Agreed.** Reclassified as art consistency (A4) |
| **D3 whistle "blank frame" is the designed bloom.** `WHISTLE_MS` is 1250 while the comments say ~1.7 s and ~2 s | `flow.ts:30`, `flow.ts:4`, `FocusScreen.tsx:6` | **Agreed.** No longer a defect; comment drift is D4 |
| Missed defect: **two Chais at the whistle** (2D in the ring, 3D asleep in the room) | `phone-dark-celebrate-07-whistle-300ms.png` | **Confirmed.** Now D2 |
| **Warm Room inverts the brief** ("3D only where it meaningfully adds atmosphere… never distracting"). Battery and heat, distraction, WebGL-less users | `BRIEF.md` lines 111–117; bundle sizes; the engine runs at 30 fps | **Agreed.** Recommendation changed to Direction A. Warm Room kept as B |
| **Alternative "the kettle is the timer" (2D-first)** | Matches the brief, reduced motion and the audience | **Adopted** as the recommendation |
| **R3 → #1; R4 (static renders from 3D) cut; R5 split** | Weighed against evidence | Adopted: one celebration is R1; static renders dropped; the Nook fix moved into the bundle |
| Missed usability issues:<br>- rhythm has no default and goal has no Skip;<br>- 30-min goal plus a 50-min first brew;<br>- day-one zeros and a grey mug;<br>- "cup" ambiguity and three cycle spellings;<br>- orange means "under goal" in Stats;<br>- the break's primary button is "Start next brew";<br>- the at-risk CTA mismatch;<br>- nothing about tomorrow;<br>- tier pill "II" reads as pause;<br>- level-up preview void | Checked the onboarding walk log, `blank-home-mobile-light.png`, `atrisk-home-mobile-dark.png`, `WeekCard.tsx` legend, `done-3/4/5` | **Confirmed.** Added as U2–U8, D3 |
| **Chai:** the expressiveness critique is fair or understated; the sip pose reads as a snorkel at small sizes; the focus pose is never used (focus maps to sleep). Proposed a posture system and preserve-list | `Fallback.tsx:21` maps focus → sleep; `kit-art-light.png` | **Agreed.** This became R4 |

## Where I still differ from the critic
- **The room during focus.** The critic would push the room to a pure backdrop. I'd keep it visible on Focus, as the brief asks, but secondary to the kettle. The close-camera renders show it can add warmth when framed deliberately.
- **Tablet and desktop composition.** The critic calls it low priority; I agree, and it follows naturally once Home is distilled.
