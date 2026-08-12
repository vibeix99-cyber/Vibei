// The presentation half, audited as maths rather than taste.
//
//   node tools/scenecheck.mjs [--stage all|lights|camera|models|hud|occlusion|onboarding]
//
// Four pieces had never been judged and all four are things you would normally
// have to *look* at: character models, arena lighting, HUD legibility, and what
// a first-time player meets on boot. A harness cannot have an opinion about
// whether something looks good, but it can catch the failures that are
// arithmetic — a light blown past white, a near plane slicing a fighter's face,
// white text on a bright sky with nothing behind it, or a new player dropped
// into a Yonko match with no save.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const PORT = Number(arg('port', 8891));
const STAGE = arg('stage', 'all');

const bad = [], good = [];
const note = (pass, label, detail) => (pass ? good : bad).push(`${label}${detail ? ' — ' + detail : ''}`);

const server = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((r) => server.stdout.on('data', (d) => String(d).includes('serving') && r()));
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });

async function fresh(viewport = { width: 1280, height: 800 }, clearStorage = false) {
  const page = await browser.newPage({ viewport });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  if (clearStorage) {
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload({ waitUntil: 'domcontentloaded' });
  }
  await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 30000 });
  await page.evaluate(() => window.__ARENA.ready);
  await page.evaluate(() => window.__ARENA.audio.setMuted(true));
  return { page, errs };
}

/**
 * What fraction of each fighter is hidden behind arena geometry, right now?
 *
 * The camera stage tested frustum containment — "are the fighters inside the
 * view volume" — which says nothing about whether a pillar stands between the
 * lens and them. A fighter can be perfectly framed and completely invisible.
 *
 * Casts a grid over each silhouette. Meshes only: rain is `LineSegments`, and
 * three raycasts lines against a one-world-unit default threshold, so a probe
 * using the defaults reports every fighter 100% occluded in every arena in
 * frames where the pixels show them entirely clear.
 */
const occlusion = (page) => page.evaluate(() => {
  const A = window.__ARENA, THREE = A.debug.THREE;
  const cam = A.stage.camera, scene = A.stage.scene;
  cam.updateMatrixWorld();
  const camPos = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
  const ray = new THREE.Raycaster();
  ray.camera = cam;
  ray.params.Line = { threshold: 0.001 };
  ray.params.Points = { threshold: 0.001 };
  const out = [];
  for (const act of A.app.view.actors) {
    if (!act?.root) { out.push(null); continue; }
    const box = new THREE.Box3().setFromObject(act.root);
    if (!Number.isFinite(box.min.x)) { out.push(null); continue; }
    const blockers = new Map();
    let total = 0, hidden = 0;
    for (let ix = 0; ix < 4; ix++) for (let iy = 0; iy < 6; iy++) {
      const p = new THREE.Vector3(
        box.min.x + (box.max.x - box.min.x) * ((ix + 0.5) / 4),
        box.min.y + (box.max.y - box.min.y) * ((iy + 0.5) / 6),
        (box.min.z + box.max.z) * 0.5);
      const dir = p.clone().sub(camPos);
      const dist = dir.length();
      if (dist < 0.2) continue;
      total++;
      ray.set(camPos, dir.multiplyScalar(1 / dist));
      ray.near = 0.05; ray.far = dist - 0.25;
      let hits = [];
      try { hits = ray.intersectObjects(scene.children, true); } catch { /* ignore */ }
      for (const h of hits) {
        if (!h.object.isMesh) continue;
        const m = h.object.material;
        if (!h.object.visible || !m || m.opacity === 0) continue;
        if (m.transparent && m.opacity < 0.4) continue;
        let o = h.object, mine = false;
        while (o) { if (o === act.root) { mine = true; break; } o = o.parent; }
        if (mine) continue;
        hidden++;
        let top = h.object, name = h.object.name || '';
        while (top.parent && top.parent !== scene) { top = top.parent; if (top.name) name = top.name; }
        blockers.set(name || h.object.type, (blockers.get(name || h.object.type) || 0) + 1);
        break;
      }
    }
    out.push({ pct: Math.round(hidden / Math.max(1, total) * 100),
      blockers: [...blockers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2) });
  }
  return out;
});

