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

// ---------------------------------------------------------------- recorder --
const INSTALL = () => {
  const A = window.__ARENA;
  const S = [];
  window.__REC = S;
  window.__RECON = true;
  const v3 = (p) => [+p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3)];
  const tick = () => {
    if (window.__RECON) requestAnimationFrame(tick);
    try {
      const V = A.app.view, D = A.app.dir, T = A.app.textbox, F = A.stage.feel;
      S.push({
        gt: +A.stage.time.toFixed(4),
        w: +performance.now().toFixed(1),
        fps: A.perf.fps,
        shot: D.shot?.id ?? null,
        subj: D.shot?.subject ?? null,
        blend: +(D.blend ?? 1).toFixed(3),
        cam: v3(A.stage.camera.position),
        fov: +A.stage.camera.fov.toFixed(2),
        txt: T.$txt ? T.$txt.textContent : '',
        chars: T.charIdx,
        full: T.current ? (T.current.text || '').length : 0,
        tq: T.queue.length,
        wfi: !!T.waitingForInput,
        boxOn: T.el ? (getComputedStyle(T.el).opacity + '/' + (T.el.className || '')) : '',
        hp: A.app.plates.map((p) => [p.hp, p.maxHp, +p.hpSpring.value.toFixed(4), +p.hpSpring.target.toFixed(4), +p.ghost.toFixed(4)]),
        shake: +F.shake.amp.toFixed(4),
        flash: +F.flash.a.toFixed(4),
        hits: F.hitstopMs,
        zoom: +F.zoomPunch.toFixed(4),
        chroma: +F.chroma.toFixed(4),
        vfx: V.vfx.active.length,
        gate: +V.gate.toFixed(3),
        q: V.queue.length,
        turn: V.state?.turn ?? -1,
        act: V.actors.map((a) => (a ? [v3(a.root.position), +a.root.scale.y.toFixed(3), +(a.root.rotation.y).toFixed(3)] : null)),
        wait: A.battle.waitingFor?.() ?? null,
        anim: A.battle.isAnimating?.() ?? null
      });
    } catch (e) { S.push({ err: String(e.message) }); }
  };
  requestAnimationFrame(tick);
};

if (MODE === 'record') {
  const SEED = process.argv[3] || 'FEEL-9';
  await page.evaluate(INSTALL);
  const t0 = Date.now();
  await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
  // drive until someone faints, choosing greedily for both sides handled by AI for side 1
  let guard = 0;
  const marks = [];
  while (guard++ < 400) {
    const st = await page.evaluate(() => {
      const A = window.__ARENA;
      return {
        gt: A.stage.time, wait: A.battle.waitingFor(), rid: A.router.currentId,
        anyFaint: (A.app.view.state?.sides || []).some((s) => s.party.some((p) => p.fainted)),
        fps: A.perf.fps
      };
    });
    if (st.rid !== 'battle') { marks.push({ ev: 'left-battle', gt: st.gt }); break; }
    if (st.anyFaint) { marks.push({ ev: 'faint-seen', gt: st.gt }); break; }
    if (st.wait === 0) {
      const info = await page.evaluate(() => {
        const A = window.__ARENA, s = A.battle.screen();
        const side = s.battle.sides[0];
        let c;
        if (s.forcedSwitch) {
          const i = side.party.findIndex((p, i2) => !p.fainted && i2 !== side.activeIndex);
          c = { kind: 'switch', toSlot: i < 0 ? 0 : i };
        } else {
          c = A.sim.chooseAction(s.battle, 0, 'ace');
        }
        A.battle.choose(0, c);
        return { gt: A.stage.time, choice: JSON.stringify(c) };
      });
      marks.push({ ev: 'choice', ...info });
    }
    await sleep(200);
  }
  // let the faint play out
  await sleep(25000);
  await page.evaluate(() => { window.__RECON = false; });
  const rec = await page.evaluate(() => window.__REC);
  const log = await page.evaluate(() => window.__ARENA.battle.log());
  await writeFile(`${OUT}/rec-${SEED}.json`, JSON.stringify({ marks, wallMs: Date.now() - t0, log, rec }));
  console.log(`samples=${rec.length} wall=${((Date.now() - t0) / 1000).toFixed(1)}s gt=${rec[rec.length - 1]?.gt} marks=${marks.length}`);
  console.log('log:', JSON.stringify(log));
}

