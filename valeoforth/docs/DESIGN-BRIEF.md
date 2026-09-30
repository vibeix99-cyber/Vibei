# Valeoforth — design brief, directions, plan

## Brief
Valeoforth is the home for the projects I build. Visiting it should feel like entering a collection of distinct
rooms. Launch scope: an inviting **entrance** and **one fully realised room, Kettle** (a cozy focus timer with a
capybara mascot, Chai, and a 3D "nook"). More rooms will come later; the system must make them easy to add, and
the site must not invent projects, people, awards or contact details.

**Visitor jobs** (in order): understand what Kettle is in ten seconds → *see* the app (real screenshots, not mock-ups)
→ learn what was actually built and why → move around without thinking (keyboard, phone, no animation) → leave and
come back to the hall.

**Constraints that shaped the work**
- Kettle's source isn't in this repo; only its built, *private* artifact exists. So imagery is captured from the real app
  (`tools/capture-kettle.mjs`) and the site never links to the private artifact.
- Phones first: light JS, images sized per viewport, no scroll-jacking, no WebGL on the site itself.
- Motion is decoration for meaning (a door opening, a room fading in), never required to navigate.

## Three directions considered

### A — "The Hallway" (literal illustrated house)
A long illustrated corridor with a row of doors; each project is a door. Layered 2D parallax.
+ Instantly legible metaphor. − Reads as a game menu; empty doors look like empty project cards (explicitly
unwanted); illustration quality would have to carry everything; hard to make elegant at 320 px.

### B — "The Lamplit Threshold" (one glowing door → a room that changes the light)
A quiet dusk hall with a single lit arched doorway. Through the doorway you glimpse the *real* Kettle nook. Stepping in
morphs that arch into the room, and the page's whole palette shifts from night hall to warm paper — the metaphor is
carried by **light, colour and type change between pages**, not by literal furniture. Rooms are themable data.
+ Distinctive, restrained, phone-friendly (one big shape), extends cleanly (each room = its own light).
+ Uses the strongest existing asset (the 3D nook) as the reveal. − Needs care to stay tasteful (avoid twee).

### C — "The Floor Plan" (architectural index)
A monochrome blueprint of a house; rooms are labelled rectangles; hover reveals contents. Mono type, hairlines.
+ Scales to many rooms; typographically crisp. − Cold; contradicts Kettle's warmth; a plan with one lit room
and empty rectangles is exactly the "empty project cards" problem; poor on phones.

## Decision: B, with one borrowed idea from C
Judged against: *inviting entrance* (B > A > C), *carries Kettle's warmth* (B > A > C), *extends without empty
cards* (B ≈ C > A), *phone clarity* (B > C > A), *distinctiveness without kitsch* (B ≈ C > A).
B wins. From C I keep a small "Room 01" plaque convention and a room index in the navigation (a text list, not cards).

## System
**Concept.** The hall is night; every room has its own light. Entrance = dusk aubergine + lamp amber. Kettle room =
warm paper + persimmon with a plum "night" band for the nook. A new room brings its own palette tokens and
sections but reuses the frame (header, room index, in-room section rail, exit).

**Type.** Fraunces (variable serif, soft/wonky axes used sparingly) for voice — the wordmark, room titles, pull-lines.
Figtree (variable sans) for UI and body. Deliberately *not* Kettle's Fredoka/Nunito so the site frames the app
instead of imitating it.

**Motion (CSS + ~4 KB of vanilla JS, no animation library).** Door hover/focus opens and warms the light;
cross-document View Transitions morph the arch into the room hero (feature-detected); IntersectionObserver reveals;
Chai idles. Everything is gated by `prefers-reduced-motion` and works with JS disabled.

**Navigation.** Header: wordmark → hall · "Rooms" disclosure (real `<details>`-style menu, keyboard + no-JS) ·
inside a room a sticky "In this room" rail (chips on phones, side rail on wide). Footer of every room: leave-the-room
+ "more rooms coming" line. Skip link. All links are plain `<a>`.

**Room data model** (`src/rooms/*.mjs`): `slug, number, name, tagline, summary, status, theme tokens, cover art,
sections[]`. `build.mjs` turns the registry into: the entrance's doors, the Rooms menu, each room page, sitemap, and
prev/next. Adding a room = one data file + images.

## Content rules
- Only claims verified in the built app (see CHECKPOINT.md "Verified facts").
- Screenshots labelled where they show sample data (streaks/stats are Kettle's own maths over seeded dates).
- No live demo link (artifact is private). No email/socials until supplied.

## Plan / checkpoints
1. Discovery + brief (this file) — commit.
2. Capture pipeline → raw screenshots + Chai SVGs → responsive WebP set.
3. Build system (Node static generator, sharp for images), shared CSS/JS, entrance.
4. Kettle room sections.
5. Gauntlet: render at 320/390/820/1440 + short landscape, keyboard, reduced motion, contrast, links; critic rounds ≤ 3.
6. Fix, verify (`npm run check`, `npm run build`), preview, commit + push.
