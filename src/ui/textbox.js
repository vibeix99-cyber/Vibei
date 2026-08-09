// The battle message box: typewriter, queue, advance prompt.
//
// The important property, kept from the previous version: **text never owns the
// clock**. Animation paces the turn; the box reads out alongside it and speeds
// up when lines stack (`backlog`, `rush`, `autoAdvanceMs`). What is new is the
// reading experience — inline emphasis for crits / effectiveness / status, a
// real advance affordance with a visible auto-advance countdown, and a box that
// is sized so a line can never be clipped or land under the menus.

import { audio } from '../audio/audio.js';

const CSS = `
.textbox{
  position:absolute; z-index:var(--z-dock);
  left:var(--edge); right:var(--dock-r); bottom:var(--edge-b); height:var(--pane-h);
  padding:10px 16px 10px 18px;
  background:linear-gradient(180deg,#20263c 0%,#0d1120 100%);
  border:var(--bd) solid var(--edge-ink); border-radius:15px;
  box-shadow:var(--lip), 0 14px 34px rgba(0,0,0,.55), inset 0 0 0 2px rgba(255,255,255,.07);
  color:var(--text-inv); font-family:var(--font-ui); font-size:var(--fs-xl);
  font-weight:600; line-height:1.24; letter-spacing:.005em;
  display:flex; align-items:center; overflow:hidden; cursor:pointer;
  transition:opacity .18s var(--ease-out), transform .22s var(--ease-out);
}
.textbox.hidden{ opacity:0; transform:translateY(14px); pointer-events:none; }
/* the FIGHT grid takes the whole dock — the move info panel speaks instead */
body[data-cmd="moves"] .textbox{ opacity:0; pointer-events:none; }

.textbox .txt{
  display:block; width:100%; white-space:pre-wrap; overflow:hidden;
  display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:3;
}
.textbox .txt.long{ font-size:.86em; -webkit-line-clamp:4; }

/* inline emphasis */
.textbox .em-crit{ color:#ffe36b; font-weight:900; text-shadow:0 0 12px rgba(255,227,107,.55); }
.textbox .em-super{ color:#68e39a; font-weight:900; }
.textbox .em-weak{ color:#c69a6a; font-weight:800; }
.textbox .em-immune{ color:#9aa3bd; font-weight:800; }
.textbox .em-status{ color:#ff9c5b; font-weight:900; }
.textbox .em-move{ color:#ffffff; font-weight:900; }
.textbox .em-name{ color:#ffd84d; font-weight:800; }
.textbox .em-faint{ color:#ff7676; font-weight:900; }
.textbox .em-heal{ color:#8cffb8; font-weight:900; }
/* whole-line styles still supported via the event style field */
.textbox .txt.crit{ color:#ffe36b; }
.textbox .txt.super{ color:#9dfbc2; }
.textbox .txt.weak{ color:#c8d2e2; }

/* advance affordance: a countdown ring that fills while the line is held, then
   a bobbing chevron once the reader is genuinely being waited on. */
.tb-adv{
  position:absolute; right:10px; bottom:6px; width:22px; height:22px;
  display:grid; place-items:center; opacity:0; transition:opacity .12s;
}
.textbox.waiting .tb-adv{ opacity:1; }
.tb-adv .ring{
  position:absolute; inset:0; border-radius:50%;
  background:conic-gradient(var(--gold) calc(var(--p,0) * 360deg), rgba(255,255,255,.14) 0);
  -webkit-mask:radial-gradient(circle, transparent 56%, #000 58%);
  mask:radial-gradient(circle, transparent 56%, #000 58%);
}
.tb-adv .chev{
  width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent;
  border-top:8px solid var(--gold); animation:bob .7s infinite ease-in-out;
}
.tb-more{
  position:absolute; right:34px; bottom:8px; font-size:10px; font-weight:900;
  letter-spacing:.1em; color:#7b839c; opacity:0; transition:opacity .12s;
}
.textbox.stacked .tb-more{ opacity:1; }

@media (orientation:portrait) and (max-width:820px){
  .textbox{
    left:var(--edge); right:var(--edge);
    bottom:calc(var(--edge-b) + var(--cmd-h) + var(--gap));
    height:var(--pane-h); padding:8px 14px;
  }
}
@media (max-height:520px){
  .textbox{ padding:6px 14px; border-radius:12px; }
  .textbox .txt{ -webkit-line-clamp:3; }
}
`;

