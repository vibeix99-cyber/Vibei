// Critic harness #3: THE BATTLE, AS EXPERIENCED.
// Server must already be running on 8811.
//   node tests/critic-feel3.mjs <mode> [args]
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT = 8811;
const MODE = process.argv[2] || 'surface';
const OUT = 'tests/shots/feel3';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
});
const VW = Number(process.env.VW || 1000), VH = Number(process.env.VH || 640);
const QUALITY = process.env.Q || 'low';
const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

await page.goto(`http://127.0.0.1:${PORT}/?quality=${QUALITY}`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio.setMuted(true));

// ----------------------------------------------------------------- helpers --
const peek = () => page.evaluate(() => {
  const A = window.__ARENA, V = A.app.view, D = A.app.dir, T = A.app.textbox, F = A.stage.feel;
  return {
    gt: +A.stage.time.toFixed(2), fps: A.perf.fps, shot: D.shot?.id ?? null, subj: D.shot?.subject ?? null,
    blend: +(D.blend ?? 1).toFixed(2),
    txt: T.$txt ? T.$txt.textContent : '', chars: T.charIdx, full: T.current ? (T.current.text || '').length : 0,
    wfi: !!T.waitingForInput, tq: T.queue.length,
    hp: A.app.plates.map((p) => `${p.hp}/${p.maxHp} bar=${p.hpSpring.value.toFixed(3)}->${p.hpSpring.target.toFixed(3)} gh=${p.ghost.toFixed(3)}`),
    shake: +F.shake.amp.toFixed(3), flash: +F.flash.a.toFixed(3), hitstop: F.hitstopMs,
    zoom: +F.zoomPunch.toFixed(3), chroma: +F.chroma.toFixed(3),
    vfx: V.vfx.active.length, gate: +V.gate.toFixed(2), q: V.queue.length,
    wait: A.battle.waitingFor?.() ?? null, anim: A.battle.isAnimating?.() ?? null, turn: V.state?.turn,
    menu: !!document.querySelector('.cmdbtn.fight')
  };
});

// in-page sampler on the game's own clock
const INSTALL = () => {
  const A = window.__ARENA;
  const S = []; window.__REC = S; window.__RECON = true; window.__MARKS = [];
  const tick = () => {
    if (window.__RECON) requestAnimationFrame(tick);
    try {
      const V = A.app.view, D = A.app.dir, T = A.app.textbox, F = A.stage.feel;
      S.push({
        gt: +A.stage.time.toFixed(4), w: +performance.now().toFixed(1), fps: A.perf.fps,
        shot: D.shot?.id ?? null, subj: D.shot?.subject ?? null, blend: +(D.blend ?? 1).toFixed(3),
        cam: [+A.stage.camera.position.x.toFixed(2), +A.stage.camera.position.y.toFixed(2), +A.stage.camera.position.z.toFixed(2)],
        fov: +A.stage.camera.fov.toFixed(2),
        txt: T.$txt ? T.$txt.textContent : '', chars: T.charIdx, full: T.current ? (T.current.text || '').length : 0,
        tq: T.queue.length, wfi: !!T.waitingForInput,
        hp: A.app.plates.map((p) => [p.hp, p.maxHp, +p.hpSpring.value.toFixed(4), +p.hpSpring.target.toFixed(4), +p.ghost.toFixed(4)]),
        shake: +F.shake.amp.toFixed(4), flash: +F.flash.a.toFixed(4), hits: F.hitstopMs,
        zoom: +F.zoomPunch.toFixed(4), chroma: +F.chroma.toFixed(4),
        vfx: V.vfx.active.length, gate: +V.gate.toFixed(3), q: V.queue.length, turn: V.state?.turn ?? -1,
        act: V.actors.map((a) => (a ? [+a.root.position.x.toFixed(2), +a.root.position.y.toFixed(2), +a.root.position.z.toFixed(2), +a.root.scale.y.toFixed(3)] : null)),
        wait: A.battle.waitingFor?.() ?? null, anim: A.battle.isAnimating?.() ?? null
      });
    } catch (e) { S.push({ err: String(e.message) }); }
  };
  requestAnimationFrame(tick);
};
const mark = (m) => page.evaluate((mm) => window.__MARKS.push({ ...mm, gt: +window.__ARENA.stage.time.toFixed(3), w: +performance.now().toFixed(1) }), m);