const peek = () => page.evaluate(() => {
  const A = window.__ARENA, V = A.app.view, D = A.app.dir, T = A.app.textbox, F = A.stage.feel;
  return {
    gt: +A.stage.time.toFixed(2), fps: A.perf.fps, shot: D.shot?.id ?? null, blend: +(D.blend ?? 1).toFixed(2),
    txt: T.$txt ? T.$txt.textContent : '', wfi: !!T.waitingForInput, tq: T.queue.length,
    hp: A.app.plates.map((p) => `${p.hp}/${p.maxHp} bar=${p.hpSpring.value.toFixed(2)}→${p.hpSpring.target.toFixed(2)} gh=${p.ghost.toFixed(2)}`),
    shake: +F.shake.amp.toFixed(3), flash: +F.flash.a.toFixed(3), vfx: V.vfx.active.length,
    gate: +V.gate.toFixed(2), q: V.queue.length, wait: A.battle.waitingFor(), turn: V.state?.turn
  };
});

if (MODE === 'shots') {
  const SEED = process.argv[3] || 'FEEL-9';
  const meta = [];
  const grab = async (name) => {
    await page.screenshot({ path: `${OUT}/${name}.png` });
    const s = await peek();
    meta.push({ name, ...s });
    console.log(name.padEnd(24), `gt=${String(s.gt).padStart(6)} shot=${String(s.shot).padEnd(10)} bl=${s.blend} wait=${s.wait} q=${s.q} gate=${s.gate} vfx=${s.vfx} shake=${s.shake} flash=${s.flash} hp=${s.hp.join(' | ')} txt=${JSON.stringify(s.txt).slice(0, 70)}`);
  };
  await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
  for (let i = 0; i < 14; i++) { await grab(`a-intro-${String(i).padStart(2, '0')}`); await sleep(400); }
  // wait for command prompt
  for (let i = 0; i < 200; i++) { if ((await page.evaluate(() => window.__ARENA.battle.waitingFor())) === 0) break; await sleep(300); }
  await grab('b-at-prompt');
  for (let i = 0; i < 200; i++) {
    const ok = await page.evaluate(() => {
      const A = window.__ARENA;
      return (A.app.dir.blend ?? 1) >= 1 && A.app.view.queue.length === 0 && A.app.view.gate <= 0;
    });
    if (ok) break;
    await sleep(300);
  }
  await sleep(1500);
  await grab('c-settled');
  // one full turn, dense burst
  await page.evaluate(() => {
    const A = window.__ARENA, s = A.battle.screen();
    A.battle.choose(0, A.sim.chooseAction(s.battle, 0, 'ace'));
  });
  for (let i = 0; i < 60; i++) {
    await grab(`d-turn-${String(i).padStart(2, '0')}`);
    const w = await page.evaluate(() => window.__ARENA.battle.waitingFor());
    if (w === 0 && i > 8) break;
    await sleep(120);
  }
  await writeFile(`${OUT}/shots-meta.json`, JSON.stringify(meta, null, 2));
}

if (MODE === 'faint') {
  const SEED = process.argv[3] || 'FEEL-9';
  const meta = [];
  const grab = async (name) => {
    await page.screenshot({ path: `${OUT}/${name}.png` });
    const s = await peek();
    meta.push({ name, ...s });
    console.log(name.padEnd(22), `gt=${String(s.gt).padStart(6)} shot=${String(s.shot).padEnd(10)} wait=${s.wait} q=${s.q} vfx=${s.vfx} hp=${s.hp.join(' | ')} txt=${JSON.stringify(s.txt).slice(0, 60)}`);
  };
  // rig a battle where the foe is nearly dead so a faint happens on turn 1
  await page.evaluate((s) => window.__ARENA.battle.quick(s), SEED);
  for (let i = 0; i < 200; i++) { if ((await page.evaluate(() => window.__ARENA.battle.waitingFor())) === 0) break; await sleep(300); }
  await page.evaluate(() => {
    const A = window.__ARENA, raw = A.battle.raw();
    for (const s of raw.sides) { const m = s.party[s.activeIndex]; m.hp = Math.max(1, Math.round(m.maxHp * 0.04)); }
  });
  await page.evaluate(() => {
    const A = window.__ARENA, s = A.battle.screen();
    A.battle.choose(0, A.sim.chooseAction(s.battle, 0, 'ace'));
  });
  for (let i = 0; i < 90; i++) {
    await grab(`f-${String(i).padStart(2, '0')}`);
    const done = await page.evaluate(() => window.__ARENA.router.currentId !== 'battle');
    if (done) break;
    await sleep(150);
  }
  await writeFile(`${OUT}/faint-meta.json`, JSON.stringify(meta, null, 2));
}

