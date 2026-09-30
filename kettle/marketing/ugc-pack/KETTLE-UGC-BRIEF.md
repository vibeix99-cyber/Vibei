# Kettle: UGC brief (for creator-led ads)

**What this pack is:** the facts, screenshots and art a separate chat needs to plan creator-led ads for Kettle. Everything under "working today" was checked against the build below.

- **Hypothesis** marks a guess that no user research has tested yet.
- **Unconfirmed** marks a decision the owner hasn't made yet.

**Captured build:**
- **Kettle 0.1.0**, as shown in the app's Settings → Version.
- Production build from repository commit `334cb47` (app source last changed in `210e750`).
- Built 2026-09-30 22:16 UTC; main bundle `index-CcNIWrBl.js`.
- The screenshots use a demo profile ("Mika") with fictional data.

## 1. What Kettle does
Kettle is a **cozy focus timer** built around one ritual: **you put the kettle on, focus while it heats, and when it whistles, it's tea time (your break).** Chai the capybara keeps you company.

The real loop, as it works today:
1. **Home**
   - Optionally type what you're working on ("What are you brewing?", e.g. *Chapter 3 notes*).
   - Pick a tag: Work, Study, Read, Create or Life.
   - Pick a rhythm: Classic 25 min, Deep 50, Gentle 15, or Custom.
   - Tap **Put the kettle on · 25 min**.
   - The screen also shows today's minutes against a daily goal ("12 of 30").
2. **Focus**
   - A small, warmly lit 3D room (the *nook*) with a kettle on a stove whose steam builds as time passes; Chai naps nearby.
   - Big countdown ring and a calm status line ("Deep in it. Nice.").
   - Ambient sound, rain by default.
   - Controls: +5 min, Pause, End. Ending early is allowed, and those minutes still count.
3. **Whistle**
   - At 0:00 the kettle whistles (a soft whistle, then a chime).
   - The ring turns green, "Tea's ready" appears and Chai cheers.
4. **Completion**
   - "The kettle's whistling!"
   - Mark the task Done or Carry forward.
   - Shows focus minutes, leaves earned (with the breakdown) and today's goal.
   - Today's build follows this with a few short cards: streak, recipes (daily goals), level-ups and new room items, badges.
5. **Tea break**
   - "Tea time. Stretch, sip, look out the window."
   - A 5-minute "left to sip" countdown and gentle break ideas ("Sip some water").
   - Then **Start next brew** or Skip break. Every 4th brew earns a long tea break.

## 2. Chai and the kettle ritual
- **Chai:** a small, round, unbothered capybara with a yuzu balanced on its head. Calm, gentle, quietly funny, a bit sleepy, endlessly supportive. **Chai never guilt-trips.** When you stop early, it says "that's okay, your minutes still count". It celebrates small wins sincerely.
- **Voice:** warm, short, plain, a little playful, second person, no shame or pressure, at most one exclamation mark per screen. Examples:
  - "Put the kettle on"
  - "Kettle's warming up…"
  - "The kettle's whistling!"
  - "Tea time. Stretch, sip, look out the window."
- **The ritual is the product's distinct idea.** Starting is "putting the kettle on", progress is the kettle heating, finishing is the whistle, and the break is tea.
- **Art note:** `brand/chai-approved-reference/` is the **approved new art direction** for Chai. The app's screens still show the current vector Chai (see `screenshots/`). Use the reference for character illustration, but don't present it as an in-app screen until it ships.

## 3. Working today (in this build)
- **Timer and flow:**
  - four rhythms: Classic 25/5 with a long 15-minute break every 4 brews, Deep 50/10, Gentle 15/3, Custom;
  - pause, +5 min, end early;
  - the whistle, the completion screen and the tea break.
- **Intentions:** optional "what are you brewing?" plus a tag, and Done / Carry forward.
- **Atmosphere:**
  - the 3D nook, which fills with items as you level up, with a still fallback;
  - ambient Rain, Fireplace, Forest, Brown noise, Lo-fi keys, or none;
  - the app's own sound effects;
  - light and dark themes;
  - reduced-motion support;
  - haptics on devices that support vibration.
