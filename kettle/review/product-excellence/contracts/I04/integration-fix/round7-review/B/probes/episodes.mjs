// RELAUNCH probe (Lane B check 6): the warning across two failure episodes in one page life, counting live-region
// additions of the warning text. Setup by the debug API (newbie seed, fill, one failing app save, then freeing room
// and the app's next saves, then filling again and a second failing save). No input needed; real timers.
//   episode 1 -> banner added, said once; room made + saves -> banner removed (the app polls every 2 s);
//   episode 2 within 60 s -> banner added again; is it said again? (the app: not within 60 s of the first)
//   node episodes.mjs <base> <rev> <out> "375x667@100:light,..."
import { mkdirSync, appendFileSync } from 'node:fs';
import { launch, newCtx, open, seedAndFill, failASave, freeRoom, fill, sleep, parseCfgs, WARN_FN } from './blib.mjs';
const [,, base, rev, out, cfgArg] = process.argv;
mkdirSync(out, { recursive: true });
const b = await launch();
for (const cfg of parseCfgs(cfgArg)) {
  const { W, H, text, theme } = cfg;
  const tag = `${rev}-${W}x${H}-t${text}-${theme}-episodes`;
  const ctx = await newCtx(b, cfg); const p = await ctx.newPage();
  const res = { tag, rev, base, W, H, text, theme, started: new Date().toISOString(), steps: [] };
  const present = () => p.evaluate((WF) => !!eval(WF)(), WARN_FN);
  const snap = async (name) => { const o = await p.evaluate(() => ({ t: Math.round(performance.now()), said: window.__obs.said.length, ev: window.__obs.warnEv.length })); res.steps.push({ name, present: await present(), ...o }); };
  try {
    await open(p, base, theme);
    res.fill = await seedAndFill(p); res.tFail = await failASave(p); await sleep(2500); await snap('episode1-after-fail');
    await freeRoom(p); await sleep(500); await snap('room-made-before-any-save');
    await p.evaluate(() => { const k = window.__kettle; k.timer.setState({}); k.progress.setState({}); k.settings.getState().set({ name: k.settings.getState().name }); });
    for (let i = 0; i < 12; i++) { await sleep(500); if (!(await present())) break; }
    await snap('after-saves-gone?');
    await p.screenshot({ path: `${out}/${tag}-1-recovered.png` });
    res.fill2 = await fill(p); res.tFail2 = await failASave(p); await sleep(2500); await snap('episode2-after-fail');
    await p.screenshot({ path: `${out}/${tag}-2-episode2.png` });
    res.obs = await p.evaluate(() => window.__obs);
  } catch (e) { res.error = String(e.message).split('\n')[0]; }
  res.ended = new Date().toISOString();
  appendFileSync(`${out}/episodes-${rev}.jsonl`, JSON.stringify(res) + '\n');
  console.log(tag, res.error ?? '', JSON.stringify(res.steps.map((s) => [s.name, s.present, s.said, s.ev])));
  await ctx.close();
}
await b.close();
