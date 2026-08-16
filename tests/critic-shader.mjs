// CRITIC: which arenas fail to compile their ground shader, and what colour
// does the floor end up? Writes only under tests/.
import { chromium } from 'playwright';

const PORT = 8701;
const main = async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
  let bucket = [];
  page.on('console', (m) => { if (m.type() === 'error') bucket.push(m.text().split('\n').filter((l) => /ERROR: |Material Type|VALIDATE_STATUS/.test(l)).join(' | ')); });
  await page.goto(`http://127.0.0.1:${PORT}/?quality=high`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ARENA?.version);
  await page.evaluate(() => window.__ARENA.ready);
  await page.evaluate(() => window.__ARENA.audio.setMuted(true));
  const arenas = await page.evaluate(() => window.__ARENA.data.arenas.map((a) => ({ id: a.id, name: a.name })));
  for (const a of arenas) {
    bucket = [];
    await page.evaluate((id) => {
      const A = window.__ARENA;
      const build = (ids) => ids.map((i) => A.sim.makeDefaultMember(i, 50));
      A.battle.start({ seed: 'SHD-' + id, arena: id, mode: 'ai', p0Team: build(['luffy']), p1Team: build(['ace']) });
    }, a.id);
    await new Promise((r) => setTimeout(r, 4000));
    console.log(`${a.id.padEnd(12)} ${a.name.padEnd(22)} shaderErrors=${bucket.length}`);
    bucket.slice(0, 3).forEach((b) => console.log('     ' + b));
  }
  await browser.close();
};
main().catch((e) => { console.error(e); process.exit(1); });
