// Lead checker W2R3 / B: does a summary badge pill leave its tier numeral alone on the last line? Measured on the
// BEFORE build (:5480) by rewriting the one pill's text to every catalogue name × tier (the pill code is the same on
// both builds; only the name changed). Uses the pre-rename profile reloaded at #/done.
import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = '/home/user/wt/w4-base/kettle/.tmp/LEAD3/b';
const dump = JSON.parse(fs.readFileSync(`${OUT}/pre-rename-storage-390x844-light.json`, 'utf8'));
const TITLES = ['First Brew', 'Warm Streak', 'Warm Days', 'Leaf Collector', 'Deep Steep', 'Morning Dew', 'Moonlit Sipper', 'Marathon', 'Tea Time', 'Goal Getter', 'Intentional', 'Weekend Warmth', 'Nook Builder'];
const CFGS = [
  { w: 375, h: 667, dpr: 2, text: 100 }, { w: 375, h: 667, dpr: 2, text: 200 },
  { w: 390, h: 844, dpr: 2, text: 100 }, { w: 390, h: 844, dpr: 2, text: 200 },
  { w: 320, h: 640, dpr: 2, text: 100 }, { w: 320, h: 640, dpr: 2, text: 200 },
  { w: 1440, h: 900, dpr: 1, text: 100 }, { w: 1440, h: 900, dpr: 1, text: 200 },
];
const out = [];
const browser = await chromium.launch();
try {
  for (const cfg of CFGS) {
    const ctx = await browser.newContext({ viewport: { width: cfg.w, height: cfg.h }, deviceScaleFactor: cfg.dpr });
    const page = await ctx.newPage();
    await page.addInitScript((p) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${p}%!important}`; document.head.appendChild(s); }), cfg.text);
    await page.addInitScript((d) => {
      if (window.name === 'lead3') return;
      window.name = 'lead3';
      localStorage.clear();
      for (const [k, v] of Object.entries(d.ls)) localStorage.setItem(k, v);
      for (const [k, v] of Object.entries(d.ss)) sessionStorage.setItem(k, v);
    }, dump);
    await page.clock.install({ time: Date.parse('2026-10-11T07:43:00Z') });
    await page.clock.resume();
    await page.goto('http://127.0.0.1:5480/#/done');
    await page.getByRole('heading', { level: 1, name: /minutes? brewed/ }).waitFor({ timeout: 60_000 });
    await page.waitForTimeout(2500);
    const res = await page.evaluate((TITLES) => {
      const span = [...document.querySelectorAll('span')].find((e) => /^Badge: Warm Streak II$/.test(e.textContent.trim()));
      const lines = () => {
        const r = document.createRange();
        r.selectNodeContents(span);
        // words → their line (by top)
        const t = span.firstChild;
        const words = [];
        const re = /\S+/g;
        let m;
        while ((m = re.exec(t.textContent))) {
          const rr = document.createRange();
          rr.setStart(t, m.index);
          rr.setEnd(t, m.index + m[0].length);
          words.push({ w: m[0], top: Math.round(rr.getBoundingClientRect().top) });
        }
        const byLine = [];
        for (const x of words) {
          const L = byLine.find((l) => Math.abs(l.top - x.top) < 4);
          if (L) L.words.push(x.w);
          else byLine.push({ top: x.top, words: [x.w] });
        }
        return byLine.map((l) => l.words.join(' '));
      };
      const rows = [];
      for (const title of TITLES)
        for (const tier of ['', ' II', ' III', ' IV', ' V']) {
          span.firstChild.textContent = `Badge: ${title}${tier}`;
          const L = lines();
          rows.push({ text: span.firstChild.textContent, lines: L, orphan: L.length > 1 && /^(I|II|III|IV|V)$/.test(L.at(-1)) });
        }
      span.firstChild.textContent = 'Badge: Warm Streak II';
      return rows;
    }, TITLES);
    out.push({ cfg, res });
    const orphans = res.filter((r) => r.orphan).map((r) => r.text);
    console.log(`${cfg.w}x${cfg.h} @${cfg.text}%:`, orphans.length ? orphans.join(' | ') : 'none');
    await ctx.close();
  }
} finally {
  fs.writeFileSync(`${OUT}/orphan-numerals.json`, JSON.stringify(out, null, 1));
  await browser.close();
}
