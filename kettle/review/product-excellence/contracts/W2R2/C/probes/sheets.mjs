// Compose the art-review sheet and the BEFORE/AFTER contact sheets from local PNGs (HTML → browser screenshot).
//   node sheets.mjs --c <…/W2R2/C dir>
import { chromium } from 'playwright';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith('--') && a.push([x.slice(2), all[i + 1]]), a), []));
const C = args.c;
const ART = join(C, '../../../../../art-src/chai');
const css = `body{margin:0;padding:24px;background:#fff9f0;font:14px/1.35 system-ui,sans-serif;color:#3a251b}h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:22px 0 8px}
.row{display:flex;gap:10px;align-items:flex-start;margin-bottom:12px}.cell{background:#fff;border:1px solid #e8d8c4;border-radius:8px;padding:6px;text-align:center}
.cell img{display:block;object-fit:contain;background:#f3ead9}.cap{font-size:12px;margin-top:4px;max-width:260px}.note{max-width:1500px;margin:6px 0 10px}`;
const img = (from, path, h, cap) => existsSync(path) ? `<div class="cell"><img src="${relative(from, path)}" style="height:${h}px"><div class="cap">${cap}</div></div>` : `<div class="cell"><div class="cap">missing: ${relative(C, path)}</div></div>`;

async function shoot(html, out, width) {
  const htmlPath = out.replace(/\.png$/, '.html');
  writeFileSync(htmlPath, `<!doctype html><meta charset="utf-8"><style>${css}</style>${html}`);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: 1 });
  await p.goto('file://' + htmlPath);
  await p.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
}

// ---- art review
if (args.only !== 'captures') {
  const dir = join(C, 'art');
  const meta = existsSync(join(dir, 'art-meta.json')) ? JSON.parse(readFileSync(join(dir, 'art-meta.json'), 'utf8')) : {};
  const sheetCell = { awake: 'chai-happy.png', nap: 'chai-sleep.png', sip: 'chai-sipping.png' };
  let html = `<h1>3D Chai r1 in the room: art review for Vibei</h1>
<div class="note">Model <code>chai.glb</code> sha256 <code>b401bc6c…463d7e</code>, wired as in branch <code>pe/w2r2-chai3d</code>. In-room renders: the shipped engine (high tier: PBR, lamp shadow), Nook at
1200×900@2, the room's own camera direction moved in on the cushion, fixed motion phase (t = 7.35 s, the reduced-motion frame). Chai sits on the cushion
(level 12 profile) at root scale 1.12, turned 0.62 rad. Fur keeps the procedural Chai's night self-fill (vertex colour × 0.16). Left to right: the approved sheet cell,
REPORT.md's orthographic render, the model in the room (day, dark theme = evening, night), and today's procedural Chai in the same frame for reference.</div>`;
  for (const pose of ['awake', 'nap', 'sip']) {
    html += `<h2>${pose}${pose === 'awake' ? ' (Nook, every showcase)' : pose === 'nap' ? ' (focus mode; not mounted on any screen today)' : ' (break mode; not mounted today)'}</h2><div class="row">`;
    html += img(dir, join(ART, sheetCell[pose]), 300, `approved sheet: ${sheetCell[pose]}`);
    html += img(dir, join(ART, `front_${pose}.png`), 300, `REPORT.md front_${pose}.png`);
    for (const l of ['day', 'evening', 'night']) html += img(dir, join(dir, `model-${pose}-${l}.png`), 300, `model in the room, ${l}`);
    html += img(dir, join(dir, `procedural-${pose}-day.png`), 300, 'procedural (today), day');
    html += `</div>`;
  }
  html += `<h2>Night reference (procedural, same frames)</h2><div class="row">${['awake', 'nap', 'sip'].map((p) => img(dir, join(dir, `procedural-${p}-night.png`), 220, `procedural ${p}, night`)).join('')}</div>`;
  html += `<h2>REPORT.md renders (Blender, no room)</h2><div class="row">${img(dir, join(ART, 'three_quarter.png'), 260, 'three_quarter.png')}${img(dir, join(ART, 'nook_280px.png'), 260, 'nook_280px.png')}${img(dir, join(ART, 'dusk_night.png'), 260, 'dusk_night.png')}</div>`;
  html += `<h2>At the size people see it: the Nook, whole room (AFTER captures, crop of the full screen)</h2><div class="row">`;
  for (const cfg of ['390x844-light-day', '1440x900-light-day', '1440x900-dark-day', '1440x900-light-night']) html += img(dir, join(C, 'captures/AFTER', cfg, '10-nook-3d.png'), 320, `AFTER ${cfg}`);
  html += `</div><div class="row">`;
  for (const cfg of ['390x844-light-day', '1440x900-light-day', '1440x900-dark-day', '1440x900-light-night']) html += img(dir, join(C, 'captures/AFTER', cfg, '11-nook-chai-close.png'), 320, `AFTER ${cfg}, camera moved in`);
  html += `</div><div class="note">Shots: ${Object.keys(meta.shots ?? {}).length}; errors: ${(meta.errors ?? []).length}.</div>`;
  await shoot(html, join(dir, 'ART-REVIEW-SHEET.png'), 1900);
}

// ---- BEFORE / AFTER contact sheets
{
  const cfgs = ['390x844-light-day', '390x844-dark-day', '390x844-light-night', '1440x900-light-day', '1440x900-dark-day', '1440x900-light-night'];
  for (const state of [['10-nook-3d', 'Nook'], ['07-unlock', 'Summary unlock close-up'], ['07-unlock-early', 'Summary unlock ~0.9 s after Done']]) {
    const dir = join(C, 'captures');
    let html = `<h1>${state[1]}: BEFORE b377c62 (:5430) vs AFTER (:5433), same session, ${args.tierlabel ?? 'high tier (nookq=high)'}</h1>`;
    for (const cfg of cfgs) {
      const mb = join(dir, 'AFTER', cfg, 'meta.json');
      const t = (lab) => { const f = join(dir, lab, cfg, 'meta.json'); if (!existsSync(f)) return ''; const m = JSON.parse(readFileSync(f, 'utf8')); return m.unlockTiming ? ` · unlock ready ${m.unlockTiming.readyAfterDoneMs} ms after Done` : ''; };
      html += `<h2>${cfg}</h2><div class="row">${img(dir, join(dir, 'BEFORE', cfg, state[0] + '.png'), cfg.startsWith('390') ? 560 : 420, 'BEFORE' + t('BEFORE'))}${img(dir, join(dir, 'AFTER', cfg, state[0] + '.png'), cfg.startsWith('390') ? 560 : 420, 'AFTER' + t('AFTER'))}</div>`;
      void mb;
    }
    await shoot(html, join(dir, `SHEET-${state[0]}.png`), 1600);
  }
}
console.log('sheets done');
