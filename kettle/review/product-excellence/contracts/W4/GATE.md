# W4 gate record: the animated Rive Chai (light process)

## Start, 2026-10-21 18:10 UTC
- **Source:** Vibei's `2b8e753` ("Add Chai Rive character", parent `76686f8`) adds `art-src/chai/rive/{chai.riv (45,395 B, RIVE header), README.md, src/scene.rml, src/gen_scene.py}`. Fast-forwarded; integration HEAD `2b8e753`.
- **Runtime:** none installed (no `@rive-app`). The npm registry is reachable (`@rive-app/canvas` 2.45.0, `@rive-app/react-canvas` 4.37.0 at the time of the check).
- **Netlify:** no `netlify.toml` in the repo; the deploy is configured on Netlify's side.
- **Notes from the README:** it mentions `refs/` and `tools/`, which are not in the upload. The file has its own `groundShadow` layer, so the Stage's CSS shadow must not double it.
- **Servers:** :5560 / :5570 serve integration `2b8e753` (BEFORE, verified).
- **Maker RV** (Opus, normal intensity) launched; worktree `w11`, branch `pe/w4-rive-chai`, its own `node_modules` via `npm ci`; brief `BRIEF-RV.md`; stop 21:15 UTC.
