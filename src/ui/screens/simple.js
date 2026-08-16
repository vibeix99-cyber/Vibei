// Versus (hot-seat), Single Battle, and Options.
//
// These were the placeholder sheets. They are now the real setup screens:
// both of them let you choose *who* fights with *which crew* on *which stage*,
// and Options owns the save file — including telling you, out loud, when the
// browser will not let the game save anything.

import { audio } from '../../audio/audio.js';
import { allFighters, makeDefaultMember } from '../../data/fighters.js';
import { AI_LEVELS } from '../../core/ai.js';
import { ARENAS } from '../../data/arenas.js';
import { RNG } from '../../core/rng.js';
import * as Save from '../../meta/save.js';
import { isUnlocked, activeTeam, rankFor, mostUsed, UNLOCKS } from '../../meta/progression.js';
import { OPPONENTS, getOpponent, opponentTeam, bark } from '../../meta/opponents.js';
import {
  shell, injectScreenCss, el, esc, button, portrait, toast, modal, copyText, StageCast, orbitCamera, timeAgo
} from './common.js';

const CSS = `
.sx-grid{ display:grid; gap:12px; grid-template-columns:repeat(auto-fill,minmax(258px,1fr)); }
.sx-card{ position:relative; display:flex; gap:11px; align-items:flex-start; text-align:left; width:100%;
  padding:12px; border-radius:15px; border:3px solid #000; cursor:pointer; font-family:inherit; color:inherit;
  background:linear-gradient(180deg,#212840,#141a2b); box-shadow:0 5px 0 rgba(0,0,0,.5);
  transition:transform .12s var(--ease-out), filter .12s; }
.sx-card:hover{ transform:translateY(-3px); filter:brightness(1.08); }
.sx-card.on{ border-color:var(--gold); box-shadow:0 0 0 2px rgba(242,201,76,.45), 0 5px 0 rgba(0,0,0,.5); }
.sx-card .t{ font-family:var(--font-display); font-size:17px; line-height:1.1; }
.sx-card .e{ font-size:10px; letter-spacing:.14em; text-transform:uppercase; font-weight:900; margin:2px 0 5px; }
.sx-card .d{ font-size:12.5px; color:#a2adc6; line-height:1.4; }
.sx-card .say{ font-size:12px; font-style:italic; color:#d8dcea; margin-top:6px; line-height:1.35; }
.sx-card .tier{ position:absolute; right:9px; top:9px; font-size:9px; font-weight:900; letter-spacing:.1em;
  text-transform:uppercase; padding:2px 7px; border-radius:99px; border:2px solid #000; background:#1b2033; color:#cfd8ea; }

.setrow{ display:flex; align-items:center; gap:12px; padding:9px 0; border-bottom:1px solid rgba(255,255,255,.06);
  flex-wrap:wrap; }
.setrow > label{ min-width:190px; font-weight:800; font-size:14px; }
.setrow .hint{ flex-basis:100%; font-size:12px; color:#8e9ab8; margin-top:-4px; }
.setrow input[type=range]{ width:min(300px,44vw); accent-color:var(--gold); }
.setrow input[type=checkbox]{ width:20px; height:20px; accent-color:var(--gold); }
.setrow .val{ font-variant-numeric:tabular-nums; font-weight:800; min-width:46px; }
.pill{ display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:99px; font-size:11.5px;
  font-weight:800; border:2px solid #000; }
.pill.ok{ background:#2f7a52; color:#dfffe9; } .pill.bad{ background:#8a3030; color:#ffd9d9; }
.pill.warn{ background:var(--gold); color:#16192a; }
`;

