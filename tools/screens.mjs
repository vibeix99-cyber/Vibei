// Screen walker: every screen, every meaningful state, at two viewports.
//
//   node tools/serve.mjs 8503 &
//   node tools/screens.mjs --port 8503 --out tests/shots/wiring
//
// It also runs the persistence checks that cannot be done by looking at a
// picture: write state → reload → assert it survived, then corrupt
// localStorage and assert the game still boots.
//
// Exits non-zero if any page error, console error or assertion failed.

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

const PORT = Number(args.port || 8503);
const OUT = args.out || 'tests/shots/wiring';
const ONLY = args.only ? String(args.only) : null;
const BASE = `http://127.0.0.1:${PORT}`;
const VIEWPORTS = [
  { tag: 'wide', width: 1440, height: 900 },
  { tag: 'phone', width: 390, height: 844 }
];

const problems = [];
const notes = [];

async function startServer() {
  const p = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('server start timeout')), 8000);
    p.stdout.on('data', (d) => { if (String(d).includes('serving')) { clearTimeout(t); res(); } });
    p.stderr.on('data', (d) => process.stderr.write(d));
  });
  return p;
}

/**
 * Each scene: a fixture to seed, a screen to open, and optional in-page setup.
 * `setup` runs inside the browser after the screen mounts.
 */
const SCENES = [
  { id: '01-title-firstrun', fixture: 'empty', screen: 'title' },
  { id: '02-title-veteran', fixture: 'progress', screen: 'title' },
  { id: '03-mode', fixture: 'progress', screen: 'mode' },
  { id: '04-mode-locked', fixture: 'empty', screen: 'mode' },

  { id: '10-builder-empty', fixture: 'empty', screen: 'teambuilder' },
  { id: '11-builder-full', fixture: 'team', screen: 'teambuilder' },
  {
    id: '12-builder-editor', fixture: 'team', screen: 'teambuilder',
    setup: () => { const s = window.__ARENA.router.current; s.selectMember(0); s.setPane('edit'); }
  },
  {
    id: '13-builder-analysis', fixture: 'team', screen: 'teambuilder',
    setup: () => { window.__ARENA.router.current.setPane('anl'); }
  },
  {
    id: '14-builder-roster', fixture: 'team', screen: 'teambuilder',
    setup: () => {
      const s = window.__ARENA.router.current;
      s.setPane('roster');
      s.filters.q = 'flame';
      s.drawRoster();
    }
  },
  {
    id: '15-builder-share', fixture: 'team', screen: 'teambuilder',
    setup: () => { window.__ARENA.router.current.shareModal(); }
  },
  {
    id: '16-builder-imported', fixture: 'empty', screen: 'teambuilder',
    setup: () => {
      const A = window.__ARENA;
      const team = [
        A.sim.makeDefaultMember('mihawk', 50),
        A.sim.makeDefaultMember('law', 50),
        A.sim.makeDefaultMember('enel', 50)
      ];
      const code = A.meta.link.encodeTeam(team, 'Traded Crew');
      const res = A.router.current.importCode(code);
      return { res, codeLength: code.length };
    }
  },
  {
    id: '17-builder-badcode', fixture: 'empty', screen: 'teambuilder',
    setup: () => window.__ARENA.router.current.importCode('GLA-TEAM:not-a-real-code')
  },

  { id: '20-dex', fixture: 'progress', screen: 'dex' },
  { id: '21-single', fixture: 'progress', screen: 'single' },
  { id: '22-versus', fixture: 'progress', screen: 'versus' },
  { id: '23-options', fixture: 'progress', screen: 'options' },
  { id: '24-options-nostorage', fixture: 'progress', screen: 'options', blockStorage: true },

  { id: '30-tournament-pick', fixture: 'progress', screen: 'tournament' },
  { id: '31-tournament-run', fixture: 'tournament', screen: 'tournament' },
  { id: '32-tournament-won', fixture: 'tournamentWon', screen: 'tournament' },
  { id: '33-gauntlet-intro', fixture: 'progress', screen: 'gauntlet' },
  { id: '34-gauntlet-run', fixture: 'gauntlet', screen: 'gauntlet' },
  { id: '35-daily', fixture: 'progress', screen: 'daily' },

  { id: '40-link-menu', fixture: 'team', screen: 'link' },
  { id: '41-link-host', fixture: 'team', screen: 'link', setup: () => window.__ARENA.router.current.startHost(), wait: 4200 },
  { id: '42-link-join', fixture: 'team', screen: 'link', setup: () => window.__ARENA.router.current.startJoin() },
  {
    id: '43-link-badcode', fixture: 'team', screen: 'link',
    setup: async () => {
      const s = window.__ARENA.router.current;
      s.startJoin();
      await new Promise((r) => setTimeout(r, 60));
      const ta = document.querySelector('.lk-code.paste');
      ta.value = 'GLA-HOST:definitely-not-an-sdp';
      [...document.querySelectorAll('.lk-row .btn')].find((b) => b.textContent.includes('Read the code'))?.click();
    },
    wait: 1200
  },

  { id: '50-tutorial-intro', fixture: 'empty', screen: 'tutorial' },
  { id: '51-tutorial-battle', fixture: 'empty', screen: 'tutorial', setup: () => window.__ARENA.router.current.begin(), wait: 3400 },

  { id: '60-corrupt-save', fixture: 'corrupt', screen: 'title', reloadFirst: true }
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || undefined,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
  });

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const t = m.text();
      if (/WebGL|GroupMarker|SwiftShader/i.test(t)) return;
      problems.push(`[${vp.tag}] console: ${t}`);
    });
    page.on('pageerror', (e) => problems.push(`[${vp.tag}] pageerror: ${e.message}`));

    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
    await page.evaluate(() => window.__ARENA.ready);
    await page.evaluate(() => window.__ARENA.audio.setMuted(true));

    for (const scene of SCENES) {
      if (ONLY && !scene.id.includes(ONLY)) continue;
      try {
        await runScene(page, scene, vp);
      } catch (e) {
        problems.push(`[${vp.tag}] scene ${scene.id}: ${e.message}`);
      }
    }

    if (vp.tag === 'wide') await persistenceChecks(page);
    await page.close();
  }

  await browser.close();
  server.kill();

  await writeFile(`${OUT}/report.json`, JSON.stringify({ notes, problems }, null, 2));
  console.log('\n— notes —');
  notes.forEach((n) => console.log('  ' + n));
  if (problems.length) {
    console.log(`\n❌ ${problems.length} problem(s):`);
    [...new Set(problems)].slice(0, 40).forEach((p) => console.log('  - ' + p));
    process.exit(1);
  }
  console.log('\n✅ screen walk clean');
}

