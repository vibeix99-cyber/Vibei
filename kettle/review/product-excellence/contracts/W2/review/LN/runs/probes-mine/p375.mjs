// Lane N · check 5: "the room behind Chai disappears" at 375x667. veteran -> tap brew -> finish -> summary, sampled at 1.5 / 4.5 / 10 s.
// node p375.mjs --base URL --label ctrl|trial --out dir --runs 3 [--theme light] [--text 100]
import { mkdirSync, writeFileSync } from 'node:fs';
import { parseArgs, parseCfg, newCtx, ready, settings, tapOrClick, brewBtn, measure, shot, launch, sleep } from './common.mjs';
const A = parseArgs(); const runs = +(A.runs || 3); const theme = A.theme || 'light'; const text = +(A.text || 100);
const c = parseCfg(`375x667@2:${theme}:${text}`);
const dir = `${A.out}/${A.label}`; mkdirSync(dir, { recursive: true });
const b = await launch();
const log = { base: A.base, label: A.label, theme, text, runs: [] };
const probe = (p) => p.evaluate(() => {
  const host = document.querySelector('[data-scene-mode="window"]'); const cv = host?.querySelector('canvas'); const im = host?.querySelector('img'); const n = window.__nook;
  return { hash: location.hash, host: host ? { ready: host.getAttribute('data-scene-ready'), static: host.getAttribute('data-scene-static'), canvas: cv ? [cv.width, cv.height] : null, img: im ? (im.currentSrc || im.src).split('/').pop() : null, layers: [...host.querySelectorAll('image[data-item]')].length } : null, engine: n ? { running: n.running, first: n.firstFrameDone, lost: n.contextLost, disposed: n.disposed } : null };
});
for (let i = 1; i <= runs; i++) {
  const meta = { errors: [], console: [] }; const rd = `${dir}/run${i}`; mkdirSync(rd, { recursive: true });
  const { ctx, p } = await newCtx(b, c, meta); const run = { i, t0: new Date().toISOString(), samples: [] };
  try {
    await p.goto(`${A.base}/?debug&seed=veteran&theme=${theme}#/`); await ready(p); await p.evaluate(() => document.fonts.ready);
    await settings(p, { muted: true, autoStartBreaks: false, autoStartFocus: false }); await sleep(1200);
    await tapOrClick(p, c, brewBtn(p)); await sleep(4500);
    await shot(p, `${rd}/focus-4p5`, { raw: false }); run.focus = await probe(p);
    await p.evaluate(() => window.__kettle.finish());
    await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 60_000 }).catch(() => run.errors = 'never reached summary');
    const t0 = Date.now();
    for (const at of [1500, 4500, 10000]) {
      await sleep(Math.max(0, at - (Date.now() - t0)));
      const t = Date.now() - t0;
      await shot(p, `${rd}/summary-${at}`, { raw: false });
      run.samples.push({ at, tActual: t, ...(await probe(p)) });
    }
  } catch (e) { run.err = e.message.slice(0, 200); }
  run.errors2 = meta.errors; run.console = meta.console.slice(0, 5); run.t1 = new Date().toISOString();
  log.runs.push(run); await ctx.close();
  console.log(A.label, 'run', i, run.samples.map((s) => `${s.at}:${s.host?.static ? 'still' : s.host?.canvas ? 'live' : 'none'}`).join(' '), run.err || '');
}
writeFileSync(`${dir}/log.json`, JSON.stringify(log, null, 1));
await b.close();
