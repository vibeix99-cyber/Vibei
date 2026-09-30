# Round 5: generated media vs Kettle's own art (Welcome screen)

## Question
Can a generated picture make Kettle better? The emptiest screen is the first-run Welcome screen, especially on desktop. The candidate placement is a round "window onto Chai's valley" behind Chai. That follows the app's spot illustrations, where one object sits on a circle, and extends the valley already visible through the nook's window.

## Models: what the API key can actually call (docs checked 2026-09-30)
Image models documented for the Higgsfield API: Soul, Soul V2, Soul Cinema, Marketing Studio Image (2.0 Alpha, 2.5 Flare, 2.5 Sunburst), Grok Image 2.0, Recraft V4.1 (standard, Pro, Utility, Utility Pro), Qwen Image 3 (text-to-image, edit), Ideogram 4.0, Z-Image Turbo.
- **Nano Banana Pro:** not in the API. It is available only in the website's creative interface (higgsfield.ai → Image → Nano Banana Pro).
- **Recraft reference-guided Styles:** not in the API. The Recraft V4.1 endpoints take a text prompt, palette colours and a background colour, but no reference image.
- **Style references:** accepted by Marketing Studio 2.5 (up to 16), Grok Image 2.0 (up to 10) and Qwen Image 3 edit (1–3). Ideogram 4.0 takes one image to remix, which keeps its composition.
- **Hosts:** status URLs returned on `platform.higgsfield.ai` fail with 401 behind the Cloud credential proxy. The documented `api.higgsfield.ai/requests/{id}/status` works. The default Python `urllib` user-agent is rejected with 403.

## Brief and references (identical for every model)
- **Brief:** a flat vector valley at golden hour, in the style of Kettle's art.
- **Composition:** calm, empty centre (Chai covers it), cottage at the left rim, trees at the right, far hills near the top.
- **References for models that accept them:**
  1. A style board of Kettle's own art (Chai plus 8 spot illustrations).
  2. The hand-drawn SVG valley, as a layout guide.
- **Recraft:** the same brief as text, with Kettle's palette pinned.
- **Dusk (dark theme):** each model edited its own day image, with the dusk SVG as a colour and mood guide.

## Candidates
| Letter in the critic sheets | Candidate | What happened |
|---|---|---|
| (A) | Recraft V4.1 Pro | Drew a yellow blob in the centre, where the brief said a character would stand. Grainy, autumn palette. Retried once with the character mention removed: poster-style reds, and a white path through the centre. Out after two tries; style is foreign to Kettle |
| R | Marketing Studio 2.5 Flare | The richest image. The critic ranked it last: "a separate storybook painting, not a Kettle spot" |
| S | Grok Image 2.0 | Close to the layout guide. Roof and tree crowd Chai's ear and paw |
| P | Qwen Image 3 edit | Close to the layout guide. Slightly more crowded than Q |
| Q | Hand-drawn SVG (no generation) | Ranked first. The only candidate the critic would ship, and only after fixes |

The blind critic (one independent reviewer, no model names) scored Current above every generated candidate. After the SVG was refined to its fixes (flat fills, pale sky behind the yuzu, clearances around the head and paw, muted roof, lighter dusk ground, a larger disc that Chai stands in, ring edge, bubble gap, desktop scale), the same critic re-scored it:

| | Style | Composition | Legibility | Charm | Improvement |
|---|---|---|---|---|---|
| Current | 9 | 8 | 9 | 6 / 7 | baseline |
| Refined SVG (shipped) | 8 | 8 | 8 | 8 / 9 | 7 / 8, "ship it instead of Current" |

Its four last defects are fixed:
- Yuzu against sky, not the horizon.
- Desktop vertical balance.
- Landscape disc size.
- Path ends before the rim.

## Why the SVG won
- It is the same illustrator as Chai and the spots: flat two-tone fills, the same palette.
- It is theme-aware (day and dusk) and 3.8 KB per file, under the 4 KB inline limit, so it inlines into the CSS and works offline with no extra request.
- It is editable: `scripts/welcome-scene.py` regenerates both files.
- The generated images were either richer but off-brand (Marketing Studio), off-palette (Recraft), or near-copies of the layout guide with worse spacing (Grok, Qwen).

## Spend (all completed; no failures, no duplicates)
| Job | Endpoint | Credits | USD |
|---|---|---|---|
| r1 Recraft Pro | recraft/v4.1/pro/text-to-image | 3.36 | 0.210 |
| r2 Recraft Pro retry | recraft/v4.1/pro/text-to-image | 3.36 | 0.210 |
| r1 Grok | xai/grok-imagine-image-2.0 | 1.60 | 0.100 |
| d1 Grok dusk | xai/grok-imagine-image-2.0 | 1.60 | 0.100 |
| r1 Qwen | alibaba/qwen-image-3/edit | 1.20 | 0.075 |
| d1 Qwen dusk | alibaba/qwen-image-3/edit | 1.20 | 0.075 |
| r1 Marketing Studio | marketing-studio/image/flare (xhigh, 2k) | token-billed | see Console |
| d1 Marketing Studio dusk | marketing-studio/image/flare (xhigh, 2k) | token-billed | see Console |

**Priced total: 12.32 credits = $0.77.** The two Marketing Studio jobs are billed per token and settled on completion; neither the estimate nor the status response reports their cost, so the exact figure is only in the Higgsfield Console. Uploading the reference images (three presigned uploads) is not billed.

## Files
- `before-after-phone.png`, `before-after-desktop.png`, `after-other-sizes.png`
- `candidates-raw.png`: raw outputs.
- `candidates-in-app-light.png`, `candidates-in-app-dark.png`: the blind sheets. P = Qwen, Q = SVG, R = Marketing Studio, S = Grok.