/* ------------------------------------------------------------------ */
/* inline emphasis                                                     */
/* ------------------------------------------------------------------ */

// Ordered: first match wins for a given span of text.
const EMPHASIS = [
  [/A critical hit!/gi, 'crit'],
  [/It's devastatingly effective!/gi, 'super'],
  [/It's super effective!/gi, 'super'],
  [/It's not very effective…?/gi, 'weak'],
  [/It barely scratches[^!.…]*[!.…]/gi, 'weak'],
  [/It doesn't affect[^!.…]*[!.…]/gi, 'immune'],
  [/\bfainted!/gi, 'faint'],
  [/\bwas burned!|\bwas poisoned!|\bwas badly poisoned!|\bis paralyzed!|\bfell asleep!|\bwas frozen solid!/gi, 'status'],
  [/\brecovered health!|\bregained health!/gi, 'heal'],
  [/\bused ([^!]+)!/gi, 'move'],
  [/\bmissed!|\bbut it failed!|\bavoided the attack!/gi, 'weak']
];

/**
 * Split a line into `[{text, cls}]` runs. Runs are what the typewriter reveals,
 * so emphasis appears as the characters land rather than snapping in at the end.
 */
export function segment(text) {
  const marks = [];
  for (const [re, cls] of EMPHASIS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      // `used X!` → emphasise only the move name
      let start = m.index, end = m.index + m[0].length;
      if (cls === 'move' && m[1]) { start = m.index + m[0].indexOf(m[1]); end = start + m[1].length; }
      if (marks.some((k) => start < k.end && end > k.start)) continue;   // no overlaps
      marks.push({ start, end, cls });
      if (m[0].length === 0) re.lastIndex++;
    }
  }
  marks.sort((a, b) => a.start - b.start);
  const out = [];
  let i = 0;
  for (const k of marks) {
    if (k.start > i) out.push({ text: text.slice(i, k.start), cls: '' });
    out.push({ text: text.slice(k.start, k.end), cls: k.cls });
    i = k.end;
  }
  if (i < text.length) out.push({ text: text.slice(i), cls: '' });
  return out.length ? out : [{ text, cls: '' }];
}

export class TextBox {
  constructor() {
    if (!document.getElementById('textbox-css')) {
      const s = document.createElement('style'); s.id = 'textbox-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    this.el = document.createElement('div');
    this.el.className = 'textbox hidden';
    this.el.setAttribute('role', 'status');
    this.el.setAttribute('aria-live', 'polite');
    this.el.innerHTML =
      `<span class="txt"></span>` +
      `<span class="tb-more">+<b class="n">0</b></span>` +
      `<span class="tb-adv"><span class="ring"></span><span class="chev"></span></span>`;
    this.$txt = this.el.querySelector('.txt');
    this.$adv = this.el.querySelector('.tb-adv');
    this.$ring = this.el.querySelector('.ring');
    this.$more = this.el.querySelector('.tb-more');
    this.$moreN = this.el.querySelector('.tb-more .n');

    this.queue = [];
    this.current = null;
    this.charIdx = 0;
    this.acc = 0;
    this.cps = 110;             // characters per second (base; scaled by battle speed)
    this.instant = false;
    this.waitingForInput = false;
    // Lines clear themselves. Reading speed, not button-mashing, sets the floor.
    this.autoAdvanceMs = 260;
    this.minHoldMs = 180;
    this._waitT = 0;
    this._hold = 0;
    this._segs = [];
    this._nodes = [];
    this.onEmpty = null;
    this.el.addEventListener('click', () => this.advance());
  }

  mount(p) { p.appendChild(this.el); }
  show() { this.el.classList.remove('hidden'); }
  hide() { this.el.classList.add('hidden'); }

  /** @param {string} text @param {{style?:string, hold?:number}} opts */
  say(text, opts = {}) {
    if (!text) return;
    this.queue.push({ text, style: opts.style || '', hold: opts.hold ?? null });
    if (!this.current) this._next();
    this.show();
  }

  clear() {
    this.queue.length = 0;
    this.current = null;
    this.$txt.textContent = '';
    this._segs = []; this._nodes = [];
    this.waitingForInput = false;
    this.el.classList.remove('waiting', 'stacked');
  }

  get busy() { return !!this.current || this.queue.length > 0; }

  /** How many lines are waiting behind the one being typed. */
  get backlog() { return this.queue.length + (this.current ? 1 : 0); }

  _next() {
    this.current = this.queue.shift() || null;
    this.charIdx = 0; this.acc = 0; this._waitT = 0;
    this.waitingForInput = false;
    this.el.classList.remove('waiting');
    if (this.current) {
      this.$txt.className = `txt ${this.current.style}`;
      if (this.current.text.length > 74) this.$txt.classList.add('long');
      this._build(this.current.text);
      this._paint(0);
    } else {
      this.$txt.textContent = '';
      this._segs = []; this._nodes = [];
      this._syncMore();
      this.onEmpty?.();
    }
    this._syncMore();
  }

  /** Build the emphasis runs for a line and lay out empty spans for them. */
  _build(text) {
    this._segs = segment(text);
    this.$txt.textContent = '';
    this._nodes = this._segs.map((s) => {
      const n = document.createElement('span');
      if (s.cls) n.className = `em-${s.cls}`;
      this.$txt.appendChild(n);
      return n;
    });
  }

  /** Reveal the first `n` characters across the runs. */
  _paint(n) {
    let left = n;
    for (let i = 0; i < this._segs.length; i++) {
      const s = this._segs[i], node = this._nodes[i];
      const take = Math.max(0, Math.min(s.text.length, left));
      const want = take ? s.text.slice(0, take) : '';
      if (node.textContent !== want) node.textContent = want;
      left -= take;
    }
  }

  _syncMore() {
    const n = this.queue.length;
    this.el.classList.toggle('stacked', n > 0);
    if (n > 0 && this.$moreN.textContent !== String(n)) this.$moreN.textContent = String(n);
  }

  /** Skip the typewriter, or move to the next line if already complete. */
  advance() {
    if (!this.current) return false;
    if (this.charIdx < this.current.text.length) {
      this.charIdx = this.current.text.length;
      this._paint(this.charIdx);
      this.waitingForInput = true;
      this.el.classList.add('waiting');
      this._waitT = 0;
      return true;
    }
    audio.sfx('ui_move');
    this._next();
    return true;
  }

  update(dt) {
    if (!this.current) return;
    // Pressure valve: the more lines are stacked up, the faster we read them out,
    // so a busy turn never turns into a wall of waiting.
    const rush = 1 + Math.min(3, this.queue.length) * 0.9;
    if (this.charIdx < this.current.text.length) {
      this.acc += dt * (this.instant ? 100000 : this.cps * rush);
      while (this.acc >= 1 && this.charIdx < this.current.text.length) {
        this.acc -= 1;
        const ch = this.current.text[this.charIdx];
        this.charIdx++;
        if (ch !== ' ' && this.charIdx % 2 === 0) audio.sfx('text_blip');
      }
      this._paint(this.charIdx);
      if (this.charIdx >= this.current.text.length) {
        this.waitingForInput = true;
        this.el.classList.add('waiting');
        this._waitT = 0;
      }
      this.$ring.style.setProperty('--p', 0);
    } else {
      this._waitT += dt * 1000;
      let hold = this.current.hold ?? this.autoAdvanceMs;
      if (this.queue.length) hold = Math.max(this.minHoldMs, hold / (1 + this.queue.length * 0.6));
      this._hold = hold;
      // hold === 0 means "sit here until something else happens" (the prompt line)
      this.$ring.style.setProperty('--p', hold > 0 ? Math.min(1, this._waitT / hold) : 0);
      if (hold > 0 && this._waitT >= hold) this._next();
    }
    this._syncMore();
  }
}
