// Wave 2 round 2 — BEFORE captures on b377c62 (orchestrator). One browser per invocation (run under the slot gate).
// Frozen start date/clock (page.clock.install + resume; time then runs), animations:'disabled' screenshots, fresh
// profile per state group. Every shot also records which visible controls are NOT on top at their centre and what
// covers them (toasts, sheets), plus the toast stack — the facts the toast round (T) and the summary polish (P) need.
//   node r2before.mjs --base http://127.0.0.1:5410 --out <dir> --cfg 390x844@2:light:100 [--groups a,b] [--at ISO]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const FIXED = Date.parse(args.at ?? '2026-10-11T07:40:00.000Z');
const m = args.cfg.match(/^(\d+)x(\d+)@(\d+):(light|dark):(\d+)$/);
const [W, H, DPR, theme, text] = [+m[1], +m[2], +m[3], m[4], +m[5]];
const tag = args.tag ? `-${args.tag}` : '';
const dir = `${args.out}/${W}x${H}-${theme}-t${text}${tag}`;
mkdirSync(dir, { recursive: true });
const mobile = W < 900;
const groups = (args.groups ?? 'home,end,breakover,nextbrew,summary,nook').split(',');
const meta = { base: args.base, rev: args.rev ?? '61aba17 (kettle/src 4556926), dev server', viewport: { w: W, h: H }, dpr: DPR, theme, text: `${text}%`, fixedTime: new Date(FIXED).toISOString(), states: {}, errors: [] };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });

async function context() {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: mobile && W < H, hasTouch: mobile, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
  const p = await ctx.newPage();
  await p.clock.install({ time: FIXED });
  await p.clock.resume();
  p.on('pageerror', (e) => meta.errors.push(e.message.slice(0, 200)));
  return { ctx, p };
}
const q = (seed, extra = '') => `${args.base}/?debug&seed=${seed}&theme=${theme}${extra}`;
const ready = (p) => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 }).catch(() => {});
const measure = (p) => p.evaluate(() => {
  const rect = (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; };
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
  const label = (e) => (e.getAttribute('aria-label') || e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 50);
  const toastLis = [...document.querySelectorAll('[aria-label="Notifications"] li')];
  const toasts = toastLis.map((li) => ({ text: li.innerText.replace(/\s+/g, ' ').trim().slice(0, 80), box: rect(li), op: +getComputedStyle(li).opacity, icon: !!li.querySelector('svg,img') }));
  const covered = [];
  const controls = [...document.querySelectorAll('button,[role=button],[role=radio],a[href],input,textarea')].filter(vis).filter((e) => !e.closest('[aria-label="Notifications"]'));
  for (const e of controls) {
    const r = e.getBoundingClientRect();
    const cx = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), cy = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
    const hit = document.elementFromPoint(cx, cy);
    const hc = hit && hit.closest('button,[role=button],[role=radio],label,a,input,textarea');
    if (hc && (hc === e || hc.contains(e) || e.contains(hc))) continue;
    if (hit && hit !== e && !e.contains(hit) && !hit.contains(e)) {
      const by = hit.closest('[aria-label="Notifications"] li') ? 'toast: ' + hit.closest('li').innerText.replace(/\s+/g, ' ').slice(0, 40) : `${hit.tagName.toLowerCase()}.${String(hit.className?.baseVal ?? hit.className ?? '').split(' ')[0].slice(0, 30)}`;
      covered.push({ name: label(e), box: rect(e), by });
    }
  }
  const small = controls.filter((e) => { const r = e.getBoundingClientRect(); return r.width < 24 || r.height < 24; }).map((e) => ({ name: label(e), box: rect(e) }));
  const sheet = document.querySelector('[role=dialog]');
  return { hash: location.hash, scroll: Math.round(document.scrollingElement.scrollTop), toasts, covered, small, dialog: sheet ? label(sheet).slice(0, 40) || sheet.getAttribute('aria-label') : null,
    pills: [...document.querySelectorAll('[aria-label="Rewards"] li')].map((li) => ({ text: li.innerText.replace(/\s+/g, ' ').slice(0, 60), box: rect(li) })),
    imgs: [...document.querySelectorAll('img')].filter(vis).map((i) => ({ src: (i.currentSrc || i.src).split('/').pop().slice(0, 40), box: rect(i) })),
    canvases: [...document.querySelectorAll('canvas')].filter(vis).map((c) => ({ box: rect(c) })) };
});
const shot = async (p, name, desc, full = false) => {
  try {
    const t = Date.now();
    const facts = await measure(p);
    await p.screenshot({ path: `${dir}/${name}.png`, animations: 'disabled', fullPage: full, timeout: 120_000 });
    meta.states[name] = { desc, measuredAtMs: t, ...facts };
  } catch (e) { meta.errors.push(`${name}: ${e.message.slice(0, 120)}`); }
};
const click = async (p, name) => { const l = p.getByRole('button', { name }).first(); await l.scrollIntoViewIfNeeded().catch(() => {}); await l.click({ timeout: 30_000 }); };
const settings = (p, s) => p.evaluate((x) => window.__kettle.settings.getState().set(x), s);
async function group(label, fn) {
  if (!groups.includes(label)) return;
  const { ctx, p } = await context();
  try { await fn(p); } catch (e) { meta.errors.push(`${label}: ${e.message.slice(0, 160)}`); }
  await ctx.close();
}
async function typeTask(p) {
  const field = p.getByRole('textbox', { name: /What are you brewing/ });
  await field.click(); await p.keyboard.type('Chapter 3 notes'); await p.keyboard.press('Escape').catch(() => {});
}

