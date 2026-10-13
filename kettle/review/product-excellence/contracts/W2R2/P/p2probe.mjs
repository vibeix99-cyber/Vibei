// W2R2 Maker P — summary probe: same context as r2before.mjs (frozen clock + resume, fresh profile per day, the
// same seeds and start path), plus the facts P is graded on, measured from the live DOM of either build:
//   - Chai's and the kettle's boxes (and their painted ink) against the sheet's top, on arrival and settled;
//   - hierarchy: the heading, Tea time and the highlight/unlock card (size, weight, fill contrast vs the sheet);
//   - copy: every "streak" on the summary (visible text, screen-reader-only text, aria-labels, the announcement);
//   - the fold: every line of the sheet (data-fold, text lines by their ink) vs the scroll area's 14 px bottom fade;
//   - the end state: real click on "How your leaves added up", real wheel to the end, last line vs the footer.
// One browser per invocation (run under the slot gate).
//   node p2probe.mjs --base http://127.0.0.1:5430 --side BEFORE --out <dir> --cfg 375x667@2:light:100 [--days routine,task,big,k02,best]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const FIXED = Date.parse(args.at ?? '2026-10-11T07:40:00.000Z');
const m = args.cfg.match(/^(\d+)x(\d+)@(\d+):(light|dark):(\d+)$/);
const [W, H, DPR, theme, text] = [+m[1], +m[2], +m[3], m[4], +m[5]];
// --runs BEFORE@http://127.0.0.1:5430,AFTER@http://127.0.0.1:5432 (several builds, one browser) or --side/--base (one)
const RUNS = (args.runs ?? `${args.side}@${args.base}`).split(',').map((x) => { const [side, base] = [x.slice(0, x.indexOf('@')), x.slice(x.indexOf('@') + 1)]; const dir = `${args.out}/${side}/${W}x${H}-${theme}-t${text}`; mkdirSync(dir, { recursive: true }); return { side, base, dir, meta: null }; });
// --par 1: every (build, day) page at once in the one browser (the probe's waits are mostly idle time)
const PAR = args.par === '1';
// --par pair: day by day, the same day in every build at once (BEFORE and AFTER side by side, the same moment)
const PAIR = args.par === 'pair';
const mobile = W < 900;
const days = (args.days ?? 'routine,task,big').split(',');
const shots = args.shots !== 'no';
// day → [seed, task?, capture name] (routine / task / big = r2before's 08 / 04 / 09; k02 = the K02 + Wave-1 #1 day; best = I07 milestone day)
const DAY = {
  routine: ['veteran', false, '08-summary-routine'],
  task: ['newbie', true, '04-summary-task'],
  big: ['celebrate', false, '09-summary-bigday'],
  k02: ['veteran', true, '12-summary-k02-task'],
  best: ['atRisk', false, '13-summary-best'],
};
for (const R of RUNS) R.meta = { base: R.base, side: R.side, parallel: PAIR ? 'pair' : PAR, viewport: { w: W, h: H }, dpr: DPR, theme, text: `${text}%`, fixedTime: new Date(FIXED).toISOString(), days: {}, errors: [] };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });

async function context(meta) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: mobile && W < H, hasTouch: mobile, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
  const p = await ctx.newPage();
  await p.clock.install({ time: FIXED });
  await p.clock.resume();
  p.on('pageerror', (e) => meta.errors.push(e.message.slice(0, 200)));
  return { ctx, p };
}
const ready = (p) => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 }).catch(() => {});

