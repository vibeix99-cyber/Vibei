// `npm run check` — the fast gate. Everything here is node-only and finishes in
// under a minute; the browser-driven gates are listed at the end rather than
// run, because they take tens of minutes under software rendering.
//
// This file did not exist. package.json has pointed `npm run check` at it since
// the project started, so the one command a newcomer would reach for first
// failed with MODULE_NOT_FOUND.

import { readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const results = [];
const run = (label, fn) => {
  try { const r = fn(); results.push([r.ok, label, r.detail]); }
  catch (e) { results.push([false, label, e.message.split('\n')[0]]); }
};

/* 1. every JS file parses */
const walk = (d, out = []) => {
  for (const e of readdirSync(d)) {
    if (e === 'node_modules' || e === '.git' || e === 'vendor') continue;
    const p = `${d}/${e}`;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(mjs|js)$/.test(p)) out.push(p);
  }
  return out;
};
run('syntax', () => {
  const files = walk('src').concat(walk('tools'), walk('tests'));
  const badFiles = files.filter((f) => spawnSync(process.execPath, ['--check', f]).status !== 0);
  return { ok: !badFiles.length, detail: `${files.length} files${badFiles.length ? ' — ' + badFiles.join(', ') : ''}` };
});

/* 2. every DOM-free module resolves its imports */
const mods = walk('src').filter((p) => /^src\/(core|data|meta|net)\//.test(p));
const failed = [];
for (const m of mods) {
  try { await import(`../${m}`); } catch (e) { failed.push(`${m}: ${e.message.split('\n')[0]}`); }
}
results.push([!failed.length, 'imports', `${mods.length} DOM-free modules${failed.length ? ' — ' + failed[0] : ''}`]);

/* 3. the engine still produces the same battle from the same seed */
run('determinism', () => {
  const r = spawnSync(process.execPath, ['tools/determinism.mjs'], { encoding: 'utf8' });
  return { ok: r.status === 0, detail: (r.stdout || '').trim().split('\n').pop() };
});

/* 4. engine and item hook lists agree */
run('hooks', () => {
  const r = spawnSync(process.execPath, ['tools/hookaudit.mjs'], { encoding: 'utf8' });
  return { ok: r.status === 0, detail: (r.stdout || '').trim().split('\n').pop() };
});

console.log('\n════ CHECK ════\n');
for (const [ok, label, detail] of results) console.log(`  ${ok ? '✅' : '✗'} ${label.padEnd(13)} ${detail || ''}`);
const bad = results.filter((r) => !r[0]).length;
console.log(`\n  Browser gates are not run here (minutes each under software rendering):`);
console.log(`     node tools/probe.mjs        boot → battle → title, console clean`);
console.log(`     node tools/pace.mjs         hits-to-KO band and the bulk spread`);
console.log(`     node tools/audiocheck.mjs   mix balance, ducking, no clipping`);
console.log(`     node tools/metacheck.mjs    builder, modes, save, link lobby`);
console.log(`     node tools/scenecheck.mjs   lights, camera, models, HUD, first boot`);
console.log(bad ? `\n❌ ${bad} failing\n` : `\n✅ all clear\n`);
process.exit(bad ? 1 : 0);
