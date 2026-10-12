// Directly asks the running TextBox how long it will hold representative lines.
// More trustworthy than sampling frames on a 2fps software renderer.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const PORT = 8754;
const p = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: ['ignore','pipe','pipe'] });
await new Promise(r => p.stdout.on('data', d => String(d).includes('serving') && r()));
const b = await chromium.launch({ args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const pg = await b.newPage();
await pg.goto(`http://127.0.0.1:${PORT}/?quality=low`, { waitUntil:'networkidle' });
await pg.waitForFunction(() => window.__ARENA?.version);

const rows = await pg.evaluate(() => {
  const tb = window.__ARENA.app.textbox;
  const HOLD = { plain: 420, crit: 950, super: 760, weak: 520, faint: 900, status: 700 };
  const cases = [
    ['A critical hit!', 'crit'],
    ["It's super effective!", 'super'],
    ["Foe Ace's Sp. Atk fell!", 'plain'],
    ['Luffy used Gum-Gum Gatling!', 'plain'],
    ['Foe Chopper fainted!', 'faint'],
    ['Zoro was badly poisoned!', 'status'],
    ["It's not very effective…", 'weak']
  ];
  const out = [];
  for (const speed of [0.5, 1, 2, 4]) {
    tb.speed = speed;
    for (const [text, style] of cases) {
      const line = { text, style, hold: HOLD[style] };
      out.push({ speed, text, alone: Math.round(tb.holdFor(line, 0)), queued3: Math.round(tb.holdFor(line, 3)) });
    }
  }
  // and the standing prompt
  tb.speed = 1;
  out.push({ speed: 1, text: 'What will Luffy do? (prompt)', alone: tb.holdFor({ text: 'x', hold: 0 }, 0), queued3: tb.holdFor({ text: 'x', hold: 0 }, 3) });
  return out;
});

let cur = null;
for (const r of rows) {
  if (r.speed !== cur) { cur = r.speed; console.log(`\n— speed ${r.speed}× —`); console.log('  alone  queued  line'); }
  console.log(`  ${String(r.alone).padStart(5)}  ${String(r.queued3).padStart(6)}  ${r.text}`);
}
const bad = rows.filter(r => r.speed === 1 && r.alone > 0 && r.alone < 600);
console.log(bad.length ? `\n❌ ${bad.length} line(s) under 600ms at 1×` : '\n✅ no line under 600ms at 1×');
await b.close(); p.kill();
