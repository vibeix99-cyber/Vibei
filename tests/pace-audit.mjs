// PACE AUDIT — how long can you actually read the battle text?
//
//   node tests/pace-audit.mjs --label before --port 8732
//   node tests/pace-audit.mjs --label after  --port 8732 --speeds 0.5,1,2,4
//
// Everything is measured on the GAME clock (the sum of main.js's clamped frame
// deltas), never on wall clock: headless is software-rendered at a few fps, so
// wall time here is 4-8× the time a player on real hardware experiences.
//
// Two reading modes, because they answer different questions:
//   passive — nobody touches the controls. This is what a reader sees.
//   mash    — advanceText() every poll, the way tests/critic-feel.mjs drives it.
//             A player holding the A button. It is the *lower bound* on hold.
//
// Writes <out>/<label>.json and prints the table.

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, [])
);

const PORT = Number(args.port || 8732);
const OUT = args.out || 'tests/pacing';
const LABEL = String(args.label || 'run');
const TURNS = Number(args.turns || 6);
const SEED = String(args.seed || 'CRITIC-TIME');
const SPEEDS = String(args.speeds || '0.5,1,2,4').split(',').map(Number);
const SHOTS = args.shots ? String(args.shots) : `tests/shots/pace-${LABEL}`;
const BASE = `http://127.0.0.1:${PORT}`;

/* ------------------------------------------------------------------ */

async function startServer() {
  const p = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
  const ok = await new Promise((res) => {
    const t = setTimeout(() => res(false), 6000);
    p.stdout.on('data', (d) => { if (String(d).includes('serving')) { clearTimeout(t); res(true); } });
  });
  if (!ok) { p.kill(); return null; }        // already running is fine
  return p;
}

function stat(xs) {
  if (!xs.length) return { n: 0, min: 0, med: 0, mean: 0, max: 0 };
  const s = [...xs].sort((a, b) => a - b);
  const r = (v) => +v.toFixed(2);
  return {
    n: xs.length, min: r(s[0]), med: r(s[s.length >> 1]),
    mean: r(xs.reduce((a, b) => a + b, 0) / xs.length), max: r(s[s.length - 1])
  };
}

/* ------------------------------------------------------------------ */