const domTree = () => page.evaluate(() => {
  const walk = (el, d = 0) => {
    if (d > 6) return '';
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return '';
    const kids = [...el.children];
    const own = kids.length === 0 ? (el.textContent || '').trim().slice(0, 60) : '';
    let line = '  '.repeat(d) + `<${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}> op=${cs.opacity} ${own ? JSON.stringify(own) : ''}\n`;
    for (const k of kids) line += walk(k, d + 1);
    return line;
  };
  return walk(document.querySelector('#ui'));
});

// play the battle through the actual UI, like a player
async function playTurn(moveIdx, { shots = null, tag = '' } = {}) {
  const clicked = await page.evaluate(() => !!document.querySelector('.cmdbtn.fight'));
  if (!clicked) return 'no-menu';
  await page.click('.cmdbtn.fight');
  await sleep(500);
  const cards = await page.$$('.movegrid .movecard');
  if (!cards.length) return 'no-moves';
  await cards[Math.min(moveIdx, cards.length - 1)].click();
  return 'ok';
}

if (MODE === 'autoadv') {
  // Does a *battle message* (not the command prompt) ever advance on its own?
  await page.evaluate(INSTALL);
  await page.evaluate(() => window.__ARENA.battle.quick('FEEL-9'));
  for (let i = 0; i < 300; i++) { if ((await page.evaluate(() => window.__ARENA.battle.waitingFor())) === 0) break; await sleep(300); }
  await sleep(2000);
  await playTurn(2);
  // exactly one advance, to clear the stale command prompt
  for (let i = 0; i < 200; i++) {
    const s = await page.evaluate(() => ({ t: window.__ARENA.app.textbox.$txt.textContent, wfi: window.__ARENA.app.textbox.waitingForInput }));
    if (s.wfi && s.t.startsWith('What will')) { await page.keyboard.press('Space'); break; }
    await sleep(150);
  }
  const start = await page.evaluate(() => window.__ARENA.stage.time);
  console.log('cleared prompt at gt', start.toFixed(2));
  let firstMsgAt = null;
  for (let i = 0; i < 400; i++) {
    const s = await page.evaluate(() => ({ gt: window.__ARENA.stage.time, t: window.__ARENA.app.textbox.$txt.textContent, wfi: window.__ARENA.app.textbox.waitingForInput, q: window.__ARENA.app.view.queue.length }));
    if (s.wfi && firstMsgAt === null) { firstMsgAt = s.gt; console.log(`  message waiting at gt=${s.gt.toFixed(2)}: ${JSON.stringify(s.t)}`); }
    if (firstMsgAt !== null && s.gt - firstMsgAt > 20) { console.log(`  after ${(s.gt - firstMsgAt).toFixed(1)}s of game time the box still reads ${JSON.stringify(s.t)} (wfi=${s.wfi}, beats left=${s.q})`); break; }
    await sleep(150);
  }
  await page.screenshot({ path: `${OUT}/autoadv-stuck.png` });
  // now try mouse click instead of a key
  await page.mouse.click(500, 320);
  await sleep(1200);
  const after = await page.evaluate(() => ({ t: window.__ARENA.app.textbox.$txt.textContent, wfi: window.__ARENA.app.textbox.waitingForInput }));
  console.log('  after a mouse click on the arena:', JSON.stringify(after));
}

// clear the command prompt that stays on screen after a choice is committed
async function clearStalePrompt() {
  for (let i = 0; i < 120; i++) {
    const s = await page.evaluate(() => ({ t: window.__ARENA.app.textbox.$txt.textContent, wfi: window.__ARENA.app.textbox.waitingForInput }));
    if (s.wfi && s.t.startsWith('What will')) { await page.keyboard.press('Space'); return true; }
    if (!s.t.startsWith('What will')) return false;
    await sleep(120);
  }
  return false;
}

