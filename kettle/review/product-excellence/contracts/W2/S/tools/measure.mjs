// ---------- in-page measurement ----------
export function measureInPage({ PEEK, phase }) {
  const region = document.querySelector('[data-focus-view] [role=region]');
  if (!region) return { error: 'no summary region' };
  const sc = region.firstElementChild;
  const sheet = sc.firstElementChild;
  const footer = region.querySelector('footer');
  const cs = getComputedStyle(sc);
  const mask = cs.maskImage || cs.webkitMaskImage || '';
  const fade = +((/100% - (\d+(?:\.\d+)?)px/.exec(mask) || [])[1] ?? 0);
  const scR = sc.getBoundingClientRect();
  const fR = footer.getBoundingClientRect();
  const F = Math.min(fR.top, scR.bottom);
  const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const visibleText = (el) => {
    const c = el.cloneNode(true);
    c.querySelectorAll('.sr-only, svg, [aria-hidden="true"] svg').forEach((n) => n.remove());
    return norm(c.textContent);
  };
  // Text lines count by their ink (font metrics via canvas: the line box is ascent+descent; glyph ink sits inside it).
  const cv = document.createElement('canvas').getContext('2d');
  const ink = (el) => {
    const t = (el.textContent || '').trim();
    if (!t) return { top: 0, bottom: 0 };
    const c = getComputedStyle(el);
    cv.font = `${c.fontStyle} ${c.fontWeight} ${c.fontSize} ${c.fontFamily}`;
    const m = cv.measureText(t);
    return { top: Math.max(0, m.fontBoundingBoxAscent - m.actualBoundingBoxAscent), bottom: Math.max(0, m.fontBoundingBoxDescent - m.actualBoundingBoxDescent) };
  };
  const lineRects = (el) => {
    const k = ink(el);
    const r = document.createRange();
    r.selectNodeContents(el);
    const rs = [...r.getClientRects()].filter((x) => x.width > 0.5 && x.height > 0.5).sort((a, b2) => a.top - b2.top);
    const out = [];
    for (const x of rs) {
      const last = out.at(-1);
      if (last && x.top < last.bottom - Math.min(x.height, last.bottom - last.top) / 2) {
        last.top = Math.min(last.top, x.top); last.bottom = Math.max(last.bottom, x.bottom); last.left = Math.min(last.left, x.left); last.right = Math.max(last.right, x.right);
      } else out.push({ top: x.top, bottom: x.bottom, left: x.left, right: x.right });
    }
    return out.map((L) => ({ ...L, top: L.top + k.top, bottom: L.bottom - k.bottom, ink: true }));
  };
  const units = [];
  const add = (kind, el, rect) => {
    const R = rect ?? el.getBoundingClientRect();
    if (R.bottom - R.top < 1) return;
    units.push({ kind, el, text: visibleText(el).slice(0, 70), top: R.top, bottom: R.bottom, left: R.left, right: R.right, peek: R.ink ? 0 : PEEK });
  };
  const h1 = region.querySelector('h1');
  const sub = h1?.parentElement?.querySelector('p');
  if (h1) lineRects(h1).forEach((L, i) => add(`title-line${i}`, h1, L));
  if (sub) lineRects(sub).forEach((L, i) => add(`sub-line${i}`, sub, L));
  const task = region.querySelector('section[aria-label="Your task"]');
  if (task) { const p = task.querySelector('p'); if (p) add('task', p); const g = task.querySelector('[role=group]'); if (g) add('task-choices', g); }
  const unlock = [...region.querySelectorAll('section')].find((x) => /in your nook/.test(x.getAttribute('aria-label') || ''));
  if (unlock) {
    add('unlock-media', unlock.firstElementChild);
    const h2 = unlock.querySelector('h2'); if (h2) lineRects(h2).forEach((L, i) => add(`unlock-title-line${i}`, h2, L));
    const up = unlock.querySelector('h2 + p'); if (up) lineRects(up).forEach((L, i) => add(`unlock-sub-line${i}`, up, L));
  }
  const setup = [...region.querySelectorAll('section')].find((x) => /Make Kettle yours/.test(x.textContent || ''));
  if (setup) add('setup', setup);
  const lis = [...region.querySelectorAll('[aria-label="Rewards"] > li')];
  lis.forEach((li, i) => add(`reward${i}${li.dataset.highlight != null ? '-highlight' : ''}`, li));
  const toggle = [...region.querySelectorAll('button')].find((x) => /How your leaves added up/.test(x.textContent || ''));
  if (toggle) add('details-toggle', toggle);
  const body = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
  if (body && !body.hidden) [...body.querySelectorAll('li, div, p')].filter((x) => x.children.length < 4 && norm(x.textContent)).forEach((x, i) => add(`details${i}`, x));
  // status per unit
  const st = (u) => {
    if (u.bottom <= scR.top + 0.5) return 'above';
    if (u.top < scR.top - 0.5) return 'cut-top';
    if (u.top >= F - u.peek - 0.5) return 'below';
    if (u.bottom <= F - fade + 0.5 && u.top >= scR.top - 0.5) return 'clear';
    return 'cut';
  };
  // occlusion: the centre of every clear unit hits the unit itself
  const occl = [];
  for (const u of units) {
    u.status = st(u);
    if (u.status !== 'clear') continue;
    const x = Math.min(u.right - 2, Math.max(u.left + 2, (u.left + u.right) / 2));
    const y = (u.top + u.bottom) / 2;
    const hit = document.elementFromPoint(x, y);
    if (!hit || !(u.el === hit || u.el.contains(hit) || (hit.contains(u.el) && hit !== document.body && region.contains(hit)))) occl.push({ kind: u.kind, at: [Math.round(x), Math.round(y)], hit: hit ? `${hit.tagName}.${(hit.className && hit.className.baseVal == null ? hit.className : '') || ''}`.slice(0, 60) : null });
  }
  // pairwise overlap of reward boxes and other blocks (same scroll layer)
  const boxes = units.filter((u) => !/line\d|details\d/.test(u.kind));
  const overlaps = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], c = boxes[j];
    if (a.el.contains(c.el) || c.el.contains(a.el)) continue;
    const ix = Math.min(a.right, c.right) - Math.max(a.left, c.left), iy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
    if (ix > 0.5 && iy > 0.5) overlaps.push([a.kind, c.kind, Math.round(ix), Math.round(iy)]);
  }
  // footer controls: hit-testable and inside the viewport
  const fbtn = [...footer.querySelectorAll('button')].map((x) => {
    const r = x.getBoundingClientRect();
    const hit = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
    return { name: norm(x.textContent), box: [r.left, r.top, r.width, r.height].map(Math.round), hit: !!hit && x.contains(hit), inView: r.top >= 0 && r.bottom <= innerHeight + 0.5 };
  });
  // Chai on the stage
  const chai = document.querySelector('[data-focus-view] [data-pose]');
  const cR = chai?.getBoundingClientRect();
  const sR = sheet.getBoundingClientRect();
  const chaiShown = cR ? Math.max(0, Math.min(cR.bottom, sR.left > cR.right || sR.right < cR.left ? cR.bottom : sR.top) - Math.max(cR.top, 0)) / cR.height : null;
  // toasts present?
  const toasts = [...document.querySelectorAll('[role=status], [data-toast], [class*=toast i]')].filter((x) => { const r = x.getBoundingClientRect(); return r.width > 4 && r.height > 4 && norm(x.textContent) && !region.contains(x); }).map((x) => norm(x.textContent).slice(0, 60));
  // facts: everything the summary says (visible text), for the reachability diff
  const facts = [];
  if (h1) facts.push(norm(h1.textContent));
  if (sub) facts.push(norm(sub.textContent));
  if (unlock) { const h2 = unlock.querySelector('h2'); if (h2) facts.push(norm(h2.textContent)); const up = unlock.querySelector('h2 + p'); if (up) facts.push(visibleText(up)); }
  lis.forEach((li) => facts.push(visibleText(li)));
  if (body && !body.hidden) {
    body.querySelectorAll('li').forEach((li) => facts.push(visibleText(li)));
    [...body.children].filter((x) => x.tagName !== 'UL').forEach((x) => { const t = visibleText(x); if (t) facts.push(t); });
  }
  const last = units.filter((u) => u.status !== 'above').at(-1);
  return {
    phase,
    vw: innerWidth, vh: innerHeight,
    scroll: { top: Math.round(sc.scrollTop), max: sc.scrollHeight - sc.clientHeight, clientH: sc.clientHeight, rect: [scR.left, scR.top, scR.width, scR.height].map(Math.round) },
    sheetTop: Math.round(sR.top), footerTop: Math.round(fR.top), F: Math.round(F), fade,
    units: units.map(({ el, ...u }) => ({ ...u, top: Math.round(u.top), bottom: Math.round(u.bottom) })),
    cut: units.filter((u) => u.status === 'cut').map((u) => ({ kind: u.kind, text: u.text, top: Math.round(u.top), bottom: Math.round(u.bottom), F: Math.round(F), fade })),
    occluded: occl, overlaps, footerButtons: fbtn,
    chai: cR ? { box: [cR.left, cR.top, cR.width, cR.height].map(Math.round), shownAboveSheet: chaiShown == null ? null : Math.round(chaiShown * 100) / 100 } : null,
    toasts, facts,
    lastUnit: last ? { kind: last.kind, text: last.text, top: Math.round(last.top), bottom: Math.round(last.bottom), status: last.status } : null,
  };
}

