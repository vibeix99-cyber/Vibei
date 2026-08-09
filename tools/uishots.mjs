// Battle-UI screenshot driver.
//
//   node tools/uishots.mjs --port 8305 --out tests/shots/ui
//   node tools/uishots.mjs --port 8305 --out tests/shots/ui --only 844x390
//
// Drives a real live battle at four viewport sizes and captures the states the
// player actually operates: root command menu, move grid (+ detail popover),
// party switch list, bag, a mid-damage frame, a faint frame, and the hot-seat
// hand-off. Also asserts nothing overflows the viewport horizontally and that
// key touch targets are >= 44px.

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]?.startsWith('--') === false ? arr[i + 1] : true]);
    return acc;
  }, [])
);

const PORT = Number(args.port || 8305);
const OUT = args.out || 'tests/shots/ui';
const BASE = `http://127.0.0.1:${PORT}`;
const ONLY = args.only ? String(args.only) : null;
const SEED = args.seed ? String(args.seed) : 'UI-SHOTS-7';

const VIEWPORTS = [
  { name: '1440x900', w: 1440, h: 900 },
  { name: '1280x800', w: 1280, h: 800 },
  { name: '390x844', w: 390, h: 844 },
  { name: '844x390', w: 844, h: 390 }
].filter((v) => !ONLY || v.name === ONLY);

const problems = [];