if (MODE === 'stale') {
  await page.evaluate(() => window.__ARENA.battle.quick('FEEL-9'));
  for (let i = 0; i < 300; i++) { if ((await page.evaluate(() => window.__ARENA.battle.waitingFor())) === 0) break; await sleep(250); }
  await sleep(1500);
  const snap = async (l) => {
    const s = await page.evaluate(() => ({
      gt: +window.__ARENA.stage.time.toFixed(2), txt: window.__ARENA.app.textbox.$txt.textContent,
      cls: window.__ARENA.app.textbox.el.className, wfi: window.__ARENA.app.textbox.waitingForInput,
      beats: window.__ARENA.app.view.queue.length, queuedMsgs: window.__ARENA.app.textbox.queue.length,
      hp0: window.__ARENA.app.plates[0].hp, menu: !!document.querySelector('.cmdbtn.fight')
    }));
    console.log(l.padEnd(34), JSON.stringify(s));
  };
  await snap('at prompt');
  await page.click('.cmdbtn.fight'); await sleep(500);
  const cards = await page.$$('.movegrid .movecard');
  await cards[2].click();
  await sleep(1200); await snap('1.2s wall after committing');
  await sleep(6000); await snap('7s wall after committing');
  await page.screenshot({ path: `${OUT}/s-stale-after-commit.png` });
  await sleep(15000); await snap('22s wall after committing');
  await page.screenshot({ path: `${OUT}/s-stale-22s.png` });
  await page.click('.textbox'); await sleep(1500); await snap('after clicking the textbox');
  await page.keyboard.press('Enter'); await sleep(1500); await snap('after pressing Enter');
  await page.keyboard.press('Space'); await sleep(1500); await snap('after pressing Space');
  await sleep(4000); await snap('4s later');
}

if (MODE === 'zoom') {
  await page.evaluate(() => window.__ARENA.battle.quick('FEEL-9'));
  for (let i = 0; i < 300; i++) { if ((await page.evaluate(() => window.__ARENA.battle.waitingFor())) === 0) break; await sleep(250); }
  for (let i = 0; i < 300; i++) { if (await page.evaluate(() => (window.__ARENA.app.dir.blend ?? 1) >= 1)) break; await sleep(250); }
  await sleep(2000);
  const boxes = await page.evaluate(() => {
    const A = window.__ARENA, THREE = A.debug.THREE, cam = A.stage.camera;
    return A.app.view.actors.map((a) => {
      const box = new THREE.Box3().setFromObject(a.root);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (let i = 0; i < 8; i++) {
        const v = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(cam);
        x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
      }
      const W = innerWidth, H = innerHeight;
      const px = (x) => (x + 1) / 2 * W, py = (y) => (1 - y) / 2 * H;
      return { x: Math.max(0, px(x0) - 40), y: Math.max(0, py(y1) - 40), width: Math.min(W, px(x1) - px(x0) + 80), height: Math.min(H, py(y0) - py(y1) + 90) };
    });
  });
  for (let i = 0; i < boxes.length; i++) {
    await page.screenshot({ path: `${OUT}/z-p${i}.png`, clip: boxes[i] });
    console.log(`z-p${i}`, JSON.stringify(boxes[i]));
  }
}

if (MODE === 'audio') {
  const shape = await page.evaluate(() => {
    const a = window.__ARENA.app.audio;
    const keys = [];
    let o = a;
    while (o && o !== Object.prototype) { keys.push(...Object.getOwnPropertyNames(o)); o = Object.getPrototypeOf(o); }
    return { keys: [...new Set(keys)], ctxState: a.ctx?.state ?? null, muted: a.muted ?? null };
  });
  console.log('audio surface:', JSON.stringify(shape));
  await page.evaluate(() => {
    const a = window.__ARENA.app.audio;
    window.__SND = [];
    for (const k of ['sfx', 'play', 'cue', 'note', 'hit', 'music', 'playMusic', 'stopMusic', 'beep', 'blip', 'tone', 'ping']) {
      if (typeof a[k] === 'function') {
        const orig = a[k].bind(a);
        a[k] = (...args) => { window.__SND.push({ fn: k, args: args.map((x) => (typeof x === 'object' ? '{obj}' : x)), gt: +window.__ARENA.stage.time.toFixed(2) }); return orig(...args); };
      }
    }
  });
  await page.evaluate(() => window.__ARENA.battle.quick('FEEL-9'));
  for (let i = 0; i < 300; i++) { if ((await page.evaluate(() => window.__ARENA.battle.waitingFor())) === 0) break; await sleep(250); }
  await sleep(1000);
  await playTurn(2); await clearStalePrompt();
  for (let i = 0; i < 300; i++) { if ((await page.evaluate(() => window.__ARENA.battle.waitingFor())) === 0) break; await sleep(250); }
  const snd = await page.evaluate(() => window.__SND);
  console.log(`sound calls during battle-start + one turn: ${snd.length}`);
  snd.slice(0, 40).forEach((s) => console.log(`   gt=${s.gt} ${s.fn}(${s.args.join(',')})`));
}

