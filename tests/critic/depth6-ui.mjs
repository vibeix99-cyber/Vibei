// CRITIC — DEPTH, the running build. What information does the player actually
// have at the moment of choosing? Screenshots + DOM scrape of the command dock.
//
//   node tools/serve.mjs 8871 &
//   node tests/critic/depth6-ui.mjs --port 8871 --out tests/shots/depth6

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const PORT = Number(arg('port', 8871));
const OUT = arg('out', 'tests/shots/depth6');
const BASE = `http://127.0.0.1:${PORT}`;

const errors = [];

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__ARENA?.ready, null, { timeout: 90000 });
  await page.evaluate(() => window.__ARENA.ready);
  await page.evaluate(() => window.__ARENA.audio?.setMuted?.(true));
  console.log('booted, version', await page.evaluate(() => window.__ARENA.version));

  // Start a scripted battle where the interesting mechanics are guaranteed to
  // be on screen: a hazard setter, a status move, a pivot and a resisted matchup.
  const teams = await page.evaluate(() => {
    const A = window.__ARENA;
    const mk = (id) => A.sim.makeDefaultMember(id, 50);
    const p0 = ['crocodile', 'jinbe', 'brook'].map(mk);
    const p1 = ['franky', 'enel', 'kaido'].map(mk);
    A.battle.start({ seed: 424242, arena: 'colosseum', p0Team: p0, p1Team: p1, mode: 'ai', aiLevel: 'warlord' });
    return { p0, p1 };
  });
  console.log('teams:', JSON.stringify(teams).slice(0, 800));

  // wait for the first real prompt
  await page.waitForFunction(() => window.__ARENA.battle.waitingFor() === 0, null, { timeout: 180000 });
  console.log('first prompt reached at game turn', await page.evaluate(() => window.__ARENA.battle.state().turn));

  const dump = async (name) => {
    await page.screenshot({ path: `${OUT}/${name}.png` });
    console.log(`  📸 ${OUT}/${name}.png`);
  };

  await page.evaluate(() => window.__ARENA.battle.showMenu('moves', 0));
  await page.waitForTimeout(400);
  await dump('01-moves');

  const cards = await page.evaluate(() => {
    const out = [];
    for (const c of document.querySelectorAll('.movecard')) {
      out.push({ eff: c.dataset.eff || null, text: c.innerText.replace(/\n+/g, ' | ') });
    }
    return out;
  });
  console.log('\n── MOVE CARDS ──');
  for (const c of cards) console.log(`  [${c.eff ?? '-'}] ${c.text}`);

  await page.evaluate(() => window.__ARENA.battle.showMenu('party', 0));
  await page.waitForTimeout(400);
  await dump('02-switch');
  const party = await page.evaluate(() => {
    const out = [];
    for (const c of document.querySelectorAll('[class*="party"], .pcard, .partycard')) {
      const t = c.innerText?.replace(/\n+/g, ' | ');
      if (t && t.length > 4) out.push({ cls: c.className, text: t.slice(0, 260) });
    }
    return out;
  });
  console.log('\n── SWITCH PANEL ──');
  for (const p of party.slice(0, 8)) console.log(`  (${p.cls}) ${p.text}`);

  await page.evaluate(() => window.__ARENA.battle.showMenu('bag', 0));
  await page.waitForTimeout(300);
  await dump('03-bag');

  // Hover a move card to see the detail panel (power / acc / pp / effect text)
  await page.evaluate(() => window.__ARENA.battle.showMenu('moves', 0));
  await page.waitForTimeout(300);
  const detail = await page.evaluate(() => {
    const c = document.querySelector('.movecard');
    c?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    c?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    return document.body.innerText.slice(0, 60);
  });
  await page.waitForTimeout(300);
  await dump('04-move-detail');
  const detailText = await page.evaluate(() => {
    const el = document.querySelector('.mv-detail, .movedetail, .detail, .mv-info, .dock-detail');
    return el ? el.innerText.replace(/\n+/g, ' | ') : null;
  });
  console.log('\n── MOVE DETAIL PANEL ──\n  ', detailText);

  // HUD: what state does the player see about the field?
  const hud = await page.evaluate(() => {
    const grab = (sel) => [...document.querySelectorAll(sel)].map((e) => e.innerText.replace(/\n+/g, ' | ')).filter(Boolean);
    return {
      nameplates: grab('.nameplate'),
      field: grab('.fieldpips, .field-pips, .fieldbar, .hazardpips, .statuspips'),
      bodyChunk: document.querySelector('#ui')?.innerText.replace(/\n+/g, ' | ').slice(0, 1200)
    };
  });
  console.log('\n── HUD ──');
  console.log('  nameplates:', JSON.stringify(hud.nameplates));
  console.log('  field pips:', JSON.stringify(hud.field));

  // Now actually play 12 turns, choosing through __ARENA, and log the events
  // that carry mechanical depth.
  await page.evaluate(() => window.__ARENA.battle.skipAnimations(true));
  const played = await page.evaluate(async () => {
    const A = window.__ARENA;
    const seen = [];
    const kinds = {};
    for (let t = 0; t < 40; t++) {
      const w = A.battle.waitingFor();
      if (w === null) { await new Promise((r) => setTimeout(r, 120)); continue; }
      const st = A.battle.state();
      if (st.ended) break;
      const legal = st.request[0] === 'switch' ? null : 'move';
      if (st.request[0] === 'switch') {
        const opts = st.sides[0].party.map((p, i) => (!p.fainted && i !== st.sides[0].activeIndex ? i : -1)).filter((i) => i >= 0);
        A.battle.choose(0, { kind: 'switch', toSlot: opts[0] });
      } else {
        const me = st.sides[0].party[st.sides[0].activeIndex];
        A.battle.choose(0, { kind: 'move', moveId: me.moves[t % me.moves.length].id, target: 'foe' });
      }
      await new Promise((r) => setTimeout(r, 60));
    }
    for (const e of A.battle.events()) kinds[e.t] = (kinds[e.t] || 0) + 1;
    return { kinds, log: A.battle.log().slice(-40), turn: A.battle.state().turn, ended: A.battle.state().ended };
  });
  console.log('\n── 40-STEP PLAYTHROUGH ──');
  console.log('  turn reached', played.turn, 'ended', played.ended);
  console.log('  event kinds:', JSON.stringify(played.kinds));
  console.log('  tail of the battle log:');
  for (const l of played.log) console.log('    ' + l);
  await dump('05-mid');

  await writeFile(`${OUT}/report.json`, JSON.stringify({ cards, party, hud, played }, null, 2));
  console.log('\nerrors:', errors.length ? errors : 'none');
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
