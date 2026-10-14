// Control-state sheet: each shared control on the screen that uses it, at rest / hover / keyboard focus / pressed /
// selected / disabled, captured with real pointer and keys (the debug API only sets up state), then laid out on one
// full-size PNG.   node state-sheet.mjs <baseUrl> <outPng> <light|dark> [w] [h] [pct]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const [url, outPng, theme = 'light', W = '1440', H = '900', pct = '100'] = process.argv.slice(2);
fs.mkdirSync(path.dirname(outPng), { recursive: true });
const FIXED = Date.parse('2026-10-12T07:40:00.000Z');
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 2, colorScheme: theme, timezoneId: 'UTC', locale: 'en-GB', reducedMotion: 'reduce' });
if (pct !== '100') await ctx.addInitScript((p) => addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${p}%!important}`; document.head.appendChild(s); }), pct);
const page = await ctx.newPage();
await page.clock.install({ time: FIXED });
await page.clock.resume();
const rows = []; // { screen, control, cells: { state: {img, note} } }

async function open(route, patch = {}) {
  await page.goto(`${url}/?debug&seed=veteran&theme=${theme}#${route}`);
  await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60000 });
  await page.evaluate((p) => window.__kettle.settings.getState().set({ muted: true, autoStartBreaks: false, ...p }), patch);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
}
async function crop(el, pad = 12, settle = 250) {
  await el.scrollIntoViewIfNeeded();
  if (settle) await page.waitForTimeout(settle);
  const b = await el.boundingBox();
  const vp = page.viewportSize();
  const clip = { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: Math.min(b.width + 2 * pad, vp.width - Math.max(0, b.x - pad)), height: Math.min(b.height + 2 * pad, vp.height - Math.max(0, b.y - pad)) };
  return (await page.screenshot({ clip })).toString('base64');
}
async function park() {
  await page.mouse.move(2, (page.viewportSize().height) - 2);
  await page.waitForTimeout(150);
}
/** target: what you act on; frame: what is photographed (defaults to target). */
async function states(screen, control, target, frame, want) {
  frame ??= target;
  const cells = {};
  await park();
  await target.scrollIntoViewIfNeeded();
  if (want.includes('rest')) cells.rest = { img: await crop(frame) };
  if (want.includes('hover')) {
    await target.hover();
    await page.waitForTimeout(250);
    cells.hover = { img: await crop(frame) };
    await park();
  }
  if (want.includes('focus')) {
    await page.keyboard.press('Shift');
    await target.focus();
    await page.waitForTimeout(250);
    const fv = await target.evaluate((e) => e.matches(':focus-visible'));
    cells.focus = { img: await crop(frame), note: fv ? '' : 'not :focus-visible' };
    await target.evaluate((e) => e.blur());
  }
  if (want.includes('pressed')) {
    await target.hover();
    await page.mouse.down();
    await page.waitForTimeout(120); // under the stepper's 420 ms hold-to-repeat
    cells.pressed = { img: await crop(frame, 12, 0) };
    await page.mouse.move(2, 2);
    await page.mouse.up();
    await page.waitForTimeout(150);
  }
  rows.push({ screen, control, cells });
}
async function single(screen, control, state, frame, note = '') {
  rows.push({ screen, control, cells: { [state]: { img: await crop(frame), note } } });
}