async function runScene(page, scene, vp) {
  await page.evaluate(() => {
    window.__ARENA.router.go('title');
    try { localStorage.removeItem('gla.save.corrupt'); } catch { /* blocked */ }
  });
  const fx = await page.evaluate((n) => window.__ARENA.debug.fixture(n), scene.fixture);
  if (!fx.ok) throw new Error(`fixture ${scene.fixture}: ${fx.error}`);

  if (scene.reloadFirst) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
    await page.evaluate(() => window.__ARENA.ready);
    await page.evaluate(() => window.__ARENA.audio.setMuted(true));
  }
  if (scene.blockStorage) {
    await page.evaluate(() => {
      // Simulate private browsing: every write throws from here on.
      const proto = Object.getPrototypeOf(localStorage);
      if (!proto.__blocked) {
        proto.__blocked = true;
        proto.setItem = () => { throw new DOMException('QuotaExceededError'); };
      }
      window.__ARENA.meta.save.__corruptForTest('{}');
      window.__ARENA.meta.save.load(true);
    });
  }

  await page.evaluate((id) => window.__ARENA.router.go(id), scene.screen);
  await sleep(scene.screen === 'dex' ? 900 : 550);
  if (scene.setup) {
    const r = await page.evaluate(scene.setup);
    if (r && r.res && r.res.ok === false) notes.push(`${scene.id}: import rejected — ${r.res.error}`);
    else if (r && r.codeLength) notes.push(`${scene.id}: team code is ${r.codeLength} characters`);
  }
  await sleep(scene.wait || 500);

  const path = `${OUT}/${vp.tag}-${scene.id}.png`;
  await page.screenshot({ path });
  console.log(`  📸 ${path}`);

  if (scene.blockStorage) {
    await page.evaluate(() => location.reload());
    await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
    await page.evaluate(() => window.__ARENA.ready);
    await page.evaluate(() => window.__ARENA.audio.setMuted(true));
  }
}