/** Let every *finite* CSS animation land. Some loop forever; awaiting those hangs. */
const animationsDone = async (page, cap = 1500) => {
  // The command dock enters with a 0.2s `slideUp`, so a rect sampled while it
  // is running sits up to 28px below its resting position and reads as the HUD
  // hanging off the bottom of an ultrawide viewport. Measuring a transient as
  // if it were the rest state is the same mistake the camera harness made with
  // mid-blend frames.
  await page.evaluate((ms) => Promise.race([
    Promise.all(document.getAnimations()
      .filter((a) => (a.effect?.getComputedTiming?.().iterations ?? 1) !== Infinity)
      .map((a) => a.finished.catch(() => {}))),
    new Promise((r) => setTimeout(r, ms))
  ]), cap);
  await sleep(120);
};

/**
 * Start a battle and wait until the HUD is actually on screen.
 *
 * Both nameplates start with `.hidden` — `opacity:0` and parked off to the
 * side by `translateX(var(--plate-shift)) scale(.96)` — and `NamePlate.show()`
 * only drops it when the fighter's switch-in is animated. Measuring before
 * that reads the parked transform: at 480x900 the player's plate looked 18px
 * past the right edge when its resting position is 11px *inside* it. No
 * animation is running at that moment, so waiting for animations cannot catch
 * it; the class is simply still applied. Reveal lands at ~7s, against ~40-100s
 * for a real command prompt.
 */
const openBattle = async (page, seed = 'SCENE-1') => {
  await page.evaluate((s) => window.__ARENA.battle.quick(s), seed);
  let live = false;
  for (let i = 0; i < 200 && !live; i++) {
    live = await page.evaluate(() => !!window.__ARENA.battle.screen());
    if (!live) await sleep(100);
  }
  if (!live) return false;
  for (let i = 0; i < 120; i++) {
    const shown = await page.evaluate(() => {
      const p = [...document.querySelectorAll('.nameplate')];
      return p.length === 2 && p.every((e) => !e.classList.contains('hidden'));
    });
    if (shown) { await animationsDone(page); return true; }
    await sleep(500);
  }
  return false;
};

/**
 * Drive all the way to a real command prompt. Measured at ~101s after the
 * battle starts under software rendering, because the whole intro plays first
 * — so the cap has to be generous, and whether it was actually reached is
 * returned rather than assumed. The old version capped at 300 polls and fell
 * through silently when it lost the race, which left the camera reading a
 * mid-intro shot and the legibility pass finding no move cards at all.
 */
const settle = async (page, seed = 'SCENE-1') => {
  await openBattle(page, seed);
  let asked = false;
  for (let i = 0; i < 200; i++) {
    if (await page.evaluate(() => window.__ARENA.battle.waitingFor() === 0)) { asked = true; break; }
    await sleep(1000);
  }
  await sleep(2500);        // let the camera reach its resting shot
  await animationsDone(page);
  return asked;
};

