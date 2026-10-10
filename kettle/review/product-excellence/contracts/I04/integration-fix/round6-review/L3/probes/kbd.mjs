// L3 3a: forward / reverse Tab on Today with the storage-full warning at 375x667 (100% / 200%), real key presses.
// node kbd.mjs --rev=R6|INT --w=375 --h=667 --text=100 --theme=light --key=Tab|Shift+Tab --max=45 --gap=500 [--video] --tag=x
import { REV, launch, newCtx, openNewbie, fillStorage, sleep, args, logger, OUT } from './lib.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const a = args();
const rev = REV[a.rev ?? 'R6'];
const w = +(a.w ?? 375), h = +(a.h ?? 667), text = +(a.text ?? 100), theme = a.theme ?? 'light', KEY = a.key ?? 'Tab', MAX = +(a.max ?? 45), GAP = +(a.gap ?? 500);
const tag = a.tag ?? `${rev.name}-${w}x${h}-t${text}-${theme}-${KEY.replace('+', '')}`;
const dir = `${OUT}/3a`;
mkdirSync(dir, { recursive: true });
const log = logger(`${dir}/kbd-${tag}.log`);
const WARN = 'toast-kettle:save-failed';
const b = await launch();
const ctx = await newCtx(b, { w, h, text, theme, video: a.video ? `${dir}/video-tmp-${tag}` : undefined });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await openNewbie(p, rev.dev, { theme });
log(`RUN 3a ${tag} url=${rev.dev} rev=${rev.name}@${rev.commit} viewport=${w}x${h} text=${text}% theme=${theme} key=${KEY} gap=${GAP}ms max=${MAX}`);
log('fill', await fillStorage(p));
// Setup through the debug API (as M2's kbd6 does): a brew started and ended within its first minute -> Today with "Kettle's off" + warning.
await p.evaluate(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
await p.waitForFunction(() => location.hash === '#/focus'); await sleep(2500);
await p.evaluate(() => window.__kettle.timer.getState().end('user'));
await p.waitForFunction(() => location.hash === '#/' || location.hash === '');
await p.waitForSelector(`[id="${WARN}"]`, { timeout: 12000 }).catch(() => log('WARNING NEVER APPEARED'));
await sleep(800);
await p.evaluate((W) => {
  const R = (window.__kb = { ev: [], ser: [], t0: performance.now(), last: '' });
  const T = () => Math.round(performance.now() - R.t0);
  new MutationObserver((ms) => { for (const m of ms) { for (const x of m.addedNodes) if (x.tagName === 'LI') R.ev.push([T(), '+', x.id]); for (const x of m.removedNodes) if (x.tagName === 'LI') R.ev.push([T(), '-', x.id]); } }).observe(document.body, { childList: true, subtree: true });
  const sel = 'button, a[href], [role="button"], input, textarea, select';
  window.__kbRule = () => {
    // replica of toastLiftBottom() + protectedUnderToasts() on a non-session route
    let top = Infinity;
    for (const el of document.querySelectorAll('[data-toast-above]')) {
      if (el.closest('[aria-hidden="true"], [inert]')) continue;
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.top < innerHeight && r.bottom > innerHeight * 0.6) top = Math.min(top, r.top);
    }
    const lift = top === Infinity ? null : Math.round(innerHeight - top + 10);
    const live = document.querySelector('[aria-label="Notifications"]');
    const region = live?.parentElement;
    const bottom = lift != null ? innerHeight - lift : region.getBoundingClientRect().bottom;
    const zone = [Math.round(bottom - 170), Math.round(bottom)];
    const shown = document.getElementById(W)?.getBoundingClientRect();
    const zones = [{ top: bottom - 170, bottom }];
    if (shown && shown.height > 0) zones.push({ top: shown.top, bottom: shown.bottom });
    const area = live.getBoundingClientRect();
    const hit = [];
    for (const el of document.querySelectorAll(`[data-toast-above] :is(${sel})`)) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right <= area.left || r.left >= area.right) continue;
      if (zones.some((z) => r.bottom > z.top && r.top < z.bottom)) hit.push(`${(el.textContent || '').trim().slice(0, 24)}@${Math.round(r.top)}-${Math.round(r.bottom)}`);
    }
    return { lift, zone, hit, dockTop: top === Infinity ? null : Math.round(top) };
  };
  setInterval(() => {
    const wr = document.getElementById(W);
    const rr = window.__kbRule();
    const s = `${wr ? 1 : 0}|${Math.round(scrollY)}|${rr.lift}|${rr.zone}|${rr.hit.join(';')}`;
    if (s !== R.last) { R.last = s; R.ser.push({ t: T(), warn: wr ? 1 : 0, scrollY: Math.round(scrollY), ...rr }); }
  }, 50);
}, WARN);
const snap = () => p.evaluate((W) => {
  const a = document.activeElement;
  const desc = a && a !== document.body ? `${a.tagName.toLowerCase()}${a.id ? '#' + a.id : ''} "${(a.getAttribute('aria-label') || a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 34)}"` : 'body';
  const ar = a?.getBoundingClientRect();
  const wr = document.getElementById(W)?.getBoundingClientRect();
  return { t: Math.round(performance.now() - window.__kb.t0), focus: desc, focusBox: ar ? [Math.round(ar.top), Math.round(ar.bottom)] : null, inToast: !!a?.closest?.('[aria-label="Notifications"]'), warning: wr ? [Math.round(wr.top), Math.round(wr.bottom)] : null, scrollY: Math.round(scrollY), docH: document.documentElement.scrollHeight, rule: window.__kbRule() };
}, WARN);
const rows = [await snap()];
let reached = null;
if (KEY === 'Shift+Tab') { /* start from the top as well: first Shift+Tab from the top wraps to the end of the document */ }
for (let i = 1; i <= MAX; i++) {
  await p.keyboard.press(KEY);
  await sleep(GAP);
  const s = await snap(); s.tab = i; rows.push(s);
  if (s.inToast && /Save backup/.test(s.focus)) { reached = i; break; }
}
const ev = await p.evaluate(() => window.__kb.ev);
const ser = await p.evaluate(() => window.__kb.ser);
let focusVisible = null, enter = null;
if (reached) {
  focusVisible = await p.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { matches: a.matches(':focus-visible'), outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, offset: cs.outlineOffset }; });
  await p.screenshot({ path: `${dir}/kbd-${tag}-save-backup-focused.png` });
  const dl = p.waitForEvent('download', { timeout: 8000 }).catch(() => null);
  await p.keyboard.press('Enter');
  const d = await dl; enter = d ? d.suggestedFilename() : null;
} else {
  await p.screenshot({ path: `${dir}/kbd-${tag}-not-reached.png` });
}
log(`RESULT ${tag}: ${reached ? `REACHED after ${reached} presses; focus-visible ${JSON.stringify(focusVisible)}; Enter -> ${enter}` : `NOT reached in ${MAX} presses`}`);
log('warning li add/remove events (ms from start):', ev.filter((e) => e[2] === WARN));
for (const s of rows) log(`  ${String(s.tab ?? 0).padStart(2)} t=${s.t} ${s.focus}${s.inToast ? ' [toast]' : ''} box ${JSON.stringify(s.focusBox)} | warning ${JSON.stringify(s.warning)} | scrollY ${s.scrollY}/${s.docH} lift ${s.rule.lift} zone ${JSON.stringify(s.rule.zone)} dockTop ${s.rule.dockTop} hit ${JSON.stringify(s.rule.hit)}`);
log('50ms series transitions:'); for (const r of ser) log('  ', JSON.stringify(r));
log('pageerrors', errs);
writeFileSync(`${dir}/kbd-${tag}.json`, JSON.stringify({ tag, rev: rev.name, url: rev.dev, w, h, text, theme, KEY, reached, focusVisible, enter, events: ev.filter((e) => e[2] === WARN), rows, ser }, null, 1));
await ctx.close();
await b.close();
if (a.video) { const { readdirSync, renameSync, rmSync } = await import('node:fs'); const d = `${dir}/video-tmp-${tag}`; const f = readdirSync(d).find((x) => x.endsWith('.webm')); if (f) renameSync(`${d}/${f}`, `${dir}/video-3a-${tag}.webm`); rmSync(d, { recursive: true, force: true }); }
