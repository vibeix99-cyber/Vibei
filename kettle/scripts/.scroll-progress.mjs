// Capture a long route by scrolling the window viewport-by-viewport (what users see).
import { chromium } from 'playwright';
const [,, base, route, seed, theme, size, out] = process.argv;
const SIZES = { small: [320, 640, 2], mobile: [390, 844, 2], tablet: [820, 1180, 1], desktop: [1440, 900, 1] };
const [w, h, dpr] = SIZES[size];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, colorScheme: theme });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 300)));
await page.goto(`${base}/?debug&seed=${seed}&theme=${theme}&motion=reduce#${route}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const full = await page.evaluate(() => document.scrollingElement.scrollHeight);
let i = 0;
for (let y = 0; y < full; y += h - 80, i++) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(250);
  await page.screenshot({ path: out.replace('.png', `-${i}.png`) });
}
console.log(out, full, i);
await browser.close();
