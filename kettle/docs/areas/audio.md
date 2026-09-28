# Audio area — log

Owner: audio. Files: `src/audio/**`, `src/lib/haptics.ts`, `scripts/audio-check.mjs`.
Everything is synthesized with WebAudio at runtime: no sample files.

## Architecture

| File | What |
|---|---|
| `index.ts` | Public API: `audio.play/setAmbient/preview/stopPreview/unlock/sync/setAmbientVolume/setSfxVolume/setMasterVolume/setMuted`, `useSfx`, `initAudio`, `AMBIENTS`, `SfxName`, `PlayOptions`, `SFX_NAMES` |
| `engine.ts` | One lazy `AudioContext`, gesture unlock (iOS silent-buffer trick, persistent listener revives "interrupted" contexts), settings sync with `setTargetAtTime` ramps, SFX voice pool, ambience crossfades plus a lookahead scheduler, simmer, power management |
| `graph.ts` | Mixing graph shared by the live engine and offline renders: `sfx`/`amb` (+ wet sends) → master → 22 Hz DC guard → gentle compressor (−12 dB, 3:1, soft knee) → makeup-compensation trim (−2.88 dB, measured) → soft-clip waveshaper (linear to ±0.8). Also has a synthesized wooden-room convolution reverb (1.6 s) and a `Fader` (click-free, interruptible fades that model their own automation, with no `cancelAndHold`) |
| `instruments.ts` | Modal synthesis (kalimba 1:6.27:17.55, marimba 1:3.99:9.9, soft bell with a beating twin, tin plate), additive felt piano, filtered-noise bursts and breaths, warm pad, FM Rhodes, room IR. Every envelope starts with a ≥1 ms ramp and ends with an explicit ramp to 0. Partials above 9 kHz are dropped and those above 4 kHz are tapered |
| `sfx.ts` | 18 recipes, level trims, loudness targets, voice rules, paired haptics |
| `ambience/*` | `nature.ts` (rain, fire, forest, brown), `lofi.ts` + `harmony.ts` (pure, tested), `simmer.ts`, `common.ts` (voice base class, `Drift` random-walk automation, Poisson `EventClock`, JS-synthesized grain banks: droplets, drips, crackles, pops, vinyl, bubbles) |
| `session.ts` | Session soundscape, driven by the timer store |
| `dsp.ts` | Pure helpers: key/scale, gain curves, fades, seeded RNG, noise and seamless loops, `VoicePool` |
| `analysis.ts` | Pure measurement: K-weighted LUFS (M/S/I), phone-speaker proxy, LRA, click score, spectral balance, STFT, WAV |
| `offline.ts` | OfflineAudioContext renders and the audit, loaded only by `scripts/audio-check.mjs` (not in the app bundle) |

### Tonal palette
Key: **F major pentatonic** (F G A C D), root F4. Every tonal SFX draws from it. `pitch` (in semitones) snaps up into the scale, and `step` walks the scale directly, which is the better choice for count-ups. The lo-fi bed uses F-major jazz voicings (Fmaj9, Dm9, Gm9, C13, C9sus, B♭maj9, Am7) plus a rare borrowed E♭maj9.

Timbre vocabulary:
- **Taps and UI:** a soft wooden "tok"
- **Movement:** marimba
- **Sparkle and count-ups:** kalimba
- **Chimes:** soft bell
- **Floors:** felt piano
- **Whooshes and steam:** breathy pink noise

## Session behaviour (session.ts)
- **Focus running:** `settings.ambient` fades in over 3 s. During focus, the session's ambience wins over ad-hoc `setAmbient` calls, so a screen unmounting mid-session doesn't kill it. Picker changes crossfade over 1.5 s.
- **Paused:** the ambience dips to 0.35 (about −9 dB) over 0.9 s and returns over 1.4 s.
- **Leaving focus** (complete or stop): the ambience fades out over 2.4 s with a quadratic ease-out. During tea breaks this controller stays out of the way, so the focus screen's own `setAmbient` decides.
- **Last 40 s:** the kettle simmer runs on the SFX bus: rumble, bubbles that get busier, and a faint steam hiss. Heat ramps 0→1 in audio time. On pause, the kettle comes off the heat.
- **Keyboard parity:** `timer:pause`, `timer:resume` and `timer:addTime` also play their sounds. The voice pool dedupes them when a button already played the same sound.
- **Multi-tab:** only the timer's leader tab (the visible one claims leadership) plays ambience or the simmer. The gate is in the engine, so it covers screens' `setAmbient` calls too.
- **Preview** (`audio.preview(kind)`): auditions a bed for about 7 s, then returns to the session target or to quiet.

