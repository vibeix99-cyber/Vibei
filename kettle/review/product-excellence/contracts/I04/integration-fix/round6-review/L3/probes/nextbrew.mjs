// L3 3c: "Next brew" (autoStartFocus) on: a badge / recipe / level toast lands on the running next brew over the status line.
// node nextbrew.mjs --rev=R6|INT --w=375 --h=667 --seed=veteran [--video] [--theme=light]
import { REV, launch, newCtx, ready, sleep, args, logger, OUT, trecInstall, trecStart, trecStop, startBtn, stamp, toEndMinus, ffBy } from './lib.mjs';
import { mkdirSync, writeFileSync, readdirSync, renameSync, rmSync } from 'node:fs';
const a = args();
const rev = REV[a.rev ?? 'R6'];
const w = +(a.w ?? 375), h = +(a.h ?? 667), seed = a.seed ?? 'veteran', theme = a.theme ?? 'light';
const dir = `${OUT}/3c`; mkdirSync(dir, { recursive: true });
const tag = `${rev.name}-${w}x${h}-${seed}`;
const log = logger(`${dir}/nextbrew-${tag}.log`);
log(`RUN 3c ${tag} url=${rev.dev} rev=${rev.name}@${rev.commit} viewport=${w}x${h} seed=${seed} theme=${theme} start=${stamp()}`);
const b = await launch();
const ctx = await newCtx(b, { w, h, theme, video: a.video ? `${dir}/vtmp-${tag}` : undefined });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: true, muted: true }, version: 1 })); } catch {} });
await p.goto(`${rev.dev}/?debug&seed=${seed}&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}#/`); await ready(p);
await p.evaluate(() => window.__kettle.settings.getState().set({ autoStartFocus: true, autoStartBreaks: false, muted: true }));
await p.evaluate(() => document.fonts.ready);
await sleep(800);
log('settings', await p.evaluate(() => { const s = window.__kettle.settings.getState(); return { autoStartFocus: s.autoStartFocus, autoStartBreaks: s.autoStartBreaks }; }));
await trecInstall(p);
await startBtn(p).click();
await sleep(1500);
await toEndMinus(p, 50);
await p.waitForFunction(() => location.hash === '#/done', null, { timeout: 25000 });
await sleep(2500);
await p.getByRole('button', { name: /Tea time/ }).click();
await sleep(1500);
log('on break', await p.evaluate(() => ({ hash: location.hash, phase: window.__kettle.timer.getState().phase, status: window.__kettle.timer.getState().status })));
await trecStart(p);
await toEndMinus(p, 50); // the break's last 50 ms run on the real clock
await sleep(9000);
const frames = await trecStop(p);
const st = await p.evaluate(() => ({ hash: location.hash, phase: window.__kettle.timer.getState().phase, status: window.__kettle.timer.getState().status }));
await p.screenshot({ path: `${dir}/nextbrew-${tag}-end.png` });
// analyse: which toasts appeared, on which phase, and when they overlapped the status line / clock / meta / readout
const seen = new Map();
for (const f of frames) for (const t of f.toasts) {
  const k = t.text; const e = seen.get(k) ?? { text: k, firstT: f.t, lastT: f.t, maxOp: 0, over: {}, frames: 0, rectAtMaxOp: null };
  e.lastT = f.t; e.frames++; if (t.op >= e.maxOp) { e.maxOp = t.op; e.rectAtMaxOp = t.rect; }
  for (const [kk, v] of Object.entries(t.over)) { const cur = e.over[kk] ?? { frames: 0, maxArea: 0 }; if (t.op > 0.5) { cur.frames++; cur.maxArea = Math.max(cur.maxArea, v); } e.over[kk] = cur; }
  seen.set(k, e);
}
const sample = frames.find((f) => f.status); 
log('final state', st);
log('toasts seen on the running next brew:', JSON.stringify([...seen.values()], null, 1));
log('status line rect (first frame with a readout):', sample?.status, 'readout', sample?.readout);
const hashes = [...new Set(frames.map((f) => f.hash))]; log('routes during recording', hashes);
writeFileSync(`${dir}/nextbrew-${tag}.json`, JSON.stringify({ tag, url: rev.dev, seed, w, h, final: st, toasts: [...seen.values()], errs, frameCount: frames.length }, null, 1));
await ctx.close(); await b.close();
if (a.video) { const d = `${dir}/vtmp-${tag}`; const f = readdirSync(d).find((x) => x.endsWith('.webm')); if (f) renameSync(`${d}/${f}`, `${dir}/video-3c-${tag}.webm`); rmSync(d, { recursive: true, force: true }); }
log(`END ${stamp()}`);
