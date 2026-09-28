// Progress-area review capture: full-height screenshot of a route by growing the viewport.
import { chromium } from 'playwright';
const [,, base, route, seed, theme, size, out, evalJs] = process.argv;
const SIZES = { small: [320, 640, 2], mobile: [390, 844, 2], tablet: [820, 1180, 1], desktop: [1440, 900, 1] };
const [w, h, dpr] = SIZES[size];
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, colorScheme: theme, isMobile: size !== 'desktop' && size !== 'tablet' ? true : false, hasTouch: size !== 'desktop' });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[console]', m.type(), m.text().slice(0, 300)); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 600)));
await page.goto(`${base}/?debug&seed=${seed}&theme=${theme}&motion=reduce#${route}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
if (evalJs) { await page.evaluate(evalJs); await page.waitForTimeout(900); }
const full = await page.evaluate(() => Math.max(document.scrollingElement.scrollHeight, document.getElementById('main')?.scrollHeight ?? 0));
await page.setViewportSize({ width: w, height: Math.min(full + 40, 9000) });
await page.waitForTimeout(600);
const seg = size === 'desktop' ? 1100 : 1250;
const n = Math.ceil(Math.min(full + 40, 9000) / seg);
for (let i = 0; i < n; i++) {
  await page.screenshot({ path: out.replace('.png', `-${i}.png`), clip: { x: 0, y: i * seg, width: w, height: Math.min(seg, full + 40 - i * seg) } });
}
const overflow = await page.evaluate(() => document.scrollingElement.scrollWidth > document.scrollingElement.clientWidth);
console.log(out, 'height', full, overflow ? 'HORIZONTAL OVERFLOW' : '');
await browser.close();
