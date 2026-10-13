// Lane B live check: one browser, one config. Big day (celebrate seed) -> finish a brew -> summary facts -> storage dump -> Stats > Badges facts.
//   node live.mjs --base http://127.0.0.1:5480 --label base --w 390 --h 844 --out <dir>
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const FIXED = Date.parse('2026-10-11T07:40:00.000Z');
const W = +args.w, H = +args.h, label = args.label, base = args.base, out = args.out;
mkdirSync(out, { recursive: true });
const tag = `${label}-${W}x${H}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const facts = { tag, base, viewport: { W, H }, fixedTime: new Date(FIXED).toISOString(), startedAt: new Date().toISOString(), errors: [], console: [] };

const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const mobile = W < 900;
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: mobile && W < H, hasTouch: mobile, colorScheme: 'light', timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
const p = await ctx.newPage();
await p.clock.install({ time: FIXED });
await p.clock.resume();
p.on('pageerror', (e) => facts.errors.push(e.message.slice(0, 300)));
p.on('console', (m) => { if (m.type() === 'error') facts.console.push(m.text().slice(0, 300)); });

const collect = () => p.evaluate(() => {
  const norm = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
  const re = /warm\s*(streak|days)|new badge|badge:/i;
  const hidden = (e) => !!e.closest('[aria-hidden="true"]');
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const leafText = [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && re.test(e.textContent ?? '')).map((e) => ({ tag: e.tagName.toLowerCase(), cls: String(e.className?.baseVal ?? e.className ?? '').slice(0, 40), text: norm(e.textContent), srOnly: /sr-only/.test(String(e.className)), ariaHidden: hidden(e), role: e.getAttribute('role'), live: e.getAttribute('aria-live') }));
  const ariaLabels = [...document.querySelectorAll('[aria-label]')].filter((e) => /warm|badge/i.test(e.getAttribute('aria-label'))).map((e) => ({ tag: e.tagName.toLowerCase(), role: e.getAttribute('role'), aria: e.getAttribute('aria-label'), text: norm(e.textContent).slice(0, 120), ariaHidden: hidden(e), visible: vis(e) }));
  const titles = [...document.querySelectorAll('[title]')].filter((e) => /warm|badge/i.test(e.getAttribute('title'))).map((e) => ({ tag: e.tagName.toLowerCase(), title: e.getAttribute('title') }));
  const live = [...document.querySelectorAll('[role=status],[aria-live],[role=alert]')].map((e) => ({ tag: e.tagName.toLowerCase(), role: e.getAttribute('role'), live: e.getAttribute('aria-live'), text: norm(e.textContent) })).filter((x) => x.text);
  const toasts = [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => norm(li.textContent));
  const dialogs = [...document.querySelectorAll('[role=dialog]')].map((d) => ({ aria: d.getAttribute('aria-label'), labelledby: d.getAttribute('aria-labelledby'), heading: norm(d.querySelector('h1,h2,h3')?.textContent), text: norm(d.textContent).slice(0, 300) }));
  const rewards = [...document.querySelectorAll('[aria-label="Rewards"] li')].map((li) => ({ text: norm(li.textContent), aria: [...li.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')), ariaHidden: hidden(li) }));
  const bodyLines = (document.body.innerText || '').split('\n').map(norm).filter((l) => /warm\s*(streak|days)/i.test(l));
  const doc = document.title;
  return { hash: location.hash, docTitle: doc, rewards, leafText, ariaLabels, titles, live, toasts, dialogs, bodyLines };
});

const q = `${base}/?debug&seed=celebrate&theme=light`;
const ready = () => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 90_000 }).catch(() => facts.errors.push('ready() timed out'));
try {
  await p.goto(q + '#/', { waitUntil: 'load', timeout: 90_000 });
  await ready();
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
  await sleep(1200);
  const start = p.getByRole('button', { name: /put the kettle on/i }).first();
  await start.scrollIntoViewIfNeeded(); await start.click({ timeout: 30_000 });
  await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 30_000 });
  await sleep(2500);
  await p.evaluate(() => window.__kettle.finish());
  await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 60_000 });
  // sample the live region while the summary arrives, then settled
  await sleep(300); facts.summaryEarly = await collect();
  await sleep(5000); facts.summary = await collect();
  await p.screenshot({ path: `${out}/${tag}-summary-viewport.png`, animations: 'disabled', timeout: 120_000 }).catch((e) => facts.errors.push('shot summary ' + e.message.slice(0, 100)));
  const pill = p.locator('[aria-label="Rewards"] li', { hasText: /Badge:/ }).first();
  if (await pill.count()) { await pill.scrollIntoViewIfNeeded().catch(() => {}); await sleep(400); await pill.screenshot({ path: `${out}/${tag}-summary-pill.png`, animations: 'disabled', timeout: 60_000 }).catch((e) => facts.errors.push('shot pill ' + e.message.slice(0, 100))); }
  // storage dump (what a real profile holds after the brew)
  await sleep(1500);
  facts.dump = await p.evaluate(() => {
    const d = { origin: location.origin, local: {}, session: {} };
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); d.local[k] = localStorage.getItem(k); }
    for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); d.session[k] = sessionStorage.getItem(k); }
    return d;
  });
  writeFileSync(`${out}/dump-${tag}.json`, JSON.stringify(facts.dump, null, 1));
  // Stats > Badges
  await p.evaluate(() => window.__kettle.navigate('/stats'));
  await p.waitForFunction(() => location.hash === '#/stats', null, { timeout: 30_000 });
  const btn = p.getByRole('button', { name: /^Warm (Streak|Days), tier/ }).first();
  await btn.waitFor({ state: 'attached', timeout: 30_000 }).catch((e) => facts.errors.push('badge button not found ' + e.message.slice(0, 100)));
  await sleep(1500);
  facts.stats = await collect();
  if (await btn.count()) {
    await btn.scrollIntoViewIfNeeded().catch(() => {}); await sleep(600);
    facts.statsButton = { aria: await btn.getAttribute('aria-label'), name: (await btn.locator('span').filter({ hasText: /^Warm (Streak|Days)$/ }).first().textContent().catch(() => null)), text: (await btn.innerText()).replace(/\s+/g, ' ') };
    await btn.screenshot({ path: `${out}/${tag}-stats-badge-button.png`, animations: 'disabled', timeout: 60_000 }).catch((e) => facts.errors.push('shot btn ' + e.message.slice(0, 100)));
    await btn.click({ timeout: 20_000 }).catch((e) => facts.errors.push('click btn ' + e.message.slice(0, 100)));
    await sleep(1200);
    facts.statsSheet = await collect();
    await p.keyboard.press('Escape').catch(() => {});
    await sleep(500);
  }
  facts.finalToasts = (await collect()).toasts;
} catch (e) {
  facts.errors.push('FATAL ' + e.message.slice(0, 400));
} finally {
  facts.finishedAt = new Date().toISOString();
  writeFileSync(`${out}/live-${tag}.json`, JSON.stringify(facts, null, 1));
  await ctx.close().catch(() => {});
  await b.close().catch(() => {});
  console.log(tag, 'errors', facts.errors.length, facts.errors.join(' | ').slice(0, 300));
}
