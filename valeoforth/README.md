# Valeoforth

A house for the things I build: an entrance ("the hall") and one room per project. Launch scope: the hall + **Room 01, Kettle**.

Static site — no framework. Node 20+.

```bash
npm install
npm run build      # src/ + public/ -> dist/  (relative URLs; host anywhere, even file://)
npm run check      # links, anchors, alt text, headings, privacy rules, colour contrast
npm run preview    # http://localhost:4173
node tools/e2e.mjs # visitor-path tests against the preview (needs Chromium; CHROME=/path)
node tools/shots.mjs shots   # rendered screenshots at 320/390/tablet/desktop/landscape
```

## Adding a room
1. Copy `src/rooms/_template.mjs` to `src/rooms/<slug>.mjs`, fill in the metadata and `sections()`.
2. Register it in `src/rooms/index.mjs`. The hall's doors/list, the Rooms menu, prev/next links, sitemap and page are generated.
3. Put images through `tools/images.mjs` (or drop optimised files in `public/img`). Give the room its own tokens in `src/styles/4x-<slug>.css` scoped to `.room--<slug>`.

## Kettle imagery
Kettle's source isn't in this repo. Screenshots and the Chai SVGs are captured from a locally served build of the app by
`tools/capture-kettle.mjs` + `tools/capture-extra.mjs` (see the header comments). Processed WebP files are committed in
`public/img`; raw PNGs are not. Stats/streak screens use sample sessions the real app computed — labelled on the page.

## Before going public
See `docs/LAUNCH-CHECKLIST.md`. The site currently ships `robots.txt` with `Disallow: /` and no Kettle demo link.
