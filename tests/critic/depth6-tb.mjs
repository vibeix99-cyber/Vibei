// CRITIC — DEPTH: the team-building half. Screenshots of the builder and dex.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const PORT = Number(arg('port', 8871));
const OUT = arg('out', 'tests/shots/depth6');

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e.message)));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await mkdir(OUT, { recursive: true });
await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__ARENA?.ready, null, { timeout: 90000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio?.setMuted?.(true));

await page.evaluate(() => window.__ARENA.router.go('teambuilder'));
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/10-teambuilder.png` });
// click the first roster row to open the editor
await page.evaluate(() => { document.querySelector('.trow')?.click(); });
await page.waitForTimeout(900);
await page.evaluate(() => { document.querySelector('.slot')?.click(); });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/11-editor.png` });
const editorText = await page.evaluate(() => document.querySelector('.tb-grid')?.innerText.replace(/\n{2,}/g, '\n').slice(0, 2500));
console.log('---- TEAMBUILDER TEXT ----\n' + editorText);

await page.evaluate(() => window.__ARENA.router.go('dex'));
await page.waitForTimeout(2000);
await page.screenshot({ path: `${OUT}/12-dex.png` });
console.log('\nerrors:', errs.length ? errs : 'none');
await browser.close();
