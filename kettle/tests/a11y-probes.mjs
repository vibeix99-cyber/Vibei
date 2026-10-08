/**
 * Accessibility probes shared by the regression gate (tests/a11y.spec.ts) and the full audit
 * (review/product-excellence/tools/a11y-audit.mjs). Plain ESM so both Node and Playwright Test can import it.
 *
 * States are reached through the debug API (`?debug&seed=…`, `window.__kettle`), the same way the capture tool does.
 * In-page probes are self-contained functions passed to `page.evaluate`.
 */

/** Everything a pointer or keyboard user can operate. */
export const INTERACTIVE =
  'button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=radio], [role=switch], [role=checkbox], [role=tab], [role=slider], [role=spinbutton], [role=menuitem], [role=option], [tabindex]:not([tabindex="-1"])';

export function url(base, { seed = 'veteran', theme = 'light', route = '/', motion } = {}) {
  const q = `?debug&seed=${seed}&theme=${theme}${theme === 'light' ? '&nooktime=day' : ''}${motion ? `&motion=${motion}` : ''}`;
  return `${base.replace(/\/$/, '')}/${q}#${route}`;
}

export async function open(page, base, opts = {}) {
  await page.goto(url(base, opts), { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__kettle, null, { timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  // Deterministic flow: no auto-started breaks/brews while a probe runs; sound off (headless has no listener).
  await page.evaluate((scene) => window.__kettle.settings.getState().set({ autoStartBreaks: false, autoStartFocus: false, muted: true, ...(scene ? { scene } : {}) }), opts.scene ?? null);
  await page.waitForTimeout(opts.settle ?? 900);
}

/**
 * Walk the critical journey on one page and call `visit(id, page)` in each state.
 * `only` limits the visits (states in between are still passed through).
 */
export async function walkJourney(page, base, visit, { theme = 'light', motion, scene, only, wait = 1 } = {}) {
  const want = (id) => !only || only.includes(id);
  const w = (ms) => page.waitForTimeout(ms * wait);
  // Zen: the focus chrome fades after 7 s without input; any pointer movement brings it back.
  // The chrome fades back in over 700 ms: sample after it has finished (a mid-fade task chip read 3.6:1).
  const wake = async () => {
    await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointermove')));
    await page.waitForTimeout(1200);
  };
  const ev = (fn, arg) => page.evaluate(fn, arg);
  // Scroll the control to the middle first: Playwright's own scrolling parks it at an edge, where sticky chrome
  // (the docked start, the summary footer) can sit on top of it.
  const click = async (loc) => {
    await loc.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await loc.click();
  };
  await open(page, base, { theme, motion, scene });
  if (want('home')) await visit('home', page);
  if (want('home-custom')) {
    await click(page.getByRole('radio', { name: /Custom/ }));
    await w(900);
    await visit('home-custom', page);
    await page.keyboard.press('Escape');
    await w(600);
  }
  await ev(() => window.__kettle.timer.getState().startFocus({ intention: 'Chapter 3 notes', tag: 'study' }));
  await w(3500);
  await ev(() => window.__kettle.ff(9 * 60_000));
  await w(1200);
  if (want('focus')) await wake().then(() => visit('focus', page));
  if (want('end-sheet')) {
    await click(page.getByRole('button', { name: 'End session' }));
    await w(900);
    await visit('end-sheet', page);
    await page.keyboard.press('Escape');
    await w(600);
  }
  if (want('ambience-sheet')) {
    await click(page.getByRole('button', { name: /^Ambience:/ }));
    await w(900);
    await visit('ambience-sheet', page);
    await page.keyboard.press('Escape');
    await w(600);
  }
  await ev(() => window.__kettle.timer.getState().pause());
  // The Paused flag fades in over 250 ms; on a loaded CPU renderer that can take longer than a second, and a
  // mid-fade sample reads as low contrast (measured 1.29:1 at ~10 % opacity, 4.5:1+ once settled).
  await w(2000);
  if (want('paused')) await visit('paused', page);
  await ev(() => window.__kettle.timer.getState().resume());
  await click(page.getByRole('button', { name: 'Add 5 minutes' }));
  await w(900);
  if (want('added')) await wake().then(() => visit('added', page));
  await ev(() => window.__kettle.nearEnd());
  await w(400);
  await ev(() => window.__kettle.finish());
  await w(motion === 'reduce' ? 400 : 700);
  if (want('whistle')) await visit('whistle', page);
  await page.getByRole('button', { name: /Tea time|Long tea break/ }).waitFor({ state: 'visible', timeout: 60_000 });
  await w(2600);
  if (want('summary')) await visit('summary', page);
  if (want('summary-details')) {
    await ev(() => document.querySelector('[aria-expanded]')?.click());
    await w(700);
    await visit('summary-details', page);
  }
  await click(page.getByRole('button', { name: /Tea time|Long tea break/ }));
  await w(2600);
  if (want('break')) await visit('break', page);
  await ev(() => window.__kettle.finish());
  await w(2600);
  if (want('break-over')) await visit('break-over', page);
}

/** Secondary destinations and first visit, each from a fresh load. */
export const PAGES = [
  { id: 'welcome', seed: 'fresh', route: '/welcome' },
  { id: 'stats-empty', seed: 'blank', route: '/stats' },
  { id: 'stats', seed: 'veteran', route: '/stats' },
  { id: 'nook', seed: 'veteran', route: '/nook', settle: 6000 },
  { id: 'settings', seed: 'veteran', route: '/settings' },
];

// ---------------------------------------------------------------- in-page probes (pass to page.evaluate)

/**
 * Pointer targets in the current state. For each visible, operable target: its box, the hit area the browser
 * actually gives it (probed with elementFromPoint, so ::before/::after hit extensions count) and the WCAG 2.5.8
 * outcome: 'ok44' | 'ok24' | 'spacing' (undersized but the 24 px circle is clear) | 'inline' | 'fail'.
 */
export function probeTargets(selector) {
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    // Off-canvas until focused (skip link): checked by the keyboard journey instead.
    if (r.bottom + scrollY <= 0 || r.right + scrollX <= 0) return false;
    if (el.closest('[inert],[aria-hidden="true"]')) return false;
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    return true;
  };
  const name = (el) => (el.getAttribute('aria-label') || el.labels?.[0]?.textContent || el.textContent || el.getAttribute('placeholder') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 48);
  // A visually hidden native radio/checkbox is operated through its label.
  const target = (el) => {
    if (el.matches('input[type=radio],input[type=checkbox]')) {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || getComputedStyle(el).opacity === '0') return el.closest('label') || el.labels?.[0] || el;
    }
    return el;
  };
  const seen = new Set();
  const list = [];
  for (const raw of document.querySelectorAll(selector)) {
    const el = target(raw);
    if (seen.has(el)) continue;
    if (!vis(el) || raw.disabled || raw.getAttribute('aria-disabled') === 'true') continue;
    seen.add(el);
    list.push(el);
  }
  // A focusable container (scroll region, group) is not itself a pointer target when it holds other targets.
  for (let i = list.length - 1; i >= 0; i--) if (list.some((o) => o !== list[i] && list[i].contains(o))) list.splice(i, 1);
  const out = [];
  for (const el of list) {
    el.scrollIntoView({ block: 'center', inline: 'center' });
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const hits = (x, y) => {
      const e = document.elementFromPoint(x, y);
      return !!e && (e === el || el.contains(e) || (el.htmlFor && e.id === el.htmlFor));
    };
    const squareHits = (s) => {
      const h = s / 2 - 0.5;
      const pts = [[-h, -h], [0, -h], [h, -h], [-h, 0], [h, 0], [-h, h], [0, h], [h, h], [0, 0]];
      return pts.every(([dx, dy]) => hits(cx + dx, cy + dy));
    };
    const boxW = Math.round(r.width * 10) / 10;
    const boxH = Math.round(r.height * 10) / 10;
    const hit44 = boxW >= 44 && boxH >= 44 ? true : squareHits(44);
    const hit24 = hit44 || (boxW >= 24 && boxH >= 24) || squareHits(24);
    const inline = getComputedStyle(el).display === 'inline' && (el.parentElement?.textContent || '').trim().length > (el.textContent || '').trim().length + 8;
    out.push({ el, name: name(el), tag: el.tagName.toLowerCase(), role: el.getAttribute('role') || '', box: [boxW, boxH], center: [cx + scrollX, cy + scrollY], hit44, hit24, inline });
  }
  // Spacing exception for undersized targets: a 24 px circle on each centre clears every other target's box and
  // every other undersized target's circle (WCAG 2.2 SC 2.5.8).
  const boxes = list.map((el) => {
    const r = el.getBoundingClientRect();
    return { l: r.left + scrollX, t: r.top + scrollY, r: r.right + scrollX, b: r.bottom + scrollY };
  });
  window.scrollTo(0, 0);
  return out.map((o, i) => {
    let result = o.hit44 ? 'ok44' : o.hit24 ? 'ok24' : o.inline ? 'inline' : 'fail';
    if (result === 'fail') {
      const [x, y] = o.center;
      const clear = boxes.every((b, j) => {
        if (j === i) return true;
        const dx = Math.max(b.l - x, 0, x - b.r);
        const dy = Math.max(b.t - y, 0, y - b.b);
        if (Math.hypot(dx, dy) < 12) return false;
        return out[j].hit24 || Math.hypot(out[j].center[0] - x, out[j].center[1] - y) >= 24;
      });
      if (clear) result = 'spacing';
    }
    const { el, ...rest } = o;
    return { ...rest, result };
  });
}

/**
 * Reachability: every operable element can be scrolled to a place where its centre is not covered by sticky
 * chrome (dock, footer, tab bar). Also reports horizontal overflow and text clipped by its own box.
 */
export function probeReach(selector) {
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    // Off-canvas until focused (skip link): checked by the keyboard journey instead.
    if (r.bottom + scrollY <= 0 || r.right + scrollX <= 0) return false;
    if (el.closest('[inert],[aria-hidden="true"]')) return false;
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    return true;
  };
  const name = (el) => (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 48);
  const covered = [];
  let checked = 0;
  for (const raw of document.querySelectorAll(selector)) {
    let el = raw;
    if (el.matches('input[type=radio],input[type=checkbox]')) {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || getComputedStyle(el).opacity === '0') el = el.closest('label') || el;
    }
    if (!vis(el)) continue;
    checked++;
    let ok = false;
    let by = '';
    for (const block of ['center', 'start', 'end', 'nearest']) {
      el.scrollIntoView({ block, inline: 'nearest' });
      const r = el.getBoundingClientRect();
      const x = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1);
      const y = r.top + r.height / 2;
      const e = y >= 0 && y < innerHeight ? document.elementFromPoint(x, y) : null;
      if (e && (e === el || el.contains(e) || (el.htmlFor && e.id === el.htmlFor))) {
        ok = true;
        break;
      }
      by = e ? `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}` : 'off-screen';
    }
    if (!ok) covered.push({ name: name(el), by });
  }
  window.scrollTo(0, 0);
  const doc = document.documentElement;
  const hScroll = Math.max(0, doc.scrollWidth - doc.clientWidth);
  // Clipped text: an element whose own text overflows a box that hides overflow (or ends in an ellipsis).
  const clipped = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el) || !el.childNodes.length) continue;
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!ownText && !el.matches('input,textarea')) continue;
    const cs = getComputedStyle(el);
    const hides = /(hidden|clip)/.test(cs.overflowX + cs.overflowY) || cs.textOverflow === 'ellipsis';
    if (!hides) continue;
    const sr = cs.position === 'absolute' && el.getBoundingClientRect().width <= 1;
    if (sr) continue;
    if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2) clipped.push({ text: name(el), w: [el.clientWidth, el.scrollWidth], h: [el.clientHeight, el.scrollHeight] });
  }
  // Inputs whose placeholder is wider than the box (shown cut off).
  for (const el of document.querySelectorAll('input[placeholder]')) {
    if (!vis(el) || el.value) continue;
    const cs = getComputedStyle(el);
    const ph = getComputedStyle(el, '::placeholder');
    const c = document.createElement('canvas').getContext('2d');
    c.font = `${ph.fontWeight || cs.fontWeight} ${ph.fontSize || cs.fontSize} ${ph.fontFamily || cs.fontFamily}`;
    const need = c.measureText(el.placeholder).width;
    const have = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (need > have + 1) clipped.push({ text: `placeholder: ${el.placeholder}`, w: [Math.round(have), Math.round(need)] });
  }
  return { checked, covered, hScroll, clipped };
}

