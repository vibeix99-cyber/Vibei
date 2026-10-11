# Kettle creative audit, phase 1: desk research

**Status:** complete within the 2-hour budget (started 01:19 UTC, written 01:30 UTC).

**Scope:** read-only research. I started no browser and no dev server, edited no app code, used no paid generation,
installed nothing, and pushed nothing to the integration branch.

**What was read:** the integration branch `claude/wizardly-galileo-uy89d9` at `7f05149`. Its app code is identical to
`0d58c5e`.

**Legend:**
- **[V] verified:** read directly from code, files or measured data.
- **[I] inferred:** a judgement from captures or code reading that still needs a live check.

Every visual finding is **from captures; live check pending**.

## 0. Environment and package

- `nproc` = 4.
- **The audit started no browser.** Round 7's makers (M7a, M7b), their dev servers, three verified control servers and
  one Playwright run were already running in this container. Round 7 is running **here**, not in a separate environment.
- **Approved package:** present at `kettle/.tmp/pkg/kettle-excellence-integrated/`. It contains `PRESERVE_LIST.md`,
  `REFERENCE-GUIDE.md` and `VISUAL_BENCHMARK_LIBRARY/` (with `approved/`, `current/` and `official/` assets) [V].

## 1. Asset inventory (I06 Chai, I09 Nook groundwork)

**Source of the numbers:**
- Pixel and file sizes come from file headers [V].
- Display sizes come from code: `PaintedChai`'s `size / SHEET_REF_H` (500) and the stage `--u ≤ 1.6px` cap
  (`src/screens/focus/stage/Stage.module.css:4`).
