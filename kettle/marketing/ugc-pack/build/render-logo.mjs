// usage (from kettle/, dev server on 5191): node marketing/ugc-pack/build/render-logo.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const OUT = 'marketing/ugc-pack/brand';
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
for (const theme of ['light', 'dark']) {
  const p = await b.newPage({ viewport: { width: 1400, height: 700 }, deviceScaleFactor: 2 });
  await p.goto(`http://localhost:5191/marketing/ugc-pack/build/logo.html?theme=${theme}`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__ready === true);
  await p.locator('#full svg').screenshot({ path: `${OUT}/kettle-logo-wordmark-for-${theme}-backgrounds.png`, omitBackground: true });
  if (theme === 'light') await p.locator('#mark svg').screenshot({ path: `${OUT}/kettle-logo-mark.png`, omitBackground: true });
  await p.close();
}
await b.close();
console.log('logos rendered');
