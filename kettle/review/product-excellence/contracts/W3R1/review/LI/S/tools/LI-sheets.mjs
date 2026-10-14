// Counts only open dialogs: `[role=dialog][aria-modal=true]` (Sheet.tsx sets aria-modal only while present; a dialog
// in its exit animation is not counted. Run 1 counted exiting ones too, which misread slow exits at 1440.)
// Lane I (W3R1, maker S): every Sheet/Dialog, and "Delete this brew?" (F-T2-4) in detail. One browser per run.
//   node LI-sheets.mjs <url> <label> <outDir> <mode: dlg|all> <cfgs: 375x667:light:200,...>
// Frozen clock 2026-10-12T07:40Z then resume(). Seed veteran. Phones (w<900): hasTouch + isMobile, real taps;
// 1440: mouse. Real Tab / Shift+Tab / Enter / Escape. DPR 1, en-GB, UTC.
import { chromium } from 'playwright';
import fs from 'node:fs';

const [url, label, outRoot, mode, cfgArg] = process.argv.slice(2);
const out = `${outRoot}/${label}`;
fs.mkdirSync(out, { recursive: true });
const FIXED = Date.parse('2026-10-12T07:40:00.000Z');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const results = [];
const log = (o) => { const s = JSON.stringify(o); console.log(s); fs.appendFileSync(`${out}/log.jsonl`, s + '\n'); };

