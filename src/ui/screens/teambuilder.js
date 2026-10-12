// Team Builder. The reason the game exists: build a crew, tune every fighter
// down to the training points, see what the crew is weak to before you find
// out the hard way, and hand the whole thing to a friend as one string.
//
// Three columns on a desktop — roster, crew, editor — collapsing to tabs on a
// phone. Every edit writes through to the save immediately, so closing the tab
// mid-build costs nothing.

import { audio } from '../../audio/audio.js';
import { allFighters, getFighter, makeDefaultMember, defaultMoves } from '../../data/fighters.js';
import { getMove } from '../../data/moves.js';
import { heldItems, getItem } from '../../data/items.js';
import { ABILITIES } from '../../core/abilities.js';
import { TYPES, TYPE_COLOR, TYPE_ICON, typeEff } from '../../core/types.js';
import {
  computeStats, baseStatTotal, STAT_KEYS, STAT_NAME, STAT_SHORT,
  defaultIVs, defaultEVs, NATURES, NATURE_LIST, natureMod,
  MAX_EV_TOTAL, MAX_EV_STAT
} from '../../core/stats.js';
import * as Save from '../../meta/save.js';
import { saveTeam, deleteTeam, activeTeam, isUnlocked } from '../../meta/progression.js';
import { analyseTeam, validateTeam } from '../../meta/teamAnalysis.js';
import { encodeTeam as encodeLinkTeam, decodeTeam as decodeLinkTeam } from '../../net/link.js';
import { encodeTeam as encodeCompact, decodeTeam as decodeCompact, teamToText } from '../../meta/teamcode.js';
import {
  shell, injectScreenCss, el, esc, button, typeBadge, statBar, tierTag,
  portrait, toast, modal, copyText, StageCast
} from './common.js';

const CSS = `
.tb-grid{ display:grid; gap:13px; grid-template-columns:305px minmax(0,1fr) 395px; height:100%; align-items:stretch; min-height:0; }
.tb-col{ display:flex; flex-direction:column; gap:10px; min-height:0; }
.tb-scroll{ flex:1 1 auto; overflow:auto; display:flex; flex-direction:column; gap:7px; padding-right:3px; min-height:0; }
.tb-tabs{ display:none; }

/* ---- roster rows ---- */
.trow{ display:flex; align-items:center; gap:9px; padding:6px 8px; border-radius:11px; cursor:pointer;
  border:2px solid transparent; background:rgba(255,255,255,.035); text-align:left; width:100%;
  font-family:inherit; color:inherit; }
.trow:hover{ background:rgba(255,255,255,.09); }
.trow.in{ border-color:#4ad07a; background:linear-gradient(90deg, rgba(74,208,122,.20), rgba(255,255,255,.03)); }
.trow .n{ font-weight:800; font-size:14.5px; display:flex; align-items:center; gap:5px; }
.trow .s{ font-size:10.5px; color:#8e9ab8; letter-spacing:.05em; text-transform:uppercase;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:150px; }
.trow .r{ margin-left:auto; text-align:right; font-size:11px; color:#8e9ab8; font-variant-numeric:tabular-nums; }
.trow .mini{ display:flex; gap:3px; margin-top:3px; }
.trow .mini i{ width:12px; height:6px; border-radius:2px; display:block; }

/* ---- crew slots ---- */
.slots{ display:grid; gap:9px; grid-template-columns:repeat(auto-fill,minmax(215px,1fr)); }
.slot{ position:relative; display:flex; gap:10px; padding:9px; border-radius:13px; border:3px solid #000;
  background:linear-gradient(180deg,#212840,#141a2b); box-shadow:0 4px 0 rgba(0,0,0,.5); cursor:pointer;
  text-align:left; width:100%; font-family:inherit; color:inherit; align-items:stretch; }
.slot:hover{ filter:brightness(1.1); }
.slot.on{ border-color:var(--gold); box-shadow:0 0 0 2px rgba(242,201,76,.45), 0 4px 0 rgba(0,0,0,.5); }
.slot .meta{ flex:1 1 auto; min-width:0; }
.slot .nm{ font-weight:900; font-size:15px; display:flex; gap:6px; align-items:center; }
.slot .sub{ font-size:10.5px; color:#8e9ab8; margin:1px 0 5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.slot .mv{ display:grid; grid-template-columns:1fr 1fr; gap:2px 6px; font-size:10.5px; color:#c3cde3; }
.slot .mv span{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.slot .mv span.none{ color:#5d6782; }
.slot .x{ position:absolute; right:5px; top:5px; z-index:2; }
.slot.empty{ align-items:center; justify-content:center; border-style:dashed; border-color:#2a3450;
  background:rgba(255,255,255,.02); color:#6f7a95; font-weight:800; min-height:86px; }
.slot .err{ position:absolute; left:6px; bottom:4px; font-size:10px; color:#ff9a9a; font-weight:800; }

/* ---- editor ---- */
.ed-head{ display:flex; gap:12px; align-items:flex-start; }
.ed-head .who{ flex:1 1 auto; min-width:0; }
.ed-name{ font:inherit; font-size:19px; font-weight:900; color:#fff; background:#10141f; border:2px solid #000;
  border-radius:9px; padding:5px 9px; width:100%; }
.ed-row{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin:8px 0 0; }
.ed-row label{ font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; color:#8e9ab8; font-weight:800;
  min-width:56px; }
.ed-row select, .ed-row input{ flex:1 1 130px; min-width:0; }

.mvslot{ display:grid; grid-template-columns:auto 1fr auto auto; gap:8px; align-items:center;
  padding:6px 8px; border-radius:9px; background:rgba(255,255,255,.05); font-size:12.5px; margin-bottom:4px;
  border:2px solid transparent; }
.mvslot.empty{ color:#5d6782; border-style:dashed; border-color:#2a3450; background:none; }
.mvslot .t{ font-size:9px; padding:1px 5px; border-radius:4px; color:#0b0d14; font-weight:900; }
.mvslot .nm{ font-weight:800; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mvslot .pw{ font-variant-numeric:tabular-nums; color:#cfd8ea; font-size:11px; }

.mvpick{ display:flex; flex-direction:column; gap:3px; max-height:290px; overflow:auto; padding-right:3px; }
.mvopt{ display:grid; grid-template-columns:26px 1fr auto auto; gap:7px; align-items:center; padding:5px 7px;
  border-radius:8px; background:rgba(255,255,255,.04); font-size:12.5px; cursor:pointer; border:2px solid transparent;
  text-align:left; font-family:inherit; color:inherit; width:100%; }
.mvopt:hover{ background:rgba(255,255,255,.1); }
.mvopt.on{ border-color:#4ad07a; background:linear-gradient(90deg, rgba(74,208,122,.22), rgba(255,255,255,.03)); }
.mvopt .lv{ font-size:10px; color:#8e9ab8; font-weight:800; }
.mvopt .cat{ font-size:9px; letter-spacing:.06em; color:#8e9ab8; text-transform:uppercase; }
.mvopt.sig{ box-shadow:inset 3px 0 0 var(--gold); }

.abrow{ display:flex; gap:7px; }
.abopt{ flex:1; padding:7px 9px; border-radius:10px; border:2px solid #000; background:#1a2033; cursor:pointer;
  text-align:left; font-family:inherit; color:inherit; }
.abopt.on{ border-color:var(--gold); background:linear-gradient(180deg,#2c3454,#1d2438); }
.abopt b{ display:block; font-size:12.5px; }
.abopt small{ display:block; font-size:10.5px; color:#9fabc6; line-height:1.3; margin-top:2px; }

/* ---- EV allocator ---- */
.evhead{ display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:11.5px; font-weight:800; }
.evhead .left{ color:#8e9ab8; letter-spacing:.1em; text-transform:uppercase; }
.evhead .rem{ font-variant-numeric:tabular-nums; color:#8cffb8; }
.evhead .rem.zero{ color:#8e9ab8; }
.evhead .rem.over{ color:#ff9a9a; }
.evrow{ display:grid; grid-template-columns:34px 1fr 22px 40px; gap:6px; align-items:center; margin:5px 0; }
.evrow .k{ font-size:11px; font-weight:900; color:#8e9ab8; letter-spacing:.05em; }
.evrow .k.up{ color:#8cffb8; } .evrow .k.down{ color:#ff9a9a; }
.evrow input[type=range]{ width:100%; margin:0; accent-color:var(--gold); }
.evrow .ev{ font-size:10.5px; text-align:right; color:#cfd8ea; font-variant-numeric:tabular-nums; }
.evrow .fin{ font-size:13px; font-weight:900; text-align:right; font-variant-numeric:tabular-nums; color:#fff; }
.ivgrid{ display:grid; grid-template-columns:repeat(6,1fr); gap:5px; }
.ivgrid label{ font-size:9.5px; color:#8e9ab8; letter-spacing:.06em; text-align:center; display:block; }
.ivgrid input{ width:100%; text-align:center; font:inherit; font-size:12px; font-weight:800; color:#eaf0ff;
  background:#161c2c; border:2px solid #000; border-radius:7px; padding:3px 2px; }

/* ---- analysis ---- */
.anl-score{ display:flex; align-items:center; gap:12px; }
.anl-ring{ width:56px; height:56px; border-radius:50%; display:flex; align-items:center; justify-content:center;
  font-family:var(--font-display); font-size:19px; color:#fff; flex:0 0 auto; border:3px solid #000; }
.covgrid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(52px,1fr)); gap:3px; }
.cov{ padding:3px 2px; border-radius:6px; text-align:center; font-size:9px; font-weight:900; border:2px solid #000;
  color:#0b0d14; letter-spacing:.02em; }
.cov .m{ display:block; font-size:10px; }
.spd{ display:flex; flex-direction:column; gap:3px; }
.spdrow{ display:grid; grid-template-columns:1fr auto; gap:8px; font-size:12px; padding:3px 6px; border-radius:7px;
  background:rgba(255,255,255,.04); }
.spdrow b{ font-variant-numeric:tabular-nums; }

.tb-foot-l{ display:flex; align-items:center; gap:10px; font-size:12.5px; color:#9fabc6; min-width:0; }
.tb-foot-l .sc{ font-weight:900; color:#fff; }

@media (max-width:1180px){
  .tb-grid{ grid-template-columns:270px minmax(0,1fr); }
  .tb-grid .tb-edit{ grid-column:1 / -1; }
}
@media (max-width:900px){
  .tb-grid{ grid-template-columns:1fr; height:auto; }
  .tb-tabs{ display:flex; gap:5px; margin-bottom:10px; position:sticky; top:0; z-index:5;
    background:rgba(6,8,15,.92); padding:6px 0; }
  .tb-tabs .tab{ flex:1; text-align:center; border-radius:10px; border-bottom:3px solid #000; padding:9px 4px; font-size:12.5px; }
  .tb-scroll{ max-height:none; overflow:visible; }
  .tb-col{ min-height:0; }
  .tb-grid.p-roster .tb-crew, .tb-grid.p-roster .tb-edit, .tb-grid.p-roster .tb-anl,
  .tb-grid.p-crew .tb-roster, .tb-grid.p-crew .tb-edit, .tb-grid.p-crew .tb-anl,
  .tb-grid.p-edit .tb-roster, .tb-grid.p-edit .tb-crew, .tb-grid.p-edit .tb-anl,
  .tb-grid.p-anl .tb-roster, .tb-grid.p-anl .tb-crew, .tb-grid.p-anl .tb-edit{ display:none; }
  .slots{ grid-template-columns:1fr 1fr; }
}
@media (max-width:520px){ .slots{ grid-template-columns:1fr; } }
`;

