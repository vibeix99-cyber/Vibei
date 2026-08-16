// Shared furniture for every out-of-battle screen: the page shell, the widget
// vocabulary, 3D-rendered portraits, and helpers for putting live fighters on
// the shared stage.
//
// Nothing here reaches into files owned by other agents — style tokens come
// from theme.css variables, models come from render/fighterModel.js (read-only).

import * as THREE from 'three';
import { buildFighter } from '../../render/fighterModel.js';
import { getFighter, allFighters } from '../../data/fighters.js';
import { TYPE_COLOR, TYPE_ICON } from '../../core/types.js';
import { audio } from '../../audio/audio.js';

/* ------------------------------------------------------------------ */
/* stylesheet                                                          */
/* ------------------------------------------------------------------ */

const SCREEN_CSS = `
.gx{ position:absolute; inset:0; display:flex; flex-direction:column;
  background:
    radial-gradient(1200px 620px at 18% -10%, rgba(60,90,160,.30), transparent 62%),
    radial-gradient(900px 520px at 96% 108%, rgba(150,70,40,.24), transparent 60%),
    linear-gradient(180deg, rgba(6,8,15,.90) 0%, rgba(6,8,15,.965) 46%, rgba(4,5,10,.985) 100%);
  color:var(--text-inv); font-family:var(--font-ui); }

.gx-bar{ flex:0 0 auto; display:flex; align-items:center; gap:14px;
  padding:14px clamp(14px,3vw,34px) 12px; border-bottom:2px solid rgba(0,0,0,.75);
  background:linear-gradient(180deg, rgba(12,16,28,.94), rgba(12,16,28,.55));
  box-shadow:0 6px 22px rgba(0,0,0,.45); z-index:6; }
.gx-bar .who{ min-width:0; flex:1 1 auto; }
.gx-h{ font-family:var(--font-display); font-size:clamp(19px,3vw,32px); line-height:1;
  color:#f6f4ea; text-shadow:0 3px 0 #000; letter-spacing:.01em;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.gx-sub{ font-size:clamp(11px,1.3vw,13.5px); color:#93a0bd; letter-spacing:.10em;
  text-transform:uppercase; margin-top:4px; font-weight:700;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.gx-acts{ display:flex; gap:8px; align-items:center; flex:0 0 auto; }
.gx-body{ flex:1 1 auto; overflow:auto; overscroll-behavior:contain;
  padding:clamp(12px,2.4vw,26px) clamp(12px,3vw,34px) clamp(84px,10vh,110px);
  -webkit-overflow-scrolling:touch; }
.gx-foot{ position:absolute; left:0; right:0; bottom:0; z-index:7;
  display:flex; gap:10px; align-items:center; justify-content:space-between;
  padding:10px clamp(12px,3vw,34px) calc(10px + env(safe-area-inset-bottom,0px));
  background:linear-gradient(0deg, rgba(6,8,15,.97) 40%, rgba(6,8,15,0));
  pointer-events:none; }
.gx-foot > *{ pointer-events:auto; }

.btn.sm{ font-size:14px; padding:7px 13px; border-width:2px; box-shadow:0 3px 0 var(--ink); }
.btn.xs{ font-size:12px; padding:4px 9px; border-width:2px; box-shadow:0 2px 0 var(--ink); border-radius:8px; }
.btn.ghost{ background:linear-gradient(180deg,#232a40,#161b2c); color:#dfe6f5; border-color:#000; }
.btn.ghost:hover{ background:linear-gradient(180deg,#2c3550,#1c2337); }

/* ---------- panels ---------- */
.pane{ background:linear-gradient(180deg, rgba(28,34,54,.96), rgba(16,20,34,.96));
  border:3px solid #000; border-radius:16px; box-shadow:0 8px 0 rgba(0,0,0,.42), 0 18px 40px rgba(0,0,0,.4);
  padding:14px 16px; }
.pane.tight{ padding:10px 12px; }
.pane h3{ margin:0 0 10px; font-family:var(--font-display); font-size:15px; letter-spacing:.10em;
  text-transform:uppercase; color:var(--gold); text-shadow:0 2px 0 #000; }
.pane h4{ margin:14px 0 6px; font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:#8e9ab8; }
.pane h4:first-child{ margin-top:0; }

.grid-auto{ display:grid; gap:12px; grid-template-columns:repeat(auto-fill,minmax(228px,1fr)); }
.grid-2{ display:grid; gap:12px; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); }

/* ---------- fighter card ---------- */
.fcard{ position:relative; display:flex; gap:11px; align-items:stretch; text-align:left;
  padding:10px; border-radius:14px; border:3px solid #000; cursor:pointer;
  background:linear-gradient(180deg,#212840,#141a2b);
  box-shadow:0 5px 0 rgba(0,0,0,.5); transition:transform .12s var(--ease-out), box-shadow .12s;
  font-family:inherit; color:inherit; width:100%; }
.fcard:hover{ transform:translateY(-3px); box-shadow:0 8px 0 rgba(0,0,0,.5); }
.fcard:focus-visible{ outline:3px solid var(--gold); outline-offset:2px; }
.fcard.on{ border-color:var(--gold); box-shadow:0 0 0 2px rgba(242,201,76,.5), 0 5px 0 rgba(0,0,0,.5); }
.fcard.dim{ opacity:.45; filter:saturate(.4); }
.fcard .meta{ flex:1 1 auto; min-width:0; }
.fcard .nm{ font-weight:800; font-size:16.5px; line-height:1.1; display:flex; align-items:center; gap:6px; }
.fcard .ep{ font-size:10.5px; color:var(--gold); letter-spacing:.10em; text-transform:uppercase;
  margin:2px 0 6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.fcard .tt{ display:flex; gap:4px; flex-wrap:wrap; margin-bottom:6px; }
.fcard .bst{ font-size:11px; color:#8e9ab8; font-variant-numeric:tabular-nums; }

/* ---------- portrait ---------- */
.pt{ position:relative; flex:0 0 auto; width:62px; height:78px; border-radius:11px; overflow:hidden;
  border:2px solid #000; background:linear-gradient(180deg,#2c3450,#10131f); }
.pt img{ width:100%; height:100%; object-fit:cover; object-position:50% 12%; display:block;
  image-rendering:auto; }
.pt .fb{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
  font-family:var(--font-display); font-size:22px; color:rgba(255,255,255,.92); text-shadow:0 2px 0 rgba(0,0,0,.6); }
.pt.lg{ width:96px; height:120px; border-radius:14px; }
.pt.xl{ width:150px; height:186px; border-radius:16px; }
.pt.sm{ width:42px; height:52px; border-radius:9px; }
.pt.rd{ border-radius:50%; width:56px; height:56px; }
.pt.rd img{ object-position:50% 8%; }

/* ---------- chips / filters ---------- */
.chiprow{ display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
.chip{ padding:5px 11px; border-radius:999px; border:2px solid #000; background:#1c2338; color:#cfd8ea;
  font-size:12px; font-weight:800; letter-spacing:.05em; cursor:pointer; user-select:none;
  box-shadow:0 2px 0 rgba(0,0,0,.5); transition:transform .1s, filter .1s; font-family:inherit; }
.chip:hover{ filter:brightness(1.2); transform:translateY(-1px); }
.chip.on{ background:var(--gold); color:#16192a; border-color:#000; }
.chip.tt{ text-transform:uppercase; }
.chip.sm{ font-size:10.5px; padding:3px 8px; }

.search{ display:flex; align-items:center; gap:8px; padding:7px 12px; border-radius:11px;
  border:3px solid #000; background:#10141f; box-shadow:inset 0 2px 8px rgba(0,0,0,.55); }
.search input{ flex:1; background:none; border:0; outline:0; color:#f2f5ff; font:inherit; font-size:15px; min-width:0; }
.search input::placeholder{ color:#5d6782; }

select.gsel, input.gnum{ font:inherit; font-size:13px; font-weight:700; color:#eaf0ff; background:#161c2c;
  border:2px solid #000; border-radius:9px; padding:6px 9px; box-shadow:0 2px 0 rgba(0,0,0,.5); }

/* ---------- bars ---------- */
.sbar{ display:grid; grid-template-columns:34px 1fr 40px; gap:8px; align-items:center;
  font-size:11px; font-weight:800; letter-spacing:.06em; margin:3px 0; }
.sbar .track{ height:9px; background:#161c2c; border-radius:99px; overflow:hidden; border:1px solid #000;
  position:relative; }
.sbar .track i{ display:block; height:100%; border-radius:99px; transition:width .22s var(--ease-out); }
.sbar .track .ev{ position:absolute; top:0; height:100%; background:rgba(255,255,255,.30); border-radius:99px; }
.sbar .v{ text-align:right; font-variant-numeric:tabular-nums; color:#e6ecfa; }
.sbar .k{ color:#8e9ab8; }
.sbar.up .v{ color:#8cffb8; } .sbar.down .v{ color:#ff9a9a; }

/* ---------- misc ---------- */
.kv{ display:grid; grid-template-columns:auto 1fr; gap:4px 12px; font-size:13px; }
.kv .k{ color:#8e9ab8; }
.note{ display:flex; gap:8px; align-items:flex-start; font-size:13px; line-height:1.4;
  padding:8px 10px; border-radius:10px; margin:5px 0; border-left:4px solid; background:rgba(255,255,255,.04); }
.note.good{ border-color:#4ad07a; color:#cdeedb; }
.note.warn{ border-color:var(--gold); color:#f3e7c4; }
.note.bad{ border-color:#ef4747; color:#ffd4d4; }
.lede{ color:#9fabc6; font-size:14.5px; line-height:1.5; max-width:76ch; margin:0 0 16px; }
.mut{ color:#7f8aa5; }
.tabs{ display:flex; gap:6px; margin-bottom:14px; flex-wrap:wrap; }
.tab{ padding:8px 15px; border-radius:11px 11px 0 0; border:3px solid #000; border-bottom:0;
  background:#171d2e; color:#9fabc6; font-weight:800; font-size:13.5px; cursor:pointer; font-family:inherit;
  letter-spacing:.05em; }
.tab.on{ background:linear-gradient(180deg,#2b3454,#1d2438); color:#fff; }
.empty{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px;
  padding:44px 20px; text-align:center; color:#7f8aa5; border:3px dashed #2a3450; border-radius:16px; }

.tag{ display:inline-block; padding:2px 8px; border-radius:6px; font-size:10.5px; font-weight:900;
  letter-spacing:.1em; text-transform:uppercase; border:2px solid rgba(0,0,0,.6); }
.tier-S{ background:#ffd166; color:#2a1a00; }
.tier-A{ background:#8cffb8; color:#062416; }
.tier-B{ background:#7fd8ff; color:#00202e; }
.tier-C{ background:#c8cede; color:#1a1e2a; }

/* ---------- toast ---------- */
#gx-toasts{ position:fixed; left:50%; bottom:calc(18px + env(safe-area-inset-bottom,0px)); transform:translateX(-50%);
  display:flex; flex-direction:column-reverse; gap:8px; z-index:60; pointer-events:none; align-items:center; }
.gx-toast{ padding:10px 18px; border-radius:12px; border:3px solid #000; font-weight:800; font-size:14px;
  background:linear-gradient(180deg,#2b3454,#1a2033); color:#fff; box-shadow:0 6px 0 rgba(0,0,0,.5);
  animation:popIn .22s var(--ease-back) both; max-width:min(92vw,520px); text-align:center; }
.gx-toast.good{ background:linear-gradient(180deg,#2f7a52,#1c4a33); }
.gx-toast.bad{ background:linear-gradient(180deg,#8a3030,#521c1c); }
.gx-toast.gold{ background:linear-gradient(180deg,var(--gold),var(--gold-deep)); color:#16192a; }

/* ---------- modal ---------- */
.gx-modal-wrap{ position:fixed; inset:0; z-index:70; display:flex; align-items:center; justify-content:center;
  background:rgba(3,5,10,.78); padding:18px; animation:fadeIn .16s ease both; backdrop-filter:blur(3px); }
.gx-modal{ width:min(560px,96vw); max-height:88vh; overflow:auto; animation:popIn .26s var(--ease-back) both; }
.gx-modal .row{ display:flex; gap:10px; justify-content:flex-end; margin-top:16px; flex-wrap:wrap; }
.gx-modal textarea{ width:100%; min-height:120px; font-family:ui-monospace,Menlo,Consolas,monospace; font-size:12px;
  background:#0d1120; color:#cfe0ff; border:2px solid #000; border-radius:10px; padding:10px; resize:vertical;
  word-break:break-all; }

/* ---------- narrow ---------- */
@media (max-width:820px){
  .gx-bar{ padding:10px 12px 8px; gap:10px; }
  .pane{ padding:12px; border-radius:14px; }
  .grid-auto{ grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:9px; }
  .fcard{ flex-direction:column; gap:7px; padding:8px; }
  .pt{ width:100%; height:96px; }
  .pt img{ object-position:50% 10%; }
  .fcard .nm{ font-size:14.5px; }
  .lede{ font-size:13.5px; }
}
`;