## Power and robustness
- The context is created on the first gesture, never before activation, so there are no autoplay warnings.
- It suspends when silent and the page is hidden, or after 60 s of silence while visible, and resumes on demand. UI sounds go stale after 250 ms of resume delay and big moments after 2.5 s. The "busy" window includes the 2 s reverb tail, so suspending never cuts a tail.
- The ambience scheduler looks 2.5 s ahead when visible and 6 s when hidden, to ride out main-thread stalls from the 3D scene and throttled hidden tabs. Events scheduled on outgoing voices are silenced by their fader.
- Noise beds are 7.3–11.3 s stereo loops with decorrelated channels and crossfaded seams (unit-tested). Layers run at different playback rates and random offsets, and slow random walks modulate filters and gains, so no audible loop remains.
- No per-note fan-out from long-lived modulators, so nothing leaks: tape wow is a modulated delay on the lo-fi band.
- **Voice limiting:**
  - per-sound max voices and minimum gap
  - a global cap of 14 voices
  - taps yield to meaningful sounds, and a meaningful sound replaces a tap from the same gesture
  - density ducking: repeats within 400 ms step down about 1.4 dB each, to a floor of −7 dB

## Levels (unity volume; `node scripts/audio-check.mjs`)
- **SFX** are normalized on max momentary loudness (LUFS-M).
- **Beds** are normalized on integrated loudness (LUFS-I).
- **Phone** is LUFS-I above 250 Hz, a small-speaker proxy.
- **Chain gain** (−20 dBFS sine through the master) is **0.00 dB**.

| Sound | Target | Measured | Phone | Peak dBFS | Notes |
|---|---|---|---|---|---|
| tap | −30 | −30.0 | −30.2 | −10.7 | 90 ms; quietest |
| toggle / pop / leaf | −28 | −28.0 | −28.1 to −28.4 | about −11 to −14 | |
| whoosh | −29 | −29.0 | −29.2 | −13.8 | |
| streakTick | −27 | −27.0 (−28.3 at step 10) | −29.5 | −17.8 | even across two octaves |
| pause / resume / addTime | −25 | −25.0 | about −27.6 | about −14 | |
| cancel / error | −26 | −26.0 | −30.7 / −27.7 | | soft, not negative |
| start | −20 | −20.0 | −22.7 | −11.4 | click, then fwoomp, then a warm rise |
| breakOver | −21 | −21.0 | −24.9 | −13.5 | |
| quest | −19 | −19.0 | −21.3 | −11.7 | |
| streak / badge | −18 | −18.0 | about −21 | about −10 | |
| levelUp | −15 | −15.0 | −18.3 | −7.3 | loudest |
| complete | −15 | −14.9 | −19.3 | −6.9 | the whistle builds to about −23 dB RMS, then the chime blooms to about −17 dB RMS |

| Bed | Target | I | Phone | LRA (60 s) | Peak |
|---|---|---|---|---|---|
| rain | −16 | −16.0 | −16.4 | 1.7 | −5.5 |
| fire | −16 | −16.0 | −19.2 | 2.1 | −3.9 |
| forest | −17 | −16.9 | −17.7 | 4.2 | −4.2 |
| brown | −17 | −17.0 | −22.5 | 0.5 | −5.8 |
| lofi | −16 | −16.1 | −20.1 | 3.2 | −3.6 |
| simmer | −30 | −30.0 | −34.6 | (ramp) | −11.6 |

- **Brown noise** is intentionally low on phones; that is its character.
- **Default-settings mix** (master 0.8, sfx 0.7, amb 0.5): `complete` sits about 9 dB above the ambience bus.

**Stress stacks:**
- **Tap storm** (40 taps in 1 s): −20.4 LUFS integrated over the burst, down from −17.9 before density ducking (single tap −30)
- **Count-up** (24 ticks): −17.9
- **Full celebration** (complete, streak, quest, badge, levelUp within 2 s): peak −7.0 dBFS
- **All stacks:** no clipping, and the limiter never engages hard

Every SFX shows:
- Click score ≤ 11. A hard cut scores > 100.
- Start and end samples at 0.
- DC 0.
- Less than 0.2% of energy above 8 kHz.
- A dry tail within the declared end, tracked automatically.

