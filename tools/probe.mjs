// Playwright smoke test + screenshot harness.
//   node tools/probe.mjs                       # full sweep
//   node tools/probe.mjs --shot battle         # one scenario
//   node tools/probe.mjs --turns 12 --out tests/shots
//
// Exits non-zero on a console error, page error, or a failed assertion.

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]?.startsWith('--') === false ? arr[i + 1] : true]);
    return acc;
  }, [])
);

const PORT = Number(args.port || 8123);
const OUT = args.out || 'tests/shots';
const TURNS = Number(args.turns || 10);
const BASE = `http://127.0.0.1:${PORT}`;

async function startServer() {
  const p = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('server start timeout')), 8000);
    p.stdout.on('data', (d) => { if (String(d).includes('serving')) { clearTimeout(t); res(); } });
    p.stderr.on('data', (d) => process.stderr.write(d));
  });
  return p;
}

const errors = [];

async function main() {
  await mkdir(OUT, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || undefined,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  const shot = async (name) => {
    await page.screenshot({ path: `${OUT}/${name}.png` });
    console.log(`  📸 ${OUT}/${name}.png`);
  };

  console.log('▶ loading', BASE);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 20000 });
  await page.evaluate(() => window.__ARENA.ready);
  await page.evaluate(() => window.__ARENA.audio.setMuted(true));
  await sleep(900);
  await shot('01-title');

  const bootErr = await page.evaluate(() => window.__ARENA_ERROR || null);
  if (bootErr) errors.push('boot: ' + bootErr);

  // Data integrity from inside the page
  const dataReport = await page.evaluate(() => {
    const A = window.__ARENA;
    const issues = [];
    const moveIds = new Set(A.data.moves.map((m) => m.id));
    for (const f of A.data.fighters) {
      for (const l of f.learnset) if (!moveIds.has(l.move)) issues.push(`${f.id} learns unknown move ${l.move}`);
      if (f.signature && !moveIds.has(f.signature)) issues.push(`${f.id} signature unknown: ${f.signature}`);
      for (const a of f.abilities) if (!A.data.abilities[a]) issues.push(`${f.id} unknown ability ${a}`);
      if (A.sim.makeDefaultMember(f.id, 50).moves.length === 0) issues.push(`${f.id} has no level-50 moves`);
    }
    return { issues, moves: A.data.moves.length, fighters: A.data.fighters.length };
  });
  console.log(`  data: ${dataReport.fighters} fighters, ${dataReport.moves} moves, ${dataReport.issues.length} issues`);
  dataReport.issues.slice(0, 20).forEach((i) => console.log('   ⚠ ' + i));

  // Headless sim sanity: 200 random battles must always terminate
  const simReport = await page.evaluate(() => {
    const A = window.__ARENA;
    const { createBattle, submitChoices, chooseAction, makeDefaultMember, defaultBag, RNG } = A.sim;
    const ids = A.data.fighters.map((f) => f.id);
    let fails = 0, turns = 0, crashes = [];
    for (let n = 0; n < 200; n++) {
      const rng = new RNG(n + 1);
      const team = () => Array.from({ length: 3 }, () => makeDefaultMember(ids[rng.int(ids.length)], 50));
      try {
        const b = createBattle({
          seed: n + 1, arena: 'colosseum',
          sides: [{ name: 'A', team: team(), items: defaultBag() }, { name: 'B', team: team(), items: defaultBag() }]
        });
        let guard = 0;
        while (!b.ended && guard++ < 300) {
          const c = [0, 1].map((s) => (b.request[s] ? chooseAction(b, s, 'ace') : null));
          submitChoices(b, c);
        }
        if (!b.ended) fails++;
        turns += b.turn;
      } catch (e) { crashes.push(String(e.message)); }
    }
    return { fails, avgTurns: turns / 200, crashes: [...new Set(crashes)].slice(0, 5) };
  });
  console.log(`  sim: avg ${simReport.avgTurns.toFixed(1)} turns, ${simReport.fails} non-terminating, ${simReport.crashes.length} crash types`);
  simReport.crashes.forEach((c) => errors.push('sim crash: ' + c));
  if (simReport.fails > 0) errors.push(`${simReport.fails}/200 battles did not terminate`);

  // Screen sweep
  for (const s of ['dex', 'teambuilder', 'single', 'versus', 'options']) {
    await page.evaluate((id) => window.__ARENA.router.go(id), s);
    await sleep(500);
    await shot(`02-${s}`);
  }

  // Live battle
  await page.evaluate(() => window.__ARENA.battle.quick('PROBE-1'));
  await sleep(2200);
  await shot('03-battle-intro');

  let shots = 0;
  for (let t = 0; t < TURNS; t++) {
    const done = await page.evaluate(async () => {
      const A = window.__ARENA;
      const deadline = Date.now() + 45000;
      while (Date.now() < deadline) {
        if (A.router.currentId !== 'battle') return 'ended';
        const w = A.battle.waitingFor();
        if (w === 0) {
          const s = A.battle.screen();
          const side = s.battle.sides[0];
          const mon = side.party[side.activeIndex];
          if (s.forcedSwitch) {
            const i = side.party.findIndex((p, i2) => !p.fainted && i2 !== side.activeIndex);
            A.battle.choose(0, { kind: 'switch', toSlot: i < 0 ? 0 : i });
          } else {
            const c = A.sim.chooseAction(s.battle, 0, 'ace');
            A.battle.choose(0, c);
          }
          return 'moved';
        }
        if (A.textbox?.busy) A.battle.advanceText();
        await new Promise((r) => setTimeout(r, 90));
      }
      return 'timeout';
    });
    if (done === 'timeout') { errors.push(`battle stalled at turn ${t}`); break; }
    if (done === 'ended') break;
    await sleep(1500);
    if (t < 4) { await shot(`04-turn-${t + 1}`); shots++; }
  }
  await sleep(1200);
  await shot('05-battle-late');

  const perf = await page.evaluate(() => ({ fps: window.__ARENA.perf.fps, calls: window.__ARENA.perf.drawCalls, tris: window.__ARENA.perf.tris }));
  console.log(`  perf: ${perf.fps} fps · ${perf.calls} draw calls · ${perf.tris} tris`);

  await page.evaluate(() => window.__ARENA.router.go('title'));
  await sleep(400);
  await shot('06-back-to-title');

  await writeFile(`${OUT}/report.json`, JSON.stringify({ dataReport, simReport, perf, errors }, null, 2));

  await browser.close();
  server.kill();

  if (errors.length) {
    console.log(`\n❌ ${errors.length} problem(s):`);
    [...new Set(errors)].slice(0, 25).forEach((e) => console.log('  - ' + e));
    process.exit(1);
  }
  console.log('\n✅ probe clean');
}

main().catch((e) => { console.error(e); process.exit(1); });
