import { chromium } from 'playwright';

export const FIXED = Date.parse('2026-10-11T07:40:00.000Z');
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const parseArgs = () => Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));

export async function launch() {
  return chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
}

export async function newCtx(b, W, H, clockAt, errors) {
  const mobile = W < 900;
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: mobile && W < H, hasTouch: mobile, colorScheme: 'light', timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block', acceptDownloads: true });
  await ctx.route('**/__lb_blank', (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>blank</title>' }));
  const p = await ctx.newPage();
  await p.clock.install({ time: clockAt });
  await p.clock.resume();
  p.on('pageerror', (e) => errors.push(e.message.slice(0, 300)));
  return { ctx, p };
}

/** Put a storage dump into an origin before the app ever loads, then leave the page. */
export async function preload(p, base, dump) {
  await p.goto(`${base}/__lb_blank`, { waitUntil: 'load', timeout: 60_000 });
  await p.evaluate((d) => {
    localStorage.clear(); sessionStorage.clear();
    for (const [k, v] of Object.entries(d.local)) localStorage.setItem(k, v);
    for (const [k, v] of Object.entries(d.session ?? {})) sessionStorage.setItem(k, v);
  }, dump);
}

export const dumpStorage = (p) => p.evaluate(() => {
  const d = { origin: location.origin, local: {}, session: {} };
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); d.local[k] = localStorage.getItem(k); }
  for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); d.session[k] = sessionStorage.getItem(k); }
  return d;
});

export const collect = (p) => p.evaluate(() => {
  const norm = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
  const re = /warm\s*(streak|days)|new badge|badge:/i;
  const hidden = (e) => !!e.closest('[aria-hidden="true"]');
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const leafText = [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && re.test(e.textContent ?? '')).map((e) => ({ tag: e.tagName.toLowerCase(), text: norm(e.textContent), srOnly: /sr-only/.test(String(e.className)), ariaHidden: hidden(e), role: e.getAttribute('role'), live: e.getAttribute('aria-live') }));
  const ariaLabels = [...document.querySelectorAll('[aria-label]')].filter((e) => /warm|badge/i.test(e.getAttribute('aria-label'))).map((e) => ({ tag: e.tagName.toLowerCase(), role: e.getAttribute('role'), aria: e.getAttribute('aria-label'), text: norm(e.textContent).slice(0, 120), ariaHidden: hidden(e), visible: vis(e) }));
  const live = [...document.querySelectorAll('[role=status],[aria-live],[role=alert]')].map((e) => ({ tag: e.tagName.toLowerCase(), role: e.getAttribute('role'), live: e.getAttribute('aria-live'), text: norm(e.textContent) })).filter((x) => x.text);
  const toasts = [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => norm(li.textContent));
  const dialogs = [...document.querySelectorAll('[role=dialog]')].map((d) => ({ aria: d.getAttribute('aria-label'), heading: norm(d.querySelector('h1,h2,h3')?.textContent), text: norm(d.textContent).slice(0, 300) }));
  const rewards = [...document.querySelectorAll('[aria-label="Rewards"] li')].map((li) => ({ text: norm(li.textContent), aria: [...li.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')) }));
  const bodyLines = (document.body.innerText || '').split('\n').map(norm).filter((l) => /warm\s*(streak|days)/i.test(l));
  return { hash: location.hash, rewards, leafText, ariaLabels, live, toasts, dialogs, bodyLines };
});

/** Per-key raw (byte-for-byte) comparison of two dumps. */
export function diffDumps(a, b) {
  const res = { local: {}, session: {} };
  for (const area of ['local', 'session']) {
    const keys = new Set([...Object.keys(a[area] ?? {}), ...Object.keys(b[area] ?? {})]);
    for (const k of [...keys].sort()) {
      const x = a[area]?.[k], y = b[area]?.[k];
      res[area][k] = x === undefined ? 'ADDED' : y === undefined ? 'REMOVED' : x === y ? 'identical' : 'DIFFERS';
    }
  }
  return res;
}

/** Structural diff of two JSON values: list of differing paths with short values. */
export function jsonDiff(a, b, path = '', out = []) {
  if (JSON.stringify(a) === JSON.stringify(b)) return out;
  if (a && b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) jsonDiff(a[k], b[k], `${path}/${k}`, out);
  } else out.push({ path, a: JSON.stringify(a)?.slice(0, 120), b: JSON.stringify(b)?.slice(0, 120) });
  return out;
}
