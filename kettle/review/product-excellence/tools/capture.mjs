// Product Excellence capture tool: the same states, viewports and themes for BEFORE and AFTER.
//
// usage (from kettle/):
//   node review/product-excellence/tools/capture.mjs --base http://localhost:5191 --out <dir> \
//        --w 390 --h 844 --dpr 2 --theme light [--rm] [--static] [--only 01,07,11b]
//
// Writes <out>/<id>-<name>.png plus <out>/capture-meta.json (viewport, DPR, theme, revision, time, renderer,
// per-state notes and page errors). States use the dev debug API (`?debug&seed=…`, `window.__kettle`).
// The renderer here is CPU-only SwiftShader: transient mid-fade frames are renderer artifacts; waits are generous.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : '1']);
    return acc;
  }, []),
);
const base = args.base ?? 'http://localhost:5191';
const out = args.out;
const W = +(args.w ?? 390);
const H = +(args.h ?? 844);
const DPR = +(args.dpr ?? 2);
const theme = args.theme ?? 'light';
const rm = args.rm === '1';
const stat = args.static === '1';
const only = args.only ? new Set(args.only.split(',')) : null;
if (!out) throw new Error('--out required');
mkdirSync(out, { recursive: true });

const phone = W < 900 && W < H;
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const mkctx = () =>
  b.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: DPR,
    isMobile: phone,
    hasTouch: W < 900,
    colorScheme: theme,
    reducedMotion: rm ? 'reduce' : 'no-preference',
  });
let ctx = await mkctx();
const meta = { base, viewport: { w: W, h: H }, dpr: DPR, theme, reducedMotion: rm, static3d: stat, renderer: 'Chromium (Playwright) + SwiftShader (CPU)', revision: '', capturedAt: new Date().toISOString(), states: {}, errors: [] };
try {
  meta.revision = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim() + (execSync('git status --porcelain -- src', { encoding: 'utf8' }).trim() ? '+dirty' : '');
} catch {
  meta.revision = 'unknown';
}

const want = (id) => !only || only.has(id);
async function page(seed, route = '/') {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => meta.errors.push(`${seed}${route}: ${e.message}`));
  const nt = theme === 'light' ? '&nooktime=day' : '';
  await p.goto(`${base}/?debug&seed=${seed}&theme=${theme}${nt}${rm ? '&motion=reduce' : ''}#${route}`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  if (stat) await p.evaluate(() => window.__kettle.settings.getState().set({ scene: 'off' }));
  // Screenshots under the CPU renderer are slow: keep the summary's auto-start from beginning the break.
  await p.evaluate(() => window.__kettle.settings.getState().set({ autoStartBreaks: false, muted: true }));
  await p.waitForTimeout(1200);
  return p;
}
async function shot(p, id, name, opts = {}) {
  if (!want(id)) return;
  const file = `${id}-${name}.png`;
  await p.screenshot({ path: `${out}/${file}`, timeout: 240000, fullPage: !!opts.full });
  meta.states[id] = { file, name, route: await p.evaluate(() => location.hash), full: !!opts.full, note: opts.note ?? '' };
  console.log('shot', file);
}
const ev = (p, fn, arg) => p.evaluate(fn, arg);
const anyOf = (...ids) => ids.some(want);

