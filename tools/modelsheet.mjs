// Character model review harness.
//
//   node tools/serve.mjs 8303 &
//   node tools/modelsheet.mjs --port 8303 --out tests/shots/models
//
// Loads tools/modelsheet.html (which imports ONLY three + fighterModel.js +
// data/fighters.js, so a half-saved file elsewhere can't break the review
// loop), then for every fighter renders:
//
//   turnaround-NN.png   3/4 battle angle · front · side · back, fit-framed
//   battle-NN.png       true battle framing: both slots, real camera + arena
//   states-NN.png       idle · ready · charge · hurt · faint · win
//
// Everything is composited into contact sheets inside the page and written
// out as PNG, so the sheets can be read back with the Read tool.

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const argv = process.argv.slice(2);
const args = {};
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) {
    const k = argv[i].slice(2);
    const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    args[k] = v;
  }
}

const PORT = Number(args.port || 8303);
const OUT = args.out || 'tests/shots/models';
const BASE = `http://127.0.0.1:${PORT}`;
const ONLY = args.only ? String(args.only).split(',') : null;
const SHEETS = String(args.sheets || 'turnaround,battle,states').split(',');
const ARENA = String(args.arena || 'marineford');
const OWN_SERVER = !args.port || args.serve === 'true';

async function startServer() {
  const p = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('server start timeout')), 8000);
    p.stdout.on('data', (d) => { if (String(d).includes('serving')) { clearTimeout(t); res(); } });
    p.stderr.on('data', (d) => process.stderr.write(d));
  });
  return p;
}

