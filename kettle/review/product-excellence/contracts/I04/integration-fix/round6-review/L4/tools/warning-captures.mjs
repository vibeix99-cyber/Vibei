// L4 (round-6 review) warning-state captures. One invocation = one set (viewport × theme × text size) on one server.
//
//   node .tmp/L4/warning-captures.mjs --base http://127.0.0.1:5301 --rev R6 --wt /home/user/wt/rv6-r6/kettle \
//        --out <dir> --w 390 --h 844 --dpr 2 --theme light --text 100
//
// Written from the L4 brief and tools-level structure of contracts/I03/capture-storage-full.mjs (profile(), fill(), the
// readiness gate); NOT the makers' capture6.mjs. Every state runs in a fresh browser context (a disposable profile) with the
// newbie seed, 3D scene off (stills), sound muted. The debug API (window.__kettle) is used for SETUP only (seed, clock fast-
// forward, leaves); every user action (type, press "Put the kettle on", End session, Tea time, ...) is real input.
// Ordinary toasts are raised through the app's own `ui:toast` event bus with their DEFAULT timers (3.2 s): they expire on their
// real timers, so each state is captured inside that window and the toasts on screen are recorded before and after the shot.
//
//   a-home-warning            storage really full; brew started (typed words + CTA), ended early with End session → Today with
//                             "Kettle's off" and the storage-full warning (warning + 1.0 s)
//   b-focus-warning-toasts    storage really full; brew started; 3 s later two ordinary toasts; shot 1.1 s after the toasts rise
//   c-breakover-toasts        storage really full; brew completed → summary → Tea time → break ends → "Break's over" with the
//                             carried task ("Mark it done, start fresh"); natural toasts left to expire; two toasts raised; shot at +1.1 s
//   d-summary-levelup         storage really full; one leaf below the next cozy level; brew completed → whistle → summary (+2.5 s)
//   c2-breakover-toasts-storage-ok / d2-summary-levelup-storage-ok   the same c and d with storage NOT full
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : '1']);
    return acc;
  }, []),
);
const base = args.base;
const out = args.out;
const W = +args.w, H = +args.h, DPR = +args.dpr;
const theme = args.theme;
const text = +(args.text ?? 100);
const revLabel = args.rev ?? '?';
const wt = args.wt ?? process.cwd();
const aSettle = +(args.asettle ?? 1000); // ms after the warning appears before the shot in state a
const merge = args.merge === '1';
const robust = args.robust === '1'; // warm-up shot + hover-hold of the short-lived toast in state a + strict settled check
const scratch = args.scratch ?? '/tmp';
const noAnim = args.noanim === '1'; // Playwright animations:'disabled' for the shot (infinite CSS animations cancelled), used only where the shot outlasts a 3.2 s toast
const maxAttempts = +(args.attempts ?? 3);
const only = args.only ? new Set(args.only.split(',')) : null;
if (!base || !out || !W || !H || !DPR || !theme) throw new Error('--base --out --w --h --dpr --theme required');
mkdirSync(out, { recursive: true });
const phone = W < 900 && W < H; // same rule as capture.mjs / capture-storage-full.mjs
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WARN_SEL = '[id="toast-kettle:save-failed"]';

const meta = {
  set: `${W}x${H}-${theme}-${text}pct`,
  url: base,
  port: new URL(base).port,
  revisionLabel: revLabel,
  revision: '',
  worktree: wt,
  viewport: { w: W, h: H },
  dpr: DPR,
  isMobileEmulation: phone,
  hasTouch: W < 900,
  theme,
  nooktime: theme === 'light' ? 'day' : null,
  textSizePct: text,
  textSizeMethod: text === 100 ? 'none' : 'html { font-size: 200% } injected at DOMContentLoaded',
  renderer: 'Chromium (Playwright) + SwiftShader (CPU)',
  scene: 'off (stills)',
  screenshot: 'viewport-size PNG at full device resolution (page.screenshot, fullPage false); doc scroll size recorded per state',
  toastTimers: 'default (3.2 s ordinary toast, 12 s storage-full warning); not extended',
  startedAt: new Date().toISOString(),
  endedAt: '',
  states: {},
  errors: [],
};
try {
  meta.revision = execSync(`git -C ${wt} rev-parse --short HEAD`, { encoding: 'utf8' }).trim() + (execSync(`git -C ${wt} status --porcelain -- src`, { encoding: 'utf8' }).trim() ? '+dirty' : '');
  meta.kettleSrcTree = execSync(`git -C ${wt} rev-parse HEAD:./src`, { encoding: 'utf8' }).trim().slice(0, 7);
} catch (e) {
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
  if (text !== 100) {
    await ctx.addInitScript((pct) => {
      const add = () => {
        const s = document.createElement('style');
        s.setAttribute('data-l4-text', '');
        s.textContent = `html { font-size: ${pct}% }`;
        document.head.appendChild(s);
      };
      if (document.head) add();
      else addEventListener('DOMContentLoaded', add);
    }, text);
  }
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => {
    errors.push(e.message);
    meta.errors.push(e.message);
  });
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
  await page.evaluate(() => window.__kettle.timer.setState({}));
  if (!(await page.evaluate(() => localStorage.getItem('kettle:timer')))) throw new Error('timer not saved');
  await sleep(600);
  return { ctx, page, errors };
}