// ---- Home → focus → whistle → summary → break (veteran) ----
if (anyOf('01', '01b', '02', '03', '04', '05', '06', '07', '08', '09', '10')) {
  const p = await page('veteran');
  await shot(p, '01', 'home');
  if (want('01b')) {
    await ev(p, () => {
      const el = [...document.querySelectorAll('h2,h3,legend,p,span,div')].find((x) => x.textContent?.trim() === 'Brew length');
      (el ?? document.querySelector('[role=group][aria-label="Tag"]'))?.scrollIntoView({ block: 'center' });
    });
    await p.waitForTimeout(500);
    await shot(p, '01b', 'home-scrolled', { note: 'scrolled to the brew-length control' });
    await ev(p, () => window.scrollTo(0, 0));
  }
  await ev(p, () => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
  await p.waitForTimeout(3500);
  await shot(p, '02', 'focus-start');
  await ev(p, () => window.__kettle.ff(12.5 * 60_000));
  await p.waitForTimeout(1200);
  await shot(p, '03', 'focus-mid');
  await ev(p, () => window.__kettle.timer.getState().pause());
  await p.waitForTimeout(900);
  await shot(p, '04', 'focus-paused');
  await ev(p, () => window.__kettle.timer.getState().resume());
  await p.getByRole('button', { name: 'Add 5 minutes' }).click();
  await p.waitForTimeout(900);
  await shot(p, '05', 'focus-added');
  await ev(p, () => window.__kettle.nearEnd());
  await p.waitForTimeout(400);
  await ev(p, () => window.__kettle.finish());
  await p.waitForTimeout(rm ? 500 : 900);
  await shot(p, '06', 'whistle');
  await p.waitForTimeout(rm ? 2600 : 4600);
  await shot(p, '07', 'summary');
  if (want('08')) {
    await ev(p, () => document.querySelector('[aria-expanded]')?.click());
    await p.waitForTimeout(300);
    await ev(p, () => {
      const s = document.querySelector('[class*=scroll]');
      if (s) s.scrollTop = 99999;
    });
    await p.waitForTimeout(500);
    await shot(p, '08', 'summary-end', { note: 'details expanded, scrolled to the last line' });
  }
  if (anyOf('09', '10')) {
    await p.getByRole('button', { name: /Tea time|Long tea break/ }).click();
    await p.waitForTimeout(2600);
    await shot(p, '09', 'break');
    await ev(p, () => window.__kettle.settings.getState().set({ autoStartFocus: false }));
    await ev(p, () => window.__kettle.finish());
    await p.waitForTimeout(2600);
    await shot(p, '10', 'break-over');
  }
  await p.close();
}
// ---- A major unlock: first frame (drawing while 3D loads), then the settled close-up ----
if (anyOf('11', '11b')) {
  const p = await page('celebrate');
  await ev(p, () => window.__kettle.timer.getState().startFocus({ intention: 'Quarterly report', tag: 'work' }));
  await p.waitForTimeout(2500);
  await ev(p, () => window.__kettle.finish());
  await p.waitForTimeout(rm ? 3000 : 5500);
  await shot(p, '11', 'summary-unlock');
  if (want('11b')) {
    await p.waitForFunction(() => document.querySelector('[class*=unlockScene] [data-scene-ready="true"]'), null, { timeout: 60000 }).catch(() => {});
    await p.waitForTimeout(6000);
    const ready = await ev(p, () => !!document.querySelector('[class*=unlockScene] [data-scene-ready="true"]'));
    await shot(p, '11b', 'summary-unlock-settled', { note: ready ? '3D settled' : '3D not ready: drawing fallback shown' });
  }
  await p.close();
}
// ---- Secondary destinations ----
if (anyOf('15', '17')) {
  const p = await page('blank');
  if (want('15')) {
    await ev(p, () => window.__kettle.navigate('/stats'));
    await p.waitForTimeout(1800);
    await shot(p, '15', 'stats-empty', { full: true });
  }
  if (want('17')) {
    await ev(p, () => window.__kettle.navigate('/nook'));
    await p.waitForTimeout(9000);
    await shot(p, '17', 'nook-early', { full: true });
  }
  await p.close();
}
if (anyOf('16', '18', '19')) {
  const p = await page('veteran');
  if (want('16')) {
    await ev(p, () => window.__kettle.navigate('/stats'));
    await p.waitForTimeout(1800);
    await shot(p, '16', 'stats-populated', { full: true });
  }
  if (want('18')) {
    await ev(p, () => window.__kettle.navigate('/nook'));
    await p.waitForTimeout(9000);
    await shot(p, '18', 'nook-earned', { full: true });
  }
  if (want('19')) {
    await ev(p, () => window.__kettle.navigate('/settings'));
    await p.waitForTimeout(1800);
    await shot(p, '19', 'settings', { full: true });
  }
  await p.close();
}
// ---- First visit: a brand-new browser profile ----
if (anyOf('12', '13', '14')) {
  ctx = await mkctx();
  const p = await page('fresh', '/welcome');
  await shot(p, '12', 'welcome');
  if (anyOf('13', '14')) {
    await p.getByRole('button', { name: /Start a 15-min brew/ }).click();
    await p.waitForTimeout(3000);
    await shot(p, '13', 'first-brew');
    await ev(p, () => window.__kettle.finish());
    await p.waitForTimeout(rm ? 3000 : 5500);
    await shot(p, '14', 'summary-first');
  }
  await p.close();
}
writeFileSync(`${out}/capture-meta.json`, JSON.stringify(meta, null, 2));
if (meta.errors.length) console.log('PAGE ERRORS', meta.errors.join(' | '));
await b.close();
