# Kettle — a cozy focus timer

> **Put the kettle on. Get cozy. Get it done.**

This is the creative + product brief. Every contributor (human or agent) builds
against it. When something here conflicts with your instinct, follow the brief
and flag the conflict in your report so it can be updated deliberately.

Quality bar: **the latest Duolingo app.** Every screen should feel as clear,
charming, tactile and finished as Duolingo — but Kettle has its *own* identity.
Never copy Duolingo assets, characters, copy, or its exact green/owl/flame
language. Match the *craft*, not the look.

---

## 1. The idea

A focus timer built around one warm metaphor: **you focus while the kettle
heats; when it whistles, it's tea time (your break).**

- Starting a focus session = *putting the kettle on*.
- Progress through a session = the kettle slowly heating (steam builds).
- Session complete = the kettle *whistles* (soft, happy, never shrill).
- Break = tea time. Sip, stretch, look out the window.
- Showing up every day = keeping your **warm streak** (a steaming mug).

## 2. Mascot — **Chai** the capybara

Chai is a small, round, unbothered capybara who keeps you company.

- **Personality:** calm, gentle, quietly funny, a bit sleepy, endlessly
  supportive. Chai *never* guilt-trips (explicitly the opposite of the
  passive-aggressive owl meme). Chai celebrates small wins sincerely.
- **Look:** a soft loaf shape. Warm chai-brown fur, lighter cream muzzle, big
  dark oval nose, small high-set dot eyes, tiny round ears, rosy blush.
  Signature accessory: a little **yuzu** (small citrus with a leaf) balanced on
  its head. Stubby paws.
- **Art (round 6):** the approved **painted** sheet (`art-src/chai/`). Its soft
  shading is the character, so it ships as raster poses, not vector: reading
  (Focus), sipping (tea break), cheering (whistle and summary), concerned (gentle
  support only), happy, stretch, look, sleep, plus a round face avatar for sizes
  under 44 px. One Chai on screen at a time.
- **Poses (must all exist):** `idle` (sitting loaf), `wave`, `focus` (eyes
  closed, content, holding a mug or book), `sleep` (curled, zZ), `sip` (break,
  holding a mug with steam), `cheer` (jump, paws up), `proud` (chest out,
  sparkle eyes), `concerned` (gentle worried brows — used on quit dialog),
  `think` (paw on chin — onboarding questions), `peek` (for empty states).
- **Alive:** idle breathing, occasional blink, ear twitch, yuzu wobble.
  Reactions are springy and soft. Reduced-motion users see calm, static poses.

## 3. Voice & tone

Warm, short, plain-spoken, a little playful. Second person. Sentence case.
No exclamation-mark spam (max one per screen). No shame, no pressure.

| Moment | Example copy |
|---|---|
| Start button | "Put the kettle on" |
| Focus in progress | "Kettle's warming up…" / "Deep in it. Nice." |
| Session done | "The kettle's whistling!" |
| Break | "Tea time. Stretch, sip, look out the window." |
| Quit confirm | "Leave the kettle early? That's okay — your minutes still count." |
| Streak | "5 days warm" / "You kept the kettle warm 5 days in a row" |
| Empty stats | "Nothing brewed yet. Your first cup is one tap away." |
| Streak freeze | "Tea Cozy" — "Keeps your streak warm for one missed day." |

## 4. Core systems & vocabulary

| Concept | Kettle name | Notes |
|---|---|---|
| Focus session | **Brew** / focus session | default 25 min |
| Short / long break | **Tea break** / **Long tea break** | 5 / 15 min; long every 4 brews |
| XP / currency | **Leaves** 🍃 (tea leaves) | 1 leaf per focused minute + bonuses |
| Level | **Cozy level** | level-ups unlock room items |
| Streak | **Warm streak** (steaming mug icon) | days with ≥1 completed focus session |
| Streak freeze | **Tea Cozy** (knitted cover) | earned at milestones; auto-used on a missed day |
| Daily goal | "A sip" 15 · "A cup" 30 · "A pot" 60 · "A whole kettle" 120 min | chosen in onboarding |
| Daily quests | **Today's recipes** | 3 per day, reward leaves; tin-opening moment |
| Achievements | **Badges** (tiered I–V) | e.g. First Brew, Morning Dew, Moonlit Sipper, Marathon, Deep Steep |
| Collection | **Your nook** (3D room) | the cozy room fills with items as you level up |
| Intentions | "What are you brewing?" | free text + tag (Work, Study, Read, Create, Life) |

## 5. Visual language

**Shape:** everything rounded and chunky. Radius scale 10 / 16 / 22 / 28 / 999.
Tactile "pressable" controls: a solid face with a thicker darker bottom edge
(4px) that compresses on press (translateY + edge shrinks). Cards have a 2px
warm border and a 4px bottom edge in a slightly darker tone.

**Color:** warm, cozy, saturated but never neon. Espresso ink instead of black.
Cream paper instead of white. Night theme is deep plum lit by warm lamplight —
not grey. (Exact tokens live in `src/styles/tokens.css`; all text must meet
WCAG AA — 4.5:1 body, 3:1 for ≥18.66px bold.)

- Paper `#FFF9F0` · Oat `#F3E6D3` · Espresso ink `#3B2A20`
- Persimmon (primary / kettle) · Matcha (success / done) · Honey (leaves / rewards)
- Sky (breaks / calm) · Berry (warmth / love / gentle alerts) · Plum (night)