/* ------------------------------------------------- lights + camera + models */
if (['all', 'lights', 'camera', 'models'].includes(STAGE)) {
  const { page } = await fresh();
  const asked = await settle(page);
  note(asked, 'the battle reached a real command prompt before the scene was sampled',
    asked ? '' : 'timed out mid-intro — every reading below is of a transient, not the resting shot');

  const scene = await page.evaluate(() => {
    const A = window.__ARENA, THREE = A.debug?.THREE || A.stage.THREE;
    const cam = A.stage.camera;
    const lights = [];
    A.stage.scene.traverse((o) => {
      if (o.isLight) lights.push({
        type: o.type, intensity: +o.intensity.toFixed(3), castShadow: !!o.castShadow,
        color: o.color ? o.color.getHexString() : null,
        mapSize: o.shadow?.mapSize ? `${o.shadow.mapSize.width}x${o.shadow.mapSize.height}` : null,
        near: o.shadow?.camera?.near ?? null, far: o.shadow?.camera?.far ?? null
      });
    });
    // fighter models: real geometry, sane bounds, inside the frustum
    const actors = [];
    for (const a of A.app.view.actors) {
      if (!a?.root) { actors.push(null); continue; }
      const box = new THREE.Box3().setFromObject(a.root);
      const size = box.getSize(new THREE.Vector3());
      let meshes = 0, tris = 0, nanGeo = 0;
      a.root.traverse((o) => {
        if (!o.isMesh) return;
        meshes++;
        const g = o.geometry;
        if (g?.boundingSphere && !Number.isFinite(g.boundingSphere.radius)) nanGeo++;
        const idx = g?.index ? g.index.count : (g?.attributes?.position?.count || 0);
        tris += Math.floor(idx / 3);
      });
      // near-plane clipping: nearest corner of the box in view space
      cam.updateMatrixWorld();
      const inv = new THREE.Matrix4().copy(cam.matrixWorldInverse);
      let nearestZ = -Infinity, allInFrustum = true;
      const fr = new THREE.Frustum().setFromProjectionMatrix(
        new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
      for (let i = 0; i < 8; i++) {
        const v = new THREE.Vector3(
          i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
        if (!fr.containsPoint(v)) allInFrustum = false;
        const vv = v.clone().applyMatrix4(inv);
        if (vv.z > nearestZ) nearestZ = vv.z;      // view space looks down -Z
      }
      actors.push({
        meshes, tris, nanGeo,
        size: [+size.x.toFixed(2), +size.y.toFixed(2), +size.z.toFixed(2)],
        distToNearPlane: +(-nearestZ - cam.near).toFixed(2),
        allInFrustum
      });
    }
    return {
      lights, actors,
      camera: { fov: +cam.fov.toFixed(1), near: cam.near, far: cam.far, aspect: +cam.aspect.toFixed(3) },
      renderer: { shadowsEnabled: !!A.stage.renderer?.shadowMap?.enabled, type: A.stage.renderer?.shadowMap?.type },
      perf: { fps: A.perf.fps, calls: A.perf.drawCalls ?? null, tris: A.perf.tris ?? null }
    };
  });

  if (STAGE === 'all' || STAGE === 'lights') {
    const amb = scene.lights.filter((l) => /Ambient|Hemisphere/.test(l.type));
    const dir = scene.lights.filter((l) => /Directional|Spot|Point/.test(l.type));
    const ambTotal = amb.reduce((s, l) => s + l.intensity, 0);
    const shadowCasters = dir.filter((l) => l.castShadow);
    const blown = scene.lights.filter((l) => l.intensity > 5.0);
    note(amb.length > 0, 'scene has a baseline ambient/hemisphere light', amb.map((l) => `${l.type} ${l.intensity}`).join(', ') || 'NONE');
    note(ambTotal >= 0.5, 'ambient level is not crushed', `total ${ambTotal.toFixed(2)}`);
    note(dir.length > 0, 'scene has a key light', dir.map((l) => `${l.type} ${l.intensity}`).join(', ') || 'NONE');
    note(shadowCasters.length > 0, 'at least one light casts shadows', shadowCasters.map((l) => `${l.type} ${l.mapSize}`).join(', ') || 'none cast');
    note(blown.length === 0, 'no light is blown out', blown.length ? blown.map((l) => `${l.type} @ ${l.intensity}`).join(', ') : `max ${Math.max(...scene.lights.map((l) => l.intensity)).toFixed(2)}`);
    note(scene.renderer.shadowsEnabled, 'renderer has shadows enabled');
  }

  if (STAGE === 'all' || STAGE === 'camera') {
    const c = scene.camera;
    note(c.fov >= 20 && c.fov <= 75, 'camera FOV is in a sane band', `${c.fov}°`);
    note(c.near > 0.01 && c.near <= 1, 'near plane avoids z-fighting and slicing', `near ${c.near}`);
    note(c.far / c.near <= 20000, 'near/far ratio keeps depth precision', `${Math.round(c.far / c.near)}:1 (near ${c.near}, far ${c.far})`);
    const live = scene.actors.filter(Boolean);
    note(live.every((a) => a.distToNearPlane > 0.5), 'no fighter is clipping the near plane',
      live.map((a) => `${a.distToNearPlane}m clear`).join(', '));
    note(live.every((a) => a.allInFrustum), 'both fighters are fully inside the frustum at rest',
      live.map((a) => (a.allInFrustum ? 'in' : 'CLIPPED')).join(', '));
    // In the frustum is not the same as visible. This is the check that was
    // missing when a player reported arena geometry blocking the view.
    const occ = (await occlusion(page)).filter(Boolean);
    const worst = Math.max(0, ...occ.map((o) => o.pct));
    note(worst < 25, 'nothing stands between the camera and either fighter at rest',
      occ.map((o) => `${o.pct}%`).join(', ') + (worst >= 25
        ? ' — blocked by ' + occ.flatMap((o) => o.blockers.map(([k]) => k)).join(', ') : ' hidden'));
  }

  if (STAGE === 'all' || STAGE === 'models') {
    const live = scene.actors.filter(Boolean);
    note(live.length === 2, 'both fighter models are present', `${live.length} actors`);
    note(live.every((a) => a.meshes > 0), 'models have real geometry', live.map((a) => `${a.meshes} meshes / ${a.tris} tris`).join(', '));
    note(live.every((a) => a.nanGeo === 0), 'no NaN bounding spheres', live.some((a) => a.nanGeo) ? 'found NaN geometry' : '');
    note(live.every((a) => a.size[1] > 0.3 && a.size[1] < 12), 'model heights are plausible', live.map((a) => `${a.size[1]}m`).join(', '));
  }
  await page.close();
}

/* ------------------------------------------------------------------ HUD */
// Every reading here needs the command dock on screen, and waiting for the game
// to raise a real prompt costs ~101s per browser under software rendering — the
// intro plays in full first. `__ARENA.battle.showMenu()` renders the same panel
// from the same context object without a turn being played, which is ~15s, and
// is the difference between this stage being a gate and being a thing you run
// overnight. The panels are inert: `onPlayerChoice` ignores input while
// `waitingChoice` is null.
if (STAGE === 'all' || STAGE === 'hud') {
  /** Text-contrast reading for one selector: shadow, stroke, or a panel behind it. */
  const readContrast = (page, sel) => page.evaluate((s) => {
    const alphaOf = (c) => {
      // Alpha test, not a string test. The first version matched "0.86)" with
      // /0(\.\d+)?\)$/ and declared an 86%-opaque panel transparent, which
      // reported the turn pill and the textbox as unprotected text.
      const m = /rgba?\(([^)]+)\)/.exec(c || '');
      if (!m) return 0;
      const p = m[1].split(',');
      return p.length > 3 ? parseFloat(p[3]) : 1;
    };
    // A panel painted with a gradient has `backgroundColor: rgba(0,0,0,0)` and
    // is completely opaque all the same — `.movecard` is a cream gradient and
    // `.textbox` a dark blue one. Reading only backgroundColor called both of
    // them bare text floating on the 3D. Take the gradient's own stops.
    const isPanel = (cs) => {
      if (alphaOf(cs.backgroundColor) >= 0.35) return true;
      const img = cs.backgroundImage;
      if (!img || img === 'none') return false;
      const stops = img.match(/rgba?\([^)]+\)/g) || [];
      return stops.some((c) => alphaOf(c) >= 0.35);
    };
    return [...document.querySelectorAll(s)].slice(0, 2).map((el) => {
      const cs = getComputedStyle(el);
      let backed = isPanel(cs), n = el.parentElement, hops = 0;
      while (!backed && n && hops++ < 3) {
        if (isPanel(getComputedStyle(n))) backed = true;
        n = n.parentElement;
      }
      // Judging text the player cannot see in this state is worthless. The
      // textbox is explicitly `opacity:0` under `body[data-cmd="moves"]`, so
      // each selector is read in the panel where it is actually on screen.
      let vis = el.offsetParent !== null, m = el;
      for (let i = 0; vis && m && i < 6; i++, m = m.parentElement) {
        if (parseFloat(getComputedStyle(m).opacity) < 0.05) vis = false;
      }
      return {
        sel: s, visible: vis,
        shadow: cs.textShadow !== 'none' ? cs.textShadow.slice(0, 40) : null,
        stroke: cs.webkitTextStrokeWidth && cs.webkitTextStrokeWidth !== '0px' ? cs.webkitTextStrokeWidth : null,
        backed, size: parseFloat(cs.fontSize)
      };
    });
  }, sel);

  /** Anything with a box that pokes outside the viewport. */
  const readFit = (page) => page.evaluate(() => {
    const W = innerWidth, H = innerHeight, off = [];
    const els = [...document.querySelectorAll('.nameplate, .cmdroot, .cmdbtn, .movegrid, .movecard, .mvinfo, .textbox, .turnpill')];
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.right > W + 2 || r.left < -2 || r.bottom > H + 2 || r.top < -2) {
        off.push(`${el.className.split(' ')[0]} [${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}]`);
      }
    }
    return { off, checked: els.length };
  });

  // Real class names, taken from src/ui/hud.js. The first version asked for
  // `.plate .nm`, `.plate .hp`, `.hpnum` and `.pflag`, none of which the HUD
  // has ever emitted — the nameplate is `.nameplate` and its parts are `.np-*`.
  // Four selectors matching nothing, counted as four passes.
  const MOVE_SEL = ['.nameplate', '.np-name', '.np-num', '.np-lv', '.np-hplabel', '.movecard .mv-name', '.mv-pp', '.turnpill'];
  const ROOT_SEL = ['.cmdbtn', '.txt'];
  const VIEWPORTS = [
    { width: 1280, height: 800 },     // the default, and the one legibility is read at
    { width: 1920, height: 420 },     // letterbox
    { width: 480, height: 900 },      // phone
    { width: 3440, height: 1440 }     // ultrawide
  ];

  for (const [i, vp] of VIEWPORTS.entries()) {
    const { page } = await fresh(vp);
    const live = await openBattle(page, 'SCENE-R');
    note(live, `HUD is revealed at ${vp.width}x${vp.height}`, live ? '' : 'no battle screen, or the nameplates never left their parked state');
    if (!live) { await page.close(); continue; }

    for (const panel of ['moves', 'root']) {
      const mode = await page.evaluate((p) => window.__ARENA.battle.showMenu(p, 0), panel);
      note(mode === panel, `the ${panel} panel opens at ${vp.width}x${vp.height}`, mode ? `dock mode "${mode}"` : 'showMenu returned null');
      await animationsDone(page);

      // Legibility is a property of the CSS, not of the viewport, so read it
      // once — but read it with the panel actually on screen.
      if (i === 0) {
        for (const sel of panel === 'moves' ? MOVE_SEL : ROOT_SEL) {
          const found = await readContrast(page, sel);
          // A selector that matches nothing is not a pass. The previous version
          // asked for `.movecard .mv-name` on a page where the dock had never
          // opened, found zero elements, and counted that as clean.
          if (!found.length) { note(false, `contrast: ${sel}`, 'selector matched no elements — nothing was checked'); continue; }
          // Judge only what is on screen. The foe's `.np-num` is `display:none`
          // by design — you do not get to see the opponent's exact HP, same as
          // Pokémon — and scoring an invisible element's contrast is noise.
          const shown = found.filter((l) => l.visible);
          if (!shown.length) { note(false, `contrast: ${sel}`, `hidden while the ${panel} panel is open — read it in the other state`); continue; }
          const bare = shown.filter((l) => !l.shadow && !l.stroke && !l.backed);
          note(bare.length === 0, `contrast: ${sel}`,
            bare.length ? `${bare.length}/${shown.length} sit on the 3D with no shadow, stroke or panel`
              : `${shown.length} visible checked at ${shown[0].size}px, all shadowed / stroked / on a panel`);
          // A floor, not an opinion. 10px is the smallest thing the HUD ships
          // today — `.np-hplabel`, the two-glyph "HP" mark at weight 900 with
          // .16em tracking, which is how Pokémon sets the same label. Every
          // layer carrying variable information the player has to read (names,
          // HP numbers, move names, PP) measures 11px or more. The gate exists
          // to catch a later shrink, not to enforce a taste.
          const floor = shown.every((l) => l.size >= 10);
          note(floor, `size: ${sel}`, shown.map((l) => `${l.size}px`).join(', ') + (floor ? '' : ' — below the 10px floor'));
        }
      }

      const fit = await readFit(page);
      note(fit.off.length === 0, `HUD fits ${vp.width}x${vp.height} with the ${panel} panel open`,
        fit.off.length ? fit.off.slice(0, 3).join('; ') : `${fit.checked} elements on screen`);
    }
    await page.close();
  }
}

