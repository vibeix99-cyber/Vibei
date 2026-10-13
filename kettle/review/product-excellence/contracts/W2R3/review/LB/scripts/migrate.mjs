// Lane B migration: load a storage dump made on the BASE build into a fresh context on the TRIAL build (no debug, no seed).
//   node migrate.mjs --trial http://127.0.0.1:5485 --w 390 --h 844 --dump <dump.json> --out <dir> --tag 390x844 [--clockPlusMin 40]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { FIXED, sleep, parseArgs, launch, newCtx, preload, dumpStorage, collect, diffDumps, jsonDiff } from './common.mjs';

const a = parseArgs();
const W = +a.w, H = +a.h, base = a.trial, out = a.out, tag = a.tag;
mkdirSync(out, { recursive: true });
const dump0 = JSON.parse(readFileSync(a.dump, 'utf8'));
const facts = { tag, trial: base, dumpFile: a.dump, viewport: { W, H }, clockAt: new Date(FIXED + (+a.clockPlusMin || 40) * 60000).toISOString(), startedAt: new Date().toISOString(), errors: [] };
const b = await launch();
const { ctx, p } = await newCtx(b, W, H, FIXED + (+a.clockPlusMin || 40) * 60000, facts.errors);
try {
  await preload(p, base, dump0);
  facts.preloadCheck = diffDumps(dump0, await dumpStorage(p)); // must be all identical (what we injected)
  await p.goto(`${base}/#/done`, { waitUntil: 'load', timeout: 90_000 });
  await sleep(300); facts.summaryEarly = await collect(p);
  await sleep(6000); facts.summary = await collect(p);
  await p.screenshot({ path: `${out}/migration-${tag}-summary-viewport.png`, animations: 'disabled', timeout: 120_000 }).catch((e) => facts.errors.push('shot ' + e.message.slice(0, 100)));
  const pill = p.locator('[aria-label="Rewards"] li', { hasText: /Badge:/ }).first();
  if (await pill.count()) { await pill.scrollIntoViewIfNeeded().catch(() => {}); await sleep(400); await pill.screenshot({ path: `${out}/migration-${tag}-summary-pill.png`, animations: 'disabled', timeout: 60_000 }).catch(() => {}); }
  const dump1 = await dumpStorage(p);
  writeFileSync(`${out}/dump-trial-afterload-${tag}.json`, JSON.stringify(dump1, null, 1));
  facts.diffAfterSummary = diffDumps(dump0, dump1);
  // Stats > Badges (hash navigation; no debug API on this load)
  await p.evaluate(() => { location.hash = '#/stats'; });
  const btn = p.getByRole('button', { name: /^Warm (Streak|Days), tier/ }).first();
  await btn.waitFor({ state: 'attached', timeout: 30_000 }).catch((e) => facts.errors.push('badge button not found ' + e.message.slice(0, 100)));
  await sleep(1500);
  facts.stats = await collect(p);
  if (await btn.count()) {
    await btn.scrollIntoViewIfNeeded().catch(() => {}); await sleep(500);
    facts.statsButton = { aria: await btn.getAttribute('aria-label'), text: (await btn.innerText()).replace(/\s+/g, ' ') };
    await btn.screenshot({ path: `${out}/migration-${tag}-stats-badge-button.png`, animations: 'disabled', timeout: 60_000 }).catch(() => {});
    await btn.click({ timeout: 20_000 }).catch((e) => facts.errors.push('click ' + e.message.slice(0, 100)));
    await sleep(1200); facts.statsSheet = await collect(p);
    await p.keyboard.press('Escape').catch(() => {}); await sleep(500);
  }
  // Reload the summary a second time (a real "come back to the last report")
  await p.goto(`${base}/#/done`, { waitUntil: 'load', timeout: 90_000 });
  await p.reload({ waitUntil: 'load', timeout: 90_000 });
  await sleep(6000); facts.summaryAfterReload = await collect(p);
  const dump2 = await dumpStorage(p);
  writeFileSync(`${out}/dump-trial-final-${tag}.json`, JSON.stringify(dump2, null, 1));
  facts.diffFinal = diffDumps(dump0, dump2);
  // Structural view of what differs in kettle:progress (if anything)
  const pr0 = dump0.local['kettle:progress'], pr2 = dump2.local['kettle:progress'];
  facts.progressByteIdentical = pr0 === pr2;
  facts.progressLen = { before: pr0?.length, after: pr2?.length };
  if (pr0 && pr2 && pr0 !== pr2) facts.progressJsonDiff = jsonDiff(JSON.parse(pr0), JSON.parse(pr2));
  for (const k of Object.keys(facts.diffFinal.local)) if (facts.diffFinal.local[k] === 'DIFFERS' && k !== 'kettle:progress') facts['jsonDiff_' + k] = jsonDiff(JSON.parse(dump0.local[k]), JSON.parse(dump2.local[k]));
  facts.storedLastReportBadges = pr2 ? JSON.parse(pr2).state?.lastReport?.badges : null;
  facts.storedLastReportBadgesBefore = pr0 ? JSON.parse(pr0).state?.lastReport?.badges : null;
} catch (e) {
  facts.errors.push('FATAL ' + e.message.slice(0, 400));
} finally {
  facts.finishedAt = new Date().toISOString();
  writeFileSync(`${out}/migration-${tag}.json`, JSON.stringify(facts, null, 1));
  await ctx.close().catch(() => {}); await b.close().catch(() => {});
  console.log('migration', tag, 'errors', facts.errors.length, facts.errors.join(' | ').slice(0, 300), 'progressByteIdentical', facts.progressByteIdentical);
}
