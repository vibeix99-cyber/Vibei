// Reusable room building blocks. A room module composes these (or writes its own HTML + CSS).
import { html, raw } from '../lib/html.mjs';
import { img } from '../lib/images.mjs';

export const sectionHead = ({ kicker, title, lede }) => html`<div class="section__head">
  ${kicker ? html`<p class="kicker" data-reveal>${kicker}</p>` : ''}
  <h2 class="display" data-reveal style="--d:60ms">${title}</h2>
  ${lede ? html`<p class="lede" data-reveal style="--d:120ms">${lede}</p>` : ''}
</div>`;

/** Step-by-step tour with real screenshots. Works as a plain list without JS; JS upgrades it to tabs. */
export function tour({ root, id, label, steps }) {
  return html`<div class="tour" data-tour aria-label="${label}">
    <div class="tour__tabs" role="tablist" aria-label="${label}"></div>
    <ol class="tour__steps" role="list">
      ${steps.map((s, i) => html`<li class="step ${i === 0 ? 'is-active' : ''}" id="${id}-${i + 1}" data-step-title="${s.title}">
        <div class="step__copy">
          <p class="step__n">STEP ${i + 1}</p>
          <h3 class="display">${s.title}</h3>
          <p>${s.body}</p>
          ${s.note ? html`<p class="step__note">${s.note}</p>` : ''}
        </div>
        <div class="phone ${s.dark ? 'phone--dark' : ''}">${img(root, s.image, { alt: s.alt, sizes: '(max-width: 600px) 78vw, 320px', eager: i === 0 })}</div>
      </li>`)}
    </ol>
  </div>`;
}

/** Grid of cropped screenshot tiles. */
export function tiles({ root, items }) {
  return html`<div class="tiles">${items.map((t, i) => html`<article class="tile" data-reveal style="--d:${(i % 3) * 70}ms">
    <div class="tile__pic" style="--pos:${t.pos ?? '50% 0%'};--zoom:${t.zoom ?? 1}">${img(root, t.image, { alt: t.alt, sizes: '(min-width: 960px) 360px, (min-width: 620px) 45vw, 92vw' })}</div>
    <div class="tile__body"><h3 class="display">${t.title}</h3><p>${t.body}</p></div>
  </article>`)}</div>`;
}

/** Scene switcher: radio groups swap between pre-rendered real captures. Default image renders without JS. */
export function scene({ root, id, groups, images, initial, alt, caption }) {
  // images: map "a|b" -> image name ; groups: [{name,label,options:[{value,label}]}]
  const key = (v) => Object.values(v).join('|');
  return html`<div class="scene" data-scene='${JSON.stringify({ groups: groups.map((g) => g.name), initial })}'>
    <div class="scene__controls">
      ${groups.map((g) => html`<fieldset class="seg"><legend>${g.label}</legend><div class="seg__row js-only">
        ${g.options.map((o) => html`<label><input type="radio" name="${id}-${g.name}" value="${o.value}" ${raw(initial[g.name] === o.value ? 'checked' : '')}><span>${o.label}</span></label>`)}
      </div></fieldset>`)}
      <p class="scene__cap">${caption}</p>
    </div>
    <div class="scene__stage">
      ${Object.entries(images).map(([k, name]) => img(root, name, { alt: k === key(initial) ? alt : '', sizes: '(min-width: 900px) 62vw, 92vw', cls: k === key(initial) ? 'is-on' : '', attrs: `data-key="${k}"` }))}
    </div>
  </div>`;
}

/** Leaving the room: back to the hall, live demo only if intentionally public, next room. */
export function exit({ root, room, rooms }) {
  const idx = rooms.findIndex((r) => r.slug === room.slug);
  const next = rooms[idx + 1];
  return html`<section class="exit" id="visit" aria-labelledby="exit-title">
    <div class="wrap exit__grid">
      <div>
        <h2 id="exit-title" class="display">${room.demo?.public ? `${room.name} is open to visit.` : `${room.name} is in private preview.`}</h2>
        <p style="margin-top:14px">${room.demo?.public ? room.demo.note : room.privateNote}</p>
      </div>
      <div class="exit__actions">
        ${room.demo?.public ? html`<a class="btn" href="${room.demo.url}" rel="noopener">Try ${room.name} <span class="arrow" aria-hidden="true">↗</span></a>` : ''}
        <a class="btn ${room.demo?.public ? 'btn--ghost' : ''}" href="${root}">Back to the hall</a>
        ${next ? html`<a class="btn btn--ghost" href="${root}${next.slug}/">Next: ${next.name} →</a>` : ''}
      </div>
    </div>
  </section>`;
}