function ensure() {
  injectScreenCss();
  if (document.getElementById('simple-css')) return;
  const s = document.createElement('style'); s.id = 'simple-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

function rolledCrew(size, salt = 0) {
  const rng = new RNG((((Date.now() / 1000) | 0) + salt * 7919) >>> 0);
  const pool = allFighters().slice();
  const out = [];
  for (let i = 0; i < size && pool.length; i++) out.push(makeDefaultMember(pool.splice(rng.int(pool.length), 1)[0].id, 50));
  return out;
}

/** A crew chooser that also offers "roll one". Used by both setup screens. */
function crewSelect(labelText, size, initial) {
  const wrap = el('div', 'setrow');
  wrap.appendChild(el('label', null, labelText));
  const sel = el('select', 'gsel');
  const save = Save.data();
  const opts = [['__random', 'Random crew']];
  for (const t of save.teams) if (t.members?.length) opts.push([t.id, `${t.name} (${t.members.length})`]);
  for (const [v, l] of opts) sel.appendChild(Object.assign(el('option', null, l), { value: v }));
  sel.value = initial && opts.some((o) => o[0] === initial) ? initial : (activeTeam(save)?.id || '__random');
  wrap.appendChild(sel);
  const strip = el('div');
  strip.style.cssText = 'display:flex;gap:5px;align-items:center';
  wrap.appendChild(strip);
  const paint = () => {
    strip.innerHTML = '';
    const t = save.teams.find((x) => x.id === sel.value);
    for (const m of (t?.members || []).slice(0, size)) strip.appendChild(portrait(m.speciesId, 'rd'));
    if (!t) strip.appendChild(el('span', 'mut', 'rolled fresh each time'));
  };
  sel.onchange = () => { audio.sfx('ui_move'); paint(); };
  paint();
  wrap.resolve = () => {
    const t = Save.data().teams.find((x) => x.id === sel.value);
    const members = (t?.members || []).slice(0, size);
    return { members: members.length ? members.map((m) => ({ ...m })) : null, name: t?.name || null };
  };
  return wrap;
}

function arenaSelect(initial) {
  const wrap = el('div', 'setrow');
  wrap.appendChild(el('label', null, 'Arena'));
  const sel = el('select', 'gsel');
  sel.appendChild(Object.assign(el('option', null, 'Surprise me'), { value: '' }));
  for (const a of ARENAS) {
    const locked = !isUnlocked('arenas', a.id);
    const o = el('option', null, `${a.name}${locked ? ' (locked)' : ''}`);
    o.value = a.id;
    o.disabled = locked;
    sel.appendChild(o);
  }
  if (initial) sel.value = initial;
  wrap.appendChild(sel);
  wrap.resolve = () => sel.value || undefined;
  return wrap;
}

/* ------------------------------------------------------------------ */
/* hot-seat versus                                                     */
/* ------------------------------------------------------------------ */

export class VersusScreen {
  constructor(app) { this.app = app; }

  mount(root) {
    ensure();
    this.root = root;
    this.t = 0;
    this.size = 3;

    const sh = shell(root, {
      title: 'Versus a Friend',
      sub: 'Hot-seat — two players, one device',
      onBack: () => this.app.router.go('mode'),
      foot: true
    });
    this.sh = sh;

    sh.body.appendChild(el('p', 'lede',
      'Take turns on the same screen. Between picks the board is covered, so nobody sees what the other one chose.'));

    const formats = el('div', 'sx-grid');
    const mk = (size, title, desc) => {
      const c = el('button', `sx-card ${size === this.size ? 'on' : ''}`);
      c.type = 'button';
      c.innerHTML = `<div><div class="t">${esc(title)}</div><div class="e">${size}v${size}</div><div class="d">${esc(desc)}</div></div>`;
      c.onclick = () => {
        audio.sfx('ui_select');
        this.size = size;
        [...formats.children].forEach((x) => x.classList.remove('on'));
        c.classList.add('on');
      };
      formats.appendChild(c);
    };
    mk(1, 'Duel', 'One fighter each. Pure matchup, no switching.');
    mk(3, 'Standard', 'Three each — the format everything else in the game uses.');
    mk(6, 'Full Crew', 'Six each. Hazards, momentum and the long game.');
    sh.body.appendChild(formats);

    const opts = el('div', 'pane');
    opts.style.marginTop = '14px';
    opts.appendChild(el('h3', null, 'Setup'));
    this.p1 = crewSelect('Player 1 crew', 6, activeTeam(Save.data())?.id);
    this.p2 = crewSelect('Player 2 crew', 6, '__random');
    this.arena = arenaSelect();
    opts.append(this.p1, this.p2, this.arena);
    sh.body.appendChild(opts);

    sh.foot.appendChild(el('div', 'mut', 'Both players pick on the same device.'));
    sh.foot.appendChild(button('Start the match', 'btn sm primary', () => this.start()));

    this.app.stage.buildArena('colosseum');
    this.app.view?.reset?.();
    this.app.plates?.forEach?.((p) => p.hide());
    this.app.textbox?.hide?.();
    this.cast = new StageCast(this.app);
    this.cast.set([
      { id: 'luffy', x: -2.8, z: 0.4, rotY: 0.4, state: 'ready' },
      { id: 'zoro', x: 2.8, z: 0.4, rotY: -0.4, state: 'ready', facing: -1 }
    ]);
    audio.startMusic('title');
  }

  start() {
    const a = this.p1.resolve();
    const b = this.p2.resolve();
    audio.sfx('ui_select');
    this.app.router.go('battle', {
      mode: 'hotseat',
      teamSize: this.size,
      arena: this.arena.resolve(),
      p0Team: a.members ? a.members.slice(0, this.size) : rolledCrew(this.size, 1),
      p1Team: b.members ? b.members.slice(0, this.size) : rolledCrew(this.size, 2),
      p0Name: a.name || 'Player 1',
      p1Name: b.name || 'Player 2',
      meta: { kind: 'hotseat' }
    });
  }

  update(dt) {
    this.t += dt;
    this.cast?.update(dt);
    orbitCamera(this.app, this.t, { radius: 11.6, height: 4.1, speed: 0.012, target: { x: 0, y: 1.7, z: 0 }, angle: 0.3, fov: 38 });
  }

  unmount() { this.cast?.dispose(); this.cast = null; this.root.innerHTML = ''; }
}

/* ------------------------------------------------------------------ */
/* single battle                                                       */
/* ------------------------------------------------------------------ */

export class SingleScreen {
  constructor(app) { this.app = app; }

  mount(root) {
    ensure();
    this.root = root;
    this.t = 0;
    this.opId = null;
    this.level = 'ace';
    this.size = 3;

    const sh = shell(root, {
      title: 'Single Battle',
      sub: 'Pick a crew to fight and bring whatever you like',
      onBack: () => this.app.router.go('mode'),
      foot: true
    });
    this.sh = sh;

    sh.body.appendChild(el('p', 'lede',
      'Eleven crews with names, opinions and a way of playing. Or skip them and fight a plain AI tier.'));

    const grid = el('div', 'sx-grid');
    for (const op of OPPONENTS) {
      const c = el('button', 'sx-card');
      c.type = 'button';
      c.appendChild(portrait(op.crew?.[0] || 'luffy', 'lg'));
      const tx = el('div');
      tx.style.minWidth = '0';
      const t = el('div', 't', esc(op.name));
      const e = el('div', 'e', esc(op.title));
      e.style.color = op.accent;
      tx.append(t, e, el('div', 'd', esc(op.style)));
      tx.appendChild(el('div', 'say', `“${esc(bark(op, 'taunt'))}”`));
      c.appendChild(tx);
      c.appendChild(el('span', 'tier', esc(op.tier)));
      c.onclick = () => this.select(op.id, c);
      grid.appendChild(c);
    }
    sh.body.appendChild(grid);
    this.grid = grid;

    const opts = el('div', 'pane');
    opts.style.marginTop = '14px';
    opts.appendChild(el('h3', null, 'Setup'));

    const tierRow = el('div', 'setrow');
    tierRow.appendChild(el('label', null, 'Difficulty'));
    const tierSel = el('select', 'gsel');
    for (const [id, lv] of Object.entries(AI_LEVELS)) {
      tierSel.appendChild(Object.assign(el('option', null, `${lv.name} — ${lv.desc}`), { value: id }));
    }
    tierSel.value = this.level;
    tierSel.onchange = () => { this.level = tierSel.value; };
    this.$tier = tierSel;
    tierRow.appendChild(tierSel);
    tierRow.appendChild(el('div', 'hint', 'Choosing a crew above sets this to their own tier.'));
    opts.appendChild(tierRow);

    const sizeRow = el('div', 'setrow');
    sizeRow.appendChild(el('label', null, 'Crew size'));
    for (const n of [1, 3, 6]) {
      const b = el('button', `chip sm ${n === this.size ? 'on' : ''}`, `${n}v${n}`);
      b.onclick = () => {
        this.size = n;
        [...sizeRow.querySelectorAll('.chip')].forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        audio.sfx('ui_move');
      };
      sizeRow.appendChild(b);
    }
    opts.appendChild(sizeRow);

    this.crew = crewSelect('Your crew', 6, activeTeam(Save.data())?.id);
    this.arena = arenaSelect();
    opts.append(this.crew, this.arena);
    sh.body.appendChild(opts);

    this.$foot = el('div', 'mut', 'No opponent chosen — you will face a random crew.');
    sh.foot.appendChild(this.$foot);
    sh.foot.appendChild(button('Fight', 'btn sm primary', () => this.start()));

    this.app.stage.buildArena('marineford');
    this.app.view?.reset?.();
    this.app.plates?.forEach?.((p) => p.hide());
    this.app.textbox?.hide?.();
    this.cast = new StageCast(this.app);
    audio.startMusic('title');
    audio.setIntensity(0.28);
  }

  select(id, card) {
    audio.sfx('ui_select');
    this.opId = this.opId === id ? null : id;
    [...this.grid.children].forEach((c) => c.classList.remove('on'));
    if (this.opId) {
      card.classList.add('on');
      const op = getOpponent(id);
      this.level = op.tier;
      this.$tier.value = op.tier;
      this.$foot.textContent = `${op.name} — ${op.title}`;
      this.cast?.set([{ id: op.crew?.[0] || 'luffy', x: 0.6, z: 0, rotY: -0.2, state: 'ready' }]);
      this.modelH = allFighters().find((f) => f.id === op.crew?.[0])?.model?.height || 1.8;
    } else {
      this.$foot.textContent = 'No opponent chosen — you will face a random crew.';
      this.cast?.clear();
    }
  }

  start() {
    const crew = this.crew.resolve();
    const op = this.opId ? getOpponent(this.opId) : null;
    audio.sfx('ui_select');
    this.app.router.go('battle', {
      mode: 'ai',
      aiLevel: this.level,
      teamSize: this.size,
      arena: this.arena.resolve() || op?.arena,
      p0Team: crew.members ? crew.members.slice(0, this.size) : rolledCrew(this.size, 3),
      p0Name: crew.name || 'You',
      p1Team: op ? opponentTeam(op, { level: 50, size: this.size, playerTeam: crew.members || [] }) : undefined,
      p1Name: op?.name,
      meta: { kind: 'ai', opId: op?.id || null, aiLevel: this.level }
    });
  }

  update(dt) {
    this.t += dt;
    this.cast?.update(dt);
    if (!this.cast?.models?.length) {
      orbitCamera(this.app, this.t, { radius: 12, height: 4.2, speed: 0.01, target: { x: 0, y: 1.7, z: 0 }, angle: 0.9, fov: 39 });
      return;
    }
    const h = this.modelH || 1.8;
    const a = 0.8 + this.t * 0.04 * Math.PI * 2;
    const r = 2.6 + h * 1.6;
    this.app.dir?.cut({ pos: vec(0.6 + Math.sin(a) * r, h * 0.8 + 0.6, Math.cos(a) * r), look: vec(0.6, h * 0.55, 0), fov: 32 });
  }

  unmount() { this.cast?.dispose(); this.cast = null; this.root.innerHTML = ''; }
}

/* ------------------------------------------------------------------ */
/* options                                                             */
/* ------------------------------------------------------------------ */

export class OptionsScreen {
  constructor(app) { this.app = app; }

  mount(root) {
    ensure();
    this.root = root;
    const app = this.app;
    const s = app.settings;

    const sh = shell(root, {
      title: 'Options',
      sub: 'Sound, pacing, accessibility and your save file',
      onBack: () => app.router.go('title')
    });
    this.sh = sh;

    const body = sh.body;

    /* ---- audio ---- */
    const audioPane = el('div', 'pane');
    audioPane.appendChild(el('h3', null, 'Sound'));
    const slider = (label, key, apply, hint) => {
      const row = el('div', 'setrow');
      row.appendChild(el('label', null, label));
      const i = el('input');
      i.type = 'range'; i.min = '0'; i.max = '1'; i.step = '0.05'; i.value = String(s[key]);
      const v = el('span', 'val', `${Math.round(s[key] * 100)}%`);
      i.oninput = () => {
        s[key] = Number(i.value);
        v.textContent = `${Math.round(s[key] * 100)}%`;
        apply(s[key]);
        app.saveSettings();
      };
      row.append(i, v);
      if (hint) row.appendChild(el('div', 'hint', hint));
      audioPane.appendChild(row);
    };
    slider('Master volume', 'masterVol', (v) => app.audio.setMaster(v));
    slider('Music', 'musicVol', (v) => app.audio.setMusicVol(v));
    slider('Sound effects', 'sfxVol', (v) => app.audio.setSfxVol(v));
    this.toggle(audioPane, 'Mute everything', 'muted', (v) => app.audio.setMuted(v), 'Also on the M key, from any screen.');
    body.appendChild(audioPane);

    /* ---- pacing & accessibility ---- */
    const play = el('div', 'pane');
    play.style.marginTop = '13px';
    play.appendChild(el('h3', null, 'Pacing & accessibility'));
    const spdRow = el('div', 'setrow');
    spdRow.appendChild(el('label', null, 'Battle speed'));
    for (const n of [1, 2, 4]) {
      const b = el('button', `chip sm ${s.battleSpeed === n ? 'on' : ''}`, `${n}×`);
      b.onclick = () => {
        s.battleSpeed = n;
        app.view.speed = n;
        app.textbox.cps = 110 * n;
        [...spdRow.querySelectorAll('.chip')].forEach((c) => c.classList.remove('on'));
        b.classList.add('on');
        app.saveSettings();
        audio.sfx('ui_move');
      };
      spdRow.appendChild(b);
    }
    play.appendChild(spdRow);
    this.toggle(play, 'Reduced motion', 'reducedMotion', (v) => { app.stage.feel.reduced = v; },
      'Turns off screen shake, hit-stop, flashes and camera punches.');
    this.toggle(play, 'Show the foe\'s HP as a number', 'foeHpNumbers', (v) => { app.plates[1].showNumbers = v; });
    this.toggle(play, 'Confirm each move', 'confirmMoves', () => {},
      'Asks before locking a move in — useful on a touchscreen.');
    this.toggle(play, 'Show tips', 'showTips', () => {});
    body.appendChild(play);

    /* ---- profile ---- */
    const save = Save.data();
    const prof = el('div', 'pane');
    prof.style.marginTop = '13px';
    prof.appendChild(el('h3', null, 'Captain'));
    const nameRow = el('div', 'setrow');
    nameRow.appendChild(el('label', null, 'Name'));
    const nameIn = el('input', 'gnum');
    nameIn.value = save.profile?.name || 'Rookie';
    nameIn.maxLength = 18;
    nameIn.style.minWidth = '180px';
    nameIn.oninput = () => Save.patch((x) => { x.profile.name = nameIn.value.slice(0, 18) || 'Rookie'; });
    nameRow.appendChild(nameIn);
    prof.appendChild(nameRow);
    const rank = rankFor(save.xp);
    const rec = save.record;
    prof.appendChild(el('div', 'kv', `
      <span class="k">Rank</span><span>${esc(rank.name)} · ฿ ${rank.bounty}</span>
      <span class="k">Record</span><span>${rec.won}W · ${rec.lost}L · ${rec.drawn}D (best streak ${rec.bestStreak})</span>
      <span class="k">Knockouts</span><span>${rec.kos} dealt · ${rec.koed} taken</span>
      <span class="k">Damage</span><span>${rec.damageDealt} dealt · ${rec.damageTaken} taken</span>
      <span class="k">Trophies</span><span>${save.trophies.length}</span>
      <span class="k">Crews saved</span><span>${save.teams.length}</span>`));
    const used = mostUsed(save, 4).filter((u) => u.battles);
    if (used.length) {
      prof.appendChild(el('h4', null, 'Most used'));
      const strip = el('div');
      strip.style.cssText = 'display:flex;gap:9px;flex-wrap:wrap';
      for (const u of used) {
        const c = el('div');
        c.style.cssText = 'width:70px;text-align:center;font-size:11px';
        c.appendChild(portrait(u.id, 'sm'));
        c.appendChild(el('div', null, `${u.battles} fights`));
        strip.appendChild(c);
      }
      prof.appendChild(strip);
    }
    body.appendChild(prof);

    /* ---- unlocks ---- */
    const un = el('div', 'pane');
    un.style.marginTop = '13px';
    const got = UNLOCKS.filter((u) => isUnlocked(u.cat, u.ref, save));
    un.appendChild(el('h3', null, `Unlocked ${got.length} of ${UNLOCKS.length}`));
    for (const u of UNLOCKS) {
      const has = isUnlocked(u.cat, u.ref, save);
      un.appendChild(el('div', `note ${has ? 'good' : 'warn'}`, `<b>${esc(u.name)}</b> — ${esc(has ? u.blurb : u.blurb)}`));
    }
    body.appendChild(un);

    /* ---- save data ---- */
    body.appendChild(this.savePane());
  }

  toggle(pane, label, key, apply, hint) {
    const s = this.app.settings;
    const row = el('div', 'setrow');
    row.appendChild(el('label', null, label));
    const i = el('input');
    i.type = 'checkbox';
    i.checked = !!s[key];
    i.onchange = () => { s[key] = i.checked; apply(i.checked); this.app.saveSettings(); audio.sfx('ui_move'); };
    row.appendChild(i);
    if (hint) row.appendChild(el('div', 'hint', hint));
    pane.appendChild(row);
    return row;
  }

  savePane() {
    const p = el('div', 'pane');
    p.style.marginTop = '13px';
    p.appendChild(el('h3', null, 'Save data'));
    const health = Save.status();
    const save = Save.data();

    const status = el('div', 'setrow');
    status.appendChild(el('label', null, 'Storage'));
    if (health.storage === 'local') status.appendChild(el('span', 'pill ok', '✓ Saving to this browser'));
    else status.appendChild(el('span', 'pill bad', '✕ Blocked — this session only'));
    if (health.corrupt) status.appendChild(el('span', 'pill warn', 'Recovered from a corrupt file'));
    if (health.fromFuture) status.appendChild(el('span', 'pill warn', 'Written by a newer build'));
    p.appendChild(status);
    p.appendChild(el('div', 'kv', `
      <span class="k">Format version</span><span>${health.version}</span>
      <span class="k">Last written</span><span>${timeAgo(save.updatedAt)}</span>
      <span class="k">Created</span><span>${new Date(save.createdAt).toLocaleDateString()}</span>`));
    if (health.storage !== 'local') {
      p.appendChild(el('div', 'note bad',
        'This browser refuses to store data (private mode, or storage is full). The game runs normally, but everything is forgotten when the tab closes. Export your save below to keep it.'));
    }

    const row = el('div', 'chiprow');
    row.style.marginTop = '11px';
    row.appendChild(button('Export save', 'btn sm', async () => {
      const text = Save.exportSave();
      const ta = el('textarea');
      ta.value = text;
      ta.rows = 8;
      modal({
        title: 'Your save file',
        bodyEl: ta,
        actions: [
          { label: 'Copy', cls: 'btn sm primary', close: false, fn: async () => {
            const ok = await copyText(text);
            toast(ok ? 'Save copied.' : 'Copy failed — select and copy manually.', ok ? 'good' : 'bad');
          } },
          { label: 'Close', cls: 'btn sm ghost' }
        ]
      });
    }));
    row.appendChild(button('Import save', 'btn sm', () => {
      const ta = el('textarea');
      ta.placeholder = '{"v":2,…}';
      ta.rows = 8;
      modal({
        title: 'Replace your save',
        bodyEl: ta,
        actions: [
          { label: 'Replace', cls: 'btn sm danger', fn: () => {
            const res = Save.importSave(ta.value);
            if (!res.ok) { toast(res.error, 'bad'); return; }
            toast('Save imported.', 'good');
            this.app.reloadSettings?.();
            this.app.router.go('options');
          } },
          { label: 'Cancel', cls: 'btn sm ghost' }
        ]
      });
    }));
    row.appendChild(button('Erase everything', 'btn sm danger', () => {
      modal({
        title: 'Erase your save?',
        html: '<p class="lede">Crews, records, runs, trophies and unlocks. There is no undo — export first if you are unsure.</p>',
        actions: [
          { label: 'Keep it', cls: 'btn sm ghost' },
          { label: 'Erase', cls: 'btn sm danger', fn: () => {
            Save.resetSave();
            this.app.reloadSettings?.();
            toast('Save erased.', 'bad');
            this.app.router.go('title');
          } }
        ]
      });
    }));
    p.appendChild(row);
    return p;
  }

  unmount() { this.root.innerHTML = ''; }
  update() {}
}

function vec(x, y, z) {
  return { x, y, z, clone() { return vec(this.x, this.y, this.z); }, lerpVectors() {}, copy() {} };
}
