# Vibei's W3R2 brief (hardening round), 2026-10-17 ~16:00 UTC

Recorded by the orchestrator. Vibei's wording is kept where it binds.

**W3R2 hardening round. The Final Product Boss stays on hold.**

**First:** recover state from STATUS.md and the W3R1 receipts on `claude/wizardly-galileo-uy89d9`. Confirm HEAD and that the tree is clean, then restart the servers, the slot gate (nproc−1) and autocommit.

**Model split:**
- Opus 5.5 for item 1's maker and for all LEAD reviews.
- Sonnet 5.5 for items 2–3 and for the regression and capture lanes.

**Rules:** merge only on LEAD APPROVE; one fix round per item; write receipts in stages.

## 1. `sync.ts` stale-tab guard (Opus maker, separate gate)
- One guard, so that a tab whose timer state is older than storage can never overwrite a newer brew. It must cover:
  - `rebase`;
  - pause, resume, add 5, end and start in a lagging tab;
  - a typed edit in a lagging tab.
- A user action in a lagging tab should apply to the current brew, or refresh first. It must never silently discard the other tab's brew.
- Storage format unchanged, compatible both ways, no migration.
- Deterministic race tests, one per trigger. Each must fail on the current HEAD and pass on the fix.
- Keep `integrity:309` at 20/20 under load, and keep the existing race tests green.
- **Regression:** timer/PWA, integrity, home and notice suites, plus a 2-tab manual check with real clicks: pause, add 5 and end in the lagging tab while the other tab runs a brew.
- **Do NOT change the composer label behaviour** (words typed in tab 2 becoming the brew label). Log it only.

## 2. `Toast.tsx:482` conditional hook (Sonnet maker)
- Restructure so hooks are called unconditionally, with no visible or behavioural change.
- **Proof:**
  - no hook-order error in the dev/test console across the notice suite;
  - `notice-strip` 25/25;
  - REFERENCE → BEFORE → AFTER notice captures showing no difference beyond noise.

## 3. Test-only stability (Sonnet maker)
- Covers the two flaky hidden-tab timer tests (`timer.spec.ts:156`, `:183`) and the `notice-strip` tap-helper re-aim.
- No assertion may be weakened; LEAD confirms.
- Each test must pass 10/10 under load.

## Order
- Items 2 and 3 may run in parallel with item 1 if their files don't overlap; check ownership first.
- Then a full regression on the merged tree, and a report to Vibei.

## Still open, not in this round
- The composer label quirk (for the Final Boss to judge).
- The low-tier backdrop still vs live difference (for Vibei's phone check).
- The band collapsing only off-screen (post-Boss polish).
