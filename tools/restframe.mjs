// At the command prompt, is the camera actually there yet?
//
// The camera harness measures the resting shot once it has arrived, and reports
// clean numbers. The probe screenshots 1.5s after a choice and sometimes catches
// an empty arena. Both can be true: the prompt may be raised while the camera is
// still travelling. This measures the two moments separately and says which.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir } from 'node:fs/promises';

const PORT = Number(process.argv[2] || 8764);
await mkdir('tests/shots/restframe', { recursive: true });
const p = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((r) => p.stdout.on('data', (d) => String(d).includes('serving') && r()));
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const pg = await b.newPage({ viewport: { width: 1000, height: 640 } });
await pg.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'networkidle' });
await pg.waitForFunction(() => window.__ARENA?.version);
await pg.evaluate(() => window.__ARENA.audio.setMuted(true));
await pg.evaluate(() => window.__ARENA.battle.quick('REST-1'));

const measure = () => pg.evaluate(() => {
  const A = window.__ARENA, THREE = A.debug.THREE, cam = A.stage.camera;
  const out = [];
  for (const a of A.app.view.actors) {
    if (!a) { out.push(null); continue; }
    const box = new THREE.Box3().setFromObject(a.root);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, any = false;
    for (let i = 0; i < 8; i++) {
      const v = new THREE.Vector3(
        i & 1 ? box.max.x : box.min.x,
        i & 2 ? box.max.y : box.min.y,
        i & 4 ? box.max.z : box.min.z
      ).project(cam);
      if (v.z > 1) continue;
      any = true;
      x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x);
      y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
    }
    out.push(any
      ? { w: +((x1 - x0) * 50).toFixed(1), h: +((y1 - y0) * 50).toFixed(1), on: x1 > -1 && x0 < 1 && y1 > -1 && y0 < 1 }
      : null);
  }
  const d = A.app.view.dir;
  return { actors: out, blend: +(d.blend ?? 1).toFixed(2), shot: d.shot?.id ?? d.shotName ?? null };
});

const fmt = (s) => s.actors.map((a, i) => (a ? `p${i} ${a.w}x${a.h}%${a.on ? '' : ' OFF'}` : `p${i} —`)).join('   ');

for (let turn = 0; turn < 3; turn++) {
  for (let i = 0; i < 300; i++) {
    if (await pg.evaluate(() => window.__ARENA.battle.waitingFor() === 0)) break;
    await sleep(250);
  }
  const atPrompt = await measure();
  await pg.screenshot({ path: `tests/shots/restframe/t${turn}-a-prompt.png` });

  for (let i = 0; i < 300; i++) {
    if (await pg.evaluate(() => (window.__ARENA.app.view.dir.blend ?? 1) >= 1)) break;
    await sleep(250);
  }
  await sleep(700);
  const settled = await measure();
  await pg.screenshot({ path: `tests/shots/restframe/t${turn}-b-settled.png` });

  console.log(`turn ${turn}`);
  console.log(`  at prompt : blend=${atPrompt.blend} shot=${atPrompt.shot}   ${fmt(atPrompt)}`);
  console.log(`  settled   : blend=${settled.blend} shot=${settled.shot}   ${fmt(settled)}`);

  await pg.evaluate(() => {
    const A = window.__ARENA, s = A.battle.screen();
    if (s) A.battle.choose(0, A.sim.chooseAction(s.battle, 0, 'ace'));
  });
  await sleep(1200);
}

await b.close();
p.kill();
