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

## Open / requests
- Shell caps `main` at 680px, so the "scene + side panel" layout (container query ≥ 860px) never activates on desktop. Request (design-system): let `/nook` use a wider main (≈1040px) or hide the rail there.
