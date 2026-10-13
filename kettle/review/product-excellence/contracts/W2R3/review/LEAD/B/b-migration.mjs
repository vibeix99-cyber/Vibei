// Lead checker W2R3 / Maker B: pre-rename profile made on the BEFORE build (:5480, 61aba17), loaded unchanged into the
// AFTER build (:5485, trial e1ddf9d). One browser; real clicks/wheel for navigation; debug API only to seed + finish
// the brew on the BEFORE build.
import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = process.argv[2] ?? '/home/user/wt/w4-base/kettle/.tmp/LEAD3/b';
fs.mkdirSync(OUT, { recursive: true });
const BEFORE = 'http://127.0.0.1:5480';
const AFTER = 'http://127.0.0.1:5485';
const FIXED = Date.parse('2026-10-11T07:40:00Z');
const CONFIGS = [
  { id: '390x844-light', w: 390, h: 844, dpr: 2, theme: 'light' },
  { id: '1440x900-dark', w: 1440, h: 900, dpr: 1, theme: 'dark' },
  { id: '375x667-light-200', w: 375, h: 667, dpr: 2, theme: 'light', text: 200 },
];
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const results = {};

function textInit(pct) {
  return (p) => {
    addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = `html{font-size:${p}%!important}`;
      document.head.appendChild(s);
    });
  };
}

async function waitLeader(page) {
  await page.waitForFunction(() => {
    const t = window.__kettle?.timerInfo?.();
    return !!(t && t.leader && t.leaderForMs > 400 && !t.settling);
  }, null, { timeout: 90_000 });
}

/** What the summary shows and what a screen reader gets about the badge. */
async function summaryFacts(page) {
  return page.evaluate(() => {
    const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
    const view = document.querySelector('[data-focus-view]') ?? document.body;
    const pills = [...view.querySelectorAll('*')].filter((e) => e.children.length === 0 && /Badge:/.test(e.textContent || '')).map((e) => norm(e.textContent));
    const pillHosts = [...view.querySelectorAll('*')].filter((e) => /^Badge:/.test(norm(e.textContent)) && ![...e.children].some((c) => /^Badge:/.test(norm(c.textContent))));
    const aria = [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((t) => /warm|badge/i.test(t || ''));
    const live = [...document.querySelectorAll('[aria-live], [role=status], [role=alert]')].map((e) => norm(e.textContent)).filter(Boolean);
    const all = norm(document.body.innerText);
    return {
      heading: norm(document.querySelector('h1')?.textContent),
      pills: [...new Set(pills)],
      pillHostHTML: pillHosts.slice(0, 2).map((e) => e.outerHTML.slice(0, 400)),
      aria,
      live,
      hasOld: /Warm Streak/.test(all) || aria.some((a) => /Warm Streak/.test(a)) || live.some((l) => /Warm Streak/.test(l)),
      hasNew: /Warm Days/.test(all) || aria.some((a) => /Warm Days/.test(a)) || live.some((l) => /Warm Days/.test(l)),
    };
  });
}

async function storageDump(page) {
  return page.evaluate(() => {
    const ls = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); }
    const ss = {};
    for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); ss[k] = sessionStorage.getItem(k); }
    return { ls, ss };
  });
}

/** Wheel the summary until the badge pill is in view, then screenshot. */
async function showPill(page, file) {
  const pill = page.getByText(/^Badge: Warm (Streak|Days)/).first();
  for (let i = 0; i < 12; i++) {
    const box = await pill.boundingBox();
    const vh = page.viewportSize().height;
    if (box && box.y > 60 && box.y + box.height < vh - 140) break;
    const region = await page.locator('[data-focus-view] [role=region]').first().boundingBox();
    if (region) await page.mouse.move(region.x + region.width / 2, region.y + region.height / 2);
    await page.mouse.wheel(0, 140);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: file });
}

