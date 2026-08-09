// Post-battle results.

import { audio } from '../../audio/audio.js';

const CSS = `
.results{ position:absolute; inset:0; display:flex; flex-direction:column; align-items:center;
  justify-content:center; gap:20px; background:rgba(4,6,12,.86); }
.results .banner{ font-family:var(--font-display); font-size:clamp(34px,8vw,90px); text-shadow:0 6px 0 #000; animation:popIn .5s var(--ease-back) both; }
.results .banner.win{ color:#ffe36b; } .results .banner.lose{ color:#ff8a8a; }
.results .sub{ font-size:18px; color:#c8cee0; }
.results .logbox{ width:min(700px,90vw); max-height:34vh; overflow:auto; padding:14px 18px;
  background:#0f1322; border:3px solid #000; border-radius:14px; font-size:14px; line-height:1.5; color:#cfd6e8; }
.results .row{ display:flex; gap:10px; flex-wrap:wrap; justify-content:center; }
`;

export class ResultsScreen {
  constructor(app) { this.app = app; }
  mount(root, params = {}) {
    if (!document.getElementById('results-css')) {
      const s = document.createElement('style'); s.id = 'results-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    this.root = root;
    const won = params.winner === 0;
    const draw = params.winner === 'draw';
    root.innerHTML = `
      <div class="results">
        <div class="banner ${won ? 'win' : 'lose'}">${draw ? 'DRAW' : won ? 'VICTORY' : 'DEFEAT'}</div>
        <div class="sub">${draw ? 'Both crews fell.' : `${params.sides?.[params.winner] ?? ''} takes it in ${params.turns} turns.`}</div>
        <div class="logbox">${(params.log || []).slice(-40).map((l) => `<div>${l}</div>`).join('')}</div>
        <div class="row">
          <button class="btn primary" id="again">Rematch</button>
          <button class="btn" id="home">Main Menu</button>
        </div>
      </div>`;
    root.querySelector('#again').onclick = () => {
      audio.sfx('ui_select');
      this.app.router.go('battle', { ...(params.replayFrom || {}), seed: undefined });
    };
    root.querySelector('#home').onclick = () => { audio.sfx('ui_back'); this.app.router.go('title'); };
  }
  unmount() { this.root.innerHTML = ''; }
  update() {}
}