export function injectScreenCss() {
  if (document.getElementById('gx-css')) return;
  const s = document.createElement('style');
  s.id = 'gx-css';
  s.textContent = SCREEN_CSS;
  document.head.appendChild(s);
}

/* ------------------------------------------------------------------ */
/* dom helpers                                                         */
/* ------------------------------------------------------------------ */

export function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function button(label, cls = 'btn sm', fn) {
  const b = el('button', cls, label);
  b.type = 'button';
  if (fn) b.onclick = (e) => { audio.sfx('ui_select'); fn(e); };
  return b;
}

/**
 * Standard page: title bar with a back button, a scrolling body, optional footer.
 * @returns {{root, bar, body, foot, setTitle, setSub}}
 */
export function shell(root, opts = {}) {
  injectScreenCss();
  const wrap = el('div', 'gx');
  const bar = el('div', 'gx-bar');

  if (opts.back !== false) {
    const b = button('←', 'btn sm ghost', () => opts.onBack?.());
    b.title = 'Back (Esc)';
    b.setAttribute('aria-label', 'Back');
    bar.appendChild(b);
  }
  const who = el('div', 'who');
  const h = el('div', 'gx-h', esc(opts.title || ''));
  const sub = el('div', 'gx-sub', esc(opts.sub || ''));
  who.append(h, sub);
  bar.appendChild(who);

  const acts = el('div', 'gx-acts');
  bar.appendChild(acts);

  const body = el('div', 'gx-body');
  wrap.append(bar, body);

  let foot = null;
  if (opts.foot) { foot = el('div', 'gx-foot'); wrap.appendChild(foot); }

  root.appendChild(wrap);
  return {
    root: wrap, bar, body, foot, actions: acts,
    setTitle: (t) => { h.textContent = t; },
    setSub: (t) => { sub.textContent = t; }
  };
}