// I03's fill: whole megabyte chunks, halving until the quota refuses anything of 8 bytes.
const fill = async (page) => {
  await page.evaluate(() => {
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
  return page.evaluate(() => {
    try {
      localStorage.setItem('l4probe', 'x'.repeat(64));
      localStorage.removeItem('l4probe');
      return 'NO ERROR (storage not full)';
    } catch (e) {
      return e.name;
    }
  });
};

const toastsOf = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => {
      const r = li.getBoundingClientRect();
      return { id: li.id, text: li.textContent.trim().slice(0, 90), rect: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)], opacity: +getComputedStyle(li).opacity };
    }),
  );
const warmShot = async (page) => {
  if (!robust) return;
  await page.screenshot({ path: `${scratch}/warm-${process.pid}.png`, timeout: 240000 }); // discarded: the first frame after a change is the slow one
};
const raise = (page, items) =>
  page.evaluate(async (items) => {
    const { emit } = await import('/src/lib/events.ts');
    for (const [message, tone] of items) emit('ui:toast', { message, tone });
  }, items);
const MSGS = [['Recipe done: Take 2 full tea breaks · +15 leaves', 'success'], ['New badge: Tea Time', 'success']];

// Real input: type the words, press "Put the kettle on".
async function startBrew(page) {
  const field = page.getByRole('textbox', { name: /What are you brewing/ });
  await field.click();
  await field.fill('Chapter 3 notes');
  await page.mouse.move(1, 1);
  await page.getByRole('button', { name: /^Put the kettle on/ }).click();
  await page.waitForFunction(() => location.hash === '#/focus', null, { timeout: 30_000 });
}
const waitToastsGone = async (page, ms) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if ((await page.locator('[aria-label="Notifications"] li').count()) === 0) return true;
    await sleep(250);
  }
  return false;
};

const STATES = {
  async 'a-home-warning'(page, info) {
    info.dataState = 'storage really full (QuotaExceededError on a 64-byte write): ' + (info.quotaProbe = await fill(page));
    await startBrew(page);
    await sleep(2500);
    await page.getByRole('button', { name: 'End session' }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'End session' }).click();
    await page.waitForFunction(() => location.hash === '#/' || location.hash === '', null, { timeout: 30_000 });
    info.warningAppeared = await page.waitForSelector(WARN_SEL, { timeout: 8000 }).then(() => true, () => false);
    if (robust) {
      // "Settled" = both toasts (the 3.2 s "Kettle's off" and the storage-full warning) fully drawn. Poll every 50 ms and shoot at once:
      // the short toast keeps its real timer, so there is no room for a fixed wait.
      info.settleMs = 'polled until both toasts at opacity >= 0.9';
      await page
        .waitForFunction(() => {
          const li = [...document.querySelectorAll('[aria-label="Notifications"] li')];
          const off = li.find((l) => /Kettle’s off/.test(l.textContent));
          const warn = li.find((l) => l.id === 'toast-kettle:save-failed');
          return !!off && !!warn && +getComputedStyle(off).opacity >= 0.9 && +getComputedStyle(warn).opacity >= 0.9;
        }, null, { polling: 50, timeout: 6000 })
        .catch(() => {});
    } else {
      info.settleMs = aSettle;
      await sleep(aSettle);
    }
  },
  async 'b-focus-warning-toasts'(page, info) {
    info.dataState = 'storage really full (QuotaExceededError on a 64-byte write): ' + (info.quotaProbe = await fill(page));
    await startBrew(page);
    await sleep(3000);
    info.warningBeforeToasts = !!(await page.$(WARN_SEL));
    await page.mouse.move(1, 1);
    await warmShot(page);
    await raise(page, MSGS);
    info.toastsRaisedAt = new Date().toISOString();
    await sleep(1100);
  },
  async 'c-breakover-toasts'(page, info) {
    info.dataState = 'storage really full (QuotaExceededError on a 64-byte write): ' + (info.quotaProbe = await fill(page));
    await breakOver(page, info);
  },
  async 'd-summary-levelup'(page, info) {
    info.dataState = 'storage really full (QuotaExceededError on a 64-byte write): ' + (info.quotaProbe = await fill(page));
    await levelUp(page, info);
  },
  async 'c2-breakover-toasts-storage-ok'(page, info) {
    info.dataState = 'storage NOT full (normal profile, newbie seed)';
    await breakOver(page, info);
  },
  async 'd2-summary-levelup-storage-ok'(page, info) {
    info.dataState = 'storage NOT full (normal profile, newbie seed)';
    await levelUp(page, info);
  },
};

