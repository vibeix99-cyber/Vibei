/**
 * Turns raw captures (RAW=./raw, produced by capture-*.mjs) into responsive WebP files in public/img
 * and writes src/images.json (name -> intrinsic size + available widths) for the templates.
 * Processed output is committed; raw PNGs are not (they are large and reproducible).
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const RAW = path.resolve(process.env.RAW ?? './raw');
const OUT = path.resolve('public/img');
fs.mkdirSync(OUT, { recursive: true });

/** name, source file (without .png), widths, quality, optional crop {left,top,width,height} in source px */
const jobs = [];
const phone = (name, src = name, crop) => jobs.push({ name, src, widths: [390, 780], q: 80, crop });
[
  'm-welcome', 'm-ob-name', 'm-ob-goal', 'm-ob-rhythm', 'm-ob-sound', 'm-ob-nudge', 'm-ob-ready', 'm-home', 'm-focus', 'm-focus-late',
  'm-done-1', 'm-done-2', 'm-done-3', 'm-done-4', 'm-tea-break', 'm-settings', 'd-home', 'd-focus', 'd-nook', 'd-stats', 'd-tea-break',
].forEach((n) => phone(n));
// tile crops (source is 780x1688): each cut sits on a clean edge of the UI
phone('tile-sounds', 'm-ob-sound', { left: 0, top: 440, width: 780, height: 975 });
phone('tile-rhythm', 'm-ob-rhythm', { left: 0, top: 456, width: 780, height: 930 });
phone('tile-recipes', 'm-done-2', { left: 0, top: 844, width: 780, height: 650 });
phone('tile-badge', 'm-done-3', { left: 0, top: 557, width: 780, height: 726 });
phone('tile-plum', 'd-home', { left: 0, top: 0, width: 780, height: 850 });
phone('tile-nudge', 'm-ob-nudge', { left: 0, top: 726, width: 780, height: 590 });
phone('m-stats-a', 'm-stats-tall', { left: 0, top: 0, width: 780, height: 1688 });
phone('m-stats-b', 'm-stats-tall', { left: 0, top: 1660, width: 780, height: 1688 });
// nook scene matrix: t0 auto, t1 morning, t2 daytime, t3 dusk, t4 night; w0 auto(rain), w1 clear, w2 rain, w3 snow
for (const t of [1, 2, 3, 4]) for (const w of [1, 2, 3]) jobs.push({ name: `nook-t${t}-w${w}`, src: `nook-t${t}-w${w}`, widths: [640, 960], q: 80, inset: 24 });
jobs.push({ name: 'fallback-rain', src: 'x-nook-fallback-rain', widths: [640, 960], q: 80 });
jobs.push({ name: 'fallback-snow', src: 'x-nook-fallback-snow', widths: [640, 960], q: 80 });
jobs.push({ name: 'kit', src: 'x-kit', widths: [640, 1280], q: 80, crop: { left: 0, top: 0, width: 2560, height: 1000 } });

const manifest = {};
for (const j of jobs) {
  const file = path.join(RAW, j.src + '.png');
  if (!fs.existsSync(file)) { console.warn('missing', j.src); continue; }
  let base = sharp(file);
  if (j.crop) base = base.extract(j.crop);
  if (j.inset) { const m0 = await sharp(file).metadata(); base = base.extract({ left: j.inset, top: j.inset, width: m0.width - 2 * j.inset, height: m0.height - 2 * j.inset }); }
  const buf = await base.toBuffer();
  const meta = await sharp(buf).metadata();
  const widths = j.widths.filter((w) => w <= meta.width);
  if (!widths.length) widths.push(meta.width);
  for (const w of widths) {
    await sharp(buf).resize({ width: w }).webp({ quality: j.q, effort: 5 }).toFile(path.join(OUT, `${j.name}-${w}.webp`));
  }
  const top = Math.max(...widths);
  manifest[j.name] = { w: top, h: Math.round((meta.height * top) / meta.width), widths };
  console.log(j.name, widths.join('/'));
}

// Chai SVGs -> public/img/chai/<pose>.svg
const chaiJson = path.join(RAW, 'chai-svgs.json');
if (fs.existsSync(chaiJson)) {
  const poses = JSON.parse(fs.readFileSync(chaiJson, 'utf8'));
  const dir = path.join(OUT, 'chai'); fs.mkdirSync(dir, { recursive: true });
  const names = [];
  for (const p of poses) {
    const pose = (p.label || '').trim().toLowerCase().replace(/[^a-z]/g, '') || 'pose';
    let svg = p.svg
      .replace(/var\(--art-shadow\)/g, 'rgba(59, 42, 32, 0.13)')
      .replace(/ style="[^"]*"/g, '')
      .replace(/ (data-[a-z-]+|aria-[a-z]+|role|focusable)="[^"]*"/g, '');
    if (!/xmlns=/.test(svg)) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    // ids inside each SVG are already pose-scoped by the app; keep them
    fs.writeFileSync(path.join(dir, pose + '.svg'), svg);
    names.push(pose);
  }
  manifest.__chai = names;
  console.log('chai', names.join(','));
}
fs.writeFileSync('src/images.json', JSON.stringify(manifest, null, 1));
console.log('wrote src/images.json');

// Social card (1200x630): the night nook on the hall's dusk colour.
{
  const nook = path.join(RAW, 'nook-t4-w2.png');
  if (fs.existsSync(nook)) {
    const scene = await sharp(nook).extract({ left: 24, top: 24, width: 980, height: 800 }).resize({ height: 630 }).toBuffer();
    await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#14111c' } })
      .composite([{ input: scene, left: 600, top: 0 }, { input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="g" x1="0" x2="1"><stop offset=".45" stop-color="#14111c"/><stop offset=".62" stop-color="#14111c" stop-opacity="0"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><text x="64" y="330" font-family="Georgia,serif" font-size="112" fill="#f6ecdc" letter-spacing="-3">Valeoforth</text><text x="68" y="392" font-family="Helvetica,Arial,sans-serif" font-size="30" fill="#ffd9a0">A house for the things I build.</text></svg>'), left: 0, top: 0 }])
      .png().toFile(path.join(OUT, 'og.png'));
    console.log('og.png');
  }
}