const waitPrompt = async (max = 600) => {
  for (let i = 0; i < max; i++) {
    const s = await page.evaluate(() => ({ w: window.__ARENA.battle.waitingFor(), r: window.__ARENA.router.currentId }));
    if (s.r !== 'battle') return 'over';
    if (s.w === 0) return 'prompt';
    await sleep(150);
  }
  return 'stall';
};
const clearStalePrompt = async () => {
  for (let i = 0; i < 120; i++) {
    const s = await page.evaluate(() => ({ t: window.__ARENA.app.textbox.$txt.textContent, wfi: window.__ARENA.app.textbox.waitingForInput }));
    if (s.wfi && s.t.startsWith('What will')) { await page.keyboard.press('Space'); return true; }
    if (!s.t.startsWith('What will')) return false;
    await sleep(120);
  }
  return false;
};
async function playTurn(moveIdx = 2) {
  if (!(await page.evaluate(() => !!document.querySelector('.cmdbtn.fight')))) return 'no-menu';
  await page.click('.cmdbtn.fight');
  await sleep(450);
  const cards = await page.$$('.movegrid .movecard');
  if (!cards.length) return 'no-moves';
  await cards[Math.min(moveIdx, cards.length - 1)].click();
  return 'ok';
}
async function handleForcedSwitch() {
  const ok = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.partygrid .partycard, .partycard, .switchcard')];
    const pick = cards.find((c) => !c.classList.contains('fainted') && !c.disabled);
    if (pick) { pick.click(); return 'clicked'; }
    return null;
  });
  if (ok) return ok;
  await page.click('.cmdbtn.party').catch(() => {});
  await sleep(500);
  const r = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.partygrid .partycard, .partycard, .switchcard')];
    const pick = cards.find((c) => !c.classList.contains('fainted') && !c.disabled);
    if (pick) { pick.click(); return 'clicked-after-party'; }
    const A = window.__ARENA, s = A.battle.screen(), side = s.battle.sides[0];
    const i = side.party.findIndex((p, j) => !p.fainted && j !== side.activeIndex);
    A.battle.choose(0, { kind: 'switch', toSlot: i < 0 ? 0 : i });
    return 'api-fallback';
  });
  return r;
}

// ------------------------------------------------------------------- modes --
if (MODE === 'surface') {
  const dump = await page.evaluate(() => {
    const A = window.__ARENA;
    const shape = (o, d = 0) => {
      if (o == null) return String(o);
      if (typeof o === 'function') return 'fn';
      if (Array.isArray(o)) return `array[${o.length}]`;
      if (typeof o !== 'object') return typeof o;
      if (d > 1) return '{' + Object.keys(o).slice(0, 30).join(',') + '}';
      const r = {}; for (const k of Object.keys(o).slice(0, 70)) { try { r[k] = shape(o[k], d + 1); } catch { r[k] = 'ERR'; } }
      return r;
    };
    return { version: A.version, keys: shape(A, 0) };
  });
  console.log(JSON.stringify(dump, null, 2));
}

if (MODE === 'intro') {
  // Battle start: dense screenshot burst from quick() to the first command prompt.
  const SEED = process.argv[3] || 'FEEL3-A';
  await page.evaluate(INSTALL);
  const meta = [];
  await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
  for (let i = 0; i < 40; i++) {
    await page.screenshot({ path: `${OUT}/i-${String(i).padStart(2, '0')}.png` });
    const s = await peek();
    meta.push({ i, ...s });
    console.log(`i-${String(i).padStart(2, '0')}`.padEnd(7), `gt=${String(s.gt).padStart(7)} fps=${s.fps} shot=${String(s.shot).padEnd(10)} bl=${s.blend} q=${s.q} gate=${s.gate} vfx=${s.vfx} wait=${s.wait} menu=${s.menu} hp=[${s.hp.join(' | ')}] ${JSON.stringify(s.txt).slice(0, 50)}`);
    if (s.wait === 0 && i > 4) break;
    await sleep(220);
  }
  await page.evaluate(() => { window.__RECON = false; });
  const rec = await page.evaluate(() => window.__REC);
  await writeFile(`${OUT}/intro.json`, JSON.stringify({ meta, rec }));
  console.log('log:', JSON.stringify(await page.evaluate(() => window.__ARENA.battle.log())));
}

