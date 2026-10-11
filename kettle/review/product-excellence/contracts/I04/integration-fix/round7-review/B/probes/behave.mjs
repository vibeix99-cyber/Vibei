// Lane B checks 5 + 6: Settings › Your data placement (both themes, 100/200 %), and behaviour: the warning appears
// exactly when a save fails (not before), stays while storage is full (13 s + route changes by REAL taps on the
// main nav: Stats, Today, Nook, Today, Settings, Today), is announced once (every addition of the warning's text to
// any live region counted, across Today re-mounts and route changes), and when it goes after room is made
// (free room → observe 6 s → the app's next saves → observe). Setup by the debug API (seed, fill, the failing save,
// the freeing and the next saves); navigation and scrolling are real input.
//   node behave.mjs <base> <rev> <out> "375x667@100:light,..." [videoCfgs]
import { mkdirSync, appendFileSync, renameSync, rmSync } from 'node:fs';
import { launch, newCtx, open, seedAndFill, failASave, freeRoom, sleep, parseCfgs, touchDrag, WARN_FN, parseRgb, contrast, measureLines } from './blib.mjs';
const [,, base, rev, out, cfgArg, videoArg = '0'] = process.argv;
mkdirSync(out, { recursive: true });
const b = await launch();
for (const cfg of parseCfgs(cfgArg)) {
  const { W, H, text, theme } = cfg;
  const phone = W < 900;
  const tag = `${rev}-${W}x${H}-t${text}-${theme}`;
  const video = videoArg === '1' || videoArg.split(',').includes(`${W}x${H}@${text}:${theme}`);
  const ctx = await newCtx(b, { ...cfg, video, videoDir: `${out}/vtmp-${tag}` });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const res = { tag, rev, base, W, H, text, theme, started: new Date().toISOString(), log: [] };
  const present = () => p.evaluate((WF) => !!eval(WF)(), WARN_FN);
  const tapNav = async (re) => {
    const loc = p.locator('nav[aria-label="Main"] a').filter({ hasText: re }).filter({ visible: true }).first();
    let bb = await loc.boundingBox();
    if (!bb) { const l2 = p.locator(`nav[aria-label="Main"] a[aria-label]`).filter({ visible: true }); for (const a of await l2.all()) if (re.test((await a.getAttribute('aria-label')) || '')) { bb = await a.boundingBox(); break; } }
    if (!bb) throw new Error('no nav ' + re);
    if (phone) await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); else await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await sleep(1500);
    const st = { t: await p.evaluate(() => Math.round(performance.now())), to: String(re), hash: await p.evaluate(() => location.hash), warning: await present() };
    res.log.push(st); return st;
  };
  try {
    await open(p, base, theme);
    res.fill = await seedAndFill(p);
    res.justFilled = await p.evaluate((WF) => ({ t: Math.round(performance.now()), warning: !!eval(WF)(), failedWrites: window.__obs.writes.filter((w) => w[2] !== 'ok').length }), WARN_FN);
    await sleep(2500);
    res.beforeFail = { warning: await present(), failedWrites: await p.evaluate(() => window.__obs.writes.filter((w) => w[2] !== 'ok').length) };
    res.tFail = await failASave(p);
    await p.waitForFunction((WF) => !!eval(WF)(), WARN_FN, { timeout: 6000 }).catch(() => {});
    await sleep(300);
    const o1 = await p.evaluate(() => window.__obs);
    const firstFail = o1.writes.find((w) => w[2] !== 'ok');
    const firstAdd = o1.warnEv.find((e) => e[1] === '+');
    res.appear = { justFilledAt: res.justFilled.t, warningWhenJustFilled: res.justFilled.warning, firstFailedWrite: firstFail, firstWarningAdd: firstAdd, latencyMs: firstFail && firstAdd ? firstAdd[0] - firstFail[0] : null, failedWritesBeforeAdd: o1.writes.filter((w) => w[2] !== 'ok' && firstAdd && w[0] <= firstAdd[0]).length, probeFailASaveAt: res.tFail };
    await p.screenshot({ path: `${out}/${tag}-1-today.png` });
    // Stays: 13 s on Today, sampled every second (real timers).
    const keep = []; for (let i = 0; i < 13; i++) { await sleep(1000); keep.push(await present() ? 1 : 0); }
    res.keptOnToday13s = keep;
    for (const re of [/Stats/i, /Today/i, /Nook/i, /Today/i]) await tapNav(re);
    const st = await tapNav(/Settings/i);
    // Settings › Your data: real wheel (desktop) / touch drags (phones) until the warning is whole in view.
    // Read it there: every text line and Save backup unobstructed (elementFromPoint inside the warning, so the fixed
    // tab bar counts as covering), by real touch drags in the page's left gutter (x 8, never on a slider) / wheel.
    let m = null, still = 0, last = null; const scrollTrace = [];
    for (let i = 0; i < 90; i++) {
      m = await measureLines(p);
      if (!m) break;
      const okAll = m.lines.every((l) => l.ok) && m.sbOk;
      scrollTrace.push([m.scrollY, m.box[1], m.lines.filter((l) => l.ok).length, m.lines.length, m.sbOk ? 1 : 0]);
      if (okAll) break;
      const sig = `${m.scrollY}:${m.box[1]}`; still = sig === last ? still + 1 : 0; last = sig; if (still >= 4) break;
      const down = m.box[1] + m.box[3] > H * 0.5; const far = Math.abs(m.box[1] - H / 2) > H; // far away: longer drags / more notches (still real input)
      if (phone) { const d = far ? 200 : 60; await touchDrag(cdp, 8, Math.round(H * 0.6) + (down ? 0 : -d), down ? -d : d, far ? 12 : 8); await sleep(150); } else { await p.mouse.move(W / 2, H / 2); await p.mouse.wheel(0, (down ? 1 : -1) * (far ? 120 : 40)); await sleep(80); }
    }
    res.settingsRead = { linesOk: m ? m.lines.filter((l) => l.ok).length : 0, lines: m ? m.lines.length : 0, saveBackupHitTestable: !!m?.sbOk, stalled: still >= 4, trace: scrollTrace };
    res.settings = await p.evaluate((WF) => {
      const w = eval(WF)(); if (!w) return { present: false };
      const btns = [...document.querySelectorAll('button, a, label')];
      const row = (re) => btns.find((x) => re.test(x.textContent || ''));
      const exp = row(/Export a backup/), imp = row(/Import a backup/), reset = row(/Reset everything/);
      const r = w.getBoundingClientRect(); const rr = reset?.getBoundingClientRect(); const er = exp?.getBoundingClientRect();
      const group = reset?.closest('section, [role="group"], ul, div');
      const cs = getComputedStyle(w);
      return { present: true, tag: w.tagName, pos: cs.position, box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], whole: r.top >= 0 && r.bottom <= innerHeight,
        afterReset: !!(reset && reset.compareDocumentPosition(w) & Node.DOCUMENT_POSITION_FOLLOWING), exportBox: er ? [Math.round(er.left), Math.round(er.top), Math.round(er.width), Math.round(er.height)] : null, resetBox: rr ? [Math.round(rr.left), Math.round(rr.top), Math.round(rr.width), Math.round(rr.height)] : null,
        gapBelowReset: rr ? Math.round(r.top - rr.bottom) : null, leftAligned: er ? Math.abs(r.left - er.left) : null, between: (() => { if (!reset) return null; const out = []; let n = reset; while (n && !n.contains(w)) { let s = n.nextElementSibling; while (s && !s.contains(w)) { if ((s.textContent || '').trim()) out.push(s.textContent.trim().slice(0, 60)); s = s.nextElementSibling; } if (s) break; n = n.parentElement; } return out; })(),
        bg: cs.backgroundColor, border: cs.borderTopColor, color: cs.color, text: w.textContent.replace(/\s+/g, ' ').trim() };
    }, WARN_FN);
    if (res.settings.bg) { const c = (s) => parseRgb(s)?.slice(0, 3); res.settings.contrastText = contrast(c(res.settings.color), c(res.settings.bg)); }
    await p.screenshot({ path: `${out}/${tag}-2-settings-data.png` });
    console.log(tag, 'settings', JSON.stringify(res.settingsRead).slice(0, 200), JSON.stringify(res.settings).slice(0, 300));
    await tapNav(/Today/i);
    await p.screenshot({ path: `${out}/${tag}-3-today-again.png` });
    res.saidBeforeRecovery = await p.evaluate(() => window.__obs.said);
    // Recovery: room made (setup), observe 6 s; then the app's next saves (setup), observe until it goes.
    res.tFree = await freeRoom(p);
    const afterFree = []; for (let i = 0; i < 24; i++) { await sleep(250); afterFree.push(await present() ? 1 : 0); }
    res.presentAfterFree6s = afterFree;
    res.tWrite = await p.evaluate(() => { const k = window.__kettle; k.timer.setState({}); k.progress.setState({}); k.settings.getState().set({ name: k.settings.getState().name }); return Math.round(performance.now()); });
    let goneAt = null; for (let i = 0; i < 80; i++) { await sleep(100); if (!(await present())) { goneAt = await p.evaluate(() => Math.round(performance.now())); break; } }
    const o2 = await p.evaluate(() => window.__obs);
    const rem = o2.warnEv.filter((e) => e[1] === '-');
    res.disappear = { tFree: res.tFree, tWrite: res.tWrite, goneSeenAt: goneAt, removals: rem, firstOkAfterWrite: o2.writes.filter((w) => w[0] >= res.tWrite && w[2] === 'ok').slice(0, 4), msFromWrite: rem.length ? rem[rem.length - 1][0] - res.tWrite : null, msFromFree: rem.length ? rem[rem.length - 1][0] - res.tFree : null };
    await p.screenshot({ path: `${out}/${tag}-4-recovered.png` });
    res.said = o2.said; res.saidCount = o2.said.length; res.warnEv = o2.warnEv;
    console.log(tag, 'appear', JSON.stringify(res.appear), 'kept', keep.join(''), 'nav', res.log.map((l) => `${l.hash}:${l.warning ? 1 : 0}`).join(' '), 'said', res.saidCount, JSON.stringify(o2.said).slice(0, 300), 'afterFree', afterFree.join(''), 'gone ms from write', res.disappear.msFromWrite);
  } catch (e) { res.error = String(e.message).split('\n')[0]; console.log(tag, 'ERROR', res.error); }
  res.errors = errors.slice(0, 3);
  res.ended = new Date().toISOString();
  appendFileSync(`${out}/behave-${rev}.jsonl`, JSON.stringify(res) + '\n');
  const vid = video ? p.video() : null;
  await ctx.close();
  if (vid) { try { renameSync(await vid.path(), `${out}/clip-${tag}.webm`); } catch {} rmSync(`${out}/vtmp-${tag}`, { recursive: true, force: true }); }
}
await b.close();
