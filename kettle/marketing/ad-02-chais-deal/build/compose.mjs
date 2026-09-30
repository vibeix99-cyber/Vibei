#!/usr/bin/env node
/**
 * Ad 02 "Chai's deal" compositor: draws every output frame (1080×1920, 30 fps, 18.0 s = 540 frames) on a
 * canvas in Chromium. Layers:
 *   - drawn frames from render-stage.mjs (ov/rise, ov/settle, ov/end) and caption PNGs (ov/c*.png)
 *   - generated clips at 24 fps (g1f, g2f, g2rf), retimed per shot with frame blending
 *   - the real app recording (rec/, 600×1000 CSS px at DPR 2.5) seen through a per-shot camera window
 * Output: <out>/f0000.jpg … + edl.json (then encode.sh adds the sound).
 *
 * usage: node compose.mjs <base-url> <work-dir> <out-dir>     (work-dir must be served by base-url)
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const [base = 'http://localhost:5191', work = '.tmp/ad2', out = '.tmp/ad2/out'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const ev = JSON.parse(readFileSync(`${work}/rec/events.json`, 'utf8'));
const DPR = ev.viewport.dpr;
const tap = ev.segments['a-home-focus'].taps[0]; // recorded at rec frame 30, CSS (292.5, 704)
const pad = (n) => String(n).padStart(4, '0');
const ease = (k) => k * k * (3 - 2 * k);
const clamp = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, k) => a + (b - a) * k;
const cam = (a, b, k) => ({ w: lerp(a[0], b[0], k), cx: lerp(a[1], b[1], k), cy: lerp(a[2], b[2], k) });

// Generated clip time (seconds, 24 fps source) → two frames + blend weight.
const gen = (dir, count) => (t) => {
  const f = Math.min(count - 1, Math.max(0, t * 24));
  const i = Math.floor(f);
  return { a: `${dir}/f${pad(i + 1)}.jpg`, b: `${dir}/f${pad(Math.min(count - 1, i + 1) + 1)}.jpg`, k: f - i };
};
const G1 = gen('g1f', 73);
const G2 = gen('g2f', 169);
const G2R = gen('g2rf', 97);

// Camera framings (CSS px of the recording: width, centre x, centre y).
const HOME_A = [540, 300, 520], HOME_B = [350, 296, 680]; // whole task card → push in on the button label
const NOOK_CLOSE = [240, 205, 285], NOOK_WIDE = [560, 300, 510];
const RING = [540, 300, 520];
const TEA = [420, 270, 400];

// ---------------------------------------------------------------- edit decision list (frames @30)
const SHOTS = [
  // 0.00–0.30 Chai rises over the towering list (drawn from the app's Mascot + KettleMark)
  { id: 'rise', from: 0, len: 9, full: (i) => `ov/rise/f${pad(i)}.png`, cap: 'c1' },
  // 0.30–2.20 generated: blink, glance, the paw slides the tiny kettle in. Piecewise retime (×1.39 then ×1.5).
  { id: 'g1', from: 9, len: 57, gen: (i) => G1(i < 27 ? (i / 30) * 1.389 : 1.25 + ((i - 27) / 30) * 1.5), cap: (i) => (9 + i < 36 ? 'c1' : 'c2') },
  // 2.20–2.67 drawn: the list settles into one card, "Chapter 3 notes"
  { id: 'settle', from: 66, len: 14, full: (i) => `ov/settle/f${pad(i)}.png`, cap: 'c2', xfade: 3 },
  // 2.67–3.73 real Home: "Chapter 3 notes" + Study, then the tap on "Put the kettle on" (rec frame 30)
  { id: 'home', from: 80, len: 32, rec: (i) => `rec/a-home-focus/f${pad(i + 2)}.jpg`, cam: (k) => cam(HOME_A, HOME_B, ease(k)), tapAt: 28, xfade: 6 },
  // 3.73–7.00 real Focus (from rec 60, after the app's own nook intro): close on Chai napping by the kettle, easing out to the timer
  { id: 'focus', from: 112, len: 98, rec: (i) => `rec/a-home-focus/f${pad(60 + i)}.jpg`, cam: (k) => cam(NOOK_CLOSE, NOOK_WIDE, ease(clamp((k - 0.3) / 0.6))), cap: (i) => (112 + i >= 117 ? 'c4' : null) },
  // 7.00–10.00 generated (replacement): a blank page, one uneven first line, then it carries on (×1.1)
  { id: 'pencil', from: 210, len: 90, gen: (i) => G2R((i / 30) * 1.1), cap: 'c5', xfade: 4 },
  // 10.00–10.27 back in the nook, same framing as the end of Focus (24:55)…
  { id: 'jumpA', from: 300, len: 8, rec: (i) => `rec/a-home-focus/f${pad(170 + i)}.jpg`, cam: () => cam(NOOK_WIDE, NOOK_WIDE, 0), cap: 'c6', xfade: 4 },
  // 10.27–12.00 …flash: 00:03, the kettle starts to steam (the app clock was jumped; disclosed by the caption)
  { id: 'jumpB', from: 308, len: 52, rec: (i) => `rec/b-whistle/f${pad(i)}.jpg`, cam: () => cam(NOOK_WIDE, NOOK_WIDE, 0), cap: 'c6', capContinues: true, flash: 6 },
  // 12.00–12.83 real: 00:00 → the whistle, steam jet, the green ring "Tea's ready", Chai cheering
  { id: 'whistle', from: 360, len: 25, rec: (i) => `rec/b-whistle/f${pad(86 + i)}.jpg`, cam: (k) => cam(NOOK_WIDE, RING, ease(k) * 0.35) },
  // 12.83–14.00 real: "The kettle's whistling!" celebration with Chai
  { id: 'celebrate', from: 385, len: 35, rec: (i) => `rec/b-whistle/f${pad(140 + i)}.jpg`, cam: (k) => cam([560, 300, 540], [540, 300, 540], k), cap: 'c7', xfade: 4 },
  // 14.00–15.00 real Tea time screen
  { id: 'tea', from: 420, len: 30, rec: (i) => `rec/c-break/f${pad(20 + i)}.jpg`, cam: (k) => cam(TEA, [400, 268, 405], k), xfade: 5 },
  // 15.00–16.20 generated: the hand lays the pencil down and reaches for the orange mug (×1.6)
  { id: 'mug', from: 450, len: 36, gen: (i) => G2((108 - 1) / 24 + (i / 30) * 1.6), xfade: 5 },
  // 16.20–18.00 drawn end card: Chai sipping, the Kettle wordmark, "A cozy focus timer", "Follow for launch."
  { id: 'end', from: 486, len: 54, full: (i) => `ov/end/f${pad(i)}.png`, xfade: 6 },
];
const TOTAL = 540;

// ---------------------------------------------------------------- browser canvas
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto(`${base}/marketing/ad-02-chais-deal/build/stage.html?mode=none`, { waitUntil: 'load' });
await p.evaluate(({ base, work }) => {
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1920;
  document.body.appendChild(c);
  window.__c = c.getContext('2d');
  window.__cache = new Map();
  window.__img = (u) => {
    if (!window.__cache.has(u)) {
      window.__cache.set(u, new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('missing ' + u)); im.src = `${base}/${work}/${u}`; }));
      if (window.__cache.size > 60) window.__cache.delete(window.__cache.keys().next().value);
    }
    return window.__cache.get(u);
  };
}, { base, work });

function shotLayers(s, i, alpha) {
  const k = s.len > 1 ? i / (s.len - 1) : 0;
  const L = [];
  if (s.full) L.push({ kind: 'full', src: s.full(i), alpha });
  else if (s.gen) {
    const g = s.gen(i);
    L.push({ kind: 'full', src: g.a, alpha });
    if (g.k > 0.02) L.push({ kind: 'full', src: g.b, alpha: alpha * g.k });
  } else {
    const c = s.cam(k);
    const h = (c.w * 16) / 9;
    L.push({ kind: 'rec', src: s.rec(i), sx: (c.cx - c.w / 2) * DPR, sy: (c.cy - h / 2) * DPR, sw: c.w * DPR, sh: h * DPR, alpha });
    if (s.tapAt !== undefined && i >= s.tapAt - 5 && i < s.tapAt + 7) {
      const t = (i - (s.tapAt - 5)) / 11; // finger down just before the real tap frame (the app switches screens at once)
      L.push({ kind: 'ripple', x: ((tap.x - (c.cx - c.w / 2)) * 1080) / c.w, y: ((tap.y - (c.cy - h / 2)) * 1080) / c.w, t });
    }
  }
  return L;
}

async function frame(n) {
  const s = SHOTS.findLast((x) => n >= x.from);
  const i = n - s.from;
  let layers = [];
  if (s.xfade && i < s.xfade) {
    const prev = SHOTS[SHOTS.indexOf(s) - 1];
    layers.push(...shotLayers(prev, prev.len - 1, 1));
    layers.push(...shotLayers(s, i, ease((i + 1) / (s.xfade + 1))));
  } else layers.push(...shotLayers(s, i, 1));
  if (s.flash && i < s.flash) layers.push({ kind: 'flash', a: 0.75 * (1 - i / s.flash) });
  const capId = typeof s.cap === 'function' ? s.cap(i) : s.cap;
  if (capId) {
    // Pop in when the caption changes; carry over unchanged across shots.
    let since = 0;
    for (let m = n; m >= 0; m--) {
      const sm = SHOTS.findLast((x) => m >= x.from);
      const cm = typeof sm.cap === 'function' ? sm.cap(m - sm.from) : sm.cap;
      if (cm !== capId) break;
      since = n - m;
    }
    const a = since === n ? 1 : clamp((since + 1) / 5); // the hook caption is fully there on frame 0
    layers.push({ kind: 'cap', src: `ov/${capId}.png`, s: 0.94 + 0.06 * ease(a), alpha: a });
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
      } else if (L.kind === 'flash') {
        g.globalCompositeOperation = 'lighter';
        g.fillStyle = `rgba(255,236,200,${L.a})`;
        g.fillRect(0, 0, 1080, 1920);
      } else {
        const im = await window.__img(L.src);
        g.imageSmoothingQuality = 'high';
        if (L.kind === 'rec') g.drawImage(im, L.sx, L.sy, L.sw, L.sh, 0, 0, 1080, 1920);
        else if (L.kind === 'cap') {
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

const only = process.env.FRAMES ? process.env.FRAMES.split(',').map(Number) : null;
for (let n = 0; n < TOTAL; n++) if (!only || only.includes(n)) await frame(n);
writeFileSync(`${out}/edl.json`, JSON.stringify(SHOTS.map((s) => ({ id: s.id, from: s.from, len: s.len, t0: +(s.from / 30).toFixed(3), t1: +((s.from + s.len) / 30).toFixed(3) })), null, 1));
await b.close();
console.log('composed', only ? only.length : TOTAL, 'frames');