/* ------------------------------------------------------------------ */
/* toasts + modals                                                     */
/* ------------------------------------------------------------------ */

export function toast(text, kind = '', ms = 2400) {
  injectScreenCss();
  let host = document.getElementById('gx-toasts');
  if (!host) { host = el('div'); host.id = 'gx-toasts'; document.body.appendChild(host); }
  const t = el('div', `gx-toast ${kind}`, esc(text));
  host.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity .3s, transform .3s';
    t.style.opacity = '0'; t.style.transform = 'translateY(8px)';
    setTimeout(() => t.remove(), 340);
  }, ms);
  return t;
}

/**
 * @param {{title, bodyEl?, html?, actions?:Array<{label,cls?,fn?,close?}>}} opts
 * @returns {{close:Function, el:HTMLElement}}
 */
export function modal(opts = {}) {
  injectScreenCss();
  const wrap = el('div', 'gx-modal-wrap');
  const box = el('div', 'gx-modal pane');
  if (opts.title) box.appendChild(el('h3', null, esc(opts.title)));
  if (opts.html) box.appendChild(el('div', null, opts.html));
  if (opts.bodyEl) box.appendChild(opts.bodyEl);
  const row = el('div', 'row');
  const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey, true); };
  for (const a of opts.actions || [{ label: 'Close', close: true }]) {
    row.appendChild(button(a.label, a.cls || 'btn sm', () => {
      const keep = a.fn?.();
      if (a.close !== false && keep !== false) close();
    }));
  }
  box.appendChild(row);
  wrap.appendChild(box);
  wrap.onclick = (e) => { if (e.target === wrap && opts.dismissable !== false) close(); };
  function onKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); }
  }
  document.addEventListener('keydown', onKey, true);
  document.body.appendChild(wrap);
  const focusable = box.querySelector('input,textarea,button');
  focusable?.focus?.();
  return { close, el: box };
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    try {
      const ta = el('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch { return false; }
  }
}

