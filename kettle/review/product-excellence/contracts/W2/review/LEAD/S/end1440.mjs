// LEAD-2: 1440x900 light @100 big day: real wheel + click on "How your leaves added up", wheel to the end; BEFORE vs AFTER.
import { chromium } from '/home/user/wt/w2fv/kettle/node_modules/playwright/index.mjs';
const OUT = '/home/user/wt/w2t-n2/kettle/.tmp/LEAD2/ms';
const b = await chromium.launch();
const res = [];
for (const [side, base] of [['BEFORE', 'http://127.0.0.1:5330'], ['AFTER', 'http://127.0.0.1:5351']]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date('2026-10-11T07:40:00Z') }); await page.clock.resume();
  await page.goto(`${base}/?debug&seed=celebrate&theme=light#/`);
  await page.waitForFunction(() => { const t = window.__kettle?.timerInfo?.(); return !!(t && t.leader && t.leaderForMs > 400 && !t.settling); }, null, { timeout: 60000 });
  await page.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, autoStartFocus: false }));
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: /put the kettle on/i }).first().click();
  await page.waitForFunction(() => location.hash === '#/focus');
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.__kettle.finish());
  await page.waitForFunction(() => location.hash.includes('done'), null, { timeout: 30000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${OUT}/end1440-${side}-arrival.png` });
  const h = await page.locator('h1').boundingBox();
  const t0 = Date.now(); const steps = [];
  for (let i = 0; i < 6; i++) { await page.mouse.move(h.x + 40, h.y + 10); await page.mouse.wheel(0, 200); await page.waitForTimeout(300); }
  const tg = page.getByRole('button', { name: /How your leaves added up/ });
  const box = await tg.boundingBox();
  const hit = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? (e.closest('button')?.textContent || e.tagName).trim().slice(0, 40) : null; }, [box.x + box.width / 2, box.y + box.height / 2]);
  steps.push({ toggleBox: box, hit });
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(800);
  for (let i = 0; i < 8; i++) { await page.mouse.move(h.x + 40, Math.max(h.y, 120)); await page.mouse.wheel(0, 300); await page.waitForTimeout(250); }
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/end1440-${side}-end.png` });
  const m = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((x) => /How your leaves added up/.test(x.textContent));
    const sec = btn.closest('section'); const sc = btn.closest('[class*="scroll"]');
    const all = [...sec.querySelectorAll('p, li, div')].filter((e) => e.children.length === 0 && e.textContent.trim()).map((e) => ({ t: e.textContent.trim().slice(0, 40), b: e.getBoundingClientRect().bottom }));
    const last = all.sort((a, b) => b.b - a.b)[0];
    const r = sc.getBoundingClientRect();
    return { expanded: btn.getAttribute('aria-expanded'), atEnd: Math.abs(sc.scrollHeight - sc.clientHeight - sc.scrollTop) < 2, scBottom: r.bottom, last };
  });
  res.push({ side, steps, ...m });
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(res, null, 1));
