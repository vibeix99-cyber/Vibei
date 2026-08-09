// The battle message box: typewriter, queue, advance prompt.

import { audio } from '../audio/audio.js';

const CSS = `
.textbox{
  position:absolute; left:2.4vw; right:2.4vw; bottom:2.2vh; min-height:96px;
  padding:16px 22px 18px;
  background:linear-gradient(180deg,#1b2033 0%,#0f1322 100%);
  border:3px solid #000; border-radius:16px;
  box-shadow:0 8px 0 rgba(0,0,0,.5), 0 16px 40px rgba(0,0,0,.6), inset 0 0 0 2px rgba(255,255,255,.07);
  color:#f6f4ea; font-family:var(--font-ui); font-size:clamp(17px,2.1vw,23px);
  font-weight:600; line-height:1.35; letter-spacing:.01em;
  display:flex; align-items:center;
  transition:opacity .2s var(--ease-out), transform .25s var(--ease-out);
}
.textbox.hidden{ opacity:0; transform:translateY(16px); pointer-events:none; }
.textbox .txt{ white-space:pre-wrap; }
.textbox .cursor{
  position:absolute; right:18px; bottom:12px; width:0;height:0;
  border-left:9px solid transparent; border-right:9px solid transparent; border-top:12px solid var(--gold);
  animation:bob .7s infinite ease-in-out; opacity:0;
}
.textbox.waiting .cursor{ opacity:1; }
@keyframes bob{ 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(4px) } }
.textbox .txt .crit{ color:#ffe36b; font-weight:800; }
.textbox .txt .super{ color:#ff9c5b; font-weight:800; }
.textbox .txt .weak{ color:#9fb3c8; }
`;

export class TextBox {
  constructor() {
    if (!document.getElementById('textbox-css')) {
      const s = document.createElement('style'); s.id = 'textbox-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    this.el = document.createElement('div');
    this.el.className = 'textbox hidden';
    this.el.innerHTML = `<span class="txt"></span><span class="cursor"></span>`;
    this.$txt = this.el.querySelector('.txt');
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

  clear() { this.queue.length = 0; this.current = null; this.$txt.textContent = ''; this.waitingForInput = false; this.el.classList.remove('waiting'); }

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
      this.$txt.textContent = '';
    } else {
      this.onEmpty?.();
    }
  }

  /** Skip the typewriter, or move to the next line if already complete. */
  advance() {
    if (!this.current) return false;
    if (this.charIdx < this.current.text.length) {
      this.charIdx = this.current.text.length;
      this.$txt.textContent = this.current.text;
      this.waitingForInput = true;
      this.el.classList.add('waiting');
      return true;
    }
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
      this.$txt.textContent = this.current.text.slice(0, this.charIdx);
      if (this.charIdx >= this.current.text.length) {
        this.waitingForInput = true;
        this.el.classList.add('waiting');
        this._waitT = 0;
      }
    } else {
      this._waitT += dt * 1000;
      let hold = this.current.hold ?? this.autoAdvanceMs;
      if (this.queue.length) hold = Math.max(this.minHoldMs, hold / (1 + this.queue.length * 0.6));
      if (hold > 0 && this._waitT >= hold) this._next();
    }
  }
}
