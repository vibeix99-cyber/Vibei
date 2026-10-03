# Round 6 follow-up 1: phone summary room, Home categories, the unlock close-up

Three focused fixes on the approved round 6 direction, captured from the real app (Playwright, dev server,
`?debug&seed=…`) after one correction batch and one confirmation pass. The renderer is CPU-only (SwiftShader),
so the 3D room takes a few seconds to settle here.

## What changed

1. **Phone summary room.**
   - Stacked, the summary panel now spans the whole screen. The sheet rests on the counter's front edge, just
     under Chai's feet. Scrolling slides it up over the scene, which keeps its exact place and size: the stage's
     rectangle is identical in focus and summary, and the loop checker now asserts it.
   - If the unlock (or, without one, the rewards) would start under the footer, the sheet opens higher before
     the first paint. It rises at most 22% of its resting offset, or 30% for an unlock.
   - The task section has no card. Its name and tag sit on one line, then Done and Carry forward. The hint line
     is now a screen-reader live region.
   - The sheet's bottom padding keeps the last line clear of the fade. Tea time and Skip break stay in the
     footer with their safe-area padding.
2. **Home categories wrap.** All five (Work, Study, Read, Create, Life) show on two lines on phones. Each chip
   has a 44 px touch target. There is no sideways scroller to discover.
3. **The unlock is a close-up of the record player.**
   - The 3D camera frames the item itself. The record player gets a tighter frame, because its bounds include
     the record stand.
   - While the room loads, or with 3D off, the card shows the item's own drawing instead of the whole-room
     illustration.

## captures/

Measured in CSS px, from the top of the viewport.

| Folder | Results |
|---|---|
| `phone-390x844-light`, `-dark` | Rewards end at 676 and the footer starts at 706. The unlock card ends at 676 (footer 706). |
| `phone-375x667-light`, `-dark` | The unlock card ends at 511 (footer 529). The third reward row sits behind the fade until scrolled. |
| `desktop-light`, `-dark` | 1440 × 900. |

Each folder holds the same states:

| # | State |
|---|---|
| 01 | Home (top) |
| 01b | Home scrolled to the categories (on the short phone the docked CTA covers them until the page scrolls) |
| 07 | Routine summary |
| 11 | Major unlock, as first shown (drawing while the 3D room loads) |
| 11b | The same unlock with the 3D close-up settled |
| 14 | First brew summary |

`sheet-*.png` shows each folder on one page.

## recordings/ (MP4, H.264, muted)

| File | What it shows |
|---|---|
| `unlock-summary-scroll-phone-light.mp4` | 390 × 844. The whistle, the unlock summary (the drawing gives way to the 3D close-up), then a scroll through everything, with "How your leaves added up" open, to the last line. The last line ends 34 px above the footer. |
| `whistle-to-summary-phone-light.mp4` | The last seconds of a brew, the whistle, the summary rising on the same stage, then Tea time and the break. |
| `whistle-to-summary-phone-dark-reduced-motion.mp4` | The same sequence with reduced motion: a still whistle, then fades only. The sheet does not slide. |

## Checks

- Loop checker: 85/85. The two new checks are "the stage keeps its exact place and size" and "at full scroll
  the last block sits clear above the footer and its fade".
- Also passing: hand-off on the same stage node, small-phone fit, and reduced motion.
- vitest: 256/256. Playwright e2e: 29 passed, 2 skipped (the same two skips as before this change).
