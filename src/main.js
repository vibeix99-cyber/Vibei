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
import { VersusScreen, SingleScreen, OptionsScreen } from './ui/screens/simple.js';
import { TeamBuilderScreen } from './ui/screens/teambuilder.js';
import { ModeScreen } from './ui/screens/modes.js';
import { TournamentScreen, GauntletScreen, DailyScreen } from './ui/screens/runs.js';
import { LinkScreen, LinkBattleScreen, dropLink } from './ui/screens/link.js';
import { TutorialScreen } from './ui/screens/tutorial.js';
import { DexScreen } from './ui/screens/dex.js';
import { openHelp, closeHelp, isHelpOpen } from './ui/screens/help.js';

import * as engine from './core/engine.js';
import { MOVES } from './data/moves.js';
import { FIGHTERS, makeDefaultMember, allFighters } from './data/fighters.js';
import { ITEMS, defaultBag } from './data/items.js';
import { ABILITIES } from './core/abilities.js';
import { ARENAS } from './data/arenas.js';
import { chooseAction } from './core/ai.js';
import { RNG, seedFromString } from './core/rng.js';

import * as Save from './meta/save.js';
import * as Progression from './meta/progression.js';
import * as Runs from './meta/runs.js';
import * as Opponents from './meta/opponents.js';
import * as TeamAnalysis from './meta/teamAnalysis.js';
import * as BattleReport from './meta/battleReport.js';
import * as Flow from './meta/flow.js';
import * as TeamCode from './meta/teamcode.js';
import * as Link from './net/link.js';

export const VERSION = '0.2.0';

/** Screens that own a live `battle` — used by the router and __ARENA.battle. */
const BATTLE_SCREENS = new Set(['battle', 'linkbattle', 'tutorial']);

class Router {
  constructor(app) { this.app = app; this.screens = {}; this.current = null; this.currentId = null; }
  register(id, S) { this.screens[id] = S; }
  go(id, params = {}) {
    if (!this.screens[id]) { console.warn('no screen', id); return; }
    // Keep the battle that just finished so the results screen can report on
    // it — and so "Rematch" can field the same two crews.
    if (this.current?.battle) this.app.lastBattle = this.current.battle;
    try { this.current?.unmount?.(); }
    catch (e) { console.warn('[router] unmount failed', e); }
    this.app.uiScreen.innerHTML = '';
    const S = this.screens[id];
    this.current = new S(this.app);
    this.currentId = id;
    try {
      this.current.mount(this.app.uiScreen, params);
    } catch (e) {
      console.error('[router] mount failed', id, e);
      this.mountFallback(id, e);
    }
    this.app.onScreenChange?.(id, params);
  }
  /** A screen that throws must not leave a black hole; always offer a way out. */
  mountFallback(id, err) {
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;gap:14px;align-items:center;'
      + 'justify-content:center;background:rgba(4,6,12,.94);color:#f6f4ea;font-family:var(--font-ui);padding:24px;text-align:center';
    d.innerHTML = `<div style="font-size:40px">🧯</div>
      <div style="font-family:var(--font-display);font-size:24px">The "${id}" screen failed to open</div>
      <div style="max-width:60ch;color:#9fabc6;font-size:13px">${String(err?.message || err).slice(0, 300)}</div>`;
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = 'Back to the title screen';
    b.onclick = () => this.go('title');
    d.appendChild(b);
    this.app.uiScreen.appendChild(d);
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

    // Everything the game remembers lives in one versioned file, and loading it
    // can never throw — see meta/save.js.
    this.save = Save.load();
    this.settings = this.save.settings;
    this.lastBattle = null;

    this.stage = new Stage(this.canvas);
    this.audio = audio;
    audio.init();
    this.applySettings();

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
    this.router.register('mode', ModeScreen);
    this.router.register('tournament', TournamentScreen);
    this.router.register('gauntlet', GauntletScreen);
    this.router.register('daily', DailyScreen);
    this.router.register('link', LinkScreen);
    this.router.register('linkbattle', LinkBattleScreen);
    this.router.register('tutorial', TutorialScreen);

    this.openHelp = (tab) => openHelp(this, tab);
    this.closeHelp = closeHelp;

    addEventListener('keydown', (e) => this.onKey(e));
    addEventListener('pointerdown', () => audio.resume(), { once: true });
    addEventListener('keydown', () => audio.resume(), { once: true });
    // A tab close mid-link should tell the other side rather than time out.
    addEventListener('pagehide', () => { try { dropLink('page hidden'); } catch { /* nothing to close */ } });

    this.last = performance.now();
    this._firstFrame = null;
    this.readyPromise = new Promise((res) => { this._firstFrame = res; });
    requestAnimationFrame((t) => this.loop(t));
  }