async function boot(browser, vp) {
  const page = await browser.newPage({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 1,
    hasTouch: vp.w < 900
  });
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`[${vp.name}] console: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`[${vp.name}] pageerror: ${e.message}`));
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__ARENA?.version, null, { timeout: 25000 });
  await page.evaluate(() => window.__ARENA.ready);
  await page.evaluate(() => window.__ARENA.audio.setMuted(true));
  return page;
}

/** Wait until the player is being asked for a choice. */
async function waitForChoice(page, ms = 40000) {
  return page.evaluate(async (deadlineMs) => {
    const A = window.__ARENA;
    const end = Date.now() + deadlineMs;
    while (Date.now() < end) {
      if (A.router.currentId !== 'battle') return 'ended';
      if (A.battle.waitingFor() === 0) return 'ready';
      await new Promise((r) => setTimeout(r, 60));
    }
    return 'timeout';
  }, ms);
}

/** Poll for a specific beat kind and stop the world there so we can shoot it. */
async function catchBeat(page, kinds, ms = 30000) {
  return page.evaluate(async ([wanted, deadlineMs]) => {
    const A = window.__ARENA;
    const end = Date.now() + deadlineMs;
    while (Date.now() < end) {
      const t = A.app.view.beat?.ev?.t;
      if (t && wanted.includes(t)) return t;
      if (A.router.currentId !== 'battle') return 'ended';
      await new Promise((r) => setTimeout(r, 16));
    }
    return 'timeout';
  }, [kinds, ms]);
}

async function layoutAudit(page, vp, label) {
  const r = await page.evaluate(() => {
    const out = { overflow: [], small: [], clipped: [] };
    const W = window.innerWidth, H = window.innerHeight;
    const doc = document.documentElement;
    if (doc.scrollWidth > W + 1) out.overflow.push(`document scrollWidth ${doc.scrollWidth} > ${W}`);
    const sel = '.cmdbtn, .movecard, .partyrow, .bagrow, .backbtn, .speedbtn button, .btn, .mvdetail-close';
    for (const el of document.querySelectorAll(sel)) {
      const b = el.getBoundingClientRect();
      if (b.width === 0 && b.height === 0) continue;
      if (b.height < 44 - 0.5) out.small.push(`${el.className.split(' ')[0]}:${Math.round(b.height)}px "${(el.textContent || '').trim().slice(0, 18)}"`);
      if (b.right > W + 1 || b.left < -1 || b.bottom > H + 1 || b.top < -1) {
        out.overflow.push(`${el.className.split(' ')[0]} @${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.width)}x${Math.round(b.height)} vs ${W}x${H}`);
      }
    }
    for (const el of document.querySelectorAll('.textbox, .nameplate, .listpanel, .mvdetail')) {
      const b = el.getBoundingClientRect();
      if (b.width === 0) continue;
      if (el.scrollHeight > el.clientHeight + 2) out.clipped.push(`${el.className.split(' ')[0]} content ${el.scrollHeight} > box ${el.clientHeight}`);
      if (b.right > W + 1 || b.bottom > H + 1 || b.left < -1 || b.top < -1) {
        out.overflow.push(`${el.className.split(' ')[0]} @${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.width)}x${Math.round(b.height)} vs ${W}x${H}`);
      }
    }
    // overlap: textbox vs menus vs plates
    const box = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return b.width ? b : null; };
    const pairs = [['.textbox', '.cmdroot'], ['.textbox', '.movegrid'], ['.textbox', '.nameplate.p0'], ['.nameplate.p0', '.cmdroot'], ['.nameplate.p1', '.speedbtn'], ['.turnpill', '.nameplate.p1']];
    const overlaps = [];
    for (const [a, b2] of pairs) {
      const A2 = box(a), B2 = box(b2);
      if (!A2 || !B2) continue;
      const ox = Math.min(A2.right, B2.right) - Math.max(A2.left, B2.left);
      const oy = Math.min(A2.bottom, B2.bottom) - Math.max(A2.top, B2.top);
      if (ox > 2 && oy > 2) overlaps.push(`${a} ∩ ${b2} = ${Math.round(ox)}x${Math.round(oy)}`);
    }
    out.overlaps = overlaps;
    return out;
  });
  const bad = [];
  if (r.overflow.length) bad.push(`overflow: ${r.overflow.join(' | ')}`);
  if (r.small.length) bad.push(`touch<44: ${[...new Set(r.small)].join(' | ')}`);
  if (r.clipped.length) bad.push(`clipped: ${r.clipped.join(' | ')}`);
  if (r.overlaps.length) bad.push(`overlap: ${r.overlaps.join(' | ')}`);
  if (bad.length) problems.push(`[${vp.name}/${label}] ${bad.join('  ;  ')}`);
  return r;
}

async function run(browser, vp) {
  console.log(`\n▶ ${vp.name}`);
  const page = await boot(browser, vp);
  const shot = async (name, audit = true) => {
    await page.screenshot({ path: `${OUT}/${vp.name}-${name}.png` });
    console.log(`  📸 ${vp.name}-${name}.png`);
    if (audit) await layoutAudit(page, vp, name);
  };

  /* ---- live AI battle ---- */
  await page.evaluate((seed) => window.__ARENA.battle.start({ mode: 'ai', teamSize: 3, seed }), SEED);
  let s = await waitForChoice(page);
  if (s !== 'ready') { problems.push(`[${vp.name}] battle never asked for a choice (${s})`); await page.close(); return; }
  await sleep(500);
  await shot('01-root');

  // FIGHT → move grid
  await page.click('.cmdbtn.fight');
  await sleep(350);
  await shot('02-moves');

  // move detail affordance (hover on desktop, long-press on touch)
  const cards = await page.$$('.movecard');
  if (cards.length) {
    if (vp.w < 900) {
      const b = await cards[0].boundingBox();
      await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2).catch(() => {});
      await page.evaluate(() => document.querySelector('.movecard')?.dispatchEvent(new Event('longpress')));
      await page.hover('.movecard').catch(() => {});
    } else {
      await cards[0].hover();
    }
    await sleep(700);
    await shot('03-move-detail');
    await page.keyboard.press('Escape').catch(() => {});
    await sleep(200);
  }

  // back → party
  await page.evaluate(() => window.__ARENA.app.router.current.menu.showRoot(window.__ARENA.app.router.current.ctxFor(0)));
  await sleep(200);
  await page.click('.cmdbtn.party');
  await sleep(350);
  await shot('04-party');

  // back → bag
  await page.evaluate(() => window.__ARENA.app.router.current.menu.showRoot(window.__ARENA.app.router.current.ctxFor(0)));
  await sleep(200);
  await page.click('.cmdbtn.bag');
  await sleep(350);
  await shot('05-bag');

  // back to root, then play — catch a damage frame
  await page.evaluate(() => window.__ARENA.app.router.current.menu.showRoot(window.__ARENA.app.router.current.ctxFor(0)));
  await sleep(150);
  await page.evaluate(() => {
    const A = window.__ARENA;
    const sc = A.battle.screen();
    A.battle.choose(0, A.sim.chooseAction(sc.battle, 0, 'ace'));
  });
  const dmg = await catchBeat(page, ['damage']);
  if (dmg === 'damage') { await sleep(90); await shot('06-damage'); }
  else problems.push(`[${vp.name}] never saw a damage beat (${dmg})`);

  // keep playing until someone faints
  let faintShot = false;
  for (let t = 0; t < 24 && !faintShot; t++) {
    const st = await page.evaluate(async () => {
      const A = window.__ARENA;
      const end = Date.now() + 30000;
      while (Date.now() < end) {
        if (A.router.currentId !== 'battle') return 'ended';
        if (A.app.view.beat?.ev?.t === 'faint') return 'faint';
        if (A.battle.waitingFor() === 0) {
          const sc = A.battle.screen();
          const side = sc.battle.sides[0];
          if (sc.forcedSwitch) {
            const i = side.party.findIndex((p, i2) => !p.fainted && i2 !== side.activeIndex);
            A.battle.choose(0, { kind: 'switch', toSlot: i < 0 ? 0 : i });
          } else {
            A.battle.choose(0, A.sim.chooseAction(sc.battle, 0, 'ace'));
          }
          return 'moved';
        }
        await new Promise((r) => setTimeout(r, 16));
      }
      return 'timeout';
    });
    if (st === 'ended' || st === 'timeout') break;
    if (st === 'faint') { await sleep(140); await shot('07-faint'); faintShot = true; break; }
    const f = await catchBeat(page, ['faint'], 2500);
    if (f === 'faint') { await sleep(140); await shot('07-faint'); faintShot = true; }
  }
  if (!faintShot) problems.push(`[${vp.name}] never captured a faint frame`);

  /* ---- hot-seat hand-off ---- */
  await page.evaluate((seed) => window.__ARENA.battle.start({ mode: 'hotseat', teamSize: 3, seed }), SEED);
  s = await waitForChoice(page);
  if (s === 'ready') {
    await page.evaluate(() => {
      const A = window.__ARENA;
      const sc = A.battle.screen();
      A.battle.choose(0, A.sim.chooseAction(sc.battle, 0, 'ace'));
    });
    await page.waitForSelector('.handoff', { timeout: 20000 }).catch(() => problems.push(`[${vp.name}] no hand-off screen`));
    await sleep(700);
    await shot('08-handoff');
  } else problems.push(`[${vp.name}] hotseat battle never asked for a choice (${s})`);

  await page.close();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || undefined,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--no-sandbox']
  });
  for (const vp of VIEWPORTS) {
    try { await run(browser, vp); }
    catch (e) { problems.push(`[${vp.name}] FATAL ${e.message}`); }
  }
  await browser.close();
  await writeFile(`${OUT}/ui-report.json`, JSON.stringify({ problems }, null, 2));
  if (problems.length) {
    console.log(`\n⚠ ${problems.length} layout/console problem(s):`);
    problems.forEach((p) => console.log('  - ' + p));
  } else console.log('\n✅ ui shots clean');
}

main().catch((e) => { console.error(e); process.exit(1); });
