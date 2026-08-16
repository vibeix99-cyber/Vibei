// CRITIC HARNESS — AUDIO, visual (rewrite; the original audio-pix.mjs fails
// with "window.__draw is not a function" because its addScriptTag module never
// binds). Draws waveform + log-f spectrogram strips at ONE absolute scale so
// loudness is comparable row to row, and screenshots them.
// node tests/critic/audio-pix2.mjs --port 8813
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => {
  if (x.startsWith('--')) a.push([x.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return a;
}, []));
const PORT = Number(args.port || 8813);
const OUT = 'tests/shots/audio';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1180, height: 980 } });
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__ARENA && window.__ARENA.ready, null, { timeout: 60000 });
await page.evaluate(() => window.__ARENA.ready);

const DRAW = async ({ rows, title, secs, scale }) => {
  const lab = await import('/tests/critic/audiolab.js');
  const FID = (id) => { const F = window.__ARENA.data.fighters; const L = Array.isArray(F) ? F : Object.values(F); return L.find((f) => f && f.id === id); };
  document.body.innerHTML = '';
  document.body.style.cssText = 'background:#0c0e14;color:#dfe6f5;font:12px ui-monospace,monospace;margin:0;padding:10px';
  const h = document.createElement('div');
  h.textContent = title; h.style.cssText = 'font:700 15px ui-monospace,monospace;color:#f2c94c;margin:2px 0 8px';
  document.body.appendChild(h);
  const SR = lab.SR, W = 940, HW = 34, HS = 50;
  for (const [name, src] of rows) {
    // eslint-disable-next-line no-eval
    const setup = eval('(' + src + ')');
    const buf = await lab.render(setup, secs, { seed: 21 });
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    const n = L.length, mono = new Float32Array(n);
    for (let i = 0; i < n; i++) mono[i] = (L[i] + R[i]) / 2;
    let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(mono[i]));
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:4px';
    const lbl = document.createElement('div');
    lbl.textContent = name.padEnd(17) + 'pk' + pk.toFixed(3) + ' ' + (20 * Math.log10(pk + 1e-9)).toFixed(1) + 'dB';
    lbl.style.cssText = 'width:210px;white-space:pre;color:#9fb0d0';
    const c = document.createElement('canvas'); c.width = W; c.height = HW + HS + 3;
    const g = c.getContext('2d');
    g.fillStyle = '#141826'; g.fillRect(0, 0, W, HW);
    g.strokeStyle = '#2a3350'; g.beginPath(); g.moveTo(0, HW / 2); g.lineTo(W, HW / 2); g.stroke();
    g.fillStyle = '#5ad1ff';
    for (let x = 0; x < W; x++) {
      const i0 = Math.floor(x * n / W), i1 = Math.max(i0 + 1, Math.floor((x + 1) * n / W));
      let mx = 0; for (let i = i0; i < i1; i++) mx = Math.max(mx, Math.abs(mono[i]));
      const hh = Math.min(HW / 2, (mx / scale) * (HW / 2));
      g.fillRect(x, HW / 2 - hh, 1, hh * 2 || 1);
    }
    const N = 1024, hop = Math.max(1, Math.floor(n / W));
    const img = g.createImageData(W, HS);
    for (let x = 0; x < W; x++) {
      const off = x * hop;
      const re = new Float64Array(N), im = new Float64Array(N);
      for (let i = 0; i < N; i++) { const s = off + i < n ? mono[off + i] : 0; re[i] = s * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1))); }
      for (let i = 1, j = 0; i < N; i++) { let b = N >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
      for (let len = 2; len <= N; len <<= 1) {
        const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
        for (let i = 0; i < N; i += len) {
          let cr = 1, ci = 0;
          for (let k = 0; k < len / 2; k++) {
            const ur = re[i + k], ui = im[i + k];
            const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
            re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
            const nc = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nc;
          }
        }
      }
      for (let y = 0; y < HS; y++) {
        const f = 50 * Math.pow(16000 / 50, 1 - y / (HS - 1));
        const bin = Math.max(1, Math.min(N / 2 - 1, Math.round(f / (SR / N))));
        const mag = Math.hypot(re[bin], im[bin]) / N;
        const db = 20 * Math.log10(mag + 1e-9);
        const v = Math.max(0, Math.min(1, (db + 100) / 80));
        const p = (y * W + x) * 4;
        img.data[p] = Math.round(255 * Math.min(1, v * 1.7));
        img.data[p + 1] = Math.round(210 * Math.pow(v, 1.5));
        img.data[p + 2] = Math.round(120 + 135 * Math.pow(v, 3));
        img.data[p + 3] = 255;
      }
    }
    g.putImageData(img, 0, HW + 3);
    wrap.appendChild(lbl); wrap.appendChild(c);
    document.body.appendChild(wrap);
  }
  const f = document.createElement('div');
  f.textContent = `waveform: fixed ±${scale} full-scale (identical every row).  spectrogram 50Hz(bottom)..16kHz(top) log, absolute -100..-20 dBFS.  window ${secs}s`;
  f.style.cssText = 'color:#7d8aa8;margin-top:6px';
  document.body.appendChild(f);
};

