// FEEL critic (w) run B — same seed, exact wall-clock alignment between the
// render-frame log and the CDP screencast, plus HP-bar transform + shake/flash.
import { chromium } from 'playwright';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';

const PORT = Number(process.env.PORT || 8921);
const OUT = process.env.OUT || 'tests/shots/critic-feelw-b';
const SEED = process.env.SEED || 'FEELW-1';
const ARENA = process.env.ARENA || '';
const TURNS = Number(process.env.TURNS || 4);
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 960, height: 600 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 60000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio.setMuted(true));

const st = () => page.evaluate(() => {
  const A = window.__ARENA;
  return { w: A.battle.waitingFor(), r: A.router.currentId, gt: +A.stage.time.toFixed(3) };
});
const waitPrompt = async (maxMs = 900000) => {
  const t0 = Date.now();
  for (;;) {
    const s = await st();
    if (s.r !== 'battle') return { ...s, st: 'over' };
    if (s.w === 0) return { ...s, st: 'prompt' };
    if (Date.now() - t0 > maxMs) return { ...s, st: 'stall' };
    await sleep(140);
  }
};

await page.evaluate(([s, a]) => window.__ARENA.battle.quick(a ? { seed: s, arena: a } : s), [SEED, ARENA]);
console.log('first prompt', JSON.stringify(await waitPrompt()));
await writeFile(`${OUT}/plate.html`, await page.evaluate(() => [...document.querySelectorAll('.nameplate')].map((p) => p.outerHTML).join('\n\n')));

await page.evaluate(async () => {
  const A = window.__ARENA;
  const THREE = await import('three');
  const F = []; window.__F = F; window.__ON = true; window.__SFX = [];
  const sx = (el) => { if (!el) return null; const t = getComputedStyle(el).transform;
    if (!t || t === 'none') return 1; const m = t.match(/matrix\(([^)]+)\)/); return m ? +(+m[1].split(',')[0]).toFixed(4) : 1; };
  try {
    const au = A.audio;
    for (const proto of [Object.getPrototypeOf(au), au]) {
      for (const k of Object.getOwnPropertyNames(proto)) {
        const d = Object.getOwnPropertyDescriptor(proto, k);
        if (!d || typeof d.value !== 'function' || k === 'constructor') continue;
        if (!/^(sfx|play|cry|cue|hit|impact|ui)/i.test(k)) continue;
        const orig = d.value;
        Object.defineProperty(au, k, { configurable: true, writable: true, value: function (...a) {
          try { window.__SFX.push({ gt: +A.stage.time.toFixed(3), dn: Date.now(), fn: k, a: typeof a[0] === 'string' ? a[0] : (a[0]?.id ?? '') }); } catch {}
          return orig.apply(this, a);
        } });
      }
    }
  } catch {}
  const cam = A.stage.camera;
  const num = (o) => { const r = {}; if (!o) return r;
    for (const k of Object.keys(o)) { const v = o[k]; if (typeof v === 'number') r[k] = +v.toFixed(4); } return r; };
  const tick = () => {
    if (window.__ON) requestAnimationFrame(tick);
    try {
      const V = A.app.view, dir = A.app.dir, fe = A.stage.feel, tb = A.textbox;
      cam.updateMatrixWorld(true);
      const cp = cam.position;
      const plates = [...document.querySelectorAll('.nameplate')].map((p) => ({
        f: sx(p.querySelector('.np-fill')), g: sx(p.querySelector('.np-ghost')),
        hid: p.classList.contains('hidden'),
        cls: p.className.replace('nameplate', '').trim().slice(0, 40) }));
      F.push({
        gt: +A.stage.time.toFixed(3), dn: Date.now(),
        shot: dir?.shot?.id ?? null,
        cam: [+cp.x.toFixed(3), +cp.y.toFixed(3), +cp.z.toFixed(3)], fov: +cam.fov.toFixed(2),
        fx: A.stage.fxGroup?.children.length ?? -1,
        feel: { ...num(fe), shake: num(fe.shake), flash: num(fe.flash) },
        txt: (tb?.$txt?.textContent || '').slice(0, 80), prev: (tb?.$prev?.textContent || '').slice(0, 50),
        wait: !!tb?.waitingForInput, q: tb?.queue?.length ?? -1,
        plates,
        s: [0, 1].map((i) => {
          const act = V?.actors?.[i]; if (!act) return null;
          const p = new THREE.Vector3().setFromMatrixPosition(act.root.matrixWorld);
          const a = dir?.act?.[i]; const h = a?.fullH || 1.9;
          const nd = p.clone().add(new THREE.Vector3(0, h * 0.5, 0)).project(cam);
          const nh = p.clone().add(new THREE.Vector3(0, h, 0)).project(cam);
          const nf = p.clone().project(cam);
          return { p: [+p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3)],
            ndc: [+nd.x.toFixed(3), +nd.y.toFixed(3)], hFrac: +((nh.y - nf.y) / 2).toFixed(3),
            vis: act.root.visible, sc: +act.root.scale.y.toFixed(3) };
        })
      });
    } catch (e) { F.push({ err: String(e.message) }); }
  };
  requestAnimationFrame(tick);
});

