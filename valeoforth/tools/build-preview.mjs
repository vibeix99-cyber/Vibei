// Builds ONE self-contained HTML file (all CSS/JS/images/fonts inlined) with the hall and every room as in-page views.
// Used for private previews on hosts that can't serve a multi-page folder. Reads dist/ (run `npm run build` first).
import fs from 'node:fs'; import path from 'node:path';
const DIST = path.resolve('dist'); const OUT = path.resolve(process.argv[2] ?? 'preview/index.html');
const mime = { '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const dataUri = (f) => `data:${mime[path.extname(f)]};base64,${fs.readFileSync(f).toString('base64')}`;
const rooms = fs.readdirSync(DIST, { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(path.join(DIST, d.name, 'index.html'))).map((d) => d.name).filter((n) => n !== 'img' && n !== 'assets' && n !== 'fonts');

const pageHtml = (rel, id, root) => {
  const html = fs.readFileSync(path.join(DIST, rel), 'utf8');
  const cls = html.match(/<body class="([^"]*)"/)[1];
  const title = html.match(/<title>([^<]*)<\/title>/)[1];
  let body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1].replace(/<script src="[^"]*site\.js[^"]*" defer><\/script>/, '');
  body = body.replace(/id="main"/, `id="main-${id}"`).replace('href="#main"', `href="#main-${id}"`);
  // links between views
  const esc = root.replace(/[.]/g, '\\.');
  body = body.replace(new RegExp(`href="${esc}"`, 'g'), 'href="#hall"');
  for (const r of rooms) body = body.replace(new RegExp(`href="${esc}${r}/"`, 'g'), `href="#${r}"`);
  // images: inline the largest variant, drop srcset
  body = body.replace(/<img\b[^>]*>/g, (tag) => {
    const set = tag.match(/srcset="([^"]*)"/);
    let src = tag.match(/\ssrc="([^"]*)"/)?.[1]; if (!src) return tag;
    if (set) { const last = set[1].split(',').map((s) => s.trim().split(/\s+/)[0]).pop(); src = last; tag = tag.replace(/\s(srcset|sizes)="[^"]*"/g, ''); }
    const file = path.join(DIST, src.replace(new RegExp(`^${esc}`), ''));
    if (!fs.existsSync(file)) return tag;
    return tag.replace(/\ssrc="[^"]*"/, ` src="${dataUri(file)}"`).replace(/\sloading="lazy"|\sdecoding="async"|\sfetchpriority="high"/g, '');
  });
  return { id, cls, title, body };
};
const pages = [pageHtml('index.html', 'hall', './'), ...rooms.map((r) => pageHtml(`${r}/index.html`, r, '../'))];

let css = fs.readFileSync(path.join(DIST, 'assets/site.css'), 'utf8');
css = css.replace(/url\("\.\.\/fonts\/([^"]+)"\)/g, (_, f) => `url("${dataUri(path.join(DIST, 'fonts', f))}")`);
css += ` [data-view][hidden]{display:none!important} html:not([data-theme]){background:#14111c}`;
const js = fs.readFileSync(path.join(DIST, 'assets/site.js'), 'utf8');
const router = `
(() => {
  const views = [...document.querySelectorAll('[data-view]')]; const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const byId = (id) => id && document.getElementById(id);
  const viewOf = (el) => el && el.closest('[data-view]');
  const show = (view, target) => {
    views.forEach((v) => { v.hidden = v !== view; });
    document.body.className = view.dataset.body; document.title = view.dataset.title;
    if (target && target !== view) target.scrollIntoView(); else scrollTo(0, 0);
    view.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-in'));
  };
  const route = () => {
    const id = decodeURIComponent(location.hash.slice(1)); const el = byId(id);
    const view = el ? (el.matches('[data-view]') ? el : viewOf(el)) : views[0];
    if (!view) return; const current = views.find((v) => !v.hidden);
    if (current === view) { if (el && el !== view) el.scrollIntoView(); else if (!el) scrollTo(0, 0); else scrollTo(0, 0); return; }
    if (document.startViewTransition && !reduce) document.startViewTransition(() => show(view, el)); else show(view, el);
  };
  addEventListener('hashchange', route); route();
})();`;
const mark = 'style="display:contents"';
const html = `<title>Valeoforth</title>
<meta name="description" content="A house for the things I build. Private preview: the hall and Room 01, Kettle.">
<style>${css}</style>
<div id="preview-root" ${mark}>${pages.map((p, i) => `<div data-view id="${p.id}" data-body="${p.cls}" data-title="${p.title.replace(/"/g, '&quot;')}" ${i ? 'hidden' : ''} ${mark}>${p.body}</div>`).join('\n')}</div>
<script>document.documentElement.classList.add('js');document.body.className=${JSON.stringify(pages[0].cls)};</script>
<script>${js}</script>
<script>${router}</script>`;
fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, html);
console.log(`preview: ${(html.length / 1048576).toFixed(2)} MB → ${OUT}`);
