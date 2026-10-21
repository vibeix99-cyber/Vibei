// In-page measurement of Chai: painted image ink (from its natural pixels, mapped to the img rect) vs the Rive canvas ink.
export const inPage = () => {
  window.__fp = {
    inkOf(data, W, H, A = 8) {
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > A) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) return null;
      // belly row: 30 % of the ink height up from the feet
      const by = Math.round(y1 - 0.3 * (y1 - y0)); let bx0 = W, bx1 = -1;
      for (let x = 0; x < W; x++) if (data[(by * W + x) * 4 + 3] > A) { if (x < bx0) bx0 = x; bx1 = x; }
      return { x0, y0, x1: x1 + 1, y1: y1 + 1, bx0, bx1: bx1 + 1 };
    },
    toCss(ink, rect, W, H) {
      const sx = rect.width / W, sy = rect.height / H;
      return { left: rect.left + ink.x0 * sx, right: rect.left + ink.x1 * sx, top: rect.top + ink.y0 * sy, bottom: rect.top + ink.y1 * sy,
        bellyL: rect.left + ink.bx0 * sx, bellyR: rect.left + ink.bx1 * sx };
    },
    async img(span) {
      const im = span.querySelector('img'); const r = im.getBoundingClientRect();
      const i2 = new Image(); i2.src = im.currentSrc || im.src; await i2.decode();
      const c = document.createElement('canvas'); c.width = i2.naturalWidth; c.height = i2.naturalHeight;
      const x = c.getContext('2d'); x.drawImage(i2, 0, 0);
      const ink = this.inkOf(x.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
      return { box: { x: r.left, y: r.top, w: r.width, h: r.height }, ink: this.toCss(ink, r, c.width, c.height) };
    },
    rive(span) {
      const cv = span.querySelector('canvas'); if (!cv) return null; const r = cv.getBoundingClientRect();
      const ctx = cv.getContext('2d'); const ink = this.inkOf(ctx.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height);
      return ink && { canvas: { x: r.left, y: r.top, w: r.width, h: r.height, pxW: cv.width, pxH: cv.height }, ink: this.toCss(ink, r, cv.width, cv.height) };
    },
    clipCheck(span, inkUnion) {
      const out = []; let el = span.parentElement;
      while (el && el !== document.documentElement) {
        const cs = getComputedStyle(el);
        const clips = cs.overflowX !== 'visible' || cs.overflowY !== 'visible' || cs.clipPath !== 'none' || /paint|strict|content/.test(cs.contain);
        if (clips) {
          const r = el.getBoundingClientRect();
          const cut = { left: Math.max(0, r.left - inkUnion.left), right: Math.max(0, inkUnion.right - r.right), top: Math.max(0, r.top - inkUnion.top), bottom: Math.max(0, inkUnion.bottom - r.bottom) };
          out.push({ el: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''), overflow: cs.overflowX + '/' + cs.overflowY, cut });
        }
        el = el.parentElement;
      }
      return out;
    },
  };
};

export async function measure(page, sel, frames = Number(process.env.FP_FRAMES ?? 24), gap = 160) {
  await page.evaluate(inPage);
  const spans = await page.$$(sel);
  const res = [];
  for (const h of spans) {
    const visible = await h.evaluate((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight; });
    if (!visible) continue;
    const pose = await h.evaluate((e) => e.dataset.pose);
    const render = await h.evaluate((e) => e.dataset.chaiRender);
    const img = await h.evaluate((e) => window.__fp.img(e));
    const rv = [];
    for (let i = 0; i < frames; i++) { const m = await h.evaluate((e) => window.__fp.rive(e)); if (m) rv.push(m); await page.waitForTimeout(gap); }
    let union = null;
    for (const m of rv) union = union ? { left: Math.min(union.left, m.ink.left), right: Math.max(union.right, m.ink.right), top: Math.min(union.top, m.ink.top), bottom: Math.max(union.bottom, m.ink.bottom) } : { ...m.ink };
    const clip = union ? await h.evaluate((e, u) => window.__fp.clipCheck(e, u), union) : [];
    const pe = await h.evaluate((e) => { const c = e.querySelector('canvas'); return c ? getComputedStyle(c).pointerEvents : null; });
    res.push({ pose, render, img, rive: rv, union, clip, canvasPointerEvents: pe });
  }
  return res;
}

const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
export function summarize(tag, m) {
  if (!m.rive.length) return { tag, pose: m.pose, render: m.render, note: 'no rive frames' };
  // ground frames: feet at their lowest (cheering hops)
  const maxB = Math.max(...m.rive.map((f) => f.ink.bottom));
  const g = m.rive.filter((f) => f.ink.bottom >= maxB - 0.75);
  const I = m.img.ink;
  const d = (k) => med(g.map((f) => f.ink[k])) - I[k];
  const center = (o) => (o.bellyL + o.bellyR) / 2;
  const width = (o) => o.bellyR - o.bellyL;
  return {
    tag, pose: m.pose, render: m.render, frames: m.rive.length, ground: g.length,
    imgBox: m.img.box, canvasCssPx: m.rive[0].canvas,
    baseline: +d('bottom').toFixed(2),
    top: +d('top').toFixed(2), topRange: [+(Math.min(...g.map((f) => f.ink.top)) - I.top).toFixed(2), +(Math.max(...g.map((f) => f.ink.top)) - I.top).toFixed(2)],
    height: +((med(g.map((f) => f.ink.bottom - f.ink.top))) - (I.bottom - I.top)).toFixed(2),
    bellyCenter: +(med(g.map((f) => center(f.ink))) - center(I)).toFixed(2),
    bellyWidth: +(med(g.map((f) => width(f.ink))) - width(I)).toFixed(2),
    imgInkH: +(I.bottom - I.top).toFixed(2), imgBellyW: +width(I).toFixed(2),
    clipped: m.clip.filter((c) => c.cut.left > 0.5 || c.cut.right > 0.5 || c.cut.top > 0.5 || c.cut.bottom > 0.5),
    clipAncestors: m.clip.length, pointerEvents: m.canvasPointerEvents,
  };
}
