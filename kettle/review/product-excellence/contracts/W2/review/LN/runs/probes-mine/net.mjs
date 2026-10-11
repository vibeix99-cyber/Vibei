// Lane N · check 6: which requests Home makes before any brew, and what a brew adds (3D auto / 3D off). 390x844 light, prod preview or dev.
// node net.mjs --base URL --label ctrl|trial --out dir
import { mkdirSync, writeFileSync } from 'node:fs';
import { parseArgs, parseCfg, newCtx, ready, settings, tapOrClick, brewBtn, launch, sleep } from './common.mjs';
const A = parseArgs(); const c = parseCfg('390x844@3:light:100');
mkdirSync(A.out, { recursive: true });
const LAY = /(pothos|books|fairyLights|shelf|recordPlayer|monstera|telescope|kotatsu)-(morning|day|dusk|night)-(clear|rain|snow)/;
const b = await launch(); const out = { base: A.base, label: A.label, phases: {} };
for (const mode of ['auto', 'off']) {
  const meta = { errors: [], console: [] }; const { ctx, p } = await newCtx(b, c, meta);
  let cur = []; let phase = 'load';
  p.on('response', async (r) => { const u = r.url(); if (LAY.test(u) || /scene-[\w-]+\.js|NookScene|three-|window-[a-z]+-[a-z]+.*\.webp|NookFallback/.test(u)) { let n = null; try { n = (await r.body()).length; } catch {} cur.push({ phase, f: u.split('/').slice(-1)[0].slice(0, 60), layer: LAY.test(u), bytes: n, status: r.status() }); } });
  await p.goto(`${A.base}/?debug&seed=veteran&theme=light#/`); await ready(p);
  if (mode === 'off') { await settings(p, { scene: 'off', muted: true }); cur = []; await p.reload(); await ready(p); } else await settings(p, { muted: true });
  await sleep(6000);
  const home = cur.slice(); phase = 'brew'; cur = [];
  await tapOrClick(p, c, brewBtn(p)); await sleep(mode === 'auto' ? 15000 : 6000);
  out.phases[mode] = { homeIdle: home, afterBrew: cur.slice(), errors: meta.errors };
  await ctx.close();
}
writeFileSync(`${A.out}/net-${A.label}.json`, JSON.stringify(out, null, 1));
await b.close();
for (const [m, v] of Object.entries(out.phases)) console.log(A.label, m, 'home:', v.homeIdle.map((x) => x.f).join(','), '| brew:', v.afterBrew.map((x) => `${x.f}(${x.bytes})`).join(','));
