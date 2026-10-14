# Vibei's decisions on W3R1's open calls (2026-10-14, after the final-regression resume)

0. **Order.** Lane R finishes the final regression on `2be3de1` first. Items 1–3 start only after its receipt is in, so nothing competes for browser slots while it runs.
   - `integrity:309` and `w2-room:167` are new failures. Classify them with reruns. **If they cannot be shown to be flaky, they are real findings to fix before the Final Product Boss.**
1. **N, eye contrast:** keep as merged. No change.
2. **F, band-collapse hover risk:** do **not** give the room back "in answer to the next tap".
   - **Narrow follow-up:** raise the idle wait from 1.2 s to **4 s** (one constant plus the test expectations). LEAD-5 verifies the 64-tap aimed-tap check and the notice suite on the result.
   - **Logged for the post-Final-Boss polish round:** "collapse only when the band is off-screen or on a screen change, so visible content never moves".
3. **Before the Final Product Boss: one test-stability task** covering:
   - the 1440 light @200 reduced-motion `notice-strip` case (`:292`, X-11);
   - `integrity:1017`;
   - the storage-full banner test (X-1);
   - the 4-minute timeouts (X-11 attempts 2–3).

   Test-only changes, plus root-cause notes for anything that turns out to be a product bug.
4. **Report the final-regression result on `2be3de1`** when Lane R finishes. **Do not start the Final Product Boss** until Vibei says so.
