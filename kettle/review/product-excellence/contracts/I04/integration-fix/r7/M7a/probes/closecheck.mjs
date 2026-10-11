// Round-7 Close probe: Break's over (with a carried task), the panel scrolled to its end by REAL input (mouse wheel or
// CDP touch drags), THREE toasts showing (raised through the app's own toast() with its default timers — labelled
// setup, as in M7b's toast check; their timers then run for real, nothing held). Every animation frame for 1.2 s:
// for Close and every Break's over control, a hit test at its centre and its box against every toast box (clipped by
// the list's scrollport). Then a REAL tap / click at one control's centre while the three toasts are still up, and a
// check that the control received it (the click's target) and did its job (route / timer state).
// Fresh context (disposable profile) per run. The debug API is used for setup only (seed, startFocus, finish).
//   node closecheck.mjs <base> <rev> <outdir> "<WxH>@<text>:<theme>[:targets],…" [how=wheel,touch]
// targets: a '+'-joined subset of close+mark+put+all (default all four, one run each).
import { chromium } from 'playwright';
import { mkdirSync, appendFileSync } from 'node:fs';
const [, , base, rev, out, cfgArg, howArg = 'wheel,touch'] = process.argv;
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NAMES = { close: '^Close$', mark: '^Mark it done', put: '^Put the kettle on', all: '^That.s all for now$' };
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
let runs = 0, bad = 0;
for (const c of cfgArg.split(',')) {
  const [dimtext, theme, tg] = c.split(':');
  const [dim, textS] = dimtext.split('@');
  const [W, H] = dim.split('x').map(Number);
  const text = +textS;
  const phone = W < 900;
  const targets = (tg ?? 'close+mark+put+all').split('+');
  for (const how of howArg.split(',')) {
    if (how === 'touch' && !phone) continue;
    for (const target of targets) {
      const tag = `${rev} ${W}x${H}@${text} ${theme} ${how} tap=${target}`;
      const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone, colorScheme: theme });
      await ctx.addInitScript((pct) => {
        try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {}
        if (pct !== 100) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); });
      }, text);
      const page = await ctx.newPage();
      const row = { tag, rev, W, H, text, theme, how, target };
      try {
        await page.goto(`${base}/?debug&seed=newbie&theme=${theme}#/`);
        await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60_000 });
        await sleep(1200);
        await page.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
        await sleep(1800);
        await page.evaluate(() => window.__kettle.nearEnd()); await sleep(400); await page.evaluate(() => window.__kettle.finish());
        const tea = page.getByRole('button', { name: /Tea time|Long tea break/ });
        await tea.waitFor({ state: 'visible', timeout: 60_000 });
        await sleep(2200);
        const tb = await tea.boundingBox();
        if (phone) await page.touchscreen.tap(tb.x + tb.width / 2, tb.y + tb.height / 2); else await page.mouse.click(tb.x + tb.width / 2, tb.y + tb.height / 2);
        await page.getByRole('button', { name: 'Pause break' }).waitFor({ state: 'attached', timeout: 20_000 });
        await sleep(1200);
        await page.evaluate(() => window.__kettle.finish());
        await page.getByRole('button', { name: /Put the kettle on/ }).waitFor({ state: 'attached' });
        // the flow's own toasts leave on their timers first
        await page.waitForFunction(() => document.querySelectorAll('[aria-label="Notifications"] li').length === 0, null, { timeout: 15_000 });
        await sleep(400);
        // scroll the panel to its end by real input
        const panelInfo = () => page.evaluate(() => { const m = document.querySelector('[data-focus-view] main'); const r = m.getBoundingClientRect(); return { st: m.scrollTop, max: m.scrollHeight - m.clientHeight, x: Math.round((r.left + r.right) / 2), y: Math.round((Math.max(0, r.top) + Math.min(innerHeight, r.bottom)) / 2) }; });
        const cdp = how === 'touch' ? await ctx.newCDPSession(page) : null;
        for (let i = 0; i < 30; i++) {
          const p = await panelInfo();
          if (p.st >= p.max - 1) break;
          if (!cdp) { await page.mouse.move(p.x, p.y); await page.mouse.wheel(0, 120); }
          else {
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y + 40 }] });
            for (let k = 1; k <= 8; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p.x, y: p.y + 40 - k * 12 }] }); await sleep(16); }
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          }
          await sleep(220);
        }
        const p1 = await panelInfo();
        row.panel = `${Math.round(p1.st)}/${p1.max}`;
        if (!cdp) await page.mouse.move(2, 2); // the pointer leaves the panel (a resting pointer would hold a toast)
        // three toasts, default timers
        await page.evaluate((N) => {
          const R = (window.__cc = { frames: 0, cov: {}, off: {}, n3: 0, stop: false, clicks: [] });
          addEventListener('click', (e) => R.clicks.push(e.target instanceof Element ? (e.target.closest('button')?.getAttribute('aria-label') || e.target.closest('button')?.textContent || e.target.tagName).trim().slice(0, 40) : '?'), { capture: true });
          const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
          const f = () => {
            if (R.stop) return;
            const ol = document.querySelector('[aria-label="Notifications"] ol');
            const lis = [...document.querySelectorAll('[aria-label="Notifications"] li')];
            let clip = null;
            if (ol && getComputedStyle(ol).overflowY !== 'visible') { const q = ol.getBoundingClientRect(); clip = { l: q.left, t: q.top, r: q.right, b: q.bottom }; }
            const toasts = lis.map((li) => { let r = li.getBoundingClientRect(); r = { l: r.left, t: r.top, r: r.right, b: r.bottom }; if (clip) r = { l: Math.max(r.l, clip.l), t: Math.max(r.t, clip.t), r: Math.min(r.r, clip.r), b: Math.min(r.b, clip.b) }; return +getComputedStyle(li).opacity > 0.02 && r.r > r.l && r.b > r.t ? r : null; }).filter(Boolean);
            if (lis.length === 3) R.n3++;
            for (const [k, n] of Object.entries(N)) {
              const el = [...document.querySelectorAll('[data-focus-view] button')].find((b) => new RegExp(n).test(norm(b.getAttribute('aria-label') || b.textContent || '')));
              if (!el) { R.off[k] = (R.off[k] || 0) + 1; continue; }
              const q = el.getBoundingClientRect();
              const vis = { t: Math.max(q.top, 0), b: Math.min(q.bottom, innerHeight) };
              if (vis.b - vis.t < 8) { R.off[k] = (R.off[k] || 0) + 1; continue; }
              const hit = document.elementFromPoint(q.left + q.width / 2, (vis.t + vis.b) / 2);
              const under = toasts.some((t) => t.b > vis.t + 1 && t.t < vis.b - 1 && t.r > q.left + 1 && t.l < q.right - 1);
              if (!(hit && el.contains(hit)) || under) R.cov[k] = (R.cov[k] || 0) + 1;
            }
            R.frames++;
            requestAnimationFrame(f);
          };
          requestAnimationFrame(f);
        }, NAMES);
        await page.evaluate(async () => {
          const { toast } = await import('/src/ui/Toast.tsx');
          for (const [m, tone] of [['Recipe done: Take 2 full tea breaks · +15 leaves', 'success'], ['Saved 12 minutes of focus', 'info'], ['Cozy level 5!', 'success']]) toast(m, { tone });
        });
        await sleep(1200);
        row.toastRects = await page.evaluate(() => [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => { const r = li.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }));
        row.region = await page.evaluate(() => { const r = document.querySelector('[aria-label="Notifications"]').parentElement.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; });
        if (target === 'close') await page.screenshot({ path: `${out}/close-${rev}-${W}x${H}-t${text}-${theme}-${how}.png` });
        // a real tap / click at the target's centre while the three toasts are up
        const el = page.getByRole('button', { name: new RegExp(NAMES[target]) }).first();
        const bb = await el.boundingBox();
        row.toastsAtTap = await page.evaluate(() => document.querySelectorAll('[aria-label="Notifications"] li').length);
        const before = await page.evaluate(() => ({ hash: location.hash, status: window.__kettle.timer.getState().status }));
        // judged up to the tap (afterwards the screen changes by design)
        const R0 = await page.evaluate(() => { window.__cc.stop = true; return { frames: window.__cc.frames, n3: window.__cc.n3, cov: window.__cc.cov, off: window.__cc.off }; });
        if (phone) await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); else await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
        await sleep(900);
        const R = { ...R0, clicks: await page.evaluate(() => window.__cc.clicks) };
        const after = await page.evaluate(() => ({ hash: location.hash, status: window.__kettle.timer.getState().status, phase: window.__kettle.timer.getState().phase, markLine: [...document.querySelectorAll('[data-focus-view] button, [data-focus-view] p')].map((e) => e.textContent).find((t) => /Mark it done|Marked|crossed|done/i.test(t ?? '')) ?? null }));
        row.frames = R.frames; row.framesWith3 = R.n3; row.covered = R.cov; row.offscreen = R.off; row.clicks = R.clicks;
        row.tapReceived = R.clicks.some((t) => new RegExp(NAMES[target].replace('^', '').replace('$', ''), 'i').test(t.replace(/[’‘]/g, "'")));
        row.before = before; row.after = after;
        row.ok = row.tapReceived && Object.keys(R.cov).length === 0 && row.toastsAtTap === 3;
      } catch (e) { row.error = String(e.message).split('\n')[0]; row.ok = false; }
      runs++; if (!row.ok) bad++;
      appendFileSync(`${out}/closecheck-${rev}.jsonl`, JSON.stringify(row) + '\n');
      console.log(`${tag}: ${row.ok ? 'OK' : 'FAIL'} | panel ${row.panel} | toasts at tap ${row.toastsAtTap} | frames ${row.frames} (with 3 toasts ${row.framesWith3}) | covered ${JSON.stringify(row.covered)} | off-screen ${JSON.stringify(row.offscreen)} | tap received ${row.tapReceived} (${JSON.stringify(row.clicks)}) | ${JSON.stringify(row.before)} → ${JSON.stringify(row.after)}${row.error ? ' | ERROR ' + row.error : ''}`);
      await ctx.close();
    }
  }
}
await browser.close();
console.log(`${rev}: ${bad} failing runs of ${runs}`);
