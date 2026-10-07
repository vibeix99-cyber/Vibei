// Kettle accessibility audit (I04): axe-core, measured contrast, pointer targets, reachability, reflow, 200 % text,
// keyboard-open and reduced-motion fact retention, on the real app in every journey state.
//
// usage (from kettle/):
//   node review/product-excellence/tools/a11y-audit.mjs --base http://127.0.0.1:5242 --out <dir> \
//        [--suites main,reflow,text200,keyboard,motion] [--configs 390x844@2,375x667@2,1440x900@1] [--themes light,dark]
//
// Writes <dir>/audit.json and <dir>/audit.md. Exit code 0 always (it is an audit, not a gate: see tests/a11y.spec.ts).
//
// Contrast: axe-core's color-contrast decides text on solid backgrounds. Text axe cannot decide (over the stage's
// window, images, gradients, translucent layers) is MEASURED from pixels: the page is screenshotted with all text made
// transparent, the background behind the text's own line boxes is sampled, and each pixel is compared with the text
// colour (alpha and ancestor opacity composited). Only glyph pixels count (where the shown and text-hidden shots
// differ). We report the 5th-percentile, minimum and median ratio over those pixels; the requirement is 4.5:1 (3:1 for
// ≥ 24 px, or ≥ 18.66 px bold) and the decision uses the 5th percentile (anti-aliased edge pixels are the minimum).
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { INTERACTIVE, PAGES, open, walkJourney, probeTargets, probeReach } from '../../../tests/a11y-probes.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const BASE = arg('base', 'http://127.0.0.1:5242');
const OUT = arg('out', 'review/product-excellence/contracts/I04/audit');
const SUITES = arg('suites', 'main,reflow,text200,keyboard,motion').split(',');
const CONFIGS = arg('configs', '390x844@2,375x667@2,1440x900@1').split(',');
const THEMES = arg('themes', 'light,dark').split(',');
const ONLY = arg('only', '') ? arg('only').split(',') : null;
mkdirSync(OUT, { recursive: true });
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const parse = (c) => {
  const [wh, dpr] = c.split('@');
  const [w, h] = wh.split('x').map(Number);
  return { w, h, dpr: Number(dpr ?? 1) };
};
const ctxFor = ({ w, h, dpr }, theme, extra = {}) =>
  browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: w < 900 && w < h, hasTouch: w < 900, colorScheme: theme, serviceWorkers: 'block', ...extra });
