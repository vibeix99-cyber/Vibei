// L2 checks 1 and 2: can the storage-full warning be read with REAL wheel / touch input on its real timers, and does it
// stay put while it is read? One fresh context (disposable profile) per run; per-frame recording from before the
// warning is raised to >= 2.3 s after the last input; video of every run (Playwright recordVideo).
//   node read.mjs <base> <rev-label> <outdir> <WxH[,WxH]> <themes> <texts> <flows alone|stack> <hows wheel20,wheel53,wheel100,touch,flick> [video=1] [reps=1]
import { mkdirSync, appendFileSync, writeFileSync, renameSync, readdirSync } from 'node:fs';
import { launch, newCtx, openNewbie, fillQuota, levelUpSetup, RECORDER, F, mark, setDir, inputs, snapshot, sleep, WARN } from './lib.mjs';

const [base, rev, out, cfgArg, themeArg, textArg, flowArg, howArg, videoArg = '1', repsArg = '1'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const NAT = process.env.NAT === '1', NATWAIT = +(process.env.NATWAIT ?? 800); // NAT: the natural sequence (R5-D1 retest): pointer on the stack, wheel down to the older toasts, wait NATWAIT ms, wheel back up
const browser = await launch();
let runs = 0, fails = 0;

const seenInfo = (page) => page.evaluate((W) => ({ seen: Object.keys(window.__rec.seen[W] ?? {}).length, total: window.__rec.total[W] ?? 0 }), WARN);
// the lowest / highest point on a toast at the stack's x, within the list's scrollport
const toastPoint = (page, which) =>
  page.evaluate((which) => {
    const list = document.querySelector('[aria-label="Notifications"] ol');
    if (!list) return null;
    const lr = list.getBoundingClientRect();
    const w = document.getElementById('toast-kettle:save-failed');
    const r = (w ?? list).getBoundingClientRect();
    const x = (r.left + r.right) / 2;
    const vb = Math.min(lr.bottom, innerHeight), vt = Math.max(0, lr.top);
    const on = (y) => !!document.elementFromPoint(x, y)?.closest('[aria-label="Notifications"] li');
    if (which === 'low') { let y = vb - Math.min(20, (vb - vt) / 3); while (y > vt && !on(y)) y -= 3; return { x, y }; }
    let y = vt + Math.min(20, (vb - vt) / 3); while (y < vb && !on(y)) y += 3; return { x, y };
  }, which);

for (const cfg of cfgArg.split(','))
  for (const theme of themeArg.split(','))
    for (const text of textArg.split(',').map(Number))
      for (const flow of flowArg.split(','))
        for (const how of howArg.split(','))
          for (let rep = 1; rep <= +repsArg; rep++) {
            const [W, H] = cfg.split('x').map(Number);
            const tag = `${rev}-${W}x${H}-${theme}-t${text}-${flow}-${how}${NAT ? `-nat${NATWAIT}` : ''}${+repsArg > 1 ? `-r${rep}` : ''}`;
            const vdir = `${out}/.vid-${tag}`;
            const ctx = await newCtx(browser, { w: W, h: H, theme, text, video: videoArg === '1' ? vdir : undefined });
            const page = await ctx.newPage();
            const errors = [];
            page.on('pageerror', (e) => errors.push(e.message));
            const bad = [];
            const info = { tag, base, rev, W, H, theme, text, flow, how };
            const t0wall = Date.now();
            try {
              await openNewbie(page, base, theme);
              if (flow === 'stack') await levelUpSetup(page);
              await page.evaluate(RECORDER, WARN);
              await sleep(300);
              if (flow === 'alone') { const q = await fillQuota(page); info.quota = q; if (q !== 'QuotaExceededError') bad.push(`quota ${q}`); }
              // --- raise the warning ---------------------------------------------------------------------------
              if (flow === 'alone') {
                await page.evaluate(() => {
                  const k = window.__kettle, led = k.progress.getState().ledger;
                  k.progress.setState({ ledger: [...led, { ...led[led.length - 1], id: 'probe-'.padEnd(400, 'x'), amount: 0 }] });
                  k.progress.setState({ ledger: led });
                });
              } else {
                await page.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
                await page.waitForFunction(() => location.hash === '#/focus');
                await sleep(2500);
                // storage fills once the brew is running (so the warning belongs to the End, not to the brew start)
                const q = await fillQuota(page); info.quota = q; if (q !== 'QuotaExceededError') bad.push(`quota ${q}`);
                await page.evaluate(() => window.__kettle.ff(12 * 60_000 + 5_000));
                await sleep(500);
                info.tEnd = await mark(page);
                await page.evaluate(() => window.__kettle.timer.getState().end('user'));
                await page.waitForFunction(() => location.hash === '#/' || location.hash === '');
              }
              info.tRaise = await mark(page);
              // the warning of interest is the first one drawn after the End (stack) / after the failing write (alone)
              await page.waitForFunction((t) => window.__rec.ev.some((e) => e[2] === 'toast-kettle:save-failed' && e[1] === '+' && e[0] >= t), info.tEnd ?? info.tRaise - 100, { timeout: 12_000 });
              // full opacity, then look at it (first line) for 700 ms before touching anything
              await page.waitForFunction((W) => { const f = window.__rec.frames.at(-1); return f && f[2] >= 0.98 && f[3] != null; }, WARN, { timeout: 5000 }).catch(() => {});
              await sleep(700);
              const tLook = await mark(page);
              info.before = await snapshot(page);
              info.nAtLook = info.before?.n;
              await page.screenshot({ path: `${out}/${tag}-appear.png`, scale: 'css' });
              // --- read ----------------------------------------------------------------------------------------
              const io = inputs(page, ctx, { W, H, how });
              const tIn0 = await mark(page);
              await setDir(page, 1);
              let s = await snapshot(page);
              let stuck = 0, steps = 0, readAllAt = null;
              const trace = [];
              for (let i = 0; i < (NAT ? 0 : 140) && s?.w; i++) {
                const si = await seenInfo(page);
                if (si.total > 0 && si.seen >= si.total) { readAllAt = await mark(page); break; }
                const yy = Math.min(Math.max(s.w.top + 0.4 * (s.w.bottom - s.w.top), s.vt + 4), s.vb - 4);
                await io.input(s.x, yy, io.step);
                steps++;
                if (steps % 4 === 0) await sleep(450); // a reader pauses
                const s2 = await snapshot(page);
                if (!s2?.w) { s = s2; break; }
                const moved = Math.abs(s2.w.st - s.w.st) > 0.5 || Math.abs(s2.l.st - s.l.st) > 0.5;
                stuck = moved ? 0 : stuck + 1;
                trace.push([steps, Math.round(s2.w.st), Math.round(s2.l.st), si.seen]);
                s = s2;
                if (stuck >= 4) break;
              }
              if (steps === 0 && s?.w) { // nothing to scroll: a reader still moves a finger / wheel over it
                for (let i = 0; i < 3; i++) { await io.input(s.x, Math.min(Math.max(s.w.top + 0.4 * (s.w.bottom - s.w.top), s.vt + 4), s.vb - 4), io.step); }
                info.extraInput = 3;
              }
              info.readSteps = steps; info.stuckEnd = stuck >= 4; info.readTrace = trace;
              const siA = await seenInfo(page);
              info.afterWarningRead = siA; info.readAllAt = readAllAt;
              // go on down to older toasts that are still there, then back up (real input)
              await sleep(300);
              s = await snapshot(page);
              if (s?.w && s.others.length) {
                let still = 0;
                for (let i = 0; i < 30 && still < 2; i++) {
                  const p = await toastPoint(page, 'low');
                  if (!p) break;
                  const a = await snapshot(page);
                  await io.input(p.x, p.y, io.step);
                  const b = await snapshot(page);
                  if (!b?.w) break;
                  still = Math.abs(b.l.st - a.l.st) < 0.5 && Math.abs(b.w.st - a.w.st) < 0.5 ? still + 1 : 0;
                }
                await sleep(NAT ? NATWAIT : 800);
                await setDir(page, -1);
                for (let i = 0; i < 30; i++) {
                  const a = await snapshot(page);
                  if (!a?.w || a.l.st <= 0.5) break;
                  const p = await toastPoint(page, 'high');
                  if (!p) break;
                  await io.input(p.x, p.y, -io.step);
                }
              }
              await setDir(page, 0);
              const tLast = await mark(page);
              info.tLast = tLast;
              // rest >= 2.3 s with the recorder running, then Save backup by real click / tap
              await sleep(2400);
              await page.screenshot({ path: `${out}/${tag}-end.png`, scale: 'css' });
              const rest = await page.evaluate((WARN) => {
                const w = document.getElementById(WARN);
                const b = w?.querySelector('button');
                if (!b) return { gone: true };
                const r = b.getBoundingClientRect();
                const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                return { x: r.left + r.width / 2, y: r.top + r.height / 2, inView: r.top >= 0 && r.bottom <= innerHeight, hit: !!h && b.contains(h) };
              }, WARN);
              info.rest = rest;
              info.tClick = await mark(page);
              if (!rest.gone) {
                const dl = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
                if (io.touch) await page.touchscreen.tap(rest.x, rest.y); else await page.mouse.click(rest.x, rest.y);
                const d = await dl;
                info.download = d ? d.suggestedFilename() : null;
              } else info.download = 'n/a (warning gone)';
              await sleep(300);
              const rec = await page.evaluate(() => { window.__rec.stop = true; const R = window.__rec; return { frames: R.frames, seen: R.seen, total: R.total, whole: R.whole, ev: R.ev }; });
              writeFileSync(`${out}/${tag}.frames.json`, JSON.stringify({ ev: rec.ev, seen: rec.seen, total: rec.total, frames: rec.frames }));
              // --- judge ---------------------------------------------------------------------------------------
              // The warning of interest = the first instance added at/after the End (stack) / the trigger (alone).
              const fr = rec.frames;
              const tFrom = info.tEnd ?? info.tRaise - 100;
              const inst = []; // {serial, add, rem}
              for (const e of rec.ev) {
                if (e[2] !== WARN) continue;
                if (e[1] === '+' && e[0] >= tFrom - 1) inst.push({ s: e[3], add: e[0], rem: null });
                if (e[1] === '-') { const i = inst.find((x) => x.s === e[3] && x.rem == null); if (i) i.rem = e[0]; }
              }
              info.instances = inst.map((i) => [Math.round(i.add), i.rem == null ? null : Math.round(i.rem), i.rem == null ? null : Math.round(i.rem - i.add)]);
              const first = inst[0];
              const tClick = info.tClick;
              const winFr = fr.filter((f) => f[0] >= tFrom - 1 && f[0] <= tClick);
              const present = winFr.filter((f) => f[F.top] != null);
              const tAppear = first ? first.add : null;
              const tFull = (present.find((f) => f[F.op] >= 0.98 && f[0] >= (tAppear ?? 0)) ?? [null])[0];
              info.tAppear = tAppear; info.tFull = tFull; info.tIn0 = tIn0;
              const seenFirst = present.find((f) => f[F.op] >= 0.5 && f[0] >= (tAppear ?? 0));
              info.firstLineAtOp30 = seenFirst ? seenFirst[F.first] : null;
              const atFull = present.find((f) => f[0] === tFull);
              info.firstLineAtFull = atFull ? atFull[F.first] : null;
              const lookWin = present.filter((f) => tFull != null && f[0] >= tFull && f[0] <= tFull + 600);
              info.firstLineLookMin = lookWin.length ? Math.min(...lookWin.map((f) => f[F.first])) : null;
              info.frames = fr.length;
              info.warnBoxAtLook = atFull ? { top: atFull[F.top], bottom: atFull[F.bot], dockTop: atFull[F.dTop], roomBottom: atFull[F.rBot] } : null;
              if (!first || tFull == null) bad.push('warning never reached full opacity');
              else {
                if (info.firstLineAtFull !== 1) bad.push(`first line NOT visible at full opacity (t=${tFull})`);
                if (info.firstLineLookMin !== 1) bad.push(`first line not visible in every frame of the first 600 ms at full opacity (t=${tFull})`);
              }
              if (info.firstLineAtOp30 === 0) bad.push(`first line not visible when the warning first reached opacity 0.5 (t=${seenFirst[0]})`);
              // entry flicker: taken away before the first input; hide while reading: taken away / faded after it
              const entryHide = inst.filter((i) => i.rem != null && i.rem < tIn0 && i !== inst[inst.length - 1]);
              const entryHide1 = first && first.rem != null && first.rem < tIn0 && (first.rem - first.add) < 11_000;
              const readHide = inst.filter((i) => i.rem != null && i.rem >= tIn0 && i.rem < tClick - 200 && (i.rem - i.add) < 11_500);
              info.entryHide = !!entryHide1; info.readHide = readHide.length;
              if (entryHide1) bad.push(`ENTRY: warning taken away ${Math.round(first.rem - first.add)} ms after it appeared (before any input) and re-shown ${inst[1] ? Math.round(inst[1].add - first.rem) + ' ms later' : 'never'}`);
              if (readHide.length) bad.push(`READING: warning taken away while being read at t=${readHide.map((i) => Math.round(i.rem))} (age ${readHide.map((i) => Math.round(i.rem - i.add))} ms)`);
              info.reshows = Math.max(0, inst.length - 1);
              // gone / faded frames while the (last) instance should be up
              const lastInst = inst[inst.length - 1];
              const upFrom = lastInst ? Math.max(tIn0, lastInst.add) : tIn0;
              const readFr = winFr.filter((f) => f[0] >= upFrom && f[0] <= tClick - 100 && !(lastInst?.rem != null && f[0] >= lastInst.rem - 400));
              const faded = readFr.filter((f) => f[F.top] != null && f[F.op] < 0.98 && f[0] >= (lastInst?.add ?? 0) + 600);
              const absent = readFr.filter((f) => f[F.top] == null);
              if (faded.length) bad.push(`READING: warning faded below 0.98 in ${faded.length} frames (first t=${faded[0][0]}, op ${faded[0][F.op]})`);
              if (absent.length) bad.push(`READING: warning absent in ${absent.length} frames (first t=${absent[0][0]})`);
              // jump back: the warning's own scroll, or the list's, going back toward the start with no upward input
              const jumps = [], clamps = [];
              const pr = present.filter((f) => f[0] >= tIn0);
              for (let i = 1; i < pr.length; i++) {
                const a = pr[i - 1], b = pr[i];
                if (b[F.dir] >= 0 && b[F.wst] != null && a[F.wst] != null && b[F.wst] < a[F.wst] - 1) jumps.push(['warning-own-scroll', b[0], a[F.wst], b[F.wst]]);
                if (b[F.dir] >= 0 && b[F.lst] < a[F.lst] - 1) (b[F.n] !== a[F.n] ? clamps : jumps).push(['list-scroll', b[0], a[F.lst], b[F.lst], `n ${a[F.n]}->${b[F.n]}`]);
              }
              if (jumps.length) bad.push(`READING: jump back toward the start x${jumps.length}: ${JSON.stringify(jumps.slice(0, 3))}`);
              if (clamps.length) info.note = [...(info.note ?? []), `list offset reduced as a toast left (clamp) x${clamps.length}: ${JSON.stringify(clamps.slice(0, 3))}`];
              info.jumps = jumps; info.clamps = clamps;
              // geometry of the instance(s): over the docked start / below the room, from full opacity on
              const hor = (f) => f[F.dL] != null && f[F.right] > f[F.dL] && f[F.left] < f[F.dR];
              const solid = present.filter((f) => f[F.op] >= 0.5);
              const overDock = solid.filter((f) => f[F.dTop] != null && f[F.bot] > f[F.dTop] + 0.5 && hor(f));
              const belowRoom = solid.filter((f) => f[F.rBot] != null && f[F.bot] > f[F.rBot] + 0.5);
              info.overDockFrames = overDock.length; info.belowRoomFrames = belowRoom.length;
              info.maxOverDockPx = overDock.length ? Math.max(...overDock.map((f) => f[F.bot] - f[F.dTop])) : 0;
              if (overDock.length) bad.push(`warning box over the docked start in ${overDock.length} frames (max ${info.maxOverDockPx.toFixed(1)} px, first t=${overDock[0][0]})`);
              if (belowRoom.length) bad.push(`warning box below its room in ${belowRoom.length} frames (first t=${belowRoom[0][0]})`);
              const afterLast = fr.filter((f) => f[0] >= tLast && f[0] <= tClick);
              info.recordedAfterLastMs = afterLast.length ? afterLast.at(-1)[0] - tLast : 0;
              if (info.recordedAfterLastMs < 2000) bad.push(`recorded only ${Math.round(info.recordedAfterLastMs)} ms after the last input`);
              info.fpsApprox = Math.round(winFr.length / ((winFr.at(-1)?.[0] - winFr[0]?.[0]) / 1000 || 1));
              // lines read
              const wl = { seen: Object.keys(rec.seen[WARN] ?? {}).length, total: rec.total[WARN] ?? 0 };
              info.linesRead = wl;
              if (wl.total === 0) bad.push('no warning lines measured');
              else if (wl.seen < wl.total) bad.push(`warning lines read ${wl.seen}/${wl.total}`);
              info.otherLines = Object.fromEntries(Object.keys(rec.total).filter((k) => k !== WARN).map((k) => [k.replace(/^toast-/, ''), `${Object.keys(rec.seen[k] ?? {}).length}/${rec.total[k]}`]));
              // squeeze (R2-D3): at the look, no toast box shorter than its content unless capped by the room
              const sq = (info.before?.all ?? []).filter((t) => t.max > 1 && t.h < (info.before.room.h - 6));
              info.squeezed = sq.map((t) => t.id);
              if (sq.length) bad.push(`toast box shorter than its content and not capped by the room: ${sq.map((t) => `${t.id} h${Math.round(t.h)} content${Math.round(t.sh)}`)}`);
              const btnFrames = winFr.filter((f) => f[F.btn] === 1).length;
              info.saveBackupHitFrames = btnFrames;
              if (btnFrames === 0) bad.push('Save backup never hit-tested as itself in any frame');
              if (!rest.gone && (!rest.inView || !rest.hit)) bad.push(`Save backup at rest: inView ${rest.inView} hit ${rest.hit}`);
              if (!rest.gone && !info.download) bad.push('Save backup tap did not download');
              if (rest.gone) bad.push('warning had gone before the final Save backup tap (own 12 s timer or taken away): reachability not tested at the end');
              if (errors.length) bad.push(`page errors ${errors.length}: ${errors[0]}`);
            } catch (e) {
              bad.push('ERROR ' + String(e.message).split('\n')[0]);
            }
            info.bad = bad; info.errors = errors; info.wallMs = Date.now() - t0wall;
            runs++; if (bad.length) fails++;
            appendFileSync(`${out}/${rev}.jsonl`, JSON.stringify(info) + '\n');
            console.log(`${tag}: ${bad.length ? 'FAIL ' + bad.join(' ; ') : 'OK'} | lines ${JSON.stringify(info.linesRead)} others ${JSON.stringify(info.otherLines)} steps ${info.readSteps} first@full ${info.firstLineAtFull} look ${info.firstLineLookMin} inst ${JSON.stringify(info.instances)} dl ${info.download} box ${JSON.stringify(info.warnBoxAtLook)} ${info.note ? 'NOTE ' + info.note.join(' | ') : ''}`);
            const v = page.video();
            await ctx.close();
            if (v) {
              try { await v.saveAs(`${out}/${tag}.webm`); } catch (e) { console.log('video save failed', e.message); }
              try { const { rmSync } = await import('node:fs'); rmSync(vdir, { recursive: true, force: true }); } catch {}
            }
          }
await browser.close();
console.log(`${rev} ${cfgArg} ${themeArg} t${textArg} ${flowArg} ${howArg}: ${fails} failures in ${runs} runs`);
