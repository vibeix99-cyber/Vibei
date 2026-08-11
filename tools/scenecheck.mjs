// The presentation half, audited as maths rather than taste.
//
//   node tools/scenecheck.mjs [--stage all|lights|camera|models|hud|onboarding]
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

const settle = async (page, seed = 'SCENE-1') => {
  await page.evaluate((s) => window.__ARENA.battle.quick(s), seed);
  for (let i = 0; i < 300; i++) {
    if (await page.evaluate(() => window.__ARENA.battle.waitingFor() === 0)) break;
    await sleep(200);
  }
  await sleep(2500);        // let the camera reach its resting shot
  // ...and let every CSS animation land. The command dock enters with a 0.2s
  // `slideUp`, so a rect sampled while it is running sits up to 28px below its
  // resting position and reads as the HUD hanging off the bottom of an
  // ultrawide viewport. Measuring a transient as if it were the rest state is
  // the same mistake the camera harness made with mid-blend frames.
  await page.evaluate(() => Promise.all(
    document.getAnimations().map((a) => a.finished.catch(() => {}))
  ));
  await sleep(120);
};

/* ------------------------------------------------- lights + camera + models */
if (['all', 'lights', 'camera', 'models'].includes(STAGE)) {
  const { page } = await fresh();
  await settle(page);

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
if (STAGE === 'all' || STAGE === 'hud') {
  // legibility at the default size
  const { page } = await fresh();
  await settle(page);
  const legibility = await page.evaluate(() => {
    const sel = ['.plate .nm', '.plate .hp', '.hpnum', '.movecard .mv-name', '.pflag', '.txt', '.turnpill'];
    const out = [];
    for (const s of sel) {
      for (const el of [...document.querySelectorAll(s)].slice(0, 2)) {
        const cs = getComputedStyle(el);
        const bg = cs.backgroundColor;
        // Alpha test, not a string test. The first version matched "0.86)" with
        // /0(\.\d+)?\)$/ and declared an 86%-opaque panel transparent, which
        // reported the turn pill and the textbox as unprotected text.
        const alphaOf = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return 0; const p = m[1].split(','); return p.length > 3 ? parseFloat(p[3]) : 1; };
        const opaque = alphaOf(bg) >= 0.35;
        // walk up for a backing panel
        let backed = opaque, n = el.parentElement, hops = 0;
        while (!backed && n && hops++ < 3) {
          if (alphaOf(getComputedStyle(n).backgroundColor) >= 0.35) backed = true;
          n = n.parentElement;
        }
        out.push({
          sel: s, shadow: cs.textShadow !== 'none' ? cs.textShadow.slice(0, 40) : null,
          stroke: cs.webkitTextStrokeWidth && cs.webkitTextStrokeWidth !== '0px' ? cs.webkitTextStrokeWidth : null,
          backed, size: cs.fontSize
        });
      }
    }
    return out;
  });
  const unprotected = legibility.filter((l) => !l.shadow && !l.stroke && !l.backed);
  note(unprotected.length === 0, 'every HUD text layer has contrast protection',
    unprotected.length ? unprotected.map((l) => l.sel).join(', ') + ' sit on the 3D with no shadow, stroke or panel'
      : `${legibility.length} elements checked, all shadowed / stroked / on a panel`);
  await page.close();

  // responsive: extreme aspect ratios must not push the HUD off screen
  for (const vp of [{ width: 1920, height: 420 }, { width: 480, height: 900 }, { width: 3440, height: 1440 }]) {
    const { page: p2 } = await fresh(vp);
    // Lightweight settle. The full one waits out the intro and a whole turn to
    // reach a command prompt, which is minutes per viewport under software
    // rendering and timed the stage out at 25 minutes. The layout question only
    // needs the dock rendered and its entry animation finished.
    await p2.evaluate(() => window.__ARENA.battle.quick('SCENE-R'));
    await p2.waitForSelector('.cmdroot, .txtbox', { timeout: 60000 }).catch(() => {});
    await sleep(1200);
    await p2.evaluate(() => Promise.race([
      Promise.all(document.getAnimations()
        .filter((a) => (a.effect?.getComputedTiming?.().iterations ?? 1) !== Infinity)
        .map((a) => a.finished.catch(() => {}))),
      new Promise((r) => setTimeout(r, 1200))
    ]));
    await sleep(150);
    const fit = await p2.evaluate(() => {
      const W = innerWidth, H = innerHeight;
      const els = [...document.querySelectorAll('.plate, .cmdroot, .cmdbtn, .movegrid, .txtbox, .turnpill')];
      const off = [];
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.right > W + 2 || r.left < -2 || r.bottom > H + 2 || r.top < -2) {
          off.push(`${el.className.split(' ')[0]} [${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}]`);
        }
      }
      return { off, checked: els.length };
    });
    note(fit.off.length === 0, `HUD fits ${vp.width}x${vp.height}`,
      fit.off.length ? fit.off.slice(0, 3).join('; ') : `${fit.checked} elements on screen`);
    await p2.close();
  }
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