if (MODE === 'rest') {
  // camera at the prompt vs camera settled, for 4 consecutive turns
  await page.evaluate((s) => window.__ARENA.battle.quick(s), process.argv[3] || 'FEEL3-A');
  const measure = () => page.evaluate(() => {
    const A = window.__ARENA, THREE = A.debug.THREE, cam = A.stage.camera;
    const out = [];
    for (const a of A.app.view.actors) {
      if (!a) { out.push(null); continue; }
      const box = new THREE.Box3().setFromObject(a.root);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, any = false;
      for (let i = 0; i < 8; i++) {
        const v = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(cam);
        if (v.z > 1) continue; any = true;
        x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
      }
      out.push(any ? { w: +((x1 - x0) * 50).toFixed(1), h: +((y1 - y0) * 50).toFixed(1), cx: +(((x0 + x1) / 2) * 50 + 50).toFixed(0), cy: +((1 - (y0 + y1) / 2) * 50).toFixed(0), on: x1 > -1 && x0 < 1 && y1 > -1 && y0 < 1 } : null);
    }
    return { actors: out, blend: +(A.app.dir.blend ?? 1).toFixed(2), shot: A.app.dir.shot?.id, gt: +A.stage.time.toFixed(2) };
  });
  const f = (m) => m.actors.map((x, i) => (x ? `p${i} ${x.w}x${x.h}% @(${x.cx},${x.cy})${x.on ? '' : ' OFFSCREEN'}` : `p${i} —`)).join('  ');
  for (let turn = 0; turn < 4; turn++) {
    if ((await waitPrompt()) !== 'prompt') { console.log('battle over/stall'); break; }
    const a = await measure();
    await page.screenshot({ path: `${OUT}/r${turn}-a-prompt.png` });
    for (let i = 0; i < 300; i++) { if (await page.evaluate(() => (window.__ARENA.app.dir.blend ?? 1) >= 1 && window.__ARENA.app.view.queue.length === 0)) break; await sleep(200); }
    await sleep(1200);
    const b = await measure();
    await page.screenshot({ path: `${OUT}/r${turn}-b-settled.png` });
    console.log(`turn ${turn}`);
    console.log(`  prompt  gt=${a.gt} shot=${a.shot} blend=${a.blend}  ${f(a)}`);
    console.log(`  settled gt=${b.gt} shot=${b.shot} blend=${b.blend}  ${f(b)}`);
    const r = await playTurn(2);
    if (r !== 'ok') { console.log('playTurn:', r); break; }
    await sleep(600); await clearStalePrompt();
  }
}

