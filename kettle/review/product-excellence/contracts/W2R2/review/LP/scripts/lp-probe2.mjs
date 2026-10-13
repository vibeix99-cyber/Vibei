// Lane P (W2R2 review) v2 (copy of lp-probe.mjs + live-region log, attribute scan, highlight-in-view, PNG captures).
// Independent summary geometry/copy probe, control vs P trial, same session.
// One Chromium launch per invocation (run under the slot gate). Per run: fresh context, frozen clock + resume,
// r2before's setup path (seed, real click on "Put the kettle on", __kettle.finish() for setup only), then
// measurements at 1.5 s and 4.5 s after #/done, then the end state (real click on the details toggle, real wheel).
//   node lp-probe.mjs --out <dir> --cfgs 375x667@2:light:100,... --days routine,task,big,milestone [--builds C=url,P=url]
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const FIXED = Date.parse('2026-10-11T07:40:00.000Z');
const builds = (args.builds ?? 'C=http://127.0.0.1:5430,P=http://127.0.0.1:5452').split(',').map((x) => x.split('='));
const days = (args.days ?? 'routine,task,big').split(',');
const cfgs = args.cfgs.split(',');
const OUT = args.out;
const PNG = new Set((args.png ?? '').split(',').filter(Boolean)); // entries: <tag>/<day>/<settled|end|arrival>
const NOJPG = args.nojpg === '1';
const DAY = { routine: ['veteran', false], task: ['newbie', true], big: ['celebrate', false], milestone: ['atRisk', false] };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (s) => { console.log(s); appendFileSync(`${OUT}/probe.log`, s + '\n'); };
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });

