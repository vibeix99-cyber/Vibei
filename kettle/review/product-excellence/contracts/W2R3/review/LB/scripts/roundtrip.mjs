// Lane B export -> import round trip. A: load the pre-rename dump on EXPORTER, Settings > Export a backup.
// B: a fresh context on IMPORTER (settings only, no progress), Settings > Import a backup > Restore, then export again.
//   node roundtrip.mjs --exporter http://127.0.0.1:5485 --importer http://127.0.0.1:5485 --w 390 --h 844 --dump <dump.json> --out <dir> --tag trial-trial-390x844
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { FIXED, sleep, parseArgs, launch, newCtx, preload, dumpStorage, collect, jsonDiff } from './common.mjs';

const a = parseArgs();
const W = +a.w, H = +a.h, out = a.out, tag = a.tag;
mkdirSync(out, { recursive: true });
const dump0 = JSON.parse(readFileSync(a.dump, 'utf8'));
const at = FIXED + 40 * 60000;
const facts = { tag, exporter: a.exporter, importer: a.importer, viewport: { W, H }, startedAt: new Date().toISOString(), errors: [] };
const b = await launch();

async function exportBackup(p, base, file) {
  await p.goto(`${base}/#/settings`, { waitUntil: 'load', timeout: 90_000 });
  const row = p.getByRole('button', { name: /^Export a backup/ }).first();
  await row.waitFor({ state: 'attached', timeout: 30_000 });
  await row.scrollIntoViewIfNeeded().catch(() => {});
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30_000 }), row.click({ timeout: 20_000 })]);
  await dl.saveAs(file);
  return { suggested: dl.suggestedFilename(), json: JSON.parse(readFileSync(file, 'utf8')) };
}

try {
  // ---- A: export
  {
    const { ctx, p } = await newCtx(b, W, H, at, facts.errors);
    await preload(p, a.exporter, dump0);
    const f1 = `${out}/backup-${tag}-1-exported.json`;
    const ex = await exportBackup(p, a.exporter, f1);
    facts.export1 = { file: f1, suggested: ex.suggested, keys: Object.keys(ex.json), schema: ex.json.schema, progressKeys: Object.keys(ex.json.progress), lastReport: ex.json.progress.lastReport, badges: ex.json.progress.badges, hasTitleStringInFile: /Warm (Streak|Days)/.test(JSON.stringify(ex.json)) };
    const st = JSON.parse(dump0.local['kettle:progress']).state;
    facts.export1_vs_storedState = { badgesEqual: JSON.stringify(ex.json.progress.badges) === JSON.stringify(st.badges), diffs: ['sessions', 'ledger', 'leaves', 'cozies', 'dayGoals', 'quests', 'badges', 'tombstones'].filter((k) => JSON.stringify(ex.json.progress[k]) !== JSON.stringify(st[k])) };
    await ctx.close();
  }
  // ---- B: import into a fresh profile, then export again
  {
    const { ctx, p } = await newCtx(b, W, H, at, facts.errors);
    const settingsOnly = { local: { 'kettle:settings': dump0.local['kettle:settings'] }, session: {} };
    await preload(p, a.importer, settingsOnly);
    await p.goto(`${a.importer}/#/settings`, { waitUntil: 'load', timeout: 90_000 });
    const row = p.getByRole('button', { name: /^Import a backup/ }).first();
    await row.waitFor({ state: 'attached', timeout: 30_000 });
    await p.locator('input[type=file]').setInputFiles(facts.export1.file);
    const sheet = p.getByRole('dialog').first();
    await sheet.waitFor({ state: 'visible', timeout: 20_000 });
    facts.importSheet = (await sheet.innerText()).replace(/\s+/g, ' ').slice(0, 400);
    await sheet.getByRole('button', { name: /^(Restore|Add|Replace)$/ }).click({ timeout: 20_000 });
    await sleep(2500);
    const dumpB = await dumpStorage(p);
    writeFileSync(`${out}/dump-${tag}-after-import.json`, JSON.stringify(dumpB, null, 1));
    const stB = JSON.parse(dumpB.local['kettle:progress']).state;
    const ex1 = JSON.parse(readFileSync(facts.export1.file, 'utf8')).progress;
    facts.afterImport = { badges: stB.badges, badgesEqualExported: JSON.stringify(stB.badges) === JSON.stringify(ex1.badges), diffsVsExported: ['sessions', 'ledger', 'leaves', 'cozies', 'dayGoals', 'quests', 'badges', 'tombstones'].filter((k) => JSON.stringify(stB[k]) !== JSON.stringify(ex1[k])), lastReport: stB.lastReport, hasTitleStringInStorage: /Warm (Streak|Days)/.exec(dumpB.local['kettle:progress'])?.[0] ?? null };
    // Stats > Badges after the import
    await p.evaluate(() => { location.hash = '#/stats'; });
    const btn = p.getByRole('button', { name: /^Warm (Streak|Days), tier/ }).first();
    await btn.waitFor({ state: 'attached', timeout: 30_000 }).catch((e) => facts.errors.push('btn ' + e.message.slice(0, 100)));
    await sleep(1200);
    facts.statsAfterImport = { aria: await btn.getAttribute('aria-label').catch(() => null), text: await btn.innerText().then((t) => t.replace(/\s+/g, ' ')).catch(() => null) };
    const f2 = `${out}/backup-${tag}-2-reexported.json`;
    const ex2 = await exportBackup(p, a.importer, f2);
    const e1 = JSON.parse(readFileSync(facts.export1.file, 'utf8')), e2 = ex2.json;
    delete e1.exportedAt; delete e2.exportedAt;
    facts.export2 = { file: f2, badges: e2.progress.badges, badgesEqualExport1: JSON.stringify(e2.progress.badges) === JSON.stringify(e1.progress.badges), wholeFileDiffVsExport1: jsonDiff(e1, e2) };
    await ctx.close();
  }
} catch (e) {
  facts.errors.push('FATAL ' + e.message.slice(0, 400));
} finally {
  facts.finishedAt = new Date().toISOString();
  writeFileSync(`${out}/roundtrip-${tag}.json`, JSON.stringify(facts, null, 1));
  await b.close().catch(() => {});
  console.log('roundtrip', tag, 'errors', facts.errors.length, facts.errors.join(' | ').slice(0, 300));
}
