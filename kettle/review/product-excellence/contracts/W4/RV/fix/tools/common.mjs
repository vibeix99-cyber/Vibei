import { chromium } from '/home/user/wt/w11/kettle/node_modules/playwright/index.mjs';
export { chromium };
export const OUT = '/home/user/Vibei/kettle/review/product-excellence/contracts/W4/RV/fix';
export const CDN = /unpkg|jsdelivr|rive\.app/;
export async function boot(page, base, q = '') {
  await page.goto(`${base}/?debug&seed=veteran${q}#/`);
  await page.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60000 });
  await page.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
  await page.waitForTimeout(600);
}
// per-chai state: render mode, img visibility, canvas ink count, cream-pixel count, corner alpha
export const state = (page, sel = '[data-stage-figure=chai] [data-pose]') => page.evaluate((sel) => {
  const sp = document.querySelector(sel); if (!sp) return null;
  const img = sp.querySelector('img'); const c = sp.querySelector('canvas');
  const o = { pose: sp.dataset.pose, render: sp.dataset.chaiRender, imgVis: img ? getComputedStyle(img).visibility : null, canvas: !!c };
  if (c && c.width > 1) {
    const t = document.createElement('canvas'); t.width = c.width; t.height = c.height; const g = t.getContext('2d'); g.drawImage(c, 0, 0);
    const d = g.getImageData(0, 0, t.width, t.height).data; let ink = 0, cream = 0, opaqueEdge = 0;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 16) { ink++; if (d[i] > 235 && d[i + 1] > 225 && d[i + 2] > 210) cream++; } }
    // edge rows/cols opaque count (background fill would make whole border opaque)
    const W = t.width, H = t.height; for (let x = 0; x < W; x++) { if (d[(x) * 4 + 3] > 16) opaqueEdge++; if (d[((H - 1) * W + x) * 4 + 3] > 16) opaqueEdge++; }
    const r = c.getBoundingClientRect(); const pr = sp.getBoundingClientRect();
    Object.assign(o, { cw: c.width, ch: c.height, ink, cream, opaqueEdge, pe: getComputedStyle(c).pointerEvents, crect: [r.x, r.y, r.width, r.height].map((v) => +v.toFixed(2)), prect: [pr.x, pr.y, pr.width, pr.height].map((v) => +v.toFixed(2)), running: c.dataset.running !== undefined });
  }
  return o;
}, sel);