// ---------- Settings ----------
await open('/settings', { longBreakEvery: 8 });
const segTheme = page.getByRole('radiogroup', { name: 'Theme' });
const other = theme === 'light' ? 'Night' : 'Light';
await states('Settings', 'SegmentedControl · unselected option', segTheme.getByRole('radio', { name: other }), segTheme, ['rest', 'hover', 'pressed']);
await states('Settings', 'SegmentedControl · selected option', segTheme.getByRole('radio', { checked: true }), segTheme, ['rest', 'focus']);
const goal = page.getByRole('radiogroup', { name: 'Daily goal' });
await states('Settings', 'Chip · unselected (Daily goal)', goal.getByRole('radio', { name: /A cup/ }), goal.getByRole('radio', { name: /A cup/ }), ['rest', 'hover', 'pressed']);
await states('Settings', 'Chip · selected (Daily goal)', goal.getByRole('radio', { checked: true }), null, ['rest', 'hover', 'focus', 'pressed']);
const tea = page.getByRole('switch', { name: 'Tea breaks' });
const teaRow = page.locator('div', { has: tea }).filter({ hasText: 'Tea breaks' }).last();
await states('Settings', 'Toggle row (Auto-start · Tea breaks)', tea, teaRow, ['rest', 'hover', 'focus', 'pressed']);
const nudges = page.getByRole('switch', { name: 'Nudges' });
if (await nudges.isDisabled()) {
  const nRow = page.locator('div', { has: nudges }).filter({ hasText: 'Nudges' }).last();
  await states('Settings', 'Toggle row, switch disabled (Nudges, blocked)', nRow.getByText('Nudges', { exact: true }), nRow, ['rest', 'hover', 'pressed']);
}
const spin = page.getByRole('spinbutton', { name: 'Brews before a long break' });
const stepRow = page.locator('div', { has: spin }).filter({ hasText: 'Long break after' }).last();
await states('Settings', 'NumberStepper · value (keyboard) and − button', page.getByRole('button', { name: 'Decrease brews before a long break' }), stepRow, ['rest', 'hover', 'pressed']);
await page.evaluate(() => window.__kettle.settings.getState().set({ longBreakEvery: 8 }));
await states('Settings', 'NumberStepper · spinbutton focus, + disabled at max', spin, stepRow, ['focus']);
const exp = page.getByRole('button', { name: /Export a backup/ });
await states('Settings', 'ListRow button (Export a backup)', exp, null, ['rest', 'hover', 'focus', 'pressed']);
const name = page.getByRole('textbox', { name: 'Your name' });
await states('Settings', 'TextField (Your name)', name, page.locator('[class*=box]', { has: name }), ['rest', 'hover', 'focus']);
const vol = page.getByRole('slider', { name: 'Master volume' });
await single('Settings', 'Slider · disabled while sounds are off', 'disabled', page.locator('[class*=sliderRow]', { has: vol }));
await page.evaluate(() => window.__kettle.settings.getState().set({ muted: false }));
await page.waitForTimeout(300);
await states('Settings', 'Slider (Master volume)', vol, page.locator('[class*=sliderRow]', { has: vol }), ['rest', 'focus']);

// ---------- Today's composer ----------
await open('/');
const start = page.getByRole('button', { name: /put the kettle on/i }).first();
await states('Today', 'Button · primary (start)', start, null, ['rest', 'hover', 'focus', 'pressed']);
const len = page.getByRole('radiogroup', { name: 'Brew length' });
await states('Today', 'Brew length · selected', len.getByRole('radio', { checked: true }), len, ['rest', 'focus']);
await states('Today', 'Brew length · unselected', len.getByRole('radio', { checked: false }).first(), len, ['hover', 'pressed']);
const work = page.getByRole('button', { name: 'Work', exact: true });
if (await work.count()) await states('Today', 'Chip · tag (toggle button)', work, null, ['rest', 'hover', 'focus', 'pressed']);
const recent = page.getByRole('button', { name: 'Roadmap draft' });
if (await recent.count()) await states('Today', 'Chip · recent intention', recent, null, ['rest', 'hover', 'focus', 'pressed']);

