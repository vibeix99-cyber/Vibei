// Ad-hoc debugger: drives the live game and dumps state each poll.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 8199;
const p = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((r) => p.stdout.on('data', (d) => String(d).includes('serving') && r()));

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => console.log(`[${m.type()}]`, m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message, e.stack?.split('\n')[1]));
await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ARENA?.version);
await page.evaluate(() => window.__ARENA.audio.setMuted(true));
await page.evaluate(() => window.__ARENA.battle.quick('DBG-1'));

for (let i = 0; i < 40; i++) {
  await sleep(700);
  const s = await page.evaluate(() => {
    const A = window.__ARENA;
    const sc = A.battle.screen();
    return {
      screen: A.router.currentId,
      waiting: sc?.waitingChoice ?? null,
      forced: sc?.forcedSwitch ?? null,
      pending: [sc?.pendingP0?.kind ?? null, sc?.pendingP1?.kind ?? null],
      turn: sc?.battle?.turn,
      req: sc?.battle?.request,
      qlen: A.app.view.queue.length,
      beat: A.app.view.beat?.ev?.t ?? null,
      tbBusy: A.app.textbox.busy,
      tbCur: A.app.textbox.current?.text?.slice(0, 40) ?? null,
      ended: sc?.battle?.ended
    };
  });
  console.log(i, JSON.stringify(s));
  if (s.waiting === 0) {
    const done = await page.evaluate(() => {
      const A = window.__ARENA; const sc = A.battle.screen();
      const c = sc.forcedSwitch
        ? { kind: 'switch', toSlot: sc.battle.sides[0].party.findIndex((x, i2) => !x.fainted && i2 !== sc.battle.sides[0].activeIndex) }
        : A.sim.chooseAction(sc.battle, 0, 'ace');
      A.battle.choose(0, c);
      return c.kind;
    });
    console.log('   -> chose', done);
  }
  if (s.screen !== 'battle') break;
}
await browser.close(); p.kill();
