// First visit: walk onboarding step by step, screenshot each step. usage: node onboard.mjs <theme> <w> <h> <prefix>
import { chromium } from 'playwright';
const [theme = 'dark', w = 390, h = 844, prefix = 'phone'] = process.argv.slice(2);
const OUT = 'review/round-6-audit/shots';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, serviceWorkers: 'block', colorScheme: theme });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('pageerror', e.message));
await p.goto(`http://localhost:4173/?debug&seed=fresh&theme=${theme}#/`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
const names = async () => p.evaluate(() => [...document.querySelectorAll('button,[role=radio],input,textarea')].filter((e) => e.getClientRects().length).map((e) => (e.getAttribute('aria-label') || e.innerText || e.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim()));
const PRI = [/^get started/i, /^continue/i, /^next/i, /^sounds good/i, /^let/i, /^start/i, /^put the kettle/i, /^done/i, /^skip/i];
for (let step = 0; step < 9; step++) {
  await p.screenshot({ path: `${OUT}/${prefix}-${theme}-onboard-${step}.png` });
  const n = await names();
  const hd = await p.evaluate(() => [...document.querySelectorAll('h1,h2')].map((e) => e.innerText.replace(/\s+/g, ' ')).join(' | '));
  console.log(`step ${step}: [${hd}] ::`, n.join(' / '));
  const inp = p.locator('input[type=text]:visible, input:not([type]):visible').first();
  if (await inp.count() && !(await inp.inputValue())) { await inp.fill('Mira'); await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/${prefix}-${theme}-onboard-${step}b.png` }); }
  const dis = await p.evaluate(() => [...document.querySelectorAll('button')].some((b) => /continue/i.test(b.innerText) && b.disabled));
  if (dis) { const r = p.locator('label:has(input[type=radio])'); if (await r.count()) { await r.nth(Math.min(1, (await r.count()) - 1)).click(); await p.waitForTimeout(600); await p.screenshot({ path: `${OUT}/${prefix}-${theme}-onboard-${step}b.png` }); } }
  const pick = PRI.map((r) => n.find((x) => r.test(x))).find(Boolean);
  if (!pick) break;
  await p.getByRole('button', { name: pick, exact: true }).first().click({ timeout: 5000 }).catch(async () => p.getByText(pick, { exact: true }).first().click());
  await p.waitForTimeout(1400);
  if (!(await p.evaluate(() => location.hash.includes('welcome') || !!document.querySelector('[class*=elcome]')))) { await p.screenshot({ path: `${OUT}/${prefix}-${theme}-onboard-end.png` }); console.log('left onboarding →', await p.evaluate(() => location.hash)); break; }
}
await b.close();
