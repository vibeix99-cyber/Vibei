// UGC pack: clean phone screenshots of the real, unchanged Kettle production build (vite preview on 4173).
// One continuous session per theme on the "celebrate" demo profile (Mika, 6 days warm, 12 of 30 min today),
// so every screen shows the same data. `?debug` only enables the demo profile and the app's clock API;
// it draws nothing on screen. No browser chrome: these are viewport screenshots.
//
// usage (from kettle/): node marketing/ugc-pack/build/capture-screens.mjs <light|dark>
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const theme = process.argv[2] ?? 'light';
const OUT = `marketing/ugc-pack/screenshots/${theme}`;
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3, // 1170 × 2532, an iPhone-class portrait screen
  isMobile: true,
  hasTouch: true,
  serviceWorkers: 'block',
  colorScheme: theme,
});
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('pageerror', e.message));
await p.goto(`http://localhost:4173/?debug&seed=celebrate&theme=${theme}#/`, { waitUntil: 'networkidle' });
await p.waitForFunction(() => '__kettle' in window);
await p.waitForTimeout(2500);
const shot = (n) => p.screenshot({ path: `${OUT}/${n}.png` });

// 1 · Home, with an intention typed and a tag chosen (as a user would before starting)
await p.getByRole('textbox').first().fill('Chapter 3 notes');
await p.getByRole('button', { name: 'Study', exact: true }).click();
await p.waitForTimeout(700);
await p.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
await p.waitForTimeout(300);
await shot('01-home');

// 2 · Active Focus, mid-brew (the app clock is advanced 12.5 min so the steam has built up)
await p.getByRole('button', { name: /put the kettle on/i }).first().click();
await p.waitForTimeout(1500);
await p.evaluate(() => window.__kettle.ff(12.5 * 60 * 1000));
await p.waitForTimeout(3500);
await shot('02-focus');

// 3 · The whistle: first in the room ("Tea's ready"), then the completion screen
await p.evaluate(() => window.__kettle.finish());
// The in-ring "Tea's ready" moment is short (Chai pops in, then the screen hands off to the completion card),
// so take candidates every 100 ms; pick-whistle.py keeps the one where Chai is most visible.
mkdirSync(`${OUT}/.whistle`, { recursive: true });
for (let i = 0; i < 16; i++) {
  await p.waitForTimeout(60);
  if (!(await p.evaluate(() => location.hash)).startsWith('#/focus')) break; // handed off to the completion card
  await p.screenshot({ path: `${OUT}/.whistle/c${String(i).padStart(2, '0')}.png` });
}
await p.waitForTimeout(2300);
await shot('03-completion');

// 4 · Tea break: continue through the completion cards like a user, then start the break
for (let i = 0; i < 8; i++) {
  const start = p.getByRole('button', { name: /start tea break/i });
  if (await start.count()) {
    await start.first().click();
    break;
  }
  const next = p.getByRole('button', { name: /^continue$/i });
  if (!(await next.count())) break;
  await next.first().click();
  await p.waitForTimeout(2200);
}
await p.waitForTimeout(3000);
await shot('04-tea-break');
console.log('break route', await p.evaluate(() => location.hash));

// 5 · Nook (the tab bar, as a user would)
await p.evaluate(() => window.__kettle.navigate('/nook'));
await p.waitForTimeout(5000);
await shot('05-nook');

// build evidence: the version row in Settings
await p.evaluate(() => window.__kettle.navigate('/settings'));
await p.waitForTimeout(1500);
const row = p.getByText(/^Kettle \d/);
await row.scrollIntoViewIfNeeded();
console.log('version shown in app:', await row.textContent());
await b.close();