// ---------------------------------------------------------------- in-page measurement (no app hooks used)
const MEASURE = () => {
  const R = (r) => ({ l: +r.left.toFixed(1), t: +r.top.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), b: +r.bottom.toFixed(1), r: +r.right.toFixed(1) });
  const h1 = document.querySelector('h1[tabindex="-1"]');
  const region = h1?.closest('[role=region]');
  if (!region) return { error: 'no summary region', hash: location.hash };
  const scroll = region.firstElementChild, sheet = scroll.firstElementChild, footer = region.querySelector('footer');
  const sr = scroll.getBoundingClientRect(), sh = sheet.getBoundingClientRect(), fr = footer.getBoundingClientRect();
  const FADE = 14, foldTop = sr.bottom - FADE;
  // ---- colours
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const cr = (a, b2) => { const x = lum(a), y = lum(b2); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2); };
  const bodyBg = parse(getComputedStyle(document.body).backgroundColor) ?? { r: 255, g: 255, b: 255, a: 1 };
  let sheetBg = parse(getComputedStyle(sheet).backgroundColor);
  if (!sheetBg || sheetBg.a === 0) { // side by side: no sheet fill; walk up to the first painted ancestor
    for (let e = sheet; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { sheetBg = over(c, bodyBg); break; } }
    sheetBg = sheetBg && sheetBg.a ? sheetBg : bodyBg;
  }
  const font = (e) => { if (!e) return null; const c = getComputedStyle(e); return { size: c.fontSize, weight: c.fontWeight, family: c.fontFamily.split(',')[0].replace(/"/g, ''), color: c.color, lineHeight: c.lineHeight }; };
  const textEl = (root, re) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (re.test(n.data)) return n.parentElement; return null; };
  // ---- figures: Chai's painted <img> (not the wrapper div) and the kettle <svg>, plus their painted extents
  const inRegion = (e) => region.contains(e);
  const chaiImg = [...document.querySelectorAll('[data-pose] img')].find((i) => !inRegion(i) && i.getBoundingClientRect().width > 20);
  const kettle = [...document.querySelectorAll('svg[role=img][data-state]')].find((s) => !inRegion(s));
  const fig = {};
  if (chaiImg) {
    const r = chaiImg.getBoundingClientRect();
    let paint = null;
    try {
      const c = document.createElement('canvas'); c.width = chaiImg.naturalWidth; c.height = chaiImg.naturalHeight;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(chaiImg, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let top = -1, bot = -1, left = c.width, right = -1;
      for (let y = 0; y < c.height; y++) for (let xx = 0; xx < c.width; xx++) if (d[(y * c.width + xx) * 4 + 3] > 24) { if (top < 0) top = y; bot = y; if (xx < left) left = xx; if (xx > right) right = xx; }
      paint = { t: +(r.top + (top / c.height) * r.height).toFixed(1), b: +(r.top + ((bot + 1) / c.height) * r.height).toFixed(1), l: +(r.left + (left / c.width) * r.width).toFixed(1), r: +(r.left + ((right + 1) / c.width) * r.width).toFixed(1), nat: [c.width, c.height] };
    } catch (e) { paint = { err: String(e).slice(0, 80) }; }
    const wrap = chaiImg.closest('div[data-pose]');
    fig.chai = { img: R(r), paint, wrapper: wrap ? R(wrap.getBoundingClientRect()) : null, makerHook: wrap?.hasAttribute('data-stage-figure') ?? false };
  }
  if (kettle) {
    const r = kettle.getBoundingClientRect();
    let pt = Infinity, pb = -Infinity, pl = Infinity, pr = -Infinity, lowest = null;
    for (const e of kettle.querySelectorAll('path,ellipse,circle,rect,polygon,polyline,line,use,image')) {
      if (e.closest('defs,clipPath,mask,pattern,linearGradient,radialGradient,filter,symbol')) continue;
      let hidden = false;
      for (let a = e; a && a !== kettle.parentElement; a = a.parentElement) { const c = getComputedStyle(a); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) { hidden = true; break; } }
      if (hidden) continue;
      const q = e.getBoundingClientRect(); if (q.width < 0.5 && q.height < 0.5) continue;
      if (q.bottom > pb) { const cs2 = getComputedStyle(e); lowest = { tag: e.tagName.toLowerCase(), cls: String(e.getAttribute('class') ?? '').slice(0, 40), id: e.id || null, bottom: +q.bottom.toFixed(1), h: +q.height.toFixed(1), w: +q.width.toFixed(1), fill: cs2.fill, fillOpacity: cs2.fillOpacity, opacity: cs2.opacity, parent: e.parentElement?.tagName.toLowerCase() + '.' + String(e.parentElement?.getAttribute('class') ?? '').slice(0, 30) }; }
      pt = Math.min(pt, q.top); pb = Math.max(pb, q.bottom); pl = Math.min(pl, q.left); pr = Math.max(pr, q.right);
    }
    fig.kettle = { lowest, svg: R(r), paint: { t: +pt.toFixed(1), b: +pb.toFixed(1), l: +pl.toFixed(1), r: +pr.toFixed(1) }, makerHook: kettle.hasAttribute('data-stage-figure') };
  }
  // hit test along each figure's painted bottom band: does the summary paint over it?
  const hit = (paint) => {
    if (!paint || paint.err) return null;
    const out = { samples: 0, bySummary: 0, bySheet: 0, byScrollOnly: 0, byFooter: 0 };
    for (const dy of [1.5, 6, 12]) for (let i = 1; i < 10; i++) {
      const x = paint.l + ((paint.r - paint.l) * i) / 10, y = paint.b - dy;
      if (y < 0 || y > innerHeight - 1) continue;
      out.samples++;
      const e = document.elementFromPoint(x, y);
      if (e && region.contains(e)) { out.bySummary++; if (sheet.contains(e)) out.bySheet++; else if (footer.contains(e)) out.byFooter++; else out.byScrollOnly++; }
    }
    return out;
  };
  const sheetEdge = sh.top - 2; // the sheet's 2px top line (box-shadow 0 -2px 0)
  const clear = (p) => (p && !p.err ? +(sheetEdge - p.b).toFixed(1) : null);
  const figures = {
    chaiImgClear: fig.chai ? +(sheetEdge - fig.chai.img.b).toFixed(1) : null,
    chaiPaintClear: clear(fig.chai?.paint),
    kettleSvgClear: fig.kettle ? +(sheetEdge - fig.kettle.svg.b).toFixed(1) : null,
    kettlePaintClear: clear(fig.kettle?.paint),
    chaiHit: hit(fig.chai?.paint), kettleHit: hit(fig.kettle?.paint),
    chaiInViewport: fig.chai ? fig.chai.img.t >= -1 && fig.chai.img.b <= innerHeight + 1 && fig.chai.img.r > 0 && fig.chai.img.l < innerWidth : false,
  };
  // ---- every text line of the sheet (Range client rects of each text node, merged per line), and fold objects
  const lines = [];
  const w = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    if (!n.data.trim()) continue;
    const pe = n.parentElement;
    if (pe.closest('.sr-only,[hidden]')) continue;
    const cs = getComputedStyle(pe);
    if (cs.visibility === 'hidden') continue;
    const rg = document.createRange(); rg.selectNodeContents(n);
    const rows = [];
    for (const q of rg.getClientRects()) {
      if (q.height < 4 || q.width < 1) continue;
      const last = rows.at(-1);
      if (last && Math.abs(q.top - last.t) < 3) { last.b = Math.max(last.b, q.bottom); last.r = Math.max(last.r, q.right); }
      else rows.push({ t: q.top, b: q.bottom, l: q.left, r: q.right });
    }
    rows.forEach((q, i) => lines.push({ text: n.data.trim().slice(0, 40) + (rows.length > 1 ? ` [${i + 1}/${rows.length}]` : ''), t: +q.t.toFixed(1), b: +q.b.toFixed(1), l: +q.l.toFixed(1), r: +q.r.toFixed(1), fs: parseFloat(cs.fontSize) }));
  }
  const objs = [];
  for (const e of sheet.querySelectorAll('li, button, [role=group], img, canvas, svg, section')) {
    if (e.closest('[hidden],.sr-only')) continue;
    if (e.tagName === 'svg' && e.closest('li,button')) continue;
    const q = e.getBoundingClientRect(); if (q.height < 8 || q.width < 8) continue;
    objs.push({ what: `${e.tagName.toLowerCase()}${e.getAttribute('aria-label') ? '[' + e.getAttribute('aria-label').slice(0, 24) + ']' : ''}${e.dataset.highlight != null ? '[highlight]' : ''}`, t: +q.top.toFixed(1), b: +q.bottom.toFixed(1) });
  }
  const visTop = Math.max(sr.top, sh.top - 2);
  const cut = [], peek = [];
  for (const L of lines) {
    if (L.b <= visTop || L.t >= sr.bottom) continue; // wholly off the visible scroll area
    if (L.t < foldTop - 0.5 && L.b > foldTop + 0.5) cut.push({ text: L.text, above: +(foldTop - L.t).toFixed(1), below: +(L.b - foldTop).toFixed(1), h: +(L.b - L.t).toFixed(1) });
    else if (L.t >= foldTop - 0.5 && L.t < sr.bottom) peek.push({ text: L.text, inFade: +(sr.bottom - L.t).toFixed(1), h: +(L.b - L.t).toFixed(1) });
    if (L.t < sr.top - 0.5 && L.b > sr.top + 0.5) cut.push({ text: L.text, topEdge: true, above: +(sr.top - L.t).toFixed(1), below: +(L.b - sr.top).toFixed(1) });
  }

  // ---- ink lines: per text line, the glyph ink extent (canvas measureText on the computed font) vs the fold
  const cvs = document.createElement('canvas').getContext('2d');
  const inkLines = [];
  {
    const w2 = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT); let n2;
    while ((n2 = w2.nextNode())) {
      if (!n2.data.trim()) continue;
      const pe2 = n2.parentElement; if (pe2.closest('.sr-only,[hidden]')) continue;
      const cs2 = getComputedStyle(pe2); if (cs2.visibility === 'hidden') continue;
      const inSvg = !!pe2.closest('svg');
      const ls = [];
      for (let i = 0; i < n2.data.length; i++) {
        const rg = document.createRange(); rg.setStart(n2, i); rg.setEnd(n2, i + 1);
        const rs = rg.getClientRects(); if (!rs.length) continue; const q = rs[0]; if (q.height < 4) continue;
        const last = ls.at(-1);
        if (last && Math.abs(q.top - last.t) < 3) { last.text += n2.data[i]; last.b = Math.max(last.b, q.bottom); }
        else ls.push({ t: q.top, b: q.bottom, text: n2.data[i] });
      }
      cvs.font = `${cs2.fontStyle} ${cs2.fontWeight} ${cs2.fontSize} ${cs2.fontFamily}`;
      try { cvs.letterSpacing = cs2.letterSpacing === 'normal' ? '0px' : cs2.letterSpacing; } catch {}
      const tt = cs2.textTransform;
      for (const L of ls) {
        let tx = L.text.trim(); if (!tx) continue;
        if (tt === 'uppercase') tx = tx.toUpperCase();
        if (inSvg) { inkLines.push({ text: tx.slice(0, 40), isH1: false, inSvg: true, rangeT: +L.t.toFixed(1), rangeB: +L.b.toFixed(1), inkT: +L.t.toFixed(1), inkB: +L.b.toFixed(1), fs: parseFloat(cs2.fontSize) }); continue; }
        const m = cvs.measureText(tx), base = L.t + m.fontBoundingBoxAscent;
        inkLines.push({ text: tx.slice(0, 40), isH1: pe2 === h1, rangeT: +L.t.toFixed(1), rangeB: +L.b.toFixed(1), inkT: +(base - m.actualBoundingBoxAscent).toFixed(1), inkB: +(base + m.actualBoundingBoxDescent).toFixed(1), fs: parseFloat(cs2.fontSize) });
      }
    }
  }
  const visTopI = Math.max(sr.top, sh.top - 2);
  const inkCut = [], inkPeek = [];
  for (const L of inkLines) {
    if (L.inkB <= visTopI || L.inkT >= sr.bottom) continue;
    if (L.inkT < foldTop - 0.5 && L.inkB > foldTop + 0.5) inkCut.push({ text: L.text, inSvg: !!L.inSvg, inkAbove: +(foldTop - L.inkT).toFixed(1), inkBelow: +(L.inkB - foldTop).toFixed(1), inFadePx: +(Math.min(L.inkB, sr.bottom) - foldTop).toFixed(1) });
    else if (L.inkT >= foldTop - 0.5 && L.inkT < sr.bottom) inkPeek.push({ text: L.text, inSvg: !!L.inSvg, inkT: L.inkT, inFadePx: +(sr.bottom - L.inkT).toFixed(1) });
  }
  const h1Ink = inkLines.filter((L) => L.isH1);
  const headingInk = { lines: h1Ink.map((L) => ({ text: L.text, rangeT: L.rangeT, rangeB: L.rangeB, inkT: L.inkT, inkB: L.inkB })), wholeByInk: h1Ink.length > 0 && h1Ink.every((L) => L.inkT >= visTopI - 0.5 && L.inkB <= foldTop + 0.5), lowestInkB: h1Ink.length ? Math.max(...h1Ink.map((L) => L.inkB)) : null, toFoldTop: h1Ink.length ? +(foldTop - Math.max(...h1Ink.map((L) => L.inkB))).toFixed(1) : null };
  const objCut = objs.filter((o) => o.t < foldTop - 0.5 && o.b > foldTop + 0.5).map((o) => ({ ...o, above: +(foldTop - o.t).toFixed(1), below: +(o.b - foldTop).toFixed(1) }));
  // overlapping text lines (different nodes) in the sheet
  const overlaps = [];
  for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
    const a = lines[i], c = lines[j];
    const ox = Math.min(a.r, c.r) - Math.max(a.l, c.l), oy = Math.min(a.b, c.b) - Math.max(a.t, c.t);
    if (ox > 1 && oy > 2) overlaps.push(`${a.text} × ${c.text} (${ox.toFixed(0)}×${oy.toFixed(0)})`);
  }
  // heading
  const hr = h1.getBoundingClientRect();
  const heading = { box: R(hr), whole: hr.top >= sr.top - 0.5 && hr.top >= sh.top && hr.bottom <= foldTop + 0.5 && hr.top >= 0, text: h1.textContent.trim() };
  // hierarchy
  const cta = region.querySelector('[data-done-cta]') ?? footer.querySelector('button');
  const face = cta?.firstElementChild;
  const ctaText = textEl(cta, /Tea time|tea break/);
  const faceBg = face ? parse(getComputedStyle(face).backgroundColor) : null;
  const h1f = font(h1);
  const hl = sheet.querySelector('[data-highlight]');
  const unlock = sheet.querySelector('section[aria-label^="Cozy level"]');
  let hlInfo = null;
  if (hl) {
    const q = hl.getBoundingClientRect(); const bg = parse(getComputedStyle(hl).backgroundColor);
    const tt = hl.querySelector('span > span'); // first span of the text column = title
    const title = [...hl.querySelectorAll('span')].find((s2) => s2.childElementCount === 0 && s2.textContent.trim() && !s2.classList.contains('sr-only'));
    const note = [...hl.querySelectorAll('span')].filter((s2) => s2.childElementCount === 0 && s2.textContent.trim() && !s2.classList.contains('sr-only')).at(-1);
    const art = hl.firstElementChild?.getBoundingClientRect();
    hlInfo = { kind: hl.dataset.kind, milestone: hl.dataset.milestone, box: R(q), area: Math.round(q.width * q.height), fill: getComputedStyle(hl).backgroundColor, fillVsSheet: bg ? cr(over(bg, sheetBg), sheetBg) : null, edge: getComputedStyle(hl).boxShadow.slice(0, 60), title: title?.textContent.trim(), titleFont: font(title), note: note !== title ? note?.textContent.trim() : null, noteFont: note !== title ? font(note) : null, art: art ? [Math.round(art.width), Math.round(art.height)] : null, _tt: !!tt };
  }
  let unlockInfo = null;
  if (unlock) {
    const q = unlock.getBoundingClientRect(); const t2 = unlock.querySelector('h2');
    const scene = unlock.querySelector('canvas,img,svg');
    unlockInfo = { label: unlock.getAttribute('aria-label'), box: R(q), area: Math.round(q.width * q.height), fill: getComputedStyle(unlock).backgroundColor, titleFont: font(t2), title: t2?.textContent.trim(), canvas: [...unlock.querySelectorAll('canvas')].map((c) => R(c.getBoundingClientRect())), still: [...unlock.querySelectorAll('img,svg')].length, sceneVisibleTop: scene ? +(scene.getBoundingClientRect().top).toFixed(1) : null };
  }
  const hierarchy = {
    heading: { ...h1f, box: R(hr), area: Math.round(hr.width * hr.height), contrast: cr(parse(h1f.color), sheetBg) },
    teaTime: cta ? { text: cta.textContent.trim(), box: R(cta.getBoundingClientRect()), area: Math.round(cta.getBoundingClientRect().width * cta.getBoundingClientRect().height), face: face ? R(face.getBoundingClientRect()) : null, fill: face ? getComputedStyle(face).backgroundColor : null, fillVsSheet: faceBg && faceBg.a ? cr(over(faceBg, sheetBg), sheetBg) : null, label: font(ctaText), labelVsFill: faceBg && ctaText ? cr(parse(getComputedStyle(ctaText).color), over(faceBg, sheetBg)) : null } : null,
    highlight: hlInfo, unlock: unlockInfo, sheetBg: `rgb(${sheetBg.r},${sheetBg.g},${sheetBg.b})`,
  };
  const highlights = sheet.querySelectorAll('[data-highlight]').length + sheet.querySelectorAll('section[aria-label^="Cozy level"]').length;
  // end gap: last visible text line / fold object of the sheet to the footer's top
  const lastLine = lines.filter((L) => L.b > 0).reduce((m, L) => (!m || L.b > m.b ? L : m), null);
  const lastObj = objs.reduce((m, o) => (!m || o.b > m.b ? o : m), null);
  // toasts and covered controls
  const toasts = [...document.querySelectorAll('[aria-label="Notifications"] li')].map((li) => ({ text: li.innerText.replace(/\s+/g, ' ').trim().slice(0, 60), box: R(li.getBoundingClientRect()), op: +getComputedStyle(li).opacity }));
  const toastOverSummary = toasts.filter((t) => t.op > 0.05 && t.box.b > sr.top && t.box.t < fr.bottom && t.box.r > sr.left && t.box.l < sr.right);
  const covered = [];
  for (const e of region.querySelectorAll('button,[role=button],[role=radio]')) {
    const q = e.getBoundingClientRect(); if (q.width < 2 || q.height < 2 || q.bottom < 0 || q.top > innerHeight) continue;
    const cy = q.top + q.height / 2; if (cy < sr.top || cy > fr.bottom) continue;
    if (!footer.contains(e) && cy > foldTop) continue; // under the fold by design
    const x = document.elementFromPoint(q.left + q.width / 2, cy);
    if (x && !(x === e || e.contains(x) || x.contains(e))) covered.push({ name: (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 30), by: `${x.tagName.toLowerCase()}.${String(x.className?.baseVal ?? x.className).slice(0, 30)}` });
  }
  // copy: every source
  const said = region.querySelector('[role=status][aria-live]')?.textContent.trim() ?? '';
  const srOnly = [...region.querySelectorAll('.sr-only')].map((e) => e.textContent.trim()).filter(Boolean);
  const aria = [...region.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label'));
  const details = [...region.querySelectorAll('section')].find((s2) => s2.querySelector('button[aria-expanded]'));
  const detailsBody = details?.querySelector('[id]');

  // ---- extra: every 'streak' (case-insensitive) in any source, document-wide live regions, highlight-in-view
  const strk = (t) => (String(t).match(/streak/gi) ?? []).length;
  const attrHits = [];
  for (const e of [region, ...region.querySelectorAll('*')]) for (const a of e.attributes) if (!a.name.startsWith('data-') && a.name !== 'class' && a.name !== 'style' && /streak/i.test(a.value)) attrHits.push({ el: e.tagName.toLowerCase(), attr: a.name, value: a.value.slice(0, 140) });
  const dataHits = [];
  for (const e of [region, ...region.querySelectorAll('*')]) for (const a of e.attributes) if (a.name.startsWith('data-') && /streak/i.test(a.value)) dataHits.push({ el: e.tagName.toLowerCase(), attr: a.name, value: a.value.slice(0, 80) });
  const svgText = [...region.querySelectorAll('title,desc')].map((e) => e.textContent.trim()).filter((t) => /streak/i.test(t));
  const liveDoc = [...document.querySelectorAll('[aria-live],[role=status],[role=alert],[data-kettle-announcer]')].map((e) => ({ where: region.contains(e) ? 'summary' : 'outside', tag: e.tagName.toLowerCase() + (e.getAttribute('aria-label') ? `[${e.getAttribute('aria-label')}]` : '') + (e.dataset.kettleAnnouncer ? `[announcer ${e.dataset.kettleAnnouncer}]` : ''), text: e.textContent.replace(/\s+/g, ' ').trim().slice(0, 240) })).filter((x) => x.text);
  const streakScan = {
    visibleText: strk(region.innerText), textContent: strk(region.textContent),
    srOnly: srOnly.filter((t) => /streak/i.test(t)), ariaLabels: aria.filter((t) => /streak/i.test(t)),
    attrHits, dataHits, svgText, said: strk(said), liveDoc: liveDoc.filter((x) => /streak/i.test(x.text)),
    pageVisibleText: strk(document.body.innerText),
  };
  const visTop2 = Math.max(sr.top, sh.top);
  const hlEl = sheet.querySelector('[data-highlight]'), unEl = sheet.querySelector('section[aria-label^="Cozy level"]');
  const view = (e) => { if (!e) return null; const q = e.getBoundingClientRect(); return { t: +q.top.toFixed(1), b: +q.bottom.toFixed(1), whole: q.top >= visTop2 - 0.5 && q.bottom <= foldTop + 0.5, partial: q.bottom > visTop2 && q.top < foldTop, visiblePx: +Math.max(0, Math.min(q.bottom, foldTop) - Math.max(q.top, visTop2)).toFixed(1), h: +q.height.toFixed(1) }; };
  const inView = { highlightCard: view(hlEl), unlockCard: view(unEl), foldTop: +foldTop.toFixed(1), visTop: +visTop2.toFixed(1) };
  const nHl = sheet.querySelectorAll('[data-highlight]').length, nUnlock = sheet.querySelectorAll('section[aria-label^="Cozy level"]').length;
  const chaiCand = [...document.querySelectorAll('[data-pose] img')].filter((i) => !inRegion(i)).map((i) => { const q = i.getBoundingClientRect(); return { w: +q.width.toFixed(1), h: +q.height.toFixed(1), t: +q.top.toFixed(1), b: +q.bottom.toFixed(1), fit: getComputedStyle(i).objectFit, src: (i.currentSrc || i.src).split('/').pop().slice(0, 40) }; });
  const stageFig = [...document.querySelectorAll('[data-stage-figure]')].map((e) => { const q = e.getBoundingClientRect(); return { fig: e.dataset.stageFigure, tag: e.tagName.toLowerCase(), t: +q.top.toFixed(1), b: +q.bottom.toFixed(1), l: +q.left.toFixed(1), r: +q.right.toFixed(1) }; });
  return {
    streakScan, inView, nHl, nUnlock, chaiCand, stageFig, ink: { cut: inkCut, peek: inkPeek, heading: headingInk, n: inkLines.length },
    hash: location.hash, vw: innerWidth, vh: innerHeight,
    scroll: { box: R(sr), scrollTop: +scroll.scrollTop.toFixed(1), scrollHeight: scroll.scrollHeight, clientHeight: scroll.clientHeight, sheetTopVar: getComputedStyle(scroll).paddingTop },
    sheet: { box: R(sh), air: getComputedStyle(sheet).getPropertyValue('--air').trim() || '0', padTop: getComputedStyle(sheet).paddingTop, gap: getComputedStyle(sheet).rowGap },
    footer: R(fr), foldTop: +foldTop.toFixed(1), fig, figures, heading, hierarchy, highlights,
    fold: { lines: lines.length, cut, peek, objCut },
    overlaps, toasts, toastOverSummary, covered,
    end: { lastLine: lastLine ? { text: lastLine.text, b: lastLine.b } : null, lastLineToFooter: lastLine ? +(fr.top - lastLine.b).toFixed(1) : null, lastLineToFoldTop: lastLine ? +(foldTop - lastLine.b).toFixed(1) : null, lastObj: lastObj ? { what: lastObj.what, b: lastObj.b, toFooter: +(fr.top - lastObj.b).toFixed(1) } : null, atBottom: scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 1 },
    copy: {
      visible: region.innerText.replace(/\s+\n/g, '\n').trim(),
      textContent: region.textContent.replace(/\s+/g, ' ').trim(),
      srOnly, aria, said,
      pills: [...region.querySelectorAll('[aria-label="Rewards"] > li')].map((li) => li.textContent.replace(/\s+/g, ' ').trim()),
      detailsOpen: details?.querySelector('button[aria-expanded]')?.getAttribute('aria-expanded'),
      detailsText: detailsBody ? detailsBody.textContent.replace(/\s+/g, ' ').trim() : null,
      detailsRows: detailsBody ? [...detailsBody.querySelectorAll('li')].map((li) => [...li.children].map((c) => c.textContent.trim())) : null,
      toasts: toasts.map((t) => t.text),
      footer: footer.innerText.replace(/\s+/g, ' ').trim(),
    },
  };
};

