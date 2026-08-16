// CRITIC harness — close reading of the HUD chrome (plates, dock, move cards,
// text box) at 2x device scale. Writes only under tests/.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const PORT = Number(process.argv.includes('--port') ? process.argv[process.argv.indexOf('--port') + 1] : 8701);
const OUT = 'tests/shots/critic-hud';
const BASE = `http://127.0.0.1:${PORT}`;

const waitIdle = (page) => page.evaluate(async () => {
  const A = window.__ARENA;
  const stop = Date.now() + 120000;
  while (Date.now() < stop) {
    const s = A.battle.screen();
    if (s && !A.battle.isAnimating() && s.waitingChoice !== null) break;
    if (A.textbox?.busy) A.battle.advanceText();
    await new Promise((r) => setTimeout(r, 25));
  }
});

async function clipShot(page, sel, name, pad = 8) {
  const box = await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }, sel);
  if (!box) { console.log(`  (no element ${sel})`); return false; }
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    clip: {
      x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad),
      width: box.width + pad * 2, height: box.height + pad * 2
    }
  });
  console.log(`  📸 ${name}  (${Math.round(box.width)}x${Math.round(box.height)} css px)`);
  return true;
}

const main = async () => {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 640 }, deviceScaleFactor: 2 });
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.goto(`${BASE}/?quality=low`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ARENA?.version);
  await page.evaluate(() => window.__ARENA.ready);
  await page.evaluate(() => window.__ARENA.audio.setMuted(true));
  await page.evaluate(() => {
    const A = window.__ARENA;
    const build = (ids) => ids.map((id) => A.sim.makeDefaultMember(id, 50));
    A.battle.start({ seed: 'HUD', arena: 'colosseum', mode: 'ai', aiLevel: 'ace', p0Team: build(['luffy', 'zoro', 'nami']), p1Team: build(['ace', 'law', 'smoker']) });
  });
  await waitIdle(page);

  // what selectors exist?
  const sels = await page.evaluate(() => {
    const out = {};
    document.querySelectorAll('#ui *, .hud *').forEach((el) => {
      const c = el.className && typeof el.className === 'string' ? el.className.split(/\s+/)[0] : '';
      if (c) out[c] = (out[c] || 0) + 1;
    });
    return out;
  });
  console.log('  classes:', Object.keys(sels).join(' '));

  await clipShot(page, '.nameplate, .plate, [class*="plate"]', 'plate-foe', 6);
  const plates = await page.evaluate(() => [...document.querySelectorAll('[class*="plate"]')].map((e) => e.className));
  console.log('  plates:', plates);
  for (let i = 0; i < plates.length; i++) {
    await page.evaluate((i) => { document.querySelectorAll('[class*="plate"]')[i].dataset.critic = '1'; }, i);
    await clipShot(page, `[data-critic="1"]`, `plate-${i}`, 6);
    await page.evaluate((i) => { delete document.querySelectorAll('[class*="plate"]')[i].dataset.critic; }, i);
  }
  await clipShot(page, '.textbox', 'textbox', 4);
  await clipShot(page, '[class*="cmd"], .commandmenu, .menu', 'dock', 4);

  // open the move grid
  await page.keyboard.press('Enter');
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: `${OUT}/fight-full.png` });
  console.log('  📸 fight-full');
  const dockSel = await page.evaluate(() => {
    const c = [...document.querySelectorAll('#ui div')].filter((e) => /move/i.test(e.className || ''));
    return c.length ? c[0].className : null;
  });
  console.log('  move element class:', dockSel);
  if (dockSel) await clipShot(page, '.' + dockSel.split(/\s+/)[0], 'movegrid', 6);

  // low HP + status, to see how the plate degrades
  await page.evaluate(() => {
    const A = window.__ARENA;
    const b = A.battle.raw();
    for (const s of b.sides) { const p = s.party[s.activeIndex]; p.hp = Math.max(1, Math.round(p.maxHp * 0.11)); }
    b.sides[1].party[b.sides[1].activeIndex].status = 'brn';
    A.app.view.setState(A.sim.publicView ? A.sim.publicView(b) : null);
  }).catch(() => {});
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: `${OUT}/lowhp-full.png` });
  console.log('  📸 lowhp-full');

  await browser.close();
};
main().catch((e) => { console.error(e); process.exit(1); });