if (MODE === 'rest3') {
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
      out.push(any ? { w: +((x1 - x0) * 50).toFixed(1), h: +((y1 - y0) * 50).toFixed(1), cx: +(((x0 + x1) / 2) * 50 + 50).toFixed(0), on: x1 > -1 && x0 < 1 && y1 > -1 && y0 < 1 } : null);
    }
    const overflow = [...document.querySelectorAll('#ui *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 120 && r.right > innerWidth + 2; }).map((e) => `${(e.className || '').toString().split(/\s+/)[0]}+${Math.round(e.getBoundingClientRect().right - innerWidth)}px`);
    return { actors: out, blend: +(A.app.dir.blend ?? 1).toFixed(2), shot: A.app.dir.shot?.id, overflow: [...new Set(overflow)] };
  });
  await page.evaluate(() => window.__ARENA.battle.quick('FEEL-9'));
  for (let turn = 0; turn < 3; turn++) {
    for (let i = 0; i < 300; i++) { if ((await page.evaluate(() => window.__ARENA.battle.waitingFor())) === 0) break; await sleep(250); }
    const a = await measure();
    await page.screenshot({ path: `${OUT}/r${turn}-a-prompt.png` });
    for (let i = 0; i < 300; i++) { if (await page.evaluate(() => (window.__ARENA.app.dir.blend ?? 1) >= 1)) break; await sleep(250); }
    await sleep(1200);
    const b = await measure();
    await page.screenshot({ path: `${OUT}/r${turn}-b-settled.png` });
    const f = (m) => m.actors.map((x, i) => (x ? `p${i} ${x.w}x${x.h}% @x${x.cx}${x.on ? '' : ' OFFSCREEN'}` : `p${i} —`)).join('  ');
    console.log(`turn ${turn}`);
    console.log(`  prompt : shot=${a.shot} blend=${a.blend}  ${f(a)}  overflow=${JSON.stringify(a.overflow)}`);
    console.log(`  settled: shot=${b.shot} blend=${b.blend}  ${f(b)}  overflow=${JSON.stringify(b.overflow)}`);
    await page.evaluate(() => { const A = window.__ARENA, s = A.battle.screen(); A.battle.choose(0, A.sim.chooseAction(s.battle, 0, 'ace')); });
    await sleep(600);
    await clearStalePrompt();
  }
}

if (MODE === 'tip3') {
  await page.evaluate(() => window.__ARENA.battle.quick('FEEL-9'));
  for (let i = 0; i < 300; i++) { if ((await page.evaluate(() => window.__ARENA.battle.waitingFor())) === 0) break; await sleep(250); }
  await sleep(1200);
  await page.click('.cmdbtn.fight'); await sleep(600);
  const cards = await page.$$('.movegrid .movecard');
  await cards[2].click();           // move + click with no dwell, exactly like a fast player
  for (let i = 0; i < 26; i++) {
    const s = await page.evaluate(() => {
      const e = document.querySelector('.mvsheet');
      const r = e && e.getBoundingClientRect();
      return { gt: +window.__ARENA.stage.time.toFixed(2), sheet: !!e, rect: r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height), Math.round(r.right - innerWidth)] : null, txt: window.__ARENA.app.textbox.$txt.textContent.slice(0, 30) };
    });
    console.log(`  gt=${String(s.gt).padStart(6)} mvsheet=${s.sheet ? JSON.stringify(s.rect) : 'no'}  ${JSON.stringify(s.txt)}`);
    if (i === 8) await page.screenshot({ path: `${OUT}/tip3-midaction.png` });
    await sleep(400);
  }
}

if (MODE === 'tip2') {
  await page.evaluate(() => window.__ARENA.battle.quick('FEEL-9'));
  for (let i = 0; i < 300; i++) { if ((await page.evaluate(() => window.__ARENA.battle.waitingFor())) === 0) break; await sleep(250); }
  await sleep(1200);
  await page.click('.cmdbtn.fight'); await sleep(600);
  const cards = await page.$$('.movegrid .movecard');
  const box = await cards[2].boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await sleep(1800);
  await page.screenshot({ path: `${OUT}/tip2-hovering.png` });
  const overlays = () => page.evaluate(() => [...document.querySelectorAll('#ui *')]
    .filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 250 && r.height > 80 && cs.opacity !== '0' && cs.display !== 'none'; })
    .map((e) => `${e.tagName.toLowerCase()}.${(e.className || '').toString().trim().split(/\s+/).join('.')} @${Math.round(e.getBoundingClientRect().x)},${Math.round(e.getBoundingClientRect().y)} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)} offRight=${Math.round(e.getBoundingClientRect().right - innerWidth)}`));
  console.log('while hovering:'); (await overlays()).forEach((l) => console.log('   ', l));
  await page.mouse.down(); await page.mouse.up();
  await sleep(1500);
  await page.screenshot({ path: `${OUT}/tip2-after-click.png` });
  console.log('during resolution:'); (await overlays()).forEach((l) => console.log('   ', l));
  await sleep(4000);
  await page.screenshot({ path: `${OUT}/tip2-late.png` });
  console.log('later:'); (await overlays()).forEach((l) => console.log('   ', l));
  await page.mouse.move(10, 10); await sleep(1500);
  console.log('after mouse away:'); (await overlays()).forEach((l) => console.log('   ', l));
  await page.screenshot({ path: `${OUT}/tip2-mouseaway.png` });
}

