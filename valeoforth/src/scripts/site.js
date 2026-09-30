/* Valeoforth — progressive enhancement only. Every page is fully usable without this file. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Rooms menu: Esc + outside click close it (it is a native <details>, so it works without this) */
  const menus = $$('[data-menu]');
  if (menus.length) {
    addEventListener('keydown', (e) => { if (e.key === 'Escape') menus.forEach((m) => { if (m.open) { m.open = false; $('summary', m).focus(); } }); });
    addEventListener('click', (e) => menus.forEach((m) => { if (m.open && !m.contains(e.target)) m.open = false; }));
  }

  /* Reveal on scroll */
  const rev = $$('[data-reveal]');
  if (rev.length) {
    if (reduce || !('IntersectionObserver' in window)) rev.forEach((el) => el.classList.add('is-in'));
    else {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      rev.forEach((el) => io.observe(el));
      // anything already above the fold on load
      requestAnimationFrame(() => rev.forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('is-in'); }));
    }
  }

  /* Doorway: gentle pointer parallax (fine pointers only) */
  const hall = $('[data-hallway]');
  if (hall && !reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const door = $('.door', hall);
    addEventListener('pointermove', (e) => {
      const x = (e.clientX / innerWidth - 0.5), y = (e.clientY / innerHeight - 0.5);
      door.style.setProperty('--px', `${(-x * 14).toFixed(1)}px`);
      door.style.setProperty('--py', `${(-y * 10).toFixed(1)}px`);
    }, { passive: true });
  }

  /* Tour: list -> tabs */
  $$('[data-tour]').forEach((tour) => {
    const steps = $$('.step', tour); const tabs = $('.tour__tabs', tour);
    if (!steps.length || !tabs) return;
    const btns = steps.map((step, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tour__tab'; b.setAttribute('role', 'tab'); b.id = `${step.id}-tab`;
      b.setAttribute('aria-controls', step.id);
      b.innerHTML = `<i aria-hidden="true">${i + 1}</i><span></span>`; $('span', b).textContent = step.dataset.stepTitle;
      step.setAttribute('role', 'tabpanel'); step.setAttribute('aria-labelledby', b.id);
      tabs.appendChild(b); return b;
    });
    const show = (i, focus) => {
      steps.forEach((s, j) => s.classList.toggle('is-active', i === j));
      btns.forEach((b, j) => { b.setAttribute('aria-selected', String(i === j)); b.tabIndex = i === j ? 0 : -1; });
      if (focus) btns[i].focus();
      if (focus !== undefined && tabs.scrollWidth > tabs.clientWidth) { // only after a user action; scroll the strip itself, never the page
        const b = btns[i]; tabs.scrollTo({ left: b.offsetLeft - (tabs.clientWidth - b.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
      }
    };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => show(i, false));
      b.addEventListener('keydown', (e) => {
        const v = tabs.scrollWidth <= tabs.clientWidth || getComputedStyle(tabs).flexDirection === 'column';
        const next = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (next) { e.preventDefault(); show((i + next + btns.length) % btns.length, true); }
        else if (e.key === 'Home') { e.preventDefault(); show(0, true); }
        else if (e.key === 'End') { e.preventDefault(); show(btns.length - 1, true); }
      });
    });
    tabs.setAttribute('aria-orientation', 'horizontal');
    tour.setAttribute('data-ready', ''); show(0);
  });

  /* Scene switcher (nook light + window) */
  $$('[data-scene]').forEach((sc) => {
    const cfg = JSON.parse(sc.dataset.scene); const imgs = $$('.scene__stage img', sc);
    const pick = () => {
      const key = cfg.groups.map((g) => { const c = $(`input[name$="-${g}"]:checked`, sc); return c ? c.value : ''; }).join('|');
      imgs.forEach((im) => { const on = im.dataset.key === key; im.classList.toggle('is-on', on); im.loading = 'eager'; if (on) im.alt = sc.dataset.alt || im.alt; });
      const alt = imgs.find((im) => im.alt)?.alt; imgs.forEach((im) => { im.alt = im.classList.contains('is-on') ? (alt || '') : ''; });
    };
    $$('input', sc).forEach((i) => i.addEventListener('change', pick));
    // warm the rest once the visitor gets near
    const io = 'IntersectionObserver' in window && new IntersectionObserver((es) => { if (es[0].isIntersecting) { imgs.forEach((im) => { im.loading = 'eager'; }); io.disconnect(); } }, { rootMargin: '400px' });
    if (io) io.observe(sc);
  });

  /* Chai pose picker */
  const chai = $('[data-chai]');
  if (chai) {
    const big = $('[data-chai-big]', chai), name = $('[data-chai-name]', chai), desc = $('[data-chai-desc]', chai);
    $$('.chai__pose', chai).forEach((b) => b.addEventListener('click', () => {
      $$('.chai__pose', chai).forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      big.src = b.querySelector('img').src; big.alt = `Chai the capybara, ${b.dataset.name.toLowerCase()} pose`;
      name.textContent = b.dataset.name; desc.textContent = b.dataset.desc;
    }));
  }

  /* Rail scrollspy */
  const links = $$('.rail__list a');
  if (links.length && 'IntersectionObserver' in window) {
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const secs = [...map.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    const rail = $('.rail__list');
    const set = (id) => links.forEach((a) => {
      const on = a === map.get(id); on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
      if (on && rail.scrollWidth > rail.clientWidth && scrollY > 200) rail.scrollTo({ left: a.offsetLeft - (rail.clientWidth - a.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' }); // move the rail only, never the page
    });
    const io = new IntersectionObserver((es) => { const v = es.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]; if (v) set(v.target.id); }, { rootMargin: '-25% 0px -60% 0px', threshold: [0, 0.1, 0.5, 1] });
    secs.forEach((s) => io.observe(s));
  }
})();
