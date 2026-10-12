// Fighter Dex. A reference you would actually open mid-game: search and filter
// on the left, the fighter itself alive in 3D in the middle, and everything the
// engine knows about it on the right.

import { audio } from '../../audio/audio.js';
import { allFighters, getFighter } from '../../data/fighters.js';
import { getMove } from '../../data/moves.js';
import { ABILITIES } from '../../core/abilities.js';
import { TYPES, TYPE_COLOR, TYPE_ICON, typeEff } from '../../core/types.js';
import { computeStats, baseStatTotal, STAT_KEYS, defaultIVs, defaultEVs } from '../../core/stats.js';
import { fighterRecord } from '../../meta/progression.js';
import * as Save from '../../meta/save.js';
import {
  shell, injectScreenCss, el, esc, button, typeBadge, typeBadges, statBar, tierTag,
  StageCast, portrait, toast
} from './common.js';

const CSS = `
.gx.dexroot{ background:
  radial-gradient(closest-side at 50% 52%, rgba(4,6,12,0) 34%, rgba(4,6,12,.55) 78%, rgba(4,6,12,.86) 100%),
  linear-gradient(180deg, rgba(4,6,12,.55), rgba(4,6,12,.20) 40%, rgba(4,6,12,.75)); }
.dex-grid{ display:grid; gap:14px; grid-template-columns:330px minmax(0,1fr) 400px; height:100%; align-items:stretch; }
.dex-rail{ display:flex; flex-direction:column; gap:10px; min-height:0; }
.dex-list{ flex:1 1 auto; overflow:auto; display:flex; flex-direction:column; gap:7px; padding-right:3px; }
.dex-stage{ position:relative; min-height:220px; display:flex; flex-direction:column; justify-content:flex-end;
  align-items:center; padding-bottom:8px; pointer-events:none; }
.dex-cap{ text-align:center; text-shadow:0 3px 0 #000, 0 6px 18px rgba(0,0,0,.8); }
.dex-cap .n{ font-family:var(--font-display); font-size:clamp(26px,3.6vw,46px); color:#fff; line-height:1; }
.dex-cap .e{ font-size:13px; color:var(--gold); letter-spacing:.2em; text-transform:uppercase; margin-top:5px; }
.dex-cap .tt{ display:flex; gap:6px; justify-content:center; margin-top:9px; }
.dex-info{ overflow:auto; display:flex; flex-direction:column; gap:12px; min-height:0; padding-right:3px; }
.drow{ display:flex; align-items:center; gap:9px; padding:6px 8px; border-radius:11px; cursor:pointer;
  border:2px solid transparent; background:rgba(255,255,255,.035); text-align:left; width:100%; font-family:inherit; color:inherit; }
.drow:hover{ background:rgba(255,255,255,.08); }
.drow.on{ background:linear-gradient(90deg, rgba(242,201,76,.24), rgba(242,201,76,.05)); border-color:var(--gold); }
.drow .n{ font-weight:800; font-size:14.5px; }
.drow .s{ font-size:10.5px; color:#8e9ab8; letter-spacing:.06em; text-transform:uppercase; }
.drow .r{ margin-left:auto; text-align:right; font-size:11px; color:#8e9ab8; font-variant-numeric:tabular-nums; }
.eff-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(58px,1fr)); gap:4px; }
.eff{ display:flex; flex-direction:column; align-items:center; gap:1px; padding:4px 2px; border-radius:7px;
  border:2px solid #000; font-size:9px; font-weight:900; letter-spacing:.04em; }
.eff .m{ font-size:11px; }
.lset{ display:flex; flex-direction:column; gap:3px; }
.lmove{ display:grid; grid-template-columns:30px 1fr auto auto; gap:8px; align-items:center;
  padding:5px 7px; border-radius:8px; background:rgba(255,255,255,.04); font-size:12.5px; }
.lmove.sig{ background:linear-gradient(90deg, rgba(242,201,76,.22), rgba(255,255,255,.03)); }
.lmove .lv{ color:#8e9ab8; font-weight:800; font-variant-numeric:tabular-nums; font-size:11px; }
.lmove .nm{ font-weight:700; display:flex; align-items:center; gap:6px; min-width:0; }
.lmove .nm span.t{ font-size:9px; padding:1px 5px; border-radius:4px; color:#0b0d14; font-weight:900; }
.lmove .pw{ color:#cfd8ea; font-variant-numeric:tabular-nums; font-size:11.5px; }
.lmove .cat{ font-size:9px; letter-spacing:.08em; color:#8e9ab8; text-transform:uppercase; }
.abil{ padding:8px 10px; border-radius:10px; background:rgba(255,255,255,.045); margin-bottom:6px; }
.abil b{ display:block; font-size:13.5px; }
.abil .tagx{ font-size:9px; letter-spacing:.1em; color:var(--gold); text-transform:uppercase; }
.abil p{ margin:3px 0 0; font-size:12.5px; color:#a9b4cc; line-height:1.4; }
.dex-back{ display:none; }
@media (max-width:1100px){
  .dex-grid{ grid-template-columns:300px minmax(0,1fr); }
  .dex-info{ grid-column:1 / -1; max-height:none; }
}
@media (max-width:840px){
  .gx.dexroot{ background:linear-gradient(180deg, rgba(4,6,12,.35) 0%, rgba(4,6,12,.15) 22%, rgba(4,6,12,.93) 46%, rgba(4,6,12,.98) 100%); }
  .dex-grid{ grid-template-columns:1fr; height:auto; }
  .dex-rail{ min-height:0; }
  .dex-list{ max-height:none; overflow:visible; }
  .dex-stage{ min-height:32vh; }
  .dexroot.detail .dex-rail{ display:none; }
  .dexroot.detail .dex-back{ display:inline-flex; }
  .dexroot:not(.detail) .dex-stage, .dexroot:not(.detail) .dex-info{ display:none; }
}
`;

