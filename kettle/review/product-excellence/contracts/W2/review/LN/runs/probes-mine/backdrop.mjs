// Lane N · check 1/2/6: Focus backdrop. groups: off (scene off, reload, tap brew, ~4 s), live (scene auto, wait engine ready, ~4 s), loading (brew 0.3 s after cold load, handover frames, CLS, requests)
// node backdrop.mjs --base http://127.0.0.1:5350 --label trial --out <dir> --cfgs 390x844@3:light:100,... [--groups off,live,loading]
import { mkdirSync, writeFileSync } from 'node:fs';
import { parseArgs, parseCfg, newCtx, ready, settings, tapOrClick, brewBtn, installCls, measure, shot, launch, sleep } from './common.mjs';
const A = parseArgs();
const groups = (A.groups || 'off,live,loading').split(',');
for (const cfgS of A.cfgs.split(',')) {
  const c = parseCfg(cfgS);
  const dir = `${A.out}/${A.label}/${c.tag}`; mkdirSync(dir, { recursive: true });
  const meta = { cfg: cfgS, base: A.base, label: A.label, startedAt: new Date().toISOString(), errors: [], console: [], states: {} };
  const b = await launch();
  const q = `${A.base}/?debug&seed=${A.seed || 'veteran'}&theme=${c.theme}${A.extra || ''}`;
  const run = async (name, fn) => {
    if (!groups.includes(name)) return;
    const { ctx, p } = await newCtx(b, c, meta);
    try { await fn(p); } catch (e) { meta.errors.push(`${name}: ${e.message.slice(0, 200)}`); }
    await ctx.close();
  };
  await run('off', async (p) => {
    await p.goto(q + '#/'); await ready(p);
    await settings(p, { scene: 'off', muted: true, autoStartBreaks: false, autoStartFocus: false });
    await p.reload(); await ready(p); await p.evaluate(() => document.fonts.ready); await sleep(1200);
    await installCls(p);
    await tapOrClick(p, c, brewBtn(p)); await sleep(4000);
    await shot(p, `${dir}/off`); meta.states.off = await measure(p);
    if (A.nolayers) { await p.evaluate(() => document.querySelectorAll('svg[data-window-items]').forEach((e) => { e.style.display = 'none'; })); await sleep(300); await shot(p, `${dir}/offbase`); }
  });
  await run('live', async (p) => {
    await p.goto(q + '#/'); await ready(p);
    await settings(p, { muted: true, autoStartBreaks: false, autoStartFocus: false }); await sleep(1500);
    await installCls(p);
    const t0 = Date.now();
    await tapOrClick(p, c, brewBtn(p));
    // wait for the live engine (host ready, canvas present), then hold until >= 4 s after the tap
    await p.waitForFunction(() => { const h = document.querySelector('[data-scene-mode="window"]'); return !!h && h.getAttribute('data-scene-ready') === 'true' && !!h.querySelector('canvas'); }, null, { timeout: 120_000, polling: 200 }).catch(() => meta.errors.push('live: engine never ready'));
    meta.liveReadyAfterTapMs = Date.now() - t0;
    await sleep(Math.max(0, 4000 - (Date.now() - t0))); await sleep(800);
    await shot(p, `${dir}/live`); meta.states.live = await measure(p);
  });
  await run('loading', async (p) => {
    const reqs = []; const t00 = Date.now();
    p.on('request', (r) => { if (/(pothos|books|fairyLights|shelf|recordPlayer|monstera|telescope|kotatsu)-(morning|day|dusk|night)-(clear|rain|snow)[-.][^/]*\.webp|window-[a-z]+-[a-z]+.*\.webp|NookScene|three/i.test(r.url())) reqs.push({ t: Date.now() - t00, url: r.url().split('/').slice(-2).join('/').slice(0, 90) }); });
    const cdp = await p.context().newCDPSession(p);
    const frames = [];
    cdp.on('Page.screencastFrame', async (f) => { frames.push({ ts: f.metadata.timestamp * 1000, data: f.data }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
    await p.goto(q + '#/', { waitUntil: 'commit' });
    await p.waitForFunction(() => !!window.__kettle, null, { timeout: 60_000, polling: 50 });
    await settings(p, { muted: true, autoStartBreaks: false, autoStartFocus: false });
    await installCls(p);
    await p.waitForSelector('button', { timeout: 30_000 });
    const btn = brewBtn(p); await btn.waitFor({ timeout: 30_000 });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, maxWidth: Math.min(c.W * 2, 800), maxHeight: Math.min(c.H * 2, 800), everyNthFrame: 1 });
    const tTap = Date.now(); meta.sinceNavAtTapMs = tTap - t00;
    await tapOrClick(p, c, btn);
    const timeline = []; let lastKey = '';
    const poll = async () => {
      const s = await p.evaluate(() => { const h = document.querySelector('[data-scene-mode="window"]'); if (!h) return null; return { st: h.getAttribute('data-scene-static'), rd: h.getAttribute('data-scene-ready'), cv: !!h.querySelector('canvas'), im: h.querySelectorAll('image[data-item]').length, img: !!h.querySelector('img'), ic: (() => { const i = h.querySelector('img'); return i ? i.complete && i.naturalWidth > 0 : null; })(), hash: location.hash }; }).catch(() => null);
      const key = JSON.stringify(s); if (key !== lastKey) { timeline.push({ t: Date.now() - tTap, ...s }); lastKey = key; }
      return s;
    };
    let shot05 = false; const tEnd = Date.now() + 90_000;
    while (Date.now() < tEnd) {
      const s = await poll();
      if (!shot05 && Date.now() - tTap > 450) { shot05 = true; meta.states.loading05 = await measure(p); meta.states.loading05.tShotMs = Date.now() - tTap; }
      if (s && s.rd === 'true' && s.cv && Date.now() - tTap > 8000) break;
      await sleep(60);
    }
    await sleep(2500); await poll();
    await cdp.send('Page.stopScreencast');
    meta.timeline = timeline; meta.requests = reqs.slice(0, 80);
    meta.states.loadingEnd = await measure(p);
    // keep the frames in a compact file: ts relative to tap
    writeFileSync(`${dir}/frames.json`, JSON.stringify({ tTap, frames }));
    meta.frameCount = frames.length;
  });
  meta.endedAt = new Date().toISOString();
  writeFileSync(`${dir}/meta.json`, JSON.stringify(meta, null, 1));
  await b.close();
  console.log(A.label, c.tag, 'states', Object.keys(meta.states).join(','), 'errors', meta.errors.length, meta.errors.slice(0, 2).join(' | '));
}
