// M8 (round 8) acceptance probe for R7-D1: the toast room on Break's over (carried task), REAL input only.
// Setup as the lead's toastroom2.mjs (sha 7123da04): onboarded profile, debug startFocus/finish, Tea time by a REAL tap,
// break finished by the debug API. The break's own toasts expire on their real timers (waited for, not dismissed).
// Then, per run (one viewport / text size / theme / input = wheel | touch):
//   positions top -> middle -> end -> middle -> top, reached by REAL input only (page.mouse.wheel, or CDP
//   Input.dispatchTouchEvent drags) aimed at the panel's lower right corner; no scrollIntoView/scrollTo/scrollTop writes.
//   At the first position the update prompt is raised (labelled setup, the app's own toast(), PwaUpdatePrompt's shape:
//   id pwa-update, icon sparkle, duration Infinity, action Update). At every position: sample n=1; raise "Cozy level 5!"
//   (success, real 3.2 s timer) -> sample n=2; raise 'Marked "Chapter 3 notes" done' with action Undo (real 5 s timer)
//   -> sample n=3; REAL tap (touch run: CDP touch; wheel run: mouse click) on Undo; wait for the ordinary toast to
//   expire on its own timer. At "end": REAL tap/click on Update, re-raise it. At the final "top": Update by the OTHER
//   input (click on touch runs, CDP touch on wheel runs).
//   A rAF recorder runs the whole time: per frame, every Break's over control (Mark it done, Put the kettle on, That's
//   all for now) and the top bar's Close: visible part (clipped to the panel / viewport), elementFromPoint at its
//   visible centre must hit it, and no painted toast box (clipped by the list's scrollport) may overlap it by > 1 px.
//   Covered frames are logged with time since the last input / toast event.
//   Samples: each toast's box height, natural height (scrollHeight), visible px (list scrollport + viewport), its
//   action's hit-test; the region's rect; whether docked; top-bar text overlapped by a toast.
// geom mode (portrait equality): positions top and end (wheel), n=1 (update) and n=3; records region/list/toast rects.
//   node accept.mjs <base> <rev> <out> "667x375@200:light,..." <inputs wheel,touch | geom>
import { chromium } from 'playwright';
import { mkdirSync, appendFileSync } from 'node:fs';
const [,, base, rev, out, cfgArg, modeArg = 'wheel,touch'] = process.argv;
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cfgs = cfgArg.split(',').map((c) => { const m = c.match(/^(\d+)x(\d+)@(\d+):(light|dark)$/); return { W: +m[1], H: +m[2], text: +m[3], theme: m[4] }; });
const modes = modeArg.split(',');
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });

