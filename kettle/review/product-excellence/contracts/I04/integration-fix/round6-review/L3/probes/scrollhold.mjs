// L3 3a (cause): does the warning get withdrawn by the PAGE SCROLL ALONE (real wheel, no Tab)? 375x667, Today, warning up.
// node scrollhold.mjs --rev=R6|INT --text=100
import { REV, launch, newCtx, openNewbie, fillStorage, sleep, args, logger, OUT, stamp, todayAfterEnd, WARN } from './lib.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const a = args();
const rev = REV[a.rev ?? 'R6'];
const text = +(a.text ?? 100), w = 375, h = 667;
const dir = `${OUT}/3a`; mkdirSync(dir, { recursive: true });
const tag = `${rev.name}-scrollhold-t${text}`;
const log = logger(`${dir}/${tag}.log`);
log(`RUN 3a-cause ${tag} url=${rev.dev} rev=${rev.name}@${rev.commit} viewport=${w}x${h} text=${text}% start=${stamp()}`);
const b = await launch();
const ctx = await newCtx(b, { w, h, text });
const p = await ctx.newPage();
await openNewbie(p, rev.dev, {});
await fillStorage(p);
await todayAfterEnd(p, true);
await sleep(500);
await p.evaluate((W) => {
  const sel = 'button, a[href], [role="button"], input, textarea, select';
  window.__rule = () => {
    let top = Infinity;
    for (const el of document.querySelectorAll('[data-toast-above]')) { if (el.closest('[aria-hidden="true"], [inert]')) continue; const r = el.getBoundingClientRect(); if (r.height > 0 && r.top < innerHeight && r.bottom > innerHeight * 0.6) top = Math.min(top, r.top); }
    const lift = top === Infinity ? null : Math.round(innerHeight - top + 10);
    const region = document.querySelector('[aria-label="Notifications"]').parentElement;
    const bottom = lift != null ? innerHeight - lift : region.getBoundingClientRect().bottom;
    const hit = [];
    const area = document.querySelector('[aria-label="Notifications"]').getBoundingClientRect();
    for (const el of document.querySelectorAll(`[data-toast-above] :is(${sel})`)) { const r = el.getBoundingClientRect(); if (r.width && r.height && r.bottom > bottom - 170 && r.top < bottom) hit.push((el.textContent || '').trim().slice(0, 22) + '@' + Math.round(r.top) + '-' + Math.round(r.bottom)); }
    return { scrollY: Math.round(scrollY), maxScroll: Math.round(document.documentElement.scrollHeight - innerHeight), warn: !!document.getElementById(W), lift, zone: [Math.round(bottom - 170), Math.round(bottom)], hit };
  };
  window.__ev = []; const t0 = performance.now();
  new MutationObserver((ms) => { for (const m of ms) { for (const x of m.addedNodes) if (x.tagName === 'LI') window.__ev.push([Math.round(performance.now() - t0), '+']); for (const x of m.removedNodes) if (x.tagName === 'LI') window.__ev.push([Math.round(performance.now() - t0), '-']); } }).observe(document.body, { childList: true, subtree: true });
  window.__t0 = t0;
}, WARN);
await p.mouse.move(187, 250);
const rows = [];
rows.push({ step: 'start', ...(await p.evaluate(() => ({ t: Math.round(performance.now() - window.__t0), ...window.__rule() }))) });
for (let i = 1; i <= 14; i++) {
  await p.mouse.wheel(0, 100); await sleep(350);
  const r = await p.evaluate(() => ({ t: Math.round(performance.now() - window.__t0), ...window.__rule() }));
  rows.push({ step: `wheel+100 #${i}`, ...r }); log(JSON.stringify(rows.at(-1)));
  if (!r.warn) break;
}
await p.screenshot({ path: `${dir}/${tag}-scrolled.png` });
for (let i = 1; i <= 10; i++) {
  await p.mouse.wheel(0, -200); await sleep(350);
  const r = await p.evaluate(() => ({ t: Math.round(performance.now() - window.__t0), ...window.__rule() }));
  rows.push({ step: `wheel-200 #${i}`, ...r }); log(JSON.stringify(rows.at(-1)));
}
await sleep(4500);
rows.push({ step: 'settled', ...(await p.evaluate(() => ({ t: Math.round(performance.now() - window.__t0), ...window.__rule() }))) });
log(JSON.stringify(rows.at(-1)));
log('warning li events (ms)', JSON.stringify(await p.evaluate(() => window.__ev)));
writeFileSync(`${dir}/${tag}.json`, JSON.stringify({ tag, url: rev.dev, rows, events: await p.evaluate(() => window.__ev) }, null, 1));
await b.close();
log(`END ${stamp()}`);