if (MODE === 'turnfilm') {
  // One complete turn, played through the UI, with a dense frame burst.
  const SEED = process.argv[3] || 'FEEL3-A';
  const SKIPTURNS = Number(process.argv[4] || 0);
  await page.evaluate(INSTALL);
  await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
  for (let k = 0; k < SKIPTURNS; k++) {
    if ((await waitPrompt()) !== 'prompt') break;
    await sleep(600); await playTurn(2); await sleep(600); await clearStalePrompt();
  }
  if ((await waitPrompt()) !== 'prompt') { console.log('battle over before target turn'); }
  await sleep(1500);
  const meta = [];
  const grab = async (name) => {
    await page.screenshot({ path: `${OUT}/${name}.png` });
    const s = await peek(); meta.push({ name, ...s });
    console.log(name.padEnd(12), `gt=${String(s.gt).padStart(7)} shot=${String(s.shot).padEnd(10)}/${String(s.subj)} bl=${s.blend} q=${s.q} gate=${s.gate} vfx=${s.vfx} sh=${s.shake} fl=${s.flash} zm=${s.zoom} hs=${s.hitstop} hp=[${s.hp.join(' | ')}] ${JSON.stringify(s.txt).slice(0, 48)}`);
  };
  await grab('t-00-prompt');
  await page.click('.cmdbtn.fight'); await sleep(500); await grab('t-01-moves');
  await mark({ ev: 'move-clicked' });
  const cards = await page.$$('.movegrid .movecard');
  await cards[2].click();
  for (let i = 0; i < 90; i++) {
    await grab(`t-${String(i + 2).padStart(2, '0')}`);
    const s = await page.evaluate(() => ({ wfi: window.__ARENA.app.textbox.waitingForInput, wait: window.__ARENA.battle.waitingFor(), txt: window.__ARENA.app.textbox.$txt.textContent }));
    if (s.wait === 0 && i > 6 && !s.txt.startsWith('What will')) break;
    if (s.wait === 0 && i > 10) break;
    if (s.wfi && s.txt.startsWith('What will')) await page.keyboard.press('Space');
    await sleep(90);
  }
  await page.evaluate(() => { window.__RECON = false; });
  const out = await page.evaluate(() => ({ rec: window.__REC, marks: window.__MARKS, log: window.__ARENA.battle.log() }));
  await writeFile(`${OUT}/turnfilm.json`, JSON.stringify({ meta, ...out }));
  console.log('log:', JSON.stringify(out.log));
}

if (MODE === 'wholebattle') {
  // Play a whole battle through the UI. Count turns, player inputs, game-clock length.
  const SEED = process.argv[3] || 'FEEL3-A';
  await page.evaluate(INSTALL);
  const t0 = Date.now();
  let clicks = 0, spaces = 0, turns = 0, switches = 0;
  await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
  await mark({ ev: 'battle-start' });
  outer: for (let t = 0; t < 60; t++) {
    const r = await waitPrompt(900);
    if (r === 'over') { await mark({ ev: 'battle-over' }); break; }
    if (r === 'stall') { await mark({ ev: 'STALL' }); console.log('STALL at turn', t); break; }
    const fs = await page.evaluate(() => !!window.__ARENA.battle.screen()?.forcedSwitch);
    await mark({ ev: 'prompt', t, fs, turn: await page.evaluate(() => window.__ARENA.app.view.state?.turn) });
    if (fs) { await handleForcedSwitch(); switches++; clicks += 2; }
    else { await sleep(400); const q = await playTurn(2); if (q !== 'ok') { console.log('playTurn', q); break outer; } clicks += 2; turns++; }
    await mark({ ev: 'committed', t });
    // clear all waiting-for-input text as a player would
    for (let i = 0; i < 400; i++) {
      const s = await page.evaluate(() => {
        const A = window.__ARENA, T = A.app.textbox;
        return { wfi: !!T.waitingForInput, wait: A.battle.waitingFor(), rid: A.router.currentId, txt: T.$txt?.textContent || '' };
      });
      if (s.rid !== 'battle') break;
      if (s.wait === 0) break;
      if (s.wfi) { await page.keyboard.press('Space'); spaces++; await mark({ ev: 'advance', txt: s.txt.slice(0, 50) }); }
      await sleep(110);
    }
  }
  await sleep(4000);
  await page.evaluate(() => { window.__RECON = false; });
  const out = await page.evaluate(() => ({ rec: window.__REC, marks: window.__MARKS, log: window.__ARENA.battle.log(), rid: window.__ARENA.router.currentId, fps: window.__ARENA.perf.fps }));
  await writeFile(`${OUT}/whole-${SEED}.json`, JSON.stringify(out));
  const gt = out.rec.length ? out.rec[out.rec.length - 1].gt - out.rec[0].gt : 0;
  console.log(`seed=${SEED} turns=${turns} forcedSwitches=${switches} clicks=${clicks} spaceAdvances=${spaces}`);
  console.log(`gameclock=${gt.toFixed(1)}s wall=${((Date.now() - t0) / 1000).toFixed(1)}s fps=${out.fps} samples=${out.rec.length} endScreen=${out.rid}`);
  console.log(`messages=${out.log.length}`);
  console.log('log:', JSON.stringify(out.log, null, 0));
  await page.screenshot({ path: `${OUT}/whole-end.png` });
}