const report = { base: BASE, revision: '', at: new Date().toISOString(), renderer: 'Chromium (Playwright) + SwiftShader (CPU)', suites: {} };
try {
  report.revision = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch {
  /* ignore */
}

// ---------------------------------------------------------------- pixel contrast
const decoder = await (await browser.newContext()).newPage();
async function pixels(png) {
  return decoder.evaluate(async (b64) => {
    const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
    const bmp = await createImageBitmap(blob);
    const c = new OffscreenCanvas(bmp.width, bmp.height);
    const g = c.getContext('2d');
    g.drawImage(bmp, 0, 0);
    return Array.from(g.getImageData(0, 0, bmp.width, bmp.height).data);
  }, png.toString('base64'));
}
const lin = (c) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const HIDE_TEXT =
  '*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-decoration-color:transparent!important;caret-color:transparent!important;transition:none!important}text,tspan{fill:transparent!important;stroke:transparent!important}';

/** Measure text contrast from pixels for the given CSS selectors (axe targets). */
async function measure(page, selectors) {
  const rows = [];
  for (const sel of selectors) {
    const moved = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const y = el.getBoundingClientRect().top;
      el.scrollIntoView({ block: 'center' });
      return Math.abs(el.getBoundingClientRect().top - y) > 1;
    }, sel);
    if (moved) await page.waitForTimeout(400); // let anything that reacts to scrolling settle
    const info = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const range = document.createRange();
      range.selectNodeContents(el);
      // Line boxes, cut to what ancestors with clipped overflow actually show (an ellipsised chip, a scroller).
      let clip = { l: 0, t: 0, r: innerWidth, b: innerHeight };
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
        const o = getComputedStyle(n);
        if (/(hidden|clip|auto|scroll)/.test(o.overflowX + o.overflowY)) {
          const b = n.getBoundingClientRect();
          clip = { l: Math.max(clip.l, b.left), t: Math.max(clip.t, b.top), r: Math.min(clip.r, b.right), b: Math.min(clip.b, b.bottom) };
        }
      }
      const rects = [...range.getClientRects()]
        .map((r) => ({ left: Math.max(r.left, clip.l), top: Math.max(r.top, clip.t), right: Math.min(r.right, clip.r), bottom: Math.min(r.bottom, clip.b) }))
        .map((r) => ({ left: r.left, top: r.top, width: r.right - r.left, height: r.bottom - r.top }))
        .filter((r) => r.width > 2 && r.height > 2);
      if (!rects.length) return null;
      const cs = getComputedStyle(el);
      let op = 1;
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) op *= Number(getComputedStyle(n).opacity);
      // SVG text is painted with `fill`, and its font size is in user units: use the rendered glyph box.
      const svg = el instanceof SVGElement;
      const m = (svg ? cs.fill : cs.color).match(/[\d.]+/g).map(Number);
      const size = svg ? el.getBoundingClientRect().height / 1.15 : parseFloat(cs.fontSize);
      return {
        // Text inside aria-hidden art (e.g. the count painted on the streak mug) is part of a picture and repeats
        // adjacent real text: WCAG 1.4.3's incidental exception.
        decorative: !!el.closest('[aria-hidden="true"]'),
        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
        color: [m[0], m[1], m[2], (m[3] ?? 1) * op],
        size: Math.round(size * 10) / 10,
        weight: Number(cs.fontWeight),
        rects: rects.map((r) => ({ x: r.left, y: r.top, width: r.width, height: r.height })),
      };
    }, sel);
    if (!info) continue;
    if (info.color[3] < 0.15) {
      rows.push({ selector: sel, text: info.text, px: info.size, weight: info.weight, need: null, method: 'not visible (opacity)', pass: true, invisible: true });
      continue;
    }
    // Three shots of each line box: text hidden, as shown, text hidden again. Glyph pixels are those where the shown
    // shot differs from both hidden shots while the two hidden shots agree (so a moving background — rain in the
    // window, a fading layer — is never mistaken for text). The hidden shot is the background behind each glyph.
    const vw = page.viewportSize();
    const clips = info.rects
      .map((r) => ({ x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.width, vw.width - Math.max(0, r.x)), height: Math.min(r.height, vw.height - Math.max(0, r.y)) }))
      .filter((c) => c.width >= 1 && c.height >= 1);
    const grab = () => Promise.all(clips.map(async (clip) => pixels(await page.screenshot({ clip, scale: 'css', animations: 'disabled' }))));
    const hide = async () => {
      const t = await page.addStyleTag({ content: HIDE_TEXT });
      await page.waitForTimeout(80);
      return t;
    };
    let tag = await hide();
    const h1 = await grab();
    await tag.evaluate((n) => n.remove());
    await page.waitForTimeout(80);
    const shown = await grab();
    tag = await hide();
    const h2 = await grab();
    await tag.evaluate((n) => n.remove());
    const shots = clips.map((_, i) => ({ shown: shown[i], bg: h1[i], bg2: h2[i] }));
    let ratios = [];
    const all = [];
    const a = info.color[3];
    const diff = (x, y, i) => Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2]);
    for (const { shown, bg: px, bg2 } of shots) {
      for (let i = 0; i < px.length && i < shown.length && i < bg2.length; i += 4) {
        if (diff(px, bg2, i) > 12) continue; // the background itself moved: not a fair sample
        const bg = [px[i], px[i + 1], px[i + 2]];
        const fg = [0, 1, 2].map((k) => info.color[k] * a + bg[k] * (1 - a));
        const r = ratio(fg, bg);
        all.push(r);
        if (diff(shown, px, i) >= 24 && diff(shown, bg2, i) >= 24) ratios.push(r); // a glyph pixel
      }
    }
    // Text so faint that it barely changes the pixels: judge it on its whole line box instead.
    let method = 'glyphs';
    if (ratios.length < all.length * 0.03) {
      ratios = all;
      method = 'line box';
    }
    if (!ratios.length || !all.length) continue;
    ratios.sort((x, y) => x - y);
    const need = info.size >= 24 || (info.size >= 18.66 && info.weight >= 700) ? 3 : 4.5;
    const p5 = ratios[Math.floor(ratios.length * 0.05)];
    rows.push({ selector: sel, text: info.text, px: info.size, weight: info.weight, need, method, samples: ratios.length, min: +ratios[0].toFixed(2), p5: +p5.toFixed(2), median: +ratios[ratios.length >> 1].toFixed(2), pass: p5 >= need, incidental: info.decorative && p5 < need });
  }
  return rows;
}

