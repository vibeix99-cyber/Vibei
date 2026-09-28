import { chromium } from 'playwright';
const [,, base, theme, out] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: theme, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('[console.error]', m.text().slice(0, 300)); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 400)));
await page.goto(`${base}/?debug&seed=veteran&theme=${theme}&motion=reduce#/stats`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
// 1. Badge sheet
await page.getByRole('button', { name: /^Warm Streak/ }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}-badge.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
// 2. Edit sheet
await page.getByRole('button', { name: /Roadmap draft/ }).first().click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}-edit.png` });
// 3. Delete confirm
await page.getByRole('button', { name: 'Delete this brew' }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}-delete.png` });
await page.getByRole('button', { name: 'Delete', exact: true }).click();
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}-deleted.png` });
// 4. Keyboard on week chart
await page.evaluate(() => document.querySelector('svg[role="group"] g[tabindex="0"]')?.scrollIntoView({ block: 'center' }));
await page.focus('svg[role="group"] g[tabindex="0"]');
await page.keyboard.press('ArrowLeft');
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}-kbd.png` });
console.log('done');
await browser.close();
