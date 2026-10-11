// Probe: is anything animating in the End sheet under reduced motion at 1440? (rect of "Keep brewing" over 2 s + document.getAnimations())
import { chromium } from 'playwright';
const [base, W, H, rm, theme] = [process.argv[2], +process.argv[3], +process.argv[4], process.argv[5] === 'rm', process.argv[6] || 'dark'];
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, colorScheme: theme, reducedMotion: rm ? 'reduce' : 'no-preference', serviceWorkers: 'block' });
const p = await ctx.newPage();
await p.goto(`${base}/?debug&seed=veteran&theme=${theme}${rm ? '&motion=reduce' : ''}#/`);
await p.waitForFunction(() => window.__kettle?.timerInfo?.()?.leader, null, { timeout: 60000 });
await p.evaluate(() => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false }));
await p.waitForTimeout(1500);
await p.getByRole('button', { name: /put the kettle on/i }).first().click();
await p.waitForTimeout(4000);
await p.getByRole('button', { name: /^end session$/i }).first().click();
await p.waitForTimeout(1500);
const samples = [];
for (let i = 0; i < 20; i++) {
  samples.push(await p.evaluate(() => {
    const k = [...document.querySelectorAll('button')].find((x) => /keep brewing/i.test(x.textContent));
    const r = k?.getBoundingClientRect();
    const anims = document.getAnimations().filter((a) => a.playState === 'running').map((a) => { const t = a.effect?.target; return `${a.constructor.name}:${a.animationName || a.transitionProperty || ''}@${t?.tagName}.${(t?.className?.baseVal ?? t?.className ?? '').toString().slice(0, 40)}`; });
    return { t: performance.now() | 0, rect: r ? [r.x.toFixed(2), r.y.toFixed(2), r.width.toFixed(2), r.height.toFixed(2)] : null, anims: [...new Set(anims)].slice(0, 12) };
  }));
  await p.waitForTimeout(100);
}
const rects = new Set(samples.map((s) => JSON.stringify(s.rect)));
console.log(JSON.stringify({ W, H, rm, distinctRects: rects.size, rects: [...rects].slice(0, 5), anims: [...new Set(samples.flatMap((s) => s.anims))] }, null, 1));
const t0 = Date.now();
try { await p.getByRole('button', { name: /keep brewing/i }).first().click({ timeout: 10000 }); console.log('click ok', Date.now() - t0, 'ms'); } catch (e) { console.log('click FAILED', e.message.split('\n')[0]); }
await b.close();
