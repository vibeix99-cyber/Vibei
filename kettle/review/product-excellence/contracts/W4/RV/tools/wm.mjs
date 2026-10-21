import { chromium } from '/home/user/wt/w11/kettle/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const E = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 700, height: 820 } });
const reqs = [];
p.on('request', r => reqs.push(r.url()));
const cons = []; p.on('console', m => cons.push(m.type()+': '+m.text()));
await p.goto('http://127.0.0.1:5651/index.html');
await p.waitForFunction(() => window.loadedAt || window.loadErr, null, { timeout: 20000 });
const shot = async (name) => {
  await p.locator('#c').screenshot({ path: `${E}/${name}.png` });
};
// first frame: next rAF after load
await p.evaluate(() => new Promise(r => requestAnimationFrame(() => r())));
await shot('t0-first-frame');
const t0 = Date.now();
await p.waitForTimeout(1000); await shot('t1s');
await p.waitForTimeout(4000); await shot('t5s');
const info = await p.evaluate(() => ({ info: window.info, err: window.loadErr }));
for (const [pose, name] of [[0,'reading'],[1,'sipping'],[2,'cheering']]) {
  await p.evaluate(x => window.setPose(x), pose);
  await p.waitForTimeout(2500);
  await shot(`pose${pose}-${name}`);
  await p.waitForTimeout(3000);
  await shot(`pose${pose}-${name}-b`);
}
await p.screenshot({ path: `${E}/fullpage-after-cheer.png` });
// DOM check: anything other than our canvas?
const dom = await p.evaluate(() => [...document.body.querySelectorAll('*')].map(e => e.tagName + (e.id ? '#'+e.id : '')));
fs.writeFileSync(`${E}/watermark-run.json`, JSON.stringify({ info, dom, requests: reqs, console: cons }, null, 2));
await b.close();
