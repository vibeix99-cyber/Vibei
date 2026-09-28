import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const [,, base] = process.argv;
const browser = await chromium.launch();
for (const [seed, theme, w] of [['veteran', 'light', 390], ['veteran', 'dark', 390], ['blank', 'light', 390], ['newbie', 'dark', 1440]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme });
  const page = await ctx.newPage();
  await page.goto(`${base}/?debug&seed=${seed}&theme=${theme}&motion=reduce#/stats`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const res = await new AxeBuilder({ page }).include('#main').analyze();
  console.log(seed, theme, w, 'violations:', res.violations.length);
  for (const v of res.violations) console.log('  ', v.impact, v.id, v.help, v.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n').slice(1, 2).join('')).join(' | '));
  await ctx.close();
}
await browser.close();