// Everything measured in the page. Kept self-contained (runs in the browser).
const measure = (p) => p.evaluate(() => {
  const R = (r) => ({ l: +r.left.toFixed(1), t: +r.top.toFixed(1), r: +r.right.toFixed(1), b: +r.bottom.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) });
  const region = document.querySelector('[role=region][aria-labelledby]');
  if (!region) return { error: 'no summary' };
  const sc = region.firstElementChild;
  const sheet = sc.firstElementChild;
  const footer = region.querySelector('footer');
  const scR = sc.getBoundingClientRect();
  const sheetR = sheet.getBoundingClientRect();
  // the stage figures
  const chai = document.querySelector('[data-pose]');
  const kettle = chai?.parentElement?.querySelector('svg[data-state]');
  const plate = kettle?.querySelector('path[class*="plate"]');
  const chaiImg = chai?.querySelector('img');
  const stage = chai?.closest('[data-state]');
  const fig = (el) => (el ? R(el.getBoundingClientRect()) : null);
  // Chai's painted image (its own box, inside the stage's Chai box) and the kettle's burner plate (the kettle's lowest ink)
  const ci = chaiImg?.getBoundingClientRect();
  const sheetTop = sheetR.top;
  const stack = sheet.offsetTop > 0; // stacked (phone portrait): the sheet rests over the stage
  const figs = { chai: fig(chai), chaiImg: ci ? R(ci) : null, kettle: fig(kettle), kettlePlate: fig(plate), stage: fig(stage) };
  const clear = stack && figs.chai && figs.kettle ? { chai: +(sheetTop - figs.chai.b).toFixed(1), kettle: +(sheetTop - figs.kettle.b).toFixed(1), chaiInk: figs.chaiImg ? +(sheetTop - figs.chaiImg.b).toFixed(1) : null, kettleInk: figs.kettlePlate ? +(sheetTop - figs.kettlePlate.b).toFixed(1) : null } : null;
  // hierarchy
  const lum = (c) => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, b2] = m.slice(0, 3).map((v) => { v = +v / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b2; };
  const contrast = (a, b2) => { const x = lum(a), y = lum(b2); if (x == null || y == null) return null; const [hi, lo] = x > y ? [x, y] : [y, x]; return +((hi + 0.05) / (lo + 0.05)).toFixed(2); };
  const sheetBg = getComputedStyle(sheet).backgroundColor !== 'rgba(0, 0, 0, 0)' ? getComputedStyle(sheet).backgroundColor : getComputedStyle(footer).backgroundColor;
  const edgeOf = (el) => { const bs = getComputedStyle(el).boxShadow; const mm = bs.match(/rgba?\([^)]*\)/); return mm ? mm[0] : null; };
  const fillOf = (cs) => (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? cs.backgroundColor : (cs.backgroundImage.match(/rgba?\([^)]*\)/g) ?? []).at(-1) ?? cs.backgroundColor);
  const styleOf = (el, txt) => { if (!el) return null; const cs = getComputedStyle(el); const t = txt ? getComputedStyle(txt) : cs; const r = el.getBoundingClientRect(); const bg = fillOf(cs); return { box: R(r), area: Math.round(r.width * r.height), bg, fillContrast: bg === 'rgba(0, 0, 0, 0)' ? 1 : contrast(bg, sheetBg), edge: edgeOf(el), edgeContrast: edgeOf(el) ? contrast(edgeOf(el), sheetBg) : null, font: `${t.fontWeight} ${t.fontSize} ${t.fontFamily.split(',')[0]}`, fontPx: parseFloat(t.fontSize), weight: +t.fontWeight, ink: t.color, inkContrast: contrast(t.color, bg !== 'rgba(0, 0, 0, 0)' ? bg : sheetBg) }; };
  const h1 = region.querySelector('h1');
  const cta = region.querySelector('[data-done-cta]');
  const hl = region.querySelector('[data-highlight]');
  const unlock = region.querySelector('section[aria-label^="Cozy level"]');
  const hier = {
    heading: styleOf(h1), cta: styleOf(cta, cta?.querySelector('span') ?? cta), ctaFace: cta?.firstElementChild ? styleOf(cta.firstElementChild) : null,
    highlight: hl ? styleOf(hl, hl.querySelector('[class*="highlightTitle"]')) : null,
    highlightNote: hl?.querySelector('[class*="highlightNote"]') ? styleOf(hl.querySelector('[class*="highlightNote"]')) : null,
    highlightArt: hl?.querySelector('[class*="highlightArt"]') ? R(hl.querySelector('[class*="highlightArt"]').getBoundingClientRect()) : null,
    unlock: unlock ? styleOf(unlock, unlock.querySelector('h2')) : null,
    pill: region.querySelector('li[data-kind]:not([data-highlight])') ? styleOf(region.querySelector('li[data-kind]:not([data-highlight])')) : null,
    sheetBg,
  };
  // copy: every "streak"
  const visibleText = (root) => { const out = []; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const el = n.parentElement; if (el.closest('.sr-only,[aria-hidden="true"],[hidden]')) continue; out.push(n.textContent); } return out.join(' '); };
  const srText = (root) => [...root.querySelectorAll('.sr-only')].map((e) => e.textContent).join(' | ');
  // labels a screen reader can reach (not inside an aria-hidden subtree), and those it cannot (art, for the record)
  const labels = [...region.querySelectorAll('[aria-label]')].filter((e) => !e.closest('[aria-hidden="true"]')).map((e) => e.getAttribute('aria-label'));
  const hiddenLabels = [...region.querySelectorAll('[aria-label]')].filter((e) => e.closest('[aria-hidden="true"]')).map((e) => e.getAttribute('aria-label'));
  const status = [...region.querySelectorAll('[role=status]')].map((e) => e.textContent).join(' | ');
  const count = (s) => (s.match(/streak/gi) ?? []).length;
  const vis = visibleText(sheet) + ' ' + visibleText(footer);
  const copy = { visible: count(vis), visibleHits: (vis.match(/[^.]*streak[^.]*/gi) ?? []).map((x) => x.trim().slice(0, 90)), srOnly: count(srText(region)), srHits: (srText(region).match(/[^|]*streak[^|]*/gi) ?? []).map((x) => x.trim()), ariaLabels: labels.filter((x) => /streak/i.test(x)), hiddenArtLabels: hiddenLabels.filter((x) => /streak/i.test(x)), announce: status, announceStreak: count(status), textContentTotal: count(region.textContent), allSummaryText: region.textContent.replace(/\s+/g, ' ').slice(0, 900) };
  // the fold
  const FADE = 14, PEEK = 6;
  let ctx2; const ink = (el) => { ctx2 ??= document.createElement('canvas').getContext('2d'); const t = el.textContent?.trim(); if (!t) return { top: 0, bottom: 0 }; const cs = getComputedStyle(el); ctx2.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; const mm = ctx2.measureText(t); if (!mm.fontBoundingBoxAscent) return { top: 0, bottom: 0 }; return { top: Math.max(0, mm.fontBoundingBoxAscent - mm.actualBoundingBoxAscent), bottom: Math.max(0, mm.fontBoundingBoxDescent - mm.actualBoundingBoxDescent) }; };
  const fold = scR.bottom;
  const lines = [];
  for (const el of sheet.querySelectorAll('[data-fold]')) {
    const name = (el.textContent || el.getAttribute('aria-label') || el.tagName).replace(/\s+/g, ' ').trim().slice(0, 40);
    if (el.dataset.fold === 'lines') {
      const k = ink(el); const range = document.createRange(); range.selectNodeContents(el);
      const rows = [];
      for (const r of [...range.getClientRects()].filter((x) => x.width > 0.5 && x.height > 0.5).sort((a, c) => a.top - c.top)) { const last = rows.at(-1); if (last && r.top < last.bottom - Math.min(r.height, last.bottom - last.top) / 2) last.bottom = Math.max(last.bottom, r.bottom); else rows.push({ top: r.top, bottom: r.bottom }); }
      rows.forEach((r, i) => lines.push({ name: `${name}#${i}`, t: r.top + k.top, b: r.bottom - k.bottom, peek: 0 }));
    } else { const r = el.getBoundingClientRect(); if (r.height > 0.5) lines.push({ name, t: r.top, b: r.bottom, peek: PEEK }); }
  }
  const cut = lines.filter((l) => !(l.b <= fold - FADE + 0.5 || l.t >= fold - l.peek - 0.5)).map((l) => ({ name: l.name, t: +l.t.toFixed(1), b: +l.b.toFixed(1) }));
  const above = lines.filter((l) => l.b <= fold - FADE + 0.5).map((l) => l.name);
  const pills = [...region.querySelectorAll('[aria-label="Rewards"] li')].map((li) => ({ text: li.innerText.replace(/\s+/g, ' ').trim().slice(0, 70), hl: li.hasAttribute('data-highlight'), box: R(li.getBoundingClientRect()) }));
  return {
    stacked: stack, sheetRest: sheet.offsetTop, scrollTop: Math.round(sc.scrollTop), sheetPadTop: parseFloat(getComputedStyle(sheet).paddingTop), sheetTop: +sheetTop.toFixed(1), scroll: R(scR), footer: R(footer.getBoundingClientRect()),
    figs, clear, hier, copy, fold: { at: +fold.toFixed(1), fadeTop: +(fold - FADE).toFixed(1), cut, wholeAbove: above.length, lines: lines.length, all: lines.map((l) => [l.name, +(l.t - scR.top + sc.scrollTop).toFixed(1), +(l.b - scR.top + sc.scrollTop).toFixed(1), l.peek]), h: sc.clientHeight }, pills,
    heading: R(h1.getBoundingClientRect()), headingInView: h1.getBoundingClientRect().top >= 0 && h1.getBoundingClientRect().bottom <= fold,
    ctaHit: (() => { const r = cta.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!(e && (e === cta || cta.contains(e))); })(),
    skipHit: (() => { const s = [...footer.querySelectorAll('button')].find((x) => /Skip/.test(x.textContent)); if (!s) return null; const r = s.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!(e && (e === s || s.contains(e))); })(),
  };
});