async function axe(page) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const cc = r.incomplete.find((x) => x.id === 'color-contrast');
  return {
    violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.slice(0, 6).map((n) => n.target.join(' ')), summary: v.nodes[0]?.failureSummary?.split('\n').slice(0, 2).join(' ') })),
    contrastPasses: r.passes.find((x) => x.id === 'color-contrast')?.nodes.length ?? 0,
    contrastIncomplete: (cc?.nodes ?? []).filter((n) => n.target.length === 1 && typeof n.target[0] === 'string').map((n) => n.target[0]),
  };
}

// ---------------------------------------------------------------- suites
const results = [];
const log = (...a) => console.log(...a);

async function auditState(page, id, cfg, theme, opts) {
  const row = { state: id, viewport: `${cfg.w}x${cfg.h}`, theme, suite: opts.suite };
  try {
    if (opts.axe) {
      const a = await axe(page);
      row.axe = { violations: a.violations, contrastPasses: a.contrastPasses, contrastUndecided: a.contrastIncomplete.length };
      if (opts.contrast) row.contrast = await measure(page, a.contrastIncomplete);
    }
    if (opts.targets) row.targets = await page.evaluate(probeTargets, INTERACTIVE);
    if (opts.reach) row.reach = await page.evaluate(probeReach, INTERACTIVE);
    if (opts.facts) row.facts = await page.evaluate(() => (document.querySelector('main, #main, #root')?.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean));
  } catch (e) {
    row.error = String(e.message || e).split('\n')[0];
  }
  results.push(row);
  const v = row.axe?.violations?.filter((x) => x.impact === 'serious' || x.impact === 'critical').length;
  log(`  ${opts.suite} ${row.viewport} ${theme} ${id}: axe ${row.axe ? `${row.axe.violations.length} (${v} serious+)` : '-'}${row.contrast ? `, measured ${row.contrast.length} (${row.contrast.filter((c) => !c.pass && !c.incidental).length} fail)` : ''}${row.targets ? `, targets <24: ${row.targets.filter((t) => t.result === 'fail').length}` : ''}${row.reach ? `, covered ${row.reach.covered.length}, hscroll ${row.reach.hScroll}, clipped ${row.reach.clipped.length}` : ''}${row.error ? ' ERROR ' + row.error : ''}`);
}

async function runSuite(suite, cfg, theme, opts, extra = {}) {
  const visitOpts = { suite, ...opts };
  const ctx = await ctxFor(cfg, theme, extra.ctx);
  if (extra.init) await ctx.addInitScript(extra.init);
  const page = await ctx.newPage();
  try {
    await walkJourney(page, BASE, (id, p) => auditState(p, id, cfg, theme, visitOpts), { theme, motion: extra.motion, only: ONLY });
  } catch (e) {
    results.push({ state: 'journey', viewport: `${cfg.w}x${cfg.h}`, theme, suite, error: String(e.message || e).split('\n')[0] });
    log(`  ${suite} journey ERROR ${String(e.message).split('\n')[0]}`);
  }
  await page.close();
  for (const pg of PAGES) {
    if (ONLY && !ONLY.includes(pg.id)) continue;
    const p = await ctx.newPage();
    try {
      await open(p, BASE, { seed: pg.seed, route: pg.route, theme, motion: extra.motion, settle: pg.settle ?? 1500 });
      await auditState(p, pg.id, cfg, theme, visitOpts);
    } catch (e) {
      results.push({ state: pg.id, viewport: `${cfg.w}x${cfg.h}`, theme, suite, error: String(e.message || e).split('\n')[0] });
    }
    await p.close();
  }
  await ctx.close();
}

const TEXT200 = () => {
  const add = () => {
    const s = document.createElement('style');
    s.textContent = 'html{font-size:200%!important}';
    document.head.appendChild(s);
  };
  if (document.head) add();
  else document.addEventListener('DOMContentLoaded', add);
};

