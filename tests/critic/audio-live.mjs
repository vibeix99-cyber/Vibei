// CRITIC HARNESS — AUDIO, live play.  node tests/critic/audio-live.mjs --port 8813
// Instruments window.__ARENA.audio and drives a full 3v3 battle to a result,
// logging every sound the game actually asks for, in order, with game-clock
// timestamps. Then diffs the sounds made against the events emitted.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => {
  if (x.startsWith('--')) a.push([x.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return a;
}, []));
const PORT = Number(args.port || 8813);
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = 'tests/shots/audio';
const SEED = Number(args.seed || 424242);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__ARENA && window.__ARENA.ready, null, { timeout: 60000 });
await page.evaluate(() => window.__ARENA.ready);

await page.evaluate(() => {
  const A = window.__ARENA.audio;
  window.__LOG = [];
  for (const m of ['sfx', 'cry', 'startMusic', 'stopMusic', 'setIntensity']) {
    const orig = A[m].bind(A);
    A[m] = (...a) => {
      let arg0 = a[0];
      if (m === 'cry') arg0 = 'cry:' + (a[0]?.id || a[0]?.shape || '?') + ':' + (a[0]?.root ?? a[0]?.cry?.root ?? '?');
      window.__LOG.push({ gt: +(window.__ARENA.stage.time || 0).toFixed(3), m, a: arg0 });
      return orig(...a);
    };
  }
  A.setMuted(true);
});

await page.evaluate((seed) => window.__ARENA.battle.quick(seed), SEED);
await sleep(2500);

let guard = 0, chose = 0;
while (guard++ < 900) {
  const s = await page.evaluate(() => {
    const A = window.__ARENA, T = A.app.textbox;
    return {
      rid: A.router.currentId, wait: A.battle.waitingFor?.() ?? null,
      wfi: !!T?.waitingForInput, fs: !!A.battle.screen?.()?.forcedSwitch,
      anim: A.battle.isAnimating?.(), turn: A.battle.state()?.turn ?? null
    };
  });
  if (s.rid !== 'battle') break;
  if (s.fs) {
    await page.evaluate(() => {
      const A = window.__ARENA, side = A.battle.screen().battle.sides[0];
      const j = side.party.findIndex((p, k) => !p.fainted && k !== side.activeIndex);
      A.battle.choose(0, { kind: 'switch', toSlot: j < 0 ? 0 : j });
    });
    await sleep(250); continue;
  }
  if (s.wait != null) {
    const ok = await page.evaluate((side) => {
      const A = window.__ARENA;
      const raw = A.battle.raw();
      const mon = raw.sides[side].party[raw.sides[side].activeIndex];
      const mv = (mon.moves || []).find((m) => (m.pp ?? 1) > 0) || mon.moves?.[0];
      return A.battle.choose(side, { kind: 'move', moveId: mv?.id ?? mv?.moveId ?? mv, slot: 0 });
    }, s.wait);
    if (ok) chose++;
    await sleep(200); continue;
  }
  if (s.wfi) { await page.keyboard.press('Space'); await sleep(90); continue; }
  await sleep(140);
}

const res = await page.evaluate(() => {
  const A = window.__ARENA;
  const last = A.battle.last?.();
  const evs = A.battle.events?.() ?? last?.events ?? [];
  const kinds = {};
  for (const e of evs) { const k = e.t || e.type || e.kind || Object.keys(e)[0]; kinds[k] = (kinds[k] || 0) + 1; }
  return { rid: A.router.currentId, nEvents: evs.length, kinds, sample: evs.slice(0, 3), log: window.__LOG, gt: A.stage.time };
});

const counts = {};
for (const l of res.log) counts[`${l.m}:${l.a}`] = (counts[`${l.m}:${l.a}`] || 0) + 1;
await mkdir(OUT, { recursive: true });
await writeFile(`${OUT}/live-battle.json`, JSON.stringify({ ...res, counts, chose }, null, 1));

console.log(`choices submitted ${chose}   ending screen "${res.rid}"   game clock ${res.gt.toFixed(1)}s`);
console.log(`events ${res.nEvents}   audio calls ${res.log.length}`);
console.log('\nEVENT KINDS'); console.log(Object.entries(res.kinds).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${String(k).padEnd(18)} ${v}`).join('\n'));
console.log('\nSAMPLE EVENT'); console.log(JSON.stringify(res.sample[0]));
console.log('\nAUDIO CALLS'); console.log(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k.padEnd(30)} ${v}`).join('\n'));
const nonBlip = res.log.filter((l) => l.a !== 'text_blip');
console.log(`\nnon-text-blip audio calls: ${nonBlip.length} of ${res.log.length} (${(100 * nonBlip.length / res.log.length).toFixed(1)}%)`);
console.log('\nNON-BLIP SEQUENCE (game-clock s)');
console.log(nonBlip.map((l) => `  ${String(l.gt).padStart(8)}  ${l.m}(${l.a})`).join('\n'));
const inten = res.log.filter((l) => l.m === 'setIntensity').map((l) => l.a);
console.log(`\nsetIntensity values seen: ${JSON.stringify(inten)}  max ${Math.max(...inten, 0)}`);
console.log(`startMusic calls: ${JSON.stringify(res.log.filter((l) => l.m === 'startMusic').map((l) => l.a))}`);
if (errors.length) console.log('\nPAGE ERRORS\n' + errors.slice(0, 8).join('\n'));
await browser.close();