if (MODE === 'faintfilm') {
  // Rig both actives low so a faint happens on the next turn, then film it.
  const SEED = process.argv[3] || 'FEEL3-A';
  await page.evaluate(INSTALL);
  await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
  await waitPrompt(); await sleep(1200);
  await page.evaluate(() => {
    const A = window.__ARENA, raw = A.battle.raw ? A.battle.raw() : null;
    if (!raw) return 'no-raw';
    const s = raw.sides[1], m = s.party[s.activeIndex];
    m.hp = Math.max(1, Math.round(m.maxHp * 0.05));
    return 'ok';
  });
  const meta = [];
  const grab = async (name) => {
    await page.screenshot({ path: `${OUT}/${name}.png` });
    const s = await peek(); meta.push({ name, ...s });
    console.log(name.padEnd(10), `gt=${String(s.gt).padStart(7)} shot=${String(s.shot).padEnd(10)} bl=${s.blend} vfx=${s.vfx} sh=${s.shake} fl=${s.flash} hp=[${s.hp.join(' | ')}] ${JSON.stringify(s.txt).slice(0, 46)}`);
  };
  await grab('x-00-before');
  await playTurn(2);
  for (let i = 0; i < 80; i++) {
    await grab(`x-${String(i + 1).padStart(2, '0')}`);
    const s = await page.evaluate(() => {
      const A = window.__ARENA, T = A.app.textbox;
      return { wfi: !!T.waitingForInput, txt: T.$txt?.textContent || '', wait: A.battle.waitingFor(), rid: A.router.currentId };
    });
    if (s.rid !== 'battle') break;
    if (s.wfi && (s.txt.startsWith('What will') || i > 3)) await page.keyboard.press('Space');
    if (/sent out|Go!|Choose/i.test(s.txt) && i > 20) break;
    await sleep(90);
  }
  await page.evaluate(() => { window.__RECON = false; });
  const out = await page.evaluate(() => ({ rec: window.__REC, marks: window.__MARKS, log: window.__ARENA.battle.log() }));
  await writeFile(`${OUT}/faintfilm.json`, JSON.stringify({ meta, ...out }));
  console.log('log tail:', JSON.stringify(out.log.slice(-14)));
}

if (MODE === 'textpace') {
  // Commit a move, then touch NOTHING. Do messages advance on their own? How long is each held?
  const SEED = process.argv[3] || 'FEEL3-A';
  await page.evaluate(INSTALL);
  await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
  await waitPrompt(); await sleep(800);
  await mark({ ev: 'prompt' });
  console.log('playTurn:', await playTurn(2));
  await mark({ ev: 'committed' });
  const seen = [];
  let last = null, lastGt = null;
  for (let i = 0; i < 700; i++) {
    const s = await page.evaluate(() => {
      const A = window.__ARENA, T = A.app.textbox;
      return { gt: +A.stage.time.toFixed(3), txt: T.$txt?.textContent || '', full: T.current ? (T.current.text || '') : '', chars: T.charIdx, wfi: !!T.waitingForInput, tq: T.queue.length, wait: A.battle.waitingFor(), rid: A.router.currentId, q: A.app.view.queue.length };
    });
    if (s.rid !== 'battle') break;
    if (s.txt !== last) {
      if (last !== null) seen.push({ txt: last, from: lastGt, to: s.gt, held: +(s.gt - lastGt).toFixed(2) });
      last = s.txt; lastGt = s.gt;
    }
    if (s.wait === 0 && i > 20) { seen.push({ txt: last, from: lastGt, to: s.gt, held: +(s.gt - lastGt).toFixed(2), note: 'back-at-prompt' }); break; }
    await sleep(100);
  }
  console.log('--- text states, no input at all (game seconds) ---');
  for (const s of seen) console.log(`  held ${String(s.held).padStart(6)}s  ${JSON.stringify(s.txt).slice(0, 78)} ${s.note || ''}`);
  const tot = seen.length ? seen[seen.length - 1].to - seen[0].from : 0;
  console.log(`total from commit to next prompt: ${tot.toFixed(2)}s game time (no player input)`);
  await page.evaluate(() => { window.__RECON = false; });
  await writeFile(`${OUT}/textpace.json`, JSON.stringify({ seen, rec: await page.evaluate(() => window.__REC), marks: await page.evaluate(() => window.__MARKS), log: await page.evaluate(() => window.__ARENA.battle.log()) }));
}