if (SUITES.includes('main')) {
  for (const c of CONFIGS) {
    for (const theme of THEMES) {
      const cfg = parse(c);
      log(`main ${c} ${theme}`);
      await runSuite('main', cfg, theme, { axe: true, contrast: cfg.w === 390 || cfg.w === 1440, targets: true, reach: true });
    }
  }
}
if (SUITES.includes('reflow')) {
  log('reflow 320x568');
  await runSuite('reflow', parse('320x568@2'), 'light', { axe: true, targets: true, reach: true });
}
if (SUITES.includes('text200')) {
  for (const c of ['390x844@2', '375x667@2', '1440x900@1']) {
    log(`text200 ${c}`);
    await runSuite('text200', parse(c), 'light', { reach: true }, { init: TEXT200 });
  }
}
if (SUITES.includes('motion')) {
  for (const motion of ['full', 'reduce']) {
    log(`motion ${motion}`);
    await runSuite(`motion-${motion}`, parse('390x844@2'), 'light', { facts: true }, { motion, ctx: { reducedMotion: motion === 'reduce' ? 'reduce' : 'no-preference' } });
  }
}
if (SUITES.includes('keyboard')) {
  // The on-screen keyboard, emulated: the layout viewport shrinks by the keyboard's height while a field has focus.
  for (const [c, kb] of [
    ['390x844@2', 336],
    ['375x667@2', 291],
  ]) {
    const cfg = parse(c);
    for (const [id, seed, route, focus] of [
      ['home-typing', 'veteran', '/', 'input'],
      ['welcome-typing', 'fresh', '/welcome', 'input'],
      ['settings-name', 'veteran', '/settings', 'input'],
    ]) {
      const ctx = await ctxFor(cfg, 'light');
      const p = await ctx.newPage();
      try {
        await open(p, BASE, { seed, route, settle: 1500 });
        await p.locator(focus).first().focus();
        await p.setViewportSize({ width: cfg.w, height: cfg.h - kb });
        await p.waitForTimeout(500);
        // What a phone browser does when its keyboard opens (the Android resize model): bring the focused field into
        // view, honouring its scroll-margin. Then: is the field on screen and not under the docked start / tab bar?
        await p.evaluate(() => document.activeElement.scrollIntoView({ block: 'nearest' }));
        await p.waitForTimeout(500);
        const focusVisible = await p.evaluate(() => {
          const el = document.activeElement;
          const r = el.getBoundingClientRect();
          if (r.top < 0 || r.bottom > innerHeight) return false;
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return !!hit && (hit === el || el.contains(hit) || hit.contains(el));
        });
        const row = { state: id, viewport: `${cfg.w}x${cfg.h - kb} (keyboard ${kb}px)`, theme: 'light', suite: 'keyboard', focusedFieldVisible: focusVisible, reach: await p.evaluate(probeReach, INTERACTIVE) };
        results.push(row);
        log(`  keyboard ${row.viewport} ${id}: field visible ${focusVisible}, covered ${row.reach.covered.length}, hscroll ${row.reach.hScroll}, clipped ${row.reach.clipped.length}`);
      } catch (e) {
        results.push({ state: id, viewport: c, suite: 'keyboard', error: String(e.message || e).split('\n')[0] });
      }
      await ctx.close();
    }
  }
}
await browser.close();

