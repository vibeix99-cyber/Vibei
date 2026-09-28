#!/usr/bin/env node
/**
 * Split a tall full-page screenshot into side-by-side segments so it can be read at a glance.
 *   node review/split.mjs --out sheet.png [--seg 1688] [--h 900] img.png
 * --seg: segment height in source pixels (default = 2 × 844, one phone viewport at 2x)
 * --h:   display height of each segment
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const opt = { out: 'split.png', seg: '1688', h: '900' };
const files = [];
for (let i = 0; i < argv.length; i++) argv[i].startsWith('--') ? (opt[argv[i].slice(2)] = argv[++i]) : files.push(argv[i]);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
await page.setContent('<body style="margin:0;background:#2b2b2b"><div id=w style="display:flex;gap:10px;padding:10px;width:max-content;align-items:flex-start"></div></body>');
await page.evaluate(
  async ({ srcs, seg, h }) => {
    const w = document.getElementById('w');
    for (const src of srcs) {
      const img = new Image();
      img.src = src;
      await img.decode();
      for (let y = 0; y < img.naturalHeight; y += seg) {
        const sh = Math.min(seg, img.naturalHeight - y);
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = sh;
        c.getContext('2d').drawImage(img, 0, y, img.naturalWidth, sh, 0, 0, img.naturalWidth, sh);
        c.style.height = `${(h * sh) / seg}px`;
        c.style.borderRadius = '4px';
        w.appendChild(c);
      }
    }
  },
  { srcs: files.map((f) => `data:image/png;base64,${readFileSync(f).toString('base64')}`), seg: Number(opt.seg), h: Number(opt.h) },
);
await (await page.$('#w')).screenshot({ path: opt.out });
await browser.close();
console.log(opt.out);