/* ------------------------------------------------------------------ */
/* badges & bars                                                       */
/* ------------------------------------------------------------------ */

export function typeBadge(t, small = false) {
  const b = el('span', 'type-badge', `${TYPE_ICON[t] || ''} ${t}`);
  b.style.background = TYPE_COLOR[t] || '#888';
  if (small) { b.style.fontSize = '10px'; b.style.padding = '1px 6px'; }
  return b;
}

export function typeBadges(types, small) {
  const w = el('span', 'tt');
  w.style.display = 'inline-flex'; w.style.gap = '4px'; w.style.flexWrap = 'wrap';
  for (const t of types) w.appendChild(typeBadge(t, small));
  return w;
}

const STAT_COLOR = { hp: '#4ad07a', atk: '#ff8a5c', def: '#7fd8ff', spa: '#e05c9e', spd: '#a7e8c0', spe: '#f5c542' };

/** A stat row. `evFrac` paints the portion of the bar the EVs bought. */
export function statBar(key, value, max = 200, opts = {}) {
  const row = el('div', `sbar ${opts.mod === 1 ? 'up' : opts.mod === -1 ? 'down' : ''}`);
  row.append(el('span', 'k', key.toUpperCase()));
  const track = el('span', 'track');
  const fill = el('i');
  fill.style.width = `${Math.max(2, Math.min(100, (value / max) * 100))}%`;
  fill.style.background = `linear-gradient(90deg, ${STAT_COLOR[key] || '#8ab'}, ${STAT_COLOR[key] || '#8ab'}aa)`;
  track.appendChild(fill);
  if (opts.evPortion > 0) {
    const ev = el('span', 'ev');
    const total = Math.min(100, (value / max) * 100);
    const evW = Math.min(total, opts.evPortion * 100);
    ev.style.left = `${Math.max(0, total - evW)}%`;
    ev.style.width = `${evW}%`;
    track.appendChild(ev);
  }
  row.append(track, el('span', 'v', `${value}${opts.mod === 1 ? '↑' : opts.mod === -1 ? '↓' : ''}`));
  return row;
}

