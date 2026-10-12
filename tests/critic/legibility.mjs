// CRITIC — can a new player reconstruct why they lost from the battle log?
// Runs real battles in the page, dumps the human-visible log, and screenshots
// the battle screen so the numbers can be checked against pixels.

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = Number(process.env.PORT || 8702);
const OUT = 'tests/shots/critic-depth';
const BASE = `http://127.0.0.1:${PORT}`;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

await page.goto(`${BASE}/?quality=low`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 25000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio?.setMuted?.(true));

/* ---- headless logs from several full battles ---- */
const logs = await page.evaluate(() => {
  const A = window.__ARENA;
  const { createBattle, submitChoices, chooseAction, makeDefaultMember, defaultBag, RNG } = A.sim;
  const ids = A.data.fighters.map((f) => f.id);
  const out = [];
  for (let s = 0; s < 4; s++) {
    const rng = new RNG(31337 + s * 101);
    const team = () => [0, 0, 0].map(() => makeDefaultMember(ids[rng.int(ids.length)], 50));
    const b = createBattle({
      seed: 5000 + s, arena: 'colosseum', format: { level: 50, teamSize: 3, bring: 3 },
      sides: [{ name: 'You', team: team(), items: defaultBag() }, { name: 'Rival', team: team(), items: defaultBag() }]
    });
    let g = 0;
    while (!b.ended && g++ < 300) {
      submitChoices(b, [0, 1].map((i) => (b.request[i] ? chooseAction(b, i, i === 0 ? 'ace' : 'warlord') : null)));
    }
    out.push({
      seed: 5000 + s, winner: b.winner, turns: b.turn,
      log: b.log.slice(),
      events: b.events.length,
      kinds: [...new Set(b.events.map((e) => e.t))]
    });
  }
  return out;
});

let report = '';
for (const l of logs) {
  report += `\n════ battle seed ${l.seed} — winner ${l.winner}, ${l.turns} turns, ${l.events} events ════\n`;
  report += l.log.map((t, i) => `${String(i).padStart(3)}  ${t}`).join('\n') + '\n';
}
await writeFile(`${OUT}/logs.txt`, report);

/* ---- log quality metrics ---- */
const metrics = logs.map((l) => {
  const lines = l.log;
  let dupes = 0, blanks = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i] || !String(lines[i]).trim()) blanks++;
    if (i && lines[i] === lines[i - 1]) dupes++;
  }
  const hasWhy = lines.filter((t) => /super effective|not very effective|critical|doesn't affect|barely scratches|devastating/i.test(t)).length;
  return { seed: l.seed, lines: lines.length, perTurn: (lines.length / l.turns).toFixed(1), dupes, blanks, effLines: hasWhy };
});
console.log('\n── log shape ──');
console.table(metrics);

/* ---- what the player actually sees, on screen ---- */
await page.evaluate(() => window.__ARENA.router.go('battle', {}));
await sleep(1500);
await page.evaluate(() => window.__ARENA.battle?.quick?.(20260809));
await sleep(2500);
await page.screenshot({ path: `${OUT}/01-battle-open.png` });

// step a few turns with animations skipped so the HUD state is readable
const stepShots = [];
for (let i = 0; i < 4; i++) {
  await page.evaluate(async () => {
    const A = window.__ARENA;
    if (!A.battle?.state) return;
    const st = A.battle.state();
    if (st?.request?.[0] === 'move') {
      const mv = st.sides[0].party[st.sides[0].activeIndex].moves.find((m) => m.pp > 0);
      if (mv) A.battle.choose(0, { kind: 'move', moveId: mv.id, target: 'foe' });
    } else if (st?.request?.[0] === 'switch') {
      A.battle.choose(0, { kind: 'switch', toSlot: 1 });
    }
  });
  await sleep(2600);
  const p = `${OUT}/02-turn-${i}.png`;
  await page.screenshot({ path: p });
  stepShots.push(p);
}

const uiLog = await page.evaluate(() => (window.__ARENA.battle?.log?.() || []).slice(-25));
console.log('\n── last 25 lines of the on-screen battle log ──');
uiLog.forEach((t) => console.log('   ' + t));

// The textbox itself, as rendered
const textbox = await page.evaluate(() => {
  const el = document.querySelector('.textbox, #textbox, [class*="textbox"]');
  return el ? el.textContent.trim().slice(0, 300) : null;
});
console.log('\ntextbox DOM text:', JSON.stringify(textbox));

if (errors.length) { console.log('\n── console errors ──'); errors.slice(0, 10).forEach((e) => console.log('  ' + e)); }
else console.log('\nno console errors');

console.log(`\nwrote ${OUT}/logs.txt and ${stepShots.length + 1} screenshots`);
await browser.close();
