import { html, raw } from '../lib/html.mjs';
import { site } from '../site.mjs';

export const brandMark = raw(`<svg class="brand__mark" viewBox="0 0 22 28" aria-hidden="true" focusable="false"><path d="M1.5 27V11a9.5 9.5 0 0 1 19 0v16z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6.5 27V12.2a4.5 4.5 0 0 1 9 0V27z" fill="#ffb45c"/></svg>`);
const chev = raw(`<svg class="menu__chev" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`);

function roomsMenu({ root, rooms, current }) {
  return html`<details class="menu" data-menu>
    <summary aria-label="Rooms menu"><span>Rooms</span>${chev}</summary>
    <div class="menu__panel">
      <ul class="menu__list">
        <li><a class="menu__item" href="${root}" ${raw(!current ? 'aria-current="page"' : '')}><span class="menu__num">HALL</span><span class="menu__name">The hall</span><span></span><span class="menu__desc">Start here.</span></a></li>
        ${rooms.map((r) => html`<li><a class="menu__item" href="${root}${r.slug}/" ${raw(current === r.slug ? 'aria-current="page"' : '')}><span class="menu__num">${r.number}</span><span class="menu__name">${r.name}</span><span></span><span class="menu__desc">${r.summary}</span></a></li>`)}
      </ul>
      <p class="menu__soon">More rooms are being built.</p>
    </div>
  </details>`;
}

export function layout({ title, description, root, bodyClass, rooms, current = null, room = null, rail = null, main, themeColor = '#14111c', image = null }) {
  const fullTitle = title === site.name ? `${site.name} — ${site.tagline}` : `${title} · ${site.name}`;
  const canonical = site.url ? `${site.url.replace(/\/$/, '')}/${current ? current + '/' : ''}` : null;
  return html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${fullTitle}</title>
<meta name="description" content="${description}">
<meta name="theme-color" content="${themeColor}">
<meta property="og:site_name" content="${site.name}">
<meta property="og:title" content="${fullTitle}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
${raw(canonical ? `<link rel="canonical" href="${canonical}"><meta property="og:url" content="${canonical}">` : '')}
${raw(image && site.url ? `<meta property="og:image" content="${site.url.replace(/\/$/, '')}/${image}"><meta name="twitter:card" content="summary_large_image">` : '')}
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="preload" href="${root}fonts/fraunces-latin-soft-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${root}fonts/figtree-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${root}assets/site.css?v=__CSSHASH__">
<script>document.documentElement.classList.add('js')</script>
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <div style="display:flex;align-items:center;min-width:0">
      <a class="brand" href="${root}" aria-label="${site.name} — the hall">${brandMark}<span>${site.name}</span></a>
      ${room ? html`<span class="crumb" aria-hidden="true"><b>Room ${room.number}</b> · ${room.name}</span>` : ''}
    </div>
    <div class="head-tools">${roomsMenu({ root, rooms, current })}</div>
  </div>
</header>
${rail ? html`<nav class="rail" aria-label="In this room"><ul class="rail__list">${rail.map((s) => html`<li><a href="#${s.id}">${s.label}</a></li>`)}</ul></nav>` : ''}
<main id="main" tabindex="-1">${main}</main>
<footer class="site-footer">
  <div class="wrap">
    <span>© ${site.year} ${site.name}</span>
    <span>${site.contact.email ? html`<a href="mailto:${site.contact.email}">${site.contact.email}</a>` : 'Made slowly, one room at a time.'}</span>
    ${current ? html`<a href="${root}">← Back to the hall</a>` : html`<span>${rooms.length} room open</span>`}
  </div>
</footer>
<script src="${root}assets/site.js?v=__JSHASH__" defer></script>
</body>
</html>`;
}