async function breakOver(page, info) {
  await startBrew(page);
  await sleep(2500);
  await page.evaluate(() => window.__kettle.nearEnd());
  await sleep(400);
  await page.evaluate(() => window.__kettle.finish());
  const tea = page.getByRole('button', { name: /Tea time|Long tea break/ });
  await tea.waitFor({ state: 'visible', timeout: 60_000 });
  await sleep(1500);
  await tea.click(); // real input
  await sleep(2000);
  await page.evaluate(() => window.__kettle.finish()); // break runs out (clock fast-forward = setup)
  const mark = page.getByRole('button', { name: /Mark it done, start fresh/ });
  await mark.waitFor({ state: 'visible', timeout: 30_000 });
  info.carriedTaskControl = true;
  info.naturalToastsExpired = await waitToastsGone(page, 9000); // they leave on their own timers
  await sleep(1200);
  await page.mouse.move(1, 1);
  await warmShot(page);
  await raise(page, MSGS);
  info.toastsRaisedAt = new Date().toISOString();
  await sleep(1100);
}
async function levelUp(page, info) {
  info.levelBefore = await page.evaluate(async () => {
    const { leavesForLevel, levelFromLeaves } = await import('/src/progress/levels.ts');
    const L = levelFromLeaves(window.__kettle.progress.getState().leaves).level;
    window.__kettle.progress.setState({ leaves: leavesForLevel(L + 1) - 1 }); // setup: one leaf below the next cozy level
    return L;
  });
  await startBrew(page);
  await sleep(2500);
  await page.evaluate(() => window.__kettle.nearEnd());
  await sleep(400);
  await page.evaluate(() => window.__kettle.finish());
  await page.getByRole('button', { name: /Tea time|Long tea break/ }).waitFor({ state: 'visible', timeout: 60_000 });
  await sleep(2500);
  info.levelAfter = await page.evaluate(async () => {
    const { levelFromLeaves } = await import('/src/progress/levels.ts');
    return levelFromLeaves(window.__kettle.progress.getState().leaves).level;
  });
}