- They are cross-checked against measured CSS sizes in `review/product-excellence/perf/BASELINE.md` ("Chai: intrinsic
  vs rendered size") [V].
- **Ratio:** device px needed ÷ source px. A ratio above 1.00 is **below display resolution**. Nothing was upscaled.

### Raster assets

| Asset | Format | Pixels | Bytes | Where shown | Largest display (CSS × DPR → device px) | Ratio | Flag |
|---|---|---|---|---|---|---|---|
| `src/art/chai/chai-reading.webp` | WebP + alpha | 311×487 | 20,900 | Focus stage, running and paused (`Stage.tsx:105`, `size` 186 units) | 290 CSS (desktop) × 2 → 580 | **1.19** | **below** [V] |
| (same) | | | | phone stage, 177 CSS × 3 → 531 | | **1.09** | below at DPR 3 [V] |
| `chai-cheering.webp` | WebP + alpha | 312×428 | 20,626 | whistle and summary stage | 255 CSS × 2 → 509 | **1.19** | **below** [V] |
| (same) | | | | phone 155 CSS × 3 → 466 | | **1.09** | below at DPR 3 [V] |
| `chai-sipping.webp` | WebP + alpha | 302×491 | 19,950 | break stage; Home hero (evening) | 292 CSS × 2 → 584 | **1.19** | **below** [V] |
| (same) | | | | phone 178 CSS × 3 → 534 | | **1.09** | below at DPR 3 [V] |
| `chai-stretch.webp` | WebP + alpha | 288×433 | 20,274 | Break's over stage; Home (morning) | stage ≈ 251 CSS × 2 → 502 | **1.16** | **below** [I: same stage scale as the measured poses] |
| `chai-happy.webp` | WebP + alpha | 303×496 | 19,212 | Welcome "ready" (`WelcomeScreen.tsx:203`, size 200/168/120); Home greeting | phone 167 CSS × 3 → 500 | 1.01 | marginal [V] |
| `chai-look.webp` | WebP + alpha | 310×431 | 16,582 | Stats empty (`StatsScreen.tsx:135`, size 148); empty states | 128 CSS × 3 → 383 | 0.89 | ok [V] |
| `chai-concerned.webp` | WebP + alpha | 298×474 | 19,190 | End sheet, History and Data sheets (size 112/96) | 106 CSS × 3 → 318 | 0.67 | ok [V] |
| `chai-sleep.webp` | WebP + alpha | 323×300 | 14,590 | late-night Home | ≤ 152 size → 91 CSS × 3 → 274 | 0.85 | ok [V] |
| `chai-happy-face.webp` | WebP + alpha | 303×312 | 11,708 | avatar below 44 px (`PaintedChai.tsx:67`) | ≤ 49 CSS × 3 → 148 | 0.47 | ok [V] |
| `art-src/chai/*.png` (9 masters) | PNG RGBA | same as above | 52–98 KB | not bundled | — | — | masters equal the delivery size, so **no higher-resolution source exists** [V] |
| `art-src/chai/chai-sheet-approved.webp` | WebP | 1254×1254 | 92,678 | not bundled (the approved art direction) | — | — | about 490 px per pose [V] |
| `src/scene/stills/window-{morning,day,dusk,night}-{clear,rain,snow}.webp` (12) | WebP + alpha | 1250×1000 | 23,950–36,792 | Focus backdrop while the 3D engine loads or when 3D is off (`scene/Fallback.tsx:28–39`, `object-fit: cover`) | desktop window ≈ 850 CSS × 2 → 1,700 wide | **1.36** | **below**, mitigated by an intentional blur (`Stage.module.css:51`) [I: width read from the 1440 capture] |
| `public/icons/icon-192.png`, `icon-512.png`, `maskable-512.png`, `apple-touch-icon.png` | PNG RGB | 192, 512, 512, 180 | 10–29 KB | PWA and home-screen icons | platform sizes | — | ok [V] |
| `public/favicon.svg`, `icons/icon.svg`, `icons/maskable.svg` | SVG | vector | 4–5 KB | favicon and icon sources | — | — | ok [V] |
| `src/screens/welcome/art/welcome-scene-{day,dusk}.svg` | SVG | vector (400 viewBox) | about 3.8 KB | Welcome circle scene | — | — | resolution-independent [V] |

### Code-drawn art (no raster; resolution-independent) [V]

- `src/art/Badge.tsx`: badges.
- `Icon.tsx`: icon set.
- `Objects.tsx` and `Spots.tsx`: Nook item illustrations and spots.
- `NookFallback.tsx`: the static SVG room.
- `AppIcon.tsx`.
- The stage kettle (vector SVG).
- `MascotVector`: a legacy vector Chai; the kit page only.

### 3D: no model or texture files at all [V]

- All geometry is procedural, in `src/scene/engine/room.ts`, `items.ts`, `kettle.ts`, `chai.ts` and `kit.ts`.
- All textures are tiny canvas textures (`textures.ts`): `soft`, `glow` and `puff` at 128²; `windowPatch` at 128×192;
  `knit` at 128²; `painting` 192 wide; `zee`, `note` and `sparkle` at 64².

### Flags (below display resolution)

1. **The three priority-1 stage poses** (reading, cheering, sipping), plus stretch:
   - about 1.19× on DPR-2 desktops and tablets;
   - about 1.09× on DPR-3 phones.
   
   The masters are the only source. `art-src/chai/README.md` already holds prompts for higher-resolution poses (not run).
2. **The window stills**, about 1.36× on DPR-2 desktops. They are only seen while 3D loads or when it is off, and they
   are blurred by design. They are pre-renders of the engine's own window camera, so they can be re-rendered larger
   from the engine itself (free; no generation).
3. **The canvas textures, under showcase close-ups.** The showcase camera frames an item to fill the view
   (`ITEM_FILL = 1`, `Engine.ts:142, 820`), magnifying 128–192 px textures (painting, knit) [I].

## 2. 3D Nook, from code

| Area | What the code does | Weakness (file:line) | Status |
|---|---|---|---|
| Renderer | `WebGLRenderer` with antialias, alpha and low-power; sRGB output; Neutral tone mapping, exposure 1.0 (`Engine.ts:252–264`) | **Pixel ratio capped at 1.5 on mobile**, 2 on desktop, 1.25 on low (`Engine.ts:449`). On DPR-3 phones the room renders at half native density, so edges and texture detail are soft. A deliberate performance trade-off | [V] code / [I] visible effect |
| Camera | `PerspectiveCamera`, FOV 30, orbit around base angles (`Engine.ts:132–134`). The Focus `window` view is a fixed camera with FOV 44 and aspect 1.25, behaving like `object-fit: cover` (`WINDOW_CAM`, `Engine.ts:140`) | No weakness found; framing matches the stills by design | [V] |
| Lighting | Hemisphere (`#7A6CB8` / `#4A3036`), lamp `SpotLight` (16, the only shadow caster), stove `PointLight`, window `DirectionalLight`, highlight `PointLight` (`Engine.ts:290–313`). Per-time-of-day moods blended by lerp (`Engine.ts:120–128, 344–347`) | **No environment map** (no PMREM or RoomEnvironment). `MeshStandardMaterial` defaults to roughness 0.82, metalness 0 (`kit.ts:75–81`). Surfaces read uniformly matte and "clay"; the kettle and mug can't carry a soft reflection. Consistent with the cozy look, but flat up close | [V] code / [I] look (captures 17 and 18, `0d58c5e`) |
| Shadows | One spot shadow; 768 px map on mobile, 1024 on desktop; `PCFShadowMap`, radius 5; only at quality `high` (`Engine.ts:263–264, 296–302`) | Coarse contact shadows at close-up framing [I]. When adaptive quality drops to `low` (slow-frame detector, `Engine.ts:890–891`), shadows disappear and materials switch to Lambert (`kit.ts:316–322`, `Engine.ts:497–513`). That is a **visible step change** mid-session; "rebuild a few programs per task" mitigates the hitch, not the look change | [V] code / **live check needed** |
| Materials and geometry | Cached `MeshStandardMaterial`s; a static-merge pass collapses each prop into a few draw calls; rounded boxes, lathes and capsules (`kit.ts:1–4, 265–310`) | Efficient. Visual detail relies on silhouette and colour, not texture | [V] |
| Textures | Procedural canvas textures only (`textures.ts:10–26`), 64–192 px; no anisotropy or mip settings | See flag 3: soft at close-up framing | [V] / [I] |
| 3D Chai | A procedural "soft toy" loaf with poses `nap` (Focus), `sip` and `awake`; built "like the 2D mascot" per the comment (`chai.ts:1–8`) | **Identity drift.** In captures it reads as a generic teddy bear (round ears, short muzzle) rather than the approved painted capybara: tall loaf, blunt muzzle, high small eyes (desktop 1440 dark `17-nook-early`, phone 390 light `18-nook-earned`, `0d58c5e`). PRESERVE 2 protects the approved Chai, so this is the largest Nook concern for I06/I09 | [I] |
| Animation | rAF loop with an external run gate (visible, onscreen, not paused, motion allowed) (`Engine.ts:458–490`); `STILL_T` frozen moment for reduced motion (`Engine.ts:131`) | No weakness found in code. Motion quality needs a live check | [V] / live |
| Theme transitions | Mood blend over time; snaps under reduced motion or when not running (`Engine.ts:344–347`) | No weakness found in code | [V] |
| Loading | `lazy(() => import('./NookScene'))` inside `Suspense`, with the static Nook as fallback (`scene/index.tsx:7, 30–34`); pre-warm import (`index.tsx:57–58`); WebGL or tier off → static (`index.tsx:30`) | Strong pattern. The Focus stage uses pre-rendered stills of the **base room without unlocked items** (`Fallback.tsx:23–28`), so with 3D off or loading the backdrop doesn't show the user's earned things, while live 3D does. That is an inconsistency for I09 | [V] |
| Static fallback | `NookFallback` SVG room with steam, weather, items and a Chai pose (`art/NookFallback.tsx:161`, `scene/Fallback.tsx:46–60`) | Recognisable and on-brand (the accepted record-player drawing). Fine | [V] |
| Context loss | `webglcontextlost` listener (`Engine.ts:267`); `alive()` gates | Recovery path not exercised here; live check | [V] / live |

## 3. Visual review (from captures; live check pending; the storage-warning area is skipped)

| # | Finding | Evidence (set · revision · capture) | Status |
|---|---|---|---|
| V1 | **Three rendering styles in one frame:** painted Chai, a flat vector kettle with a gloss highlight, and a blurred 3D-rendered room. Charming, but the kettle reads flatter than Chai | `integration/wave1` · `0d58c5e` · phone 390 dark `03-focus-mid`; desktop 1440 light `03-focus-mid` | [I] |
| V2 | **The summary sheet crops the cheering Chai** to head and raised paws, and the kettle to its lid and dial. The whistle celebration is half-hidden behind the facts | `0d58c5e` · phone 390 light `07-summary`, `11b-summary-unlock-settled` | [I] |
| V3 | **Summary facts have equal weight.** Five pill chips (+leaves, goal, warm days, recipe, level) all share one style. K02 asks for minutes and Tea time first, which holds, but the secondary facts don't rank among themselves. Relevant to I07 | `0d58c5e` · phone 390 light `07-summary` | [I] |
| V4 | **The phone Focus has an empty band** of about 80 CSS px between the counter edge and the readout, and the readout block sits low | `0d58c5e` · phone 390 dark `03-focus-mid`, `09-break` | [I] |
| V5 | **The desktop Focus right panel is sparse.** About 60 px controls under 140 px digits, a small status line, and lots of empty cream | `0d58c5e` · desktop 1440 light `03-focus-mid` | [I] |
| V6 | **Desktop status-bar labels look tiny** ("days warm", "Level 12", roughly 10–11 px) against a 34 px greeting | `0d58c5e` · desktop 1440 light `01-home` | [I] (measure the computed size live) |
| V7 | **Status-bar icon styles are mixed:** an illustrated mug, a flat leaf and a sun badge | `0d58c5e` · phone 390 light `01-home` | [I] minor |
| V8 | **Stats is one long equal-weight scroll** (streaks, level, 7 days, calendar, bests, badges, rhythm, history) with no summary at the top | `0d58c5e` · phone 390 dark `16-stats-populated` (full-page) | [I] |
| V9 | **The early Nook is dominated by 14 large locked cards** (silhouettes in roughly 200 px tiles) under the room. The emptiness gets more weight than the one next thing | `0d58c5e` · desktop 1440 dark `17-nook-early` | [I] |
| V10 | **The 3D Chai reads as a teddy bear** (see §2), and the unlock close-up (record player) is soft and toy-like | `0d58c5e` · `17-nook-early` desktop dark; `11b` phone 390 light | [I] |
| V11 | **Welcome puts painted Chai on a flat vector valley.** Readable, but another style seam; the purpose line is I08's subject | `0d58c5e` · phone 390 light `12-welcome` | [I] |
| V12 | **Landscape Focus (844×390) drops the "12 min brewed · whistles at …" line** under "Deep in it. Nice." Possibly intentional (height); verify | round 6 L4 · `e866118` · `phone-844x390-light/03-focus-mid` | [I] |
| V13 | **Landscape Home: the docked start still covers Brew length** (the I04 discovery class) | round 6 L4 · `e866118` · `phone-844x390-dark/01-home` | [I] |
| V14 | **Identity is consistent.** Cream and deep purple, Fredoka/Nunito, orange focus, blue rest (blue break digits) and green progress | `0d58c5e` · `01-home`, `09-break`, `18-nook-earned` | [V] from captures |

**Capture artefacts, not product defects:** full-page captures show the tab bar mid-page, and the stats page header
repeated at the bottom, because sticky elements are stitched.

## 4. Tools (no spending)

### Blender

- Not installed: no `blender` binary and no `bpy` [V]. Not installed per the brief.
- **Route from a model to Three.js:**
  - glTF 2.0 binary (`.glb`), with meshopt or Draco geometry and KTX2 (Basis) textures.
  - three `0.186.1` ships `GLTFLoader`, `DRACOLoader`, `KTX2Loader` and the meshopt decoder in `node_modules` [V].
  - **Budget proposal [I]:**
    - about 3–5k triangles per hero item;
    - 1 × 512² KTX2 texture;
    - at most 250 KB per item;
    - lazy-loaded after unlock;
    - decoders self-hosted (wasm in `public/`) so the PWA works offline.
  - **Fallback:** the current procedural item, when loading fails or quality is `low`.

### Higgsfield (read 2026-10-11)

- **API:** about 50+ models, pay-as-you-go in USD, failed requests not charged, funds expire after 1 year. Published
  starting rates:
  - Soul 2: $0.0032 per image;
  - Soul Cinema: $0.0032 per image;
  - Marketing Studio Image: $0.0059 per image.
  
  Source: [Higgsfield API blog, 2026-09-16](https://higgsfield.ai/blog/higgsfield-api).
- **API image catalogue** ([docs](https://docs.higgsfield.ai/docs/models/image-generation)):
  - SOUL / SOUL V2 / SOUL Cinema, Soul ID;
  - Marketing Studio Image, Ads Studio;
  - Grok Image 2.0 (up to 10 references);
  - Recraft V4.1 / Pro (2K) / Utility / Utility Pro, with background controls;
  - Qwen Image 3 (1–3 references for editing);
  - Ideogram 4.0;
  - Z-Image Turbo (1K/2K).
  
  **Per-model prices for these are not on the docs pages.** One third-party guide gives Ideogram 4.0 at $0.03 per image
  (unverified) ([apiframe guide](https://apiframe.ai/guides/higgsfield-api-guide)).
- **Not in the API catalogue:** Nano Banana Pro / Nano Banana 2, GPT Image (any version), Seedream. A community CLI
  lists them ([higgsfield-cli](https://github.com/donghaozhang/higgsfield-cli)), and the help centre describes them as
  site models ([help centre](https://higgsfield.ai/creator-hub/help-center/models/which-ai-model-should-i-use)).
  - **Website / app credits only** [I].
  - No image-to-3D or upscale endpoint is in the API docs. This session's Higgsfield connector describes a
    `generate_3d` (image → GLB) tool, but it is not available here [I].
  - Plan prices on third-party pages conflict; verify live before any spend
    ([imagine.art](https://www.imagine.art/insights/higgsfield-ai-pricing)).
- **Cost estimate [I], worth it for the three priority-1 Chai poses:**
  - roughly 3 poses × 4 candidates × 2 rounds = 24 images;
  - about $0.08–$2.40 at API rates of $0.0032–$0.10 per image.
  - Fit risk: Soul is photoreal and fashion-tuned, a poor fit for painted mascot fidelity. Grok Image 2.0 (multi-reference)
    or Qwen Image 3 (edit with references) are the API candidates. Nano Banana Pro / GPT Image are website-only.
- **Window stills:** re-render from the engine for free; no generation needed.

### Prompts for models unavailable here (Nano Banana Pro, GPT Image 2.5): ready to run, not run

Use one generation per pose. Priority 1: reading (top row, 1st), cheering (bottom row, 4th), sipping (top row, 2nd).

- **References:**
  1. `kettle/art-src/chai/chai-sheet-approved.webp` (the approved sheet);
  2. the pose master `kettle/art-src/chai/chai-<pose>.png`.
- **Dimensions:** **2048 px tall**, portrait, centred, about 6 % empty margin all round.
- **Transparency:**
  - **GPT Image:** request a transparent background (PNG with alpha) if offered.
  - **Nano Banana Pro:** there is no native alpha [I]. Use a flat **#FF00FF** background, which doesn't appear in Chai's
    palette (green is used by the book and leaf), then matte it out with `review/round-6-mockups/build/extract-chai.py`'s
    rim un-mix.
- **Prompt (both):**

  > Recreate exactly the capybara character "Chai" from the first reference sheet, **the [POSE] pose** (the [POSITION]
  > figure; the second reference is this pose cut from the sheet), as a single character, [transparent background /
  > flat solid #FF00FF background], 2048 px tall, centred, about 6% margin on every side.
  >
  > Match the reference exactly:
  > - the same proportions: tall rounded head merging into a soft loaf body, blunt muzzle, dark oval nose, small high
  >   eyes set wide, small round ears, rosy blush, stubby paws;
  > - the same warm chai-brown palette and soft painted shading lit from the top-left;
  > - the same yuzu with one green leaf on the head;
  > - the same expression and props ([PROPS]).
  >
  > No outline, no redesign, no new details, no text, no ground or drop shadow, no glow, no vignette. Clean anti-aliased
  > edges with no fringe.

- **Output checklist**, before anything replaces an asset (from `art-src/chai/README.md`, plus additions):
  1. Overlay on the master, scaled to the same height. The silhouette deviates by no more than about 2 % of height.
     The same yuzu-leaf angle and the same eyes, nose and blush placement.
  2. View on #FFF9F0 and #221829 at 100 % and at 40 px, and at 4× for halos.
  3. Downscale to about 1,200 px tall, WebP q80 with alpha 100, under 60 KB.
  4. Raise `SHEET_REF_H` proportionally. The stage cap can go from 1.6 to 2.4 px.
  5. The user's art approval is required. Unapproved replacement art is barred (PRESERVE 2).

### Installed skills: where their advice conflicts with Kettle's protected identity [V]

**taste-skill** (`.claude/skills/taste-skill/SKILL.md`):

| Rule | Lines | Conflict and resolution |
|---|---|---|
| Bans warm cream / paper backgrounds as a default | 193–207 | Conflicts with PRESERVE 1 (cream light mode). Its brand-identity override applies |
| The "Lila rule" discourages purple | 187–188 | Conflicts with the deep-purple dark mode. Override applies |
| Recommends Geist / Satoshi, not brand fonts | 169–181 | Fredoka/Nunito are protected |
| Card restraint | 214–216 | Kettle's card-based layout is accepted (PRESERVE 7) |
| A shape-consistency lock | 217 | Kettle mixes pill buttons, rounded cards and circular session controls. The rule is satisfied only if documented, so document it |
| "AI cute copy" warning | 324–326 | Use it as a clarity check on Chai's voice, not a ban |
| Perpetual micro-interactions and spring physics | 357–358 | Conflicts with calm motion and reduced-motion parity |

**impeccable:** compatible ("the brief wins; refinement preserves"). Its craft floor discourages progress rings and
soft rounded rectangles standing in for content, and bans eyebrow kickers (`reference/craft-floor.md:27, 37`). Kettle's
gauge and progress bars carry real data, so this is fine. Watch for decorative rings.

**ui-ux-pro-max:** compatible. No emoji icons (Kettle draws its icons); reduced motion is required.

**GSAP skills:** they recommend GSAP. Kettle already uses `motion/react`, so adding GSAP is a dependency change with no
concrete need (PRESERVE 12). Their `matchMedia` reduced-motion pattern matches Kettle's practice.

## 5. Needs a live walkthrough, a listening check or a real device

- **Live walkthrough:**
  - motion: Chai breathing, steam, the whistle → summary transition, mood blends, the quality-downgrade step;
  - Nook interaction: drag, zoom, tap, highlight, sparkles;
  - computed type sizes (V6);
  - the landscape layouts (V12, V13);
  - the stage at a real 1440 DPR-2 (softness from flag 1).
- **Listening check:** the synthesized whistle, ambience (rain and others), mute, volume balance, and the record
  player's "rain sounds".
- **Real device:**
  - DPR-3 sharpness of Chai and the 3D room;
  - iOS Safari WebGL, context loss, battery and heat;
  - haptics;
  - background and late-return audio;
  - real text-size settings.

## 6. Three provisional upgrade directions (pending phase 2)

1. **"One Chai" (pending phase 2).**
   - Generate the three priority-1 poses at 2048 px with the prompts above. The user approves.
   - Then bring the 3D Nook Chai to the approved silhouette: retune `chai.ts` proportions, or show the painted pose as a
     camera-facing card in the room. This makes Chai identical everywhere and sharp at DPR 2–3.
2. **"Warm material pass on the Nook" (pending phase 2).**
   - Add a tiny procedural environment (`RoomEnvironment` through PMREM, no files) for soft reflections.
   - Raise close-up texture sizes (painting, knit) to 512.
   - Smooth the high → low quality change.
   - Re-render the window stills from the engine, including earned items.
   - Optionally, one or two hero items through Blender → glTF/KTX2, with procedural fallback.
3. **"Calmer hierarchy" (pending phase 2).**
   - Summary: one primary facts line plus details on demand (I07).
   - Stage and summary framing so the cheering Chai stays in view.
   - A balanced Focus composition on phone and desktop.
   - The early Nook leads with "the next cozy thing" and fewer, smaller locked placeholders.
   - A Stats summary at the top.
