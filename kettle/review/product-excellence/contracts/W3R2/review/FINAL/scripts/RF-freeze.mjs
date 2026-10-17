// Lane RF (W3R2 final), from the W3R1 final preload LR-freeze2.mjs (Lane D / Lane R lineage): preload for the UNCHANGED review/product-excellence/tools/capture.mjs.
//   node --import .tmp/D/std-freeze.mjs review/product-excellence/tools/capture.mjs ...
// capture.mjs neither freezes the date/clock nor pauses animations. This preload (no maker file touched) wraps
// chromium.launch so that every context it creates gets the same fixed start instant (clock.install + resume:
// the same instant on both sides, time then runs at the real rate) and every page screenshot defaults to
// animations:'disabled' (finite animations fast-forwarded, idle/infinite ones cancelled).
import { chromium } from 'playwright';
const FIXED = Date.parse(process.env.LANE_D_FIXED_ISO ?? '2026-10-10T16:40:00.000Z');
const launch = chromium.launch.bind(chromium);
chromium.launch = async (...a) => {
  const b = await launch(...a);
  const newContext = b.newContext.bind(b);
  b.newContext = async (...c) => {
    const ctx = await newContext(...c);
    await ctx.clock.install({ time: FIXED });
    await ctx.clock.resume();
    const newPage = ctx.newPage.bind(ctx);
    ctx.newPage = async (...d) => {
      const p = await newPage(...d);
      const shot = p.screenshot.bind(p);
      p.screenshot = async (o = {}) => {
        // W3R1 final (Lane R): never shoot while a screen is still leaving (a full-page frame then carries the old screen), and fonts are ready
        const t0 = Date.now();
        await p.waitForFunction(() => !document.querySelector('[data-route-leaving]'), null, { timeout: 25000 }).catch(() => {});
        await p.evaluate(() => document.fonts.ready).catch(() => {});
        const waited = Date.now() - t0;
        if (waited > 1500) console.log(`  (waited ${waited} ms for the leaving screen)`);
        return shot({ animations: 'disabled', ...o, fullPage: true }); // RF: every frame is a full-page frame
      };
      return p;
    };
    return ctx;
  };
  return b;
};
