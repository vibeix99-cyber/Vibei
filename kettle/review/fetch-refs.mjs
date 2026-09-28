#!/usr/bin/env node
/**
 * Download the public Duolingo reference set listed in review/refs-manifest.json
 * into review/refs/duolingo/<category>/ and write review/refs/duolingo/SOURCES.md.
 *
 *   node review/fetch-refs.mjs [--force]
 *
 * review/refs/ is gitignored: third-party images are for private side-by-side
 * review only and must never be committed or shipped.
 * Uses curl (honours HTTPS_PROXY + the system CA bundle). Also derives:
 *   - GIF frames `<file>.<ms>ms.png` (manifest `frames`), and
 *   - crops of multi-phone composites into single screens (manifest `crops`),
 * so every blind comparable is one clean app screen.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(here, 'refs-manifest.json'), 'utf8'));
const root = join(here, 'refs', 'duolingo');
const force = process.argv.includes('--force');
const expand = (u) => {
  for (const [k, v] of Object.entries(manifest.prefixes)) if (u.startsWith(k)) return v + u.slice(k.length);
  return u;
};

const results = [];
for (const r of manifest.refs) {
  const dir = join(root, r.cat);
  mkdirSync(dir, { recursive: true });
  const dest = join(dir, r.file);
  const url = expand(r.url);
  let ok = existsSync(dest) && statSync(dest).size > 1000 && !force;
  if (!ok) {
    try {
      execFileSync('curl', ['-sSL', '--fail', '--retry', '3', '--compressed', '-A', 'Mozilla/5.0 (KettleCritic reference fetch)', '-o', dest, url], {
        stdio: ['ignore', 'ignore', 'pipe'],
      });
      ok = statSync(dest).size > 1000;
    } catch (e) {
      console.error(`FAIL ${r.cat}/${r.file}: ${String(e.stderr ?? e.message).trim()}`);
    }
  }
  results.push({ ...r, url, ok });
  console.log(`${ok ? 'ok  ' : 'MISS'} ${r.cat}/${r.file}`);
}

// Derived images: GIF frames (`<file>.<ms>ms.png`) and crops of composite
// shots into single clean screens (used as blind comparables).
const derived = [];
const needsBrowser = results.some((r) => r.ok && (r.frames || r.crops));
if (needsBrowser) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
  const mimeOf = (f) => (f.endsWith('.gif') ? 'image/gif' : f.endsWith('.png') ? 'image/png' : 'image/jpeg');
  for (const r of results.filter((x) => x.ok)) {
    const src = join(root, r.cat, r.file);
    const dataUrl = `data:${mimeOf(r.file)};base64,${readFileSync(src).toString('base64')}`;
    for (const ms of r.frames ?? []) {
      const out = `${src}.${ms}ms.png`;
      if (!existsSync(out) || force) {
        await page.setContent(`<body style="margin:0"><img id=i src="${dataUrl}"></body>`);
        await page.evaluate(() => document.getElementById('i').decode());
        await page.waitForTimeout(ms);
        await (await page.$('#i')).screenshot({ path: out });
      }
      derived.push({ cat: r.cat, file: `${r.file}.${ms}ms.png`, from: r.file, url: r.url, note: `frame at ~${ms}ms`, blind: (r.blindFrames ?? []).includes(ms) });
    }
    for (const c of r.crops ?? []) {
      const cat = c.cat ?? r.cat;
      mkdirSync(join(root, cat), { recursive: true });
      const out = join(root, cat, c.file);
      if (!existsSync(out) || force) {
        const [x, y, w, h] = c.box;
        await page.setContent(
          `<body style="margin:0"><div id=c style="width:${w}px;height:${h}px;overflow:hidden;position:relative">` +
            `<img src="${dataUrl}" style="position:absolute;left:${-x}px;top:${-y}px"></div></body>`,
        );
        await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
        await (await page.$('#c')).screenshot({ path: out });
      }
      derived.push({ cat, file: c.file, from: r.file, url: r.url, note: c.note ?? '', blind: c.blind !== false, box: c.box });
    }
  }
  await browser.close();
}

const ORDER = ['home', 'lesson-complete', 'streak', 'quests', 'profile-stats', 'settings', 'onboarding', 'dialogs', 'timer-like', 'brand'];
const cats = [...new Set([...ORDER, ...results.map((r) => r.cat), ...derived.map((d) => d.cat)])];
const lines = [
  '# Duolingo reference set — sources',
  '',
  'Public, first-party sources only (Apple App Store listing, blog.duolingo.com posts and their image hosts).',
  'Google Play listing screenshots were identical to the App Store set, so the App Store copies are used.',
  '**Private review material — never commit, ship, trace or imitate.** Regenerate with `node review/fetch-refs.mjs`.',
  `Fetched: ${new Date().toISOString().slice(0, 10)}. ` +
    '`blind` = suitable as a blind-review comparable (a single, clean, current-ish app screen).',
  '',
];
for (const c of cats) {
  const rs = results.filter((r) => r.cat === c);
  lines.push(`## ${c} (${rs.filter((r) => r.ok).length})`, '', '| file | blind | what it shows | image URL | source page |', '|---|---|---|---|---|');
  for (const r of rs)
    lines.push(`| ${r.ok ? '' : '~~'}\`${r.file}\`${r.ok ? '' : '~~ (missing)'} | ${r.blind ? 'yes' : ''} | ${r.note} | ${r.url} | ${r.page} |`);
  const ds = derived.filter((d) => d.cat === c);
  if (ds.length) {
    lines.push('', 'Derived (crops / GIF frames of the files above — same source URLs):', '', '| file | blind | derived from | what it shows | image URL |', '|---|---|---|---|---|');
    for (const d of ds) lines.push(`| \`${d.file}\` | ${d.blind ? 'yes' : ''} | \`${d.from}\`${d.box ? ` crop ${d.box.join(',')}` : ''} | ${d.note} | ${d.url} |`);
  }
  lines.push('');
}
writeFileSync(join(root, 'SOURCES.md'), lines.join('\n'));
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} refs → ${root}`);
