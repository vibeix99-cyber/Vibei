// L1 (round-8 review) independent probe for R7-D1 / the toast dock. Setup copied from M8's accept.mjs (sha b65020ab) and the
// lead's toastroom2.mjs (sha 7123da04): onboarded profile, debug startFocus/finish, Tea time by a REAL tap, break finished
// by the debug API; the break's own toasts expire on their real timers. Toasts through the app's own toast() (labelled
// setup; the update prompt in PwaUpdatePrompt's shape, duration Infinity). Scrolling by REAL input only (page.mouse.wheel
// or CDP Input.dispatchTouchEvent drags). No scrollIntoView / scrollTo / scrollTop writes.
// What it adds to accept.mjs:
//   * per frame (rAF), EVERY visible control on the page (button, a[href], [role=button], input, select, textarea), not
//     only four named ones: elementFromPoint at its visible centre must hit it and no painted toast may overlap it > 1 px;
//   * per frame, every toast: visible px (viewport + list scrollport) vs its box and its own height (scrollHeight);
//     frames with a toast not whole, split into <= 600 ms after an input/toast event and later (settled);
//   * REAL taps on Update while it is FOLDED / with 3 toasts up at the panel's end, and on Undo, each by the run's input;
//   * scroll BACK to the top with a docked 3-stack: where it sits, whether it is whole, and a real tap on Update there.
//   node l1dock.mjs <base> <rev> <out> "667x375@200:light,..." <wheel|touch>[,...]
import { chromium } from 'playwright';
import { mkdirSync, appendFileSync } from 'node:fs';
const [,, base, rev, out, cfgArg, modeArg = 'wheel,touch'] = process.argv;
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cfgs = cfgArg.split(',').map((c) => { const m = c.match(/^(\d+)x(\d+)@(\d+):(light|dark)$/); return { W: +m[1], H: +m[2], text: +m[3], theme: m[4] }; });
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const INSTALL = () => {
  const w = window;
  const R = (w.__l1 = { frames: 0, ctlBad: [], toastBad: [], last: performance.now(), stop: false, upd: 0, undo: 0 });
  w.__l1Event = () => { R.last = performance.now(); };
  const region = () => document.querySelector('[aria-label="Notifications"]');
  w.__l1Toasts = () => {
    const ol = document.querySelector('[aria-label="Notifications"] ol');
    const clip = ol && getComputedStyle(ol).overflowY !== 'visible' ? ol.getBoundingClientRect() : null;
    return [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => {
      const q = li.getBoundingClientRect();
      let t = Math.max(q.top, 0), b = Math.min(q.bottom, innerHeight);
      if (clip) { t = Math.max(t, clip.top); b = Math.min(b, clip.bottom); }
      return { text: li.textContent.slice(0, 20), box: Math.round(q.height), natural: li.scrollHeight, vis: Math.max(0, Math.round(b - t)), op: +getComputedStyle(li).opacity, folded: li.hasAttribute('data-folded'), r: { l: q.left, t: Math.max(t, q.top), rt: q.right, b: Math.min(b, q.bottom) } };
    });
  };
  w.__l1Controls = () => {
    const reg = region();
    const boxes = w.__l1Toasts().filter((x) => x.op > 0.02 && x.r.b > x.r.t).map((x) => x.r);
    const out = [];
    for (const el of document.querySelectorAll('button, a[href], [role=button], input, select, textarea')) {
      if (reg && reg.contains(el)) continue;
      if (el.closest('[aria-hidden="true"], [inert]')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.05) continue;
      const q = el.getBoundingClientRect();
      if (q.width < 4 || q.height < 4) continue;
      let t = Math.max(q.top, 0), b = Math.min(q.bottom, innerHeight);
      const sc = el.closest('[data-focus-view] main');
      if (sc) { const m = sc.getBoundingClientRect(); t = Math.max(t, m.top); b = Math.min(b, m.bottom); }
      const l = Math.max(q.left, 0), rt = Math.min(q.right, innerWidth);
      if (b - t < 8 || rt - l < 8) continue;
      const name = (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 28);
      const hit = document.elementFromPoint((l + rt) / 2, (t + b) / 2);
      const hitOk = !!hit && (el.contains(hit) || hit.contains(el));
      const under = boxes.some((o) => o.b > t + 1 && o.t < b - 1 && o.rt > l + 1 && o.l < rt - 1);
      if (!hitOk || under) out.push(`${name}${hitOk ? '' : ' hit:' + ((hit && (hit.closest('li,button')?.textContent || hit.tagName)) || 'none').slice(0, 18)}${under ? ' overlap' : ''}`);
    }
    return out;
  };
  const f = () => {
    if (R.stop) return;
    const since = Math.round(performance.now() - R.last);
    const c = w.__l1Controls();
    if (c.length) R.ctlBad.push({ since, c });
    const ts = w.__l1Toasts().filter((x) => x.op > 0.98 && (x.vis < x.box - 1 || x.natural > x.box + 1));
    if (ts.length) R.toastBad.push({ since, ts: ts.map((x) => `${x.text}:${x.vis}/${x.box}/${x.natural}`) });
    R.frames++;
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
};
const SAMPLE = () => {
  const reg = document.querySelector('[aria-label="Notifications"]')?.parentElement;
  const m = document.querySelector('[data-focus-view] main');
  const stage = document.querySelector('[data-toast-dock]');
  const rr = reg?.getBoundingClientRect(), sr = stage?.getBoundingClientRect();
  const toasts = window.__l1Toasts().map((x) => { const li = [...document.querySelectorAll('[aria-label="Notifications"] li')].find((l) => l.textContent.startsWith(x.text)); const a = li?.querySelector('button'); let actHit = null; if (a) { const q = a.getBoundingClientRect(); const h = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); actHit = !!h && a.contains(h); } return { text: x.text, box: x.box, natural: x.natural, vis: x.vis, folded: x.folded, rect: [x.r.l, x.r.t, x.r.rt, x.r.b].map(Math.round), actHit }; });
  return { panel: m ? [Math.round(m.scrollTop), m.scrollHeight - m.clientHeight] : null, docked: !!reg?.hasAttribute('data-docked'), region: rr ? [rr.left, rr.top, rr.right, rr.bottom].map(Math.round) : null, stage: sr ? [sr.left, sr.top, sr.right, sr.bottom].map(Math.round) : null, toasts, ctlBadNow: window.__l1Controls() };
};
for (const { W, H, text, theme } of cfgs) for (const input of modeArg.split(',')) {
  const tag = `${rev}-${W}x${H}-t${text}-${theme}-${input}`;
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
  await ctx.addInitScript((pct) => {
    try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {}
    if (pct !== 100) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); });
  }, text);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  const row = { rev, base, W, H, text, theme, input, utc: new Date().toISOString(), samples: [], taps: [], notes: [] };
  const ev = () => page.evaluate(() => window.__l1Event?.());
  const panel = () => page.evaluate(() => { const m = document.querySelector('[data-focus-view] main'); const r = m.getBoundingClientRect(); return { st: m.scrollTop, max: m.scrollHeight - m.clientHeight, x: Math.round(r.right - 24), y: Math.round(Math.min(innerHeight, r.bottom) - 16) }; });
  const tapTouch = async (x, y) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(60); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
  const touchDrag = async (x, y, dy) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + (dy * i) / 8 }] }); await sleep(20); } await sleep(60); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
  const goTo = async (where) => {
    for (let i = 0; i < 40; i++) {
      const p = await panel();
      if (p.max <= 0) { row.notes.push(`${where}: panel does not scroll`); return; }
      if (where === 'top' && p.st <= 0.5) return;
      if (where === 'end' && p.st >= p.max - 0.5) return;
      const dir = where === 'top' ? -1 : 1;
      await ev();
      if (input === 'touch') await touchDrag(p.x, dir > 0 ? Math.max(40, p.y - 110) + 100 : Math.max(40, p.y - 110), dir > 0 ? -70 : 70);
      else { await page.mouse.move(p.x, p.y); await page.mouse.wheel(0, 60 * dir); }
      await sleep(240); await ev();
    }
    row.notes.push(`${where}: not reached`);
  };
  const raise = (which) => page.evaluate(async (which) => {
    const { toast } = await import('/src/ui/Toast.tsx'); const w = window;
    if (which === 'update') toast('A fresh brew of Kettle is ready.', { id: 'pwa-update', icon: 'sparkle', duration: Infinity, action: { label: 'Update', onClick: () => { w.__l1.upd++; } } });
    if (which === 'cozy') toast('Cozy level 5!', { tone: 'success' });
    if (which === 'undo') toast('Marked “Chapter 3 notes” done', { tone: 'success', action: { label: 'Undo', onClick: () => { w.__l1.undo++; } } });
    w.__l1Event();
  }, which);
  const tap = async (label, where) => {
    const box = await page.evaluate((label) => { const b = [...document.querySelectorAll('[aria-label="Notifications"] li button')].find((x) => x.textContent.trim() === label); if (!b) return null; const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, folded: b.closest('li').hasAttribute('data-folded'), n: document.querySelectorAll('[aria-label="Notifications"] li').length }; }, label);
    if (!box) { row.taps.push({ where, label, result: 'absent' }); return; }
    const key = label === 'Update' ? 'upd' : 'undo';
    const before = await page.evaluate((k) => window.__l1[k], key);
    const hash0 = await page.evaluate(() => location.hash);
    await ev();
    if (input === 'touch') await tapTouch(box.x, box.y); else await page.mouse.click(box.x, box.y);
    await sleep(450); await ev();
    const after = await page.evaluate((k) => window.__l1[k], key);
    const hash1 = await page.evaluate(() => location.hash);
    row.taps.push({ where, label, how: input === 'touch' ? 'touch' : 'click', n: box.n, folded: box.folded, at: [Math.round(box.x), Math.round(box.y)], activated: after === before + 1, pageChanged: hash0 !== hash1 });
  };
  const count = () => page.evaluate(() => document.querySelectorAll('[aria-label="Notifications"] li').length);
  const waitCount = async (n, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await count()) === n) return true; await sleep(100); } return false; };
  const sample = async (label) => row.samples.push({ label, ...(await page.evaluate(SAMPLE)) });
  try {
    await page.goto(`${base}/?debug&seed=newbie&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`);
    await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60_000 });
    await page.evaluate(() => document.fonts.ready); await sleep(800);
    await page.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
    await sleep(1500);
    await page.evaluate(() => window.__kettle.nearEnd()); await sleep(400); await page.evaluate(() => window.__kettle.finish());
    const tea = page.getByRole('button', { name: /Tea time|Long tea break/ });
    await tea.waitFor({ state: 'visible', timeout: 60_000 }); await sleep(2000);
    const b = await tea.boundingBox();
    await tapTouch(b.x + b.width / 2, b.y + b.height / 2);
    await page.getByRole('button', { name: 'Pause break' }).waitFor({ state: 'attached', timeout: 20_000 });
    await sleep(1200);
    await page.evaluate(() => window.__kettle.finish());
    await page.getByRole('button', { name: /Put the kettle on/ }).waitFor({ state: 'attached' });
    if (!(await waitCount(0, 15_000))) row.notes.push('break toasts still up after 15 s');
    await sleep(500);
    await page.evaluate(INSTALL);
    // A: three toasts at the panel's top
    await raise('update'); await sleep(300); await raise('cozy'); await sleep(300); await raise('undo'); await sleep(800);
    await sample('top n3');
    // B: real input to the end with the 3 toasts up (the 3.2 s / 5 s timers may run out during the gesture)
    await goTo('end'); await sleep(300);
    await sample('end after gesture');
    // C: at the end, 3 toasts again (update oldest -> folded at 200 %), tap Update first
    await raise('cozy'); await sleep(250); await raise('undo'); await sleep(800);
    await sample('end n3');
    await page.screenshot({ path: `${out}/${tag}-end-n3.png` });
    await tap('Update', 'end n3');
    await sleep(300); await sample('end after Update tap');
    // D: re-raise update, then two more; tap Undo
    await raise('update'); await sleep(250); await raise('cozy'); await sleep(250); await raise('undo'); await sleep(800);
    await sample('end n3 (2)');
    await tap('Undo', 'end n3 (2)');
    // E: raise Undo again; scroll back to the top with the docked stack
    await raise('undo'); await sleep(500);
    await goTo('top'); await sleep(500);
    await sample('back at top');
    await page.screenshot({ path: `${out}/${tag}-back-top.png` });
    await tap('Update', 'back at top');
    await sleep(300); await sample('back at top after Update tap');
    await waitCount(0, 7000); await sleep(500);
    await raise('update'); await sleep(800);
    await sample('top fresh n1');
    const rec = await page.evaluate(() => { const R = window.__l1; R.stop = true; return { frames: R.frames, ctlBad: R.ctlBad.length, ctlBadSettled: R.ctlBad.filter((x) => x.since > 600).length, ctlFirst: R.ctlBad.slice(0, 4), toastBad: R.toastBad.length, toastBadSettled: R.toastBad.filter((x) => x.since > 600).length, toastFirst: R.toastBad.filter((x) => x.since > 600).slice(0, 4), toastFirstAny: R.toastBad.slice(0, 3) }; });
    row.frames = rec;
    await page.screenshot({ path: `${out}/${tag}-final-top.png` });
  } catch (e) { row.error = String(e.message).split('\n')[0]; }
  row.errors = errors.slice(0, 3);
  appendFileSync(`${out}/l1dock-${rev}.jsonl`, JSON.stringify(row) + '\n');
  console.log(JSON.stringify({ tag, err: row.error, frames: row.frames?.frames, ctlBad: row.frames?.ctlBad, ctlBadSettled: row.frames?.ctlBadSettled, toastBad: row.frames?.toastBad, toastBadSettled: row.frames?.toastBadSettled, taps: row.taps.map((t) => `${t.where}/${t.label}/${t.how}/n${t.n}${t.folded ? '/folded' : ''}:${t.activated ? 'ok' : 'FAIL'}${t.pageChanged ? '/PAGE-CHANGED' : ''}`), docked: row.samples.map((s) => `${s.label}:${s.docked ? 'D' : '-'}`).join(' '), notes: row.notes }));
  await ctx.close();
}
await browser.close();
