// Critic harness: THE BATTLE, AS EXPERIENCED.
// Mode is chosen with argv[2]. Port fixed at 8811 (server started externally).
//
//   node tests/critic-feel2.mjs surface     # dump __ARENA shape
//
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT = 8811;
const MODE = process.argv[2] || 'surface';
const OUT = 'tests/shots/feel2';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1000, height: 640 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

await page.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio.setMuted(true));

if (MODE === 'surface') {
  const dump = await page.evaluate(() => {
    const A = window.__ARENA;
    const shape = (o, depth = 0) => {
      if (o == null) return String(o);
      if (typeof o === 'function') return 'fn';
      if (Array.isArray(o)) return `array[${o.length}]`;
      if (typeof o !== 'object') return typeof o;
      if (depth > 1) return '{…}';
      const r = {};
      for (const k of Object.keys(o).slice(0, 60)) {
        try { r[k] = shape(o[k], depth + 1); } catch (e) { r[k] = 'ERR'; }
      }
      return r;
    };
    return { version: A.version, keys: shape(A, 0) };
  });
  console.log(JSON.stringify(dump, null, 2));
  await writeFile(`${OUT}/surface.json`, JSON.stringify(dump, null, 2));
}

if (MODE === 'deep') {
  await page.evaluate(() => window.__ARENA.battle.quick('FEEL-1'));
  await sleep(4000);
  const dump = await page.evaluate(() => {
    const A = window.__ARENA;
    const shape = (o, depth = 0) => {
      if (o == null) return String(o);
      if (typeof o === 'function') return 'fn';
      if (Array.isArray(o)) return `array[${o.length}]` + (o.length && typeof o[0] !== 'object' ? ' ' + JSON.stringify(o.slice(0, 4)) : '');
      if (typeof o !== 'object') return typeof o === 'string' ? JSON.stringify(o.slice(0, 80)) : o;
      if (o.isVector3) return `vec3(${o.x.toFixed(2)},${o.y.toFixed(2)},${o.z.toFixed(2)})`;
      if (depth > 1) return '{' + Object.keys(o).slice(0, 25).join(',') + '}';
      const r = {};
      for (const k of Object.keys(o).slice(0, 70)) {
        try { r[k] = shape(o[k], depth + 1); } catch (e) { r[k] = 'ERR'; }
      }
      return r;
    };
    return {
      view: shape(A.app.view),
      dir: shape(A.app.dir),
      textbox: shape(A.app.textbox),
      plate0: shape(A.app.plates[0]),
      feel: shape(A.stage.feel),
      fx: shape(A.stage.fx),
      banner: shape(A.app.fieldBanner),
      settings: shape(A.app.settings)
    };
  });
  console.log(JSON.stringify(dump, null, 2));
  await writeFile(`${OUT}/deep.json`, JSON.stringify(dump, null, 2));
}

console.log('errors:', errors.length ? errors : 'none');
await browser.close();
