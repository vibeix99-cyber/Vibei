// CRITIC — what the player is shown at the moment of the decision.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = Number(process.env.PORT || 8702);
const OUT = 'tests/shots/critic-depth';
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
await page.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 25000 });
await page.evaluate(() => window.__ARENA.ready);
await page.evaluate(() => window.__ARENA.audio?.setMuted?.(true));
await page.evaluate(() => window.__ARENA.router.go('battle', {}));
await sleep(1200);
await page.evaluate(() => { window.__ARENA.battle.skipAnimations?.(true); window.__ARENA.battle.quick(4242); });
await page.waitForFunction(() => /What will/.test(document.querySelector('#ui')?.innerText || ''), null, { timeout: 40000 }).catch(() => {});
const btnInfo = await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => ({ cls: b.className, txt: b.innerText.replace(/\n/g, ' ') })));
console.log('buttons:', JSON.stringify(btnInfo));
const fight = page.locator('button', { hasText: 'FIGHT' }).first();
await fight.click({ force: true }).catch((e) => console.log('click failed', e.message));
try { await page.waitForSelector('.movecard', { timeout: 15000 }); }
catch (e) { console.log('no .movecard appeared after clicking FIGHT'); }
await sleep(600);
await page.screenshot({ path: `${OUT}/10-fight-menu.png` });

const dom = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.movecard')].map((c) => ({
    text: c.innerText.replace(/\n+/g, ' | '),
    eff: c.dataset.eff || null
  }));
  const hud = [...document.querySelectorAll('[class*="plate"], [class*="hud"]')].map((e) => e.innerText.replace(/\n+/g, ' | ')).slice(0, 4);
  return { cards, hud, menuText: document.querySelector('#ui')?.innerText.slice(0, 900) };
});
console.log('move cards on screen:');
for (const c of dom.cards) console.log(`  [eff=${c.eff}] ${c.text}`);
console.log('\nHUD text:'); dom.hud.forEach((h) => console.log('  ' + h));
console.log('\n--- whole UI text ---\n' + dom.menuText);

// hover a card for the description
if (dom.cards.length) {
  await page.hover('.movecard');
  await sleep(400);
  await page.screenshot({ path: `${OUT}/11-move-hover.png` });
}
// dex entry for one fighter — where a player learns the rules
await page.evaluate(() => window.__ARENA.router.go('dex', {}));
await sleep(1600);
await page.screenshot({ path: `${OUT}/12-dex.png` });
await browser.close();
console.log('\nshots written to ' + OUT);