if (MODE === 'tip') {
  await page.evaluate(() => window.__ARENA.battle.quick('FEEL-9'));
  for (let i = 0; i < 300; i++) { if ((await page.evaluate(() => window.__ARENA.battle.waitingFor())) === 0) break; await sleep(250); }
  await sleep(1200);
  const probe = async (label) => {
    const s = await page.evaluate(() => {
      const el = document.querySelector('.mvinfo');
      if (!el) return { present: false };
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      const np = document.querySelector('.nameplate.p0')?.getBoundingClientRect();
      const overlap = np ? !(r.right < np.left || r.left > np.right || r.bottom < np.top || r.top > np.bottom) : null;
      return { present: true, op: cs.opacity, vis: cs.visibility, rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], offRight: Math.round(r.right - window.innerWidth), coversPlayerPlate: overlap };
    });
    console.log(label.padEnd(28), JSON.stringify(s));
  };
  await probe('at prompt');
  await page.click('.cmdbtn.fight'); await sleep(600);
  await probe('move menu open');
  const cards = await page.$$('.movegrid .movecard');
  await cards[2].click(); await sleep(900);
  await probe('just after clicking move');
  await sleep(2500);
  await probe('2.5s into resolution');
  await page.mouse.move(10, 10); await sleep(900);
  await probe('after moving mouse away');
  await page.screenshot({ path: `${OUT}/tip-after-mouse-away.png` });
  await sleep(4000);
  await probe('later in resolution');
}

if (MODE === 'entry') {
  // Does the *normal* way into a battle (not battle.quick) have an opening sequence?
  await page.evaluate(() => window.__ARENA.router.go('single'));
  await sleep(1500);
  await writeFile(`${OUT}/dom-single.txt`, await domTree());
  await page.screenshot({ path: `${OUT}/e-00-single.png` });
  const btns = await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.textContent.trim().slice(0, 30)));
  console.log('buttons on single screen:', JSON.stringify(btns));
  const target = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /battle|start|fight|go/i.test(x.textContent));
    if (b) { b.click(); return b.textContent.trim(); } return null;
  });
  console.log('clicked:', target);
  for (let i = 0; i < 30; i++) {
    await page.screenshot({ path: `${OUT}/e-${String(i + 1).padStart(2, '0')}.png` });
    const s = await peek();
    console.log(`e-${String(i + 1).padStart(2, '0')}`.padEnd(8), `screen=${await page.evaluate(() => window.__ARENA.router.currentId)} gt=${s.gt} shot=${s.shot} wait=${s.wait} txt=${JSON.stringify(s.txt).slice(0, 50)}`);
    if (s.wait === 0) break;
    await sleep(350);
  }
  console.log('log:', JSON.stringify(await page.evaluate(() => window.__ARENA.battle.log())));
}

if (MODE === 'faintfilm') {
  const meta = [];
  const grab = async (name) => {
    await page.screenshot({ path: `${OUT}/${name}.png` });
    const s = await peek();
    meta.push({ name, ...s });
    console.log(name.padEnd(12), `gt=${String(s.gt).padStart(6)} shot=${String(s.shot).padEnd(9)} bl=${s.blend} vfx=${s.vfx} hp=[${s.hp.join(' | ')}] ${JSON.stringify(s.txt).slice(0, 44)}`);
  };
  await page.evaluate(() => window.__ARENA.battle.quick('FEEL-9'));
  for (let i = 0; i < 300; i++) { if ((await page.evaluate(() => window.__ARENA.battle.waitingFor())) === 0) break; await sleep(250); }
  await sleep(1200);
  await playTurn(2); await clearStalePrompt();
  for (let i = 0; i < 300; i++) { if ((await page.evaluate(() => window.__ARENA.battle.waitingFor())) === 0) break; await sleep(250); }
  await sleep(1200);
  console.log('--- turn 2 (Franky faints) ---');
  await playTurn(2); await clearStalePrompt();
  for (let i = 0; i < 80; i++) {
    await grab(`k-${String(i).padStart(2, '0')}`);
    const s = await page.evaluate(() => ({ t: window.__ARENA.app.textbox.$txt.textContent, wait: window.__ARENA.battle.waitingFor() }));
    if (s.t.startsWith('Choose your next') && i > 30) break;
    await sleep(80);
  }
  await writeFile(`${OUT}/faintfilm-meta.json`, JSON.stringify(meta, null, 2));
  console.log('--- forced-switch UI ---');
  await writeFile(`${OUT}/dom-forcedswitch.txt`, await domTree());
  await page.screenshot({ path: `${OUT}/k-forcedswitch.png` });
}