## Iterations
1. **First pass.** Built all recipes and beds and wired the check. Findings: the compressor's automatic makeup gain added +2.9 dB, which is now compensated. Celebrations and beds were bottom-heavy: fire's centroid was 137 Hz and lo-fi's 119 Hz. Rain droplets and forest birds were inaudible. The start clicks were broadband.
2. **Rebalance.**
   - Lighter felt-piano and pad floors; chimes and bells up.
   - Error moved up an octave.
   - Rain body −8 dB; droplets and drips ×2.5.
   - Birds ×3.
   - Fire roar down and flame mids up.
   - Lo-fi bass and kick down.
   - Softer switch clicks.
   - Voice end-times tracked automatically.
   - Calibration loop added; levels within ±0.3 dB.
3. **Live and shape fixes.**
   - Live metering showed the whistle about 8 dB *above* the chime. Rebalanced so the chime blooms 6 dB over the whistle.
   - Softened the twin-whistle warble, which had been a 7 dB tremolo at 4 Hz.
   - Added air flutter to the whistle.
   - Density ducking now counts starts within 400 ms, not live voices (tap storm −17.9 → −20.4 LUFS).
4. **Small speakers.** Added the phone proxy.
   - Fire, lo-fi and simmer were losing 6–9 dB on phones. Moved energy into the mids: flame band 380–760 Hz, lo-fi voicings lean upward, brighter FM index, bass mostly carried by its 2nd harmonic.
   - Forest gust range narrowed from 7.0 to 4.2 LU.
   - Fades to silence now use a quadratic ease-out; the cosine tail sounded abrupt in the ambience-plus-complete render.
5. **Multi-tab and coexistence.** Ambience is gated on the timer leader. The session ambience wins during focus. Live assertions were added (`--live`).

## Verification
- `node scripts/audio-check.mjs` renders every SFX, 12 s of each bed (`--seconds 60` for long runs), and 4 stress scenarios in a real browser via OfflineAudioContext. It writes WAVs, spectrogram PNGs (log-frequency, with 4k and 8k lines in red) and `report.json` to `.shots/audio/`. It exits 1 on clipping, a peak above −1 dBFS, DC, start or end steps, or clicks. `--env` prints RMS envelopes.
- `node scripts/audio-check.mjs --live` drives the real app. It asserts fade-in, the pause dip (about −8 dB), resume, crossfade, that navigation keeps the ambience, the simmer, mute and unmute, that only one of two tabs plays, fade-out at session end, preview, and no console errors. All 12 pass.
- `npx vitest run src/audio`: 43 unit tests covering DSP helpers, loop seams, the voice pool, LUFS against the BS.1770 reference sine, click detection, harmony, the SFX catalogue, the session target and haptics.
- Tools: ffmpeg, numpy and PIL are not available, so the spectrograms are computed and drawn in the browser (`offline.ts`).

## Haptics (`src/lib/haptics.ts`)
Kinds and patterns:
- `light` 8
- `soft` 6
- `medium` 14
- `tick` 5 (throttled to 90 ms)
- `start` [10,70,18]
- `success` [14,70,26]
- `celebrate` [16,60,16,60,34]
- `warning` [18,50,18]
- `error` [24,60,24]

Haptics are skipped when disabled, when unsupported, before user activation (this avoids the Chrome intervention warning) and while hidden. Lower-priority buzzes never cut off a higher-priority pattern that is still playing. `audio.play` fires the paired haptic from `SFX[name].haptic`; pass `{ haptic: false }` to opt out:
- start → `start`
- complete, streak, badge → `success`
- levelUp → `celebrate`
- quest, breakOver → `medium`
- streakTick → `tick`
- cancel → `soft`
- error → `error`
- pause and resume → `light`

## Open issues / requests
- **Timer:** please export a stable `isTimerLeader()`. Audio currently reads `timerDiagnostics().leader`.
- **Core-loop** (done steps): count-ups should pass `{ step: i }` rather than `{ pitch: i }`. Semitone pitches snap into the pentatonic scale, so `pitch: 0..6` repeats notes (0,2,2,4,4,7,7). `step` climbs one scale note per tick.
- **Core-loop / design-system:** pausing via the button already plays `pause`; the event-driven sound is deduped (150 ms). There is no need to remove either.
- **Settings:** consider raising the default `ambientVolume` from 0.5 to 0.6. With the square-law curve, 0.5 is −12 dB, which is gentle on phone speakers.
- **Known gaps:**
  - iOS's silent switch still mutes WebAudio. We don't force `navigator.audioSession.type = 'playback'`.
  - No listening test has happened; every judgement is from measurements and spectrograms.
