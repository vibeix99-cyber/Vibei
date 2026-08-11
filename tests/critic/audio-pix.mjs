// CRITIC HARNESS — AUDIO, visual. Renders sounds offline, draws waveform +
// log-frequency spectrogram strips into a canvas and screenshots it, so the
// signal can actually be looked at. node tests/critic/audio-pix.mjs --port 8813
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => {
  if (x.startsWith('--')) a.push([x.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return a;
}, []));
const PORT = Number(args.port || 8813);
const OUT = 'tests/shots/audio';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__ARENA && window.__ARENA.ready, null, { timeout: 60000 });
await page.evaluate(() => window.__ARENA.ready);

await page.addScriptTag({ content: `
window.FID = (id) => { const F = window.__ARENA.data.fighters; const L = Array.isArray(F) ? F : Object.values(F); return L.find((f) => f && f.id === id); };
window.__draw = async function (rows, title, secs) {
  const lab = await import('/tests/critic/audiolab.js');
  document.body.innerHTML = '';
  document.body.style.cssText = 'background:#0c0e14;color:#dfe6f5;font:12px ui-monospace,monospace;margin:0;padding:10px';
  const h = document.createElement('div');
  h.textContent = title; h.style.cssText = 'font:700 15px ui-monospace,monospace;color:#f2c94c;margin:2px 0 8px';
  document.body.appendChild(h);
  const SR = lab.SR, W = 1000, HW = 34, HS = 54;
  for (const [name, setup] of rows) {
    const buf = await lab.render(setup, secs, { seed: 21 });
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    const n = L.length; const mono = new Float32Array(n);
    for (let i = 0; i < n; i++) mono[i] = (L[i] + R[i]) / 2;
    let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(mono[i]));
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:4px';
    const lbl = document.createElement('div');
    lbl.textContent = name.padEnd(16) + ' pk ' + pk.toFixed(3);
    lbl.style.cssText = 'width:168px;white-space:pre;color:#9fb0d0';
    const c = document.createElement('canvas'); c.width = W; c.height = HW + HS + 3;
    const g = c.getContext('2d');
    // waveform (fixed +-0.45 scale so loudness is comparable across rows)
    g.fillStyle = '#141826'; g.fillRect(0, 0, W, HW);
    g.strokeStyle = '#2a3350'; g.beginPath(); g.moveTo(0, HW / 2); g.lineTo(W, HW / 2); g.stroke();
    g.fillStyle = '#5ad1ff';
    for (let x = 0; x < W; x++) {
      const i0 = Math.floor(x * n / W), i1 = Math.floor((x + 1) * n / W);
      let mx = 0; for (let i = i0; i < i1; i++) mx = Math.max(mx, Math.abs(mono[i]));
      const hh = Math.min(HW / 2, (mx / 0.45) * (HW / 2));
      g.fillRect(x, HW / 2 - hh, 1, hh * 2 || 1);
    }
    // log-f spectrogram, absolute dB scale (-100..-20) so brightness = loudness
    const N = 1024, hop = Math.floor(n / W);
    const img = g.createImageData(W, HS);
    for (let x = 0; x < W; x++) {
      const off = x * hop;
      const re = new Float64Array(N), im = new Float64Array(N);
      for (let i = 0; i < N; i++) { const s = off + i < n ? mono[off + i] : 0; re[i] = s * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1))); }
      // inline fft
      for (let i = 1, j = 0; i < N; i++) { let b = N >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
      for (let len = 2; len <= N; len <<= 1) { const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
        for (let i = 0; i < N; i += len) { let cr = 1, ci = 0;
          for (let k = 0; k < len / 2; k++) { const ur = re[i + k], ui = im[i + k];
            const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
            re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
            const nc = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nc; } } }
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
  f.textContent = 'waveform: fixed +-0.45 full-scale.  spectrogram: 50Hz(bottom)..16kHz(top) log, absolute -100..-20 dBFS, window ' + secs + 's';
  f.style.cssText = 'color:#7d8aa8;margin-top:6px';
  document.body.appendChild(f);
};
`, type: 'module' });

const shot = async (file, rows, title, secs) => {
  await page.evaluate(async ([rows, title, secs]) => {
    const build = new Function('A', 'return (' + rows.map((r) => r[1]).join(',') + ')');
    await window.__draw(rows.map(([n, src]) => [n, eval('(' + src + ')')]), title, secs);
  }, [rows, title, secs]);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${file}.png`, fullPage: true });
  console.log(`  -> ${OUT}/${file}.png`);
};

// 1. Do 8 fighters have 8 different cries?

await shot('cries-8', [
  ['luffy', "(A)=>A.cry(FID('luffy'))"],
  ['ace', "(A)=>A.cry(FID('ace'))"],
  ['zoro', "(A)=>A.cry(FID('zoro'))"],
  ['ichigo', "(A)=>A.cry(FID('ichigo'))"],
  ['jinbe', "(A)=>A.cry(FID('jinbe'))"],
  ['katakuri', "(A)=>A.cry(FID('katakuri'))"],
  ['bigmom', "(A)=>A.cry(FID('bigmom'))"],
  ['chopper', "(A)=>A.cry(FID('chopper'))"],
  ['nami', "(A)=>A.cry(FID('nami'))"],
  ['kaido', "(A)=>A.cry(FID('kaido'))"]
], 'FIGHTER CRIES — 10 of 32, same scale', 2.4);

// 2. Does a crit read differently from an ordinary hit? And do the
//    outcome cues survive the music bed?
await shot('hit-vs-crit', [
  ['normal hit', "(A)=>{A.sfx('impact_med');}"],
  ['CRIT hit', "(A)=>{A.sfx('impact_med');A.sfx('crit');}"],
  ['super hit', "(A)=>{A.sfx('impact_med');A.sfx('super');}"],
  ['weak hit', "(A)=>{A.sfx('impact_med');A.sfx('weak');}"],
  ['crit alone', "(A)=>{A.sfx('crit');}"],
  ['weak alone', "(A)=>{A.sfx('weak');}"],
  ['lowhp alone', "(A)=>{A.sfx('lowhp');}"],
  ['text_blip x4', "(A)=>{A.sfx('text_blip');}"],
  ['faint', "(A)=>{A.sfx('faint');}"],
  ['music bed I=0.8', "(A)=>A.scheduleMusicOffline('battle',2,0.8)"],
  ['bed + CRIT hit', "(A)=>{A.scheduleMusicOffline('battle',2,0.8);A.sfx('impact_med');A.sfx('crit');}"]
], 'OUTCOME CUES vs THE MUSIC BED — identical absolute scale', 2.0);

// 3. Music arrangement across intensity
await shot('music-intensity', [
  ['battle I=0.40', "(A)=>A.scheduleMusicOffline('battle',8,0.40)"],
  ['battle I=0.55', "(A)=>A.scheduleMusicOffline('battle',8,0.55)"],
  ['battle I=0.70', "(A)=>A.scheduleMusicOffline('battle',8,0.70)"],
  ['battle I=0.78', "(A)=>A.scheduleMusicOffline('battle',8,0.78)"],
  ['laststand I=.85', "(A)=>A.scheduleMusicOffline('laststand',8,0.85)"],
  ['title', "(A)=>A.scheduleMusicOffline('title',8,0.4)"],
  ['victory', "(A)=>A.scheduleMusicOffline('victory',8,0.5)"],
  ['defeat', "(A)=>A.scheduleMusicOffline('defeat',8,0.2)"]
], 'MUSIC — 8s, intensity sweep across the range battle actually uses (0.4-0.8)', 8.2);

await browser.close();
