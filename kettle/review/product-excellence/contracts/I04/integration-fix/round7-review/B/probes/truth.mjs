// Lane B check 4/6 extra ("nothing may imply data was saved when it wasn't"): End early by REAL taps while storage is
// full. Variant first: storage filled during the brew and NO save has failed yet, so End's own save is the first
// failure. Variant active: a save already failed (warning on) before End. Records the End sheet's text, every toast's
// text for 3.5 s after End, the failed writes and their order, and the live-region additions. Setup: debug API.
//   node truth.mjs <base> <rev> <out> "375x667@100:light" [variants=first,active]
import { mkdirSync, appendFileSync } from 'node:fs';
import { launch, newCtx, open, fill, failASave, sleep, parseCfgs, WARN_FN } from './blib.mjs';
const [,, base, rev, out, cfgArg, varArg = 'first,active'] = process.argv;
mkdirSync(out, { recursive: true });
const b = await launch();
for (const cfg of parseCfgs(cfgArg)) for (const v of varArg.split(',')) {
  const { W, H, text, theme } = cfg; const phone = W < 900;
  const tag = `${rev}-${W}x${H}-t${text}-${theme}-${v}`;
  const ctx = await newCtx(b, cfg); const p = await ctx.newPage();
  const res = { tag, rev, base, variant: v, started: new Date().toISOString() };
  const tap = async (loc) => { const bb = await loc.boundingBox(); if (phone) await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); else await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); };
  try {
    await open(p, base, theme);
    await p.evaluate(() => window.__kettle.seed('newbie')); await p.reload(); await (await import('./blib.mjs')).ready(p);
    await p.evaluate(() => window.__kettle.timer.getState().startFocus({ minutes: 25, intention: 'Truth check' }));
    await p.waitForFunction(() => location.hash === '#/focus'); await sleep(1500);
    await p.evaluate(() => window.__kettle.ff(6 * 60_000)); await sleep(500);
    res.fill = await fill(p);
    if (v === 'active') { await failASave(p); await sleep(800); }
    res.failedBeforeEnd = await p.evaluate(() => window.__obs.writes.filter((w) => w[2] !== 'ok').length);
    res.warningBeforeEnd = await p.evaluate((WF) => !!eval(WF)(), WARN_FN);
    await tap(p.getByRole('button', { name: 'End session' }).first());
    await sleep(900);
    res.sheetText = await p.evaluate(() => [...document.querySelectorAll('[role="dialog"]')].map((d) => d.innerText.replace(/\s+/g, ' ').trim()).join(' | '));
    await p.screenshot({ path: `${out}/${tag}-1-endsheet.png` });
    const t0 = await p.evaluate(() => Math.round(performance.now()));
    await tap(p.locator('[role="dialog"]').getByRole('button', { name: 'End session' }));
    const seen = new Set();
    for (let i = 0; i < 14; i++) { await sleep(250); for (const t of await p.evaluate(() => [...document.querySelectorAll('[aria-label="Notifications"] li')].map((l) => l.innerText.replace(/\s+/g, ' ').trim()))) seen.add(t); if (i === 3) await p.screenshot({ path: `${out}/${tag}-2-after-end.png` }); }
    res.toastsAfterEnd = [...seen];
    const o = await p.evaluate(() => window.__obs);
    res.writesAfterEnd = o.writes.filter((w) => w[0] >= t0).slice(0, 12);
    res.said = o.said;
    res.hash = await p.evaluate(() => location.hash);
    res.warningAfter = await p.evaluate((WF) => !!eval(WF)(), WARN_FN);
    res.claimsSaved = res.toastsAfterEnd.some((t) => /^Saved \d/.test(t)) && res.writesAfterEnd.some((w) => w[2] !== 'ok');
    console.log(tag, JSON.stringify({ sheet: res.sheetText, toasts: res.toastsAfterEnd, failedBefore: res.failedBeforeEnd, failedAfter: res.writesAfterEnd.filter((w) => w[2] !== 'ok').map((w) => w[1]), claimsSavedWhileFailing: res.claimsSaved, said: res.said.map((s) => s[3]) }));
  } catch (e) { res.error = String(e.message).split('\n')[0]; console.log(tag, 'ERROR', res.error); }
  appendFileSync(`${out}/truth-${rev}.jsonl`, JSON.stringify(res) + '\n');
  await ctx.close();
}
await b.close();
