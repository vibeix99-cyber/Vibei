// Visitor-path checks against a running preview: node tools/e2e.mjs [baseUrl]
import { chromium } from 'playwright-core';
const base = process.argv[2] ?? 'http://localhost:4173/';
const CHROME = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const b = await chromium.launch({ executablePath: CHROME }); let fail = 0;
const t = async (name, fn) => { try { await fn(); console.log('✓', name); } catch (e) { fail++; console.error('✗', name, '-', e.message.split('\n')[0]); } };
const eq = (a, b2, m) => { if (a !== b2) throw new Error(`${m}: expected ${b2}, got ${a}`); };
const errs = [];

for (const mode of [{ n: 'default', o: {} }, { n: 'reduced-motion', o: { reducedMotion: 'reduce' } }, { n: 'no-JS', o: { javaScriptEnabled: false } }]) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, ...mode.o }); const p = await ctx.newPage();
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', (e) => errs.push(e.message));
  p.on('requestfailed', (r) => { if (!/ABORTED/.test(r.failure()?.errorText ?? '')) errs.push('requestfailed ' + r.url()); }); // aborted = we navigated away mid-load
  p.on('response', (r) => r.status() >= 400 && errs.push(`${r.status()} ${r.url()}`));
  await t(`[${mode.n}] hall → click "Come in" → Kettle room → back to hall`, async () => {
    await p.goto(base); await p.getByRole('link', { name: /Come in/ }).click(); await p.waitForURL(/\/kettle\/$/);
    eq(await p.locator('h1').innerText(), 'Kettle', 'h1');
    await p.getByRole('link', { name: /Valeoforth — the hall/ }).click(); await p.waitForURL(new RegExp(base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
    eq(await p.locator('h1').innerText(), 'Valeoforth', 'hall h1');
  });
  await t(`[${mode.n}] door click also enters the room`, async () => {
    await p.goto(base); await p.locator('.door').click({ force: true }); await p.waitForURL(/\/kettle\/$/);
  });
  await t(`[${mode.n}] Rooms menu lists Kettle and navigates`, async () => {
    await p.goto(base); await p.getByText('Rooms', { exact: true }).click();
    await p.getByRole('link', { name: /Kettle/ }).first().waitFor(); await p.locator('.menu__item', { hasText: 'Kettle' }).click(); await p.waitForURL(/\/kettle\/$/);
  });
  if (mode.n !== 'no-JS') {
    await t(`[${mode.n}] keyboard: Tab reaches "Come in", Enter enters`, async () => {
      await p.goto(base); for (let i = 0; i < 6; i++) { await p.keyboard.press('Tab'); const n = await p.evaluate(() => document.activeElement?.textContent ?? ''); if (/Come in/.test(n)) break; }
      eq(/Come in/.test(await p.evaluate(() => document.activeElement.textContent)), true, 'focus on Come in'); await p.keyboard.press('Enter'); await p.waitForURL(/\/kettle\/$/);
    });
    await t(`[${mode.n}] tour tabs: arrow keys move + update panel`, async () => {
      await p.goto(base + 'kettle/'); const tabs = p.getByRole('tab'); eq(await tabs.count(), 6, 'tab count');
      await tabs.first().focus(); await p.keyboard.press('ArrowRight');
      eq(await tabs.nth(1).getAttribute('aria-selected'), 'true', 'second selected');
      eq(await p.locator('.step.is-active h3').innerText(), 'Name what you’re brewing', 'panel title');
      await p.keyboard.press('End'); eq(await tabs.nth(5).getAttribute('aria-selected'), 'true', 'last selected');
    });
    await t(`[${mode.n}] nook controls swap the scene`, async () => {
      await p.goto(base + 'kettle/'); const on = () => p.locator('.scene__stage img.is-on').getAttribute('data-key');
      eq(await on(), 'dusk|rain', 'initial'); await p.getByLabel('Night').check({ force: true }); await p.getByLabel('Snow').check({ force: true });
      eq(await on(), 'night|snow', 'after');
    });
    await t(`[${mode.n}] Chai pose picker`, async () => {
      await p.goto(base + 'kettle/'); await p.getByRole('button', { name: 'Cheer' }).click({ force: true });
      eq(await p.locator('[data-chai-name]').innerText(), 'Cheer', 'name'); eq(/cheer\.svg/.test(await p.locator('[data-chai-big]').getAttribute('src')), true, 'src');
    });
    await t(`[${mode.n}] in-room rail anchors scroll to sections`, async () => {
      await p.goto(base + 'kettle/'); await p.locator('.rail__list a', { hasText: 'Chai' }).click(); await p.waitForTimeout(400);
      eq(await p.evaluate(() => location.hash), '#chai', 'hash');
    });
  } else {
    await t(`[no-JS] tour content is all present as a list`, async () => { await p.goto(base + 'kettle/'); eq(await p.locator('.step').count(), 6, 'steps'); eq(await p.locator('.step h3').first().isVisible(), true, 'visible'); });
  }
  await t(`[${mode.n}] no public Kettle demo link is shown`, async () => { await p.goto(base + 'kettle/'); eq(await p.locator('a[href^="http"]').count(), 0, 'external links'); });
  await ctx.close();
}
await t('404 page renders', async () => { const ctx = await b.newContext(); const p = await ctx.newPage(); const r = await p.goto(base + 'nope/'); eq(r.status(), 404, 'status'); eq(await p.locator('h1').innerText(), 'That door isn’t built yet.', 'h1'); await ctx.close(); });
const real = errs.filter((e) => !/nope\/?$|404/.test(e)); if (real.length) { fail++; console.error('✗ console/network errors:', [...new Set(real)]); } else console.log('✓ no console errors or failed requests');
await b.close(); process.exit(fail ? 1 : 0);
