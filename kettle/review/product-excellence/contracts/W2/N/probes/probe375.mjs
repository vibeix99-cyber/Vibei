// 375×667 "room behind Chai disappears" probe. One browser per invocation (run under the slot gate).
// node .tmp/n/probe375.mjs --base http://127.0.0.1:5310 --out <dir> --path audit|critic|endonly|pauseonly [--cpu 4] [--theme light]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const FIXED = Date.parse('2026-10-11T07:40:00.000Z');
const theme = args.theme || 'light';
const path = args.path || 'audit';
const cpu = +(args.cpu || 1);
const tag = `${path}-${theme}-cpu${cpu}${args.tag ? '-' + args.tag : ''}`;
const dir = `${args.out}/${tag}`;
mkdirSync(dir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = { tag, base: args.base, states: [], errors: [], console: [] };
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
const p = await ctx.newPage();
await p.clock.install({ time: FIXED });
await p.clock.resume();
p.on('pageerror', (e) => log.errors.push(e.message.slice(0, 200)));
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log.console.push(`${m.type()}: ${m.text().slice(0, 200)}`); });
if (cpu > 1) { const s = await ctx.newCDPSession(p); await s.send('Emulation.setCPUThrottlingRate', { rate: cpu }); }

const probe = () => p.evaluate(() => {
  const host = document.querySelector('[data-scene-mode="window"]');
  const n = window.__nook;
  const c = host?.querySelector('canvas');
  const still = host?.querySelector('img');
  const ch = c?.parentElement;
  return {
    hash: location.hash,
    host: host ? { ready: host.getAttribute('data-scene-ready'), static: host.getAttribute('data-scene-static'), w: Math.round(host.getBoundingClientRect().width), h: Math.round(host.getBoundingClientRect().height) } : null,
    canvas: c ? { w: c.width, h: c.height, cssW: Math.round(c.getBoundingClientRect().width), cssH: Math.round(c.getBoundingClientRect().height), hostOpacity: ch ? getComputedStyle(ch).opacity : null, vis: ch ? getComputedStyle(ch).visibility : null } : null,
    still: still ? { src: still.src.split('/').pop(), complete: still.complete, nat: still.naturalWidth } : null,
    engine: n ? { running: n.running, raf: n.raf, compiling: n.compiling, first: n.firstFrameDone, lost: n.contextLost, disposed: n.disposed, quality: n.quality, w: n.width, h: n.height, calls: n.stats?.calls, tris: n.stats?.triangles } : null,
    rootInert: document.getElementById('root')?.hasAttribute('inert'),
  };
});
// Backdrop "emptiness": colour spread over the top band of the stage (a plain gradient has a tiny spread).
const spread = async (name) => {
  const buf = await p.screenshot({ path: `${dir}/${name}.png`, animations: 'disabled', timeout: 120_000 });
  const a = await ctx.newPage();
  const r = await a.evaluate(async (b64) => {
    const bmp = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
    const c = new OffscreenCanvas(bmp.width, bmp.height); const x = c.getContext('2d'); x.drawImage(bmp, 0, 0);
    // top band: y 0..20 % (above the kettle), full width
    const d = x.getImageData(0, 0, bmp.width, Math.round(bmp.height * 0.2)).data;
    let n = 0, s = [0, 0, 0], s2 = [0, 0, 0];
    for (let i = 0; i < d.length; i += 16) { for (let k = 0; k < 3; k++) { s[k] += d[i + k]; s2[k] += d[i + k] ** 2; } n++; }
    const sd = s.map((v, k) => Math.sqrt(s2[k] / n - (v / n) ** 2));
    return { sd: +Math.max(...sd).toFixed(2), mean: s.map((v) => Math.round(v / n)) };
  }, buf.toString('base64'));
  await a.close();
  return r;
};
const snap = async (name, desc) => {
  const st = await probe().catch((e) => ({ err: e.message.slice(0, 100) }));
  const px = await spread(name).catch((e) => ({ err: e.message.slice(0, 100) }));
  log.states.push({ name, desc, t: Date.now(), ...st, top: px, blank: px.sd !== undefined ? px.sd < 6 : null });
  console.log(name, JSON.stringify({ ready: st.host?.ready, canvas: st.canvas && [st.canvas.w, st.canvas.h, st.canvas.hostOpacity], still: !!st.still, eng: st.engine && [st.engine.running, st.engine.raf, st.engine.compiling, st.engine.first, st.engine.lost, st.engine.w, st.engine.h], top: px }));
};
const click = async (name) => { const l = p.getByRole('button', { name }).first(); await l.click({ timeout: 30_000 }); };
const ready = () => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 }).catch(() => {});

try {
  await p.goto(`${args.base}/?debug&seed=veteran&theme=${theme}#/`); await ready();
  await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
  await sleep(1800);
  await click(/put the kettle on/i);
  await sleep(6000); await snap('02-focus', 'Focus 6 s');
  if (path === 'audit' || path === 'pauseonly') {
    await p.evaluate(() => window.__kettle.ff(12 * 60_000)); await sleep(1500); await snap('02b-ff', 'after ff 12 min');
    await click(/^pause$/i); await sleep(1200); await snap('03-paused', 'paused');
    await click(/^resume$/i); await sleep(1500); await snap('04-resumed', 'resumed');
  }
  if (args.crash === 'focus') {
    // Kill the GPU process (as a GPU hang / OOM under load would): every WebGL context in the browser is lost.
    const g = await ctx.newPage(); await g.goto('chrome://gpucrash').catch((e) => log.errors.push('gpucrash: ' + e.message.slice(0, 80))); await g.close().catch(() => {});
    for (const ms of [500, 2000, 6000]) { await sleep(ms === 500 ? 500 : ms === 2000 ? 1500 : 4000); await snap(`02c-gpucrash-${ms}`, `GPU process killed +${ms} ms`); }
  }
  if (path === 'audit' || path === 'endonly') {
    await click(/^end session$/i);
    for (const ms of [100, 300, 600, 1200]) { await sleep(ms === 100 ? 100 : ms - [100, 300, 600, 1200][[100, 300, 600, 1200].indexOf(ms) - 1]); await snap(`05-end-${ms}`, `end sheet +${ms} ms`); }
    await click(/keep brewing/i); await sleep(800); await snap('05b-kept', 'after Keep brewing');
    await sleep(1500); await snap('05c-kept-late', 'Keep brewing +2.3 s');
  }
  await p.evaluate(() => window.__kettle.nearEnd ? window.__kettle.nearEnd() : window.__kettle.finish());
  await sleep(1300); await snap('06-whistle', 'whistle');
  await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 }).catch(() => log.errors.push('no /done'));
  for (const ms of [0, 500, 1500, 4500, 10000]) {
    const prev = [0, 500, 1500, 4500, 10000][[0, 500, 1500, 4500, 10000].indexOf(ms) - 1] ?? 0;
    await sleep(ms - prev); await snap(`07-summary-${ms}`, `summary +${ms} ms`);
  }
} catch (e) { log.errors.push(e.message.slice(0, 300)); }
writeFileSync(`${dir}/log.json`, JSON.stringify(log, null, 1));
await b.close();
console.log(tag, 'done; errors', log.errors.length);