const client = await page.context().newCDPSession(page);
const shots = [];
client.on('Page.screencastFrame', async (f) => {
  shots.push({ dn: f.metadata.timestamp * 1000, data: f.data });
  try { await client.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {}
});
await client.send('Page.startScreencast', { format: 'jpeg', quality: 70, everyNthFrame: 1 });

const pick = () => page.evaluate(() => {
  const A = window.__ARENA, s = A.battle.screen();
  const side = s.battle.sides[0];
  if (s.forcedSwitch) {
    const i = side.party.findIndex((p, j) => !p.fainted && j !== side.activeIndex);
    A.battle.choose(0, { kind: 'switch', toSlot: i < 0 ? 0 : i });
    return { kind: 'switch', gt: +A.stage.time.toFixed(3), dn: Date.now() };
  }
  const mon = side.party[side.activeIndex];
  let best = null;
  for (const m of mon.moves) {
    const d = A.data.moves.find((x) => x.id === m.id);
    if (!d || m.pp <= 0 || d.category === 'status') continue;
    if (!best || (d.power || 0) > (best.d.power || 0)) best = { m, d };
  }
  if (!best) { const m = mon.moves.find((x) => x.pp > 0) || mon.moves[0]; best = { m, d: A.data.moves.find((x) => x.id === m.id) }; }
  A.battle.choose(0, { kind: 'move', moveId: best.m.id, target: 'foe' });
  return { kind: 'move', name: best.d.name, gt: +A.stage.time.toFixed(3), dn: Date.now() };
});

const turns = [];
for (let n = 0; n < TURNS; n++) {
  const before = await page.evaluate(() => window.__ARENA.battle.events().length);
  const chosen = await pick();
  const r = await waitPrompt();
  const evs = await page.evaluate((b) => window.__ARENA.battle.events().slice(b), before);
  console.log(`turn ${n + 1}`, chosen.kind, chosen.name || '', 'gt', chosen.gt, '->', r.st, r.gt);
  turns.push({ chosen, end: r, evs });
  if (r.st !== 'prompt') break;
}
await client.send('Page.stopScreencast').catch(() => {});
const F = await page.evaluate(() => window.__F.slice());
const SFX = await page.evaluate(() => window.__SFX.slice());
await writeFile(`${OUT}/frames.json`, JSON.stringify({ F, SFX, turns }));
const { writeFile: wf } = await import('node:fs/promises');
const index = [];
let i = 0;
for (const s of shots) { const name = `f${String(i).padStart(4, '0')}.jpg`; await wf(`${OUT}/${name}`, Buffer.from(s.data, 'base64')); index.push({ i, dn: s.dn, name }); i++; }
await writeFile(`${OUT}/index.json`, JSON.stringify(index));
console.log('screencast', shots.length, 'render', F.length, 'sfx', SFX.length, 'ERR', JSON.stringify([...new Set(errors)].slice(0, 5)));
await browser.close();
