#!/usr/bin/env node
/**
 * Ad 01 compositor: draws every output frame (1080×1920, 30 fps, 15.0 s) on a canvas in Chromium.
 * Real recording frames are shown through a per-shot "camera" window (CSS px of the 600×1000 capture,
 * DPR 2.5), captions/time card/end card come from render-overlays.mjs, the tap ripple is drawn at the
 * recorded tap position. Output: <out>/f0000.jpg … (then encode.sh adds the sound).
 *
 * usage: node compose.mjs <base-url> <work-dir> <out-dir>
 *   <work-dir> must be served by the base URL (e.g. .tmp/ad under the Kettle dev server) and contain
 *   rec/ (record-app.mjs), genf/ (generated clip frames at 30 fps), ov/ (render-overlays.mjs).
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const [base = 'http://localhost:5191', work = '.tmp/ad', out = '.tmp/ad/out'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const ev = JSON.parse(readFileSync(`${work}/rec/events.json`, 'utf8'));
const DPR = ev.viewport.dpr;
const tap = ev.segments['a-home-focus'].taps[0];
const pad = (n) => String(n).padStart(4, '0');

// ---------------------------------------------------------------- edit decision list (frames @30)
const ease = (k) => k * k * (3 - 2 * k);
const lerp = (a, b, k) => a + (b - a) * k;
const cam = (w0, cx0, cy0, w1, cx1, cy1, k) => ({ w: lerp(w0, w1, k), cx: lerp(cx0, cx1, k), cy: lerp(cy0, cy1, k) });
const SHOTS = [
  { id: 's1', from: 0, len: 45, src: (i) => `genf/f${pad(i + 1)}.png`, gen: true, cap: 'c1' },
  { id: 's2', from: 45, len: 36, src: (i) => `rec/a-home-focus/f${pad(9 + i)}.jpg`, cam: (k) => cam(440, 300, 600, 420, 300, 612, k), cap: 'c2', tapAt: 21 },
  { id: 's3', from: 81, len: 90, src: (i) => `rec/a-home-focus/f${pad(60 + i)}.jpg`, cam: (k) => cam(250, 228, 330, 560, 300, 500, ease(Math.min(1, Math.max(0, (k - 0.27) / 0.62)))), cap: 'c3' },
  { id: 's4', from: 171, len: 24, time: true },
  { id: 's5a', from: 195, len: 50, src: (i) => `rec/b-whistle/f${pad(62 + i)}.jpg`, cam: (k) => cam(540, 300, 500, 510, 300, 520, k), cap: 'c5' },
  { id: 's5b', from: 245, len: 45, src: (i) => `rec/b-whistle/f${pad(140 + i)}.jpg`, cam: (k) => cam(380, 300, 425, 365, 300, 420, k), cap: 'c5', capContinues: true },
  { id: 's6', from: 290, len: 76, src: (i) => `rec/c-break/f${pad(20 + i)}.jpg`, cam: (k) => cam(520, 290, 463, 500, 290, 455, k), cap: 'c6' },
  { id: 's7', from: 366, len: 84, src: (i) => `ov/end/f${pad(Math.min(89, i))}.png`, full: true },
];
const XFADE = { s4: 6, s5a: 6, s7: 8 }; // crossfade frames from the previous shot's last frame
const TOTAL = 450;

// ---------------------------------------------------------------- browser canvas
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto(`${base}/marketing/ad-01-kettle-on/build/overlay.html?mode=none`, { waitUntil: 'load' });
await p.evaluate(({ base, work }) => {
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1920;
  document.body.appendChild(c);
  window.__c = c.getContext('2d');
  window.__cache = new Map();
  window.__img = (u) => {
    if (!window.__cache.has(u)) {
      window.__cache.set(u, new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = `${base}/${work}/${u}`; }));
      if (window.__cache.size > 40) window.__cache.delete(window.__cache.keys().next().value);
    }
    return window.__cache.get(u);
  };
}, { base, work });

/** Draw one layer description; returns nothing. */
async function frame(n) {
  const shot = SHOTS.findLast((s) => n >= s.from);
  const i = n - shot.from;
  const k = shot.len > 1 ? i / (shot.len - 1) : 0;
  const layers = [];
  const pushShot = (s, i, k, alpha) => {
    if (s.time) layers.push({ kind: 'full', src: 'ov/time.png', alpha });
    else if (s.full) layers.push({ kind: 'full', src: s.src(i), alpha });
    else if (s.gen) {
      const z = 1.1 + 0.05 * ease(k); // slow push-in on the mug; shifted left so the tapping hand clears the platform's right-hand buttons
      layers.push({ kind: 'gen', src: s.src(i), z, ax: 540, ay: 1150, dx: -50, alpha });
      layers.push({ kind: 'full', src: 'ov/scrim.png', alpha });
    } else {
      const c = s.cam(k);
      const h = (c.w * 16) / 9;
      layers.push({ kind: 'rec', src: s.src(i), sx: (c.cx - c.w / 2) * DPR, sy: (c.cy - h / 2) * DPR, sw: c.w * DPR, sh: h * DPR, alpha });
      if (s.tapAt !== undefined && i >= s.tapAt - 5 && i < s.tapAt + 7) {
        const t = (i - (s.tapAt - 5)) / 11; // finger down just before the real tap frame (the app switches screens at once)
        layers.push({ kind: 'ripple', x: ((tap.x - (c.cx - c.w / 2)) * 1080) / c.w, y: ((tap.y - (c.cy - h / 2)) * 1080) / c.w, t });
      }
    }
  };
  const xf = XFADE[shot.id];
  if (xf && i < xf) {
    const prev = SHOTS[SHOTS.indexOf(shot) - 1];
    pushShot(prev, prev.len - 1, 1, 1);
    pushShot(shot, i, k, ease((i + 1) / (xf + 1)));
  } else pushShot(shot, i, k, 1);
  if (shot.cap) {
    const since = shot.capContinues ? 99 : i;
    const a = Math.min(1, (since + 1) / 5);
    layers.push({ kind: 'cap', src: `ov/${shot.cap}.png`, s: 0.94 + 0.06 * ease(a), alpha: a });
  }
  const data = await p.evaluate(async (layers) => {
    const g = window.__c;
    g.globalAlpha = 1;
    g.fillStyle = '#241a2d';
    g.fillRect(0, 0, 1080, 1920);
    for (const L of layers) {
      g.save();
      g.globalAlpha = L.alpha ?? 1;
      if (L.kind === 'ripple') {
        g.globalAlpha = 1 - L.t;
        g.beginPath();
        g.arc(L.x, L.y, 60 + 90 * L.t, 0, Math.PI * 2);
        g.fillStyle = 'rgba(255,249,240,0.28)';
        g.fill();
        g.lineWidth = 8;
        g.strokeStyle = 'rgba(255,249,240,0.9)';
        g.stroke();
      } else {
        const im = await window.__img(L.src);
        g.imageSmoothingQuality = 'high';
        if (L.kind === 'rec') g.drawImage(im, L.sx, L.sy, L.sw, L.sh, 0, 0, 1080, 1920);
        else if (L.kind === 'gen') {
          g.translate(L.ax + (L.dx ?? 0), L.ay); g.scale(L.z, L.z); g.translate(-L.ax, -L.ay);
          g.drawImage(im, 0, 0, 1080, 1920);
        } else if (L.kind === 'cap') {
          g.translate(540, 360); g.scale(L.s, L.s); g.translate(-540, -360);
          g.drawImage(im, 0, 0, 1080, 1920);
        } else g.drawImage(im, 0, 0, 1080, 1920);
      }
      g.restore();
    }
    return g.canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
  }, layers);
  writeFileSync(`${out}/f${pad(n)}.jpg`, Buffer.from(data, 'base64'));
}

for (let n = 0; n < TOTAL; n++) await frame(n);
writeFileSync(`${out}/edl.json`, JSON.stringify(SHOTS.map((s) => ({ id: s.id, from: s.from, len: s.len, cap: s.cap ?? null })), null, 1));
await b.close();
console.log('composed', TOTAL, 'frames');