export function tierTag(t) { return el('span', `tag tier-${t}`, t); }

/* ------------------------------------------------------------------ */
/* 3D portraits                                                        */
/* ------------------------------------------------------------------ */
// A tiny offscreen renderer bakes each fighter's actual model into a bust
// portrait once, then caches the data URL. Every screen gets real faces
// instead of coloured initials, at the cost of one render per fighter.

const portraitCache = new Map();
let PR = null;
let prKill = null;
let portraitBroken = false;

function portraitRenderer(w, h) {
  if (PR) return PR;
  const canvas = document.createElement('canvas');
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(Math.min(2, globalThis.devicePixelRatio || 1));
  r.setSize(w, h, false);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.15;
  PR = r;
  return r;
}

function scheduleRendererDispose() {
  clearTimeout(prKill);
  prKill = setTimeout(() => {
    try { PR?.dispose(); PR?.forceContextLoss?.(); } catch { /* already gone */ }
    PR = null;
  }, 4000);
}

/** @returns {string|null} data URL, or null if WebGL refused. */
export function portraitFor(id, opts = {}) {
  const w = opts.w || 168, h = opts.h || 210;
  const key = `${id}@${w}x${h}`;
  if (portraitCache.has(key)) return portraitCache.get(key);
  if (portraitBroken) return null;
  const def = getFighter(id);
  if (!def) return null;

  let api = null;
  try {
    const r = portraitRenderer(w, h);
    const scene = new THREE.Scene();
    api = buildFighter(def);
    api.rig.blob.visible = false;
    api.rig.aura.visible = false;
    api.root.rotation.y = -0.34;
    scene.add(api.root);

    const s = api.rig.scale;
    const ty = 1.70 * s;
    const dist = 1.95 * s;
    const a = 0.40, elv = 0.13;
    const cam = new THREE.PerspectiveCamera(30, w / h, 0.01 * s, 40 * s);
    cam.position.set(
      Math.sin(a) * Math.cos(elv) * dist,
      ty + Math.sin(elv) * dist,
      Math.cos(a) * Math.cos(elv) * dist
    );
    cam.lookAt(0, ty, 0);

    const key1 = new THREE.DirectionalLight(0xfff4e0, 2.6);
    key1.position.set(2.4, 3.4, 3.2);
    const rim = new THREE.DirectionalLight(new THREE.Color(def.model?.aura || '#8fb8ff'), 2.0);
    rim.position.set(-2.6, 1.6, -2.4);
    const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x2a2438, 1.05);
    scene.add(key1, rim, hemi);

    r.setSize(w, h, false);
    r.render(scene, cam);
    let url = null;
    try { url = r.domElement.toDataURL('image/webp', 0.9); } catch { url = null; }
    if (!url || url.indexOf('data:image/webp') !== 0) url = r.domElement.toDataURL('image/png');
    portraitCache.set(key, url);
    scheduleRendererDispose();
    return url;
  } catch (e) {
    console.warn('[portrait] falling back to flat badges', e);
    portraitBroken = true;
    return null;
  } finally {
    try { api?.dispose(); } catch { /* nothing to clean */ }
  }
}

