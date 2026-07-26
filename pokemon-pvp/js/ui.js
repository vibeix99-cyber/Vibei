/* ==========================================================================
   ui.js — screens, canvas battle stage, animation playback and input.
   ========================================================================== */

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

const STAGE_W = 960, STAGE_H = 420;

/* Ground anchor points for the two fighters. */
const SLOT = [
  { x: 268, y: 356, size: 208, facing: 1 },   /* player 1 — near side */
  { x: 706, y: 248, size: 162, facing: -1 }   /* player 2 — far side  */
];

const STATUS_COLORS = {
  brn: '#f0763c', par: '#f5d24a', psn: '#c06ae0',
  tox: '#9a3ac0', slp: '#8f9fb8', frz: '#6fd0e8'
};

const UI = {
  format: 3,
  hideChoices: true,
  speedMul: 1,
  teams: [null, null],
  battle: null,
  running: false,
  skipFlag: false,
  awaitingKey: null,      /* current keyboard handler for menus */
  lastMoveType: 'normal',
  view: [null, null],
  fx: { particles: [], floaters: [], rings: [] },
  stats: { turns: 0 },
  ctx: null,
  t0: performance.now()
};

/* ------------------------------------------------------------------ basics */

function wait(ms) {
  ms = Math.max(0, ms * UI.speedMul);
  return new Promise(resolve => {
    const start = performance.now();
    const step = () => {
      if (UI.skipFlag || performance.now() - start >= ms) {
        UI.skipFlag = false;
        resolve();
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

function tween(ms, fn) {
  ms = Math.max(1, ms * UI.speedMul);
  return new Promise(resolve => {
    const start = performance.now();
    const step = () => {
      const p = Math.min(1, (performance.now() - start) / ms);
      fn(p);
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

const easeOut = p => 1 - Math.pow(1 - p, 3);

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.toggle('is-active', s.id === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ------------------------------------------------------------------ stage */

function initStage() {
  const canvas = $('#stage');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = STAGE_W * dpr;
  canvas.height = STAGE_H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  UI.ctx = ctx;
  requestAnimationFrame(renderFrame);
}

function freshView(side) {
  return {
    speciesId: null, dx: 0, dy: 0, scale: 1, alpha: 1,
    tint: '#ffffff', tintAmt: 0, rot: 0, hidden: false
  };
}

function drawBackdrop(ctx, t) {
  /* sky */
  const sky = ctx.createLinearGradient(0, 0, 0, STAGE_H);
  sky.addColorStop(0, '#1a2350');
  sky.addColorStop(0.45, '#2b2f68');
  sky.addColorStop(0.62, '#4a3670');
  sky.addColorStop(1, '#1b1430');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);

  /* stars */
  ctx.save();
  for (let i = 0; i < 46; i++) {
    const x = (i * 137.5) % STAGE_W;
    const y = (i * 61.3) % 190;
    const tw = 0.35 + 0.45 * Math.abs(Math.sin(t / 900 + i));
    ctx.globalAlpha = tw * 0.7;
    ctx.fillStyle = '#dfe8ff';
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();

  /* moon */
  ctx.save();
  ctx.globalAlpha = 0.9;
  const mg = ctx.createRadialGradient(812, 74, 6, 812, 74, 62);
  mg.addColorStop(0, 'rgba(255,246,214,.95)');
  mg.addColorStop(1, 'rgba(255,246,214,0)');
  ctx.fillStyle = mg;
  ctx.beginPath(); ctx.arc(812, 74, 62, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fdf4d0';
  ctx.beginPath(); ctx.arc(812, 74, 22, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  /* far ridges */
  ctx.fillStyle = '#241f4e';
  ctx.beginPath();
  ctx.moveTo(-20, 250);
  ctx.lineTo(140, 158); ctx.lineTo(250, 232); ctx.lineTo(380, 140);
  ctx.lineTo(520, 236); ctx.lineTo(660, 168); ctx.lineTo(800, 240);
  ctx.lineTo(980, 176); ctx.lineTo(980, 300); ctx.lineTo(-20, 300);
  ctx.closePath(); ctx.fill();

  /* ground */
  const gr = ctx.createLinearGradient(0, 214, 0, STAGE_H);
  gr.addColorStop(0, '#2e4a3c');
  gr.addColorStop(0.5, '#24503f');
  gr.addColorStop(1, '#13291f');
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.moveTo(0, 268); ctx.quadraticCurveTo(STAGE_W / 2, 236, STAGE_W, 272);
  ctx.lineTo(STAGE_W, STAGE_H); ctx.lineTo(0, STAGE_H);
  ctx.closePath(); ctx.fill();

  /* battle platforms */
  const plate = (x, y, rx, ry, hue) => {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(x, y + 5, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createLinearGradient(x, y - ry, x, y + ry);
    g.addColorStop(0, hue[0]); g.addColorStop(1, hue[1]);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  };
  plate(SLOT[1].x, SLOT[1].y + 6, 108, 23, ['#3d5f74', '#22384a']);
  plate(SLOT[0].x, SLOT[0].y + 8, 142, 30, ['#3f6b56', '#1f3b2e']);

  /* vignette */
  const vg = ctx.createRadialGradient(STAGE_W / 2, STAGE_H / 2, 240, STAGE_W / 2, STAGE_H / 2, 620);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,.5)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
}

function drawFighter(ctx, side, t) {
  const v = UI.view[side];
  if (!v || !v.speciesId || v.hidden) return;
  const slot = SLOT[side];
  ctx.save();
  if (v.rot) {
    ctx.translate(slot.x + v.dx, slot.y + v.dy);
    ctx.rotate(v.rot);
    ctx.translate(-(slot.x + v.dx), -(slot.y + v.dy));
  }
  drawMon(ctx, v.speciesId, {
    x: slot.x + v.dx,
    y: slot.y + v.dy,
    size: slot.size * v.scale,
    facing: slot.facing,
    t: t + side * 700,
    alpha: v.alpha,
    tint: v.tint,
    tintAmt: v.tintAmt
  });
  ctx.restore();
}

function renderFrame(now) {
  const ctx = UI.ctx;
  if (!ctx) return;
  const t = now - UI.t0;
  ctx.clearRect(0, 0, STAGE_W, STAGE_H);
  drawBackdrop(ctx, t);
  drawFighter(ctx, 1, t);
  drawFighter(ctx, 0, t);
  stepFx(ctx);
  requestAnimationFrame(renderFrame);
}

/* --------------------------------------------------------------------- fx */

function slotPos(side, high) {
  const s = SLOT[side];
  const v = UI.view[side] || { dx: 0, dy: 0 };
  return { x: s.x + v.dx, y: s.y + v.dy - (high ? s.size * 0.45 : s.size * 0.3) };
}

function spawnBurst(side, color, count = 26, power = 1) {
  const p = slotPos(side, true);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = (1.4 + Math.random() * 4.2) * power;
    UI.fx.particles.push({
      x: p.x + (Math.random() - 0.5) * 26,
      y: p.y + (Math.random() - 0.5) * 26,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.2,
      g: 0.12, life: 1, decay: 0.018 + Math.random() * 0.02,
      size: 3 + Math.random() * 5 * power, color, shape: Math.random() < 0.4 ? 'star' : 'dot'
    });
  }
  UI.fx.rings.push({ x: p.x, y: p.y, r: 8, max: 74 * power, life: 1, color });
}

function spawnProjectiles(from, to, color, count = 14) {
  const a = slotPos(from, true), b = slotPos(to, true);
  for (let i = 0; i < count; i++) {
    const delay = i * 1.6;
    UI.fx.particles.push({
      x: a.x, y: a.y, tx: b.x + (Math.random() - 0.5) * 40, ty: b.y + (Math.random() - 0.5) * 40,
      sx: a.x + (Math.random() - 0.5) * 30, sy: a.y + (Math.random() - 0.5) * 30,
      p: -delay / 30, speed: 0.045 + Math.random() * 0.02,
      travel: true, life: 1, decay: 0.02,
      size: 4 + Math.random() * 5, color, shape: 'dot'
    });
  }
}

function spawnSparkles(side, color, up = true) {
  const p = slotPos(side, true);
  for (let i = 0; i < 20; i++) {
    UI.fx.particles.push({
      x: p.x + (Math.random() - 0.5) * 80,
      y: p.y + (Math.random() - 0.5) * 70,
      vx: (Math.random() - 0.5) * 1.2, vy: (up ? -1 : 1) * (0.8 + Math.random() * 1.6),
      g: 0, life: 1, decay: 0.016,
      size: 3 + Math.random() * 4, color, shape: 'star'
    });
  }
}

function floatText(side, text, color, size = 26) {
  const p = slotPos(side, true);
  UI.fx.floaters.push({
    x: p.x + (Math.random() - 0.5) * 20, y: p.y - 10,
    vy: -0.9, life: 1, decay: 0.012, text, color, size
  });
}

function stepFx(ctx) {
  const fx = UI.fx;

  for (let i = fx.rings.length - 1; i >= 0; i--) {
    const r = fx.rings[i];
    r.r += (r.max - r.r) * 0.16;
    r.life -= 0.035;
    if (r.life <= 0) { fx.rings.splice(i, 1); continue; }
    ctx.save();
    ctx.globalAlpha = Math.max(0, r.life) * 0.7;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 4 * r.life + 1;
    ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  for (let i = fx.particles.length - 1; i >= 0; i--) {
    const p = fx.particles[i];
    if (p.travel) {
      p.p += p.speed;
      if (p.p >= 1) { p.life -= 0.12; }
      const k = Math.max(0, Math.min(1, p.p));
      p.x = p.sx + (p.tx - p.sx) * k;
      p.y = p.sy + (p.ty - p.sy) * k - Math.sin(k * Math.PI) * 46;
      if (p.p < 0) continue;
    } else {
      p.x += p.vx; p.y += p.vy; p.vy += p.g;
      p.life -= p.decay;
    }
    if (p.life <= 0) { fx.particles.splice(i, 1); continue; }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.fillStyle = p.color;
    if (p.shape === 'star') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.life * 6);
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const rr = k % 2 ? p.size * 0.42 : p.size;
        k ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  for (let i = fx.floaters.length - 1; i >= 0; i--) {
    const f = fx.floaters[i];
    f.y += f.vy; f.vy *= 0.985; f.life -= f.decay;
    if (f.life <= 0) { fx.floaters.splice(i, 1); continue; }
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.4));
    ctx.font = `800 ${f.size}px "Trebuchet MS", sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(0,0,0,.75)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
  }
}

function shakeArena() {
  const a = $('#arena');
  a.classList.remove('is-shaking');
  void a.offsetWidth;
  a.classList.add('is-shaking');
}

/* -------------------------------------------------------------------- HUD */

function typeChip(type) {
  return `<span class="tchip" style="background:${TYPE_COLORS[type] || '#888'}">${type}</span>`;
}

function hpClass(frac) { return frac <= 0.2 ? 'is-low' : (frac <= 0.5 ? 'is-mid' : ''); }

function updateHud(side) {
  const b = UI.battle;
  const m = b.mon(side);
  const hud = $(side === 0 ? '#hud-p1' : '#hud-p2');
  hud.querySelector('.hud-name').textContent = m.name;
  hud.querySelector('.hud-types').innerHTML = m.types.map(typeChip).join('');
  const frac = m.hp / m.maxHp;
  const bar = hud.querySelector('.hpbar');
  bar.className = 'hpbar ' + hpClass(frac);
  bar.querySelector('i').style.width = (frac * 100).toFixed(1) + '%';
  hud.querySelector('.hud-hp').textContent = `${m.hp} / ${m.maxHp}`;
  const st = hud.querySelector('.hud-status');
  if (m.status) {
    st.textContent = STATUS_SHORT[m.status];
    st.style.background = STATUS_COLORS[m.status];
    st.style.display = '';
  } else {
    st.style.display = 'none';
  }
  const chips = [];
  for (const k of ['atk', 'def', 'spa', 'spd', 'spe']) {
    const v = m.boosts[k];
    if (v) chips.push(`<span class="boost-chip ${v > 0 ? 'up' : 'down'}">${STAT_NAMES[k].replace('. ', '')} ${v > 0 ? '+' : ''}${v}</span>`);
  }
  if (m.vol.confusion > 0) chips.push('<span class="boost-chip down">CONFUSED</span>');
  if (m.vol.leechSeed) chips.push('<span class="boost-chip down">SEEDED</span>');
  hud.querySelector('.hud-boosts').innerHTML = chips.join('');
}

function updatePips() {
  for (const side of [0, 1]) {
    const box = $(side === 0 ? '#pips-p1' : '#pips-p2');
    box.innerHTML = UI.battle.teams[side].map((m, i) => {
      const cls = ['pip'];
      if (m.fainted) cls.push('is-out');
      if (i === UI.battle.active[side]) cls.push('is-active');
      return `<span class="${cls.join(' ')}" title="${m.name}"></span>`;
    }).join('');
  }
  $('#turn-counter').textContent = 'Turn ' + Math.max(1, UI.battle.turn);
}

function logLine(text, cls) {
  const box = $('#log');
  const div = document.createElement('div');
  if (cls) div.className = cls;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/* --------------------------------------------------------------- messaging */

let typeTimer = null;

function setMessage(text, instant) {
  const el = $('#msg-text');
  clearInterval(typeTimer);
  if (instant || UI.speedMul < 0.7) { el.textContent = text; return Promise.resolve(); }
  el.textContent = '';
  return new Promise(resolve => {
    let i = 0;
    typeTimer = setInterval(() => {
      if (UI.skipFlag || i >= text.length) {
        el.textContent = text;
        clearInterval(typeTimer);
        resolve();
        return;
      }
      el.textContent = text.slice(0, ++i);
    }, 14 * UI.speedMul);
  });
}

async function say(text) {
  $('#msgbar').classList.add('is-waiting');
  logLine(text);
  await setMessage(text);
  await wait(340 + Math.min(560, text.length * 9));
  $('#msgbar').classList.remove('is-waiting');
}

/* ------------------------------------------------------------ command menu */

let menuButtons = [];
let menuIndex = 0;

function clearMenu() {
  menuButtons = [];
  menuIndex = 0;
  $('#cmd-body').innerHTML = '';
}

/* Shown while a turn plays out, so the panel never sits empty. */
function renderResolvingPanel() {
  const b = UI.battle;
  const row = side => {
    const m = b.mon(side);
    const frac = Math.max(0, m.hp / m.maxHp);
    const col = frac <= 0.2 ? '#ff5a5a' : frac <= 0.5 ? '#ffc23d' : '#45e08a';
    return `<div style="display:flex;align-items:center;gap:9px;padding:5px 0">
        <span class="ptag ${side === 0 ? 'p1' : 'p2'}">P${side + 1}</span>
        <b style="min-width:96px">${m.name}</b>
        <span class="mini-hp" style="flex:1;max-width:220px"><i style="display:block;height:100%;width:${(frac * 100).toFixed(0)}%;background:${col}"></i></span>
        <span class="cb-sub">${m.hp}/${m.maxHp}</span>
      </div>`;
  };
  $('#cmd-body').innerHTML =
    `<div class="cmd-note" style="margin:0 0 6px">⚔ Both orders are locked in — resolving the turn…</div>
     ${row(0)}${row(1)}
     <div class="cmd-note">Press <kbd>Space</kbd> or click the text box to speed through.</div>`;
}

function highlight() {
  menuButtons.forEach((b, i) => b.el.classList.toggle('is-sel', i === menuIndex));
}

function registerButton(el, onActivate, disabled) {
  el.addEventListener('click', () => { if (!disabled) onActivate(); });
  menuButtons.push({ el, onActivate, disabled });
}

function moveMenuIndex(delta) {
  if (!menuButtons.length) return;
  let i = menuIndex;
  for (let n = 0; n < menuButtons.length; n++) {
    i = (i + delta + menuButtons.length) % menuButtons.length;
    if (!menuButtons[i].disabled) break;
  }
  menuIndex = i;
  highlight();
}

function activateMenu(i) {
  const b = menuButtons[i];
  if (b && !b.disabled) b.onActivate();
}

function setCommandOwner(side) {
  const cmd = $('#command');
  cmd.classList.toggle('turn-p1', side === 0);
  cmd.classList.toggle('turn-p2', side === 1);
  const who = $('#cmd-who');
  who.className = 'ptag ' + (side === 0 ? 'p1' : 'p2');
  who.textContent = side === 0 ? 'PLAYER 1' : 'PLAYER 2';
}

/* Effectiveness of a move against the defending types — both sides can see
   each other's typing, so surfacing the multiplier costs no hidden info. */
function effBadge(mv, defTypes) {
  if (mv.cat === 'status') return '';
  const mult = typeEffectiveness(mv.type, defTypes);
  if (mult === 1) return '';
  const label = mult === 0 ? 'NO EFFECT'
    : mult === 0.25 ? '×¼' : mult === 0.5 ? '×½'
    : mult === 4 ? '×4' : mult === 2 ? '×2' : '×' + mult;
  const color = mult === 0 ? '#7c8aa8' : mult > 1 ? '#7dffb4' : '#ff9b9b';
  return `<span class="cat-badge" style="color:${color};border-color:${color}55">${label}</span>`;
}

function moveButton(m, slot, idx, defTypes) {
  const mv = MOVES[slot.id];
  const color = TYPE_COLORS[mv.type];
  const btn = document.createElement('button');
  btn.className = 'cmd-btn';
  btn.style.borderLeftColor = color;
  btn.disabled = slot.pp <= 0;
  const cat = mv.cat === 'phys' ? 'PHYSICAL' : mv.cat === 'spec' ? 'SPECIAL' : 'STATUS';
  btn.innerHTML = `
    <span class="cb-key">${idx + 1}</span>
    <span class="cb-title">${mv.name}</span>
    <span class="cb-meta">
      ${typeChip(mv.type)}
      <span class="cat-badge">${cat}</span>
      ${effBadge(mv, defTypes)}
      <span class="cb-sub">${mv.pw ? 'PWR ' + mv.pw : '—'} · ACC ${mv.acc || '∞'}</span>
      <span class="cb-sub">PP ${slot.pp}/${slot.maxPp}</span>
    </span>`;
  return btn;
}

function benchButton(mon, idx, keyNum) {
  const btn = document.createElement('button');
  btn.className = 'cmd-btn';
  btn.style.borderLeftColor = TYPE_COLORS[mon.types[0]];
  btn.disabled = mon.fainted;
  const frac = mon.hp / mon.maxHp;
  const col = frac <= 0.2 ? '#ff5a5a' : frac <= 0.5 ? '#ffc23d' : '#45e08a';
  btn.innerHTML = `
    <span class="cb-key">${keyNum}</span>
    <span class="cb-title">${mon.name}${mon.fainted ? ' <span class="cb-sub">(fainted)</span>' : ''}</span>
    <span class="cb-meta">
      ${mon.types.map(typeChip).join('')}
      <span class="mini-hp"><i style="width:${(frac * 100).toFixed(0)}%;background:${col}"></i></span>
      <span class="cb-sub">${mon.hp}/${mon.maxHp}</span>
      ${mon.status ? `<span class="cat-badge" style="color:${STATUS_COLORS[mon.status]}">${STATUS_SHORT[mon.status]}</span>` : ''}
    </span>`;
  return btn;
}

/* Ask a player for their action. Resolves with {type:'move'|'switch', idx}. */
function chooseAction(side) {
  return new Promise(resolve => {
    setCommandOwner(side);
    const b = UI.battle;
    const mon = b.mon(side);

    const renderFight = () => {
      clearMenu();
      $('#cmd-hint').textContent = `${mon.name} — pick a move (vs ${b.mon(side === 0 ? 1 : 0).name})`;
      const body = $('#cmd-body');
      const grid = document.createElement('div');
      grid.className = 'cmd-grid';
      const anyPp = mon.moves.some(s => s.pp > 0);

      const foeTypes = b.mon(side === 0 ? 1 : 0).types;
      if (anyPp) {
        mon.moves.forEach((slot, i) => {
          const btn = moveButton(mon, slot, i, foeTypes);
          grid.appendChild(btn);
          registerButton(btn, () => finish({ type: 'move', idx: i }), slot.pp <= 0);
        });
      } else {
        const btn = document.createElement('button');
        btn.className = 'cmd-btn';
        btn.style.borderLeftColor = '#888';
        btn.innerHTML = `<span class="cb-key">1</span><span class="cb-title">Struggle</span>
          <span class="cb-meta"><span class="cb-sub">Out of PP — recoil damage</span></span>`;
        grid.appendChild(btn);
        registerButton(btn, () => finish({ type: 'move', idx: 0 }), false);
      }
      body.appendChild(grid);

      const bench = b.teams[side].filter((m, i) => !m.fainted && i !== b.active[side]);
      const actions = document.createElement('div');
      actions.className = 'cmd-actions';
      const sw = document.createElement('button');
      sw.className = 'btn';
      sw.textContent = bench.length ? 'SWITCH POKÉMON  (S)' : 'NO POKÉMON TO SWITCH';
      sw.disabled = !bench.length;
      actions.appendChild(sw);
      body.appendChild(actions);
      registerButton(sw, renderSwitch, !bench.length);

      const note = document.createElement('div');
      note.className = 'cmd-note';
      note.textContent = 'Keys: 1-4 move · S switch · ↑↓←→ browse · Enter confirm';
      body.appendChild(note);

      menuIndex = 0;
      highlight();
      UI.awaitingKey = key => {
        if (key >= '1' && key <= '4') { activateMenu(+key - 1); return true; }
        if (key === 's' || key === 'S') { if (bench.length) renderSwitch(); return true; }
        return false;
      };
    };

    const renderSwitch = () => {
      clearMenu();
      $('#cmd-hint').textContent = 'Send out which Pokémon?';
      const body = $('#cmd-body');
      const grid = document.createElement('div');
      grid.className = 'cmd-grid';
      let key = 1;
      b.teams[side].forEach((mon2, i) => {
        if (i === b.active[side]) return;
        const btn = benchButton(mon2, i, key++);
        grid.appendChild(btn);
        registerButton(btn, () => finish({ type: 'switch', idx: i }), mon2.fainted);
      });
      body.appendChild(grid);

      const actions = document.createElement('div');
      actions.className = 'cmd-actions';
      const back = document.createElement('button');
      back.className = 'btn ghost';
      back.textContent = '← BACK (Esc)';
      actions.appendChild(back);
      body.appendChild(actions);
      registerButton(back, renderFight, false);

      menuIndex = 0;
      moveMenuIndex(0);
      highlight();
      UI.awaitingKey = key2 => {
        if (key2 >= '1' && key2 <= '6') { activateMenu(+key2 - 1); return true; }
        if (key2 === 'Escape') { renderFight(); return true; }
        return false;
      };
    };

    const finish = action => {
      UI.awaitingKey = null;
      clearMenu();
      $('#cmd-hint').textContent = 'Order locked in';
      $('#cmd-body').innerHTML = '<div class="cmd-note">✔ Order locked in — passing over…</div>';
      resolve(action);
    };

    renderFight();
  });
}

/* Forced replacement after a faint. */
function chooseReplacement(side) {
  return new Promise(resolve => {
    setCommandOwner(side);
    const b = UI.battle;
    clearMenu();
    $('#cmd-hint').textContent = 'Choose your next Pokémon';
    const body = $('#cmd-body');
    const grid = document.createElement('div');
    grid.className = 'cmd-grid';
    let key = 1;
    b.teams[side].forEach((mon, i) => {
      if (mon.fainted || i === b.active[side]) return;
      const btn = benchButton(mon, i, key++);
      grid.appendChild(btn);
      registerButton(btn, () => {
        UI.awaitingKey = null;
        clearMenu();
        resolve(i);
      }, false);
    });
    body.appendChild(grid);
    menuIndex = 0;
    highlight();
    UI.awaitingKey = k => {
      if (k >= '1' && k <= '6') { activateMenu(+k - 1); return true; }
      return false;
    };
  });
}

/* ---------------------------------------------------------------- curtain */

function passScreen(side, reason) {
  if (!UI.hideChoices) return Promise.resolve();
  return new Promise(resolve => {
    $('#pass-title').textContent = side === 0 ? 'PLAYER 1, YOUR TURN' : 'PLAYER 2, YOUR TURN';
    $('#pass-sub').textContent = reason || 'Take the keyboard — the other player shouldn\'t peek.';
    showScreen('screen-pass');
    const go = () => {
      $('#btn-pass-ready').removeEventListener('click', go);
      UI.passResolver = null;
      showScreen('screen-battle');
      resolve();
    };
    UI.passResolver = go;
    $('#btn-pass-ready').addEventListener('click', go);
  });
}

/* ------------------------------------------------------- event animations */

async function animMove(side, moveType, cat) {
  const foe = side === 0 ? 1 : 0;
  const v = UI.view[side];
  const color = TYPE_COLORS[moveType] || '#dddddd';
  UI.lastMoveType = moveType;
  const dir = side === 0 ? 1 : -1;

  if (cat === 'status') {
    spawnSparkles(side, color, true);
    await tween(240, p => { v.scale = 1 + Math.sin(p * Math.PI) * 0.09; });
    v.scale = 1;
    return;
  }

  if (cat === 'spec') {
    await tween(200, p => {
      v.dx = -dir * 16 * Math.sin(p * Math.PI);
      v.scale = 1 + 0.06 * Math.sin(p * Math.PI);
    });
    v.dx = 0; v.scale = 1;
    spawnProjectiles(side, foe, color);
    await wait(300);
  } else {
    const target = SLOT[foe];
    const from = SLOT[side];
    await tween(190, p => {
      const k = easeOut(p);
      v.dx = (target.x - from.x) * 0.42 * k;
      v.dy = (target.y - from.y) * 0.42 * k;
    });
    await tween(210, p => {
      const k = 1 - easeOut(p);
      v.dx = (target.x - from.x) * 0.42 * k;
      v.dy = (target.y - from.y) * 0.42 * k;
    });
    v.dx = 0; v.dy = 0;
  }
}

async function animHit(side, ev) {
  const v = UI.view[side];
  const color = ev.residual ? '#b06ad0' : (TYPE_COLORS[UI.lastMoveType] || '#ffffff');

  if (!ev.residual) {
    spawnBurst(side, color, ev.eff > 1 ? 34 : 22, ev.eff > 1 ? 1.35 : 1);
    if (ev.eff > 1 || ev.crit) shakeArena();
  }

  const dmgColor = ev.eff > 1 ? '#ff8a3d' : ev.eff < 1 ? '#9fb4d8' : '#ffffff';
  floatText(side, '-' + ev.dmg, dmgColor, ev.eff > 1 ? 32 : 26);
  if (ev.crit) floatText(side, 'CRITICAL', '#ffd75e', 18);

  updateHud(side);

  await tween(300, p => {
    v.tint = '#ffffff';
    v.tintAmt = (1 - p) * 0.75;
    v.dx = Math.sin(p * Math.PI * 6) * (1 - p) * 9;
  });
  v.tintAmt = 0; v.dx = 0;
}

async function animFaint(side) {
  const v = UI.view[side];
  await wait(220);
  await tween(520, p => {
    v.dy = p * 46;
    v.alpha = 1 - p;
    v.rot = (side === 0 ? -1 : 1) * p * 0.5;
    v.tint = '#000000';
    v.tintAmt = p * 0.4;
  });
  v.hidden = true;
  v.alpha = 1; v.dy = 0; v.rot = 0; v.tintAmt = 0;
  updatePips();
}

async function animSwitchIn(side, speciesId) {
  const v = UI.view[side];
  v.speciesId = speciesId;
  v.hidden = false;
  v.alpha = 1;
  spawnSparkles(side, side === 0 ? '#34d8ff' : '#ff5ea8', false);
  await tween(340, p => {
    const k = easeOut(p);
    v.scale = 0.35 + 0.65 * k + Math.sin(p * Math.PI) * 0.12;
    v.dy = (1 - k) * -30;
  });
  v.scale = 1; v.dy = 0;
  updateHud(side);
  updatePips();
}

async function playEvents(events) {
  for (const ev of events) {
    switch (ev.t) {
      case 'msg':
        await say(ev.text);
        break;
      case 'move':
        await animMove(ev.side, ev.moveType, ev.cat);
        break;
      case 'hit':
        await animHit(ev.side, ev);
        if ($('#cmd-hint').textContent === 'Resolving…') renderResolvingPanel();
        break;
      case 'heal':
        if (ev.amount > 0) {
          spawnSparkles(ev.side, '#45e08a', true);
          floatText(ev.side, '+' + ev.amount, '#7dffb4', 24);
          updateHud(ev.side);
          await wait(280);
        }
        break;
      case 'miss': {
        const foe = ev.side === 0 ? 1 : 0;
        const v = UI.view[foe];
        floatText(foe, 'MISS', '#cfd8ee', 22);
        await tween(260, p => { v.dx = Math.sin(p * Math.PI) * (foe === 0 ? -26 : 26); });
        v.dx = 0;
        break;
      }
      case 'protect':
      case 'blocked': {
        const p = slotPos(ev.side, true);
        UI.fx.rings.push({ x: p.x, y: p.y, r: 20, max: 92, life: 1, color: '#9fe8ff' });
        await wait(220);
        break;
      }
      case 'status':
        updateHud(ev.side);
        if (ev.kind) {
          spawnSparkles(ev.side, STATUS_COLORS[ev.kind] || '#ffffff', true);
          await wait(200);
        }
        break;
      case 'confuse':
      case 'seeded':
        updateHud(ev.side);
        spawnSparkles(ev.side, ev.t === 'seeded' ? '#57c257' : '#f6a5c0', true);
        await wait(200);
        break;
      case 'boost': {
        updateHud(ev.side);
        const up = ev.delta > 0;
        floatText(ev.side, (up ? '▲ ' : '▼ ') + STAT_NAMES[ev.stat], up ? '#7dffb4' : '#ff9b9b', 20);
        spawnSparkles(ev.side, up ? '#7dffb4' : '#ff9b9b', up);
        await wait(200);
        break;
      }
      case 'faint':
        await animFaint(ev.side);
        break;
      case 'switch':
        await animSwitchIn(ev.side, UI.battle.teams[ev.side][ev.index].speciesId);
        break;
      case 'end':
        break;
    }
  }
}

/* ------------------------------------------------------------- battle flow */

function newTeams() {
  /* Draw both teams from one shared pool so no species shows up twice. */
  const pool = SPECIES_IDS.slice();
  const draw = () => makeMon(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  UI.teams = [
    Array.from({ length: UI.format }, draw),
    Array.from({ length: UI.format }, draw)
  ];
}

function resetTeams() {
  /* Rebuild the same species so a rematch starts fresh. */
  UI.teams = UI.teams.map(team => team.map(m => makeMon(m.speciesId)));
}

async function startBattle() {
  UI.battle = new Battle(UI.teams, { names: ['Player 1', 'Player 2'] });
  UI.view = [freshView(0), freshView(1)];
  UI.view[0].speciesId = UI.battle.mon(0).speciesId;
  UI.view[1].speciesId = UI.battle.mon(1).speciesId;
  UI.fx = { particles: [], floaters: [], rings: [] };
  UI.stats = { turns: 0 };
  $('#log').innerHTML = '';
  updateHud(0); updateHud(1); updatePips();
  showScreen('screen-battle');
  clearMenu();
  $('#cmd-hint').textContent = '';
  setMessage('', true);

  await say(`Player 1 sent out ${UI.battle.mon(0).name}!`);
  await say(`Player 2 sent out ${UI.battle.mon(1).name}!`);
  battleLoop();
}

async function battleLoop() {
  const b = UI.battle;
  UI.running = true;

  while (b.winner === null) {
    logLine(`— Turn ${b.turn + 1} —`, 'lg-turn');
    const actions = [];
    for (const side of [0, 1]) {
      await passScreen(side);
      await setMessage(side === 0 ? 'Player 1, choose your action.' : 'Player 2, choose your action.', true);
      actions[side] = await chooseAction(side);
    }
    $('#cmd-hint').textContent = 'Resolving…';
    renderResolvingPanel();
    const res = b.resolveTurn(actions);
    UI.stats.turns = b.turn;
    updatePips();
    await playEvents(res.events);
    updateHud(0); updateHud(1); updatePips();

    if (b.winner !== null) break;

    for (const side of [0, 1]) {
      if (res.needSwitch[side]) {
        await passScreen(side, 'Your Pokémon fainted — choose a replacement.');
        await setMessage(`${side === 0 ? 'Player 1' : 'Player 2'}, choose your next Pokémon.`, true);
        const idx = await chooseReplacement(side);
        await playEvents(b.forcedSwitch(side, idx));
      }
    }
  }

  UI.running = false;
  await wait(500);
  showResult();
}

/* ------------------------------------------------------------------ result */

function showResult() {
  const b = UI.battle;
  const win = b.winner;
  const title = $('#result-title');
  if (win === 'draw') {
    title.textContent = 'DRAW';
    title.style.color = 'var(--ink)';
  } else {
    title.textContent = `PLAYER ${win + 1} WINS!`;
    title.style.color = win === 0 ? 'var(--p1)' : 'var(--p2)';
  }
  const survivors = win === 'draw' ? 0 : b.aliveCount(win);
  $('#result-sub').textContent = win === 'draw'
    ? `Everyone fainted after ${b.turn} turns.`
    : `${b.turn} turns · ${survivors} Pokémon still standing`;

  $('#result-teams').innerHTML = [0, 1].map(side => `
    <div>
      <div style="margin-bottom:8px"><span class="ptag ${side === 0 ? 'p1' : 'p2'}">PLAYER ${side + 1}</span></div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${b.teams[side].map(m => `
          <div class="result-mon ${m.fainted ? 'is-out' : ''}">
            <canvas data-species="${m.speciesId}" width="34" height="34"></canvas>
            <span>${m.name}</span>
            <span style="color:var(--ink-dim);font-family:var(--mono)">${m.fainted ? 'KO' : m.hp + '/' + m.maxHp}</span>
          </div>`).join('')}
      </div>
    </div>`).join('');

  $$('#result-teams canvas').forEach(c => drawMonPortrait(c, c.dataset.species, 34));

  const conf = $('#confetti');
  conf.innerHTML = '';
  if (win !== 'draw') {
    const colors = win === 0 ? ['#34d8ff', '#7df0ff', '#ffd75e'] : ['#ff5ea8', '#ffa5cf', '#ffd75e'];
    for (let i = 0; i < 60; i++) {
      const i2 = document.createElement('i');
      i2.style.left = Math.random() * 100 + '%';
      i2.style.background = colors[i % colors.length];
      i2.style.animationDuration = (1.8 + Math.random() * 1.8) + 's';
      i2.style.animationDelay = (Math.random() * 0.7) + 's';
      conf.appendChild(i2);
    }
  }
  showScreen('screen-result');
}

/* ----------------------------------------------------------------- preview */

function monCard(mon) {
  const el = document.createElement('div');
  el.className = 'mon-card';
  const cv = document.createElement('canvas');
  el.appendChild(cv);
  const info = document.createElement('div');
  info.innerHTML = `
    <div class="mc-name">${mon.name}</div>
    <div class="mc-row">${mon.types.map(typeChip).join('')}</div>
    <div class="mc-stats">HP ${mon.maxHp} · ATK ${mon.stats.atk} · DEF ${mon.stats.def} · SPA ${mon.stats.spa} · SPD ${mon.stats.spd} · SPE ${mon.stats.spe}</div>
    <div class="mc-moves">${mon.moves.map(s => {
      const mv = MOVES[s.id];
      return `<span class="mchip" style="border-left-color:${TYPE_COLORS[mv.type]}">${mv.name}</span>`;
    }).join('')}</div>`;
  el.appendChild(info);
  requestAnimationFrame(() => drawMonPortrait(cv, mon.speciesId, 62));
  return el;
}

function renderPreview() {
  for (const side of [0, 1]) {
    const box = $(side === 0 ? '#preview-p1' : '#preview-p2');
    box.innerHTML = '';
    UI.teams[side].forEach((mon, i) => {
      const card = monCard(mon);
      card.style.animationDelay = (i * 60) + 'ms';
      box.appendChild(card);
    });
  }
}

/* ------------------------------------------------------------------- input */

function onKeyDown(e) {
  /* curtain screen */
  if ($('#screen-pass').classList.contains('is-active')) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (UI.passResolver) UI.passResolver();
    }
    return;
  }

  if (UI.awaitingKey) {
    if (UI.awaitingKey(e.key)) { e.preventDefault(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { moveMenuIndex(1); e.preventDefault(); return; }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { moveMenuIndex(-1); e.preventDefault(); return; }
    if (e.key === 'Enter' || e.key === ' ') { activateMenu(menuIndex); e.preventDefault(); return; }
    return;
  }

  if (e.key === ' ' || e.key === 'Enter') {
    UI.skipFlag = true;
    e.preventDefault();
  }
}
