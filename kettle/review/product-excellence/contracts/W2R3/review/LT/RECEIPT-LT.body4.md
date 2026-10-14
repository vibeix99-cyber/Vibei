
## 4. Strip behaviour

### 4.1 A strip change during a tap (fix :5476, Settings, veteran; `probes/cmp/*-tap*.json`)

Target: the first in-flow control below the (empty) strip with its centre in view: "Classic" (Brew length preset in Settings) at all four sizes. (a) `mouse.down` on it, a notice raised while held, 500 ms, `mouse.up`. (b) "Finger in the air": page at rest ≥ 1.6 s (pointer parked), a notice raised, then a real tap / click δ ms later at the target's centre as it was before the notice.

| Size (100 %, light) | (a) held: target top before / during hold / at up / 2.5 s after up; click target | (b) δ = 0 ms | δ = 60 ms | δ = 150 ms | δ = 400 ms |
|---|---|---|---|---|---|
| 390×844 (touch) | 355 / 355 / 355 / 427; the target | 355 → 423 before the tap; click on the preset group `div` (not the target) | strip already occupied at load (top 423 before raising): no move; target | same: no move; target | same: no move; target |
| 375×667 (touch) | 355 / 355 / 355 / 427; the target | 355 → 423; group `div` | strip already occupied (423): target | 355 → 423; group `div` | 355 → 423; group `div` |
| 844×390 (touch) | 325 / 325 / 325 / 393; the target | 325 → 393; group `div` | 325 → 393; group `div` | 325 → 393; group `div` | 325 → 393; group `div` |
| 1440×900 (mouse) | 349 / 349 / 349 / 417; the target | 349 → 417; group `div` | strip already occupied (417): target | same: target | same: target |

- (a): 0 px of movement between pointer-down and pointer-up in 4 of 4; the strip appeared after release (+68 to +72 px).
- (b): in every trial where the strip went from empty to showing (9 trials), the target had moved down 68 px before the tap arrived (δ 0–400 ms) and the click landed on a different element. In the 7 other trials the strip already showed a notice before Lane T raised the trial's notice (what it was is not recorded; between those trials the probe navigated to the identical URL `/?debug&theme=…#/settings`, so the page may not have reloaded and the previous trial's notice may still have been up), and nothing moved. This is the case the maker states as the residual ("a finger already in the air when the page has been at rest for 1.2 s"); Lane T raised the notice through `__kettle.toast` with no input for ≥ 1.6 s.

### 4.2 The queue across a route change (fix, all 22; `groups.queue`)

Four notices raised on Today; the Stats tab tapped after 1 s. `__kettle.notices()` before the tap: 4 in the queue (t1 shown); after: 4 in the queue, t1 shown on `/stats`, its time left 2,200–2,493 ms before the tap and 1,595–2,200 ms after. Drawn on Stats in order in all 22: "Queue one…", "Queue two…" (at 1.5–3.4 s), "Queue three…" (5.3–7.1 s), "Queue four…" (8.7–12.0 s). Nothing dropped; 0 clipped-text samples.

### 4.3 The update prompt (fix, all 22; `groups.update`)

Raised exactly as `ShellOverlays.tsx` raises it (id `pwa-update`, duration Infinity, action Update). At +1.5 s it is the drawn notice. "Brew updated" (3.2 s) raised: sampled every 500 ms, it is the drawn notice from +0.5 s to +3.0 s (20 configurations), to +2.5 s (1) or to +2.0 s (1); then the update prompt is drawn again until the end of the run (+7 s) in all 22. Update then tapped / clicked for real: its handler ran once (22/22), Update 9/9 on top.

### 4.4 Storage banner (storage really full: `QuotaExceededError` on a filler write; a brew started and ended through the debug API; measured 3 s and 7 s after Today returned)

| Size | DOM (`section[data-save-warning]` and its children, attributes, text) fix vs base | `position` fix / base | Box at +3 s fix / base | Box at +7 s fix / base | Strip at +3 s (fix) |
|---|---|---|---|---|---|
| 390×844 light 100 | identical | static / static | [16, **302**, 358, 143] / [16, 234, 358, 143] | [16, 234, 358, 143] / same | "Kettle's off. See you soon." |
| 375×667 dark 200 | identical | static / static | [16, **755**, 343, 332] / [16, 642, 343, 332] | [16, 642, …] / same | same notice |
| 844×390 light 200 | identical | static / static | [443, 16, 377, 292] / same | same / same | same notice (strip in the left column) |
| 1440×900 light 100 | identical | static / static | [929, **112**, 464, 109] / [929, 44, 464, 109] | [929, 44, …] / same | same notice |

The banner's previous / next siblings are the same on both, except 844×390 @200 where the next sibling is the Brew length on the fix and the task field on the base (H's restored layout). While a notice is in Today's strip the banner sits 68 px (390×844 @100, 1440 @100) or 113 px (375×667 @200) lower than on the base; once the strip is empty its box equals the base's.