**Typography:** `Fredoka` (display — chunky, rounded, friendly) + `Nunito`
(UI/body). Timer digits in Fredoka with fixed-width digit cells so numbers
never jitter. Big, confident type hierarchy; generous line-height; no ALL CAPS
except tiny overline labels.

**Illustration:** flat geometric vector, built from circles and rounded
rectangles, with a single soft highlight shape and a single shade shape per
form (no gradients-as-crutch, no outlines on characters). Consistent light
from the top-left. Icons are chunky duotone fills, not thin strokes.

**Motion:** "cozy bounce" — springy but softer than Duolingo (lower stiffness,
more damping). Everything that appears, *arrives* (scale 0.9→1 + fade, or a
short slide). Numbers count up. Progress fills with a moving sheen.
Celebrations: leaf confetti, steam puffs, Chai reactions. Respect
`prefers-reduced-motion` everywhere (fade-only alternatives).

**3D (Three.js):** only where it meaningfully adds atmosphere — the **nook**:
a small, warmly lit cozy room at dusk/night with a window (rain/snow/clear
matches the ambient sound), a kettle on a little stove whose steam builds as
the focus session progresses, lamp glow, plants, books. The room gains items as
you level up. Shown on the Focus/Break screens and the Nook screen. Must be
calm (never distracting), lazy-loaded, capped DPR, paused when hidden, with a
graceful static fallback (no WebGL / reduced motion / low-power).

## 6. Sound

Everything synthesized with WebAudio (no sample files needed). Warm, woody,
soft attack, short tails: kalimba / marimba / soft bell timbres.
- UI: tap pop, toggle, start ("kettle click + warm rise"), pause, resume,
  complete (soft kettle whistle blooming into a chime), level up, badge, quest
  tin open, streak tick (during count-up), gentle cancel.
- Ambience (mixable): rain on window, crackling fire, wind in trees, brown noise,
  gentle lo-fi keys. Seamless, non-fatiguing, no obvious loops.
- Master / SFX / ambience volumes; mute; everything respects settings.
- Haptics (vibrate) on supported devices for key moments.

## 7. Screens

1. **Welcome / first visit** — Chai says hi and offers one real 15-minute brew,
   with an optional task: one tap to a running timer. Setup is optional: "Set
   things up first" (name → daily goal → rhythm → sound → notifications →
   ready), or "Make Kettle yours" on the first summary. Progress bar on top,
   speech bubbles, one question per screen.
2. **Home ("Today")** — greeting by time of day, warm streak, leaves, today's
   minutes in words ("12 min brewed · 18 min to go") over the goal bar, today's
   recipes, an optional task + tag chips, a brew-length selector (minutes first),
   huge primary CTA. Chai reacting to your day in words that match the goal and
   the selected length.
3. **Focus** — full-screen, calm. **The kettle is the timer:** an orange kettle
   on a counter shared with reading Chai, under the nook's own (quieted) window.
   Its gauge shows progress at a glance; the countdown is the exact reference,
   with how long you've brewed and when it whistles. Pause (flame out), +5 min
   (a honey segment on the gauge), end early (confirm sheet), ambience picker.
   Keyboard: Space = pause/resume, Esc = end, + = 5 min, M = mute.
4. **Whistle + summary** — the kettle whistles and Chai cheers on the same stage,
   then one summary takes the panel: minutes brewed and **Tea time** first;
   Done / Carry forward for the task (only when there was one); routine rewards
   as compact pills; a major room unlock with a picture; the leaf arithmetic on
   request. No blank hand-off; with reduced motion, a stable scene and a simple
   fade.
5. **Break** — sky-toned, on the same stage. Chai sipping tea, the kettle off the
   heat. Countdown, pause, skip break / next brew, rotating gentle break ideas
   when there's room.
6. **Stats** — week bars vs goal, month calendar with warm-streak runs, totals,
   best streak, time-of-day pattern, tag breakdown, session history (editable),
   badges grid.
7. **Nook** — the 3D room; items unlocked/locked with level requirements;
   tap an item to see its name + story.
8. **Settings** — rhythm (durations), auto-start, sounds & ambience, notifications,
   keep screen awake, haptics, theme, motion, 3D quality, daily goal, export /
   import / reset data, keyboard shortcuts, about.

## 8. Non-negotiables

- **Timer reliability:** drift-free (wall-clock anchored), correct in background
  tabs, survives reload/close (resumes or completes correctly), no double
  counting across tabs, notification + sound on completion, tab title + favicon
  show remaining time, screen wake lock during focus (setting).
- **Accessibility:** WCAG 2.2 AA. Full keyboard use, visible focus rings,
  screen-reader friendly timer (periodic polite announcements, not every
  second), dialogs trap focus, reduced motion honored, 44px touch targets,
  works at 200% zoom.
- **Responsive:** 320px phones → large desktops. Mobile: bottom tab bar.
  Desktop: left sidebar + content + right rail (like a good web app, not a
  stretched phone). Landscape phone focus layout. Safe-area insets.
- **Offline / installable PWA.** Data stays on device (localStorage) with
  export/import.
- **Performance:** first paint fast; Three.js lazy-loaded; 60fps UI.