if (MODE === 'full') {
  await page.evaluate(INSTALL);
  await page.evaluate(() => { window.__MARKS = []; });
  const mark = (m) => page.evaluate((mm) => window.__MARKS.push({ ...mm, gt: +window.__ARENA.stage.time.toFixed(2) }), m);
  const t0 = Date.now();
  await page.evaluate((s) => window.__ARENA.battle.quick(s), process.argv[3] || 'FEEL-9');
  let turns = 0;
  outer: for (let t = 0; t < 14; t++) {
    for (let i = 0; i < 500; i++) {
      const s = await page.evaluate(() => {
        const A = window.__ARENA;
        return { wait: A.battle.waitingFor(), rid: A.router.currentId, gt: A.stage.time, fs: !!A.battle.screen()?.forcedSwitch };
      });
      if (s.rid !== 'battle') { await mark({ ev: 'battle-over' }); break outer; }
      if (s.wait === 0) break;
      await sleep(150);
      if (i === 499) { await mark({ ev: 'STALL' }); break outer; }
    }
    const fs = await page.evaluate(() => !!window.__ARENA.battle.screen()?.forcedSwitch);
    await mark({ ev: 'prompt', turn: t, forcedSwitch: fs });
    if (fs) {
      await page.click('.cmdbtn.party').catch(() => {});
      await sleep(600);
      const btns = await page.$$('.partygrid .partycard, .partycard, .switchcard');
      if (btns.length) await btns[0].click();
      else { await page.evaluate(() => { const A = window.__ARENA, s = A.battle.screen(), side = s.battle.sides[0]; const i = side.party.findIndex((p, j) => !p.fainted && j !== side.activeIndex); A.battle.choose(0, { kind: 'switch', toSlot: i < 0 ? 0 : i }); }); }
    } else {
      await sleep(900);
      const r = await playTurn(Number(process.argv[4] ?? 2));
      if (r !== 'ok') { await mark({ ev: 'nomenu:' + r }); break; }
    }
    await mark({ ev: 'committed', turn: t });
    const cleared = await clearStalePrompt();
    await mark({ ev: 'prompt-cleared', manual: cleared });
    turns++;
  }
  await sleep(6000);
  await page.evaluate(() => { window.__RECON = false; });
  const out = await page.evaluate(() => ({ rec: window.__REC, marks: window.__MARKS, log: window.__ARENA.battle.log(), ended: window.__ARENA.router.currentId }));
  await writeFile(`${OUT}/full.json`, JSON.stringify(out));
  console.log(`turns=${turns} samples=${out.rec.length} wall=${((Date.now() - t0) / 1000).toFixed(1)}s screen=${out.ended}`);
  console.log('marks:', JSON.stringify(out.marks));
  console.log('log:', JSON.stringify(out.log, null, 0));
}

if (MODE === 'film') {
  const meta = [];
  await page.evaluate(INSTALL);
  const grab = async (name) => {
    await page.screenshot({ path: `${OUT}/${name}.png` });
    const s = await peek();
    meta.push({ name, ...s });
    console.log(name.padEnd(20), `gt=${String(s.gt).padStart(6)} shot=${String(s.shot).padEnd(9)} bl=${s.blend} wait=${s.wait} q=${s.q} vfx=${s.vfx} sh=${s.shake} fl=${s.flash} hp=[${s.hp.join(' | ')}] ${JSON.stringify(s.txt).slice(0, 46)}`);
  };
  await page.evaluate(() => window.__ARENA.battle.quick('FEEL-9'));
  for (let i = 0; i < 16; i++) { await grab(`a-intro-${String(i).padStart(2, '0')}`); await sleep(250); }
  for (let i = 0; i < 300; i++) { if ((await page.evaluate(() => window.__ARENA.battle.waitingFor())) === 0) break; await sleep(250); }
  await grab('b-prompt-raised');
  for (let i = 0; i < 300; i++) {
    const ok = await page.evaluate(() => (window.__ARENA.app.dir.blend ?? 1) >= 1 && window.__ARENA.app.view.queue.length === 0);
    if (ok) break; await sleep(250);
  }
  await sleep(1500);
  await grab('c-settled');
  await page.click('.cmdbtn.fight'); await sleep(700); await grab('c2-movemenu');
  const cards = await page.$$('.movegrid .movecard');
  await cards[2].click();
  for (let i = 0; i < 70; i++) {
    await grab(`d-${String(i).padStart(2, '0')}`);
    const s = await page.evaluate(() => ({ wfi: window.__ARENA.app.textbox.waitingForInput, wait: window.__ARENA.battle.waitingFor(), gt: window.__ARENA.stage.time }));
    if (s.wait === 0 && i > 6) break;
    if (s.wfi) await page.keyboard.press('Space');
    await sleep(90);
  }
  await writeFile(`${OUT}/film-meta.json`, JSON.stringify(meta, null, 2));
}