const shot = async (file, rows, title, secs, scale = 0.45) => {
  await page.evaluate(DRAW, { rows, title, secs, scale });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/${file}.png`, fullPage: true });
  console.log(`  -> ${OUT}/${file}.png`);
};

// A. What a real battle actually plays, at one absolute scale, vs the bed.
await shot('live-cues-vs-bed', [
  ['MUSIC BED I=0.6', "(A)=>A.scheduleMusicOffline('battle',2.6,0.6)"],
  ['clang (hit x9)', "(A)=>A.sfx('clang')"],
  ['slash_heavy (x8)', "(A)=>A.sfx('slash_heavy')"],
  ['impact_light (x9)', "(A)=>A.sfx('impact_light')"],
  ['impact_med (x5)', "(A)=>A.sfx('impact_med')"],
  ['water_hit (x3)', "(A)=>A.sfx('water_hit')"],
  ['crit (x4)', "(A)=>A.sfx('crit')"],
  ['heal (x12)', "(A)=>A.sfx('heal')"],
  ['buff (x12)', "(A)=>A.sfx('buff')"],
  ['faint (x5)', "(A)=>A.sfx('faint')"],
  ['text_blip (x1027)', "(A)=>A.sfx('text_blip')"],
  ['ui_move (x84)', "(A)=>A.sfx('ui_move')"],
  ['bed + clang hit', "(A)=>{A.scheduleMusicOffline('battle',2.6,0.6);A.sfx('clang');}"],
  ['bed + clang + crit', "(A)=>{A.scheduleMusicOffline('battle',2.6,0.6);A.sfx('clang');A.sfx('crit');}"]
], 'WHAT ONE BATTLE ACTUALLY PLAYS — counts are from the live log — identical absolute scale', 2.6);

// B. Cries
await shot('cries2', [
  ['luffy', "(A)=>A.cry(FID('luffy'))"],
  ['ace', "(A)=>A.cry(FID('ace'))"],
  ['zoro', "(A)=>A.cry(FID('zoro'))"],
  ['ichigo', "(A)=>A.cry(FID('ichigo'))"],
  ['crocodile', "(A)=>A.cry(FID('crocodile'))"],
  ['katakuri', "(A)=>A.cry(FID('katakuri'))"],
  ['usopp', "(A)=>A.cry(FID('usopp'))"],
  ['tanjiro', "(A)=>A.cry(FID('tanjiro'))"],
  ['bigmom', "(A)=>A.cry(FID('bigmom'))"],
  ['kaido', "(A)=>A.cry(FID('kaido'))"],
  ['killua', "(A)=>A.cry(FID('killua'))"],
  ['jinbe', "(A)=>A.cry(FID('jinbe'))"]
], 'FIGHTER CRIES — the 5 tightest nearest-neighbour pairs, plus 2 outliers', 2.4);

// C. Music intensity across the range live play uses
await shot('music-live-range', [
  ['battle I=0.40', "(A)=>A.scheduleMusicOffline('battle',7,0.40)"],
  ['battle I=0.50', "(A)=>A.scheduleMusicOffline('battle',7,0.50)"],
  ['battle I=0.60', "(A)=>A.scheduleMusicOffline('battle',7,0.60)"],
  ['battle I=0.70', "(A)=>A.scheduleMusicOffline('battle',7,0.70)"],
  ['battle I=0.80', "(A)=>A.scheduleMusicOffline('battle',7,0.80)"],
  ['battle I=0.90', "(A)=>A.scheduleMusicOffline('battle',7,0.90)"],
  ['laststand I=.90', "(A)=>A.scheduleMusicOffline('laststand',7,0.90)"],
  ['title I=0.4', "(A)=>A.scheduleMusicOffline('title',7,0.4)"],
  ['victory', "(A)=>A.scheduleMusicOffline('victory',7,0.5)"],
  ['defeat', "(A)=>A.scheduleMusicOffline('defeat',7,0.2)"]
], 'MUSIC — the intensity band live play actually visits is 0.4..0.9', 7.1, 0.35);

await browser.close();