/* ------------------------------------------------------------------ */
/* Everything below runs inside the page.                              */
/* ------------------------------------------------------------------ */
function installHarness() {
  const { THREE, buildFighter, getArena } = window.MS;

  const canvas = document.createElement('canvas');
  canvas.width = 640; canvas.height = 800;
  document.body.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: false, preserveDrawingBuffer: true
  });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
  let arenaGroup = null;
  const actors = [];

  function buildArena(arenaId, withGround) {
    if (arenaGroup) scene.remove(arenaGroup);
    arenaGroup = new THREE.Group();
    scene.add(arenaGroup);
    const a = getArena(arenaId);

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(180, 24, 12),
      new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false,
        uniforms: { top: { value: new THREE.Color(a.sky[0]) }, bot: { value: new THREE.Color(a.sky[1]) } },
        vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec3 vP; void main(){ float h=clamp(vP.y/180.0*0.5+0.5,0.0,1.0); gl_FragColor=vec4(mix(bot,top,pow(h,0.75)),1.0); }'
      })
    );
    arenaGroup.add(sky);
    scene.fog = new THREE.FogExp2(new THREE.Color(a.fog.color), a.fog.density);

    if (withGround) {
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(26, 48),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(a.ground), roughness: 0.95, metalness: 0.02 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      arenaGroup.add(ground);
      // grid so floating / sinking feet are obvious
      const grid = new THREE.GridHelper(24, 24, new THREE.Color(a.accent), new THREE.Color(a.accent));
      grid.material.opacity = 0.25; grid.material.transparent = true;
      grid.position.y = 0.005;
      arenaGroup.add(grid);
    }

    const sun = new THREE.DirectionalLight(new THREE.Color(a.sun.color), a.sun.intensity);
    sun.position.set(...a.sun.position);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -14; sun.shadow.camera.right = 14;
    sun.shadow.camera.top = 20; sun.shadow.camera.bottom = -6;
    sun.shadow.bias = -0.0012;
    arenaGroup.add(sun);
    arenaGroup.add(new THREE.HemisphereLight(new THREE.Color(a.sky[0]), new THREE.Color(a.ground), 0.5));
    arenaGroup.add(new THREE.AmbientLight(new THREE.Color(a.ambient.color), a.ambient.intensity));
    const rim = new THREE.DirectionalLight(new THREE.Color(a.accent), 1.1);
    rim.position.set(-a.sun.position[0], 6, -a.sun.position[2]);
    arenaGroup.add(rim);
    return a;
  }

  function clearActors() {
    for (const a of actors) { scene.remove(a.root); try { a.dispose(); } catch (e) { /* */ } }
    actors.length = 0;
  }

  function addActor(def, opts) {
    const f = buildFighter(def);
    f.root.position.set(opts.pos[0], opts.pos[1], opts.pos[2]);
    f.root.rotation.y = opts.rotY || 0;
    f.facing = opts.facing === undefined ? 1 : opts.facing;
    f.state = opts.state || 'idle';
    scene.add(f.root);
    actors.push(f);
    return f;
  }

  function sim(seconds, seedOffset) {
    const dt = 1 / 60;
    const n = Math.round(seconds / dt);
    // prime with a couple of frames so springs settle from t=0
    for (let i = 0; i < n; i++) for (const a of actors) a.update(dt);
    void seedOffset;
  }

  function fitCamera(obj, azimDeg, elevDeg, aspect, margin) {
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    if (!isFinite(box.min.y)) box.set(new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 2, 1));
    const size = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());
    const az = azimDeg * Math.PI / 180, el = elevDeg * Math.PI / 180;
    const fov = 34;
    const need = Math.max(size.y, (Math.max(size.x, size.z) + 0.2) / aspect) * (margin || 1.16);
    const dist = (need * 0.5) / Math.tan(fov * Math.PI / 360) + Math.max(size.x, size.z) * 0.6;
    camera.fov = fov;
    camera.aspect = aspect;
    camera.position.set(
      c.x + Math.sin(az) * Math.cos(el) * dist,
      c.y + Math.sin(el) * dist,
      c.z + Math.cos(az) * Math.cos(el) * dist
    );
    camera.lookAt(c);
    camera.updateProjectionMatrix();
    return { box, size, center: c };
  }

  function setCamera(pos, look, fov, aspect) {
    camera.fov = fov; camera.aspect = aspect;
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.lookAt(look[0], look[1], look[2]);
    camera.updateProjectionMatrix();
  }

  function renderAt(w, h) {
    renderer.setSize(w, h, false);
    renderer.info.reset();
    renderer.render(scene, camera);
    return { calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
  }

  /* --------------- contact sheet compositing --------------- */
  let sheet = null, sctx = null;
  function beginSheet(w, h, title) {
    sheet = document.createElement('canvas');
    sheet.width = w; sheet.height = h;
    sctx = sheet.getContext('2d');
    sctx.fillStyle = '#0e1018'; sctx.fillRect(0, 0, w, h);
    if (title) {
      sctx.fillStyle = '#f2c94c';
      sctx.font = 'bold 22px monospace';
      sctx.fillText(title, 14, 30);
    }
  }
  function blit(x, y, w, h, label, sub) {
    sctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, x, y, w, h);
    sctx.strokeStyle = 'rgba(255,255,255,0.14)';
    sctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    if (label) {
      sctx.fillStyle = 'rgba(0,0,0,0.62)';
      sctx.fillRect(x, y + h - 20, w, 20);
      sctx.fillStyle = '#e8ecf6';
      sctx.font = 'bold 13px monospace';
      sctx.fillText(label, x + 6, y + h - 6);
      if (sub) {
        sctx.fillStyle = '#9fb0cc';
        sctx.font = '11px monospace';
        sctx.fillText(sub, x + w - 6 - sctx.measureText(sub).width, y + h - 6);
      }
    }
  }
  function endSheet() { const d = sheet.toDataURL('image/png'); sheet = null; sctx = null; return d; }

  window.MSX = {
    THREE, buildArena, clearActors, addActor, sim, fitCamera, setCamera,
    renderAt, beginSheet, blit, endSheet,
    scene, camera, renderer, actors,
    box(obj) {
      obj.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(obj);
      return { min: b.min.toArray(), max: b.max.toArray() };
    }
  };
}

/* ------------------------------------------------------------------ */

