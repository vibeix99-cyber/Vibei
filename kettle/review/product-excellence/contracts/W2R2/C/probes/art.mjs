// I06 art review renders: Chai in the real room (engine lighting, cushion, high tier), awake / nap / sip, light / dark /
// night, plus the procedural Chai in the same frames for reference. The pose and a closer camera are set through the
// debug handle (setup for the review only); everything else is the shipped engine.
//   node art.mjs --base http://127.0.0.1:5433 --out <dir>
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
mkdirSync(args.out, { recursive: true });
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const meta = { base: args.base, shots: {}, errors: [] };
// The veteran seed pins the time of day, so night uses the scene's own override (nooktime=night) on top of the 21:40 clock.
const looks = [['light', 'day', '2026-10-11T07:40:00Z', ''], ['dark', 'evening', '2026-10-11T07:40:00Z', ''], ['light', 'night', '2026-10-11T21:40:00Z', '&nooktime=night']];
const only = args.only ? args.only.split(',') : null;
for (const kind of ['model', 'procedural']) for (const [theme, label, at, extra] of looks) {
  if (only && !only.includes(label)) continue;
  const ctx = await b.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2, colorScheme: theme, timezoneId: 'UTC', serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => meta.errors.push(e.message.slice(0, 200)));
  await p.clock.install({ time: Date.parse(at) }); await p.clock.resume();
  try {
    await p.goto(`${args.base}/?debug&seed=veteran&theme=${theme}&nookq=high&chai3d=${kind}${extra}#/nook`);
    await p.waitForSelector('section[aria-label="The room"] [data-scene-ready="true"]', { timeout: 120000 });
    if (kind === 'model') await p.waitForFunction(() => window.__nook?.chaiKind === 'model', null, { timeout: 30000 });
    await p.waitForTimeout(1500);
    await p.evaluate(() => window.__nook.setRunning(false));
    for (const pose of ['awake', 'nap', 'sip']) {
      // the room's own camera direction, moved in on the cushion; a fixed breath / blink phase (t = 7.35, as reduced motion)
      const clip = await p.evaluate((pose) => {
        const e = window.__nook;
        e.chai.setPose(pose);
        e.state.reducedMotion = true;
        e.fitTarget.set(-0.95, pose === 'nap' ? 0.62 : 0.82, 1.15); e.zoomT = e.zoomC = 0.2; e.targetC.copy(e.fitTarget);
        e.frame(0);
        const r = e.canvas.getBoundingClientRect();
        const v = e.chai.root.position.clone(); v.y += pose === 'nap' ? 0.35 : 0.55; v.project(e.camera);
        const cx = r.left + ((v.x + 1) / 2) * r.width, cy = r.top + ((1 - v.y) / 2) * r.height;
        const s = Math.min(r.width, r.height) * 0.62;
        return { x: Math.max(r.left, cx - s / 2), y: Math.max(r.top, cy - s / 2), width: s, height: s };
      }, pose);
      const name = `${kind}-${pose}-${label}`;
      await p.screenshot({ path: `${args.out}/${name}.png`, clip, timeout: 180000 });
      meta.shots[name] = { theme, clock: at, pose, clip };
    }
  } catch (e) { meta.errors.push(`${kind} ${label}: ${e.message.slice(0, 200)}`); }
  await ctx.close();
}
writeFileSync(`${args.out}/art-meta${only ? '-' + only.join('-') : ''}.json`, JSON.stringify(meta, null, 1));
await b.close();
console.log('shots', Object.keys(meta.shots).length, 'errors', meta.errors.length, meta.errors.join(' | '));