/* ------------------------------------------------------------------ */
/* persistence, for real                                               */
/* ------------------------------------------------------------------ */

async function persistenceChecks(page) {
  const assert = (ok, msg) => { if (ok) notes.push('✓ ' + msg); else problems.push('assertion: ' + msg); };

  // 1. A team survives a reload.
  await page.evaluate(() => {
    window.__ARENA.debug.fixture('empty');
    window.__ARENA.router.go('teambuilder');
    const s = window.__ARENA.router.current;
    s.addFighter('luffy');
    s.addFighter('zoro');
    s.team.name = 'Persistence Crew';
    s.member().evs.spe = 252;
    s.member().nature = 'jolly';
    s.persist(true);
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
  await page.evaluate(() => window.__ARENA.ready);
  const after = await page.evaluate(() => {
    const t = window.__ARENA.meta.progression.activeTeam();
    return { name: t?.name, n: t?.members?.length, spe: t?.members?.[1]?.evs?.spe, nature: t?.members?.[1]?.nature };
  });
  assert(after.name === 'Persistence Crew', `team name survived a reload (${after.name})`);
  assert(after.n === 2, `both fighters survived (${after.n})`);
  assert(after.spe === 252, `EV spread survived (${after.spe} Spe)`);
  assert(after.nature === 'jolly', `nature survived (${after.nature})`);

  // 2. A half-finished run survives a reload.
  await page.evaluate(() => window.__ARENA.debug.fixture('tournament'));
  const before = await page.evaluate(() => {
    const r = window.__ARENA.meta.runs.loadRun('tournament');
    return { id: r.id, round: r.roundIndex, wins: r.history.length };
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
  await page.evaluate(() => window.__ARENA.ready);
  const runAfter = await page.evaluate(() => {
    const r = window.__ARENA.meta.runs.loadRun('tournament');
    return { id: r?.id, round: r?.roundIndex, wins: r?.history?.length };
  });
  assert(runAfter.id === before.id && runAfter.round === before.round,
    `tournament run survived a reload (round ${runAfter.round}, ${runAfter.wins} played)`);

  // 3. A corrupt save must not stop the game booting.
  await page.evaluate(() => {
    localStorage.setItem('gla.save', '{"v":2,"teams":[{"members":');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  const booted = await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 }).then(() => true).catch(() => false);
  assert(booted, 'game boots with a corrupt save file');
  if (booted) {
    await page.evaluate(() => window.__ARENA.ready);
    const health = await page.evaluate(() => ({
      health: window.__ARENA.debug.saveHealth(),
      screen: window.__ARENA.router.currentId,
      backup: !!localStorage.getItem('gla.save.corrupt')
    }));
    assert(health.health.corrupt === true, 'the corrupt save was detected');
    assert(health.backup === true, 'the broken file was kept as gla.save.corrupt');
    assert(health.screen === 'title', 'the title screen still mounted');
  }

  // 4. A save from a future version is read, not destroyed.
  await page.evaluate(() => {
    localStorage.setItem('gla.save', JSON.stringify({ v: 99, xp: 4321, teams: [], record: {}, profile: { name: 'From2099' } }));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
  await page.evaluate(() => window.__ARENA.ready);
  const future = await page.evaluate(() => ({
    xp: window.__ARENA.meta.save.data().xp,
    name: window.__ARENA.meta.save.data().profile.name,
    flag: window.__ARENA.debug.saveHealth().fromFuture
  }));
  assert(future.xp === 4321 && future.name === 'From2099', 'a newer-version save is read rather than wiped');
  assert(future.flag === true, 'the from-the-future save is flagged');

  // 5. Round-trip a team through the link code.
  const trip = await page.evaluate(() => {
    const A = window.__ARENA;
    const team = [A.sim.makeDefaultMember('luffy', 50)];
    team[0].evs = { hp: 4, atk: 252, def: 0, spa: 0, spd: 0, spe: 252 };
    team[0].nature = 'adamant';
    const code = A.meta.link.encodeTeam(team, 'Round Trip');
    const back = A.meta.link.decodeTeam(code);
    const compact = A.meta.teamcode.encodeTeam({ name: 'Round Trip', members: team });
    const backCompact = A.meta.teamcode.decodeTeam(compact);
    return {
      name: back.name,
      evs: back.team[0].evs.atk,
      compactOk: backCompact.ok,
      compactEvs: backCompact.ok ? backCompact.team.members[0].evs.atk : null,
      compactLen: compact.length, linkLen: code.length
    };
  });
  assert(trip.name === 'Round Trip' && trip.evs === 252, 'GLA-TEAM code round-trips a tuned fighter');
  assert(trip.compactOk && trip.compactEvs === 252, 'GLA1 compact code round-trips too');
  notes.push(`code sizes: link ${trip.linkLen} chars, compact ${trip.compactLen} chars`);

  // 6. Results must be able to report on a battle without one being on screen.
  await page.evaluate(() => window.__ARENA.debug.fixture('team'));
  const headless = await page.evaluate(async () => {
    const A = window.__ARENA;
    const { createBattle, submitChoices, chooseAction, makeDefaultMember, defaultBag } = A.sim;
    const team = () => ['luffy', 'zoro', 'nami'].map((id) => makeDefaultMember(id, 50));
    const b = createBattle({
      seed: 909, arena: 'colosseum',
      format: { level: 50, teamSize: 3, bring: 3 },
      sides: [{ name: 'You', team: team(), items: defaultBag() }, { name: 'Rival', team: team(), items: defaultBag() }]
    });
    let guard = 0;
    while (!b.ended && guard++ < 300) submitChoices(b, [0, 1].map((s) => (b.request[s] ? chooseAction(b, s, 'ace') : null)));
    A.app.lastBattle = b;
    A.router.go('results', { replayFrom: { meta: { kind: 'quick' }, aiLevel: 'ace' } });
    await new Promise((r) => setTimeout(r, 400));
    const xp = A.meta.save.data().xp;
    return { screen: A.router.currentId, xp, turns: b.turn, winner: b.winner };
  });
  assert(headless.screen === 'results', 'results screen mounts from a finished battle');
  assert(headless.xp > 0, `the battle was recorded into the save (${headless.xp} xp)`);
  await sleep(700);
  await page.screenshot({ path: `${OUT}/wide-70-results.png` });
  console.log(`  📸 ${OUT}/wide-70-results.png`);

  // 7. Rematch must keep the same two crews. This is the bug the old screen had.
  const rematch = await page.evaluate(async () => {
    const A = window.__ARENA;
    const beforeTeams = A.app.lastBattle.sides.map((s) => s.party.map((p) => p.speciesId).join(','));
    A.router.current.rematch();
    await new Promise((r) => setTimeout(r, 700));
    const b = A.battle.raw();
    const afterTeams = b ? b.sides.map((s) => s.party.map((p) => p.speciesId).join(',')) : null;
    return { beforeTeams, afterTeams, seedChanged: b && b.seed !== A.app.lastBattle.seed };
  });
  assert(rematch.afterTeams && rematch.afterTeams[0] === rematch.beforeTeams[0]
    && rematch.afterTeams[1] === rematch.beforeTeams[1],
  `rematch keeps both crews (${rematch.afterTeams?.[0]} vs ${rematch.afterTeams?.[1]})`);

  await page.evaluate(() => window.__ARENA.router.go('title'));
}

main().catch((e) => { console.error(e); process.exit(1); });
