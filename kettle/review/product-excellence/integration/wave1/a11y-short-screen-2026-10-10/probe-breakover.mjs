import { chromium } from '@playwright/test';
import { walkJourney } from '/home/user/Vibei/kettle/tests/a11y-probes.mjs';
const base = process.argv[2];
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const log = [];
page.on('console', (m) => { if (/toast|Recipe|badge|level/i.test(m.text())) log.push(m.text()); });
await walkJourney(page, base, async (id, p) => {
  const t = await p.evaluate(() => [...document.querySelectorAll('[id^="toast-"], [data-sonner-toast], li')].filter((e) => e.closest('[aria-label="Notifications"]')).map((e) => e.textContent.trim()));
  const btn = await p.evaluate(() => [...document.querySelectorAll('button')].filter((b) => /Mark it done|start fresh|kettle on/i.test(b.textContent)).map((b) => [b.textContent.trim(), JSON.stringify(b.getBoundingClientRect())]));
  console.log(id, JSON.stringify({ toasts: t, buttons: btn }));
}, { only: ['summary', 'break', 'break-over'] });
await page.screenshot({ path: process.argv[3] });
const st = await page.evaluate(() => { const s = window.__kettle?.progress?.getState?.(); return s ? { leaves: s.leaves, level: s.level, quests: (s.quests||s.recipes||[]).slice?.(0,6) } : null; });
console.log('progress', JSON.stringify(st).slice(0, 1500));
await b.close();