// ---------- The session controls ----------
await page.getByRole('button', { name: /put the kettle on/i }).first().click();
await page.waitForFunction(() => location.hash.startsWith('#/focus'), null, { timeout: 15000 });
await page.waitForTimeout(1200);
for (const n of ['Pause', 'Add 5 minutes', 'End session', 'Turn sound on']) {
  const b = page.getByRole('button', { name: n, exact: true });
  if (await b.count()) await states('Session', `Button · ${n}`, b.first(), null, ['rest', 'hover', 'focus', 'pressed']);
}
// ---------- Inert controls, from the kit gallery (#/kit?part=ui) ----------
const disabledNote = 'Disabled column: the kit gallery (#/kit?part=ui), with each control\'s computed opacity';
await page.goto(`${url}/?debug&theme=${theme}#/kit?part=ui`);
await page.waitForTimeout(2500);
const inert = [
  ['Button · primary', page.getByRole('button', { name: 'Disabled', exact: true }).first()],
  ['Chip', page.locator('[class*=chip]:disabled').first()],
  ['Toggle · off', page.getByRole('switch', { name: 'Disabled off' })],
  ['Toggle · on', page.getByRole('switch', { name: 'Disabled on' })],
  ['Slider', page.getByRole('slider', { name: 'Disabled' })],
  ['TextField', page.getByRole('textbox', { name: 'Disabled' })],
  ['SegmentedControl · option', page.getByRole('radio', { name: 'Inert' })],
  ['NumberStepper', page.getByRole('spinbutton', { name: 'Inert stepper' })],
  ['PressableCard', page.getByRole('button', { name: 'Inert card' })],
  ['ListRow · switch can’t change', page.getByRole('switch', { name: 'Switch can’t change' })],
  ['ListRow · disabled', page.getByRole('button', { name: 'Row disabled' })],
];
const probe = [];
for (const [n, loc] of inert) {
  if (!(await loc.count())) continue;
  const info = await loc.first().evaluate((e) => {
    let op = 1, x = e;
    while (x && x !== document.body) { op *= +getComputedStyle(x).opacity; x = x.parentElement; }
    const row = e.closest('[class*=row]');
    return { opacity: +op.toFixed(3), tabbable: e.tabIndex >= 0 && !e.disabled, cursor: getComputedStyle(e).cursor, rowCursor: row ? getComputedStyle(row).cursor : null };
  });
  probe.push({ control: n, ...info });
  const frame = n === 'ListRow · disabled' ? loc.first() : n.startsWith('ListRow') ? page.locator('[class*=row]', { has: loc.first() }).last() : n === 'Slider' ? page.locator('[class*=slider]', { has: loc.first() }).first() : n === 'TextField' ? page.locator('[class*=field]', { has: loc.first() }).first() : n === 'NumberStepper' ? page.locator('[class*=stepper]', { has: loc.first() }).first() : n.startsWith('Segmented') ? page.getByRole('radiogroup', { name: 'Inert segment' }) : loc.first();
  rows.push({ screen: 'Kit', control: n, cells: { disabled: { img: await crop(frame), note: `opacity ${info.opacity} · ${info.tabbable ? 'TABBABLE' : 'not in Tab order'} · cursor ${n.startsWith('ListRow') ? info.rowCursor : info.cursor}` } } });
}
fs.writeFileSync(outPng.replace(/\.png$/, '-inert.json'), JSON.stringify(probe, null, 1));
console.log(JSON.stringify(probe));

// ---------- Lay out ----------
const COLS = ['rest', 'hover', 'focus', 'pressed', 'disabled'];
const html = `<!doctype html><html data-theme="${theme}"><head><meta charset="utf-8"><style>
body{margin:0;padding:24px;font:600 14px/1.3 system-ui,sans-serif;background:${theme === 'dark' ? '#241a2d' : '#fff9f0'};color:${theme === 'dark' ? '#f6ecf2' : '#3b2a1e'}}
h1{font-size:20px;margin:0 0 4px}p.sub{margin:0 0 16px;opacity:.8}
table{border-collapse:separate;border-spacing:8px}th{text-align:left;font-size:13px;opacity:.8}td{vertical-align:top}
td.n{max-width:220px}td.n b{display:block}img{display:block;max-width:420px;height:auto;outline:1px dashed rgba(128,128,128,.4)}
.note{font-size:11px;color:#b03}</style></head><body>
<h1>Control states · ${theme} · ${W}×${H} · ${pct} % text · ${url}</h1>
<p class="sub">Frozen 2026-10-12T07:40Z (Monday), seed veteran. Real hover, Tab-style focus (:focus-visible) and mouse-down (held). ${disabledNote}.</p>
<table><tr><th>Screen · control</th>${COLS.map((c) => `<th>${c}</th>`).join('')}</tr>
${rows.map((r) => `<tr><td class="n"><b>${r.screen}</b>${r.control}</td>${COLS.map((c) => `<td>${r.cells[c] ? `<img src="data:image/png;base64,${r.cells[c].img}" style="width:${''}">${r.cells[c].note ? `<div class="note">${r.cells[c].note}</div>` : ''}` : ''}</td>`).join('')}</tr>`).join('\n')}
</table></body></html>`;
const sheet = await browser.newPage({ viewport: { width: 2000, height: 1000 }, deviceScaleFactor: 1 });
await sheet.setContent(html);
await sheet.evaluate(() => Promise.all([...document.images].map((i) => i.decode().then(() => { i.style.width = Math.min(420, i.naturalWidth / 2) + 'px'; }))));
await sheet.screenshot({ path: outPng, fullPage: true });
console.log(outPng, rows.length, 'rows');
await browser.close();
