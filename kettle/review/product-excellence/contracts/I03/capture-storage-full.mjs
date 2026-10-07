// I03 BEFORE/AFTER capture: the two states the storage-full repair changes (they are not in tools/capture.mjs).
//
//   node review/product-excellence/contracts/I03/capture-storage-full.mjs --base http://127.0.0.1:5201 --out <dir> \
//        --w 390 --h 844 --dpr 2 --theme light [--rev <served revision>]
//
//   s0-brew-start-storage-full       a newbie profile whose localStorage quota is really full starts a brew (1.2 s in)
//   s1-brew-completes-storage-full   …that brew reaches its end (6 s after 0:00: whistle → summary, or, before the
//                                    repair, the brew vanishing). The s0 toast, if any, is tapped away first, as a
//                                    real brew would long outlast it.
//   s3-after-summary-storage-full    …the person leaves the summary with Skip break (before the repair there is no
//                                    summary to leave: the page is already on Today), 1.5 s later
//   s2-restore-storage-full          the same kind of profile adds a valid backup (one new brew) from Settings › Your data
//
// Each state runs in a fresh browser context (a disposable profile). The 3D scene is off (pre-rendered stills), so
// both sides render the same stage. Writes <out>/<state>.png and <out>/capture-meta.json.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : '1']);
    return acc;
  }, []),
);
const base = args.base ?? 'http://127.0.0.1:5201';
const out = args.out;
const W = +(args.w ?? 390);
const H = +(args.h ?? 844);
const DPR = +(args.dpr ?? 2);
const theme = args.theme ?? 'light';
if (!out) throw new Error('--out required');
mkdirSync(out, { recursive: true });
const phone = W < 900 && W < H;

const meta = { base, viewport: { w: W, h: H }, dpr: DPR, theme, renderer: 'Chromium (Playwright) + SwiftShader (CPU)', scene: 'off (stills)', revision: '', capturedAt: new Date().toISOString(), states: {}, errors: [] };
try {
  // --rev names the code the server at --base serves, when that isn't this checkout (e.g. a clean BEFORE copy).
  meta.revision = args.rev ?? execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim() + (execSync('git status --porcelain -- src', { encoding: 'utf8' }).trim() ? '+dirty' : '');
} catch {
  meta.revision = 'unknown';
}

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });

async function profile() {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: phone, hasTouch: W < 900, colorScheme: theme });
  await ctx.addInitScript(() => {
    try {
      if (!localStorage.getItem('kettle:settings'))
        localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 }));
    } catch {
      /* ignore */
    }
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => meta.errors.push(e.message));
  const nt = theme === 'light' ? '&nooktime=day' : '';
  const ready = () =>
    page.waitForFunction(() => {
      const i = window.__kettle?.timerInfo?.();
      return !!(i && i.leader && i.leaderForMs > 400 && !i.settling);
    }, null, { timeout: 60_000 });
  await page.goto(`${base}/?debug&theme=${theme}${nt}#/`);
  await ready();
  await page.evaluate(() => window.__kettle.seed('newbie'));
  await page.reload();
  await ready();
  await page.evaluate(() => document.fonts.ready);
  // A returning person's profile always holds a saved timer (every brew writes one); a freshly seeded one may not
  // have it yet, depending on boot timing. Save it now so every run starts from the same state.
  await page.evaluate(() => window.__kettle.timer.setState({}));
  if (!(await page.evaluate(() => localStorage.getItem('kettle:timer')))) throw new Error('timer not saved');
  return { ctx, page };
}

const fill = (page) =>
  page.evaluate(() => {
    let chunk = 'x'.repeat(1024 * 1024);
    let i = 0;
    while (chunk.length >= 8) {
      try {
        localStorage.setItem(`filler${i++}`, chunk);
      } catch {
        chunk = chunk.slice(0, chunk.length / 2);
      }
    }
  });

const toasts = (page) => page.evaluate(() => [...document.querySelectorAll('[aria-label="Notifications"] li')].map((l) => l.textContent));

// s0 → s1 → s3: a brew starts, completes and is left while storage is full.
{
  const { ctx, page } = await profile();
  await fill(page);
  await page.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
  await page.waitForTimeout(1200);
  meta.states.s0 = { hash: await page.evaluate(() => location.hash), toast: await toasts(page) };
  await page.screenshot({ path: `${out}/s0-brew-start-storage-full.png` });

  for (const li of await page.locator('[aria-label="Notifications"] li').all()) await li.click({ position: { x: 12, y: 12 } }).catch(() => {});
  await page.evaluate(() => {
    const k = window.__kettle;
    const s = k.timer.getState();
    k.ff(s.endsAt - k.clock.now() - 50);
  });
  await page.waitForTimeout(6000); // whistle → summary (or, before the repair, the brew vanishing)
  meta.states.s1 = { hash: await page.evaluate(() => location.hash), sessions: await page.evaluate(() => window.__kettle.progress.getState().sessions.length), toast: await toasts(page) };
  await page.screenshot({ path: `${out}/s1-brew-completes-storage-full.png` });

  const skip = page.getByRole('button', { name: 'Skip break' });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.waitForTimeout(1500);
  meta.states.s3 = { hash: await page.evaluate(() => location.hash), toast: await toasts(page) };
  await page.screenshot({ path: `${out}/s3-after-summary-storage-full.png` });
  await ctx.close();
}

// s2: adding a valid backup while storage is full.
{
  const { ctx, page } = await profile();
  const backup = await page.evaluate(() => {
    const progress = JSON.parse(localStorage.getItem('kettle:progress')).state;
    const settings = JSON.parse(localStorage.getItem('kettle:settings')).state;
    progress.sessions.push({ ...progress.sessions[0], id: 's_from_backup' });
    return JSON.stringify({ app: 'kettle', kind: 'backup', schema: 2, exportedAt: new Date().toISOString(), progress, settings });
  });
  await page.evaluate(() => window.__kettle.navigate('/settings'));
  await page.getByRole('button', { name: /Import a backup/ }).waitFor();
  await fill(page);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: /Import a backup/ }).click()]);
  await chooser.setFiles({ name: 'kettle-backup.json', mimeType: 'application/json', buffer: Buffer.from(backup) });
  await page.getByRole('dialog', { name: 'Add this backup?' }).getByRole('button', { name: 'Add' }).click();
  await page.waitForTimeout(1500);
  // Show "Your data" and whatever it says under it (the inline message slot follows the list).
  await page.evaluate(() => (document.querySelector('[role="alert"]') ?? [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('Reset everything')))?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(600);
  const state = await page.evaluate(() => ({
    alert: document.querySelector('[role="alert"]')?.textContent ?? null,
    toast: [...document.querySelectorAll('[aria-label="Notifications"] li')].map((l) => l.textContent),
    sessions: window.__kettle.progress.getState().sessions.length,
    imported: window.__kettle.progress.getState().sessions.some((s) => s.id === 's_from_backup'),
  }));
  await page.screenshot({ path: `${out}/s2-restore-storage-full.png` });
  meta.states.s2 = state;
  await ctx.close();
}

writeFileSync(`${out}/capture-meta.json`, JSON.stringify(meta, null, 2));
await browser.close();
console.log(JSON.stringify(meta.states));