- **Progress (all optional flavour, never required):**
  - leaves (1 per focused minute plus bonuses);
  - cozy levels;
  - a warm streak, with a Tea Cozy that protects one missed day;
  - a daily goal, three daily "recipes", badges and stats.
- **Privacy:** no account and no tracking. Data stays on the device, with export/import backup (as stated in Settings).
- **Web app:** runs in a modern browser on phone and desktop, and can be installed to the home screen. Offline use, notifications ("Nudges") and install are built but **not yet verified on real phones**.

## 4. Likely audiences and frustrations (all **hypotheses**, untested)
| Audience (hypothesis) | Frustration (hypothesis) | What Kettle offers |
|---|---|---|
| Students of about 18–25 who study in the evening and like cozy things (cozy games, lo-fi study streams, capybaras) | Can't get started; plain timers feel cold | A tiny, pleasant ritual to begin, and company while working |
| Remote workers and freelancers at a desk all day | Forget to take breaks; productivity apps feel harsh | The break is built in and framed as a treat (tea), not a penalty |
| People put off by guilt-trip streak apps | Pressure and shame when they miss a day | A mascot that never scolds, and a Tea Cozy that forgives a missed day |

Don't target or describe audiences by health or medical conditions (see section 7).

## 5. Availability, platforms, price, ending action
| Item | Status |
|---|---|
| Availability | **Not publicly available.** A private preview link only. **Unconfirmed:** launch date and public address. |
| Platforms | A web app (browser, phone and desktop), installable to the home screen. **Not** on the App Store or Google Play. **Unconfirmed:** real-device checks of install, offline use and notifications. |
| Price | **Unconfirmed; not set.** Do not say "free", "paid" or give any price. |
| Ending action | **Unconfirmed.** With no public link, end on the brand line and a neutral action such as "Follow for launch" (used in earlier Kettle ads). No URL, store badge, handle or QR code until the owner provides a real one. |

## 6. Three promising ad angles
1. **"I put the kettle on to start"** (getting started)
   - Creator stuck at a desk, then puts the kettle on (in the app, and optionally a real kettle), then focuses with Chai, then the whistle, then tea.
   - Hook ideas: "The only way I can start studying" / "My focus timer is a kettle."
   - Show: `01-home`, `02-focus`, `03a-whistle`.
2. **"A timer that makes me take the break"** (breaks as the reward)
   - Lead with the whistle and the tea break; the payoff is the tea.
   - Hook: "My timer literally tells me to go make tea."
   - Show: `03a-whistle`, `03-completion`, `04-tea-break`.
3. **"A study buddy that never guilt-trips"** (a gentle mascot)
   - Chai naps, cheers and forgives; the warm streak and Tea Cozy; the nook fills up over time.
   - Hook: "My study buddy is a sleepy capybara."
   - Show: `02-focus`, `03-completion`, `05-nook`.
   - Don't name or mimic other brands' mascots.

## 7. Claims to avoid
- **No invented people or experiences:**
  - no fake testimonials, reviews, star ratings, download counts or user numbers;
  - no "I've used it for months" unless a real creator has;
  - an AI-generated creator or voice must be labelled as AI where the platform requires it, and never presented as a real user.
- **No medical or mental-health benefits:**
  - nothing about ADHD, anxiety, depression, burnout, stress relief, sleep or "dopamine";
  - don't target those conditions.
- **No unsupported productivity results:**
  - no "2× more productive", "better grades", "finish in half the time", "science-backed" or "proven";
  - Kettle shows your own minutes, not outcomes.
- **No unconfirmed availability or price:** no "free", no price, no "download on the App Store/Google Play", no launch date, and no guarantee of offline use or notifications.
- **No features that don't exist:**
  - no AI, no chat with Chai (Chai is a mascot), no accounts, sync or social features;
  - no presenting the proposed redesign (`proposed-redesign-NOT-IN-APP/`) or the new Chai art as current app screens.
- **No hidden time manipulation:** a sped-up or skipped timer must be disclosed, e.g. "25 minutes later…" or "sped up". Never imply 25 minutes passed in seconds.

Asset list and file locations: `ASSET-INDEX.md`.