/** Pre-bake portraits without blocking the first frame. */
export function warmPortraits(ids = allFighters().map((f) => f.id), perTick = 2) {
  let i = 0;
  const step = () => {
    for (let k = 0; k < perTick && i < ids.length; k++, i++) portraitFor(ids[i]);
    if (i < ids.length) (globalThis.requestIdleCallback || setTimeout)(step, 1);
  };
  (globalThis.requestIdleCallback || setTimeout)(step, 1);
}

/** A portrait element that degrades to a palette medallion. */
export function portrait(id, cls = '') {
  const def = getFighter(id);
  const box = el('div', `pt ${cls}`);
  const pal = def?.model?.palette || {};
  box.style.background = `linear-gradient(170deg, ${pal.primary || '#2c3450'} 0%, #0e1220 88%)`;
  const url = portraitFor(id);
  if (url) {
    const img = el('img');
    img.src = url;
    img.alt = def?.name || id;
    img.loading = 'lazy';
    img.decoding = 'async';
    box.appendChild(img);
  } else {
    const fb = el('div', 'fb', esc((def?.name || '?').slice(0, 2).toUpperCase()));
    box.appendChild(fb);
  }
  return box;
}

/* ------------------------------------------------------------------ */
/* live fighters on the shared stage                                   */
/* ------------------------------------------------------------------ */

/** Adds/removes procedural fighters on `app.stage.scene`. Always dispose(). */
export class StageCast {
  constructor(app) { this.app = app; this.models = []; this.t = 0; }

  /** @param {Array<{id,x?,z?,y?,rotY?,state?,scale?}>} list */
  set(list) {
    this.clear();
    for (const c of list) {
      const def = getFighter(c.id);
      if (!def) continue;
      let f;
      try { f = buildFighter(def); } catch { continue; }
      f.root.position.set(c.x || 0, c.y || 0, c.z || 0);
      f.root.rotation.y = c.rotY ?? 0;
      if (c.scale) f.root.scale.multiplyScalar(c.scale);
      f.state = c.state || 'idle';
      f.facing = c.facing ?? 1;
      this.app.stage.scene.add(f.root);
      this.models.push(f);
    }
    return this;
  }

  update(dt) {
    this.t += dt;
    for (const f of this.models) { try { f.update(dt); } catch { /* keep the frame alive */ } }
  }

  clear() {
    for (const f of this.models) {
      try { this.app.stage.scene.remove(f.root); f.dispose(); } catch { /* already detached */ }
    }
    this.models = [];
  }

  dispose() { this.clear(); }
}

/**
 * Slow orbit around a point, driven through the shared camera director so the
 * battle view's shake and dolly still apply.
 */
export function orbitCamera(app, t, opts = {}) {
  const dir = app.dir;
  if (!dir) return;
  const radius = opts.radius ?? 11;
  const height = opts.height ?? 4.4;
  const speed = opts.speed ?? 0.06;
  const target = opts.target || { x: 0, y: 1.7, z: 0 };
  const a = (opts.angle ?? 0) + t * speed * Math.PI * 2;
  dir.cut({
    pos: new THREE.Vector3(target.x + Math.sin(a) * radius, height, target.z + Math.cos(a) * radius),
    look: new THREE.Vector3(target.x, target.y, target.z),
    fov: opts.fov ?? 40
  });
}

/** Fix the camera on a single point without orbiting. */
export function lookAtCamera(app, pos, look, fov = 34) {
  app.dir?.cut({
    pos: new THREE.Vector3(pos[0], pos[1], pos[2]),
    look: new THREE.Vector3(look[0], look[1], look[2]),
    fov
  });
}

/* ------------------------------------------------------------------ */
/* misc formatting                                                     */
/* ------------------------------------------------------------------ */

export function pct(n) { return `${Math.round(n * 100)}%`; }
export function plural(n, one, many) { return `${n} ${n === 1 ? one : many ?? one + 's'}`; }
export function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60e3) return 'just now';
  if (d < 3600e3) return `${Math.floor(d / 60e3)}m ago`;
  if (d < 86400e3) return `${Math.floor(d / 3600e3)}h ago`;
  return `${Math.floor(d / 86400e3)}d ago`;
}