/**
 * The focused element: its name, the indicator its own computed style shows (outline / box-shadow; wrappers that
 * draw the ring with :focus-within are caught by the pixel comparison in the spec), whether sticky chrome hides it
 * entirely (2.4.11) and its box (6 px margin) for a focused-vs-blurred screenshot comparison.
 */
export function probeFocus() {
  const el = document.activeElement;
  if (!el || el === document.body) return { name: '(body)', tag: 'body', indicator: 'none', obscured: true, route: location.hash, box: { x: 0, y: 0, width: 0, height: 0 } };
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 3, r.top + 3], [r.right - 3, r.top + 3], [r.left + 3, r.bottom - 3], [r.right - 3, r.bottom - 3]];
  const seen = pts.filter(([x, y]) => x >= 0 && y >= 0 && x < innerWidth && y < innerHeight).some(([x, y]) => {
    const e = document.elementFromPoint(x, y);
    return e && (e === el || el.contains(e) || e.contains(el));
  });
  const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 ? `outline ${cs.outlineWidth} ${cs.outlineColor}` : '';
  const ring = cs.boxShadow && cs.boxShadow !== 'none' ? `box-shadow ${cs.boxShadow.slice(0, 60)}` : '';
  const by = el.getAttribute('aria-labelledby');
  const label = el.getAttribute('aria-label') || (by && document.getElementById(by)?.textContent) || el.labels?.[0]?.textContent || el.textContent || el.getAttribute('placeholder') || '';
  const r2 = el.getBoundingClientRect();
  return {
    name: label.trim().replace(/\s+/g, ' ').slice(0, 48),
    box: { x: Math.max(0, r2.left - 6), y: Math.max(0, r2.top - 6), width: Math.min(innerWidth, r2.right + 6) - Math.max(0, r2.left - 6), height: Math.min(innerHeight, r2.bottom + 6) - Math.max(0, r2.top - 6) },
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute('role') || '',
    focusVisible: el.matches(':focus-visible'),
    indicator: outline || ring || 'none',
    obscured: !seen,
    route: location.hash,
  };
}
