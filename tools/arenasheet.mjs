// Arena contact sheets — every arena, from every shot the camera director uses,
// across every weather and terrain state, with fighters on the stage.
//
//   node tools/serve.mjs 8308 &
//   node tools/arenasheet.mjs --port 8308 --out tests/shots/arena
//
// Flags:
//   --port <n>      server port (started here if nothing is listening)
//   --out  <dir>    output directory (default tests/shots/arena)
//   --only <id>     single arena
//   --angles        skip the weather/terrain grid
//   --no-sheets     skip the composited contact sheets
//   --keep-ui       don't hide the HUD (default hides it so the stage is judged, not the UI)
//
// Produces:
//   <out>/<arena>/<shot>.png              per-angle frames
//   <out>/<arena>/w-<weather>.png         weather states
//   <out>/<arena>/t-<terrain>.png         terrain states
//   <out>/sheet-<arena>-angles.png        contact sheet: all angles
//   <out>/sheet-<arena>-field.png         contact sheet: weather + terrain
//   <out>/report.json                     perf + console errors

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { connect } from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]?.startsWith('--') === false ? arr[i + 1] : true]);
    return acc;
  }, [])
);

const PORT = Number(args.port || 8308);
const OUT = args.out || 'tests/shots/arena';
const BASE = `http://127.0.0.1:${PORT}`;
const W = 1280, H = 800;

// The shots the director actually cuts to (render/camera.js SHOTS).
const ANGLES = ['wide', 'standard', 'command', 'heroA', 'heroB', 'impactA', 'impactB', 'lowA', 'lowB', 'koA', 'koB', 'entryA', 'victory'];
const QUICK_ANGLES = ['wide', 'standard', 'heroA', 'heroB', 'lowA', 'koB'];
const WEATHERS = ['none', 'rain', 'sun', 'sandstorm', 'hail', 'fog'];
const TERRAINS = ['none', 'blade', 'ember', 'psychic', 'haki'];

function portOpen(port) {
  return new Promise((res) => {
    const s = connect({ port, host: '127.0.0.1' });
    s.on('connect', () => { s.destroy(); res(true); });
    s.on('error', () => res(false));
    setTimeout(() => { s.destroy(); res(false); }, 1200);
  });
}

async function ensureServer() {
  if (await portOpen(PORT)) { console.log(`▶ reusing server on ${PORT}`); return null; }
  const p = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('server start timeout')), 8000);
    p.stdout.on('data', (d) => { if (String(d).includes('serving')) { clearTimeout(t); res(); } });
    p.stderr.on('data', (d) => process.stderr.write(d));
  });
  console.log(`▶ started server on ${PORT}`);
  return p;
}

/** Wait until the battle view is idle and side 0 has been asked for a choice. */
async function settle(page, ms = 20000) {
  try {
    await page.waitForFunction(() => {
      const A = window.__ARENA;
      return A?.router?.currentId === 'battle' && A.battle.waitingFor() === 0 && !A.battle.isAnimating();
    }, null, { timeout: ms });
  } catch { /* fall through — capture whatever is on screen */ }
  await sleep(320);
}

const errors = [];