try {
  // Home at rest (veteran): Brew length, docked start, status bar.
  await group('home', async (p) => {
    await p.goto(q('veteran') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready);
    await settings(p, { muted: true, autoStartBreaks: false, autoStartFocus: false }); await sleep(1500);
    await shot(p, '01-home', 'Today at rest (veteran): Brew length and the docked start');
    await shot(p, '01-home-full', 'Today, full page', true);
  });
  // W2H-D1 / (b): a brew with a task ended early → Today with End's toasts up, Mark done.
  await group('end', async (p) => {
    await p.goto(q('newbie') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready);
    await settings(p, { muted: true, autoStartBreaks: false, autoStartFocus: false });
    await typeTask(p);
    const start = p.getByRole('button', { name: /^Put the kettle on · / }); await start.scrollIntoViewIfNeeded(); await start.click();
    await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15_000 }); await sleep(1500);
    await p.evaluate(() => window.__kettle.ff(3 * 60_000)); await sleep(500);
    await p.getByRole('button', { name: 'End session' }).first().click();
    await shot(p, '02-end-sheet', 'End sheet open ("Leave the kettle early?")');
    await p.getByRole('dialog', { name: 'Leave the kettle early?' }).getByRole('button', { name: 'End session' }).click();
    const t0 = Date.now();
    await p.waitForFunction(() => location.hash === '#/', null, { timeout: 15_000 });
    for (const [ms, n] of [[600, '0.6'], [1500, '1.5'], [3200, '3.2'], [6000, '6.0']]) { await sleep(Math.max(0, ms - (Date.now() - t0))); await shot(p, `03-today-after-end-${n}s`, `Today ${n} s after End session: End's toasts, Mark done`); }
  });
  // (c) (d) (f) and K02 task day: summary with a task → Tea time → break → Break's over (+ Ambience sheet).
  await group('breakover', async (p) => {
    await p.goto(q('newbie') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready);
    await settings(p, { muted: true, autoStartBreaks: false, autoStartFocus: false });
    await typeTask(p);
    const start = p.getByRole('button', { name: /^Put the kettle on · / }); await start.scrollIntoViewIfNeeded(); await start.click();
    await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15_000 }); await sleep(2500);
    await p.evaluate(() => window.__kettle.finish());
    await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 }).catch(() => {});
    await sleep(1500); await shot(p, '04-summary-task', 'Summary, task day (K02), 1.5 s');
    await sleep(3000); await shot(p, '04-summary-task-settled', 'Summary, task day, 4.5 s');
    await shot(p, '04-summary-task-full', 'Summary, task day, full page', true);
    await click(p, /Tea time|Long tea break/); await sleep(2500);
    await shot(p, '05-break', 'Tea break running');
    await p.evaluate(() => window.__kettle.finish());
    const t0 = Date.now();
    await p.getByRole('button', { name: /^Put the kettle on/ }).first().waitFor({ state: 'attached', timeout: 20_000 }).catch(() => {});
    for (const [ms, n] of [[600, '0.6'], [1500, '1.5'], [3200, '3.2']]) { await sleep(Math.max(0, ms - (Date.now() - t0))); await shot(p, `06-break-over-${n}s`, `Break's over with a carried task, ${n} s: toasts (folded?)`); }
    const amb = p.getByRole('button', { name: /Ambience/ }).first();
    if (await amb.count()) { await amb.click().catch(() => {}); await sleep(900); await shot(p, '06-break-over-ambience', "Break's over: Ambience sheet open (toasts over it?)"); await p.keyboard.press('Escape').catch(() => {}); }
    await sleep(300); await shot(p, '06-break-over-full', "Break's over, full page", true);
  });
  // (e) Settings › Next brew on: a reward toast lands on the running next brew's status line.
  await group('nextbrew', async (p) => {
    await p.goto(q('newbie') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready);
    await settings(p, { muted: true, autoStartBreaks: true, autoStartFocus: true });
    const start = p.getByRole('button', { name: /^Put the kettle on · / }); await start.scrollIntoViewIfNeeded(); await start.click();
    await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15_000 }); await sleep(2000);
    await p.evaluate(() => window.__kettle.finish()); await sleep(2500);
    await p.evaluate(() => window.__kettle.finish());
    const t0 = Date.now();
    await p.waitForFunction(() => window.__kettle.timer.getState().phase === 'focus' && window.__kettle.timer.getState().status === 'running', null, { timeout: 20_000 }).catch(() => {});
    for (const [ms, n] of [[600, '0.6'], [1500, '1.5'], [3200, '3.2']]) { await sleep(Math.max(0, ms - (Date.now() - t0))); await shot(p, `07-nextbrew-${n}s`, `Next brew auto-started, ${n} s: reward toast over the status line?`); }
  });
  // Summary routine day (veteran) and big day (celebrate, unlock) — P's references.
  await group('summary', async (p) => {
    await p.goto(q('veteran') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready);
    await settings(p, { muted: true, autoStartBreaks: false, autoStartFocus: false }); await sleep(1200);
    await click(p, /put the kettle on/i); await sleep(2500);
    await p.evaluate(() => window.__kettle.finish());
    await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 }).catch(() => {});
    await sleep(1500); await shot(p, '08-summary-routine', 'Summary, routine day, 1.5 s');
    await sleep(3000); await shot(p, '08-summary-routine-settled', 'Summary, routine day, 4.5 s');
    await shot(p, '08-summary-routine-full', 'Summary, routine day, full page', true);
  });
  await group('summary', async (p) => {
    await p.goto(q('celebrate') + '#/'); await ready(p); await p.evaluate(() => document.fonts.ready);
    await settings(p, { muted: true, autoStartBreaks: false, autoStartFocus: false }); await sleep(1200);
    await click(p, /put the kettle on/i); await sleep(2500);
    await p.evaluate(() => window.__kettle.finish());
    await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 }).catch(() => {});
    await sleep(4000); await shot(p, '09-summary-bigday', 'Summary, big day (unlock), 4 s');
    await sleep(6000); await shot(p, '09-summary-bigday-settled', 'Summary, big day / unlock close-up, 10 s');
    await shot(p, '09-summary-bigday-full', 'Summary, big day, full page', true);
  });
  // Nook with 3D on (Chai in the room) — C's reference.
  await group('nook', async (p) => {
    await p.goto(q('veteran') + '#/'); await ready(p);
    await settings(p, { muted: true }); await p.evaluate(() => window.__kettle.navigate('/nook')); await sleep(8000);
    await shot(p, '10-nook-3d', 'Nook, 3D on, 8 s');
  });
} finally {
  writeFileSync(`${dir}/meta.json`, JSON.stringify(meta, null, 1));
  await b.close();
  console.log(`${W}x${H}-${theme}-t${text}${tag}`, 'states', Object.keys(meta.states).length, 'errors', meta.errors.length, meta.errors.join(' | ').slice(0, 300));
}
