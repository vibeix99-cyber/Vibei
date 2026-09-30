import { html, raw } from '../lib/html.mjs';
import { img } from '../lib/images.mjs';
import { site } from '../site.mjs';
import { layout } from './layout.mjs';

export function renderHome({ rooms }) {
  const root = './';
  const first = rooms[0];
  const main = html`
  <section class="threshold" aria-labelledby="hall-title">
    <div class="wrap threshold__grid">
      <div class="threshold__title">
        <p class="kicker" data-reveal>The hall</p>
        <h1 id="hall-title" class="display" data-reveal style="--d:60ms">Valeo<em>forth</em></h1>
        <p class="lede" data-reveal style="--d:140ms">${site.tagline} Each project gets its own room, with its own light. One door is open.</p>
      </div>
      <p class="threshold__cta" data-reveal style="--d:220ms">
        <a class="btn" href="${root}${first.slug}/">Come in — ${first.name} <span class="arrow" aria-hidden="true">→</span></a>
        <span class="hint">More rooms are being built.</span>
      </p>
      <div class="hallway" data-hallway>
        <span class="ghost ghost--r" aria-hidden="true"><span class="ghost__plate">Room 02 · being built</span></span>
        <a class="door" href="${root}${first.slug}/" tabindex="-1" aria-hidden="true" data-door>
          <span class="door__spill"></span>
          <span class="door__frame">
            <span class="door__view">${img(root, first.doorImage, { alt: '', sizes: '(min-width: 900px) 420px, 60vw', eager: true })}</span>
            <span class="door__leaf"></span>
          </span>
          <span class="door__plate"><small>Room ${first.number}</small><strong>${first.name}</strong><span>${first.summaryShort}</span></span>
        </a>
      </div>
    </div>
  </section>
  <section class="house" aria-labelledby="house-title">
    <div class="wrap house__grid">
      <div>
        <p class="kicker">The house so far</p>
        <h2 id="house-title" class="display" style="margin-top:14px">Small, made things, each in its own room.</h2>
        <p style="margin-top:18px">Valeoforth is where I keep the projects I build. A room isn’t a portfolio card: it’s a place to look around, see the real thing, and find out how it was made. I’m starting with one.</p>
      </div>
      <div>
        <ol class="house__list" role="list">
          ${rooms.map((r) => html`<li><a class="house__row" href="${root}${r.slug}/"><span class="house__num">${r.number}</span><span class="house__name">${r.name}</span><span class="house__status">${r.statusShort}</span><span class="house__sum">${r.summary}</span></a></li>`)}
          <li class="house__soon">Next door: still being built.</li>
        </ol>
      </div>
    </div>
  </section>`;
  return layout({ title: site.name, description: site.description, root, bodyClass: 'hall', rooms, main, image: 'img/og.png' });
}

export function render404({ rooms }) {
  const main = html`<section class="threshold"><div class="wrap"><div class="threshold__title">
    <p class="kicker">Wrong turn</p>
    <h1 class="display">That door isn’t built yet.</h1>
    <p class="lede">Nothing lives at this address. The hall is the way back — and the open door is just off it.</p>
    <p style="margin-top:8px"><a class="btn" href="./">Back to the hall <span class="arrow" aria-hidden="true">→</span></a></p>
  </div></div></section>`;
  return layout({ title: 'Not found', description: 'Page not found.', root: './', bodyClass: 'hall', rooms, main });
}