/* ------------------------------------------------------------ occlusion */
// Every arena, not just the default one. The arenas differ precisely in what
// they put near the fighters — Skypiea has stone pillars, Onigashima a torii
// post, Baratie a mast — so an occlusion check that only ever sees one of them
// is checking the least interesting case.
if (STAGE === 'all' || STAGE === 'occlusion') {
  const { page } = await fresh();
  const arenas = await page.evaluate(() => window.__ARENA.data.arenas.map((a) => a.id));
  for (const arena of arenas) {
    await page.evaluate((a) => window.__ARENA.battle.start({
      mode: 'ai', aiLevel: 'ace', teamSize: 3, seed: 'OCC-1', arena: a, meta: { kind: 'quick' }
    }), arena);
    let live = false;
    for (let i = 0; i < 200 && !live; i++) {
      live = await page.evaluate(() => !!window.__ARENA.battle.screen());
      if (!live) await sleep(100);
    }
    // Wait on the actors themselves, not on the nameplates. Restarting into a
    // new arena leaves the previous battle's plates already revealed, so a
    // nameplate test passes instantly and the measurement lands before the new
    // fighters have any geometry — "only 1 actors on stage" in five of six
    // arenas. Wait for the thing being measured.
    for (let i = 0; i < 90; i++) {
      const n = await page.evaluate(() => {
        const A = window.__ARENA;
        let k = 0;
        for (const a of A.app.view.actors || []) {
          if (!a?.root) continue;
          const b = new A.debug.THREE.Box3().setFromObject(a.root);
          if (Number.isFinite(b.min.x) && b.max.y - b.min.y > 0.2) k++;
        }
        return k;
      });
      if (n === 2) break;
      await sleep(500);
    }
    await sleep(1500);
    const occ = (await occlusion(page)).filter(Boolean);
    const worst = Math.max(0, ...occ.map((o) => o.pct));
    note(occ.length === 2 && worst < 35, `${arena}: fighters are not behind the scenery`,
      occ.length !== 2 ? `only ${occ.length} actors on stage`
        : occ.map((o) => `${o.pct}%`).join(', ') + ' hidden'
          + (worst >= 35 ? ' — by ' + occ.flatMap((o) => o.blockers.map(([k, v]) => `${k}(${v})`)).join(', ') : ''));
  }
  await page.close();
}