const CAT_ICON = { physical: '✊', special: '✨', status: '◆' };

export class DexScreen {
  constructor(app) { this.app = app; }

  mount(root, params = {}) {
    injectScreenCss();
    if (!document.getElementById('dex-css')) {
      const s = document.createElement('style'); s.id = 'dex-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    this.root = root;
    this.t = 0;
    this.filters = { q: '', types: new Set(), tiers: new Set(), sort: 'dex' };
    this.selected = params.fighter || allFighters()[0]?.id;
    this.detailMode = false;

    const sh = shell(root, {
      title: 'Fighter Dex',
      sub: `${allFighters().length} fighters · every learnset, matchup and ability`,
      onBack: () => this.back()
    });
    this.sh = sh;
    sh.root.classList.add('dexroot');
    sh.body.style.paddingBottom = '18px';
    sh.body.style.height = '100%';
    sh.body.style.overflow = 'hidden';

    const grid = el('div', 'dex-grid');
    sh.body.appendChild(grid);

    /* rail */
    const rail = el('div', 'dex-rail pane tight');
    const search = el('div', 'search');
    const input = el('input');
    input.type = 'search';
    input.placeholder = 'Search name, type, ability…';
    input.oninput = () => { this.filters.q = input.value.toLowerCase(); this.drawList(); };
    search.append(el('span', null, '🔍'), input);
    rail.appendChild(search);

    const typeRow = el('div', 'chiprow');
    typeRow.style.maxHeight = '84px';
    typeRow.style.overflow = 'auto';
    for (const t of TYPES) {
      const c = el('button', 'chip sm tt', `${TYPE_ICON[t]} ${t}`);
      c.style.borderColor = '#000';
      c.onclick = () => {
        audio.sfx('ui_move');
        if (this.filters.types.has(t)) { this.filters.types.delete(t); c.classList.remove('on'); c.style.background = ''; c.style.color = ''; }
        else { this.filters.types.add(t); c.classList.add('on'); c.style.background = TYPE_COLOR[t]; c.style.color = '#0b0d14'; }
        this.drawList();
      };
      typeRow.appendChild(c);
    }
    rail.appendChild(typeRow);

    const bottomRow = el('div', 'chiprow');
    for (const tier of ['S', 'A', 'B', 'C']) {
      const c = el('button', 'chip sm', tier);
      c.onclick = () => {
        audio.sfx('ui_move');
        if (this.filters.tiers.has(tier)) this.filters.tiers.delete(tier); else this.filters.tiers.add(tier);
        c.classList.toggle('on');
        this.drawList();
      };
      bottomRow.appendChild(c);
    }
    const sort = el('select', 'gsel');
    for (const [v, label] of [['dex', 'Dex order'], ['name', 'A–Z'], ['bst', 'Total ↓'],
      ['atk', 'Attack ↓'], ['spa', 'Sp. Atk ↓'], ['spe', 'Speed ↓'], ['hp', 'HP ↓'], ['used', 'Most used']]) {
      sort.appendChild(Object.assign(el('option', null, label), { value: v }));
    }
    sort.onchange = () => { this.filters.sort = sort.value; this.drawList(); };
    bottomRow.appendChild(sort);
    rail.appendChild(bottomRow);

    this.count = el('div', 'mut');
    this.count.style.fontSize = '11px';
    rail.appendChild(this.count);

    this.list = el('div', 'dex-list');
    rail.appendChild(this.list);
    grid.appendChild(rail);

    /* stage caption */
    this.stageZone = el('div', 'dex-stage');
    this.cap = el('div', 'dex-cap');
    this.stageZone.appendChild(this.cap);
    grid.appendChild(this.stageZone);

    /* info column */
    this.info = el('div', 'dex-info');
    grid.appendChild(this.info);

    const backBtn = button('← All fighters', 'btn sm ghost dex-back', () => {
      this.detailMode = false;
      sh.root.classList.remove('detail');
    });
    sh.actions.appendChild(backBtn);

    this.app.stage.buildArena('marineford');
    this.app.view?.reset?.();
    this.app.plates?.forEach?.((p) => p.hide());
    this.app.textbox?.hide?.();
    this.cast = new StageCast(this.app);
    audio.startMusic('title');
    audio.setIntensity(0.22);

    this.drawList();
    this.select(this.selected, false);
  }

  back() { this.app.router.go('title'); }

  visible() {
    const f = this.filters;
    let list = allFighters().slice();
    if (f.q) {
      list = list.filter((x) => {
        const hay = [x.name, x.epithet, x.origin, x.tier, ...x.types,
          ...x.abilities.map((a) => ABILITIES[a]?.name || a),
          ...x.learnset.map((l) => getMove(l.move)?.name || '')].join(' ').toLowerCase();
        return hay.includes(f.q);
      });
    }
    if (f.types.size) list = list.filter((x) => x.types.some((t) => f.types.has(t)));
    if (f.tiers.size) list = list.filter((x) => f.tiers.has(x.tier));
    const save = Save.data();
    const by = {
      name: (a, b) => a.name.localeCompare(b.name),
      bst: (a, b) => baseStatTotal(b.base) - baseStatTotal(a.base),
      atk: (a, b) => b.base.atk - a.base.atk,
      spa: (a, b) => b.base.spa - a.base.spa,
      spe: (a, b) => b.base.spe - a.base.spe,
      hp: (a, b) => b.base.hp - a.base.hp,
      used: (a, b) => fighterRecord(b.id, save).battles - fighterRecord(a.id, save).battles
    }[f.sort];
    if (by) list.sort(by);
    return list;
  }

  drawList() {
    const list = this.visible();
    this.list.innerHTML = '';
    this.count.textContent = `${list.length} of ${allFighters().length} shown`;
    if (!list.length) {
      this.list.appendChild(el('div', 'empty', 'Nothing matches those filters.'));
      return;
    }
    const save = Save.data();
    for (const f of list) {
      const row = el('button', `drow ${f.id === this.selected ? 'on' : ''}`);
      row.type = 'button';
      row.appendChild(portrait(f.id, 'sm'));
      const meta = el('div');
      meta.appendChild(el('div', 'n', esc(f.name)));
      meta.appendChild(el('div', 's', esc(f.epithet)));
      row.appendChild(meta);
      const r = el('div', 'r');
      const rec = fighterRecord(f.id, save);
      r.innerHTML = `<div>${baseStatTotal(f.base)}</div>${rec.battles ? `<div style="font-size:10px">${rec.battles} used</div>` : ''}`;
      row.appendChild(r);
      row.onclick = () => { audio.sfx('ui_move'); this.select(f.id, true); };
      this.list.appendChild(row);
    }
  }

  select(id, isDetail) {
    const f = getFighter(id);
    if (!f) return;
    this.selected = id;
    if (isDetail) { this.detailMode = true; this.sh.root.classList.add('detail'); }
    [...this.list.children].forEach((c) => c.classList?.remove('on'));
    const idx = this.visible().findIndex((x) => x.id === id);
    if (idx >= 0) this.list.children[idx]?.classList?.add('on');

    // caption
    this.cap.innerHTML = `<div class="n">${esc(f.name)}</div><div class="e">${esc(f.epithet)}</div>`;
    const tt = el('div', 'tt');
    for (const t of f.types) tt.appendChild(typeBadge(t));
    tt.appendChild(tierTag(f.tier));
    this.cap.appendChild(tt);

    // live model
    this.cast.set([{ id, x: 0, z: 0, rotY: 0, state: 'ready' }]);
    this.modelH = f.model?.height || 1.8;
    this.t = 0;

    this.drawInfo(f);
    this.info.scrollTop = 0;
  }

  drawInfo(f) {
    const info = this.info;
    info.innerHTML = '';
    const save = Save.data();

    /* dex flavour */
    const flav = el('div', 'pane tight');
    flav.appendChild(el('h3', null, `No. ${String(allFighters().indexOf(f) + 1).padStart(3, '0')} · ${esc(f.origin)}`));
    flav.appendChild(el('p', 'lede', esc(f.dex)));
    flav.querySelector('p').style.margin = '0';
    info.appendChild(flav);

    /* stats */
    const sp = el('div', 'pane tight');
    sp.appendChild(el('h3', null, 'Base stats'));
    const bst = baseStatTotal(f.base);
    for (const k of STAT_KEYS) sp.appendChild(statBar(k, f.base[k], 150));
    const lv50 = computeStats(f.base, 50, defaultIVs(), defaultEVs(), 'hardy');
    sp.appendChild(el('div', 'kv', `
      <span class="k">Total</span><span>${bst}</span>
      <span class="k">At Lv50, no training</span><span>${STAT_KEYS.map((k) => `${k.toUpperCase()} ${lv50[k]}`).join(' · ')}</span>`));
    sp.querySelector('.kv').style.marginTop = '8px';
    sp.querySelector('.kv').style.fontSize = '11.5px';
    info.appendChild(sp);

    /* matchups */
    const mp = el('div', 'pane tight');
    mp.appendChild(el('h3', null, 'Taking damage'));
    const buckets = { 4: [], 2: [], 0.5: [], 0.25: [], 0: [] };
    for (const t of TYPES) {
      const e = typeEff(t, f.types);
      if (buckets[e]) buckets[e].push(t);
    }
    const bucketRow = (label, list, color, text) => {
      if (!list.length) return;
      mp.appendChild(el('h4', null, label));
      const g = el('div', 'eff-grid');
      for (const t of list) {
        const c = el('div', 'eff');
        c.style.background = TYPE_COLOR[t];
        c.style.color = '#0b0d14';
        c.innerHTML = `<span>${TYPE_ICON[t]}</span><span>${t}</span><span class="m">${text}</span>`;
        g.appendChild(c);
      }
      mp.appendChild(g);
    };
    bucketRow('Quadruple damage', buckets[4], null, '4×');
    bucketRow('Double damage', buckets[2], null, '2×');
    bucketRow('Halved', buckets[0.5], null, '½×');
    bucketRow('Quartered', buckets[0.25], null, '¼×');
    bucketRow('No effect', buckets[0], null, '0×');
    if (!Object.values(buckets).some((b) => b.length)) mp.appendChild(el('p', 'mut', 'Perfectly neutral to everything.'));
    info.appendChild(mp);

    /* abilities */
    const ap = el('div', 'pane tight');
    ap.appendChild(el('h3', null, 'Abilities'));
    f.abilities.forEach((id, i) => {
      const a = ABILITIES[id];
      const box = el('div', 'abil');
      box.innerHTML = `<span class="tagx">${i === 0 ? 'Common' : 'Rare'}</span>
        <b>${esc(a?.name || id)}</b><p>${esc(a?.desc || 'No description.')}</p>`;
      ap.appendChild(box);
    });
    info.appendChild(ap);

    /* learnset */
    const lp = el('div', 'pane tight');
    lp.appendChild(el('h3', null, 'Learnset'));
    const lset = el('div', 'lset');
    for (const l of [...f.learnset].sort((a, b) => a.lv - b.lv)) {
      const mv = getMove(l.move);
      const row = el('div', `lmove ${f.signature === l.move ? 'sig' : ''}`);
      row.innerHTML = `
        <span class="lv">${l.lv === 1 ? '—' : l.lv}</span>
        <span class="nm">${esc(mv?.name || l.move)}
          ${mv ? `<span class="t" style="background:${TYPE_COLOR[mv.type] || '#888'}">${mv.type}</span>` : ''}
          ${f.signature === l.move ? '<span class="tagx" style="color:var(--gold);font-size:9px">SIGNATURE</span>' : ''}</span>
        <span class="pw">${mv?.power ? mv.power : '—'}</span>
        <span class="cat">${CAT_ICON[mv?.category] || ''} ${mv?.category?.slice(0, 4) || ''}</span>`;
      if (mv) row.title = `${mv.desc || ''}${mv.accuracy === null ? ' · never misses' : ` · ${mv.accuracy}% acc`} · ${mv.pp} PP`;
      lset.appendChild(row);
    }
    lp.appendChild(lset);
    info.appendChild(lp);

    /* awakening + record */
    const xp = el('div', 'pane tight');
    xp.appendChild(el('h3', null, 'Awakening'));
    if (f.awaken) {
      const into = getFighter(f.awaken.into);
      xp.appendChild(el('p', 'mut', `Awakens into ${esc(into?.name || f.awaken.into)} at level ${f.awaken.at}.`));
    } else {
      xp.appendChild(el('p', 'mut', 'No known awakening. This is the final form.'));
    }
    const rec = fighterRecord(f.id, save);
    xp.appendChild(el('h4', null, 'Your record'));
    xp.appendChild(el('div', 'kv', `
      <span class="k">Battles</span><span>${rec.battles}</span>
      <span class="k">Wins</span><span>${rec.wins}</span>
      <span class="k">Knockouts</span><span>${rec.kos}</span>
      <span class="k">Damage dealt</span><span>${rec.damage}</span>
      <span class="k">Times fallen</span><span>${rec.faints}</span>
      <span class="k">Faced as a foe</span><span>${rec.seen}</span>`));
    info.appendChild(xp);

    /* actions */
    const act = el('div', 'pane tight');
    act.style.display = 'flex';
    act.style.gap = '8px';
    act.style.flexWrap = 'wrap';
    act.appendChild(button('Add to a team', 'btn sm primary', () => {
      this.app.router.go('teambuilder', { add: f.id });
    }));
    act.appendChild(button('Fight this one', 'btn sm', () => {
      this.app.router.go('battle', {
        mode: 'ai', aiLevel: 'ace', teamSize: 1,
        p1Team: [{ speciesId: f.id, level: 50, nature: 'hardy', ability: f.abilities[0], item: null,
          moves: [...new Set(f.learnset.filter((l) => l.lv <= 50).map((l) => l.move))].slice(-4) }],
        p1Name: f.name,
        meta: { kind: 'dex' }
      });
    }));
    info.appendChild(act);
  }

  update(dt) {
    this.t += dt;
    this.cast?.update(dt);
    const h = this.modelH || 1.8;
    const narrow = innerWidth <= 840;
    const a = this.t * 0.13 * Math.PI * 2 + 0.5;
    const radius = 1.9 + h * 1.35;
    const camY = h * 0.62 + 0.5;
    const lookY = narrow ? h * 0.20 : h * 0.48;
    this.app.dir?.cut({
      pos: { x: Math.sin(a) * radius, y: camY, z: Math.cos(a) * radius,
        clone() { return { ...this }; }, lerpVectors() {}, copy() {} },
      look: { x: 0, y: lookY, z: 0, clone() { return { ...this }; }, lerpVectors() {}, copy() {} },
      fov: 34
    });
  }

  unmount() {
    this.cast?.dispose();
    this.cast = null;
    this.root.innerHTML = '';
  }

  key(e) {
    const list = this.visible();
    const i = list.findIndex((f) => f.id === this.selected);
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { this.select(list[Math.min(list.length - 1, i + 1)]?.id, this.detailMode); return true; }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { this.select(list[Math.max(0, i - 1)]?.id, this.detailMode); return true; }
    return false;
  }
}