/** Through the UI: Stats tab → Badges card → the Warm badge → its sheet. */
async function statsBadges(page, cfg, prefix) {
  const statsLink = page.getByRole('link', { name: /^stats$/i }).or(page.getByRole('button', { name: /^stats$/i })).or(page.getByRole('tab', { name: /^stats$/i }));
  if (await statsLink.count()) await statsLink.first().click();
  else await page.evaluate(() => (location.hash = '#/stats'));
  await page.waitForFunction(() => location.hash.includes('stats'), null, { timeout: 15_000 });
  await page.waitForTimeout(1500);
  const btn = page.getByRole('button', { name: /^Warm (Streak|Days),/ }).first();
  await btn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const card = page.locator('section', { has: page.getByRole('heading', { name: 'Badges' }) }).first();
  await card.screenshot({ path: `${OUT}/${prefix}-stats-badges-card-${cfg.id}.png` });
  await page.screenshot({ path: `${OUT}/${prefix}-stats-badges-${cfg.id}.png` });
  const info = {
    btnAria: await btn.getAttribute('aria-label'),
    btnName: await btn.locator('span').nth(0).textContent().catch(() => null),
    names: await page.evaluate(() => [...document.querySelectorAll('[class*=badgeName]')].map((e) => e.textContent)),
  };
  const b = await btn.boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  const dlg = page.getByRole('dialog').last();
  await dlg.waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForTimeout(900);
  info.sheetTitle = await dlg.getByRole('heading').first().textContent().catch(() => null);
  info.sheetLabel = await dlg.getAttribute('aria-label');
  info.sheetLabelledBy = await dlg.evaluate((d) => { const id = d.getAttribute('aria-labelledby'); return id ? document.getElementById(id)?.textContent : null; });
  info.sheetText = (await dlg.innerText()).replace(/\s+/g, ' ').trim();
  await page.screenshot({ path: `${OUT}/${prefix}-stats-badge-sheet-${cfg.id}.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  return info;
}

const browser = await chromium.launch();
try {
  for (const cfg of CONFIGS) {
    const r = (results[cfg.id] = {});
    const ctxOpts = { viewport: { width: cfg.w, height: cfg.h }, deviceScaleFactor: cfg.dpr, colorScheme: cfg.theme };

    // 1. BEFORE build: celebrate seed, one finished brew → a pre-rename profile.
    log(cfg.id, 'BEFORE: make profile');
    let ctx = await browser.newContext(ctxOpts);
    let page = await ctx.newPage();
    if (cfg.text) await page.addInitScript(textInit(), cfg.text);
    await page.clock.install({ time: FIXED });
    await page.clock.resume();
    await page.goto(`${BEFORE}/?debug&seed=celebrate&theme=${cfg.theme}#/`);
    await waitLeader(page);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
    await page.waitForTimeout(900);
    await page.getByRole('button', { name: /put the kettle on/i }).first().click();
    await page.waitForFunction(() => location.hash === '#/focus');
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.__kettle.finish());
    await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 });
    await page.getByRole('heading', { level: 1, name: /minutes? brewed/ }).waitFor({ timeout: 30_000 });
    await page.waitForTimeout(2500);
    r.beforeSummary = await summaryFacts(page);
    await page.screenshot({ path: `${OUT}/before-summary-arrival-${cfg.id}.png` });
    const dump = await storageDump(page);
    fs.writeFileSync(`${OUT}/pre-rename-storage-${cfg.id}.json`, JSON.stringify(dump, null, 1));
    const prog = JSON.parse(dump.ls['kettle:progress']);
    r.storedReportBadges = prog.state.lastReport?.badges;
    r.storedVersion = prog.version;
    await showPill(page, `${OUT}/before-summary-pill-${cfg.id}.png`);
    r.beforeStats = await statsBadges(page, cfg, 'before');
    await ctx.close();

    // 2. AFTER build: the exact same storage, no seed, no debug, straight to the summary.
    log(cfg.id, 'AFTER: load pre-rename profile');
    ctx = await browser.newContext(ctxOpts);
    page = await ctx.newPage();
    if (cfg.text) await page.addInitScript(textInit(), cfg.text);
    await page.addInitScript((d) => {
      if (window.name === 'lead3-loaded') return;
      window.name = 'lead3-loaded';
      localStorage.clear();
      for (const [k, v] of Object.entries(d.ls)) localStorage.setItem(k, v);
      for (const [k, v] of Object.entries(d.ss)) sessionStorage.setItem(k, v);
    }, dump);
    await page.clock.install({ time: FIXED + 3 * 60_000 });
    await page.clock.resume();
    await page.goto(`${AFTER}/#/done`);
    await page.getByRole('heading', { level: 1, name: /minutes? brewed/ }).waitFor({ timeout: 60_000 });
    await page.waitForTimeout(2500);
    const afterLoad = await storageDump(page);
    r.progressByteIdenticalAfterLoad = afterLoad.ls['kettle:progress'] === dump.ls['kettle:progress'];
    r.lsKeysChanged = Object.keys({ ...afterLoad.ls, ...dump.ls }).filter((k) => afterLoad.ls[k] !== dump.ls[k]);
    r.afterSummary = await summaryFacts(page);
    r.isDebug = await page.evaluate(() => typeof window.__kettle !== 'undefined');
    await page.screenshot({ path: `${OUT}/migration-after-summary-arrival-${cfg.id}.png` });
    await showPill(page, `${OUT}/migration-after-summary-pill-${cfg.id}.png`);
    const afterPill = await storageDump(page);
    r.progressByteIdenticalAfterScroll = afterPill.ls['kettle:progress'] === dump.ls['kettle:progress'];
    r.afterStats = await statsBadges(page, cfg, 'migration-after');
    const end = await storageDump(page);
    const a = JSON.parse(dump.ls['kettle:progress']).state;
    const b = JSON.parse(end.ls['kettle:progress']).state;
    r.endVersion = JSON.parse(end.ls['kettle:progress']).version;
    r.endFieldsEqual = Object.fromEntries(Object.keys(a).map((k) => [k, JSON.stringify(a[k]) === JSON.stringify(b[k])]));
    r.endLastReportTitles = b.lastReport?.badges?.map((x) => x.title) ?? null;
    fs.writeFileSync(`${OUT}/migration-after-end-storage-${cfg.id}.json`, JSON.stringify(end, null, 1));
    await ctx.close();
    log(cfg.id, JSON.stringify({ old: r.beforeSummary.pills, neu: r.afterSummary.pills, same: r.progressByteIdenticalAfterLoad }));
  }
} finally {
  fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
log('done');
