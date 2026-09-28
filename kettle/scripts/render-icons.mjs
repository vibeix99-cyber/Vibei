#!/usr/bin/env node
/**
 * App icons (OWNER: art area).
 *
 *   node scripts/render-icons.mjs [--export --base http://127.0.0.1:5182]
 *
 * 1. --export: pulls the icon compositions from the running dev server's art
 *    gallery (src/art/AppIcon.tsx → #/kit?part=art&view=appicon), strips
 *    runtime-only attributes, resolves CSS vars, and writes the static SVG
 *    sources: public/favicon.svg, public/icons/icon.svg, public/icons/maskable.svg.
 * 2. Always: rasterizes those SVGs to the PWA PNGs with Playwright:
 *    public/icons/icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon.png (180).
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const icons = join(pub, 'icons');
mkdirSync(icons, { recursive: true });

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d;
};

/** CSS vars used by the art kit → static values for standalone SVG files. */
const VARS = {
  '--art-shadow': 'rgba(59, 42, 32, 0.13)',
  '--art-steam': 'rgba(120, 96, 80, 0.34)',
  '--art-soft': '#efe0cb',
  '--art-softer': '#f6ecde',
  '--art-bubble': '#e2cfb6',
  '--art-glow': 'rgba(255, 194, 61, 0.26)',
  '--art-z': '#7fb6de',
};

function clean(svg, size) {
  let s = svg
    .replace(/\sclass="[^"]*"/g, '')
    .replace(/\sdata-[a-z-]+="[^"]*"/g, '')
    .replace(/\saria-hidden="[^"]*"/g, '')
    .replace(/\sstyle="[^"]*"/g, '')
    .replace(/var\((--[a-z-]+)(?:,\s*[^)]*)?\)/g, (_, v) => VARS[v] ?? '#000');
  s = s.replace(/<svg([^>]*?)\swidth="[^"]*"/, '<svg$1').replace(/<svg([^>]*?)\sheight="[^"]*"/, '<svg$1');
  if (size) s = s.replace('<svg', `<svg width="${size}" height="${size}"`);
  if (!s.includes('xmlns=')) s = s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  return s;
}

const browser = await chromium.launch();

if (flag('export')) {
  const base = opt('base', 'http://127.0.0.1:5182');
  const page = await browser.newPage();
  await page.goto(`${base}/?debug#/kit?part=art&view=appicon&size=512&animate=0`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-appicon-wrap="any"] svg');
  const grab = (v) => page.$eval(`[data-appicon-wrap="${v}"] svg`, (el) => el.outerHTML);
  const header = (what) => `<!-- Kettle ${what} — generated from src/art/AppIcon.tsx by scripts/render-icons.mjs --export -->\n`;
  writeFileSync(join(icons, 'icon.svg'), header('app icon') + clean(await grab('any'), 512) + '\n');
  writeFileSync(join(icons, 'maskable.svg'), header('maskable app icon') + clean(await grab('maskable'), 512) + '\n');
  writeFileSync(join(pub, 'favicon.svg'), header('favicon') + clean(await grab('faviconChai'), 64) + '\n');
  console.log('exported public/favicon.svg, public/icons/icon.svg, public/icons/maskable.svg');
  await page.close();
}

const targets = [
  { src: join(icons, 'icon.svg'), size: 192, out: join(icons, 'icon-192.png') },
  { src: join(icons, 'icon.svg'), size: 512, out: join(icons, 'icon-512.png') },
  { src: join(icons, 'maskable.svg'), size: 512, out: join(icons, 'maskable-512.png') },
  { src: join(icons, 'icon.svg'), size: 180, out: join(icons, 'apple-touch-icon.png') },
];

const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const t of targets) {
  const svg = clean(readFileSync(t.src, 'utf8').replace(/<!--[\s\S]*?-->/g, ''), t.size);
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await page.screenshot({ path: t.out, clip: { x: 0, y: 0, width: t.size, height: t.size }, omitBackground: true });
  console.log(t.out.replace(root + '/', ''));
}
await browser.close();
