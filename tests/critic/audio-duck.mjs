// CRITIC HARNESS (4th pass) — the graph contains a `musicDuck` node. Does the
// music actually duck when a cue fires? Everything summed offline in ONE context
// (so the duck, if any, is exercised) and compared sample-wise against a bed-only
// render at the same seed.  node tests/critic/audio-duck.mjs --port 8813
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => {
  if (x.startsWith('--')) a.push([x.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return a;
}, []));
const PORT = Number(args.port || 8813);
const OUT = 'tests/shots/audio';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__ARENA && window.__ARENA.ready, null, { timeout: 60000 });
await page.evaluate(() => window.__ARENA.ready);

const R = await page.evaluate(async () => {
  const lab = await import('/tests/critic/audiolab.js');
  const SR = lab.SR, DUR = 6.0;
  const mono = (b) => { const L = b.getChannelData(0), Rr = b.getChannelData(1), n = L.length, o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = (L[i] + Rr[i]) / 2; return o; };
  const rms = (x, i0, i1) => { let s = 0; for (let i = i0; i < i1; i++) s += x[i] * x[i]; return Math.sqrt(s / (i1 - i0)); };
  const db = (v) => +(20 * Math.log10(v + 1e-12)).toFixed(2);

  const bedOnly = mono(await lab.render((A) => A.scheduleMusicOffline('battle', DUR, 0.6), DUR, { seed: 31 }));
  const out = {};
  for (const k of ['crit', 'faint', 'clang', 'impact_light', 'text_blip', 'heal', 'impact_world']) {
    const cue = mono(await lab.render((A) => A.sfx(k), 3.0, { seed: 31 }));
    const mix = mono(await lab.render((A) => { A.scheduleMusicOffline('battle', DUR, 0.6); A.sfx(k); }, DUR, { seed: 31 }));
    // cue fires at t=0 in both; compare over 0..1.5s and 0..0.2s
    for (const [tag, secs] of [['w200ms', 0.2], ['w1500ms', 1.5]]) {
      const n = Math.floor(secs * SR);
      const bedIn = rms(bedOnly, 0, n);
      const mixIn = rms(mix, 0, n);
      // residual after removing the cue: what the music is doing inside the mix
      let s = 0; for (let i = 0; i < n; i++) { const r = mix[i] - cue[i]; s += r * r; }
      const musicInMix = Math.sqrt(s / n);
      out[`${k}.${tag}`] = {
        bedAlone: db(bedIn), mix: db(mixIn), cueAlone: db(rms(cue, 0, n)),
        musicInsideMix: db(musicInMix),
        duckDb: +(db(musicInMix) - db(bedIn)).toFixed(2)
      };
    }
    // recovery: music level 1.5-3.0s after the cue
    const a = Math.floor(1.5 * SR), b = Math.floor(3.0 * SR);
    let s2 = 0; for (let i = a; i < b; i++) { const r = mix[i] - (cue[i] || 0); s2 += r * r; }
    out[`${k}.tail1.5-3s`] = { bedAlone: db(rms(bedOnly, a, b)), musicInsideMix: db(Math.sqrt(s2 / (b - a))), duckDb: +(db(Math.sqrt(s2 / (b - a))) - db(rms(bedOnly, a, b))).toFixed(2) };
  }
  // and a whole real burst: 6 cues at once
  const cueSet = ['clang', 'crit', 'lowhp', 'text_blip', 'buff', 'faint'];
  const burstCue = mono(await lab.render((A) => { for (const k of cueSet) A.sfx(k); }, 3.0, { seed: 31 }));
  const burstMix = mono(await lab.render((A) => { A.scheduleMusicOffline('battle', DUR, 0.6); for (const k of cueSet) A.sfx(k); }, DUR, { seed: 31 }));
  const n = Math.floor(1.0 * SR);
  let s3 = 0; for (let i = 0; i < n; i++) { const r = burstMix[i] - burstCue[i]; s3 += r * r; }
  let pk = 0; for (let i = 0; i < burstMix.length; i++) pk = Math.max(pk, Math.abs(burstMix[i]));
  out['BURST6.w1000ms'] = { bedAlone: db(rms(bedOnly, 0, n)), mix: db(rms(burstMix, 0, n)), cueAlone: db(rms(burstCue, 0, n)), musicInsideMix: db(Math.sqrt(s3 / n)), duckDb: +(db(Math.sqrt(s3 / n)) - db(rms(bedOnly, 0, n))).toFixed(2), mixPeak: +pk.toFixed(4) };
  return out;
});

await writeFile(`${OUT}/duck4.json`, JSON.stringify(R, null, 1));
console.log('DUCKING PROBE — "musicInsideMix" is (mix - cueAlone), i.e. what the music is');
console.log('actually doing while the cue plays. duckDb < 0 means the music got out of the way.\n');
console.log('case                       bedAlone  musicInMix  duckDb   cueAlone   mixRms');
for (const [k, v] of Object.entries(R))
  console.log(`  ${k.padEnd(24)} ${String(v.bedAlone).padEnd(9)} ${String(v.musicInsideMix).padEnd(11)} ${String(v.duckDb).padStart(6)}   ${String(v.cueAlone ?? '-').padEnd(9)} ${v.mix ?? '-'}`);
await browser.close();