  /** Push every setting into the systems that consume it. */
  applySettings() {
    const s = this.settings;
    this.stage.feel.reduced = !!s.reducedMotion
      || matchMedia('(prefers-reduced-motion: reduce)').matches;
    audio.setMaster(s.masterVol);
    audio.setMusicVol(s.musicVol);
    audio.setSfxVol(s.sfxVol);
    audio.setMuted(s.muted);
    if (this.plates?.[1]) this.plates[1].showNumbers = !!s.foeHpNumbers;
    if (this.view) this.view.speed = s.battleSpeed || 1;
  }

  /** After an import or a reset the settings object identity changes. */
  reloadSettings() {
    this.save = Save.data();
    this.settings = this.save.settings;
    this.applySettings();
  }

  saveSettings() {
    // A failed write is reported in Options, never thrown at the player.
    Save.commit();
  }

  onKey(e) {
    if (e.key === 'm' || e.key === 'M') {
      if (/input|textarea|select/i.test(e.target?.tagName || '')) return;
      this.settings.muted = !this.settings.muted;
      audio.setMuted(this.settings.muted);
      this.saveSettings();
      return;
    }
    if (e.key === '?' || (e.key === 'h' && !e.metaKey && !e.ctrlKey)) {
      if (/input|textarea|select/i.test(e.target?.tagName || '')) return;
      isHelpOpen() ? closeHelp() : openHelp(this);
      return;
    }
    if (e.key === 'Escape') {
      if (isHelpOpen()) { closeHelp(); return; }
      if (this.router.currentId !== 'title') { this.router.go('title'); return; }
    }
    if (this.router.current?.key?.(e)) e.preventDefault();
  }

  loop(now) {
    const raw = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const dt = this.stage.feel.update(raw);
    this.textbox.update(dt || raw * 0.2);
    this.view.update(dt);
    try { this.router.current?.update?.(dt); }
    catch (e) { if (!this._loopWarned) { this._loopWarned = true; console.warn('[loop] screen update failed', e); } }
    this.stage.render(dt);
    this.stage.tickStats(raw);
    if (this._firstFrame) { this._firstFrame(); this._firstFrame = null; }
    requestAnimationFrame((t) => this.loop(t));
  }
}

const app = new App();
app.router.go('title');

/* ------------------------------------------------------------------ */
/* test fixtures — deterministic save states for the shot harness      */
/* ------------------------------------------------------------------ */

function tunedTeam() {
  const pick = ['luffy', 'zoro', 'nami', 'law', 'crocodile', 'mihawk']
    .filter((id) => FIGHTERS.some((f) => f.id === id));
  const members = pick.map((id, i) => {
    const m = makeDefaultMember(id, 50);
    m.evs = i % 2
      ? { hp: 252, atk: 0, def: 252, spa: 0, spd: 4, spe: 0 }
      : { hp: 4, atk: 252, def: 0, spa: 0, spd: 0, spe: 252 };
    m.ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
    m.nature = i % 2 ? 'impish' : 'jolly';
    m.item = i === 0 ? 'power_band' : null;
    return m;
  });
  return { name: 'Straw Hats', members };
}

