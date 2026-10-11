// LEAD2 r7 probe: the toast room on Break's over (carried task) at landscape / large text, with the panel at its top and
// scrolled to its end by a REAL wheel. Two cases:
//   arrive : two ordinary toasts raised (app's own toast(), real timers 3.2 s) right as Break's over shows, panel at top;
//            then real wheel to the end at once (as a person heading for "Put the kettle on"); per-frame visible
//            height of each toast (clipped by the list's scrollport and the viewport).
//   update : PwaUpdatePrompt's toast (id pwa-update, duration Infinity, action "Update"; synthetic, labelled) raised with
//            the panel at its top; wheel to the end; then wheel back to the top. At each place: the toast's visible
//            height and whether "Update" hit-tests at its centre.
// Setup by the debug API (onboarded profile, startFocus, nearEnd/finish, pause/finish); Tea time by a REAL tap.
// No scrollIntoView / scrollTo / scrollBy / scrollTop writes.
// v2 (LEAD2): wheel aimed at the panel's lower right corner (not under a toast); records top-bar text a toast overlaps.
//   node toastroom2.mjs <base> <rev> <out> "667x375@200:light,..." <case arrive|update>
import { chromium } from 'playwright';
import { mkdirSync, appendFileSync } from 'node:fs';
const [,, base, rev, out, cfgArg, kase = 'update'] = process.argv;
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cfgs = cfgArg.split(',').map((c) => { const m = c.match(/^(\d+)x(\d+)@(\d+):(light|dark)$/); return { W: +m[1], H: +m[2], text: +m[3], theme: m[4] }; });
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const MEASURE = () => {
  const ol = document.querySelector('[aria-label="Notifications"] ol');
  let clip = null;
  if (ol && getComputedStyle(ol).overflowY !== 'visible') { const q = ol.getBoundingClientRect(); clip = { t: q.top, b: q.bottom }; }
  const toasts = [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => {
    const q = li.getBoundingClientRect();
    let t = Math.max(q.top, 0), b = Math.min(q.bottom, innerHeight);
    if (clip) { t = Math.max(t, clip.t); b = Math.min(b, clip.b); }
    const act = li.querySelector('button');
    let actHit = null;
    if (act) { const a = act.getBoundingClientRect(); const cx = a.left + a.width / 2, cy = a.top + a.height / 2; const h = cy >= 0 && cy < innerHeight ? document.elementFromPoint(cx, cy) : null; actHit = !!h && act.contains(h); }
    return [li.textContent.slice(0, 18), Math.round(q.height), Math.max(0, Math.round(b - t)), Math.round(q.top), actHit];
  });
  const m = document.querySelector('[data-focus-view] main');
  const hdr = document.querySelector('[data-focus-view] header');
  const lis = [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => { const q = li.getBoundingClientRect(); return { left: q.left, right: q.right, top: clip ? Math.max(q.top, clip.t) : q.top, bottom: clip ? Math.min(q.bottom, clip.b) : q.bottom }; }).filter((r) => r.bottom > r.top);
  const barText = hdr ? [...hdr.querySelectorAll('*')].filter((e) => e.children.length === 0 && (e.textContent || '').trim()).map((e) => { const q = e.getBoundingClientRect(); return { t: (e.textContent || '').trim().slice(0, 16), q }; }).filter((x) => x.q.width > 0 && x.q.bottom > 0) : [];
  const barOverlap = barText.filter((x) => lis.some((r) => r.right > x.q.left + 1 && r.left < x.q.right - 1 && Math.max(r.top, 0) < x.q.bottom - 1 && r.bottom > x.q.top + 1)).map((x) => x.t);
  return { barOverlap, panel: m ? `${Math.round(m.scrollTop)}/${m.scrollHeight - m.clientHeight}` : null, clip: clip ? [Math.round(clip.t), Math.round(clip.b)] : null, toasts };
};
for (const { W, H, text, theme } of cfgs) {
  const phone = W < 900;
  const tag = `v2-${rev}-${W}x${H}-t${text}-${theme}-${kase}`;
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone, colorScheme: theme });
  await ctx.addInitScript((pct) => {
    try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {}
    if (pct !== 100) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); });
  }, text);
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  const row = { rev, base, W, H, text, theme, kase, utc: new Date().toISOString(), samples: [] };
  const wheelTo = async (dir) => { for (let i = 0; i < 14; i++) { const aim = await page.evaluate(() => { const r = document.querySelector('[data-focus-view] main').getBoundingClientRect(); return { x: Math.round(r.right - 24), y: Math.round(Math.min(innerHeight, r.bottom) - 16) }; }); const before = await page.evaluate(() => document.querySelector('[data-focus-view] main').scrollTop); await page.mouse.move(aim.x, aim.y); await page.mouse.wheel(0, 100 * dir); await sleep(220); const after = await page.evaluate(() => document.querySelector('[data-focus-view] main').scrollTop); if (Math.abs(after - before) < 1) break; } };
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
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2).catch(async () => page.mouse.click(b.x + b.width / 2, b.y + b.height / 2));
    await page.getByRole('button', { name: 'Pause break' }).waitFor({ state: 'attached', timeout: 20_000 });
    await sleep(1200);
    await page.evaluate(async () => (await import('/src/ui/Toast.tsx')).toast.dismiss());
    await page.evaluate(() => window.__kettle.finish());
    await page.getByRole('button', { name: /Put the kettle on/ }).waitFor({ state: 'attached' });
    if (kase === 'arrive') {
      await page.evaluate(async () => { const { toast } = await import('/src/ui/Toast.tsx'); toast('Recipe done: Take 2 full tea breaks · +15 leaves', { tone: 'success' }); toast('Cozy level 5!', { tone: 'success' }); });
      await sleep(500);
      row.samples.push(['arrive+0.5s', await page.evaluate(MEASURE)]);
      await page.screenshot({ path: `${out}/${tag}-a-top.png` });
      await wheelTo(1);
      row.samples.push(['after wheel to end', await page.evaluate(MEASURE)]);
      await page.screenshot({ path: `${out}/${tag}-b-end.png` });
      await sleep(600);
      row.samples.push(['end +0.6s', await page.evaluate(MEASURE)]);
    } else {
      await sleep(3800); // the break's own toasts expire on their real timers
      await page.evaluate(async () => (await import('/src/ui/Toast.tsx')).toast.dismiss());
      await sleep(600);
      await page.evaluate(async () => { const { toast } = await import('/src/ui/Toast.tsx'); toast('A fresh brew of Kettle is ready.', { id: 'pwa-update', icon: 'sparkle', duration: Infinity, action: { label: 'Update', onClick: () => {} } }); });
      await sleep(1200);
      row.samples.push(['top', await page.evaluate(MEASURE)]);
      await page.screenshot({ path: `${out}/${tag}-a-top.png` });
      await wheelTo(1); await sleep(800);
      row.samples.push(['end', await page.evaluate(MEASURE)]);
      await page.screenshot({ path: `${out}/${tag}-b-end.png` });
      await wheelTo(-1); await sleep(800);
      row.samples.push(['back at top', await page.evaluate(MEASURE)]);
    }
  } catch (e) { row.error = String(e.message).split('\n')[0]; }
  row.errors = errors.slice(0, 3);
  appendFileSync(`${out}/toastroom2-${rev}.jsonl`, JSON.stringify(row) + '\n');
  console.log(JSON.stringify(row));
  await ctx.close();
}
await browser.close();