async function main() {
  await mkdir(OUT, { recursive: true });
  const server = OWN_SERVER ? await startServer() : null;
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || undefined,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  await page.goto(`${BASE}/tools/modelsheet.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.MS_READY, null, { timeout: 20000 });
  const fatal = await page.evaluate(() => window.MS.fatal || null);
  if (fatal) { console.error('HARNESS FATAL:\n' + fatal); await browser.close(); server?.kill(); process.exit(1); }

  await page.evaluate(installHarness);

  let ids = await page.evaluate(() => window.MS.FIGHTERS.map((f) => f.id));
  if (ONLY) ids = ids.filter((i) => ONLY.includes(i));
  console.log(`▶ ${ids.length} fighters: ${ids.join(', ')}`);

  const written = [];
  const save = async (name, dataUrl) => {
    const b64 = dataUrl.split(',')[1];
    const p = `${OUT}/${name}.png`;
    await writeFile(p, Buffer.from(b64, 'base64'));
    written.push(p);
    console.log('  📄 ' + p);
  };

  /* ---------------- turnaround sheets ---------------- */
  const stats = {};
  if (SHEETS.includes('turnaround')) {
    const PER = 4, CW = 300, CH = 400, PAD = 8, HEAD = 40;
    for (let s = 0; s * PER < ids.length; s++) {
      const group = ids.slice(s * PER, s * PER + PER);
      const W = PAD + 4 * (CW + PAD), H = HEAD + group.length * (CH + PAD);
      const url = await page.evaluate(async ({ group, ARENA, CW, CH, PAD, HEAD, W, H, s }) => {
        const M = window.MSX;
        M.buildArena(ARENA, true);
        M.beginSheet(W, H, `TURNAROUND  sheet ${s + 1}   ·   3/4 battle angle · front · side · back`);
        const stats = {};
        const views = [
          ['3/4', 205], ['front', 180], ['side', 90], ['back', 0]
        ];
        for (let r = 0; r < group.length; r++) {
          const def = window.MS.FIGHTERS.find((f) => f.id === group[r]);
          M.clearActors();
          const a = M.addActor(def, { pos: [0, 0, 0], rotY: 0, state: 'idle', facing: 1 });
          M.sim(2.7 + r * 0.37);
          const bb = M.box(a.root);
          for (let c = 0; c < views.length; c++) {
            M.fitCamera(a.root, views[c][1], 7, CW / CH, 1.2);
            const st = M.renderAt(CW * 2, CH * 2);
            if (c === 0) stats[def.id] = { calls: st.calls, tris: st.tris, min: bb.min, max: bb.max, h: def.model?.height };
            M.blit(PAD + c * (CW + PAD), HEAD + r * (CH + PAD), CW, CH,
              c === 0 ? `${def.name}` : views[c][0],
              c === 0 ? `${(def.model?.build || '?')} ${def.model?.height || '?'}m` : '');
          }
        }
        return { url: M.endSheet(), stats };
      }, { group, ARENA, CW, CH, PAD, HEAD, W, H, s });
      Object.assign(stats, url.stats);
      await save(`turnaround-${String(s + 1).padStart(2, '0')}`, url.url);
    }
  }

  /* ---------------- true battle framing ---------------- */
  if (SHEETS.includes('battle')) {
    const FW = 1180, FH = 664, PAD = 8, HEAD = 40, ROWS = 2;
    const pairs = [];
    for (let i = 0; i < ids.length; i += 2) pairs.push([ids[i], ids[i + 1] || ids[0]]);
    for (let s = 0; s * ROWS < pairs.length; s++) {
      const grp = pairs.slice(s * ROWS, s * ROWS + ROWS);
      const W = PAD * 2 + FW, H = HEAD + grp.length * (FH + PAD);
      const url = await page.evaluate(async ({ grp, ARENA, FW, FH, PAD, HEAD, W, H, s }) => {
        const M = window.MSX;
        M.buildArena(ARENA, true);
        M.beginSheet(W, H, `BATTLE FRAMING  sheet ${s + 1}   ·   camera "standard", real slot positions`);
        for (let r = 0; r < grp.length; r++) {
          M.clearActors();
          const [idA, idB] = grp[r];
          const dA = window.MS.FIGHTERS.find((f) => f.id === idA);
          const dB = window.MS.FIGHTERS.find((f) => f.id === idB);
          M.addActor(dA, { pos: [-4.6, 0, 1.2], rotY: Math.PI * 0.14, state: 'ready', facing: 1 });
          M.addActor(dB, { pos: [4.6, 0, -1.2], rotY: Math.PI * 1.14, state: 'ready', facing: -1 });
          M.sim(3.1 + r * 0.5);
          M.setCamera([-1.2, 4.3, 10.4], [0.2, 1.8, 0], 42, FW / FH);
          const st = M.renderAt(FW, FH);
          M.blit(PAD, HEAD + r * (FH + PAD), FW, FH,
            `${dA.name} (${dA.model?.height}m)  vs  ${dB.name} (${dB.model?.height}m)`,
            `${st.calls} calls · ${(st.tris / 1000).toFixed(1)}k tris`);
        }
        return M.endSheet();
      }, { grp, ARENA, FW, FH, PAD, HEAD, W, H, s });
      await save(`battle-${String(s + 1).padStart(2, '0')}`, url);
    }
  }

  /* ---------------- state sheets ---------------- */
  if (SHEETS.includes('states')) {
    const PER = 5, CW = 230, CH = 280, PAD = 6, HEAD = 40;
    const STATES = ['idle', 'ready', 'charge', 'hurt', 'faint', 'win'];
    for (let s = 0; s * PER < ids.length; s++) {
      const group = ids.slice(s * PER, s * PER + PER);
      const W = PAD + STATES.length * (CW + PAD), H = HEAD + group.length * (CH + PAD);
      const url = await page.evaluate(async ({ group, ARENA, CW, CH, PAD, HEAD, W, H, s, STATES }) => {
        const M = window.MSX;
        M.buildArena(ARENA, true);
        M.beginSheet(W, H, `STATES  sheet ${s + 1}   ·   ${STATES.join(' · ')}`);
        for (let r = 0; r < group.length; r++) {
          const def = window.MS.FIGHTERS.find((f) => f.id === group[r]);
          for (let c = 0; c < STATES.length; c++) {
            M.clearActors();
            const a = M.addActor(def, { pos: [0, 0, 0], rotY: 0, state: 'idle', facing: 1 });
            M.sim(1.4);
            a.state = STATES[c];
            // faint: the battle view lays the root down; replicate that here.
            if (STATES[c] === 'faint') a.root.rotation.z = Math.PI * 0.5;
            M.sim(STATES[c] === 'hurt' ? 0.12 : 1.5);
            M.fitCamera(a.root, 205, 9, CW / CH, 1.25);
            M.renderAt(CW * 2, CH * 2);
            M.blit(PAD + c * (CW + PAD), HEAD + r * (CH + PAD), CW, CH,
              c === 0 ? def.name : STATES[c], '');
          }
        }
        return M.endSheet();
      }, { group, ARENA, CW, CH, PAD, HEAD, W, H, s, STATES });
      await save(`states-${String(s + 1).padStart(2, '0')}`, url);
    }
  }

  /* ---------------- lineup: every fighter at true relative scale ------- */
  if (SHEETS.includes('lineup') || SHEETS.includes('turnaround')) {
    const url = await page.evaluate(async ({ ids, ARENA }) => {
      const M = window.MSX;
      M.buildArena(ARENA, true);
      M.clearActors();
      const step = 2.6;
      let tallest = 0;
      ids.forEach((id, i) => {
        const def = window.MS.FIGHTERS.find((f) => f.id === id);
        const a = M.addActor(def, { pos: [(i - (ids.length - 1) / 2) * step, 0, 0], rotY: Math.PI, state: 'ready', facing: 1 });
        void a;
        tallest = Math.max(tallest, def.model?.height || 1.8);
      });
      M.sim(2.4);
      const span = ids.length * step;
      const W = 1400, H = 460;
      M.beginSheet(W, H + 40, 'LINEUP · true relative scale (grid squares = 1 m)');
      M.setCamera([0, 3.2, span * 0.62 + 8], [0, 2.2, 0], 26, W / H);
      const st = M.renderAt(W, H);
      M.blit(0, 40, W, H, `${ids.length} fighters`, `${st.calls} calls · ${(st.tris / 1000).toFixed(1)}k tris`);
      return M.endSheet();
    }, { ids, ARENA });
    await save('lineup', url);
  }

  /* ---------------- numeric report ---------------- */
  const perf = await page.evaluate(async ({ ARENA }) => {
    const M = window.MSX;
    M.buildArena(ARENA, true);
    M.clearActors();
    const out = { perFighter: {}, unknownProps: [] };
    for (const def of window.MS.FIGHTERS) {
      M.clearActors();
      const a = M.addActor(def, { pos: [0, 0, 0], rotY: 0, state: 'ready', facing: 1 });
      M.sim(1.0);
      M.setCamera([-1.2, 4.3, 10.4], [0, 1.6, 0], 42, 16 / 9);
      const base = M.renderAt(640, 360);
      const bb = M.box(a.root);
      out.perFighter[def.id] = {
        calls: base.calls, tris: base.tris,
        minY: +bb.min[1].toFixed(4), maxY: +bb.max[1].toFixed(3),
        height: def.model?.height, build: def.model?.build
      };
    }
    // arena-only baseline so we can subtract
    M.clearActors();
    out.arenaOnly = M.renderAt(640, 360);
    out.unknownProps = [...(window.__UNKNOWN_SILHOUETTE || [])];
    return out;
  }, { ARENA });

  const arenaCalls = perf.arenaOnly.calls, arenaTris = perf.arenaOnly.tris;
  console.log(`\n  arena baseline: ${arenaCalls} calls, ${arenaTris} tris`);
  console.log('  per fighter (delta over arena):');
  let sumC = 0, sumT = 0, n = 0, bad = [];
  for (const [id, p] of Object.entries(perf.perFighter)) {
    const c = p.calls - arenaCalls, t = p.tris - arenaTris;
    sumC += c; sumT += t; n++;
    const groundIssue = p.minY < -0.02 ? ` ⚠ sinks ${p.minY.toFixed(3)}` : (p.minY > 0.06 ? ` ⚠ floats ${p.minY.toFixed(3)}` : '');
    if (groundIssue) bad.push(id + groundIssue);
    console.log(`   ${id.padEnd(14)} ${String(c).padStart(4)} calls  ${String(t).padStart(6)} tris  h=${p.height}m top=${p.maxY}${groundIssue}`);
  }
  console.log(`   ${'AVERAGE'.padEnd(14)} ${(sumC / n).toFixed(1)} calls  ${(sumT / n).toFixed(0)} tris`);
  if (perf.unknownProps.length) console.log('  ⚠ unimplemented silhouette keys: ' + perf.unknownProps.join(', '));

  await writeFile(`${OUT}/report.json`, JSON.stringify({
    arena: { calls: arenaCalls, tris: arenaTris },
    perFighter: perf.perFighter,
    average: { calls: sumC / n, tris: sumT / n },
    unknownProps: perf.unknownProps,
    groundIssues: bad,
    errors, sheets: written
  }, null, 2));

  await browser.close();
  server?.kill();
  if (errors.length) {
    console.log(`\n❌ ${errors.length} page error(s):`);
    [...new Set(errors)].slice(0, 20).forEach((e) => console.log('  - ' + e));
    process.exit(1);
  }
  console.log('\n✅ modelsheet done');
}

main().catch((e) => { console.error(e); process.exit(1); });
