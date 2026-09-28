# Scene area (3D nook) — log

Owner: scene agent. Files: `src/scene/**`, `src/screens/nook/**`.

## Architecture
- `scene/index.tsx` — `<Nook/>` contract (unchanged API + optional `backdrop`). Decides static vs 3D *before* loading three:
  `settings.scene === 'off'` or no WebGL → art's `NookFallback`; otherwise lazy `NookScene` with the same illustration as Suspense fallback.
- `scene/NookScene.tsx` — React host. Owns ResizeObserver, IntersectionObserver, `visibilitychange`, context loss/restore (remount by key), prop → engine forwarding. Canvas is `aria-hidden`.
- `scene/resolve.ts` — time-of-day (`auto` = local clock via `clock.now()`), weather (defaults from `settings.ambient`: rain/lofi → rain, fire → snow, else clear), quality tier (`settings.scene`), debug overrides.
- `scene/engine/*` — framework-free three.js:
  - `Engine.ts` renderer, lights, mood blending, loop (30 fps cap unless interacting), camera fit, drag/pinch/wheel controls, picking, highlight.
  - `room.ts` floor/walls (extruded, bevelled, arched window hole), window + outside (sky shader, hills, neighbour house, moon/sun/clouds, weather), lamp, rug, table, mug, light decals.
  - `kettle.ts` iron stove + persimmon kettle, fire glow, steam emitter, whistle notes.
  - `items.ts` all 14 `ITEMS` built procedurally with idle anims.
  - `chai.ts` 3D Chai (loaf with face, matching `src/art/Mascot.tsx`): nap (focus) / sip (break) / awake (idle, showcase).
  - `fx.ts` GPU particles (steam, rain, snow, fireflies, twinkling glows), sky + glass shaders — all animated from one `uTime` uniform, zero per-frame allocation.
  - `kit.ts` material cache, geometry helpers, **static merge with vertex-colour baking** (roughness/metalness quantised to 3×2 finishes) so each prop collapses to 1–3 draw calls.

## Debug / screenshots
`?debug&nooktime=morning|day|dusk|night&nookweather=clear|rain|snow&nookq=high|low|off&nookitems=all|none|a,b`.
`window.__nook` = engine (`__nook.stats` has calls/triangles/frameMs).
Headless: run my own dev server with HMR off (other agents' edits reload pages mid-shot).

## Iterations
1. **First light** — room, kettle, items, lights. Critique: murky plum walls, room tiny in frame (box fit wastes space), Chai tiny/dim, 311 draw calls, steam shader broken (`active` is a reserved GLSL word).
   Fixes: brighter hemi + lamp, fit to the room's silhouette points (not its bounding box), vertex-colour merge (311 → ~160 with shadows), dropped 2 lights.
2. **Chai + steam** — Chai read as a teddy bear (separate head, big dark snout, round ears). Rebuilt as the 2D mascot: one loaf with the face on its front, broad snout, wide nose on top, tiny ears, blush, yuzu. Nap = melted loaf + zZ, sip = happy eyes + persimmon mug with steam.
   Steam at 50% was an invisible trickle → bigger puffs, jet along the spout on whistle, honey music notes. Rain read as dots → longer, slanted streaks. Curtains lightened. Weather wasn't applied on init (clear showed rain) → fixed.
3. **Nook screen** — big interactive stage, time/weather preview toggles, hint pill, story card (Chai + speech bubble), level card with next surprise, collection grid with flat item glyphs (silhouettes when locked). Highlight was invisible for wall-side items (halo occluded) → warm local light + front glow + sparkles on top + camera nudge; small non-interactive cards (level-up) frame the item. Monstera moved beside the window (it hid the record player).

4. **Phone-size focus critique** — 8% and 50% steam looked identical because the plume rose right in front of the glowing lamp shade (white on white). Moved the stove forward along the left wall so the plume rises against the plain corner wall; cat bed/painting shifted to suit. Chai got a gentle self-fill (fur + snout) so the face reads at night. Low tier now swaps shared PBR materials for Lambert. Fresh canvas per engine + `forceContextLoss()` on dispose (StrictMode-safe; 6 remounts → 1 canvas, no warnings). Fairy lights cast a warm wash on the walls.
   Level-up card: with `highlightItem` set and `interactive` off, the camera frames the item (~50% of the card's short side), plus warm local light, glow, sparkles, bounce.

## Perf (headless SwiftShader = CPU rasteriser, so absolute ms are pessimistic)
| case | draw calls | triangles | JS/CPU per frame | software raster per frame |
|---|---|---|---|---|
| desktop Nook 676×555, all 14 items, high (shadows) | 209 | 153k | ~4 ms | ~890 ms |
| same, low (Lambert, no shadows) | 137 | 89k | ~3 ms | ~170 ms |
| phone Nook, level 12, high | 157 | 129k | ~2 ms | ~455 ms |
| phone Nook, level 12, low | 109 | 77k | ~2 ms | ~92 ms |
Loop caps at 30 fps (60 only while dragging / blending moods), pauses offscreen / hidden / `paused` / reduced motion (renders on demand). `auto` drops to low after sustained slow frames. Lazy chunk: NookScene 80 kB (27 kB gz) + three 584 kB (147 kB gz), loaded only when a 3D nook mounts.

## Open / requests
- core-loop: the level-up card needs no new prop — `highlightItem` with `interactive` unset already frames the item. `backdrop={false}` floats the room on your own background.
- Shell caps `main` at 680px, so the "scene + side panel" layout (container query ≥ 860px) never activates on desktop. Request (design-system): let `/nook` use a wider main (≈1040px) or hide the rail there.
- Known gaps: base-room objects (kettle, window, lamp) aren't tappable for stories; locked items have no in-room "ghost" preview; no morning/day-specific window light shafts beyond the floor patch; the art `NookFallback` is night-only, so a daytime crossfade from fallback → 3D shifts mood briefly while three.js loads.
