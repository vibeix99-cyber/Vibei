#!/usr/bin/env node
/**
 * Contact sheet: tile many images into one labelled PNG so a reviewer can scan
 * a whole folder in one look.
 *
 *   node review/contact.mjs --out sheet.png [--h 520] [--cols 6] [--labels 1] img1 img2 dir/ ...
 *
 * Directories are expanded (png/jpg/jpeg/webp, sorted). Labels = file basenames
 * (pass --labels 0 to hide them, e.g. for blind material).
 */
import { chromium } from 'playwright';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';

const argv = process.argv.slice(2);
const opts = { out: 'contact.png', h: '520', cols: '6', labels: '1' };
const files = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) opts[argv[i].slice(2)] = argv[++i];
  else files.push(argv[i]);
}
const IMG = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const expanded = files.flatMap((f) =>
  statSync(f).isDirectory()
    ? readdirSync(f).filter((n) => IMG.has(extname(n).toLowerCase())).sort().map((n) => join(f, n))
    : [f],
);
if (!expanded.length) {
  console.error('no images');
  process.exit(1);
}
const mime = (p) => ({ '.png': 'image/png', '.webp': 'image/webp' })[extname(p).toLowerCase()] ?? 'image/jpeg';
const h = Number(opts.h);
const cols = Number(opts.cols);
const cells = expanded
  .map((p) => {
    const src = `data:${mime(p)};base64,${readFileSync(resolve(p)).toString('base64')}`;
    const label = opts.labels === '0' ? '' : `<figcaption>${basename(p)}</figcaption>`;
    return `<figure><img src="${src}" style="height:${h}px"/>${label}</figure>`;
  })
  .join('');
const html = `<!doctype html><html><body style="margin:0;background:#2b2b2b;font:12px/1.3 system-ui;color:#eee">
<div style="display:grid;grid-template-columns:repeat(${cols},max-content);gap:12px;padding:12px;width:max-content">${cells}</div>
<style>figure{margin:0;display:flex;flex-direction:column;gap:4px;align-items:center}figcaption{max-width:${Math.round(h * 0.6)}px;overflow-wrap:anywhere;text-align:center}img{display:block;border-radius:4px}</style>
</body></html>`;
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
const el = await page.$('div');
await el.screenshot({ path: opts.out });
await browser.close();
console.log(opts.out, `${expanded.length} images`);
