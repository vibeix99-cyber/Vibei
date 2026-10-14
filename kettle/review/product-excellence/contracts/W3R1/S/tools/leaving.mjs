// Maker S (W3R1): control for integrity.spec.ts:768. Right after __kettle.navigate('/settings') from Today, is the
// screen being left still in the page, and what does a whole-page read of the profile pills return then, vs the
// Profile card's own read once the route has settled? (veteran, real Today with its animated counters.)
//   node leaving.mjs --base http://127.0.0.1:5478 --out <file.json>
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const b = await chromium.launch();
const runs = [];
for (let i = 0; i < 5; i++) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage();
  await p.goto(`${args.base}/?debug&seed=veteran#/`);
  await p.waitForFunction(() => !!window.__kettle?.timerInfo);
  await p.waitForTimeout(i * 150); // vary where Today's counters are when we leave
  const r = await p.evaluate(async () => {
    const re = ['Level \\d+', '[\\d,]+ leaves(?! to level)', '\\d+ days? warm'];
    const pills = (text) => re.map((x) => text.match(new RegExp(x))?.[0] ?? null);
    window.__kettle.navigate('/settings');
    const samples = [];
    for (let f = 0; f < 30; f++) {
      await new Promise((res) => requestAnimationFrame(res));
      const leaving = document.querySelectorAll('[data-route-leaving]').length;
      const h1 = [...document.querySelectorAll('h1')].map((h) => h.textContent);
      const card = document.querySelector('main section[aria-label="Profile"]');
      samples.push({ frame: f, leaving, settingsH1: h1.includes('Settings'), wholePage: pills(document.body.innerText), card: card ? pills(card.innerText) : null });
      if (!leaving && f > 3) break;
    }
    return { stored: window.__kettle.progress.getState().leaves, samples };
  });
  runs.push(r);
  await ctx.close();
}
writeFileSync(args.out, JSON.stringify(runs, null, 1));
const firstH1 = runs.map((r) => r.samples.find((s) => s.settingsH1));
console.log(JSON.stringify(firstH1.map((s, i) => ({ stored: runs[i].stored, ...s }))));
await b.close();