const INSTALL = () => {
  const w = window;
  const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
  const NAMES = ['^Close$', '^Mark it done', '^Put the kettle on', "^That's all for now$"];
  const R = (w.__acc = { frames: 0, covered: [], lastEvent: performance.now(), stop: false, upd: 0, undo: 0 });
  w.__accEvent = () => { R.lastEvent = performance.now(); };
  const toastBoxes = () => {
    const ol = document.querySelector('[aria-label="Notifications"] ol');
    const clip = ol && getComputedStyle(ol).overflowY !== 'visible' ? ol.getBoundingClientRect() : null;
    return [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => {
      const q = li.getBoundingClientRect();
      const r = clip ? { l: Math.max(q.left, clip.left), t: Math.max(q.top, clip.top), r: Math.min(q.right, clip.right), b: Math.min(q.bottom, clip.bottom) } : { l: q.left, t: q.top, r: q.right, b: q.bottom };
      return +getComputedStyle(li).opacity > 0.02 && r.r > r.l && r.b > r.t ? r : null;
    }).filter(Boolean);
  };
  w.__accControls = () => {
    const main = document.querySelector('[data-focus-view] main');
    const mr = main ? main.getBoundingClientRect() : null;
    const boxes = toastBoxes();
    const res = {};
    for (const n of NAMES) {
      const el = [...document.querySelectorAll('[data-focus-view] button')].find((b) => new RegExp(n).test(norm(b.getAttribute('aria-label') || b.textContent || '')));
      if (!el) { res[n] = 'absent'; continue; }
      const q = el.getBoundingClientRect();
      const inPanel = main && main.contains(el);
      const t = Math.max(q.top, 0, inPanel ? mr.top : 0), b = Math.min(q.bottom, innerHeight, inPanel ? mr.bottom : innerHeight);
      if (b - t < 8) { res[n] = 'offscreen'; continue; }
      const hit = document.elementFromPoint(q.left + q.width / 2, (t + b) / 2);
      const hitOk = !!hit && el.contains(hit);
      const under = boxes.some((o) => o.b > t + 1 && o.t < b - 1 && o.r > q.left + 1 && o.l < q.right - 1);
      res[n] = hitOk && !under ? 'clear' : `COVERED(${hitOk ? '' : 'hit:' + ((hit && (hit.closest('li,button')?.textContent || hit.tagName)) || 'none').slice(0, 20)}${under ? ' overlap' : ''})`;
    }
    return res;
  };
  const f = () => {
    if (R.stop) return;
    const c = w.__accControls();
    const bad = Object.entries(c).filter(([, v]) => String(v).startsWith('COVERED'));
    if (bad.length) R.covered.push({ sinceEvent: Math.round(performance.now() - R.lastEvent), n: document.querySelectorAll('[aria-label="Notifications"] li').length, bad });
    R.frames++;
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
};

const SAMPLE = () => {
  const ol = document.querySelector('[aria-label="Notifications"] ol');
  const region = ol?.closest('[aria-label="Notifications"]')?.parentElement;
  let clip = null;
  if (ol && getComputedStyle(ol).overflowY !== 'visible') { const q = ol.getBoundingClientRect(); clip = { t: q.top, b: q.bottom }; }
  const toasts = [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => {
    const q = li.getBoundingClientRect();
    let t = Math.max(q.top, 0), b = Math.min(q.bottom, innerHeight);
    if (clip) { t = Math.max(t, clip.t); b = Math.min(b, clip.b); }
    const act = li.querySelector('button');
    let actHit = null;
    if (act) { const a = act.getBoundingClientRect(); const cx = a.left + a.width / 2, cy = a.top + a.height / 2; const h = cy >= 0 && cy < innerHeight ? document.elementFromPoint(cx, cy) : null; actHit = !!h && act.contains(h); }
    return { text: li.textContent.slice(0, 22), folded: li.hasAttribute('data-folded'), box: Math.round(q.height), natural: li.scrollHeight, visible: Math.max(0, Math.round(b - t)), rect: [Math.round(q.left), Math.round(q.top), Math.round(q.right), Math.round(q.bottom)], actHit };
  });
  const m = document.querySelector('[data-focus-view] main');
  const hdr = document.querySelector('[data-focus-view] header');
  const lis = [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => { const q = li.getBoundingClientRect(); return { left: q.left, right: q.right, top: clip ? Math.max(q.top, clip.t) : q.top, bottom: clip ? Math.min(q.bottom, clip.b) : q.bottom }; }).filter((r) => r.bottom > r.top);
  const barText = hdr ? [...hdr.querySelectorAll('*')].filter((e) => e.children.length === 0 && (e.textContent || '').trim()).map((e) => { const q = e.getBoundingClientRect(); return { t: (e.textContent || '').trim().slice(0, 16), q }; }).filter((x) => x.q.width > 0 && x.q.bottom > 0) : [];
  const barOverlap = barText.filter((x) => lis.some((r) => r.right > x.q.left + 1 && r.left < x.q.right - 1 && Math.max(r.top, 0) < x.q.bottom - 1 && r.bottom > x.q.top + 1)).map((x) => x.t);
  const rr = region?.getBoundingClientRect();
  return {
    panel: m ? [Math.round(m.scrollTop), m.scrollHeight - m.clientHeight] : null,
    docked: !!region?.hasAttribute('data-docked'),
    region: rr ? [Math.round(rr.left), Math.round(rr.top), Math.round(rr.right), Math.round(rr.bottom)] : null,
    clip: clip ? [Math.round(clip.t), Math.round(clip.b)] : null,
    barOverlap, toasts, controls: window.__accControls ? window.__accControls() : null,
  };
};

for (const { W, H, text, theme } of cfgs) for (const mode of modes) {
  const phone = W < 900;
  const tag = `${rev}-${W}x${H}-t${text}-${theme}-${mode}`;
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone, colorScheme: theme });
  await ctx.addInitScript((pct) => {
    try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {}
    if (pct !== 100) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); });
  }, text);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  // L1 DIAGNOSTIC ADDITION (accept-diag.mjs only): log every main-frame navigation, navigation request, console line and page close/crash, with time.
  const diag = []; const t00 = Date.now(); const dlog = (k, v) => diag.push([Date.now() - t00, k, String(v).slice(0, 300)]);
  page.on('framenavigated', (f) => { if (f === page.mainFrame()) dlog('framenavigated', f.url()); });
  page.on('load', () => dlog('load', page.url())); page.on('domcontentloaded', () => dlog('domcontentloaded', page.url()));
  page.on('requestfailed', (r) => dlog('requestfailed', r.url() + ' ' + (r.failure()?.errorText || '')));
  page.on('response', (r) => { if (r.status() >= 400) dlog('http' + r.status(), r.url()); });
  page.on('request', (r) => { if (r.isNavigationRequest()) dlog('navrequest', r.url() + ' ' + (r.redirectedFrom()?.url() || '')); });
  page.on('console', (m) => dlog('console.' + m.type(), m.text()));
  page.on('crash', () => dlog('crash', ''));
  page.on('close', () => dlog('close', ''));
  const row = { rev, base, W, H, text, theme, mode, utc: new Date().toISOString(), samples: [], taps: [], notes: [] };
  const ev = () => page.evaluate(() => window.__accEvent?.());
  const panel = () => page.evaluate(() => { const m = document.querySelector('[data-focus-view] main'); const r = m.getBoundingClientRect(); return { st: m.scrollTop, max: m.scrollHeight - m.clientHeight, x: Math.round(r.right - 24), y: Math.round(Math.min(innerHeight, r.bottom) - 16) }; });
  const touchDrag = async (x, y, dy) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + (dy * i) / 8 }] }); await sleep(20); }
    await sleep(60); // hold before lifting: little fling
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  const tapTouch = async (x, y) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(60); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
  // One input step towards the target: dir +1 down, -1 up. Wheel: 60 px notches; touch: 70 px drags.
  const step = async (input, dir) => {
    const p = await panel();
    await ev();
    if (input === 'touch') await touchDrag(p.x, dir > 0 ? Math.max(40, p.y - 110) + 100 : Math.max(40, p.y - 110), dir > 0 ? -70 : 70);
    else { await page.mouse.move(p.x, p.y); await page.mouse.wheel(0, 60 * dir); }
    await sleep(240);
    await ev();
  };
  const goTo = async (input, where) => {
    for (let i = 0; i < 40; i++) {
      const p = await panel();
      if (p.max <= 0) { row.notes.push(`${where}: panel does not scroll (max ${p.max})`); return; }
      if (where === 'top' && p.st <= 0.5) return;
      if (where === 'end' && p.st >= p.max - 0.5) return;
      if (where === 'middle' && p.st >= p.max * 0.3 && p.st <= p.max * 0.7) return;
      const dir = where === 'top' ? -1 : where === 'end' ? 1 : p.st < p.max * 0.3 ? 1 : -1;
      await step(input, dir);
    }
    row.notes.push(`${where}: not reached`);
  };
  const raise = async (which) => {
    await ev();
    await page.evaluate(async (which) => {
      const { toast } = await import('/src/ui/Toast.tsx');
      const w = window;
      if (which === 'update') toast('A fresh brew of Kettle is ready.', { id: 'pwa-update', icon: 'sparkle', duration: Infinity, action: { label: 'Update', onClick: () => { w.__acc.upd++; } } });
      if (which === 'cozy') toast('Cozy level 5!', { tone: 'success' });
      if (which === 'undo') toast('Marked “Chapter 3 notes” done', { tone: 'success', action: { label: 'Undo', onClick: () => { w.__acc.undo++; } } });
      w.__accEvent();
    }, which);
  };
  const actionTap = async (label, how) => {
    const box = await page.evaluate((label) => {
      const b = [...document.querySelectorAll('[aria-label="Notifications"] li button')].find((x) => x.textContent.trim() === label);
      if (!b) return null;
      const q = b.getBoundingClientRect();
      return { x: q.left + q.width / 2, y: q.top + q.height / 2 };
    }, label);
    if (!box) return { label, how, result: 'absent' };
    const key = label === 'Update' ? 'upd' : 'undo';
    const before = await page.evaluate((k) => window.__acc[k], key);
    await ev();
    if (how === 'touch') await tapTouch(box.x, box.y); else await page.mouse.click(box.x, box.y);
    await sleep(400);
    await ev();
    const after = await page.evaluate((k) => window.__acc[k], key);
    const gone = await page.evaluate((label) => ![...document.querySelectorAll('[aria-label="Notifications"] li button')].some((x) => x.textContent.trim() === label), label);
    return { label, how, at: [Math.round(box.x), Math.round(box.y)], activated: after === before + 1, dismissed: gone };
  };
  const count = () => page.evaluate(() => document.querySelectorAll('[aria-label="Notifications"] li').length);
  const waitCount = async (n, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await count()) === n) return true; await sleep(100); } return false; };
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
    if (phone) await tapTouch(b.x + b.width / 2, b.y + b.height / 2); else await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await page.getByRole('button', { name: 'Pause break' }).waitFor({ state: 'attached', timeout: 20_000 });
    await sleep(1200);
    await page.evaluate(() => window.__kettle.finish());
    await page.getByRole('button', { name: /Put the kettle on/ }).waitFor({ state: 'attached' });
    // The break's own toasts leave on their real timers.
    if (!(await waitCount(0, 15_000))) row.notes.push('break toasts still up after 15 s');
    await sleep(500);
    await page.evaluate(INSTALL);
    row.timeOrigin0 = await page.evaluate(() => performance.timeOrigin);
    if (mode === 'geom') {
      for (const where of ['top', 'end']) {
        await goTo('wheel', where); await sleep(500);
        await raise('update'); await sleep(900);
        row.samples.push({ where, n: 1, ...(await page.evaluate(SAMPLE)) });
        await raise('cozy'); await raise('undo'); await sleep(900);
        row.samples.push({ where, n: 3, ...(await page.evaluate(SAMPLE)) });
        await page.evaluate(async () => (await import('/src/ui/Toast.tsx')).toast.dismiss()); // labelled reset between places
        await waitCount(0, 3000); await sleep(400);
      }
    } else {
      const input = mode;
      const other = input === 'touch' ? 'click' : 'touch';
      const places = ['top', 'middle', 'end', 'middle', 'top'];
      for (let i = 0; i < places.length; i++) {
        const where = places[i];
        await goTo(input, where); await sleep(600);
        if (i === 0) { await raise('update'); }
        await sleep(700);
        row.samples.push({ where, i, n: 1, ...(await page.evaluate(SAMPLE)) });
        await raise('cozy'); await sleep(700);
        row.samples.push({ where, i, n: 2, ...(await page.evaluate(SAMPLE)) });
        await raise('undo'); await sleep(700);
        row.samples.push({ where, i, n: 3, ...(await page.evaluate(SAMPLE)) });
        row.taps.push({ where, i, ...(await actionTap('Undo', input === 'touch' ? 'touch' : 'click')) });
        if (!(await waitCount(1, 6000))) row.notes.push(`${where}#${i}: ordinary toasts not gone after 6 s`);
        await sleep(300);
        if (i === 2) {
          row.taps.push({ where, i, ...(await actionTap('Update', input === 'touch' ? 'touch' : 'click')) });
          await sleep(400); await raise('update'); await sleep(700);
          row.samples.push({ where, i, n: 1, after: 'Update re-raised', ...(await page.evaluate(SAMPLE)) });
        }
        if (i === 4) row.taps.push({ where, i, ...(await actionTap('Update', other)) });
      }
    }
    const rec = await page.evaluate(() => { const R = window.__acc; R.stop = true; return { frames: R.frames, covered: R.covered.length, coveredAfter400ms: R.covered.filter((c) => c.sinceEvent > 400).length, firstCovered: R.covered.slice(0, 4) }; });
    row.frames = rec;
  } catch (e) {
    row.error = String(e.message).split('\n')[0];
    // L1 DIAGNOSTIC (accept-diag2): after the failure, wait and ask the page what document it is now.
    await sleep(2500);
    try { row.after = { url: page.url(), closed: page.isClosed(), doc: await page.evaluate(() => ({ nav: performance.getEntriesByType('navigation').map((n) => n.type), timeOrigin: performance.timeOrigin, hash: location.hash, ready: document.readyState, kettle: !!window.__kettle, l1: !!window.__acc })) }; } catch (e2) { row.after = { err: String(e2.message).split('\n')[0] }; }
  }
  row.errors = errors.slice(0, 3);
  row.diag = diag;
  appendFileSync(`${out}/accept-diag2-${rev}.jsonl`, JSON.stringify(row) + '\n');
  // one-line summary
  const s = row.samples;
  const worst = s.flatMap((x) => x.toasts.map((t) => t.visible - t.natural)).reduce((a, b) => Math.min(a, b), 0);
  const actFail = s.flatMap((x) => x.toasts.filter((t) => t.actHit === false)).length;
  const ctlBad = s.flatMap((x) => Object.values(x.controls || {}).filter((v) => String(v).startsWith('COVERED'))).length;
  console.log(JSON.stringify({ tag, err: row.error, frames: row.frames?.frames, coveredFrames: row.frames?.covered, coveredAfter400ms: row.frames?.coveredAfter400ms, samples: s.length, worstVisibleMinusNatural: worst, actionNotHit: actFail, controlsCoveredInSamples: ctlBad, barOverlap: s.filter((x) => x.barOverlap.length).length, docked: s.map((x) => (x.docked ? 'D' : '-')).join(''), taps: row.taps.map((t) => `${t.label}/${t.how}:${t.activated ? 'ok' : 'FAIL'}${t.dismissed ? '' : '!dismiss'}`).join(' '), notes: row.notes }));
  await ctx.close();
}
await browser.close();