/* ----------------------------------------------------------- onboarding */
if (STAGE === 'all' || STAGE === 'onboarding') {
  const { page, errs } = await fresh({ width: 1280, height: 800 }, true);
  const first = await page.evaluate(() => ({
    screen: window.__ARENA.router.currentId,
    saveIsBlank: !localStorage.getItem('gla.save') || (window.__ARENA.meta.save.data()?.stats?.battles ?? 0) === 0,
    text: (document.querySelector('.screen')?.innerText || '').slice(0, 400)
  }));
  note(first.screen !== 'battle' && first.screen !== 'linkbattle',
    'a first boot does not drop the player into a battle', `landed on "${first.screen}"`);
  const guided = /tutorial|how to|learn|new here|start here|first/i.test(first.text);
  note(guided, 'the first screen offers a way in for a new player',
    guided ? '' : 'no tutorial / getting-started affordance in the landing text');
  // is the tutorial reachable and does it actually teach?
  const tut = await page.evaluate(async () => {
    window.__ARENA.router.go('tutorial');
    await new Promise((r) => setTimeout(r, 600));
    const r = document.querySelector('.screen');
    return { id: window.__ARENA.router.currentId, chars: (r?.innerText || '').length, buttons: r.querySelectorAll('button').length };
  });
  note(tut.id === 'tutorial' && tut.chars > 80, 'tutorial screen exists and has content', `${tut.chars} chars, ${tut.buttons} buttons`);
  note(errs.length === 0, 'first boot is error-free', errs[0] || '');
  await page.close();
}

await browser.close();
server.kill();

console.log(`\n════ PRESENTATION — scene, HUD, first boot ════\n`);
for (const g of good) console.log(`  ✅ ${g}`);
if (bad.length) { console.log(''); for (const b of bad) console.log(`  ✗ ${b}`); }
console.log(bad.length ? `\n❌ ${bad.length} problem(s)` : `\n✅ presentation checks clean`);
process.exit(bad.length ? 1 : 0);
