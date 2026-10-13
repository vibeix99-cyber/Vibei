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
    const dump = JSON.parse(fs.readFileSync(`${OUT}/pre-rename-storage-${cfg.id}.json`, 'utf8'));
    const ctxOpts = { viewport: { width: cfg.w, height: cfg.h }, deviceScaleFactor: cfg.dpr, colorScheme: cfg.theme };
    for (const [tag, origin] of [['reload-before', BEFORE], ['reload-after', AFTER]]) {
      const r = (results[`${cfg.id} ${tag}`] = {});
      const ctx = await browser.newContext(ctxOpts);
      const page = await ctx.newPage();
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
      await page.goto(`${origin}/#/done`);
      await page.getByRole('heading', { level: 1, name: /minutes? brewed/ }).waitFor({ timeout: 60_000 });
      await page.waitForTimeout(3000);
      const afterLoad = await storageDump(page);
      r.progressByteIdenticalAfterLoad = afterLoad.ls['kettle:progress'] === dump.ls['kettle:progress'];
      r.summary = await summaryFacts(page);
      await page.screenshot({ path: `${OUT}/${tag}-summary-arrival-${cfg.id}.png` });
      await showPill(page, `${OUT}/${tag}-summary-pill-${cfg.id}.png`);
      r.stats = await statsBadges(page, cfg, tag);
      const end = await storageDump(page);
      r.progressByteIdenticalAtEnd = end.ls['kettle:progress'] === dump.ls['kettle:progress'];
      await ctx.close();
      log(cfg.id, tag, JSON.stringify(r.summary.pills), r.progressByteIdenticalAfterLoad, r.progressByteIdenticalAtEnd);
    }
  }
} finally {
  fs.writeFileSync(`${OUT}/results-reload.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
log('done');
