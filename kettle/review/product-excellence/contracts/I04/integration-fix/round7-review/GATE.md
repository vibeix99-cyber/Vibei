# Round-7 packet gate (orchestrator, 2026-10-11 03:22 UTC). Completeness only, not correctness.

**Result: PASSED.**

**Submission:** combined packet `pe/r7-banner@7ba0d98`.
- Code `980ef2a`; `kettle/src` `6db18ad`.
- Contains M7b `pe/r7-break@38fc9c6`, merged in `eea543d`.

| Gate item | Present | Notes |
|---|---|---|
| Revision hash + trial merge onto current integration HEAD (both hashes + app source tree) | yes | The maker merged onto `f3b70d3`, giving `8055cc4` with src `6db18ad`. The official review trial is `b39202f`, built by the orchestrator on `2e9095c`; same src `6db18ad`. The integration branch moved only by review/STATUS commits. |
| Changed files | yes | Packet section (b): 16 src/test files against `51521cf`. |
| Cause notes | yes | Packet sections (b) and "Close fix". |
| Maker runs of step-2 probes on the new revision and on their controls | yes | See the probe table below. |
| tsc / unit / browser / timer-PWA, passed/total with skip reasons | yes | See the test list below. |
| M1 data-integrity tests unchanged and passing | unchanged: yes; passing: yes on rerun | `storage.ts`, `timer/**` and `progress/**` are identical to `3f00b57`. `integrity.spec.ts` lines 1–949 are byte-identical. See the flag on the integrity timeout below. |
| Full-size BEFORE (INT) / AFTER captures, same session, frozen date and clock, idle animation paused | yes, partial | 16 configurations × 8 states, frozen at 2026-10-10T15:20Z. The 100 % brew captures used the real clock (disclosed). Lane D re-captures with a frozen clock. |

**Step-2 probes, revision against control:**

| Probe | Control | Control result | Final revision result |
|---|---|---|---|
| Close | `49ea1de` | 16/16 fail | 0/16 |
| LEAD-D1 | `e866118` | 11/10 adds/removals | 1/0 in 8/8 |
| R5-D1 natural | R5 | 1–2/10 | 0/10 per config |
| M7b reach | INT | 44/60 (on `38fc9c6`) | 0/10 at 375×667 on the final |

**Tests:**
- tsc clean.
- vitest 267/267.
- chromium 71/72; the one failure is M1's "export → reset → import" timeout under load. It passed 10/10 on rerun.
- timer-harness 14/14.
- timer-app 12 + 2 skipped (by design, "covered in the harness").
- pwa 3/3.

**Flags passed to the lead:**
- The integrity timeout under load.
- Probes the maker did not re-run on the final revision:
  - M7b reach at 390×844 and 844×390;
  - the toast check at 390×844 dark and 667×375;
  - Ambience and Mute by touch.
- The real-clock brew captures.

**Disclosed limits:**
- After a real "Mark done" while the page is scrolled down, the banner can sit above the view.
- The summary note takes two rows at 844×390 and at 200 % text.
- Pre-existing "saved" wording in the End sheet and in `announce.ts`.
