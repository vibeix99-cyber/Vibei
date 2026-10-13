// Lead checker W2R3 / B: on the AFTER build (:5485, no debug) with the pre-rename profile, walk every main screen
// (real clicks) and look for the old badge name in visible text, aria-label, title and live regions.
import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = '/home/user/wt/w4-base/kettle/.tmp/LEAD3/b';
const dump = JSON.parse(fs.readFileSync(`${OUT}/pre-rename-storage-390x844-light.json`, 'utf8'));
const res = {};
const browser = await chromium.launch();
try {
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w > 1000 ? 1 : 2 });
    const page = await ctx.newPage();
    await page.addInitScript((d) => {
      if (window.name === 'lead3') return;
      window.name = 'lead3';
      localStorage.clear();
      for (const [k, v] of Object.entries(d.ls)) localStorage.setItem(k, v);
    }, dump);
    await page.clock.install({ time: Date.parse('2026-10-11T07:45:00Z') });
    await page.clock.resume();
    await page.goto('http://127.0.0.1:5485/#/');
    await page.waitForTimeout(4000);
    const scan = async (where) => {
      const r = await page.evaluate(() => {
        const bag = [document.body.innerText];
        for (const e of document.querySelectorAll('[aria-label],[title],[aria-description]')) bag.push(e.getAttribute('aria-label') || '', e.getAttribute('title') || '', e.getAttribute('aria-description') || '');
        for (const e of document.querySelectorAll('svg title, .sr-only, [aria-live]')) bag.push(e.textContent || '');
        const all = bag.join(' \n ');
        return { old: (all.match(/Warm Streak/g) || []).length, neu: (all.match(/Warm Days/g) || []).length };
      });
      res[`${w}x${h} ${where}`] = r;
      console.log(`${w}x${h} ${where}`, JSON.stringify(r));
    };
    await scan('today');
    for (const name of ['Stats', 'Nook', 'Settings']) {
      const nav = page.getByRole('link', { name: new RegExp(`^${name}$`, 'i') }).or(page.getByRole('button', { name: new RegExp(`^${name}$`, 'i') }));
      await nav.first().click();
      await page.waitForTimeout(1800);
      if (name === 'Stats') {
        const more = page.getByRole('button', { name: /Show \d+ more badges/ });
        if (await more.count()) { await more.first().scrollIntoViewIfNeeded(); await more.first().click(); await page.waitForTimeout(800); }
      }
      await scan(name.toLowerCase());
    }
    await ctx.close();
  }
} finally {
  fs.writeFileSync(`${OUT}/sweep.json`, JSON.stringify(res, null, 1));
  await browser.close();
}
