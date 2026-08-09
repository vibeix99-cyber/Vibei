// Bootstrap: stage, shared UI, router, game loop, and the window.__ARENA surface.

import * as THREE from 'three';
import { Stage } from './render/scene.js';
import { BattleView } from './render/battleView.js';
import { NamePlate, FieldBanner, injectHudCss } from './ui/hud.js';
import { TextBox } from './ui/textbox.js';
import { audio } from './audio/audio.js';
import { TitleScreen } from './ui/screens/title.js';
import { BattleScreen } from './ui/screens/battle.js';
import { ResultsScreen } from './ui/screens/results.js';
import { VersusScreen, SingleScreen, DexScreen, TeamBuilderScreen, OptionsScreen } from './ui/screens/simple.js';

import * as engine from './core/engine.js';
import { MOVES } from './data/moves.js';
import { FIGHTERS, makeDefaultMember, allFighters } from './data/fighters.js';
import { ITEMS, defaultBag } from './data/items.js';
import { ABILITIES } from './core/abilities.js';
import { ARENAS } from './data/arenas.js';
import { chooseAction } from './core/ai.js';
import { RNG, seedFromString } from './core/rng.js';

export const VERSION = '0.1.0';

const DEFAULT_SETTINGS = {
  masterVol: 0.7, musicVol: 0.35, sfxVol: 0.8,
  battleSpeed: 1, reducedMotion: false, foeHpNumbers: false, muted: false
};

class Router {
  constructor(app) { this.app = app; this.screens = {}; this.current = null; this.currentId = null; }
  register(id, S) { this.screens[id] = S; }
  go(id, params = {}) {
    if (!this.screens[id]) { console.warn('no screen', id); return; }
    this.current?.unmount?.();
    this.app.uiScreen.innerHTML = '';
    const S = this.screens[id];
    this.current = new S(this.app);
    this.currentId = id;
    this.current.mount(this.app.uiScreen, params);
    this.app.onScreenChange?.(id, params);
  }
}

class App {
  constructor() {
    injectHudCss();
    this.canvas = document.getElementById('gl');
    this.ui = document.getElementById('ui');
    this.uiScreen = document.createElement('div');
    this.uiScreen.className = 'screen';
    this.ui.appendChild(this.uiScreen);
    this.uiOverlay = document.createElement('div');
    this.uiOverlay.className = 'screen';
    this.uiOverlay.style.pointerEvents = 'none';
    this.ui.appendChild(this.uiOverlay);

    this.settings = this.loadSettings();
    this.stage = new Stage(this.canvas);
    this.stage.feel.reduced = this.settings.reducedMotion
      || matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.audio = audio;
    audio.init();
    audio.setMaster(this.settings.masterVol);
    audio.setMusicVol(this.settings.musicVol);
    audio.setSfxVol(this.settings.sfxVol);
    audio.setMuted(this.settings.muted);

    this.plates = [new NamePlate(0), new NamePlate(1)];
    this.plates[1].showNumbers = this.settings.foeHpNumbers;
    this.plates.forEach((p) => p.mount(this.uiOverlay));
    this.textbox = new TextBox();
    this.textbox.mount(this.ui);
    this.textbox.hide();
    this.fieldBanner = new FieldBanner();
    this.fieldBanner.mount(this.uiOverlay);

    this.view = new BattleView(this.stage, this.uiOverlay, this.plates, this.textbox, this.fieldBanner);
    this.dir = this.view.dir;

    this.router = new Router(this);
    this.router.register('title', TitleScreen);
    this.router.register('battle', BattleScreen);
    this.router.register('results', ResultsScreen);
    this.router.register('versus', VersusScreen);
    this.router.register('single', SingleScreen);
    this.router.register('dex', DexScreen);
    this.router.register('teambuilder', TeamBuilderScreen);
    this.router.register('options', OptionsScreen);

    addEventListener('keydown', (e) => this.onKey(e));
    addEventListener('pointerdown', () => audio.resume(), { once: true });
    addEventListener('keydown', () => audio.resume(), { once: true });

    this.last = performance.now();
    this._firstFrame = null;
    this.readyPromise = new Promise((res) => { this._firstFrame = res; });
    requestAnimationFrame((t) => this.loop(t));
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem('gla.settings');
      return { ...DEFAULT_SETTINGS, ...(raw ? JSON.parse(raw) : {}) };
    } catch { return { ...DEFAULT_SETTINGS }; }
  }
  saveSettings() {
    try { localStorage.setItem('gla.settings', JSON.stringify(this.settings)); } catch { /* private mode */ }
  }

  onKey(e) {
    if (e.key === 'm' || e.key === 'M') {
      this.settings.muted = !this.settings.muted;
      audio.setMuted(this.settings.muted);
      this.saveSettings();
      return;
    }
    if (e.key === 'Escape' && this.router.currentId !== 'title') { this.router.go('title'); return; }
    if (this.router.current?.key?.(e)) e.preventDefault();
  }

  loop(now) {
    const raw = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const dt = this.stage.feel.update(raw);
    this.textbox.update(dt || raw * 0.2);
    this.view.update(dt);
    this.router.current?.update?.(dt);
    this.stage.render(dt);
    this.stage.tickStats(raw);
    if (this._firstFrame) { this._firstFrame(); this._firstFrame = null; }
    requestAnimationFrame((t) => this.loop(t));
  }
}

const app = new App();
app.router.go('title');

/* ------------------------------------------------------------------ */
/* window.__ARENA — see docs/ARCHITECTURE.md §7                        */
/* ------------------------------------------------------------------ */

window.__ARENA = {
  version: VERSION,
  app,
  ready: app.readyPromise,
  router: app.router,
  stage: app.stage,
  scene: app.stage.scene,
  audio,
  data: { moves: MOVES, fighters: FIGHTERS, items: ITEMS, abilities: ABILITIES, arenas: ARENAS },
  sim: { ...engine, chooseAction, RNG, seedFromString, makeDefaultMember, defaultBag },
  battle: {
    start(opts = {}) { app.router.go('battle', opts); },
    quick(seed) { app.router.go('battle', { mode: 'ai', aiLevel: 'ace', teamSize: 3, seed }); },
    screen() { return app.router.currentId === 'battle' ? app.router.current : null; },
    state() {
      const s = this.screen();
      return s ? engine.publicView(s.battle) : null;
    },
    raw() { const s = this.screen(); return s ? s.battle : null; },
    choose(side, choice) {
      const s = this.screen();
      if (!s) return false;
      if (s.waitingChoice !== side) return false;
      s.onPlayerChoice(choice);
      return true;
    },
    waitingFor() { const s = this.screen(); return s ? s.waitingChoice : null; },
    events() { const s = this.screen(); return s ? s.battle.events : []; },
    log() { const s = this.screen(); return s ? s.battle.log : []; },
    isAnimating() { return app.view.busy; },
    skipAnimations(on) { app.view.speed = on ? 8 : (app.settings.battleSpeed || 1); app.textbox.instant = !!on; app.textbox.autoAdvanceMs = on ? 1 : 260; },
    setSpeed(v) { app.view.speed = v; app.textbox.cps = 110 * v; },
    advanceText() { return app.textbox.advance(); }
  },
  perf: {
    get fps() { return app.stage.stats.fps; },
    get drawCalls() { return app.stage.stats.drawCalls; },
    get tris() { return app.stage.stats.tris; }
  },
  debug: {
    screens: () => Object.keys(app.router.screens),
    fighters: () => allFighters().map((f) => f.id),
    THREE
  }
};

console.log(`%cGRAND LINE ARENA v${VERSION}`, 'font-weight:bold;color:#f2c94c');