async function open({ w, h, theme, pct, route = '/stats', seed = 'veteran' }) {
  const phone = w < 900;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', hasTouch: phone, isMobile: phone, serviceWorkers: 'block', acceptDownloads: true });
  if (pct !== 100) await ctx.addInitScript((p) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${p}%!important}`; document.head.appendChild(s); }), pct);
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('kettle:settings')) localStorage.setItem('kettle:settings', JSON.stringify({ state: { onboarded: true, scene: 'off', autoStartBreaks: false, autoStartFocus: false, muted: true }, version: 1 })); } catch {} });
  const page = await ctx.newPage();
  await page.clock.install({ time: FIXED });
  await page.clock.resume();
  await page.goto(`${url}/?debug&seed=${seed}&theme=${theme}#${route}`);
  await page.waitForFunction(() => !!window.__kettle?.timerInfo, null, { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await sleep(900);
  return { ctx, page, phone };
}
const go = async (page, route) => { await page.evaluate((r) => window.__kettle.navigate(r), route); await page.waitForFunction(() => !document.querySelector('[data-route-leaving]'), null, { timeout: 10000 }).catch(() => {}); await sleep(900); };
const press = async (page, phone, loc) => { await loc.scrollIntoViewIfNeeded(); if (phone) await loc.tap(); else await loc.click(); };
const nDialogs = (page) => page.evaluate(() => document.querySelectorAll('[role=dialog][aria-modal=true]').length);
const active = (page) => page.evaluate(() => {
  const a = document.activeElement;
  const top = [...document.querySelectorAll('[role=dialog][aria-modal=true]')].pop();
  const r = a?.getBoundingClientRect();
  const name = (a?.getAttribute('aria-label') || a?.innerText || a?.tagName || '').replace(/\s+/g, ' ').trim().slice(0, 34);
  const scroller = a && a.scrollHeight > a.clientHeight + 1 && getComputedStyle(a).overflowY !== 'visible';
  return { name, tag: a?.tagName, inTop: !!top && top.contains(a), dlg: top ? document.getElementById(top.getAttribute('aria-labelledby'))?.textContent : null, scroller, onScreen: !!r && r.bottom > 0 && r.top < innerHeight };
});
const viewportFacts = (page) => page.evaluate(() => ({ iw: innerWidth, ih: innerHeight, sw: document.documentElement.scrollWidth, vvw: Math.round(visualViewport.width), vvs: +visualViewport.scale.toFixed(3) }));

// Every button in the top dialog: on screen, on top at its centre, not clipped; or, inside a scroller, reachable after
// scrolling it into view (then put back).
const buttonFacts = (page) => page.evaluate(async () => {
  const top = [...document.querySelectorAll('[role=dialog][aria-modal=true]')].pop();
  if (!top) return null;
  const title = document.getElementById(top.getAttribute('aria-labelledby'))?.textContent;
  const isScroller = (el) => { const cs = getComputedStyle(el); return /(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1; };
  const check = (btn) => {
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (r.top < -0.5 || r.bottom > innerHeight + 0.5 || r.left < -0.5 || r.right > innerWidth + 0.5) return `off ${Math.round(r.top)}–${Math.round(r.bottom)}/${innerHeight}`;
    for (let a = btn.parentElement; a && a !== document.body; a = a.parentElement) {
      if (getComputedStyle(a).overflowY !== 'visible') { const ar = a.getBoundingClientRect(); if (cy < ar.top - 0.5 || cy > ar.bottom + 0.5) return 'clipped'; }
    }
    const hit = document.elementFromPoint(cx, cy);
    return hit && (hit === btn || btn.contains(hit)) ? 'ok' : `covered:${hit?.tagName}.${(hit?.className || '').toString().slice(0, 20)}`;
  };
  const out = [];
  for (const btn of top.querySelectorAll('button, a[href], input, [role=radio], [role=switch]')) {
    const r0 = btn.getBoundingClientRect();
    if (r0.width < 1 || btn.closest('[aria-hidden=true]')) continue;
    const name = (btn.getAttribute('aria-label') || btn.innerText || btn.value || btn.tagName).replace(/\s+/g, ' ').trim().slice(0, 30);
    let at = check(btn), via = null;
    if (at !== 'ok') {
      const sc = []; for (let a = btn.parentElement; a && a !== document.body; a = a.parentElement) if (isScroller(a)) sc.push([a, a.scrollTop]);
      if (sc.length) { btn.scrollIntoView({ block: 'nearest' }); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); const at2 = check(btn); via = `scroll→${at2}`; for (const [a, t] of sc) a.scrollTop = t; }
    }
    out.push({ name, at, via, ok: at === 'ok' || (via || '').endsWith('ok') });
  }
  // Scrolling reaches all content: scroll every scroller inside the dialog to its end; the last non-footer content
  // element must then be visible above the footer.
  const scs = [top, ...top.querySelectorAll('*')].filter(isScroller);
  const saved = scs.map((a) => [a, a.scrollTop]);
  for (const a of scs) a.scrollTop = a.scrollHeight;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const footer = top.querySelector('[class*="footer"]');
  const leaves = [...top.querySelectorAll('p, li, button, h2, h3, label, span, svg, img')].filter((e) => !footer?.contains(e) && e.getBoundingClientRect().height > 0 && !e.closest('[aria-hidden=true]'));
  const last = leaves.sort((a, b) => a.getBoundingClientRect().bottom - b.getBoundingClientRect().bottom).pop();
  const lr = last?.getBoundingClientRect();
  const fr = footer?.getBoundingClientRect();
  const limit = Math.min(innerHeight, fr ? fr.top : innerHeight);
  const lastVisible = lr ? lr.bottom <= limit + 1.5 : null;
  const lastText = last ? (last.getAttribute?.('aria-label') || last.textContent || last.tagName).replace(/\s+/g, ' ').trim().slice(0, 30) : null;
  for (const [a, t] of saved) a.scrollTop = t;
  const pr = top.getBoundingClientRect();
  return {
    title, tight: top.hasAttribute('data-tight'), panel: [Math.round(pr.top), Math.round(pr.bottom)], vh: innerHeight,
    scrollers: scs.map((a) => `${(a.className || a.tagName).toString().replace(/_[a-z0-9]{5}_\d+/g, '').slice(0, 24)} ${a.clientHeight}/${a.scrollHeight}`),
    footer: fr ? { top: Math.round(fr.top), bottom: Math.round(fr.bottom), onScreen: fr.top >= -0.5 && fr.bottom <= innerHeight + 0.5, position: getComputedStyle(footer).position } : null,
    lastText, lastBottom: lr ? Math.round(lr.bottom) : null, limit: Math.round(limit), lastVisible,
    buttons: out,
  };
});
const walk = async (page, key, n) => { const seq = []; for (let i = 0; i < n; i++) { await page.keyboard.press(key); await sleep(60); seq.push(await active(page)); } return seq; };
// A point on the backdrop: outside the top panel, inside the viewport, and the element there is not inside the panel.
const outsidePoint = (page) => page.evaluate(() => {
  const top = [...document.querySelectorAll('[role=dialog][aria-modal=true]')].pop();
  const pts = [];
  for (const fy of [0.02, 0.05, 0.1, 0.2, 0.5, 0.8, 0.95]) for (const fx of [0.02, 0.5, 0.98]) pts.push([Math.round(innerWidth * fx), Math.round(innerHeight * fy)]);
  for (const [x, y] of pts) { const el = document.elementFromPoint(x, y); if (el && !top.contains(el)) return { x, y, el: `${el.tagName}.${(el.className || '').toString().replace(/_[a-z0-9]{5}_\d+/g, '').slice(0, 24)}` }; }
  return null;
});

async function battery(page, phone, id, file, opener) {
  const r = { id };
  const before = await nDialogs(page);
  await opener();
  await page.waitForFunction((n) => document.querySelectorAll('[role=dialog][aria-modal=true]').length > n, before, { timeout: 8000 });
  await sleep(900);
  r.dialogs = await nDialogs(page);
  r.initial = await active(page);
  r.facts = await buttonFacts(page);
  r.vp = await viewportFacts(page);
  await page.screenshot({ path: `${file}.png` });
  const nf = Math.min(14, (r.facts?.buttons.length ?? 3) + 2);
  r.tab = await walk(page, 'Tab', nf);
  r.shiftTab = await walk(page, 'Shift+Tab', nf);
  r.trapTab = r.tab.every((x) => x.inTop);
  r.trapShift = r.shiftTab.every((x) => x.inTop);
  r.tabMoves = new Set(r.tab.map((x) => x.name)).size > 1;
  // Escape: only the top one closes; focus goes back.
  await page.keyboard.press('Escape'); await sleep(800);
  r.esc = { dialogsAfter: await nDialogs(page), focus: await active(page) };
  // Reopen; click / tap outside.
  if (r.esc.dialogsAfter < r.dialogs) {
    await opener();
    await page.waitForFunction((n) => document.querySelectorAll('[role=dialog][aria-modal=true]').length > n, r.esc.dialogsAfter, { timeout: 8000 });
    await sleep(900);
    const pt = await outsidePoint(page);
    r.outside = { pt };
    if (pt) {
      if (phone) await page.touchscreen.tap(pt.x, pt.y); else await page.mouse.click(pt.x, pt.y);
      await sleep(900);
      r.outside.dialogsAfter = await nDialogs(page);
      r.outside.focus = await active(page);
      r.outside.titles = await page.evaluate(() => [...document.querySelectorAll('[role=dialog][aria-modal=true]')].map((d) => document.getElementById(d.getAttribute('aria-labelledby'))?.textContent));
      await page.screenshot({ path: `${file}-after-outside.png` });
      // Still open: close it with Escape so the rest of the run starts from the same place.
      if (r.outside.dialogsAfter > r.esc.dialogsAfter) { await page.keyboard.press('Escape'); await sleep(800); r.outside.escAfter = await nDialogs(page); }
    }
  }
  // Leave only what this sheet's parent had.
  for (let i = 0; i < 3 && (await nDialogs(page)) > before; i++) { await page.keyboard.press('Escape'); await sleep(600); }
  return r;
}

const cfgs = cfgArg.split(',').map((c) => { const m = c.match(/^(\d+)x(\d+):(light|dark):(\d+)$/); return { w: +m[1], h: +m[2], theme: m[3], pct: +m[4], key: c.replace(/:/g, '-') }; });

for (const cfg of cfgs) {
  if (mode === 'dlg') {
    // F-T2-4 in detail.
    const { ctx, page, phone } = await open(cfg);
    const r = { cfg: cfg.key };
    try {
      await page.getByRole('heading', { name: 'Stats', level: 1 }).waitFor();
      r.vpStats = await viewportFacts(page);
      const n0 = await page.evaluate(() => window.__kettle.progress.getState().sessions.length);
      const row = page.locator('[data-session-row] button').first();
      await press(page, phone, row);
      await page.getByRole('dialog', { name: 'Edit brew' }).waitFor({ timeout: 8000 });
      await sleep(800);
      const del = page.getByRole('button', { name: 'Delete this brew' });
      const openDel = async () => { await press(page, phone, del); await page.getByRole('dialog', { name: 'Delete this brew?' }).waitFor({ timeout: 8000 }); await sleep(900); };
      const b = await battery(page, phone, 'delete', `${out}/${cfg.key}-dialog`, openDel);
      Object.assign(r, b);
      // Keep it by keyboard: opener focused (Escape returned there?) → Enter opens → Enter on Keep it.
      await del.focus(); await page.keyboard.press('Enter');
      r.kbOpen = await page.getByRole('dialog', { name: 'Delete this brew?' }).waitFor({ timeout: 5000 }).then(() => true, () => false);
      await sleep(900);
      r.kbInitial = await active(page);
      await page.keyboard.press('Enter'); await sleep(800); // Enter on the initial focus (Keep it)
      r.kbKeep = { dialogs: await nDialogs(page), focus: await active(page), sessions: await page.evaluate(() => window.__kettle.progress.getState().sessions.length) };
      // Keep it by tap/click.
      await openDel();
      await press(page, phone, page.getByRole('dialog', { name: 'Delete this brew?' }).getByRole('button', { name: 'Keep it' }));
      await sleep(800);
      r.ptrKeep = { dialogs: await nDialogs(page), focus: await active(page), sessions: await page.evaluate(() => window.__kettle.progress.getState().sessions.length) };
      // Delete by keyboard: Tab to Delete, Enter.
      await openDel();
      await page.keyboard.press('Tab'); const onDel = await active(page);
      await page.keyboard.press('Enter'); await sleep(1000);
      r.kbDelete = { tabbedTo: onDel.name, dialogs: await nDialogs(page), focus: await active(page), sessions: await page.evaluate(() => window.__kettle.progress.getState().sessions.length), undo: await page.getByRole('button', { name: /Undo/ }).count() };
      await page.screenshot({ path: `${out}/${cfg.key}-after-kb-delete.png` });
      // Delete by tap/click on the next brew (from a clean page: whatever is still open is closed first).
      for (let i = 0; i < 3 && (await nDialogs(page)); i++) { await page.keyboard.press('Escape'); await sleep(600); }
      await press(page, phone, page.locator('[data-session-row] button').first());
      await page.getByRole('dialog', { name: 'Edit brew' }).waitFor({ timeout: 8000 }); await sleep(800);
      await openDel();
      await press(page, phone, page.getByRole('dialog', { name: 'Delete this brew?' }).getByRole('button', { name: 'Delete', exact: true }));
      await sleep(1000);
      r.ptrDelete = { dialogs: await nDialogs(page), focus: await active(page), sessions: await page.evaluate(() => window.__kettle.progress.getState().sessions.length) };
      r.n0 = n0;
    } catch (e) { r.error = e.message.split('\n').slice(0, 2).join(' | ').slice(0, 300); await page.screenshot({ path: `${out}/${cfg.key}-ERROR.png` }).catch(() => {}); }
    const btn = (n) => (r.facts && r.facts.buttons ? (r.facts.buttons.find((x) => x.name === n) || {}).at : undefined);
    const fm = (o) => (o ? `${o.dialogs}:${o.focus.name}:${o.sessions}` : undefined);
    const summary = { cfg: cfg.key, keep: btn('Keep it'), del: btn('Delete'), tight: r.facts && r.facts.tight };
    summary.tab = r.tab ? r.tab.map((x) => x.name).join(' > ') : undefined;
    summary.shift = r.shiftTab ? r.shiftTab.map((x) => x.name).join(' < ') : undefined;
    summary.trap = [r.trapTab, r.trapShift];
    summary.esc = r.esc ? `${r.esc.dialogsAfter}:${r.esc.focus.name}` : undefined;
    summary.outside = r.outside ? `${r.outside.pt && r.outside.pt.el}@${r.outside.pt && r.outside.pt.x},${r.outside.pt && r.outside.pt.y}->${r.outside.dialogsAfter}:${r.outside.focus && r.outside.focus.name}` : undefined;
    summary.kbKeep = r.kbKeep ? `${r.kbInitial && r.kbInitial.name}->${fm(r.kbKeep)}` : undefined;
    summary.ptrKeep = fm(r.ptrKeep);
    summary.kbDel = r.kbDelete ? `${r.kbDelete.tabbedTo}->${fm(r.kbDelete)}/${r.n0} undo${r.kbDelete.undo}` : undefined;
    summary.ptrDel = fm(r.ptrDelete);
    summary.vp = r.vpStats; summary.error = r.error;
    log(summary);
    results.push(r);
    await ctx.close();
    continue;
  }
  // mode all: every Sheet/Dialog.
  const { ctx, page, phone } = await open({ ...cfg, route: '/' });
  const P = (loc) => press(page, phone, loc);
  const SHEETS = [
    { id: 'today-warm', route: '/', open: () => P(page.locator('nav[aria-label="Your progress"] button[data-kind=streak]')) },
    { id: 'today-leaves', route: '/', open: () => P(page.locator('nav[aria-label="Your progress"] button[data-kind=leaves]')) },
    { id: 'today-level', route: '/', open: () => P(page.locator('nav[aria-label="Your progress"] button[data-kind=level]')) },
    { id: 'today-rhythm', route: '/', open: async () => { const l = page.getByRole('button', { name: /brew length/i }).first(); if (await l.count()) { await P(l); await sleep(500); } await P(page.getByRole('radio', { name: /Custom|Set it/ }).first()); } },
    { id: 'shortcuts', route: '/', open: () => page.keyboard.press('Shift+Slash') },
    { id: 'settings-reset', route: '/settings', open: () => P(page.getByRole('button', { name: /^Reset everything/ })) },
    { id: 'settings-import', route: '/settings', open: async () => {
      if (!fs.existsSync(`${out}/backup.json`)) { const [dl] = await Promise.all([page.waitForEvent('download'), P(page.getByRole('button', { name: /^Export a backup/ }))]); await dl.saveAs(`${out}/backup.json`); await sleep(500); }
      await page.locator('input[type=file]').setInputFiles(`${out}/backup.json`);
    } },
    { id: 'stats-badge', route: '/stats', open: () => P(page.locator('button[aria-label*="tier"], button[aria-label*="earned"]').first()) },
    { id: 'stats-edit', route: '/stats', open: () => P(page.locator('[data-session-row] button').first()) },
    { id: 'stats-delete-over-edit', route: '/stats', pre: async () => { await P(page.locator('[data-session-row] button').first()); await page.getByRole('dialog', { name: 'Edit brew' }).waitFor(); await sleep(800); }, open: () => P(page.getByRole('button', { name: 'Delete this brew' })) },
    { id: 'focus-ambience', route: 'focus', open: () => P(page.getByRole('button', { name: /^Ambience:/ }).first()) },
    { id: 'focus-end', route: 'focus', open: () => P(page.getByRole('button', { name: 'End session' }).first()) },
  ];
  let inFocus = false;
  for (const sh of SHEETS) {
    let r = { cfg: cfg.key, id: sh.id };
    try {
      if (sh.route === 'focus') {
        if (!inFocus) { await go(page, '/'); await P(page.getByRole('button', { name: /^Put the kettle on/ }).first()); await page.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15000 }); await sleep(1500); inFocus = true; }
      } else await go(page, sh.route);
      if (sh.pre) await sh.pre();
      r = { ...r, ...(await battery(page, phone, sh.id, `${out}/${cfg.key}-${sh.id}`, sh.open)) };
      if (sh.pre) { r.parentLeft = await nDialogs(page); for (let i = 0; i < 3 && (await nDialogs(page)); i++) { await page.keyboard.press('Escape'); await sleep(600); } }
    } catch (e) { r.error = e.message.split('\n').slice(0, 2).join(' | ').slice(0, 300); await page.screenshot({ path: `${out}/${cfg.key}-${sh.id}-ERROR.png` }).catch(() => {}); for (let i = 0; i < 3 && (await nDialogs(page)); i++) { await page.keyboard.press('Escape'); await sleep(500); } }
    const bad = r.facts?.buttons?.filter((x) => !x.ok).map((x) => `${x.name}:${x.at}${x.via ? '/' + x.via : ''}`);
    log({ cfg: cfg.key, id: sh.id, tight: r.facts?.tight, bad, footer: r.facts?.footer && `${r.facts.footer.top}-${r.facts.footer.bottom}${r.facts.footer.onScreen ? '' : ' OFF'}`, lastVisible: r.facts?.lastVisible, last: r.facts?.lastText, trap: [r.trapTab, r.trapShift], moves: r.tabMoves, esc: r.esc && `${r.dialogs}→${r.esc.dialogsAfter}:${r.esc.focus.name}`, outside: r.outside && `${r.outside.pt?.el}→${r.outside.dialogsAfter}:${r.outside.focus?.name}`, error: r.error });
    results.push(r);
  }
  await ctx.close();
}
fs.writeFileSync(`${out}/results-${mode}.json`, JSON.stringify(results, null, 1));
await browser.close();
