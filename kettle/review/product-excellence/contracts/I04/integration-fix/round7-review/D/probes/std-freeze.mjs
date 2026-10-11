// Lane D (round-7 review): preload for the UNCHANGED review/product-excellence/tools/capture.mjs.
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
      p.screenshot = (o = {}) => shot({ animations: 'disabled', ...o });
      return p;
    };
    return ctx;
  };
  return b;
};
