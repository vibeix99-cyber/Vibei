// Nook: static fallback vs 3D, same viewport; interaction (drag, tap item); item grid. usage: node nook.mjs <theme>
import { chromium } from 'playwright';
const [theme = 'dark'] = process.argv.slice(2);
const OUT = 'review/round-6-audit/shots';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
for (const scene of ['off', 'high']) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, serviceWorkers: 'block', colorScheme: theme });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('pageerror', e.message));
  await p.goto(`http://localhost:4173/?debug&seed=veteran&theme=${theme}#/nook`, { waitUntil: 'networkidle' });
  await p.evaluate((s) => window.__kettle.settings.getState().set({ scene: s }), scene);
  await p.waitForTimeout(scene === 'off' ? 1500 : 12000);
  const st = await p.evaluate(() => ({ canvas: document.querySelectorAll('canvas').length, staticShown: [...document.querySelectorAll('[data-scene-static]')].filter((e) => e.getClientRects().length && getComputedStyle(e).opacity !== '0').length }));
  console.log(scene, JSON.stringify(st));
  await p.screenshot({ path: `${OUT}/nook-desktop-${theme}-${scene}.png` });
  if (scene === 'high') {
    const c = await p.locator('canvas').first().boundingBox();
    if (c) {
      await p.mouse.move(c.x + c.width / 2, c.y + c.height / 2); await p.mouse.down(); await p.mouse.move(c.x + c.width / 2 - 260, c.y + c.height / 2, { steps: 12 }); await p.mouse.up();
      await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/nook-desktop-${theme}-dragged.png` });
      await p.mouse.click(c.x + c.width * 0.36, c.y + c.height * 0.55); await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/nook-desktop-${theme}-tap.png` });
    }
    await p.evaluate(() => window.scrollTo(0, 900)); await p.waitForTimeout(800); await p.screenshot({ path: `${OUT}/nook-desktop-${theme}-items.png` });
    const btns = await p.evaluate(() => [...document.querySelectorAll('button')].filter((e) => e.getClientRects().length).map((e) => (e.getAttribute('aria-label') || e.innerText).replace(/\s+/g, ' ').trim()).slice(0, 30));
    console.log('buttons:', btns.join(' / '));
    const it = p.getByRole('button', { name: /record player/i }).first();
    if (await it.count()) { await it.click(); await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/nook-desktop-${theme}-item-click.png` }); console.log('after item click:', await p.evaluate(() => [...document.querySelectorAll('[role=dialog] *,[aria-live]')].map((e) => e.innerText).filter(Boolean).slice(0, 3).join(' | '))); }
  }
  await ctx.close();
}
await b.close();
