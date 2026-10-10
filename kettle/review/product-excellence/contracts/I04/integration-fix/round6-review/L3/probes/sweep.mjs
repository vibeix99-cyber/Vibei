// L3 3a (cause, fine): real wheel sweep of Today in 25 px steps with the warning up (375x667, 100%): where is the warning withdrawn?
// node sweep.mjs --rev=R6|INT [--step=25] [--text=100]
import { REV, launch, newCtx, openNewbie, fillStorage, sleep, args, logger, OUT, stamp, todayAfterEnd, WARN } from './lib.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const a = args();
const rev = REV[a.rev ?? 'R6'];
const text = +(a.text ?? 100), step = +(a.step ?? 25), w = 375, h = 667;
const dir = `${OUT}/3a`; mkdirSync(dir, { recursive: true });
const tag = `${rev.name}-sweep-t${text}`;
const log = logger(`${dir}/${tag}.log`);
log(`RUN 3a-sweep ${tag} url=${rev.dev} rev=${rev.name}@${rev.commit} viewport=${w}x${h} text=${text}% step=${step} start=${stamp()}`);
const b = await launch();
const ctx = await newCtx(b, { w, h, text });
const p = await ctx.newPage();
await openNewbie(p, rev.dev, {});
await fillStorage(p);
await todayAfterEnd(p, true);
await sleep(300);
await p.evaluate((W) => {
  window.__snap = () => {
    const dock = [...document.querySelectorAll('[data-toast-above]')].map((e) => e.getBoundingClientRect()).filter((r) => r.height > 0);
    const dockTop = dock.length ? Math.round(Math.min(...dock.map((r) => r.top))) : null;
    const dockBottom = dock.length ? Math.round(Math.max(...dock.map((r) => r.bottom))) : null;
    const cbl = [...document.querySelectorAll('button')].find((e) => /Change brew length/.test(e.textContent))?.getBoundingClientRect();
    const region = document.querySelector('[aria-label="Notifications"]').parentElement;
    const wr = document.getElementById(W)?.getBoundingClientRect();
    return { scrollY: Math.round(scrollY), max: Math.round(document.documentElement.scrollHeight - innerHeight), warn: !!wr, warnTB: wr ? [Math.round(wr.top), Math.round(wr.bottom)] : null, dockTop, dockBottom, dockBottomOver60pct: dockBottom != null && dockBottom > innerHeight * 0.6, changeLinkTB: cbl ? [Math.round(cbl.top), Math.round(cbl.bottom)] : null, regionBottom: Math.round(region.getBoundingClientRect().bottom), regionStyleBottom: region.style.bottom || '' };
  };
}, WARN);
await p.mouse.move(187, 200);
const rows = [];
const snap = async (label) => { const r = await p.evaluate(() => window.__snap()); rows.push({ label, ...r }); log(JSON.stringify(rows.at(-1))); return r; };
await snap('start');
let guard = 0;
for (;;) {
  await p.mouse.wheel(0, step); await sleep(320);
  const r = await snap(`down +${step}`);
  if (r.scrollY >= r.max - 1 || ++guard > 60) break;
}
await sleep(1200);
await snap('at end, +1.2 s');
await p.screenshot({ path: `${dir}/${tag}-end.png` });
for (let i = 0; i < 40; i++) { await p.mouse.wheel(0, -step * 2); await sleep(320); const r = await snap(`up -${step * 2}`); if (r.scrollY <= 0) break; }
await sleep(1500);
await snap('top, +1.5 s');
const absent = rows.filter((r) => !r.warn).map((r) => r.scrollY);
log(`SUMMARY ${tag}: warning absent at scrollY ${JSON.stringify(absent)}; max scroll ${rows[0].max}`);
writeFileSync(`${dir}/${tag}.json`, JSON.stringify({ tag, url: rev.dev, rows }, null, 1));
await b.close();
log(`END ${stamp()}`);
