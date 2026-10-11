// Lane N · checks 3 + 4: Nook hint (3D off / no WebGL / 3D on), dismissal, wrapping, static Nook, 3D drag + tap, celebrate unlock.
// node room2.mjs --base URL --label ctrl|trial --out dir --cfgs ... --groups static,nowebgl,live,unlock
import { mkdirSync, writeFileSync } from 'node:fs';
import { parseArgs, parseCfg, newCtx, ready, settings, tapOrClick, brewBtn, measure, shot, launch, sleep } from './common.mjs';
const A = parseArgs();
const groups = (A.groups || 'static,nowebgl,live,unlock').split(',');
const hintInfo = (p) => p.evaluate(() => {
  const el = [...document.querySelectorAll('section[aria-label="The room"] p')].find((e) => /look around|drawing of your room/i.test(e.textContent || ''));
  const stage = document.querySelector('section[aria-label="The room"] > div');
  const ls = (() => { try { return { live: localStorage.getItem('kettle:nook-hint-seen'), drawn: localStorage.getItem('kettle:nook-static-hint-seen') }; } catch { return 'n/a'; } })();
  const host = document.querySelector('section[aria-label="The room"] [data-scene-mode]');
  const base = { ls, host: host ? { mode: host.getAttribute('data-scene-mode'), static: host.getAttribute('data-scene-static'), ready: host.getAttribute('data-scene-ready'), canvas: !!host.querySelector('canvas'), img: !!host.querySelector('img'), svgItems: [...host.querySelectorAll('[data-item]')].length } : null };
  if (!el) return { present: false, ...base };
  const r = el.getBoundingClientRect(), sr = stage.getBoundingClientRect();
  const tn = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  let lines = null; if (tn) { const rg = document.createRange(); rg.selectNodeContents(tn); lines = new Set([...rg.getClientRects()].map((q) => Math.round(q.top))).size; }
  const svg = el.querySelector('svg');
  const cs = getComputedStyle(el);
  return { present: true, text: el.textContent.trim(), lines, rect: [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 10) / 10), stage: [sr.x, sr.y, sr.width, sr.height].map((v) => Math.round(v * 10) / 10), insideStage: r.left >= sr.left - 0.5 && r.right <= sr.right + 0.5 && r.top >= sr.top - 0.5 && r.bottom <= sr.bottom + 0.5, whiteSpace: cs.whiteSpace, opacity: cs.opacity, iconLen: svg ? svg.outerHTML.length : 0, iconHead: svg ? svg.innerHTML.slice(0, 90) : null, dataStatic: el.getAttribute('data-static'), ...base };
});
const goNook = async (p, c) => {
  const l = p.getByRole('link', { name: /^nook$/i }).first();
  if (await l.count()) await tapOrClick(p, c, l); else await tapOrClick(p, c, p.getByRole('button', { name: /^nook$/i }).first());
  await p.waitForFunction(() => location.hash.includes('nook'), null, { timeout: 15_000 }).catch(() => {});
};
const stageBox = (p) => p.evaluate(() => { const e = document.querySelector('section[aria-label="The room"] > div'); const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
for (const cfgS of A.cfgs.split(',')) {
  const c = parseCfg(cfgS);
  const dir = `${A.out}/${A.label}/${c.tag}`; mkdirSync(dir, { recursive: true });
  const meta = { cfg: cfgS, base: A.base, label: A.label, startedAt: new Date().toISOString(), errors: [], console: [], r: {} };
  const b = await launch();
  const q = (seed) => `${A.base}/?debug&seed=${seed}&theme=${c.theme}`;
  const run = async (name, fn, ctxHook) => {
    if (!groups.includes(name)) return;
    const { ctx, p } = await newCtx(b, c, meta);
    if (ctxHook) await ctxHook(ctx, p);
    try { await fn(p); } catch (e) { meta.errors.push(`${name}: ${e.message.slice(0, 200)}`); }
    await ctx.close();
  };
  const staticFlow = (name) => async (p) => {
    await p.goto(q('veteran') + '#/'); await ready(p);
    if (name === 'static') { await settings(p, { scene: 'off', muted: true }); await p.reload(); await ready(p); }
    else await settings(p, { muted: true });
    await p.evaluate(() => document.fonts.ready);
    await goNook(p, c); await sleep(3000);
    const r = { before: await hintInfo(p) };
    await shot(p, `${dir}/${name}-nook`, { back: false });
    const sb = await stageBox(p);
    // dismissal: a real tap on the stage (pointerdown) at its centre
    if (c.touch) await p.touchscreen.tap(sb.x + sb.w / 2, sb.y + sb.h * 0.55); else await p.mouse.click(sb.x + sb.w / 2, sb.y + sb.h * 0.55);
    await sleep(1800); r.afterTap = await hintInfo(p);
    await p.reload(); await ready(p); await sleep(1500); await goNook(p, c).catch(() => {}); await sleep(2500); r.afterReload = await hintInfo(p);
    meta.r[name] = r;
  };
  await run('static', staticFlow('static'));
  await run('nowebgl', staticFlow('nowebgl'), async (ctx) => { await ctx.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { if (/webgl/i.test(t)) return null; return g.call(this, t, ...a); }; }); });
  await run('live', async (p) => {
    await p.goto(q('veteran') + '#/'); await ready(p); await settings(p, { muted: true }); await p.evaluate(() => document.fonts.ready);
    await goNook(p, c);
    await p.waitForFunction(() => { const h = document.querySelector('section[aria-label="The room"] [data-scene-mode]'); return !!h && h.getAttribute('data-scene-ready') === 'true' && !!h.querySelector('canvas'); }, null, { timeout: 120_000, polling: 300 }).catch(() => meta.errors.push('live nook never ready'));
    await sleep(2500);
    const r = { before: await hintInfo(p) };
    await shot(p, `${dir}/live-nook`, { back: false });
    const sb = await stageBox(p);
    // tap grid first (item select), before any drag: which taps open a story
    const taps = [];
    const story = () => p.evaluate(() => { const s = document.querySelector('section[aria-label="The room"] [aria-live="polite"][id]'); return s ? s.textContent.trim().slice(0, 40) : null; });
    // real drag (touch via CDP on phones, mouse otherwise); compare canvas pixels before/after
    const cx = sb.x + sb.w * 0.5, cy = sb.y + sb.h * 0.6;
    const before = await p.screenshot({ animations: 'disabled', timeout: 120_000, clip: { x: sb.x, y: sb.y, width: sb.w, height: sb.h } });
    if (c.touch) {
      const cdp = await p.context().newCDPSession(p);
      const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
      await tp('touchStart', cx, cy); for (let i = 1; i <= 10; i++) { await tp('touchMove', cx - i * 12, cy); await sleep(25); } await tp('touchEnd'); await sleep(900);
    } else {
      await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 12; i++) { await p.mouse.move(cx - i * 14, cy, { steps: 2 }); await sleep(25); } await p.mouse.up(); await sleep(900);
    }
    const after = await p.screenshot({ animations: 'disabled', timeout: 120_000, clip: { x: sb.x, y: sb.y, width: sb.w, height: sb.h } });
    writeFileSync(`${dir}/live-drag-before.png`, before); writeFileSync(`${dir}/live-drag-after.png`, after);
    r.afterDrag = await hintInfo(p);
    const full = c.tag === '390x844-light-t100'; const gx = full ? [0.2, 0.35, 0.5, 0.65, 0.8] : [0.2, 0.5, 0.8], gy = full ? [0.3, 0.45, 0.6, 0.75] : [0.3, 0.6];
    for (const fy of gy) for (const fx of gx) {
      const x = sb.x + sb.w * fx, y = sb.y + sb.h * fy;
      if (c.touch) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y);
      await sleep(500); const s = await story(); taps.push({ fx, fy, story: s });
    }
    r.taps = taps;
    meta.r.live = r;
  });
  await run('unlock', async (p) => {
    await p.goto(q('celebrate') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready);
    await settings(p, { muted: true, autoStartBreaks: false, autoStartFocus: false }); await sleep(1200);
    await tapOrClick(p, c, brewBtn(p)); await sleep(2500);
    const cdp = await p.context().newCDPSession(p); const frames = [];
    cdp.on('Page.screencastFrame', (f) => { frames.push({ ts: f.metadata.timestamp * 1000, data: f.data }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, maxWidth: Math.min(c.W * 2, 800), maxHeight: Math.min(c.H * 2, 800), everyNthFrame: 1 });
    const t0 = Date.now();
    await p.evaluate(() => window.__kettle.finish());
    await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 }).catch(() => {});
    await sleep(4500);
    await cdp.send('Page.stopScreencast');
    await shot(p, `${dir}/unlock-summary`, { back: false });
    meta.r.unlock = await measure(p);
    writeFileSync(`${dir}/unlock-frames.json`, JSON.stringify({ tTap: t0, frames }));
    meta.r.unlockFrames = frames.length;
  });
  meta.endedAt = new Date().toISOString();
  writeFileSync(`${dir}/room2-meta.json`, JSON.stringify(meta, null, 1));
  await b.close();
  console.log(A.label, c.tag, Object.keys(meta.r).join(','), 'errors', meta.errors.length, meta.errors.slice(0, 3).join(' | '));
}
