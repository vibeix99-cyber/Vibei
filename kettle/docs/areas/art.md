# Art & illustration — log

Owner: art area · files: `src/art/**`, `public/icons/**`, `public/favicon.svg`, `scripts/render-icons.mjs`
Gallery: `#/kit?part=art` (`&view=chai|small|icons|objects|badges|spots|nook|appicon|pose&size=&pose=&animate=0`)

## System
- **Construction:** flat geometric forms, one shade + one highlight per form. The shade is a
  crisp bottom-right crescent: the form is filled with its shade colour, then the same path
  nudged up-left in the base colour, clipped to itself (`Shaded` in `kit.tsx`). Light always comes
  from the top-left. There are no outlines on characters.
- **Palette:** `palette.ts` (`PAL`, `TIER`, `LOCKED`). Characters and objects use hardcoded colours
  so they stay on-model in both themes. Anything that sits on the page (shadow, steam,
  glow, soft backdrops, zZ, thought bubbles) uses `--art-*` vars defined in `art.module.css`,
  with night-mode overrides. Spot backdrops use design tokens (`--honey-soft` etc.).
- **Motion:** CSS keyframes in `art.module.css`, active only under `.live`. `.live` is set when
  `animate && !useReducedMotion()`, and there is also a `prefers-reduced-motion` kill switch.
  Transform origins use view-box user units (or fill-box).
- **Ids:** `useArtId()` (`useId`, sanitised), so many instances can share a page.

## Exports (`src/art/index.ts`)
Mascot/ChaiArt · Icon (+`ICON_NAMES`, `tone`) · StreakMug · Leaf · TeaCozy · TeaTin ·
LevelBadge · Logo/KettleMark · QuestIcon · Badge (+`BADGE_ART_IDS`) · GoalVessel · RhythmSpot ·
NotifySpot · BreakSpot · EmptySpot · NookFallback · PAL/TIER.

## Pass 1 iterations (Chai v1, since replaced)
1. **Chai v1:** a round loaf with a round muzzle and round ears. It read as a **teddy bear**.
2. Capybara pass: flat-topped blocky head, broad tall snout with the nose at its *top* and a
   long upper lip, smaller ears. The arms read as sticks, so they became stubby capsule arms with a sheen.
3. Poses v2: replaced long arms with round paws (sticks → paws). Fixed concerned "brick"
   paws, proud "legs", think arm and peek paws. Tried a lidded "unbothered" eye: horizontal read
   *unimpressed*, drooping read *sad*, so I kept round eyes with 2 catchlights (warm > deadpan).
4. Narrower, taller loaf; smaller ears; yuzu peel pores; softer oval nose (the pill read as a
   black bar); whisker dots; lighter shade crescent. Small-size optical mode (<72px): bigger
   eyes and nose, no mouth detail. Reads at 24–32px.
5. Dark-mode + motion pass: sip steam is now translucent white vapour over the nose (the old
   side-steam read as "fingers"). Wave got a raised mitten paw showing its pad. Stretch uses a
   Y-reach (the arch read as a hood / bunny ears). The cheer jump was kept inside the viewBox.
   Frame-captured cheer (squash, stretch, shadow), wave, idle and sleep (zZ).
6. Longer face: eyes set 5 units higher, which gives a longer snout and more capybara.
- Icons: 56 names, duotone. Fixed the colour clock's contrast and the tin reading as a sandwich.
  The nav `tone="color"` is used by the Shell for the active tab.
- Objects: the tin read as a jam jar with a stray lid bar. Now the lid pops up and off, with a glow and leaves.
  Kettle mark: the handle was hidden and the lid was a dark slab. Now it has a tall arch handle, a
  lighter lid and a yuzu knob.
- Badges: rounded-hex medal with a pressable bottom edge, a rim highlight, a cream emblem and a
  tier-ink detail. Tier I oat was darkened to toasted oat for emblem contrast.
- App icon: compared the kettle and Chai-face options. **Chai close-up** won (far more
  lovable/memorable). The favicon is also Chai's face (it reads at 16px on light and dark tabs); the
  kettle stays the logo mark.

## Pass 2 — Chai redo (orchestrator send-back: "reads as bear/hamster")
Before: `.shots/art/chai-v1/` · After: `.shots/art/chai-v2/` (`before-after-240-32.png`, `after-poses-240.png`,
`after-small.png`, `after-poses-dark.png`, `after-welcome-mobile-*.png`).
- **New construction:** a tall, flat-fronted barrel head (longer than wide) merging into a barrel body
  with no neck. The **snout block** is the whole lower face in a darker, warmer brown: no cream patch, and its top
  plane has a light edge. A **wide flat nose** sits on the snout's top edge with a split-lip ω under it; the mouth
  stays closed except in cheer and stretch. **Small eyes set high and wide**, and idle uses calm soft-dome lids. **Tiny round
  ears at the upper back corners**, coarse crown tufts, stubby darker legs.
- Iterations:
  1. The first build already read capybara, but its flat lids looked skeptical and the snout highlight made a stripe.
  2. Dome-shaped lids (serene), a domed snout edge, the body tufts dropped (they read as scratches), and a brighter fur.
  3. Sleep went from "bathtub" to a resting tilted head. Limbs got their own darker walnut, because paws vanished against the
     head shade. Think became a paw on the cheek. Concerned has paws fidgeting under the chin. At small sizes the eyes are plain dots
     (the lids read as heavy brows) and the nose is flatter (it looked like a gaping mouth).
  4. Peek is recomposed as a head close-up with ears and yuzu kept inside the box (56–150px cards).
- App icons, favicon, NookFallback and the stretch break spot all re-rendered from the new Chai.
- Also: badge tier numerals now use Nunito 900 with letter-spacing (Fredoka's "IV" read as "N"). New icons `book`
  and `briefcase`.

## How to regenerate icons
`npx vite --port 5182` then `node scripts/render-icons.mjs --export --base http://127.0.0.1:5182`
(exports SVG sources from `AppIcon.tsx`, then rasterizes). Without `--export` it only
rasterizes the committed SVGs.

## Open / known gaps
- The tea tin still leans "jar" in silhouette at a glance.
- NookFallback items are simple; the lamp light pool uses stepped translucent circles.
- Nav `nook` mono icon is busy at 16px (fine at 24–28).

## Requests
- Shared `index.html`: I added the favicon + apple-touch-icon `<link>`s (additive).
