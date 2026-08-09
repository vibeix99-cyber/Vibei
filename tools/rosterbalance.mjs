// Per-fighter win rate across randomised AI-vs-AI battles + data sanity.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const PORT = Number(process.argv[2] || 8402);
const p = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore','pipe','pipe'] });
await new Promise(r => p.stdout.on('data', d => String(d).includes('serving') && r()));
const b = await chromium.launch({ args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const pg = await b.newPage();
await pg.goto(`http://127.0.0.1:${PORT}`, { waitUntil:'networkidle' });
await pg.waitForFunction(() => window.__ARENA?.version);

const out = await pg.evaluate(() => {
  const A = window.__ARENA;
  const { createBattle, submitChoices, chooseAction, makeDefaultMember, defaultBag, RNG } = A.sim;
  const F = A.data.fighters;
  const ids = F.map(f => f.id);
  const byId = Object.fromEntries(F.map(f => [f.id, f]));

  const issues = [];
  for (const f of F) {
    if (f.awaken && !byId[f.awaken.into]) issues.push(`${f.id} awakens into missing ${f.awaken.into}`);
    const dm = A.sim.makeDefaultMember(f.id, 50).moves;
    if (dm.length < 3) issues.push(`${f.id} level-50 set has only ${dm.length} moves`);
    const cats = dm.map(id => A.data.moves.find(m => m.id === id)?.category);
    if (cats.length && cats.every(c => c === 'status')) issues.push(`${f.id} level-50 set is all status`);
  }

  const wins = {}, games = {};
  ids.forEach(i => { wins[i] = 0; games[i] = 0; });
  const rng = new RNG(20260809);
  const N = 1400;
  for (let n = 0; n < N; n++) {
    const pick = () => ids[rng.int(ids.length)];
    const t0 = [pick(), pick(), pick()], t1 = [pick(), pick(), pick()];
    const mk = t => t.map(id => makeDefaultMember(id, 50));
    try {
      const bt = createBattle({ seed: n + 7, arena: 'colosseum',
        sides: [{ name:'A', team: mk(t0), items: defaultBag() }, { name:'B', team: mk(t1), items: defaultBag() }] });
      let g = 0;
      while (!bt.ended && g++ < 400) submitChoices(bt, [0,1].map(s => bt.request[s] ? chooseAction(bt, s, 'ace') : null));
      t0.forEach(id => games[id]++); t1.forEach(id => games[id]++);
      if (bt.winner === 0) t0.forEach(id => wins[id]++);
      else if (bt.winner === 1) t1.forEach(id => wins[id]++);
    } catch (e) { issues.push('crash: ' + e.message); }
  }
  const rates = ids.map(id => ({ id, tier: byId[id].tier, bst: Object.values(byId[id].base).reduce((a,c)=>a+c,0),
    g: games[id], wr: games[id] ? wins[id] / games[id] : 0 })).sort((a,b) => b.wr - a.wr);
  return { issues: [...new Set(issues)], rates, N };
});

console.log(`\n${out.N} battles · ${out.rates.length} fighters`);
if (out.issues.length) { console.log('\nISSUES:'); out.issues.forEach(i => console.log('  ⚠ ' + i)); }
else console.log('no data issues');
console.log('\nid                 tier  bst   n    win%');
for (const r of out.rates) console.log(`${r.id.padEnd(18)} ${r.tier}    ${String(r.bst).padStart(3)}  ${String(r.g).padStart(3)}  ${(r.wr*100).toFixed(1)}`);
const w = out.rates.map(r => r.wr);
console.log(`\nspread: ${(Math.min(...w)*100).toFixed(1)}% – ${(Math.max(...w)*100).toFixed(1)}%`);
await b.close(); p.kill();
