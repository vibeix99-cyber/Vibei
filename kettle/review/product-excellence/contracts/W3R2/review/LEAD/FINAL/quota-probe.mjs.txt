// LEAD-5 (W3R2 final): in this Chromium, with localStorage filled the way integrity I03 fills it, does replacing an
// existing 10-char value with a same-size value succeed? (lastVisit's day key changes by date, never by length.)
import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.goto('http://127.0.0.1:5560/?debug#/');
await p.waitForTimeout(1500);
const r = await p.evaluate(() => {
  const out = {};
  const t = (name, fn) => { try { fn(); out[name] = 'ok'; } catch (e) { out[name] = e.name; } };
  localStorage.setItem('probe:last', '2026-10-17');
  let chunk = 'x'.repeat(1024 * 1024), i = 0;
  while (chunk.length >= 8) { try { localStorage.setItem(`filler${i++}`, chunk); } catch { chunk = chunk.slice(0, chunk.length / 2); } }
  t('probe 4096 (expect quota)', () => localStorage.setItem('filler-probe', 'x'.repeat(4096)));
  t('same key, same value', () => localStorage.setItem('probe:last', '2026-10-17'));
  t('same key, same-size new value', () => localStorage.setItem('probe:last', '2026-10-18'));
  t('same key, one char longer', () => localStorage.setItem('probe:last', '2026-10-180'));
  t('new key, 10 chars', () => localStorage.setItem('probe:new', '2026-10-18'));
  for (const k of Object.keys(localStorage)) if (k.startsWith('filler') || k.startsWith('probe:')) localStorage.removeItem(k);
  return out;
});
console.log(JSON.stringify(r, null, 1));
await b.close();
