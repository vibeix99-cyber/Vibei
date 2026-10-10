// L3 3g: the sky-blue "Change brew length" link on Today: contrast (both themes), semantics, target size.
// node g.mjs --rev=R6|INT
import { REV, launch, newCtx, openNewbie, sleep, args, logger, OUT, stamp } from './lib.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const a = args();
const rev = REV[a.rev ?? 'R6'];
const dir = `${OUT}/3g`; mkdirSync(dir, { recursive: true });
const tag = rev.name;
const log = logger(`${dir}/g-${tag}.log`);
log(`RUN 3g ${tag} url=${rev.dev} rev=${rev.name}@${rev.commit} start=${stamp()}`);
const b = await launch();
const lum = ([r, g, bl]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl); };
const ratio = (x, y) => { const [l1, l2] = [lum(x), lum(y)].sort((m, n) => n - m); return (l1 + 0.05) / (l2 + 0.05); };
const parse = (s) => (s.match(/[\d.]+/g) || []).slice(0, 4).map(Number);
const out = [];
const decode = await b.newContext(); const dp = await decode.newPage();
async function pixels(buf, rects) {
  return dp.evaluate(async ({ b64, rects }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    return rects.map((r) => { const d = x.getImageData(Math.max(0, Math.round(r[0])), Math.max(0, Math.round(r[1])), Math.max(1, Math.round(r[2])), Math.max(1, Math.round(r[3]))).data; const px = []; for (let i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2]]); return px; });
  }, { b64: buf.toString('base64'), rects });
}
for (const [w, h] of [[375, 667], [390, 844], [1440, 900]]) for (const theme of ['light', 'dark']) for (const text of [100, 200]) {
  const ctx = await newCtx(b, { w, h, theme, text });
  const p = await ctx.newPage();
  await openNewbie(p, rev.dev, { theme });
  const loc = p.getByRole('button', { name: 'Change brew length' });
  const n = await loc.count();
  const cfg = { rev: rev.name, url: rev.dev, viewport: `${w}x${h}`, theme, text, count: n };
  if (!n) { cfg.note = 'not in the accessibility tree'; }
  const info = await p.evaluate(() => {
    const el = [...document.querySelectorAll('button')].find((e) => /Change brew length/.test(e.textContent));
    if (!el) return null;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    const eff = (() => { let o = 1; for (let e = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; })();
    const others = [...document.querySelectorAll('button, a[href], input, [role=radio], [role=button]')].filter((e) => e !== el && !e.closest('[aria-hidden=true]')).map((e) => ({ e, r: e.getBoundingClientRect() })).filter((x) => x.r.width > 0 && x.r.height > 0);
    const gap = (a, b) => Math.max(0, Math.max(a.left - b.right, b.left - a.right)) ** 2 + Math.max(0, Math.max(a.top - b.bottom, b.top - a.bottom)) ** 2;
    const nearest = others.map((x) => ({ d: Math.sqrt(gap(r, x.r)), t: (x.e.getAttribute('aria-label') || x.e.textContent || x.e.tagName).trim().slice(0, 26), w: Math.round(x.r.width), h: Math.round(x.r.height) })).sort((m, n) => m.d - n.d).slice(0, 3);
    return { tag: el.tagName, type: el.getAttribute('type'), role: el.getAttribute('role'), href: el.getAttribute('href'), tabindex: el.getAttribute('tabindex'), ariaLabel: el.getAttribute('aria-label'), classes: el.className, parentTag: el.parentElement?.tagName, display: cs.display, color: cs.color, fontSize: cs.fontSize, fontWeight: cs.fontWeight, textDecoration: cs.textDecorationLine + ' ' + cs.textDecorationStyle, cursor: cs.cursor, minHeight: cs.minHeight, padding: cs.padding, rect: [Math.round(r.left * 10) / 10, Math.round(r.top * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10], effOpacity: eff, nearest, inViewport: r.top >= 0 && r.bottom <= innerHeight, name: (el.textContent || '').trim() };
  });
  cfg.info = info;
  if (info && info.display !== 'none' && info.rect[2] > 0) {
    // bg under the text: hide the glyphs (colour transparent) and sample the pixels in the element's box
    await p.evaluate(() => { const el = [...document.querySelectorAll('button')].find((e) => /Change brew length/.test(e.textContent)); el.dataset.l3 = '1'; const s = document.createElement('style'); s.id = 'l3hide'; s.textContent = '[data-l3]{color:transparent!important;text-decoration-color:transparent!important;caret-color:transparent!important}'; document.head.appendChild(s); });
    await sleep(300);
    const dpr = 2 * (w < 900 ? 1 : 0.5); const sc = w < 900 ? 2 : 1;
    const box = info.rect.map((v) => v * sc);
    const buf = await p.screenshot();
    const [bgpx] = await pixels(buf, [[box[0], box[1], box[2], box[3]]]);
    const textRgb = parse(info.color).slice(0, 3);
    const lums = bgpx.map(lum); const iMin = lums.indexOf(Math.min(...lums)); const iMax = lums.indexOf(Math.max(...lums));
    cfg.bgSample = { n: bgpx.length, darkest: bgpx[iMin], lightest: bgpx[iMax] };
    const ratios = [ratio(textRgb, bgpx[iMin]), ratio(textRgb, bgpx[iMax])];
    cfg.contrastComputedColorVsBg = { min: +Math.min(...ratios).toFixed(2), max: +Math.max(...ratios).toFixed(2) };
    await p.evaluate(() => { document.getElementById('l3hide').remove(); });
    await sleep(200);
    // rendered ink (glyph pixels) vs the mean bg
    const buf2 = await p.screenshot();
    const [inkpx] = await pixels(buf2, [[box[0], box[1], box[2], box[3]]]);
    const meanBg = [0, 1, 2].map((k) => Math.round(bgpx.reduce((s, c) => s + c[k], 0) / bgpx.length));
    let worst = null; for (const c of inkpx) { const r = ratio(c, meanBg); if (!worst || r > worst.r) worst = { r, c }; }
    cfg.renderedInkMostContrastingPixel = { rgb: worst?.c, ratioVsMeanBg: worst ? +worst.r.toFixed(2) : null, meanBg };
    cfg.elementShot = `${dir}/g-${tag}-${w}x${h}-${theme}-t${text}.png`;
    await p.screenshot({ path: cfg.elementShot, clip: { x: 0, y: Math.max(0, info.rect[1] - 90), width: w, height: Math.min(h - Math.max(0, info.rect[1] - 90), 220) } }).catch(() => {});
    // focus ring: real Tab until it has focus
    let got = false;
    for (let i = 0; i < 40; i++) { await p.keyboard.press('Tab'); await sleep(120); if (await p.evaluate(() => /Change brew length/.test(document.activeElement?.textContent ?? '') && document.activeElement.tagName === 'BUTTON')) { got = true; break; } }
    if (got) {
      cfg.focus = await p.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { focusVisible: a.matches(':focus-visible'), outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, offset: cs.outlineOffset }; });
      const oc = parse(cfg.focus.outline.replace(/^\S+ \S+ /, '')).slice(0, 3);
      cfg.focus.ringVsMeanBg = +ratio(oc, meanBg).toFixed(2);
      await sleep(400);
      await p.screenshot({ path: `${dir}/g-${tag}-${w}x${h}-${theme}-t${text}-focused.png` });
    } else cfg.focus = { note: 'not reached in 40 Tabs' };
  }
  out.push(cfg);
  log(JSON.stringify(cfg));
  await ctx.close();
}
writeFileSync(`${dir}/g-${tag}.json`, JSON.stringify(out, null, 1));
await b.close();
log(`END ${stamp()}`);
