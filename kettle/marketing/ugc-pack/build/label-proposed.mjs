// UGC pack: copy selected round-6 mockup frames with a permanent "PROPOSED REDESIGN · NOT IN THE CURRENT APP"
// band above each image, so they cannot be mistaken for the app even when separated from the pack.
// usage (from kettle/): node marketing/ugc-pack/build/label-proposed.mjs
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
const SRC = 'review/round-6-mockups/frames/';
const OUT = 'marketing/ugc-pack/proposed-redesign-NOT-IN-APP/';
mkdirSync(OUT, { recursive: true });
const pick = [
  ['phone-light-home', 'PROPOSED-01-home'],
  ['phone-light-focus-mid', 'PROPOSED-02-focus'],
  ['phone-dark-focus-mid', 'PROPOSED-02b-focus-dark'],
  ['phone-light-focus-whistle', 'PROPOSED-03-whistle'],
  ['phone-light-summary-routine', 'PROPOSED-03b-completion-summary'],
  ['phone-light-summary-unlock', 'PROPOSED-03c-completion-room-unlock'],
  ['phone-light-focus-break', 'PROPOSED-04-tea-break'],
];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 });
for (const [src, name] of pick) {
  const img = readFileSync(SRC + src + '.png').toString('base64');
  await p.setContent(`<body style="margin:0;width:390px;background:#fff"><div style="height:44px;display:grid;place-items:center;background:#d9582b;color:#fff;font:800 13px system-ui;letter-spacing:.05em">PROPOSED REDESIGN · NOT IN THE CURRENT APP</div><img style="display:block;width:390px" src="data:image/png;base64,${img}"></body>`);
  await p.waitForTimeout(150);
  await p.locator('body').screenshot({ path: OUT + name + '.png' });
}
await b.close();
console.log('labelled', pick.length);
