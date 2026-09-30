// Render every round-6 mockup frame to ../frames (Kettle dev server on 5191). usage: node shoot.mjs [name-filter]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const filter = process.argv[2] ?? '';
const OUT = new URL('../frames/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const PER_DEVICE = [
  ['home', { screen: 'home' }],
  ['focus-start', { screen: 'focus', p: 0 }],
  ['focus-mid', { screen: 'focus', p: 0.5 }],
  ['focus-whistle', { screen: 'focus', whistle: 1 }],
  ['focus-mid-rm', { screen: 'focus', p: 0.5, rm: 1 }],
  ['focus-whistle-rm', { screen: 'focus', whistle: 1, rm: 1 }],
  ['summary', { screen: 'summary' }],
  ['nook', { screen: 'nook' }],
];
const PHONE_ONLY = [
  ['hello', { screen: 'hello' }],
  ['summary-first', { screen: 'summary', first: 1 }],
];

const jobs = [];
for (const theme of ['light', 'dark'])
  for (const device of ['phone', 'desktop'])
    for (const [name, params] of device === 'phone' ? [...PHONE_ONLY, ...PER_DEVICE] : PER_DEVICE)
      jobs.push({ file: `${device}-${theme}-${name}.png`, params: { ...params, theme, device } });

const b = await chromium.launch();
const ctx = {
  phone: await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }),
  desktop: await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }),
};
for (const j of jobs.filter((x) => x.file.includes(filter))) {
  const p = await ctx[j.params.device].newPage();
  p.on('pageerror', (e) => console.log('pageerror', j.file, e.message));
  p.on('console', (m) => m.type() === 'error' && console.log('console', j.file, m.text().slice(0, 200)));
  const qs = new URLSearchParams(Object.entries(j.params).map(([k, v]) => [k, String(v)]));
  await p.goto(`http://localhost:5191/review/round-6-mockups/build/mock.html?${qs}`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__ready === true);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(250);
  await p.screenshot({ path: OUT + j.file });
  await p.close();
}
await b.close();
console.log('rendered', jobs.filter((x) => x.file.includes(filter)).length, 'frames →', OUT);
