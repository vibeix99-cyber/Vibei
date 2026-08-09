// Title / mode select.

import { audio } from '../../audio/audio.js';
import { AI_LEVELS } from '../../core/ai.js';

const CSS = `
.title-wrap{ position:absolute; inset:0; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:26px;
  background:radial-gradient(ellipse at 50% 35%, rgba(0,0,0,0) 0%, rgba(3,5,10,.72) 78%); }
.title-logo{ text-align:center; animation:popIn .6s var(--ease-back) both; }
.title-logo .a{ font-family:var(--font-display); font-size:clamp(40px,9vw,116px); line-height:.9;
  color:#f6f4ea; text-shadow:0 5px 0 #000, 0 0 40px rgba(242,201,76,.5), 0 14px 40px rgba(0,0,0,.8);
  letter-spacing:.02em; }
.title-logo .b{ font-family:var(--font-display); font-size:clamp(18px,3.4vw,42px);
  color:var(--gold); text-shadow:0 3px 0 #000; letter-spacing:.32em; margin-top:2px; }
.title-logo .c{ margin-top:12px; font-weight:600; font-size:clamp(12px,1.5vw,17px); color:#c8cee0; letter-spacing:.22em; text-transform:uppercase; }
.menu-col{ display:flex; flex-direction:column; gap:12px; width:min(360px,80vw); animation:slideUp .5s .12s var(--ease-out) both; }
.menu-col .btn{ width:100%; font-size:clamp(16px,2vw,21px); }
.title-foot{ position:absolute; bottom:14px; width:100%; text-align:center; font-size:12px; color:#7c8296; }
.subpanel{ display:flex; flex-direction:column; gap:10px; width:min(520px,90vw); }
.opt-row{ display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.opt-chip{ padding:8px 14px; border-radius:99px; border:3px solid #000; background:#1b2033; color:#fff;
  font-weight:800; font-size:14px; cursor:pointer; box-shadow:0 3px 0 #000; }
.opt-chip.on{ background:var(--gold); color:#16192a; }
.legal{ position:absolute; bottom:10px; left:0; right:0; text-align:center; font-size:11px; color:#6d7488; }
`;

export class TitleScreen {
  constructor(app) { this.app = app; }

  mount(root) {
    if (!document.getElementById('title-css')) {
      const s = document.createElement('style'); s.id = 'title-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    this.root = root;
    root.innerHTML = `
      <div class="title-wrap">
        <div class="title-logo">
          <div class="a">GRAND LINE</div>
          <div class="b">ARENA</div>
          <div class="c">Tactical fighter battles</div>
        </div>
        <div class="menu-col" id="tmenu"></div>
        <div class="legal">A non-commercial fan tribute. All characters belong to their respective creators.</div>
      </div>`;
    const menu = root.querySelector('#tmenu');
    const mk = (label, cls, fn) => {
      const b = document.createElement('button');
      b.className = `btn ${cls}`; b.textContent = label;
      b.onclick = () => { audio.resume(); audio.sfx('ui_select'); fn(); };
      b.onmouseenter = () => audio.sfx('ui_move');
      menu.appendChild(b); return b;
    };
    mk('⚔  Quick Battle', 'primary', () => this.app.router.go('battle', { mode: 'ai', aiLevel: 'ace', random: true }));
    mk('👥  Versus a Friend', '', () => this.app.router.go('versus'));
    mk('🧭  Single Player', '', () => this.app.router.go('single'));
    mk('🛠  Team Builder', '', () => this.app.router.go('teambuilder'));
    mk('📖  Fighter Dex', '', () => this.app.router.go('dex'));
    mk('⚙  Options', '', () => this.app.router.go('options'));

    this.app.stage.buildArena('colosseum');
    this.app.view?.reset?.();
    this.app.dir?.go?.('wide', 0);
    audio.startMusic('title');
    audio.setIntensity(0.35);
  }

  unmount() { this.root.innerHTML = ''; }
  update() {}
}
