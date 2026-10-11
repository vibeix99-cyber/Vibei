// Lane B checks 1, 2, 8: read the storage-full warning on Today by REAL input (mouse wheel in N px steps, CDP touch
// drags, keyboard Tab/arrows), reach and use Save backup (real click / tap / Enter → a download), Tab order and focus
// ring, and the warning's colours/animations. Works on R7 (in-page banner) and INT (warning toast).
// Setup by the debug API only: newbie seed, a saved timer, quota fill, one app save that then fails (timer state).
//   node read.mjs <base> <rev> <out> "375x667@100:light,..." "wheel20,touch,key,wheel53,wheel100" [video=0|1|<cfg,cfg>]
import { mkdirSync, appendFileSync, renameSync, rmSync, readFileSync, statSync } from 'node:fs';
import { launch, newCtx, open, seedAndFill, failASave, measureLines, sleep, parseCfgs, touchDrag, WARN_FN, parseRgb, contrast, hsl } from './blib.mjs';
const [,, base, rev, out, cfgArg, methArg = 'wheel20', videoArg = '0'] = process.argv;
mkdirSync(out, { recursive: true });
const b = await launch();
for (const cfg of parseCfgs(cfgArg)) for (const method of methArg.split(',')) {
  const { W, H, text, theme } = cfg;
  const tag = `${rev}-${W}x${H}-t${text}-${theme}-${method}`;
  const video = videoArg === '1' || videoArg.split(',').includes(`${W}x${H}@${text}:${theme}`);
  const ctx = await newCtx(b, { ...cfg, video, videoDir: `${out}/vtmp-${tag}` });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  const res = { tag, rev, base, W, H, text, theme, method, started: new Date().toISOString() };
  try {
    await open(p, base, theme);
    res.fill = await seedAndFill(p);
    res.tFail = await failASave(p);
    await sleep(2500);
    let m0 = await measureLines(p);
    // INT's toast can be held back by its placement rule: wait up to 10 s more (real timers) and record when it came.
    for (let i = 0; i < 40 && !m0; i++) { await sleep(250); m0 = await measureLines(p); }
    res.warningSeenAfterMs = m0 ? await p.evaluate((t) => Math.round(performance.now()) - t, res.tFail) : null;
    res.arrive = m0;
    if (!m0) throw new Error('no warning element within 12.5 s of a failed save');
    await p.screenshot({ path: `${out}/${tag}-1-arrive.png` });
    // Check 8: tone (computed colours, animation) and overflow.
    res.tone = await p.evaluate((WF) => {
      const w = eval(WF)(); const cs = (e) => getComputedStyle(e);
      const sb = [...w.querySelectorAll('button')].find((x) => /Save backup/.test(x.textContent));
      const icon = w.querySelector('[aria-hidden="true"]');
      const anims = w.getAnimations({ subtree: true }).map((a) => a.animationName || a.transitionProperty || a.constructor.name);
      const animNames = [w, ...w.querySelectorAll('*')].map((e) => cs(e).animationName).filter((n) => n && n !== 'none');
      const trans = [w, ...w.querySelectorAll('*')].map((e) => [cs(e).transitionProperty, cs(e).transitionDuration]).filter(([, d]) => d.split(',').some((x) => parseFloat(x) > 0));
      const root = cs(document.documentElement);
      return { bg: cs(w).backgroundColor, border: cs(w).borderTopColor, borderW: cs(w).borderTopWidth, color: cs(w).color, title: w.querySelector('strong') ? cs(w.querySelector('strong')).color : null,
        iconBg: icon ? cs(icon).backgroundColor : null, iconColor: icon ? cs(icon).color : null, sbBg: sb ? cs(sb).backgroundColor : null, sbColor: sb ? cs(sb).color : null, sbBorder: sb ? cs(sb).borderTopColor + ' ' + cs(sb).boxShadow : null,
        fontSize: cs(w.querySelector('p') || w).fontSize, anims, animNames, trans, role: w.getAttribute('role'), ariaLive: w.getAttribute('aria-live'), label: w.getAttribute('aria-labelledby') ? document.getElementById(w.getAttribute('aria-labelledby'))?.textContent : w.getAttribute('aria-label'),
        tokens: Object.fromEntries(['--honey-soft', '--honey-soft-edge', '--honey', '--ink', '--berry', '--persimmon', '--sky', '--surface'].map((k) => [k, root.getPropertyValue(k).trim()])),
        hScroll: document.scrollingElement.scrollWidth > innerWidth + 1, overflowX: w.scrollWidth > w.clientWidth + 1, text: w.textContent.replace(/\s+/g, ' ').trim() };
    }, WARN_FN);
    const rgb = (s) => parseRgb(s)?.slice(0, 3);
    if (res.tone.bg && rgb(res.tone.bg)) { const bg = rgb(res.tone.bg); res.tone.contrastText = contrast(rgb(res.tone.color), bg); res.tone.contrastBorder = contrast(rgb(res.tone.border), bg); res.tone.hslBg = hsl(bg); res.tone.hslBorder = hsl(rgb(res.tone.border)); if (res.tone.iconBg) res.tone.hslIcon = hsl(rgb(res.tone.iconBg)); }
    // Reading.
    const nLines = m0.lines.length;
    const seen = new Set(); let sbSeen = false; let allAtOnce = false; const trace = [];
    const upd = (m, step) => { if (!m) return; const ok = m.lines.filter((l) => l.ok).map((l) => l.i); ok.forEach((i) => seen.add(i)); if (ok.length === m.lines.length) allAtOnce = true; if (m.sbOk) sbSeen = true; trace.push([step, m.scrollY, m.box[1], ok.length, m.lines.length, m.sbOk ? 1 : 0]); };
    upd(m0, 'arrive');
    const aim = async () => p.evaluate((WF) => {
      const w = eval(WF)(); const r = w.getBoundingClientRect();
      const x = Math.max(12, Math.min(innerWidth - 12, r.left + r.width / 2));
      const dockTop = Math.min(innerHeight, ...[...document.querySelectorAll('[data-toast-above]')].map((d) => d.getBoundingClientRect()).filter((q) => q.height > 0 && q.top > 0 && q.left < x && q.right > x).map((q) => q.top));
      const isToast = w.tagName === 'LI';
      const y = isToast && r.bottom > 0 && r.top < innerHeight ? Math.max(8, Math.min(innerHeight - 8, (Math.max(r.top, 0) + Math.min(r.bottom, innerHeight)) / 2)) : Math.max(20, Math.min(innerHeight * 0.4, dockTop - 24));
      return { x: Math.round(x), y: Math.round(y), dockTop: Math.round(dockTop) };
    }, WARN_FN);
    const done = () => seen.size >= nLines && sbSeen;
    let a = await aim(); res.aim = a;
    if (method.startsWith('wheel')) {
      const step = +method.slice(5);
      await p.mouse.move(a.x, a.y);
      for (const dir of [1, -1]) {
        let still = 0, last = null;
        for (let i = 0; i < Math.ceil(4000 / step) && !done(); i++) {
          await p.mouse.wheel(0, step * dir); await sleep(90);
          const m = await measureLines(p); upd(m, `w${dir > 0 ? '+' : '-'}${i}`);
          const sig = m ? `${m.scrollY}:${m.box[1]}` : 'x'; still = sig === last ? still + 1 : 0; last = sig; if (still >= 6) break;
        }
        if (done()) break;
      }
    } else if (method === 'touch') {
      for (const dir of [1, -1]) {
        let still = 0, last = null;
        for (let i = 0; i < 80 && !done(); i++) {
          a = await aim();
          const span = Math.min(40, Math.max(12, a.y - 8));
          const y0 = dir > 0 ? a.y : Math.max(8, a.y - span);
          await touchDrag(cdp, a.x, y0, -span * dir); await sleep(150);
          const m = await measureLines(p); upd(m, `t${dir > 0 ? '+' : '-'}${i}`);
          const sig = m ? `${m.scrollY}:${m.box[1]}` : 'x'; still = sig === last ? still + 1 : 0; last = sig; if (still >= 4) break;
        }
        if (done()) break;
      }
    } else if (method === 'key') {
      const order = []; let reached = false;
      for (let i = 0; i < 60 && !reached; i++) {
        await p.keyboard.press('Tab'); await sleep(120);
        const f = await p.evaluate((WF) => {
          const e = document.activeElement; const w = eval(WF)();
          if (!e || e === document.body) return { d: 'body' };
          const all = [...document.querySelectorAll('*')];
          const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
          return { d: `${e.tagName}:${(e.getAttribute('aria-label') || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40)}`, idx: all.indexOf(e), inWarn: !!w && w.contains(e), isSB: !!w && w.contains(e) && /Save backup/.test(e.textContent), fv: e.matches(':focus-visible'), ring: [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.outlineOffset, cs.boxShadow.slice(0, 80)], box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], inView: r.top >= 0 && r.bottom <= innerHeight, hidden: !!e.closest('[aria-hidden="true"],[inert]') };
        }, WARN_FN);
        order.push(f); upd(await measureLines(p), `tab${i}`);
        if (f.isSB) reached = true;
      }
      res.tab = { reached, presses: order.length, order, domOrderMonotonic: order.filter((o) => o.idx != null).every((o, i, arr) => i === 0 || o.idx > arr[i - 1].idx) };
      if (reached) {
        await p.screenshot({ path: `${out}/${tag}-2-focused.png` });
        res.focusedState = await measureLines(p);
        const sbHitNow = res.focusedState?.sbOk;
        res.tab.sbVisibleWhenFocused = sbHitNow;
        for (const k of ['ArrowUp', 'ArrowDown']) { let still = 0, last = null; for (let i = 0; i < 40 && seen.size < nLines; i++) { await p.keyboard.press(k); await sleep(120); const m = await measureLines(p); upd(m, `${k}${i}`); const sig = m ? `${m.scrollY}:${m.box[1]}` : 'x'; still = sig === last ? still + 1 : 0; last = sig; if (still >= 4) break; } }
      }
    }
    res.read = { nLines, linesSeen: seen.size, wholeMessageRead: seen.size >= nLines, allLinesAtOnce: allAtOnce, saveBackupHitTestable: sbSeen, steps: trace.length - 1, trace };
    await p.screenshot({ path: `${out}/${tag}-3-read.png` });
    // Use Save backup: bring it under the pointer/finger by the same input if needed, then a real click / tap / Enter.
    let m = await measureLines(p);
    if (method !== 'key' && !m.sbOk) {
      for (const dir of [1, -1]) for (let i = 0; i < 60 && !m.sbOk; i++) { if (method === 'touch') { a = await aim(); await touchDrag(cdp, a.x, dir > 0 ? a.y : Math.max(8, a.y - 30), -30 * dir); await sleep(150); } else { await p.mouse.wheel(0, 20 * dir); await sleep(90); } m = await measureLines(p); }
    }
    res.sbBeforeUse = { ok: m.sbOk, box: m.sbBox };
    let dl = null;
    if (method === 'key' ? res.tab?.reached : m.sbOk) {
      const ev = p.waitForEvent('download', { timeout: 8000 }).catch(() => null);
      if (method === 'key') await p.keyboard.press('Enter');
      else { const [x, y, w, h] = m.sbBox; if (method === 'touch') await p.touchscreen.tap(x + w / 2, y + h / 2); else await p.mouse.click(x + w / 2, y + h / 2); }
      dl = await ev;
    }
    if (dl) { const f = `${out}/${tag}-backup.json`; await dl.saveAs(f); const j = JSON.parse(readFileSync(f, 'utf8')); res.download = { name: dl.suggestedFilename(), bytes: statSync(f).size, sessions: j?.progress?.sessions?.length ?? null }; rmSync(f); }
    else res.download = null;
    await sleep(2500);
    res.afterUse = await p.evaluate((WF) => { const w = eval(WF)(); return { warningStill: !!w, toasts: [...document.querySelectorAll('[aria-label="Notifications"] li')].map((l) => l.textContent.slice(0, 60)) }; }, WARN_FN);
    await p.screenshot({ path: `${out}/${tag}-4-after-save.png` });
    res.obs = await p.evaluate(() => window.__obs);
  } catch (e) { res.error = String(e.message).split('\n')[0]; res.obs ??= await p.evaluate(() => window.__obs).catch(() => null); await p.screenshot({ path: `${out}/${tag}-error-state.png` }).catch(() => {}); }
  res.errors = errors.slice(0, 3);
  res.ended = new Date().toISOString();
  appendFileSync(`${out}/read-${rev}.jsonl`, JSON.stringify(res) + '\n');
  const s = res.read ? `lines ${res.read.linesSeen}/${res.read.nLines} atOnce=${res.read.allLinesAtOnce} sb=${res.read.saveBackupHitTestable}` : '';
  console.log(tag, res.error ?? '', s, res.tab ? `tab reached=${res.tab.reached} in ${res.tab.presses} mono=${res.tab.domOrderMonotonic}` : '', 'download', res.download ? res.download.name + ' sessions=' + res.download.sessions : 'NONE', 'pos', res.arrive?.pos);
  const vid = video ? p.video() : null;
  await ctx.close();
  if (vid) { try { renameSync(await vid.path(), `${out}/clip-${tag}.webm`); } catch {} rmSync(`${out}/vtmp-${tag}`, { recursive: true, force: true }); }
}
await b.close();