if (MODE === 'stillprompt') {
  // Sit at the command prompt and do nothing. Is the resting shot stable and readable?
  const SEED = process.argv[3] || 'FEEL3-A';
  await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
  await waitPrompt();
  for (let i = 0; i < 14; i++) {
    const s = await page.evaluate(() => {
      const A = window.__ARENA, THREE = A.debug.THREE, cam = A.stage.camera;
      const proj = A.app.view.actors.map((a) => {
        if (!a) return null;
        const box = new THREE.Box3().setFromObject(a.root);
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        for (let k = 0; k < 8; k++) {
          const v = new THREE.Vector3(k & 1 ? box.max.x : box.min.x, k & 2 ? box.max.y : box.min.y, k & 4 ? box.max.z : box.min.z).project(cam);
          x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
        }
        return { w: +((x1 - x0) * 50).toFixed(1), cx: +(((x0 + x1) / 2) * 50 + 50).toFixed(0), cy: +((1 - (y0 + y1) / 2) * 50).toFixed(0) };
      });
      return { gt: +A.stage.time.toFixed(2), shot: A.app.dir.shot?.id, blend: +(A.app.dir.blend ?? 1).toFixed(2), cam: [+cam.position.x.toFixed(2), +cam.position.y.toFixed(2), +cam.position.z.toFixed(2)], fov: +cam.fov.toFixed(2), proj };
    });
    await page.screenshot({ path: `${OUT}/sp-${String(i).padStart(2, '0')}.png` });
    console.log(`sp-${String(i).padStart(2, '0')} gt=${String(s.gt).padStart(6)} shot=${s.shot} bl=${s.blend} cam=${JSON.stringify(s.cam)} fov=${s.fov} p0=${JSON.stringify(s.proj[0])} p1=${JSON.stringify(s.proj[1])}`);
    await sleep(700);
  }
}

if (MODE === 'hires') {
  // A few resting compositions at full quality / larger viewport for pixel judgement.
  const SEED = process.argv[3] || 'FEEL3-A';
  await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
  await waitPrompt();
  for (let i = 0; i < 300; i++) { if (await page.evaluate(() => (window.__ARENA.app.dir.blend ?? 1) >= 1 && window.__ARENA.app.view.queue.length === 0)) break; await sleep(200); }
  await sleep(2500);
  await page.screenshot({ path: `${OUT}/hq-prompt.png` });
  console.log(JSON.stringify(await peek()));
  await page.click('.cmdbtn.fight'); await sleep(1200);
  await page.screenshot({ path: `${OUT}/hq-moves.png` });
  const cards = await page.$$('.movegrid .movecard');
  await cards[2].click();
  for (let i = 0; i < 40; i++) {
    const s = await peek();
    if (s.vfx > 0 || s.flash > 0.05 || s.shake > 0.02) { await page.screenshot({ path: `${OUT}/hq-impact-${i}.png` }); console.log('impact frame', i, JSON.stringify(s).slice(0, 240)); break; }
    await sleep(120);
  }
  await sleep(900);
  await page.screenshot({ path: `${OUT}/hq-after.png` });
}

console.log('errors:', errors.length ? errors : 'none');
await browser.close();