const CAT_ICON = { physical: '✊', special: '✨', status: '◆' };
const EV_PRESETS = [
  { name: 'Physical sweeper', evs: { hp: 4, atk: 252, def: 0, spa: 0, spd: 0, spe: 252 }, nature: 'jolly' },
  { name: 'Special sweeper', evs: { hp: 4, atk: 0, def: 0, spa: 252, spd: 0, spe: 252 }, nature: 'timid' },
  { name: 'Bulky attacker', evs: { hp: 248, atk: 252, def: 8, spa: 0, spd: 0, spe: 0 }, nature: 'adamant' },
  { name: 'Physical wall', evs: { hp: 252, atk: 0, def: 252, spa: 0, spd: 4, spe: 0 }, nature: 'impish' },
  { name: 'Special wall', evs: { hp: 252, atk: 0, def: 4, spa: 0, spd: 252, spe: 0 }, nature: 'careful' },
  { name: 'Spread', evs: { hp: 84, atk: 84, def: 84, spa: 84, spd: 84, spe: 84 }, nature: null }
];

/* ------------------------------------------------------------------ */
/* member helpers                                                      */
/* ------------------------------------------------------------------ */

/** Every member the builder touches is normalised to the full TeamMember shape. */
export function normaliseMember(m) {
  const def = getFighter(m?.speciesId);
  if (!def) return null;
  const level = Math.max(1, Math.min(100, m.level || 50));
  const evs = { ...defaultEVs(), ...(m.evs || {}) };
  const ivs = { ...defaultIVs(), ...(m.ivs || {}) };
  for (const k of STAT_KEYS) {
    evs[k] = Math.max(0, Math.min(MAX_EV_STAT, Math.round(evs[k] / 4) * 4 || 0));
    ivs[k] = Math.max(0, Math.min(31, Math.round(ivs[k])));
  }
  let moves = (m.moves || []).filter((id) => getMove(id)).slice(0, 4);
  if (!moves.length) moves = defaultMoves(def.id, level);
  return {
    speciesId: def.id,
    nickname: m.nickname || def.name,
    level,
    nature: NATURES[m.nature] ? m.nature : 'hardy',
    ability: def.abilities.includes(m.ability) ? m.ability : def.abilities[0],
    item: m.item && getItem(m.item) ? m.item : null,
    moves,
    evs, ivs
  };
}