// ---------------------------------------------------------------- report
report.results = results;
writeFileSync(`${OUT}/audit.json`, JSON.stringify(report, null, 2));
let md = `# Kettle accessibility audit\n\n- Base ${BASE} · revision ${report.revision} · ${report.at}\n- ${report.renderer}; axe-core tags ${TAGS.join(', ')}\n\n`;
const bySuite = (s) => results.filter((r) => r.suite === s || r.suite?.startsWith(s));
const main = bySuite('main');
if (main.length) {
  md += `## axe-core (main suite)\n\n| Viewport | Theme | States | Violations (serious/critical) | Violations (moderate/minor) | Contrast nodes passed by axe | Undecided → measured |\n|---|---|---:|---:|---:|---:|---:|\n`;
  const groups = {};
  for (const r of main) (groups[`${r.viewport} ${r.theme}`] ??= []).push(r);
  for (const [k, rows] of Object.entries(groups)) {
    const v = rows.flatMap((r) => r.axe?.violations ?? []);
    md += `| ${k.split(' ')[0]} | ${k.split(' ')[1]} | ${rows.length} | ${v.filter((x) => x.impact === 'serious' || x.impact === 'critical').length} | ${v.filter((x) => x.impact !== 'serious' && x.impact !== 'critical').length} | ${rows.reduce((a, r) => a + (r.axe?.contrastPasses ?? 0), 0)} | ${rows.reduce((a, r) => a + (r.axe?.contrastUndecided ?? 0), 0)} |\n`;
  }
  const allV = main.flatMap((r) => (r.axe?.violations ?? []).map((v) => ({ ...v, where: `${r.state} ${r.viewport} ${r.theme}` })));
  if (allV.length) {
    md += `\n### Violations\n\n| Rule | Impact | Where | Targets |\n|---|---|---|---|\n`;
    for (const v of allV) md += `| ${v.id} | ${v.impact} | ${v.where} | ${v.targets.join('; ').replace(/\|/g, '\\|')} |\n`;
  }
  const meas = main.flatMap((r) => (r.contrast ?? []).map((c) => ({ ...c, where: `${r.state} ${r.viewport} ${r.theme}` })));
  if (meas.length) {
    md += `\n## Measured contrast (text axe could not decide)\n\n| Where | Text | px/weight | Need | p5 | min | median | Result |\n|---|---|---|---:|---:|---:|---:|---|\n`;
    for (const c of meas) md += `| ${c.where} | ${c.text.replace(/\|/g, '/')} | ${c.px}/${c.weight} | ${c.need} | ${c.p5} | ${c.min} | ${c.median} | ${c.pass ? 'pass' : c.incidental ? 'below, incidental (art, aria-hidden, repeats adjacent text)' : '**FAIL**'} |\n`;
  }
  md += `\n## Pointer targets (WCAG 2.5.8; product goal 44×44)\n\n| Viewport | Theme | State | Targets | ≥44 | 24–44 | spacing/inline exception | <24 fail | Under 44 |\n|---|---|---|---:|---:|---:|---:|---:|---|\n`;
  for (const r of main) {
    const t = r.targets ?? [];
    const c = (k) => t.filter((x) => x.result === k).length;
    md += `| ${r.viewport} | ${r.theme} | ${r.state} | ${t.length} | ${c('ok44')} | ${c('ok24')} | ${c('spacing') + c('inline')} | ${c('fail')} | ${t.filter((x) => x.result !== 'ok44').map((x) => `${x.name} ${x.box.join('×')} (${x.result})`).join('; ').replace(/\|/g, '/')} |\n`;
  }
}
for (const s of ['main', 'reflow', 'text200', 'keyboard']) {
  const rows = bySuite(s).filter((r) => r.reach);
  if (!rows.length) continue;
  md += `\n## Reach, overflow, clipping — ${s}\n\n| Viewport | Theme | State | Controls | Covered (unreachable) | Horizontal scroll px | Clipped text |\n|---|---|---|---:|---|---:|---|\n`;
  for (const r of rows) md += `| ${r.viewport} | ${r.theme ?? ''} | ${r.state}${r.focusedFieldVisible === false ? ' (focused field hidden!)' : ''} | ${r.reach.checked} | ${r.reach.covered.map((c) => `${c.name} (under ${c.by})`).join('; ').replace(/\|/g, '/') || '—'} | ${r.reach.hScroll} | ${r.reach.clipped.map((c) => `${c.text} ${c.w?.join('/') ?? ''}`).join('; ').replace(/\|/g, '/') || '—'} |\n`;
}
const mf = bySuite('motion-full');
const mr = bySuite('motion-reduce');
if (mf.length && mr.length) {
  md += `\n## Reduced motion keeps every fact (390×844 light; visible text in full vs reduced motion)\n\n| State | Lines (full) | Lines (reduced) | Missing under reduced motion |\n|---|---:|---:|---|\n`;
  for (const f of mf) {
    const r = mr.find((x) => x.state === f.state);
    if (!r?.facts || !f.facts) continue;
    const norm = (s) => s.replace(/\d+:\d\d/g, '#:##').replace(/\d+/g, '#');
    const have = new Set(r.facts.map(norm));
    const missing = [...new Set(f.facts.map(norm))].filter((x) => !have.has(x));
    md += `| ${f.state} | ${f.facts.length} | ${r.facts.length} | ${missing.join('; ').replace(/\|/g, '/') || '—'} |\n`;
  }
}
const errs = results.filter((r) => r.error);
if (errs.length) md += `\n## Errors\n\n${errs.map((e) => `- ${e.suite} ${e.viewport} ${e.state}: ${e.error}`).join('\n')}\n`;
writeFileSync(`${OUT}/audit.md`, md);
console.log(`wrote ${OUT}/audit.md`);
