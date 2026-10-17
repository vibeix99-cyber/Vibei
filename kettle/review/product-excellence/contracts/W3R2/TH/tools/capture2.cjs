// W3R2 maker TH captures: BEFORE (integration dev :5560) / AFTER (fix dev :5582), notice states, full size (DPR 1).
// Derived from W3R1 maker F's capture.cjs (same frozen date 2026-10-12T07:40Z, same seeds, same settings); adds the two live-notice states.
// node capture2.cjs <label=port,label=port,...> <outDir> <sizes, e.g. 390x844,375x667> [states csv]
// Each job is captured for every label=port in turn (e.g. before=5560,after=5582,before2=5560), back to back, so the three
// are taken under the same machine load. Every shot waits until the screen is settled (opacity 1, dialog still) and is retaken if blank.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const [targetsArg, outDir, sizesArg, statesArg] = process.argv.slice(2);
const TARGETS = targetsArg.split(',').map((t) => t.split('='));
const SIZES = sizesArg.split(',').map((s) => s.split('x').map(Number));
const MONDAY = Date.parse('2026-10-12T07:40:00.000Z');
const DAY = 86_400_000;

const ready = (page) =>
  page.waitForFunction(() => {
    const i = window.__kettle?.timerInfo?.();
    return !!(i && i.leader && i.leaderForMs > 400 && !i.settling);
  }, null, { timeout: 60_000 });

async function settle(p) {
  await p.waitForFunction(() => {
    const m = document.querySelector('main') || document.body;
    for (let e = m; e && e !== document.documentElement; e = e.parentElement) if (parseFloat(getComputedStyle(e).opacity) < 0.999) return false;
    return (m.innerText || '').trim().length > 20 && !document.querySelector('[data-route-leaving]');
  }, null, { timeout: 25_000 }).catch(() => {});
  let last = '';
  for (let i = 0; i < 16; i++) {
    const r = await p.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      if (!d) return 'none';
      const b = d.getBoundingClientRect();
      let o = 1;
      for (let e = d; e && e !== document.documentElement; e = e.parentElement) o = Math.min(o, parseFloat(getComputedStyle(e).opacity));
      return [b.x, b.y, b.width, b.height, o].map((v) => Math.round(v * 10) / 10).join(',');
    });
    if (r === last && (r === 'none' || r.endsWith(',1'))) break;
    last = r;
    await p.waitForTimeout(250);
  }
  await p.waitForTimeout(300);
}
async function load(page, seed, theme) {
  await page.goto(`${page.__base}/?debug&seed=${seed}&theme=${theme}#/`);
  await ready(page);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
}
async function tap(page, loc, touch) {
  await loc.scrollIntoViewIfNeeded();
  const b = await loc.boundingBox();
  if (touch) await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  else await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
}
async function missed(page, seed, theme) {
  await load(page, seed, theme);
  // Two days on: yesterday went by with no brew (a Tea Cozy covers it where one is held).
  await page.evaluate((ms) => window.__kettle.ff(ms), 2 * DAY);
  await page.waitForTimeout(1500);
  await page.evaluate(() => scrollTo(0, 0));
}
async function startTask(page, theme, touch) {
  await load(page, 'newbie', theme);
  const field = page.getByRole('textbox', { name: /What are you brewing/ });
  await tap(page, field, touch);
  await page.keyboard.type('Chapter 3 notes');
  await tap(page, page.getByRole('button', { name: /^Put the kettle on · / }), touch);
  await page.waitForFunction(() => location.hash === '#/focus');
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.__kettle.ff(3 * 60_000));
  await page.waitForTimeout(500);
}
async function endSheet(page, touch) {
  await tap(page, page.getByRole('button', { name: 'End session' }).first(), touch);
  await page.getByRole('dialog', { name: 'Leave the kettle early?' }).waitFor();
  await page.waitForTimeout(700);
}
async function openWarm(page, touch) {
  const b = page.locator('[data-kind="streak"]').first();
  await tap(page, b, touch);
  await page.getByRole('dialog').waitFor();
  await page.waitForTimeout(700);
}