async function main() {
  await mkdir(OUT, { recursive: true });
  await mkdir(SHOTS, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || undefined,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 580 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(`${BASE}/?quality=low`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
  await page.evaluate(() => window.__ARENA.ready);
  await page.evaluate(() => window.__ARENA.audio.setMuted(true));

  // Our own copy of the game's clamped clock + a message observer that watches
  // the rendered DOM exactly the way tests/critic-feel.mjs does, so the numbers
  // are directly comparable to the critic's.
  await page.evaluate(() => {
    window.__CF = { frames: 0, game: 0, last: performance.now() };
    window.__MSG = [];
    let prev = '', longest = '', since = 0;
    const el = () => document.querySelector('.textbox .txt');
    const loop = (t) => {
      const raw = Math.min(0.05, (t - window.__CF.last) / 1000);
      window.__CF.last = t; window.__CF.game += raw; window.__CF.frames++;
      const now = window.__CF.game;
      const e = el();
      const txt = e ? e.textContent.trim() : '';
      if (txt !== prev) {
        const growth = txt.startsWith(prev) && txt.length >= prev.length;
        if (!growth && longest) {
          if (window.__MSG.rec) window.__MSG.push({ text: longest, shown: +(now - since).toFixed(2) });
          since = now; longest = '';
        }
        if (txt.length > longest.length) longest = txt;
        prev = txt;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });

  const result = { label: LABEL, seed: SEED, turns: TURNS, speeds: {}, prompt: null, errors: [] };

  const setSpeed = (v) => page.evaluate((s) => {
    const A = window.__ARENA;
    const b = document.querySelector(`.speedbtn button[data-v="${s}"]`);
    if (b) { b.click(); return 'ui'; }
    A.battle.setSpeed(s);
    return 'api';
  }, v);

  /** One measured run: N turns at one speed in one reading mode. */
  async function run(speed, mode) {
    await page.evaluate((seed) => window.__ARENA.battle.start({ mode: 'ai', aiLevel: 'ace', teamSize: 3, seed }), SEED);
    await sleep(500);
    const how = await setSpeed(speed);
    const out = await page.evaluate(async ({ turns, mash }) => {
      const A = window.__ARENA, CF = window.__CF;
      const wait = async (fn, ms = 300000) => {
        const t0 = Date.now();
        while (Date.now() - t0 < ms) {
          if (fn()) return true;
          if (mash && A.textbox?.busy) A.battle.advanceText();
          await new Promise((r) => setTimeout(r, 20));
        }
        return false;
      };
      await wait(() => A.battle.waitingFor() === 0 || A.router.currentId !== 'battle');
      window.__MSG.length = 0; window.__MSG.rec = true;
      const turnG = [];
      for (let i = 0; i < turns; i++) {
        if (A.router.currentId !== 'battle') break;
        const s = A.battle.screen();
        if (!s) break;
        const side = s.battle.sides[0];
        const g0 = CF.game;
        if (s.forcedSwitch) {
          const j = side.party.findIndex((p, k) => !p.fainted && k !== side.activeIndex);
          A.battle.choose(0, { kind: 'switch', toSlot: j < 0 ? 0 : j });
        } else {
          A.battle.choose(0, A.sim.chooseAction(s.battle, 0, 'ace'));
        }
        const ok = await wait(() => A.battle.waitingFor() === 0 || A.router.currentId !== 'battle');
        if (!ok) break;
        if (!s.forcedSwitch) turnG.push(+(CF.game - g0).toFixed(2));
      }
      window.__MSG.rec = false;
      return { turnG, msgs: window.__MSG.slice(), fps: A.perf.fps };
    }, { turns: TURNS, mash: mode === 'mash' });
    const shown = out.msgs.map((m) => m.shown);
    return { speed, mode, how, fps: out.fps, turn: stat(out.turnG), line: stat(shown), msgs: out.msgs };
  }

  for (const sp of SPEEDS) {
    const r = await run(sp, 'passive');
    result.speeds[`${sp}x-passive`] = r;
    console.log(`  ${sp}× passive  line min ${r.line.min} med ${r.line.med} max ${r.line.max} (n=${r.line.n})  turn med ${r.turn.med}s  [${r.how}, ${r.fps}fps]`);
  }
  const m = await run(1, 'mash');
  result.speeds['1x-mash'] = m;
  console.log(`  1× MASH     line min ${m.line.min} med ${m.line.med} max ${m.line.max} (n=${m.line.n})  turn med ${m.turn.med}s`);

  /* ---- the command prompt, 1.6 game-seconds after the game asked ---- */
  await page.evaluate((seed) => window.__ARENA.battle.start({ mode: 'ai', aiLevel: 'ace', teamSize: 3, seed }), SEED);
  await sleep(500);
  await setSpeed(1);
  const prompt = await page.evaluate(async () => {
    const A = window.__ARENA, CF = window.__CF;
    const t0 = Date.now();
    while (Date.now() - t0 < 240000 && A.battle.waitingFor() !== 0) await new Promise((r) => setTimeout(r, 20));
    const g = CF.game + 1.6;
    while (CF.game < g && Date.now() - t0 < 300000) await new Promise((r) => setTimeout(r, 20));
    const el = document.querySelector('.textbox .txt');
    const box = document.querySelector('.textbox');
    return {
      text: el ? el.textContent.trim() : null,
      cmd: document.body.dataset.cmd,
      opacity: box ? getComputedStyle(box).opacity : null,
      waiting: A.battle.waitingFor()
    };
  });
  await page.screenshot({ path: `${SHOTS}/prompt-1.6s.png` });
  result.prompt = prompt;
  console.log(`  prompt @1.6s: text=${JSON.stringify(prompt.text)} cmd=${prompt.cmd} opacity=${prompt.opacity}`);

  result.errors = [...new Set(errors)];
  await writeFile(`${OUT}/${LABEL}.json`, JSON.stringify(result, null, 2));
  console.log(`\n  → ${OUT}/${LABEL}.json`);
  if (result.errors.length) console.log('  ⚠ ' + result.errors.slice(0, 6).join('\n  ⚠ '));

  await browser.close();
  server?.kill();
}

main().catch((e) => { console.error(e); process.exit(1); });
