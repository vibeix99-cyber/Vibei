// Lane B: the dev "kit" route (#/kit) art gallery lists every badge by catalogue title; record the warm-streak entries on base and trial.
import { writeFileSync } from 'node:fs';
import { FIXED, sleep, parseArgs, launch, newCtx } from './common.mjs';
const a = parseArgs();
const facts = { startedAt: new Date().toISOString(), errors: [], runs: {} };
const b = await launch();
for (const [label, base] of [['base', 'http://127.0.0.1:5480'], ['trial', 'http://127.0.0.1:5485']]) {
  const { ctx, p } = await newCtx(b, 1440, 900, FIXED, facts.errors);
  try {
    await p.goto(`${base}/?debug&seed=celebrate&theme=light#/kit`, { waitUntil: 'load', timeout: 90_000 });
    await sleep(6000);
    facts.runs[label] = await p.evaluate(() => {
      const norm = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
      const re = /warm\s*(streak|days)/i;
      return {
        hash: location.hash,
        leaf: [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && re.test(e.textContent ?? '')).map((e) => ({ tag: e.tagName.toLowerCase(), text: norm(e.textContent) })),
        svgTitles: [...document.querySelectorAll('svg title')].map((t) => norm(t.textContent)).filter((t) => re.test(t)),
        ariaLabels: [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((t) => re.test(t)),
        svgCount: document.querySelectorAll('svg').length,
      };
    });
  } catch (e) { facts.errors.push(label + ' ' + e.message.slice(0, 200)); }
  await ctx.close();
}
facts.finishedAt = new Date().toISOString();
writeFileSync(`${a.out}/kit-gallery.json`, JSON.stringify(facts, null, 1));
await b.close();
console.log('kit errors', facts.errors.length, JSON.stringify(facts.runs).slice(0, 600));