const FIXTURES = {
  /** A clean slate. */
  empty() { Save.resetSave(); },

  /** Six tuned fighters, saved and active. */
  team() {
    Save.resetSave();
    Progression.saveTeam(tunedTeam());
  },

  /** Enough of a record that every mode is unlocked. */
  progress() {
    FIXTURES.team();
    Save.patch((s) => {
      s.xp = 1750;
      s.record = { ...s.record, played: 14, won: 9, lost: 5, drawn: 0, streak: 3, bestStreak: 5, turns: 160, damageDealt: 9400, damageTaken: 8100, kos: 26, koed: 19, perfect: 2 };
      s.fighters.luffy = { battles: 9, wins: 6, kos: 11, damage: 3400, faints: 3, seen: 1 };
      Progression.checkUnlocks(s);
    });
  },

  /** A tournament halfway through: one round won, one to play. */
  tournament() {
    FIXTURES.progress();
    const team = Progression.activeTeam();
    const run = Runs.createTournament({
      cupId: 'grand_line_cup', seed: 4242,
      playerTeam: (team?.members || []).slice(0, 3), teamName: team?.name || 'Straw Hats'
    });
    Runs.advanceTournament(run, true, { turns: 11 });
    Runs.storeRun('tournament', run);
  },

  /** A tournament taken all the way. */
  tournamentWon() {
    FIXTURES.tournament();
    const run = Runs.loadRun('tournament');
    let guard = 0;
    while (run.status === 'active' && guard++ < 8) Runs.advanceTournament(run, true, { turns: 9 });
    Runs.storeRun('tournament', run);
    Progression.awardTrophy({ id: run.cupId, name: Runs.getCup(run.cupId).name, tier: 'Paradise', cupId: run.cupId });
  },

  /** A gauntlet two stages in, one fighter already lost. */
  gauntlet() {
    FIXTURES.progress();
    const team = Progression.activeTeam();
    const run = Runs.createGauntlet({ seed: 777, playerTeam: (team?.members || []).slice(0, 4), teamName: team?.name || 'Straw Hats' });
    Runs.advanceGauntlet(run, true, { turns: 8, playerTeam: [{ speciesId: run.roster[1]?.speciesId, fainted: true }] });
    run.boons.push('medic');
    Runs.advanceGauntlet(run, true, { turns: 12, playerTeam: [] });
    Runs.storeRun('gauntlet', run);
  },

  /** A save file that is not JSON at all. Reload to see the recovery path. */
  corrupt() { Save.__corruptForTest('{"v":2,"teams":'); }
};

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
  textbox: app.textbox,
  data: { moves: MOVES, fighters: FIGHTERS, items: ITEMS, abilities: ABILITIES, arenas: ARENAS },
  sim: { ...engine, chooseAction, RNG, seedFromString, makeDefaultMember, defaultBag },
  meta: {
    save: Save,
    progression: Progression,
    runs: Runs,
    opponents: Opponents,
    analysis: TeamAnalysis,
    report: BattleReport,
    flow: Flow,
    teamcode: TeamCode,
    link: Link
  },
  battle: {
    start(opts = {}) { app.router.go('battle', opts); },
    quick(seed) { app.router.go('battle', { mode: 'ai', aiLevel: 'ace', teamSize: 3, seed, meta: { kind: 'quick' } }); },
    screen() { return BATTLE_SCREENS.has(app.router.currentId) && app.router.current?.battle ? app.router.current : null; },
    state() {
      const s = this.screen();
      return s ? engine.publicView(s.battle) : null;
    },
    raw() { const s = this.screen(); return s ? s.battle : null; },
    last() { return app.lastBattle; },
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
    /** Seed a known save state, for screenshots and persistence tests. */
    fixture(name) {
      const fn = FIXTURES[name];
      if (!fn) return { ok: false, error: `no fixture "${name}"`, available: Object.keys(FIXTURES) };
      fn();
      app.reloadSettings();
      return { ok: true, name, save: Save.status() };
    },
    fixtures: () => Object.keys(FIXTURES),
    saveHealth: () => Save.status(),
    saveJson: () => Save.exportSave(),
    THREE
  }
};

console.log(`%cGRAND LINE ARENA v${VERSION}`, 'font-weight:bold;color:#f2c94c');
