// RELAUNCH probe (Lane B check 1/2/6 support): does the storage-full warning appear and STAY while storage is full?
// Setup by the debug API (newbie seed, saved timer, localStorage filled, one failing app save); then NO input for
// <seconds> on Today, real timers; presence of the warning element sampled every 500 ms with its box, and every add /
// remove event of the warning element recorded (init-script MutationObserver). Frames at 3 s and at the end.
//   node hold.mjs <base> <rev> <out> "375x667@200:light,..." [seconds=70]
import { mkdirSync, appendFileSync } from 'node:fs';
import { launch, newCtx, open, seedAndFill, failASave, sleep, parseCfgs, WARN_FN } from './blib.mjs';
const [,, base, rev, out, cfgArg, secArg = '70'] = process.argv;
mkdirSync(out, { recursive: true });
const b = await launch();
for (const cfg of parseCfgs(cfgArg)) {
  const { W, H, text, theme } = cfg;
  const tag = `${rev}-${W}x${H}-t${text}-${theme}-hold${secArg}`;
  const ctx = await newCtx(b, cfg); const p = await ctx.newPage();
  const res = { tag, rev, base, W, H, text, theme, seconds: +secArg, started: new Date().toISOString() };
  try {
    await open(p, base, theme);
    res.fill = await seedAndFill(p); res.tFail = await failASave(p);
    const t0 = Date.now(); const samples = [];
    while (Date.now() - t0 < +secArg * 1000) {
      const s = await p.evaluate((WF) => { const w = eval(WF)(); const q = w?.getBoundingClientRect(); const toasts = [...document.querySelectorAll('[aria-label="Notifications"] li')].map((l) => l.textContent.replace(/\s+/g, ' ').slice(0, 60)); return { t: Math.round(performance.now()), present: !!w, tag: w?.tagName ?? null, box: q ? [Math.round(q.left), Math.round(q.top), Math.round(q.width), Math.round(q.height)] : null, toasts, hash: location.hash }; }, WARN_FN);
      samples.push([Date.now() - t0, s.present, s.box, s.toasts.length]);
      if (Date.now() - t0 > 2800 && !res.shot1) { res.shot1 = true; await p.screenshot({ path: `${out}/${tag}-1-at3s.png` }); }
      await sleep(500);
    }
    await p.screenshot({ path: `${out}/${tag}-2-end.png` });
    res.samples = samples; res.presentSamples = samples.filter((x) => x[1]).length; res.totalSamples = samples.length;
    res.firstPresentAtMs = (samples.find((x) => x[1]) || [null])[0];
    res.obs = await p.evaluate(() => window.__obs);
    res.finalToasts = await p.evaluate(() => [...document.querySelectorAll('[aria-label="Notifications"] li')].map((l) => l.textContent.replace(/\s+/g, ' ').slice(0, 80)));
  } catch (e) { res.error = String(e.message).split('\n')[0]; }
  res.ended = new Date().toISOString();
  appendFileSync(`${out}/hold-${rev}.jsonl`, JSON.stringify(res) + '\n');
  console.log(tag, res.error ?? '', 'present', res.presentSamples + '/' + res.totalSamples, 'first at', res.firstPresentAtMs, 'warnEv', JSON.stringify(res.obs?.warnEv));
  await ctx.close();
}
await b.close();