async function main() {
  await mkdir(OUT, { recursive: true });
  const server = await ensureServer();
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || undefined,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('console', (m) => { if (m.type() === 'warning' && /deprecat/i.test(m.text())) errors.push(`warn: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 25000 });
  await page.evaluate(() => window.__ARENA.ready);
  await page.evaluate(() => window.__ARENA.audio.setMuted(true));

  const caps = await page.evaluate(() => ({
    setWeather: typeof window.__ARENA.stage.setWeather === 'function',
    setTerrain: typeof window.__ARENA.stage.setTerrain === 'function',
    quality: window.__ARENA.stage.quality
  }));
  console.log(`  stage caps: weather=${caps.setWeather} terrain=${caps.setTerrain} quality=${caps.quality}`);

  const arenaIds = await page.evaluate(() => window.__ARENA.data.arenas.map((a) => a.id));
  const list = args.only ? arenaIds.filter((a) => a === args.only) : arenaIds;
  const angles = args.full ? ANGLES : QUICK_ANGLES;
  const perf = {};
  const made = {};

  for (const id of list) {
    await mkdir(`${OUT}/${id}`, { recursive: true });
    console.log(`\n▶ ${id}`);
    await page.evaluate((a) => window.__ARENA.battle.start({ arena: a, mode: 'ai', teamSize: 3, seed: 'SHEET-7' }), id);
    await settle(page);
    if (!args['keep-ui']) await page.evaluate(() => { document.getElementById('ui').style.visibility = 'hidden'; });

    made[id] = { angles: [], field: [] };

    for (const shot of angles) {
      await page.evaluate((s) => window.__ARENA.app.dir.cut(s), shot);
      await sleep(240);
      const f = `${OUT}/${id}/${shot}.png`;
      await page.screenshot({ path: f });
      made[id].angles.push({ label: shot, file: `${id}/${shot}.png` });
    }

    // Perf sample on the wide shot, after a moment of steady state.
    await page.evaluate(() => window.__ARENA.app.dir.cut('wide'));
    await sleep(1400);
    perf[id] = await page.evaluate(() => ({
      fps: window.__ARENA.perf.fps, drawCalls: window.__ARENA.perf.drawCalls, tris: window.__ARENA.perf.tris
    }));
    console.log(`  perf: ${perf[id].fps} fps · ${perf[id].drawCalls} calls · ${perf[id].tris} tris`);

    if (!args.angles && caps.setWeather) {
      await page.evaluate(() => window.__ARENA.app.dir.cut('standard'));
      for (const w of WEATHERS) {
        await page.evaluate((x) => window.__ARENA.stage.setWeather(x), w);
        await sleep(w === 'none' ? 350 : 1100);   // let particle fields fill
        const f = `${OUT}/${id}/w-${w}.png`;
        await page.screenshot({ path: f });
        made[id].field.push({ label: `weather: ${w}`, file: `${id}/w-${w}.png` });
      }
      await page.evaluate(() => window.__ARENA.stage.setWeather('none'));
    }
    if (!args.angles && caps.setTerrain) {
      for (const t of TERRAINS) {
        await page.evaluate((x) => window.__ARENA.stage.setTerrain(x), t);
        await sleep(t === 'none' ? 350 : 900);
        const f = `${OUT}/${id}/t-${t}.png`;
        await page.screenshot({ path: f });
        made[id].field.push({ label: `terrain: ${t}`, file: `${id}/t-${t}.png` });
      }
      await page.evaluate(() => window.__ARENA.stage.setTerrain('none'));
    }
    if (!args['keep-ui']) await page.evaluate(() => { document.getElementById('ui').style.visibility = ''; });
  }

  // ---- contact sheets --------------------------------------------------
  if (!args['no-sheets']) {
    const sheetPage = await browser.newPage({ viewport: { width: 1900, height: 1000 }, deviceScaleFactor: 1 });
    const urlFor = (rel) => `${BASE}/${OUT}/${rel}`.replace(/([^:])\/\/+/g, '$1/');

    const build = async (title, items, cols, cellW, outFile) => {
      if (!items.length) return;
      const rows = Math.ceil(items.length / cols);
      const cellH = Math.round(cellW * (H / W));
      const width = cols * cellW + (cols - 1) * 8 + 24;
      const height = rows * (cellH + 20) + (rows - 1) * 8 + 52;
      const html = `<!doctype html><meta charset="utf-8"><style>
        body{margin:0;background:#0b0d14;color:#f2c94c;font:13px/1.2 ui-monospace,Menlo,monospace;padding:12px;}
        h1{font-size:16px;margin:0 0 8px;letter-spacing:.16em;text-transform:uppercase}
        .g{display:grid;grid-template-columns:repeat(${cols},${cellW}px);gap:8px}
        figure{margin:0}
        img{width:${cellW}px;height:${cellH}px;display:block;border:1px solid #222a3a}
        figcaption{font-size:12px;color:#9fb0c8;padding:3px 0 0}
      </style><h1>${title}</h1><div class="g">${
        items.map((it) => `<figure><img src="${urlFor(it.file)}"><figcaption>${it.label}</figcaption></figure>`).join('')
      }</div>`;
      await sheetPage.setViewportSize({ width, height });
      await sheetPage.setContent(html, { waitUntil: 'networkidle' });
      await sheetPage.screenshot({ path: outFile });
      console.log(`  🗂  ${outFile}`);
    };

    for (const id of list) {
      await build(`${id} — camera angles`, made[id].angles, 3, 600, `${OUT}/sheet-${id}-angles.png`);
      await build(`${id} — weather & terrain`, made[id].field, 4, 452, `${OUT}/sheet-${id}-field.png`);
    }
    await sheetPage.close();
  }

  await writeFile(`${OUT}/report.json`, JSON.stringify({ caps, perf, errors: [...new Set(errors)] }, null, 2));
  console.log('\nperf table');
  console.log('arena           fps  calls   tris');
  for (const [k, v] of Object.entries(perf)) {
    console.log(`${k.padEnd(14)} ${String(v.fps).padStart(4)} ${String(v.drawCalls).padStart(6)} ${String(v.tris).padStart(7)}`);
  }
  if (errors.length) {
    console.log(`\n⚠ ${new Set(errors).size} console problem(s):`);
    [...new Set(errors)].slice(0, 20).forEach((e) => console.log('  - ' + e));
  } else console.log('\n✅ no console errors or deprecation warnings');

  await browser.close();
  server?.kill();
}

main().catch((e) => { console.error(e); process.exit(1); });