async function context(W, H, DPR, theme, text) {
  const mobile = W < 900;
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: mobile && W < H, hasTouch: mobile, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', serviceWorkers: 'block' });
  if (text !== 100) await ctx.addInitScript((pct) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${pct}%!important}`; document.head.appendChild(s); }), text);
  await ctx.addInitScript(() => {
    window.__lpLive = [];
    const rec = (n) => { try { const el = (n.nodeType === 1 ? n : n.parentElement)?.closest?.('[aria-live],[role=status],[role=alert],[data-kettle-announcer]'); if (!el) return; const t = el.textContent.replace(/\s+/g, ' ').trim(); if (!t) return; const key = (el.getAttribute('aria-label') || el.tagName) + '|' + t; if (window.__lpLive.some((x) => x.key === key)) return; window.__lpLive.push({ key, hash: location.hash, t: Math.round(performance.now()), text: t.slice(0, 300) }); } catch {} };
    addEventListener('DOMContentLoaded', () => new MutationObserver((ms) => { for (const m of ms) { rec(m.target); m.addedNodes.forEach(rec); } }).observe(document.documentElement, { subtree: true, childList: true, characterData: true }));
  });
  const p = await ctx.newPage();
  await p.clock.install({ time: FIXED });
  await p.clock.resume();
  return { ctx, p };
}
const ready = (p) => p.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60_000 }).catch(() => {});

async function run(cfg, day, [side, base]) {
  const m = cfg.match(/^(\d+)x(\d+)@(\d+):(light|dark):(\d+)$/);
  const [W, H, DPR, theme, text] = [+m[1], +m[2], +m[3], m[4], +m[5]];
  const tag = `${W}x${H}-${theme}-t${text}`;
  const dir = `${OUT}/${tag}`; mkdirSync(dir, { recursive: true });
  const [seed, task] = DAY[day];
  const rec = { side, base, cfg, day, seed, task, errors: [], at: new Date().toISOString() };
  const { ctx, p } = await context(W, H, DPR, theme, text);
  p.on('pageerror', (e) => rec.errors.push(e.message.slice(0, 160)));
  try {
    await p.goto(`${base}/?debug&seed=${seed}&theme=${theme}#/`); await ready(p); await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
    await sleep(1200);
    if (task) { const f = p.getByRole('textbox', { name: /What are you brewing/ }); await f.click(); await p.keyboard.type('Chapter 3 notes'); await p.keyboard.press('Escape').catch(() => {}); }
    const start = p.getByRole('button', { name: /^Put the kettle on/i }).first(); await start.scrollIntoViewIfNeeded(); await start.click();
    await p.waitForFunction(() => location.hash === '#/focus', null, { timeout: 15_000 }); await sleep(2500);
    await p.evaluate(() => window.__kettle.finish());
    await p.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30_000 });
    const t0 = Date.now();
    const shot = async (name) => {
      if (!NOJPG) await p.screenshot({ path: `${dir}/${side}-${day}-${name}.jpg`, type: 'jpeg', quality: 82, animations: 'disabled' }).catch((e) => rec.errors.push(`shot ${name}: ${e.message.slice(0, 80)}`));
      if (PNG.has(`${tag}/${day}/${name}`)) { mkdirSync(`${OUT}/captures`, { recursive: true }); await p.screenshot({ path: `${OUT}/captures/${tag}-${day}${name === 'settled' ? '' : '-' + name}-${side === 'C' ? 'control' : 'P'}.png`, animations: 'disabled' }).catch((e) => rec.errors.push(`png ${name}: ${e.message.slice(0, 80)}`)); }
    };
    await sleep(1500 - (Date.now() - t0)); rec.arrival = await p.evaluate(MEASURE); rec.arrival.ms = Date.now() - t0; await shot('arrival');
    await sleep(Math.max(0, 4500 - (Date.now() - t0))); rec.settled = await p.evaluate(MEASURE); rec.settled.ms = Date.now() - t0; await shot('settled');
    // end: real click on the details toggle, then a real wheel over the scroll area to its end
    const tog = p.getByRole('button', { name: /How your leaves added up/ });
    await tog.scrollIntoViewIfNeeded(); await tog.click(); await sleep(400);
    const box = await p.evaluate(() => { const r = document.querySelector('h1[tabindex="-1"]').closest('[role=region]').firstElementChild.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + Math.min(r.height - 30, Math.max(30, r.height * 0.6)) }; });
    await p.mouse.move(box.x, box.y);
    for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, 240); await sleep(80); }
    await sleep(900);
    rec.end = await p.evaluate(MEASURE); await shot('end');
    rec.live = await p.evaluate(() => window.__lpLive);
  } catch (e) { rec.errors.push(e.message.slice(0, 200)); await p.screenshot({ path: `${dir}/${side}-${day}-ERROR.jpg`, type: 'jpeg', quality: 70 }).catch(() => {}); }
  await ctx.close();
  writeFileSync(`${dir}/${side}-${day}.json`, JSON.stringify(rec, null, 1));
  const s = rec.settled;
  log(`${new Date().toISOString().slice(11,19)} ${tag} ${day} ${side}: ${s ? `lift ${s.scroll.scrollTop} air ${s.sheet.air} chaiPaint ${s.figures.chaiPaintClear} kettlePaint ${s.figures.kettlePaintClear} hits ${s.figures.chaiHit?.bySummary}/${s.figures.kettleHit?.bySummary} cut ${s.fold.cut.length} head ${s.heading.whole} hl ${s.highlights} endGap ${rec.end?.end.lastLineToFooter}` : 'NO DATA'} err ${rec.errors.length} ${rec.errors.join(' | ').slice(0, 160)}`);
}

try {
  for (const cfg of cfgs) for (const day of days) await Promise.all(builds.map((bd) => run(cfg, day, bd)));
} finally { await b.close(); }
