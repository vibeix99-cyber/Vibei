import { chromium } from '/home/user/wt/w11/kettle/node_modules/playwright/index.mjs';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 1600 } });
await p.goto('http://127.0.0.1:5651/measure.html'); await p.waitForFunction(() => window.loaded);
for (const pose of [0,1,2]) {
await p.evaluate(x => window.setPose(x), pose); await p.waitForTimeout(4000);
const s = [];
for (let i = 0; i < 80; i++) { s.push(await p.evaluate(() => { const c=document.getElementById('c'); const d=c.getContext('2d').getImageData(0,0,1312,1586).data;
  // body column only: x in [200,1110]
  let y0=-1,y1=-1,x0=1e9,x1=-1; for(let y=0;y<1586;y++){ for(let x=200;x<1110;x++){ if(d[(y*1312+x)*4+3]>8){ if(y0<0)y0=y; y1=y; } } }
  // body width at the belly row y = y1-150
  const yy=y1-150; for(let x=0;x<1312;x++){ if(d[(yy*1312+x)*4+3]>8){ x0=Math.min(x0,x); x1=Math.max(x1,x);} }
  return [y0,y1+1,x0,x1+1]; })); await p.waitForTimeout(100); }
const g = s.filter(v => v[1] >= 1451);
const y0 = g.map(v=>v[0]).sort((a,b)=>a-b);
console.log('pose',pose,'ground frames', g.length, 'y0 min/med/max', y0[0], y0[y0.length>>1], y0[y0.length-1], 'y1', [...new Set(g.map(v=>v[1]))], 'bellyX', [...new Set(g.map(v=>v[2]+'-'+v[3]))].slice(0,5));
}
await b.close();