async function rail(p, setup) {
  await setup();
  await p.evaluate(() => window.__kettle.navigate('/settings'));
  await p.waitForTimeout(1500);
}
const STATES = {
  'today-blank': async (p, t) => load(p, 'blank', t),
  'today-newbie': async (p, t) => load(p, 'newbie', t),
  'today-veteran': async (p, t) => load(p, 'veteran', t),
  'today-atRisk': async (p, t) => load(p, 'atRisk', t),
  'today-missed-cozy': async (p, t) => missed(p, 'veteran', t),
  'today-missed-nocozy': async (p, t) => missed(p, 'newbie', t),
  'sheet-warm-atRisk': async (p, t, touch) => {
    await load(p, 'atRisk', t);
    await openWarm(p, touch);
  },
  'sheet-warm-missed-cozy': async (p, t, touch) => {
    await missed(p, 'veteran', t);
    await openWarm(p, touch);
  },
  'end-sheet': async (p, t, touch) => {
    await startTask(p, t, touch);
    await endSheet(p, touch);
  },
  'session-running': async (p, t, touch) => {
    await startTask(p, t, touch);
  },
  'rail-blank': async (p, t) => rail(p, () => load(p, 'blank', t)),
  'rail-newbie': async (p, t) => rail(p, () => load(p, 'newbie', t)),
  'rail-atRisk': async (p, t) => rail(p, () => load(p, 'atRisk', t)),
  'rail-missed-cozy': async (p, t) => rail(p, () => missed(p, 'veteran', t)),
  'rail-missed-nocozy': async (p, t) => rail(p, () => missed(p, 'newbie', t)),
  'today-after-end-notice': async (p, t, touch) => {
    // The toast End raises ("Saved N minutes of focus"), shown in the Today strip.
    await startTask(p, t, touch);
    await endSheet(p, touch);
    await tap(p, p.getByRole('dialog', { name: 'Leave the kettle early?' }).getByRole('button', { name: 'End session' }), touch);
    await p.waitForFunction(() => location.hash === '#/');
    await p.waitForFunction(() => document.querySelectorAll('[data-notice-strip] li').length > 0, null, { timeout: 15_000 });
    // Hold its clock (the pointer over the notice) so the shot does not depend on how fast the machine is.
    const b = await p.locator('[data-notice-strip] li').first().boundingBox();
    if (b) await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await p.waitForTimeout(700);
  },
  'stats-brew-updated': async (p, t) => {
    // A live notice strip on Stats: the notice History raises on Save, kept long enough to be looked at.
    await load(p, 'veteran', t);
    await p.evaluate(() => window.__kettle.navigate('/stats'));
    await p.waitForFunction(() => location.hash === '#/stats');
    await p.waitForTimeout(1500);
    await p.evaluate(() => window.__kettle.toast('Brew updated', { tone: 'success', icon: 'check', duration: 60_000 }));
    await p.waitForFunction(() => document.querySelectorAll('[data-notice-strip] li').length > 0, null, { timeout: 15_000 });
    await p.waitForTimeout(900);
  },
  'today-after-end-gone': async (p, t, touch) => {
    await startTask(p, t, touch);
    await endSheet(p, touch);
    await tap(p, p.getByRole('dialog', { name: 'Leave the kettle early?' }).getByRole('button', { name: 'End session' }), touch);
    await p.waitForFunction(() => location.hash === '#/');
    await p.mouse.move(1, 1).catch(() => {});
    // The notice shown, then gone at rest (its time runs only while it is in view).
    await p.waitForFunction(() => document.querySelectorAll('[data-notice-strip] li').length > 0, null, { timeout: 15_000 }).catch(() => {});
    await p.waitForFunction(() => document.querySelectorAll('[data-notice-strip] li').length === 0, null, { timeout: 20_000 }).catch(() => {});
    await p.waitForTimeout(1500);
  },
};

(async () => {
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  const states = statesArg ? statesArg.split(',') : Object.keys(STATES).filter((k) => k !== 'today-veteran' && !k.startsWith('rail-'));
  const only = process.env.CFGS ? process.env.CFGS.split(',') : null;
  const facts = [];
  const jobs = [];
  for (const [w, h] of SIZES)
    for (const theme of ['light', 'dark'])
      for (const pct of [100, 200]) {
        const cfg = `${w}x${h}-${theme}-t${pct}`;
        if (only && !only.includes(cfg)) continue;
        for (const st of states) jobs.push({ w, h, theme, pct, cfg, st });
      }
  const shoot = async ({ w, h, theme, pct, cfg, st }, label, port) => {
    const touch = w < 900;
    const dir = path.join(outDir, label, cfg);
    fs.mkdirSync(dir, { recursive: true });
    for (let attempt = 1; attempt <= 3; attempt++) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: touch, hasTouch: touch, colorScheme: theme });
      await ctx.addInitScript((pct) => {
        try {
          localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 }));
        } catch {}
        if (pct !== 100)
          addEventListener('DOMContentLoaded', () => {
            const s = document.createElement('style');
            s.textContent = `html{font-size:${pct}%!important}`;
            document.head.appendChild(s);
          });
      }, pct);
      const page = await ctx.newPage();
      page.__base = `http://127.0.0.1:${port}`;
      await page.clock.install({ time: MONDAY });
      await page.clock.resume();
      try {
        await STATES[st](page, theme, touch);
        await settle(page);
        const f = await page.evaluate(() => ({
          chai: document.querySelector('[class*="bubble"]')?.textContent?.trim().slice(0, 200) ?? null,
          dialog: document.querySelector('[role="dialog"]')?.innerText?.replace(/\s+/g, ' ').slice(0, 400) ?? null,
          rail: document.querySelector('[aria-labelledby="rail-streak"]')?.innerText?.replace(/\s+/g, ' ').slice(0, 200) ?? null,
          strip: [...document.querySelectorAll('[data-notice-strip]')].map((e) => Math.round(e.getBoundingClientRect().height)),
          streakWords: /streak/i.test(document.body.innerText),
          text: (document.querySelector('main')?.innerText ?? document.body.innerText).trim().length,
          leaving: document.querySelectorAll('[data-route-leaving]').length,
        }));
        if (f.text < 20 && attempt < 3) { await ctx.close(); continue; }
        await page.screenshot({ path: path.join(dir, `${st}.png`) });
        facts.push({ label, cfg, state: st, attempt, ...f });
        await ctx.close();
        return;
      } catch (e) {
        if (attempt === 3) {
          facts.push({ label, cfg, state: st, error: String(e).slice(0, 300) });
          console.error(label, st, cfg, String(e).slice(0, 200));
        }
      }
      await ctx.close().catch(() => {});
    }
  };
  // One job = one state in one configuration, captured for every target back to back (same load for all of them).
  const one = async (job) => { for (const [label, port] of TARGETS) await shoot(job, label, port); };
  const N = Number(process.env.PAR || 3);
  let i = 0;
  await Promise.all(Array.from({ length: N }, async () => { while (i < jobs.length) await one(jobs[i++]); }));
  fs.writeFileSync(path.join(outDir, `facts-${sizesArg}-${Date.now()}.json`), JSON.stringify(facts, null, 1));
  await browser.close();
})();