if (MODE === 'turn') {
  await page.evaluate(INSTALL);
  const t0 = Date.now();
  await page.evaluate(() => window.__ARENA.battle.quick('FEEL-9'));
  for (let i = 0; i < 300; i++) { if ((await page.evaluate(() => window.__ARENA.battle.waitingFor())) === 0) break; await sleep(300); }
  await sleep(2500);
  await page.evaluate(() => { window.__MARKS = []; });
  const mark = (m) => page.evaluate((mm) => window.__MARKS.push({ ...mm, gt: window.__ARENA.stage.time, w: performance.now() }), m);
  await mark({ ev: 'prompt-ready' });
  console.log('turn1 ->', await playTurn(2));
  await mark({ ev: 'move-clicked' });
  // now watch: never advance the text manually, see if it self-advances
  const NOADV = process.argv[3] === 'noadv';
  for (let i = 0; i < 500; i++) {
    const st = await page.evaluate(() => {
      const A = window.__ARENA, T = A.app.textbox;
      return { gt: A.stage.time, wait: A.battle.waitingFor(), wfi: !!T.waitingForInput, tq: T.queue.length, txt: T.$txt?.textContent, rid: A.router.currentId };
    });
    if (st.rid !== 'battle') break;
    if (st.wait === 0) { console.log(`  back at prompt gt=${st.gt.toFixed(2)}`); break; }
    if (st.wfi && !NOADV) {
      await mark({ ev: 'advance', txt: st.txt });
      await page.keyboard.press('Space');
    }
    await sleep(120);
  }
  await sleep(3000);
  await page.evaluate(() => { window.__RECON = false; });
  const out = await page.evaluate(() => ({ rec: window.__REC, marks: window.__MARKS, log: window.__ARENA.battle.log() }));
  await writeFile(`${OUT}/turn${NOADV ? '-noadv' : ''}.json`, JSON.stringify(out));
  console.log(`samples=${out.rec.length} wall=${((Date.now() - t0) / 1000).toFixed(1)}s log=${JSON.stringify(out.log)}`);
}

if (MODE === 'play') {
  await page.evaluate(INSTALL);
  await page.evaluate(() => window.__ARENA.battle.quick('FEEL-9'));
  for (let i = 0; i < 300; i++) { if ((await page.evaluate(() => window.__ARENA.battle.waitingFor())) === 0) break; await sleep(300); }
  await sleep(2000);
  console.log('--- prompt reached, clicking Fight ---');
  await page.click('.cmdbtn.fight');
  await sleep(1500);
  const t = await domTree();
  await writeFile(`${OUT}/dom-moves.txt`, t);
  console.log(t);
  await page.screenshot({ path: `${OUT}/dom-moves.png` });
}

if (MODE === 'dom') {
  await page.evaluate(() => window.__ARENA.battle.quick('FEEL-9'));
  for (let i = 0; i < 200; i++) { if ((await page.evaluate(() => window.__ARENA.battle.waitingFor())) === 0) break; await sleep(300); }
  await sleep(3000);
  const tree = await page.evaluate(() => {
    const walk = (el, d = 0) => {
      if (d > 6) return '';
      const cs = getComputedStyle(el);
      if (cs.display === 'none') return '';
      const kids = [...el.children];
      const own = kids.length === 0 ? (el.textContent || '').trim().slice(0, 60) : '';
      let line = '  '.repeat(d) + `<${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}> op=${cs.opacity} ${own ? JSON.stringify(own) : ''}\n`;
      for (const k of kids) line += walk(k, d + 1);
      return line;
    };
    return walk(document.body);
  });
  console.log(tree);
  await writeFile(`${OUT}/dom.txt`, tree);
  await page.screenshot({ path: `${OUT}/dom-prompt.png` });
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
