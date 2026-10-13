// Lane B extra: the cross-tab path. Tab 1 shows the migrated summary; tab 2 (same origin) writes a NEWER pre-rename document
// (old title "Warm Streak", rev+5, badge tier 2 -> 3 so adoption is observable). Does tab 1 show "Warm Days III"?
import { readFileSync, writeFileSync } from 'node:fs';
import { FIXED, sleep, parseArgs, launch, newCtx, preload, dumpStorage, collect } from './common.mjs';
const a = parseArgs();
const dump0 = JSON.parse(readFileSync(a.dump, 'utf8'));
const facts = { trial: a.trial, startedAt: new Date().toISOString(), errors: [] };
const b = await launch();
const { ctx, p } = await newCtx(b, 390, 844, FIXED + 40 * 60000, facts.errors);
try {
  await preload(p, a.trial, dump0);
  await p.goto(`${a.trial}/#/done`, { waitUntil: 'load', timeout: 90_000 });
  await sleep(6000);
  const pillOf = (s) => s.leafText.filter((l) => l.text.startsWith('Badge:')).map((l) => l.text);
  facts.tab1Before = pillOf(await collect(p));
  const doc = JSON.parse(dump0.local['kettle:progress']);
  facts.revBefore = doc.state.rev;
  doc.state.rev += 5;
  const lb = doc.state.lastReport.badges.find((x) => x.id === 'warm-streak');
  lb.tier = 3; // title stays "Warm Streak" (the pre-rename string)
  facts.written = { rev: doc.state.rev, lastReportBadges: doc.state.lastReport.badges };
  const p2 = await ctx.newPage();
  await p2.goto(`${a.trial}/__lb_blank`, { waitUntil: 'load' });
  await p2.evaluate((v) => localStorage.setItem('kettle:progress', v), JSON.stringify(doc));
  await p2.close();
  await sleep(3000);
  const s = await collect(p);
  facts.tab1After = pillOf(s);
  facts.tab1AfterAria = s.ariaLabels.map((x) => x.aria).filter((t) => /^Warm (Days|Streak)/.test(t));
  facts.tab1AfterLive = s.live.map((l) => l.text);
  const d = await dumpStorage(p);
  facts.storedTitleAfter = JSON.parse(d.local['kettle:progress']).state.lastReport.badges.map((x) => ({ id: x.id, tier: x.tier, title: x.title }));
  facts.storedRevAfter = JSON.parse(d.local['kettle:progress']).state.rev;
} catch (e) { facts.errors.push('FATAL ' + e.message.slice(0, 300)); }
facts.finishedAt = new Date().toISOString();
writeFileSync(`${a.out}/crosstab-trial-390x844.json`, JSON.stringify(facts, null, 1));
await ctx.close(); await b.close();
console.log('crosstab', JSON.stringify({ before: facts.tab1Before, after: facts.tab1After, errors: facts.errors }));
