import { chromium } from '/home/user/wt/w11/kettle/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 1600 } });
await p.goto('http://127.0.0.1:5651/measure.html'); await p.waitForFunction(() => window.loaded);
const out = { shadowNode: await p.evaluate(() => window.sh), img: {}, rive: {} };
for (const n of ['reading','sipping','cheering']) out.img[n] = await p.evaluate(n => window.imgInk(n), n);
for (const pose of [0,1,2]) {
  await p.evaluate(x => window.setPose(x), pose); await p.waitForTimeout(3500);
  const s = [];
  for (let i = 0; i < 40; i++) { s.push(await p.evaluate(() => window.bbox())); await p.waitForTimeout(150); }
  out.rive[pose] = s;
  const col = k => s.map(v => v[k]).sort((a,b)=>a-b);
  console.log(pose, ['x0','y0','x1','y1'].map((n,k)=>`${n} ${col(k)[0]}/${col(k)[20]}/${col(k)[39]}`).join(' | '));
}
console.log(JSON.stringify(out.img));
fs.writeFileSync(process.argv[2], JSON.stringify(out));
await b.close();