const sameToasts = (a, b) => JSON.stringify(a.map((t) => t.text)) === JSON.stringify(b.map((t) => t.text));
let ok = 0, failed = 0;
for (const [name, run] of Object.entries(STATES)) {
  if (only && ![...only].some((o) => name.startsWith(o))) continue;
  let info = {};
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    info = { attempt };
    let ctx;
    try {
      const pr = await profile();
      ctx = pr.ctx;
      const { page, errors } = pr;
      await run(page, info);
      info.toastsBefore = await toastsOf(page); // the one evaluate between the settle and the shot, so a short-lived toast is not lost to bookkeeping
      info.capturedAt = new Date().toISOString();
      const file = `${name}.png`;
      const t0 = Date.now();
      await page.screenshot({ path: `${out}/${file}`, timeout: 240000, animations: noAnim ? 'disabled' : 'allow' });
      info.screenshotAnimations = noAnim ? 'disabled' : 'allow';
      info.shotMs = Date.now() - t0;
      info.toastsAfter = await toastsOf(page);
      info.route = await page.evaluate(() => location.hash);
      info.warningRect = await page.evaluate((sel) => {
        const w = document.querySelector(sel);
        if (!w) return null;
        const r = w.getBoundingClientRect();
        return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)];
      }, WARN_SEL);
      info.page = await page.evaluate(() => ({
        innerWidth, innerHeight, dpr: devicePixelRatio,
        htmlFontPx: parseFloat(getComputedStyle(document.documentElement).fontSize),
        dark: matchMedia('(prefers-color-scheme: dark)').matches,
        docScroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
        dataTheme: document.documentElement.dataset.theme ?? null,
        summaryText: [...document.querySelectorAll('main')].map((m) => m.innerText.replace(/\s+/g, ' ').slice(0, 220))[0] ?? null,
      }));
      info.file = file;
      info.pageErrors = errors.slice();
      info.holdStop?.();
      delete info.holdStop;
      await ctx.close();
      ctx = null;
      // The shot is only valid if the toasts the page showed did not change while it was taken.
      const need = name.startsWith('a-') ? (robust ? 2 : 1) : name.startsWith('b-') || name.startsWith('c') ? 2 : 0;
      const stable = sameToasts(info.toastsBefore, info.toastsAfter) && info.toastsBefore.length >= need;
      info.stable = stable;
      const thr = name.startsWith('a-') ? 0.9 : 0.98;
      info.opacityThreshold = thr;
      const full = [...info.toastsBefore, ...info.toastsAfter].every((t) => t.opacity >= thr);
      info.fullyDrawn = full; // every toast at full opacity both before and after the shot: the frame cannot be mid-fade
      if (stable && (full || !robust)) break;
      if (stable && !full) info.unstableReason = `toast opacities before ${JSON.stringify(info.toastsBefore.map((t) => +t.opacity.toFixed(2)))} after ${JSON.stringify(info.toastsAfter.map((t) => +t.opacity.toFixed(2)))}`;
      if (stable && !full) { console.log(`${meta.set} ${name}: attempt ${attempt} not fully drawn: ${info.unstableReason}`); continue; }
      info.unstableReason = `toasts before ${JSON.stringify(info.toastsBefore.map((t) => t.text.slice(0, 24)))} vs after ${JSON.stringify(info.toastsAfter.map((t) => t.text.slice(0, 24)))}`;
      console.log(`${meta.set} ${name}: attempt ${attempt} unstable: ${info.unstableReason}`);
    } catch (e) {
      info.error = String(e.message).split('\n')[0];
      try { info.holdStop?.(); delete info.holdStop; } catch { /* ignore */ }
      console.log(`${meta.set} ${name}: attempt ${attempt} ERROR ${info.error}`);
      try { await ctx?.close(); } catch { /* ignore */ }
    }
  }
  delete info.holdStop;
  meta.states[name] = info;
  if (info.file && info.stable) ok++; else failed++;
  console.log(`${meta.set} ${name}: ${info.error ? 'ERROR ' + info.error : 'ok'} stable=${info.stable} attempts=${info.attempt} route ${info.route} toasts ${JSON.stringify((info.toastsAfter ?? []).map((t) => t.text.slice(0, 26)))} warning ${JSON.stringify(info.warningRect)} font ${info.page?.htmlFontPx}px`);
}
meta.endedAt = new Date().toISOString();
if (merge && existsSync(`${out}/meta.json`)) {
  const old = JSON.parse(readFileSync(`${out}/meta.json`, 'utf8'));
  old.rerun = [...(old.rerun ?? []), { states: Object.keys(meta.states), startedAt: meta.startedAt, endedAt: meta.endedAt, asettleMs: aSettle, note: 'replaced after the first run left these states with toasts that expired during the shot' }];
  old.states = { ...old.states, ...meta.states };
  old.errors = [...old.errors, ...meta.errors];
  old.endedAt = meta.endedAt;
  Object.assign(meta, old);
}
meta.summary = { states: Object.keys(meta.states).length, ok: Object.values(meta.states).filter((v) => v.file && v.stable).length, failed: Object.values(meta.states).filter((v) => !(v.file && v.stable)).length };
writeFileSync(`${out}/meta.json`, JSON.stringify(meta, null, 1));
if (meta.errors.length) console.log('PAGE ERRORS', meta.errors.join(' | '));
await browser.close();
