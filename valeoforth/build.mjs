// Static build: src/ + public/ -> dist/. No framework; relative URLs so it works from any base path (or file://).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { rooms } from './src/rooms/index.mjs';
import { renderHome, render404 } from './src/templates/home.mjs';
import { renderRoom } from './src/templates/room.mjs';
import { site } from './src/site.mjs';
import { toString } from './src/lib/html.mjs';

const DIST = path.resolve('dist');
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });

// static files (images, favicon, fonts from npm)
fs.cpSync('public', DIST, { recursive: true });
const fontSrc = ['fraunces/files/fraunces-latin-soft-normal.woff2', 'fraunces/files/fraunces-latin-wght-italic.woff2', 'figtree/files/figtree-latin-wght-normal.woff2'];
fs.mkdirSync(path.join(DIST, 'fonts'), { recursive: true });
for (const f of fontSrc) fs.copyFileSync(path.join('node_modules/@fontsource-variable', f), path.join(DIST, 'fonts', path.basename(f)));

// css / js
const css = fs.readdirSync('src/styles').filter((f) => f.endsWith('.css')).sort().map((f) => fs.readFileSync(path.join('src/styles', f), 'utf8')).join('\n');
const cssMin = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ');
const js = fs.readFileSync('src/scripts/site.js', 'utf8');
const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 8);
fs.writeFileSync(path.join(DIST, 'assets/site.css'), cssMin);
fs.writeFileSync(path.join(DIST, 'assets/site.js'), js);
const stamp = (h) => h.replace('__CSSHASH__', hash(cssMin)).replace('__JSHASH__', hash(js));

// pages
const write = (rel, content) => { const f = path.join(DIST, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, stamp(toString(content))); };
write('index.html', renderHome({ rooms }));
for (const room of rooms) write(`${room.slug}/index.html`, renderRoom({ room, rooms }));
write('404.html', render404({ rooms })); // links are relative to the site root: correct when hosted at a domain root
fs.writeFileSync(path.join(DIST, 'robots.txt'), 'User-agent: *\nDisallow: /\n# Site is in private preview; remove the Disallow line at launch.\n');
if (site.url) {
  const urls = ['', ...rooms.map((r) => `${r.slug}/`)].map((u) => `<url><loc>${site.url.replace(/\/$/, '')}/${u}</loc></url>`).join('');
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
}
console.log(`built ${1 + rooms.length} pages, css ${(cssMin.length / 1024).toFixed(1)}KB, js ${(js.length / 1024).toFixed(1)}KB`);