async function day(name, R) {
  const { dir, meta } = R;
  const [seed, task, cap] = DAY[name];
  const { ctx, p } = await context(meta);
  const rec = { seed, task };
  try {
    await p.goto(`${R.base}/?debug&seed=${seed}&theme=${theme}#/`); await ready(p); await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false })); await sleep(1200);
    if (task) { const f = p.getByRole('textbox', { name: /What are you brewing/ }); await f.click(); await p.keyboard.type('Chapter 3 notes'); await p.keyboard.press('Escape').catch(() => {}); }
    const start = p.getByRole('button', { name: /^Put the kettle on/i }).first(); await start.scrollIntoViewIfNeeded(); await start.click();
    await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15_000 }); await sleep(2500);
    await p.evaluate(() => window.__kettle.finish());
    await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 90_000 });
    const t0 = Date.now();
    await sleep(1500); rec.arrival = await measure(p); if (shots) await p.screenshot({ path: `${dir}/${cap}.png`, animations: 'disabled', timeout: 90_000 });
    await sleep(Math.max(0, 4500 - (Date.now() - t0))); rec.settled = await measure(p); if (shots) await p.screenshot({ path: `${dir}/${cap}-settled.png`, animations: 'disabled', timeout: 90_000 });
    if (shots) await p.screenshot({ path: `${dir}/${cap}-full.png`, animations: 'disabled', fullPage: true, timeout: 90_000 });
    // the end: real click on the arithmetic toggle, real wheel to the end
    const tog = p.getByRole('button', { name: 'How your leaves added up' });
    const sc = p.locator('[role=region][aria-labelledby] > div').first();
    const box = await sc.boundingBox();
    await p.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height - 20, box.height * 0.8));
    for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 300); await sleep(120); }
    await tog.click({ timeout: 15_000 });
    await sleep(300);
    for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 400); await sleep(120); }
    await sleep(500);
    rec.end = await p.evaluate(() => {
      const region = document.querySelector('[role=region][aria-labelledby]'); const sc = region.firstElementChild; const sheet = sc.firstElementChild; const footer = region.querySelector('footer');
      const kids = [...sheet.querySelectorAll('p,li,button,h1,h2')].filter((e) => e.getBoundingClientRect().height > 0);
      const last = kids.reduce((a, e) => (e.getBoundingClientRect().bottom > a.getBoundingClientRect().bottom ? e : a));
      const lr = last.getBoundingClientRect(); const sr = sc.getBoundingClientRect(); const fr = footer.getBoundingClientRect();
      return { scrollTop: Math.round(sc.scrollTop), maxScroll: sc.scrollHeight - sc.clientHeight, last: last.textContent.trim().slice(0, 80), lastBottom: +lr.bottom.toFixed(1), scrollBottom: +sr.bottom.toFixed(1), footerTop: +fr.top.toFixed(1), gapToFooter: +(fr.top - lr.bottom).toFixed(1), gapToFade: +(sr.bottom - 14 - lr.bottom).toFixed(1), detailsOpen: sheet.querySelector('[aria-expanded]')?.getAttribute('aria-expanded') };
    });
    if (shots) await p.screenshot({ path: `${dir}/${cap}-end.png`, animations: 'disabled', timeout: 90_000 });
  } catch (e) { meta.errors.push(`${name}: ${e.message.slice(0, 200)}`); }
  meta.days[name] = rec;
  await ctx.close();
}

try {
  const jobs = RUNS.flatMap((R) => days.map((d) => [d, R]));
  if (PAIR) for (const d of days) await Promise.all(RUNS.map((R) => day(d, R)));
  else if (PAR) await Promise.all(jobs.map(([d, R]) => day(d, R)));
  else for (const [d, R] of jobs) await day(d, R);
} finally {
  await b.close();
  for (const R of RUNS) {
    const meta = R.meta;
    meta.days = Object.fromEntries(days.filter((d) => meta.days[d]).map((d) => [d, meta.days[d]]));
    writeFileSync(`${R.dir}/probe.json`, JSON.stringify(meta, null, 1));
    const brief = Object.entries(meta.days).map(([k, v]) => `${k}: lift ${v.settled?.scrollTop} clear chai ${v.settled?.clear?.chai} kettle ${v.settled?.clear?.kettle} cut ${v.settled?.fold?.cut?.length} streak ${v.settled?.copy?.textContentTotal} end gap ${v.end?.gapToFooter}`).join(' · ');
    console.log(`${R.side} ${W}x${H}-${theme}-t${text}`, brief, 'errors', meta.errors.length, meta.errors.join(' | ').slice(0, 300));
  }
}