export function learnableMoves(def, level) {
  const seen = new Set();
  const out = [];
  for (const l of [...def.learnset].sort((a, b) => a.lv - b.lv)) {
    if (l.lv > level || seen.has(l.move)) continue;
    const mv = getMove(l.move);
    if (!mv) continue;
    seen.add(l.move);
    out.push({ lv: l.lv, mv, sig: def.signature === l.move });
  }
  return out;
}

function evTotal(evs) { return STAT_KEYS.reduce((a, k) => a + (evs[k] || 0), 0); }

/* ------------------------------------------------------------------ */
/* screen                                                              */
/* ------------------------------------------------------------------ */

export class TeamBuilderScreen {
  constructor(app) { this.app = app; }

  mount(root, params = {}) {
    injectScreenCss();
    if (!document.getElementById('tb-css')) {
      const s = document.createElement('style'); s.id = 'tb-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    this.root = root;
    this.t = 0;
    this.filters = { q: '', types: new Set(), tiers: new Set(), sort: 'dex' };
    this.pane = 'crew';
    this.selected = 0;
    this.returnTo = params.returnTo || null;
    this.onPicked = params.onPicked || null;

    this.loadWorking(params);

    const sh = shell(root, {
      title: 'Team Builder',
      sub: this.subLine(),
      onBack: () => this.back(),
      foot: true
    });
    this.sh = sh;
    sh.body.style.height = '100%';
    sh.body.style.overflow = 'auto';
    sh.body.style.paddingBottom = '86px';

    /* --- title-bar actions --- */
    const teamSel = el('select', 'gsel');
    teamSel.title = 'Switch crew';
    teamSel.onchange = () => this.switchTeam(teamSel.value);
    this.$teamSel = teamSel;
    sh.actions.appendChild(teamSel);
    sh.actions.appendChild(button('+ New', 'btn xs ghost', () => this.newTeam()));
    sh.actions.appendChild(button('Share', 'btn xs', () => this.shareModal()));

    /* --- panes --- */
    const grid = el('div', 'tb-grid p-crew');
    this.grid = grid;
    sh.body.appendChild(grid);

    const tabs = el('div', 'tb-tabs');
    for (const [id, label] of [['roster', 'Roster'], ['crew', 'Crew'], ['edit', 'Fighter'], ['anl', 'Analysis']]) {
      const b = el('button', `tab ${id === this.pane ? 'on' : ''}`, label);
      b.type = 'button';
      b.dataset.pane = id;
      b.onclick = () => { audio.sfx('ui_move'); this.setPane(id); };
      tabs.appendChild(b);
    }
    this.tabs = tabs;
    sh.body.insertBefore(tabs, grid);

    grid.appendChild(this.buildRoster());
    grid.appendChild(this.buildCrew());
    grid.appendChild(this.buildEditor());

    /* --- footer --- */
    const footL = el('div', 'tb-foot-l');
    this.$footInfo = footL;
    sh.foot.appendChild(footL);
    const footR = el('div');
    footR.style.display = 'flex';
    footR.style.gap = '8px';
    footR.appendChild(button('Save crew', 'btn sm ghost', () => this.persist(true)));
    this.$fight = button('Battle with this crew', 'btn sm primary', () => this.fight());
    footR.appendChild(this.$fight);
    sh.foot.appendChild(footR);

    /* --- stage --- */
    this.app.stage.buildArena('colosseum');
    this.app.view?.reset?.();
    this.app.plates?.forEach?.((p) => p.hide());
    this.app.textbox?.hide?.();
    this.cast = new StageCast(this.app);
    audio.startMusic('title');
    audio.setIntensity(0.2);

    this.refreshTeamSelect();
    this.drawRoster();
    this.drawCrew();
    this.drawEditor();
    this.drawFoot();

    if (params.add) this.addFighter(params.add);
    if (params.code) this.importCode(params.code);
  }

  /* ---------------- working team ---------------- */

  loadWorking(params) {
    const save = Save.data();
    let team = null;
    if (params.teamId) team = save.teams.find((t) => t.id === params.teamId) || null;
    if (!team) team = activeTeam(save);
    if (team) {
      this.team = {
        id: team.id,
        name: team.name || 'New Crew',
        members: (team.members || []).map(normaliseMember).filter(Boolean).slice(0, 6)
      };
    } else {
      this.team = { id: null, name: 'New Crew', members: [] };
    }
  }

  subLine() {
    const n = this.team.members.length;
    return `${this.team.name} · ${n}/6 fighter${n === 1 ? '' : 's'}${this.team.id ? '' : ' · unsaved'}`;
  }

  /** Write the working team into the save. Creates the record on first use. */
  persist(loud = false) {
    if (!this.team.members.length && !this.team.id) {
      if (loud) toast('Add a fighter first.', 'bad');
      return;
    }
    try {
      this.team.id = saveTeam({ id: this.team.id, name: this.team.name, members: this.team.members });
      if (loud) {
        const health = Save.status();
        if (health.storage === 'memory') toast('Saved for this session only — storage is blocked in this browser.', 'bad', 4200);
        else toast(`"${this.team.name}" saved.`, 'good');
      }
      this.refreshTeamSelect();
    } catch (e) {
      console.warn('[teambuilder] save failed', e);
      if (loud) toast('Could not save — storage refused the write.', 'bad');
    }
    this.sh?.setSub(this.subLine());
  }

  touch() {
    clearTimeout(this._saveT);
    this._saveT = setTimeout(() => this.persist(false), 220);
    this.sh?.setSub(this.subLine());
  }

  refreshTeamSelect() {
    const save = Save.data();
    const sel = this.$teamSel;
    if (!sel) return;
    sel.innerHTML = '';
    const list = save.teams.slice();
    if (!this.team.id) list.unshift({ id: '__new', name: `${this.team.name} (unsaved)` });
    for (const t of list) {
      const o = el('option', null, esc(t.name || 'Crew'));
      o.value = t.id;
      sel.appendChild(o);
    }
    sel.value = this.team.id || '__new';
    sel.style.maxWidth = '150px';
  }

  switchTeam(id) {
    if (!id || id === '__new' || id === this.team.id) return;
    this.persist(false);
    const t = Save.data().teams.find((x) => x.id === id);
    if (!t) return;
    this.team = { id: t.id, name: t.name, members: (t.members || []).map(normaliseMember).filter(Boolean) };
    Save.patch((s) => { s.activeTeamId = t.id; });
    this.selected = 0;
    this.redrawAll();
    toast(`Editing "${t.name}".`);
  }

  newTeam() {
    this.persist(false);
    this.team = { id: null, name: 'New Crew', members: [] };
    this.selected = 0;
    this.redrawAll();
    this.setPane('roster');
  }

  redrawAll() {
    this.refreshTeamSelect();
    this.drawRoster();
    this.drawCrew();
    this.drawEditor();
    this.drawFoot();
    this.sh?.setSub(this.subLine());
  }

  setPane(id) {
    this.pane = id;
    this.grid.className = `tb-grid p-${id}`;
    [...this.tabs.children].forEach((c) => c.classList.toggle('on', c.dataset.pane === id));
  }

  back() {
    this.persist(false);
    if (this.returnTo) this.app.router.go(this.returnTo);
    else this.app.router.go('title');
  }

  /* ---------------- roster column ---------------- */

  buildRoster() {
    const col = el('div', 'tb-col tb-roster pane tight');
    const search = el('div', 'search');
    const input = el('input');
    input.type = 'search';
    input.placeholder = 'Search fighters, types, moves…';
    input.oninput = () => { this.filters.q = input.value.toLowerCase(); this.drawRoster(); };
    search.append(el('span', null, '🔍'), input);
    col.appendChild(search);

    const typeRow = el('div', 'chiprow');
    typeRow.style.maxHeight = '70px';
    typeRow.style.overflow = 'auto';
    for (const t of TYPES) {
      const c = el('button', 'chip sm tt', `${TYPE_ICON[t]} ${t}`);
      c.onclick = () => {
        audio.sfx('ui_move');
        if (this.filters.types.has(t)) { this.filters.types.delete(t); c.classList.remove('on'); c.style.background = ''; c.style.color = ''; }
        else { this.filters.types.add(t); c.classList.add('on'); c.style.background = TYPE_COLOR[t]; c.style.color = '#0b0d14'; }
        this.drawRoster();
      };
      typeRow.appendChild(c);
    }
    col.appendChild(typeRow);

    const row2 = el('div', 'chiprow');
    for (const tier of ['S', 'A', 'B', 'C']) {
      const c = el('button', 'chip sm', tier);
      c.onclick = () => {
        audio.sfx('ui_move');
        if (this.filters.tiers.has(tier)) this.filters.tiers.delete(tier); else this.filters.tiers.add(tier);
        c.classList.toggle('on');
        this.drawRoster();
      };
      row2.appendChild(c);
    }
    const sort = el('select', 'gsel');
    for (const [v, label] of [['dex', 'Dex order'], ['name', 'A–Z'], ['bst', 'Total ↓'],
      ['atk', 'Attack ↓'], ['spa', 'Sp. Atk ↓'], ['spe', 'Speed ↓'], ['hp', 'HP ↓']]) {
      sort.appendChild(Object.assign(el('option', null, label), { value: v }));
    }
    sort.onchange = () => { this.filters.sort = sort.value; this.drawRoster(); };
    row2.appendChild(sort);
    col.appendChild(row2);

    this.$count = el('div', 'mut');
    this.$count.style.fontSize = '11px';
    col.appendChild(this.$count);

    this.$rosterList = el('div', 'tb-scroll');
    col.appendChild(this.$rosterList);
    return col;
  }

  visibleFighters() {
    const f = this.filters;
    let list = allFighters().slice();
    if (f.q) {
      list = list.filter((x) => [x.name, x.epithet, x.origin, x.tier, ...x.types,
        ...x.abilities.map((a) => ABILITIES[a]?.name || a),
        ...x.learnset.map((l) => getMove(l.move)?.name || '')].join(' ').toLowerCase().includes(f.q));
    }
    if (f.types.size) list = list.filter((x) => x.types.some((t) => f.types.has(t)));
    if (f.tiers.size) list = list.filter((x) => f.tiers.has(x.tier));
    const by = {
      name: (a, b) => a.name.localeCompare(b.name),
      bst: (a, b) => baseStatTotal(b.base) - baseStatTotal(a.base),
      atk: (a, b) => b.base.atk - a.base.atk,
      spa: (a, b) => b.base.spa - a.base.spa,
      spe: (a, b) => b.base.spe - a.base.spe,
      hp: (a, b) => b.base.hp - a.base.hp
    }[f.sort];
    if (by) list.sort(by);
    return list;
  }

  drawRoster() {
    const list = this.visibleFighters();
    const host = this.$rosterList;
    host.innerHTML = '';
    this.$count.textContent = `${list.length} of ${allFighters().length} · tap to add`;
    if (!list.length) { host.appendChild(el('div', 'empty', 'Nothing matches those filters.')); return; }
    for (const f of list) {
      const inTeam = this.team.members.some((m) => m.speciesId === f.id);
      const row = el('button', `trow ${inTeam ? 'in' : ''}`);
      row.type = 'button';
      row.appendChild(portrait(f.id, 'sm'));
      const meta = el('div');
      meta.style.minWidth = '0';
      const n = el('div', 'n', esc(f.name));
      n.appendChild(tierTag(f.tier));
      meta.appendChild(n);
      meta.appendChild(el('div', 's', esc(f.epithet)));
      const mini = el('div', 'mini');
      for (const t of f.types) {
        const i = el('i');
        i.style.background = TYPE_COLOR[t];
        i.title = t;
        mini.appendChild(i);
      }
      meta.appendChild(mini);
      row.appendChild(meta);
      row.appendChild(el('div', 'r', `${baseStatTotal(f.base)}${inTeam ? '<div style="font-size:10px;color:#4ad07a">on team</div>' : ''}`));
      row.onclick = () => {
        if (inTeam) { this.selectMember(this.team.members.findIndex((m) => m.speciesId === f.id)); return; }
        this.addFighter(f.id);
      };
      host.appendChild(row);
    }
  }

  addFighter(id) {
    const def = getFighter(id);
    if (!def) return;
    if (this.team.members.length >= 6) { audio.sfx('ui_error'); toast('Six fighters is the limit.', 'bad'); return; }
    const m = normaliseMember(makeDefaultMember(id, 50));
    this.team.members.push(m);
    this.selected = this.team.members.length - 1;
    audio.sfx('ui_select');
    this.touch();
    this.drawRoster();
    this.drawCrew();
    this.drawEditor();
    this.drawFoot();
    if (innerWidth <= 900) this.setPane('edit');
  }

  removeMember(i) {
    this.team.members.splice(i, 1);
    if (this.selected >= this.team.members.length) this.selected = Math.max(0, this.team.members.length - 1);
    audio.sfx('ui_back');
    this.touch();
    this.drawRoster();
    this.drawCrew();
    this.drawEditor();
    this.drawFoot();
  }

  selectMember(i) {
    this.selected = i;
    audio.sfx('ui_move');
    this.drawCrew();
    this.drawEditor();
    if (innerWidth <= 900) this.setPane('edit');
  }

  /* ---------------- crew column ---------------- */

  buildCrew() {
    const col = el('div', 'tb-col tb-crew');
    const pane = el('div', 'pane tight');
    const head = el('div');
    head.style.display = 'flex';
    head.style.gap = '8px';
    head.style.alignItems = 'center';
    head.style.marginBottom = '10px';
    const nameIn = el('input', 'ed-name');
    nameIn.value = this.team.name;
    nameIn.maxLength = 28;
    nameIn.setAttribute('aria-label', 'Crew name');
    nameIn.oninput = () => { this.team.name = nameIn.value.slice(0, 28) || 'New Crew'; this.touch(); };
    this.$nameIn = nameIn;
    head.appendChild(nameIn);
    head.appendChild(button('Delete', 'btn xs ghost', () => this.deleteCurrent()));
    pane.appendChild(head);
    this.$slots = el('div', 'slots');
    pane.appendChild(this.$slots);
    col.appendChild(pane);

    this.$anl = el('div', 'tb-col tb-anl');
    this.$anl.style.gap = '10px';
    col.appendChild(this.$anl);
    return col;
  }

  deleteCurrent() {
    if (!this.team.id) { this.newTeam(); return; }
    modal({
      title: 'Delete this crew?',
      html: `<p class="lede">"${esc(this.team.name)}" and its ${this.team.members.length} fighters will be gone. Team codes you already shared still work.</p>`,
      actions: [
        { label: 'Keep it', cls: 'btn sm ghost' },
        { label: 'Delete', cls: 'btn sm danger', fn: () => {
          deleteTeam(this.team.id);
          const next = activeTeam(Save.data());
          this.team = next
            ? { id: next.id, name: next.name, members: (next.members || []).map(normaliseMember).filter(Boolean) }
            : { id: null, name: 'New Crew', members: [] };
          this.selected = 0;
          this.redrawAll();
          toast('Crew deleted.');
        } }
      ]
    });
  }

  drawCrew() {
    const host = this.$slots;
    if (!host) return;
    host.innerHTML = '';
    const legality = validateTeam(this.team.members);
    this.team.members.forEach((m, i) => {
      const def = getFighter(m.speciesId);
      const slot = el('button', `slot ${i === this.selected ? 'on' : ''}`);
      slot.type = 'button';
      slot.appendChild(portrait(m.speciesId, ''));
      const meta = el('div', 'meta');
      const nm = el('div', 'nm', esc(m.nickname || def.name));
      for (const t of def.types) {
        const dot = el('span');
        dot.style.cssText = `width:9px;height:9px;border-radius:50%;background:${TYPE_COLOR[t]};display:inline-block`;
        dot.title = t;
        nm.appendChild(dot);
      }
      meta.appendChild(nm);
      const it = m.item ? getItem(m.item)?.name : null;
      meta.appendChild(el('div', 'sub', `Lv${m.level} · ${esc(NATURES[m.nature] ? m.nature : 'hardy')}${it ? ' · ' + esc(it) : ''}`));
      const mv = el('div', 'mv');
      for (let k = 0; k < 4; k++) {
        const id = m.moves[k];
        const move = id ? getMove(id) : null;
        const s = el('span', move ? '' : 'none', move ? esc(move.name) : '—');
        if (move) s.style.color = TYPE_COLOR[move.type];
        mv.appendChild(s);
      }
      meta.appendChild(mv);
      slot.appendChild(meta);
      const x = button('✕', 'btn xs ghost x', (e) => { e.stopPropagation(); this.removeMember(i); });
      x.title = `Remove ${def.name}`;
      slot.appendChild(x);
      const err = legality.errors.find((t) => t.startsWith(m.nickname) || t.startsWith(def.name));
      if (err) slot.appendChild(el('div', 'err', '⚠ ' + esc(err.split(':').slice(1).join(':').trim() || err)));
      slot.onclick = () => this.selectMember(i);
      host.appendChild(slot);
    });
    for (let i = this.team.members.length; i < 6; i++) {
      const empty = el('button', 'slot empty', i === this.team.members.length ? '+ Add a fighter' : 'Empty');
      empty.type = 'button';
      empty.onclick = () => { audio.sfx('ui_move'); this.setPane('roster'); };
      host.appendChild(empty);
    }
    this.drawAnalysis();
  }

  /* ---------------- analysis ---------------- */

  drawAnalysis() {
    const host = this.$anl;
    if (!host) return;
    host.innerHTML = '';
    const a = analyseTeam(this.team.members);
    this.analysis = a;

    const p = el('div', 'pane tight');
    p.appendChild(el('h3', null, 'Crew analysis'));
    const scoreRow = el('div', 'anl-score');
    const ring = el('div', 'anl-ring', String(a.score));
    const hue = Math.round((a.score / 100) * 120);
    ring.style.background = `conic-gradient(hsl(${hue} 70% 45%) ${a.score}%, #1b2033 0)`;
    scoreRow.appendChild(ring);
    scoreRow.appendChild(el('div', 'mut',
      a.size ? `${a.size} fighter${a.size === 1 ? '' : 's'} · ${a.roles.phys} physical, ${a.roles.spec} special · ${a.holes.length} coverage gap${a.holes.length === 1 ? '' : 's'}`
        : 'Nothing to analyse yet.'));
    p.appendChild(scoreRow);
    for (const n of a.notes) p.appendChild(el('div', `note ${n.level}`, esc(n.text)));
    host.appendChild(p);

    if (a.size) {
      const cp = el('div', 'pane tight');
      cp.appendChild(el('h3', null, 'Offensive coverage'));
      const g = el('div', 'covgrid');
      for (const c of a.coverage) {
        const cell = el('div', 'cov');
        const mult = c.mult;
        cell.style.background = mult >= 2 ? '#2f7a52' : mult === 1 ? '#3b4460' : mult > 0 ? '#7a5230' : '#5a2a2a';
        cell.style.color = mult >= 1 ? '#e9f7ef' : '#ffd9c8';
        cell.innerHTML = `${TYPE_ICON[c.type]}<span class="m">${mult >= 2 ? '2×+' : mult === 1 ? '1×' : mult > 0 ? '½×' : '0'}</span>`;
        cell.title = c.by ? `${c.type}: best is ${c.by.move} (${c.by.who})` : `${c.type}: nothing hits this`;
        g.appendChild(cell);
      }
      cp.appendChild(g);

      if (a.shared.length) {
        cp.appendChild(el('h4', null, 'Shared weaknesses'));
        for (const s of a.shared.slice(0, 4)) {
          const r = el('div', 'spdrow');
          r.innerHTML = `<span><b style="color:${TYPE_COLOR[s.type]}">${TYPE_ICON[s.type]} ${s.type}</b> — ${esc(s.weakTo.map((w) => w.who).join(', '))}</span><b>${s.weak}/${a.size}</b>`;
          cp.appendChild(r);
        }
      }

      cp.appendChild(el('h4', null, 'Speed tiers (Lv, trained)'));
      const spd = el('div', 'spd');
      for (const s of a.speeds) {
        const r = el('div', 'spdrow');
        r.innerHTML = `<span>${esc(s.name)}${s.scarfed ? ' <span class="mut">(bands)</span>' : ''}</span><b>${s.spe}</b>`;
        spd.appendChild(r);
      }
      cp.appendChild(spd);
      host.appendChild(cp);
    }
  }

  /* ---------------- editor column ---------------- */

  buildEditor() {
    const col = el('div', 'tb-col tb-edit');
    this.$editor = el('div', 'tb-scroll');
    this.$editor.style.gap = '10px';
    col.appendChild(this.$editor);
    return col;
  }

  member() { return this.team.members[this.selected] || null; }

  drawEditor() {
    const host = this.$editor;
    if (!host) return;
    host.innerHTML = '';
    const m = this.member();
    if (!m) {
      const e = el('div', 'empty');
      e.innerHTML = '<div style="font-size:32px">🧭</div><div>Pick a fighter from the roster to start a crew.</div>';
      host.appendChild(e);
      this.cast?.clear();
      return;
    }
    const def = getFighter(m.speciesId);
    this.cast?.set([{ id: m.speciesId, x: 0, z: 0, state: 'ready' }]);
    this.modelH = def.model?.height || 1.8;

    /* header: portrait, nickname, level, nature, ability, item */
    const head = el('div', 'pane tight');
    const row = el('div', 'ed-head');
    row.appendChild(portrait(m.speciesId, 'lg'));
    const who = el('div', 'who');
    const nick = el('input', 'ed-name');
    nick.value = m.nickname;
    nick.maxLength = 16;
    nick.setAttribute('aria-label', 'Nickname');
    nick.oninput = () => { m.nickname = nick.value || def.name; this.touch(); this.drawCrew(); };
    who.appendChild(nick);
    const badges = el('div');
    badges.style.cssText = 'display:flex;gap:5px;margin-top:6px;flex-wrap:wrap;align-items:center';
    for (const t of def.types) badges.appendChild(typeBadge(t, true));
    badges.appendChild(tierTag(def.tier));
    badges.appendChild(el('span', 'mut', `${esc(def.epithet)}`));
    who.appendChild(badges);
    row.appendChild(who);
    head.appendChild(row);

    const lvRow = el('div', 'ed-row');
    lvRow.appendChild(el('label', null, 'Level'));
    const lv = el('input', 'gnum');
    lv.type = 'number'; lv.min = '1'; lv.max = '100'; lv.value = String(m.level);
    lv.style.flex = '0 0 74px';
    lv.onchange = () => {
      m.level = Math.max(1, Math.min(100, Number(lv.value) || 50));
      lv.value = String(m.level);
      m.moves = m.moves.filter((id) => learnableMoves(def, m.level).some((x) => x.mv.id === id));
      if (!m.moves.length) m.moves = defaultMoves(def.id, m.level);
      this.touch(); this.drawEditor(); this.drawCrew();
    };
    lvRow.appendChild(lv);
    lvRow.appendChild(el('label', null, 'Nature'));
    const nat = el('select', 'gsel');
    for (const n of NATURE_LIST) {
      const info = NATURES[n];
      const label = info.up === info.down
        ? `${n} (neutral)`
        : `${n} (+${STAT_SHORT[info.up]} −${STAT_SHORT[info.down]})`;
      nat.appendChild(Object.assign(el('option', null, label), { value: n }));
    }
    nat.value = m.nature;
    nat.onchange = () => { m.nature = nat.value; this.touch(); this.drawEditor(); this.drawCrew(); };
    lvRow.appendChild(nat);
    head.appendChild(lvRow);

    const itRow = el('div', 'ed-row');
    itRow.appendChild(el('label', null, 'Held item'));
    const item = el('select', 'gsel');
    item.appendChild(Object.assign(el('option', null, 'Nothing'), { value: '' }));
    for (const it of heldItems()) {
      const locked = !isUnlocked('items', it.id);
      const o = el('option', null, `${it.name}${locked ? ' ·' : ''}`);
      o.value = it.id;
      o.title = it.desc;
      item.appendChild(o);
    }
    item.value = m.item || '';
    item.onchange = () => { m.item = item.value || null; this.touch(); this.drawEditor(); this.drawCrew(); };
    itRow.appendChild(item);
    head.appendChild(itRow);
    if (m.item) {
      const d = el('p', 'mut', esc(getItem(m.item)?.desc || ''));
      d.style.cssText = 'font-size:11.5px;margin:6px 0 0;line-height:1.35';
      head.appendChild(d);
    }
    host.appendChild(head);

    /* ability */
    const ab = el('div', 'pane tight');
    ab.appendChild(el('h3', null, 'Ability'));
    const abrow = el('div', 'abrow');
    def.abilities.forEach((id, i) => {
      const a = ABILITIES[id];
      const b = el('button', `abopt ${m.ability === id ? 'on' : ''}`);
      b.type = 'button';
      b.innerHTML = `<b>${esc(a?.name || id)}</b><small>${esc(a?.desc || '')}</small>`;
      b.onclick = () => { audio.sfx('ui_select'); m.ability = id; this.touch(); this.drawEditor(); };
      abrow.appendChild(b);
    });
    ab.appendChild(abrow);
    host.appendChild(ab);

    /* moves */
    host.appendChild(this.buildMovePanel(m, def));

    /* stats + EVs */
    host.appendChild(this.buildStatPanel(m, def));

    host.scrollTop = 0;
  }

  buildMovePanel(m, def) {
    const p = el('div', 'pane tight');
    const h = el('h3', null, `Moves · ${m.moves.length}/4`);
    p.appendChild(h);

    for (let i = 0; i < 4; i++) {
      const id = m.moves[i];
      const mv = id ? getMove(id) : null;
      const row = el('div', `mvslot ${mv ? '' : 'empty'}`);
      if (mv) {
        row.innerHTML = `<span class="t" style="background:${TYPE_COLOR[mv.type]}">${mv.type}</span>
          <span class="nm">${esc(mv.name)}</span>
          <span class="pw">${mv.power || '—'} / ${mv.accuracy === null ? '∞' : mv.accuracy} / ${mv.pp}pp</span>`;
        row.title = mv.desc || '';
        const x = button('✕', 'btn xs ghost', () => {
          m.moves.splice(i, 1); this.touch(); this.drawEditor(); this.drawCrew();
        });
        row.appendChild(x);
      } else {
        row.innerHTML = `<span></span><span class="nm">Empty slot ${i + 1}</span><span class="pw"></span><span></span>`;
      }
      p.appendChild(row);
    }

    p.appendChild(el('h4', null, `Learnset at level ${m.level}`));
    const pick = el('div', 'mvpick');
    const options = learnableMoves(def, m.level);
    for (const { lv, mv, sig } of options) {
      const on = m.moves.includes(mv.id);
      const b = el('button', `mvopt ${on ? 'on' : ''} ${sig ? 'sig' : ''}`);
      b.type = 'button';
      b.innerHTML = `<span class="lv">${lv === 1 ? '—' : lv}</span>
        <span class="nm" style="display:flex;gap:5px;align-items:center;min-width:0">
          <span class="t" style="background:${TYPE_COLOR[mv.type]};font-size:9px;padding:1px 5px;border-radius:4px;color:#0b0d14;font-weight:900">${mv.type}</span>
          <span style="overflow:hidden;text-overflow:ellipsis">${esc(mv.name)}</span></span>
        <span class="pw">${mv.power || '—'}</span>
        <span class="cat">${CAT_ICON[mv.category]}</span>`;
      b.title = `${mv.desc || ''}\n${mv.accuracy === null ? 'Never misses' : mv.accuracy + '% accuracy'} · ${mv.pp} PP${mv.priority ? ` · priority ${mv.priority > 0 ? '+' : ''}${mv.priority}` : ''}`;
      b.onclick = () => {
        const i = m.moves.indexOf(mv.id);
        if (i >= 0) { m.moves.splice(i, 1); audio.sfx('ui_back'); }
        else if (m.moves.length >= 4) { audio.sfx('ui_error'); toast('Four moves maximum — drop one first.', 'bad'); return; }
        else { m.moves.push(mv.id); audio.sfx('ui_select'); }
        this.touch(); this.drawEditor(); this.drawCrew();
      };
      pick.appendChild(b);
    }
    if (!options.length) pick.appendChild(el('div', 'mut', 'Nothing learnable at this level.'));
    p.appendChild(pick);
    return p;
  }

  buildStatPanel(m, def) {
    const p = el('div', 'pane tight');
    p.appendChild(el('h3', null, 'Training'));

    const stats = computeStats(def.base, m.level, m.ivs, m.evs, m.nature);
    const bare = computeStats(def.base, m.level, m.ivs, defaultEVs(), m.nature);

    const head = el('div', 'evhead');
    const total = evTotal(m.evs);
    const rem = MAX_EV_TOTAL - total;
    head.innerHTML = `<span class="left">Training points</span>
      <span class="rem ${rem === 0 ? 'zero' : rem < 0 ? 'over' : ''}">${total} / ${MAX_EV_TOTAL} spent · ${Math.max(0, rem)} left</span>`;
    p.appendChild(head);

    const nature = NATURES[m.nature];
    for (const k of STAT_KEYS) {
      const row = el('div', 'evrow');
      const mod = nature && nature.up !== nature.down
        ? (nature.up === k ? 'up' : nature.down === k ? 'down' : '') : '';
      row.appendChild(el('span', `k ${mod}`, STAT_SHORT[k] + (mod === 'up' ? '↑' : mod === 'down' ? '↓' : '')));
      const slider = el('input');
      slider.type = 'range';
      slider.min = '0'; slider.max = String(MAX_EV_STAT); slider.step = '4';
      slider.value = String(m.evs[k]);
      slider.setAttribute('aria-label', `${STAT_NAME[k]} training points`);
      const evOut = el('span', 'ev', String(m.evs[k]));
      const fin = el('span', 'fin', String(stats[k]));
      fin.title = `${bare[k]} untrained → ${stats[k]} with ${m.evs[k]} points`;
      const apply = (raw) => {
        let v = Math.max(0, Math.min(MAX_EV_STAT, Math.round(raw / 4) * 4));
        const others = evTotal(m.evs) - m.evs[k];
        if (others + v > MAX_EV_TOTAL) v = Math.max(0, MAX_EV_TOTAL - others);
        m.evs[k] = v;
        slider.value = String(v);
        evOut.textContent = String(v);
        const s2 = computeStats(def.base, m.level, m.ivs, m.evs, m.nature);
        fin.textContent = String(s2[k]);
        const t2 = evTotal(m.evs);
        head.querySelector('.rem').textContent = `${t2} / ${MAX_EV_TOTAL} spent · ${Math.max(0, MAX_EV_TOTAL - t2)} left`;
        head.querySelector('.rem').className = `rem ${MAX_EV_TOTAL - t2 === 0 ? 'zero' : ''}`;
        this.touch();
        this.drawCrew();
        this.refreshLiveStats();
      };
      slider.oninput = () => apply(Number(slider.value));
      row.append(slider, evOut, fin);
      p.appendChild(row);
    }

    const presets = el('div', 'chiprow');
    presets.style.marginTop = '8px';
    for (const pr of EV_PRESETS) {
      const c = el('button', 'chip sm', pr.name);
      c.onclick = () => {
        audio.sfx('ui_select');
        m.evs = { ...pr.evs };
        if (pr.nature) m.nature = pr.nature;
        this.touch(); this.drawEditor(); this.drawCrew();
      };
      presets.appendChild(c);
    }
    const clear = el('button', 'chip sm', 'Clear');
    clear.onclick = () => { m.evs = defaultEVs(); this.touch(); this.drawEditor(); this.drawCrew(); };
    presets.appendChild(clear);
    p.appendChild(presets);

    /* live stat bars */
    p.appendChild(el('h4', null, 'Stats at this level'));
    this.$liveStats = el('div');
    p.appendChild(this.$liveStats);
    this.refreshLiveStats();

    /* IVs */
    p.appendChild(el('h4', null, 'Potential (IVs)'));
    const iv = el('div', 'ivgrid');
    for (const k of STAT_KEYS) {
      const cell = el('div');
      cell.appendChild(el('label', null, STAT_SHORT[k]));
      const inp = el('input');
      inp.type = 'number'; inp.min = '0'; inp.max = '31'; inp.value = String(m.ivs[k]);
      inp.setAttribute('aria-label', `${STAT_NAME[k]} potential`);
      inp.onchange = () => {
        m.ivs[k] = Math.max(0, Math.min(31, Math.round(Number(inp.value) || 0)));
        inp.value = String(m.ivs[k]);
        this.touch(); this.refreshLiveStats(); this.drawCrew();
      };
      cell.appendChild(inp);
      iv.appendChild(cell);
    }
    p.appendChild(iv);
    const ivRow = el('div', 'chiprow');
    ivRow.style.marginTop = '7px';
    const maxAll = el('button', 'chip sm', 'Max all');
    maxAll.onclick = () => { m.ivs = defaultIVs(); this.touch(); this.drawEditor(); };
    const zeroAtk = el('button', 'chip sm', 'Zero Attack');
    zeroAtk.onclick = () => { m.ivs = { ...m.ivs, atk: 0 }; this.touch(); this.drawEditor(); };
    ivRow.append(maxAll, zeroAtk);
    p.appendChild(ivRow);
    return p;
  }

  refreshLiveStats() {
    const host = this.$liveStats;
    const m = this.member();
    if (!host || !m) return;
    const def = getFighter(m.speciesId);
    const stats = computeStats(def.base, m.level, m.ivs, m.evs, m.nature);
    const bare = computeStats(def.base, m.level, m.ivs, defaultEVs(), m.nature);
    const nature = NATURES[m.nature];
    host.innerHTML = '';
    const max = Math.max(220, ...STAT_KEYS.map((k) => stats[k]));
    for (const k of STAT_KEYS) {
      const mod = nature && nature.up !== nature.down
        ? (nature.up === k ? 1 : nature.down === k ? -1 : 0) : 0;
      const evPortion = stats[k] > 0 ? Math.max(0, (stats[k] - bare[k]) / max) : 0;
      host.appendChild(statBar(k, stats[k], max, { mod, evPortion }));
    }
    const t = el('div', 'mut');
    t.style.cssText = 'font-size:11px;margin-top:4px';
    t.textContent = `Base total ${baseStatTotal(def.base)} · white band = what training bought you`;
    host.appendChild(t);
  }

  /* ---------------- footer ---------------- */

  drawFoot() {
    const host = this.$footInfo;
    if (!host) return;
    const a = this.analysis || analyseTeam(this.team.members);
    const legality = validateTeam(this.team.members);
    host.innerHTML = '';
    host.appendChild(el('span', 'sc', `${this.team.members.length}/6`));
    if (this.team.members.length) {
      host.appendChild(el('span', null, `· crew score <b class="sc">${a.score}</b>`));
    }
    if (!legality.ok) {
      const bad = el('span');
      bad.style.color = '#ff9a9a';
      bad.textContent = `· ${legality.errors.length} problem${legality.errors.length === 1 ? '' : 's'}`;
      bad.title = legality.errors.join('\n');
      host.appendChild(bad);
    }
    if (this.$fight) this.$fight.disabled = !this.team.members.length;
  }

  fight() {
    const legality = validateTeam(this.team.members);
    if (!this.team.members.length) { toast('Add at least one fighter.', 'bad'); return; }
    if (!legality.ok) {
      modal({
        title: 'This crew is not legal yet',
        html: `<div>${legality.errors.map((e) => `<div class="note bad">${esc(e)}</div>`).join('')}</div>`,
        actions: [{ label: 'Fix it', cls: 'btn sm primary' }]
      });
      return;
    }
    this.persist(true);
    if (this.onPicked) { this.onPicked(this.team); return; }
    this.app.router.go('battle', {
      mode: 'ai', aiLevel: 'ace',
      p0Team: this.team.members.map((m) => ({ ...m })),
      p0Name: this.team.name,
      teamSize: this.team.members.length,
      meta: { kind: 'quick', teamId: this.team.id }
    });
  }

  /* ---------------- share ---------------- */

  shareModal() {
    const team = { name: this.team.name, members: this.team.members };
    const linkCode = encodeLinkTeam(team.members, team.name);
    const compact = (() => { try { return encodeCompact(team); } catch { return ''; } })();

    const body = el('div');
    body.appendChild(el('p', 'lede',
      'Paste this to a friend. They open the Team Builder, hit Share → Import, and they have your exact crew — moves, training, natures and items.'));

    const ta = el('textarea');
    ta.value = linkCode;
    ta.readOnly = true;
    ta.rows = 5;
    ta.onclick = () => ta.select();
    body.appendChild(ta);

    const formats = el('div', 'chiprow');
    formats.style.margin = '8px 0';
    const setFmt = (v, label) => {
      ta.value = v;
      [...formats.children].forEach((c) => c.classList.toggle('on', c.textContent === label));
    };
    const fmts = [
      ['Link code', linkCode],
      ['Compact', compact || linkCode],
      ['Readable', (() => { try { return teamToText(team); } catch { return linkCode; } })()]
    ];
    for (const [label, value] of fmts) {
      const c = el('button', `chip sm ${label === 'Link code' ? 'on' : ''}`, label);
      c.onclick = () => { audio.sfx('ui_move'); setFmt(value, label); };
      formats.appendChild(c);
    }
    body.appendChild(formats);

    modal({
      title: `Share "${this.team.name}"`,
      bodyEl: body,
      actions: [
        { label: 'Copy', cls: 'btn sm primary', close: false, fn: async () => {
          const ok = await copyText(ta.value);
          toast(ok ? 'Code copied to the clipboard.' : 'Copy failed — select the text and copy it manually.', ok ? 'good' : 'bad');
        } },
        { label: 'Import a code…', cls: 'btn sm', fn: () => this.importModal() },
        { label: 'Close', cls: 'btn sm ghost' }
      ]
    });
  }

  importModal() {
    const body = el('div');
    body.appendChild(el('p', 'lede', 'Paste a GLA-TEAM or GLA1 code from a friend. Anything this build does not recognise is reported, not silently dropped.'));
    const ta = el('textarea');
    ta.placeholder = 'GLA-TEAM:…';
    ta.rows = 5;
    body.appendChild(ta);
    const out = el('div');
    body.appendChild(out);

    modal({
      title: 'Import a crew',
      bodyEl: body,
      actions: [
        { label: 'Import', cls: 'btn sm primary', close: false, fn: () => {
          const res = this.importCode(ta.value);
          out.innerHTML = '';
          if (!res.ok) { out.appendChild(el('div', 'note bad', esc(res.error))); return false; }
          return true;
        } },
        { label: 'Cancel', cls: 'btn sm ghost' }
      ]
    });
  }

  /**
   * Accepts every code shape the game emits: the link module's `GLA-TEAM:`,
   * the compact `GLA1.` code, or raw JSON pasted out of a save file.
   * @returns {{ok:boolean, error?:string}}
   */
  importCode(text) {
    const raw = String(text || '').trim();
    if (!raw) return { ok: false, error: 'Nothing pasted.' };
    let name = 'Imported Crew';
    let members = null;
    const warnings = [];

    if (/GLA-TEAM:/i.test(raw)) {
      try {
        const { name: n, team } = decodeLinkTeam(raw);
        name = n || name;
        members = Array.isArray(team) ? team : team?.members;
      } catch (e) { return { ok: false, error: e.message || 'That team code could not be read.' }; }
    } else if (/GLA1\./i.test(raw)) {
      const res = decodeCompact(raw.match(/GLA1\.[A-Za-z0-9\-_]+/i)[0]);
      if (!res.ok) return { ok: false, error: res.error };
      name = res.team.name || name;
      members = res.team.members;
      warnings.push(...(res.warnings || []));
    } else {
      try {
        const j = JSON.parse(raw);
        members = Array.isArray(j) ? j : j.members;
        name = j.name || name;
      } catch { return { ok: false, error: 'That is not a team code. Codes start with GLA-TEAM: or GLA1.' }; }
    }

    if (!Array.isArray(members) || !members.length) return { ok: false, error: 'That code contained no fighters.' };
    const clean = [];
    for (const m of members.slice(0, 6)) {
      const norm = normaliseMember(m);
      if (norm) clean.push(norm);
      else warnings.push(`"${m?.speciesId ?? '?'}" is not a fighter in this build — dropped.`);
    }
    if (!clean.length) return { ok: false, error: 'None of those fighters exist in this build.' };

    this.persist(false);
    this.team = { id: null, name, members: clean };
    this.selected = 0;
    this.persist(false);
    this.redrawAll();
    toast(`Imported "${name}" — ${clean.length} fighter${clean.length === 1 ? '' : 's'}.`, 'good');
    if (warnings.length) {
      modal({
        title: 'Imported with changes',
        html: warnings.map((w) => `<div class="note warn">${esc(w)}</div>`).join(''),
        actions: [{ label: 'Got it', cls: 'btn sm primary' }]
      });
    }
    return { ok: true };
  }

  /* ---------------- lifecycle ---------------- */

  update(dt) {
    this.t += dt;
    this.cast?.update(dt);
    if (!this.cast?.models?.length) return;
    const h = this.modelH || 1.8;
    const a = this.t * 0.1 * Math.PI * 2 + 0.7;
    const radius = 2.2 + h * 1.5;
    this.app.dir?.cut({
      pos: vec(Math.sin(a) * radius, h * 0.72 + 0.4, Math.cos(a) * radius),
      look: vec(0, h * 0.5, 0),
      fov: 33
    });
  }

  unmount() {
    clearTimeout(this._saveT);
    this.persist(false);
    this.cast?.dispose();
    this.cast = null;
    this.root.innerHTML = '';
  }

  key(e) {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return false;
    if (e.key >= '1' && e.key <= '6') {
      const i = Number(e.key) - 1;
      if (this.team.members[i]) { this.selectMember(i); return true; }
    }
    return false;
  }
}

/** Minimal THREE.Vector3 stand-in the camera director accepts. */
function vec(x, y, z) {
  return { x, y, z, clone() { return vec(this.x, this.y, this.z); }, lerpVectors() {}, copy() {} };
}
