// Link Battle — two devices, no server.
//
// The host produces a GLA-HOST code, the guest pastes it and hands back a
// GLA-JOIN code, and from then on the only thing crossing the wire is one
// Choice per turn: both peers run the identical seeded simulation
// (docs/ARCHITECTURE.md §0). This screen is the whole handshake, plus every
// way it can go wrong stated in words rather than a silent spinner.
//
// The battle itself reuses the real battle screen. `LinkBattleScreen` extends
// it and replaces only the two places that decide *where a choice comes from*
// — see the handoff note in docs/HANDOFF.md asking for a first-class hook.

import { audio } from '../../audio/audio.js';
import { publicView } from '../../core/engine.js';
import { getFighter, makeDefaultMember, allFighters } from '../../data/fighters.js';
import { ARENAS } from '../../data/arenas.js';
import { RNG } from '../../core/rng.js';
import * as Save from '../../meta/save.js';
import { activeTeam } from '../../meta/progression.js';
import { LinkTransport, LinkSession } from '../../net/link.js';
import { BattleScreen } from './battle.js';
import {
  shell, injectScreenCss, el, esc, button, portrait, toast, modal, copyText, StageCast, orbitCamera
} from './common.js';

const CSS = `
.lk-steps{ display:grid; gap:13px; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); align-items:start; }
.lk-step{ display:flex; gap:11px; align-items:flex-start; padding:11px 13px; border-radius:12px;
  background:rgba(255,255,255,.04); font-size:13.5px; line-height:1.45; color:#c3cde3; }
.lk-step .n{ flex:0 0 auto; width:23px; height:23px; border-radius:50%; background:var(--gold); color:#16192a;
  font-weight:900; font-size:13px; display:flex; align-items:center; justify-content:center; }
.lk-step.done{ opacity:.5; }
.lk-step.done .n{ background:#4ad07a; }
.lk-code{ width:100%; min-height:96px; font-family:ui-monospace,Menlo,Consolas,monospace; font-size:11.5px;
  background:#0d1120; color:#9fd6ff; border:3px solid #000; border-radius:12px; padding:10px; resize:vertical;
  word-break:break-all; box-shadow:inset 0 2px 10px rgba(0,0,0,.6); }
.lk-code.paste{ color:#ffe8b0; }
.lk-row{ display:flex; gap:8px; flex-wrap:wrap; margin-top:9px; align-items:center; }
.lk-state{ display:flex; align-items:center; gap:9px; font-size:13px; font-weight:800; color:#cfd8ea;
  padding:8px 12px; border-radius:99px; background:rgba(255,255,255,.05); }
.lk-state .dot{ width:9px; height:9px; border-radius:50%; background:var(--warn); box-shadow:0 0 8px var(--warn);
  animation:lowHpBlink 1s infinite; }
.lk-state.ok .dot{ background:var(--ok); box-shadow:0 0 8px var(--ok); animation:none; }
.lk-state.bad .dot{ background:var(--danger); box-shadow:0 0 8px var(--danger); animation:none; }
.lk-crew{ display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
.lk-crew .one{ width:66px; text-align:center; font-size:11px; }
.lk-crew .one .nm{ margin-top:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:700; }
.linkpill{ display:flex; align-items:center; gap:7px; padding:0 12px; height:32px; border-radius:99px;
  background:rgba(11,13,20,.86); border:2px solid var(--edge-ink); font-weight:900; font-size:11px;
  letter-spacing:.12em; color:#9fd6ff; text-transform:uppercase; box-shadow:0 4px 14px rgba(0,0,0,.5); white-space:nowrap; }
.linkpill .dot{ width:7px; height:7px; border-radius:50%; background:var(--ok); box-shadow:0 0 6px var(--ok); }
.linkpill.wait{ color:var(--warn); } .linkpill.wait .dot{ background:var(--warn); animation:lowHpBlink .8s infinite; }
.linkpill.bad{ color:#ff9a9a; } .linkpill.bad .dot{ background:var(--danger); animation:none; }
`;

/* ------------------------------------------------------------------ */
/* module-level session — survives the screen change into the battle   */
/* ------------------------------------------------------------------ */

let SESSION = null;
let TRANSPORT = null;

export function activeLink() { return SESSION; }

export function dropLink(reason) {
  try { SESSION?.leave?.(); } catch { /* already gone */ }
  try { TRANSPORT?.close?.(); } catch { /* already gone */ }
  SESSION = null;
  TRANSPORT = null;
  if (reason) console.info('[link] closed:', reason);
}

/** Trim/pad a crew to exactly `n` so both peers always field the same count. */
function fixedCrew(members, n = 3) {
  const out = (members || []).slice(0, n).map((m) => ({ ...m }));
  if (!out.length) {
    const rng = new RNG(((Date.now() / 1000) | 0) >>> 0);
    const pool = allFighters().slice();
    while (out.length < n && pool.length) out.push(makeDefaultMember(pool.splice(rng.int(pool.length), 1)[0].id, 50));
  }
  while (out.length < n) out.push({ ...out[out.length % Math.max(1, out.length)] });
  return out.slice(0, n);
}

/* ------------------------------------------------------------------ */
/* the handshake screen                                                */
/* ------------------------------------------------------------------ */

export class LinkScreen {
  constructor(app) { this.app = app; }

  mount(root, params = {}) {
    injectScreenCss();
    if (!document.getElementById('link-css')) {
      const s = document.createElement('style'); s.id = 'link-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
    this.root = root;
    this.t = 0;
    this.keepAlive = false;
    this.role = null;
    this.stage = 'menu';

    const save = Save.data();
    const team = activeTeam(save);
    this.crew = fixedCrew(team?.members, 3);
    this.crewName = team?.name || 'Your Crew';
    this.myName = save.profile?.name || 'You';
    this.arena = params.arena || ARENAS[0].id;

    const sh = shell(root, {
      title: 'Link Battle',
      sub: '3v3 at level 50 · no server, no account, no lobby',
      onBack: () => this.back()
    });
    this.sh = sh;

    this.app.stage.buildArena('marineford');
    this.app.view?.reset?.();
    this.app.plates?.forEach?.((p) => p.hide());
    this.app.textbox?.hide?.();
    this.cast = new StageCast(this.app);
    this.cast.set(this.crew.slice(0, 2).map((m, i) => ({
      id: m.speciesId, x: i ? 2.8 : -2.8, z: i ? 0.2 : 0.6, rotY: i ? -0.4 : 0.4,
      state: 'ready', facing: i ? -1 : 1
    })));
    audio.startMusic('title');
    audio.setIntensity(0.25);

    if (params.error) toast(params.error, 'bad', 5000);
    if (!LinkTransport.supported) { this.drawUnsupported(); return; }
    this.drawMenu();
  }

  back() {
    if (!this.keepAlive) dropLink('left the link screen');
    this.app.router.go('mode');
  }

  /* ---------------- unhappy path: no WebRTC ---------------- */

  drawUnsupported() {
    const body = this.sh.body;
    body.innerHTML = '';
    const p = el('div', 'pane');
    p.innerHTML = `<h3>This browser can't open a link</h3>
      <p class="lede">Link battles need WebRTC, and <code>RTCPeerConnection</code> does not exist here.
      That usually means a hardened privacy mode, an old browser, or an embedded web view.
      Nothing else in the game is affected.</p>`;
    const row = el('div', 'lk-row');
    row.appendChild(button('Play hot-seat instead', 'btn primary', () => this.app.router.go('versus')));
    row.appendChild(button('Trade a team code instead', 'btn sm', () => this.app.router.go('teambuilder')));
    p.appendChild(row);
    body.appendChild(p);
  }

  /* ---------------- menu ---------------- */

  drawMenu() {
    const body = this.sh.body;
    body.innerHTML = '';
    body.appendChild(el('p', 'lede',
      'One of you hosts and sends a code; the other joins and sends a shorter code back. After that the two games run the same battle in step, exchanging nothing but the move each of you picks.'));

    body.appendChild(this.crewPanel());

    const grid = el('div', 'grid-2');
    grid.style.marginTop = '13px';
    const host = el('div', 'pane');
    host.innerHTML = '<h3>Host the battle</h3><p class="lede" style="margin-bottom:10px">You generate the first code and pick the arena. You are player one.</p>';
    const hrow = el('div', 'lk-row');
    hrow.appendChild(button('Create a host code', 'btn primary', () => this.startHost()));
    host.appendChild(hrow);

    const join = el('div', 'pane');
    join.innerHTML = '<h3>Join a battle</h3><p class="lede" style="margin-bottom:10px">Paste the code your friend sent you. You are player two.</p>';
    const jrow = el('div', 'lk-row');
    jrow.appendChild(button('I have a code', 'btn', () => this.startJoin()));
    join.appendChild(jrow);

    grid.append(host, join);
    body.appendChild(grid);

    const note = el('div', 'pane tight');
    note.style.marginTop = '13px';
    note.appendChild(el('h3', null, 'If it will not connect'));
    note.appendChild(el('div', 'note warn', 'Codes are long. Paste the whole thing, including the GLA-HOST: or GLA-JOIN: prefix.'));
    note.appendChild(el('div', 'note warn', 'Codes go stale: generate a fresh one if the other side takes more than a few minutes.'));
    note.appendChild(el('div', 'note warn', 'Some office and school networks block peer-to-peer entirely. Hot-seat versus works everywhere.'));
    body.appendChild(note);
  }

  crewPanel() {
    const p = el('div', 'pane tight');
    p.appendChild(el('h3', null, `Your crew — ${esc(this.crewName)}`));
    const row = el('div', 'lk-crew');
    for (const m of this.crew) {
      const one = el('div', 'one');
      one.appendChild(portrait(m.speciesId, 'sm'));
      one.appendChild(el('div', 'nm', esc(m.nickname || getFighter(m.speciesId)?.name || m.speciesId)));
      row.appendChild(one);
    }
    const change = button('Change crew', 'btn xs ghost', () => {
      this.keepAlive = false;
      this.app.router.go('teambuilder', { returnTo: 'link' });
    });
    row.appendChild(change);
    p.appendChild(row);
    return p;
  }

  stepEl(n, text, done) {
    const s = el('div', `lk-step ${done ? 'done' : ''}`);
    s.appendChild(el('span', 'n', done ? '✓' : String(n)));
    s.appendChild(el('span', null, text));
    return s;
  }

  setState(text, kind = '') {
    if (!this.$state) return;
    this.$state.className = `lk-state ${kind}`;
    this.$state.innerHTML = `<span class="dot"></span><span>${esc(text)}</span>`;
  }

  /* ---------------- host ---------------- */

  async startHost() {
    this.role = 'host';
    const body = this.sh.body;
    body.innerHTML = '';
    const p = el('div', 'pane');
    p.appendChild(el('h3', null, 'Hosting'));
    this.$state = el('div', 'lk-state');
    p.appendChild(this.$state);
    this.setState('Gathering network candidates…');

    const steps = el('div');
    steps.style.margin = '12px 0';
    steps.appendChild(this.stepEl(1, 'Copy the code below and send it to your friend (chat, email, anything).'));
    steps.appendChild(this.stepEl(2, 'They paste it into “I have a code” and send you back a shorter GLA-JOIN code.'));
    steps.appendChild(this.stepEl(3, 'Paste theirs in the second box and the battle starts on both screens.'));
    p.appendChild(steps);

    const out = el('textarea', 'lk-code');
    out.readOnly = true;
    out.value = 'Generating…';
    out.setAttribute('aria-label', 'Your host code');
    p.appendChild(out);
    const row1 = el('div', 'lk-row');
    row1.appendChild(button('Copy host code', 'btn sm primary', async () => {
      const ok = await copyText(out.value);
      toast(ok ? 'Host code copied — send it over.' : 'Copy failed; select the text manually.', ok ? 'good' : 'bad');
    }));
    row1.appendChild(button('Start over', 'btn sm ghost', () => { dropLink('restart'); this.drawMenu(); }));
    p.appendChild(row1);

    p.appendChild(el('h4', null, 'Their answer code'));
    const inp = el('textarea', 'lk-code paste');
    inp.placeholder = 'GLA-JOIN:…';
    inp.setAttribute('aria-label', 'Their answer code');
    p.appendChild(inp);
    const err = el('div');
    p.appendChild(err);
    const row2 = el('div', 'lk-row');
    row2.appendChild(button('Connect', 'btn primary', async () => {
      err.innerHTML = '';
      try {
        this.setState('Connecting…');
        await TRANSPORT.acceptAnswer(inp.value);
        this.setState('Handshake sent, waiting for the channel…');
      } catch (e) {
        this.setState('That code did not work', 'bad');
        err.appendChild(el('div', 'note bad', esc(e?.message || 'That answer code could not be read.')));
      }
    }));
    p.appendChild(row2);
    body.appendChild(p);

    try {
      dropLink('new host');
      TRANSPORT = new LinkTransport();
      this.wireTransport();
      const code = await TRANSPORT.host();
      out.value = code;
      this.setState('Waiting for your friend to join…');
    } catch (e) {
      console.warn('[link] host failed', e);
      out.value = '';
      this.setState('Could not open a connection', 'bad');
      err.appendChild(el('div', 'note bad', esc(e?.message || 'This device refused to create a peer connection.')));
    }
  }

  /* ---------------- guest ---------------- */

  startJoin() {
    this.role = 'guest';
    const body = this.sh.body;
    body.innerHTML = '';
    const p = el('div', 'pane');
    p.appendChild(el('h3', null, 'Joining'));
    this.$state = el('div', 'lk-state');
    p.appendChild(this.$state);
    this.setState('Waiting for a host code…');

    const steps = el('div');
    steps.style.margin = '12px 0';
    steps.appendChild(this.stepEl(1, 'Paste the GLA-HOST code your friend sent you.'));
    steps.appendChild(this.stepEl(2, 'Send the GLA-JOIN code this produces straight back to them.'));
    steps.appendChild(this.stepEl(3, 'They press Connect and both screens drop into the battle.'));
    p.appendChild(steps);

    const inp = el('textarea', 'lk-code paste');
    inp.placeholder = 'GLA-HOST:…';
    inp.setAttribute('aria-label', 'Host code from your friend');
    p.appendChild(inp);
    const err = el('div');
    p.appendChild(err);
    const row = el('div', 'lk-row');
    const out = el('textarea', 'lk-code');
    out.readOnly = true;
    out.style.display = 'none';
    out.setAttribute('aria-label', 'Your answer code');
    const copyRow = el('div', 'lk-row');
    copyRow.style.display = 'none';
    copyRow.appendChild(button('Copy answer code', 'btn sm primary', async () => {
      const ok = await copyText(out.value);
      toast(ok ? 'Answer copied — send it back.' : 'Copy failed; select the text manually.', ok ? 'good' : 'bad');
    }));

    row.appendChild(button('Read the code', 'btn primary', async () => {
      err.innerHTML = '';
      try {
        dropLink('new guest');
        TRANSPORT = new LinkTransport();
        this.wireTransport();
        this.setState('Answering…');
        const code = await TRANSPORT.join(inp.value);
        out.value = code;
        out.style.display = '';
        copyRow.style.display = '';
        this.setState('Send that answer back and wait…');
      } catch (e) {
        this.setState('That code did not work', 'bad');
        err.appendChild(el('div', 'note bad', esc(e?.message || 'That host code could not be read.')));
        dropLink('bad host code');
      }
    }));
    row.appendChild(button('Start over', 'btn sm ghost', () => { dropLink('restart'); this.drawMenu(); }));
    p.appendChild(row);
    p.appendChild(el('h4', null, 'Your answer code'));
    p.appendChild(out);
    p.appendChild(copyRow);
    body.appendChild(p);
  }

  /* ---------------- shared plumbing ---------------- */

  wireTransport() {
    const t = TRANSPORT;
    t.onOpen = () => this.onOpen();
    t.onError = (e) => {
      console.warn('[link] transport error', e);
      this.setState('The connection reported an error', 'bad');
    };
    t.onClose = () => {
      if (this.stage === 'battle') return;
      this.setState('The other side disconnected', 'bad');
    };
  }

  onOpen() {
    if (SESSION) return;
    this.setState('Connected — exchanging crews…', 'ok');
    audio.sfx('ui_select');
    SESSION = new LinkSession(TRANSPORT, {
      isHost: this.role === 'host',
      myTeam: this.crew,
      myName: this.myName,
      arena: this.arena,
      teamSize: this.crew.length
    });
    SESSION.onStatus = (text) => this.setState(text, 'ok');
    SESSION.onPeerLeft = () => {
      if (this.stage === 'battle') return;
      this.setState('Your opponent left.', 'bad');
      toast('Your opponent left the link.', 'bad');
    };
    SESSION.onDesync = (d) => {
      this.setState('The two games fell out of step.', 'bad');
      console.warn('[link] desync', d);
    };
    SESSION.onReady = () => {
      this.stage = 'battle';
      this.keepAlive = true;
      this.app.router.go('linkbattle', {});
    };
    SESSION.start();
  }

  update(dt) {
    this.t += dt;
    this.cast?.update(dt);
    orbitCamera(this.app, this.t, {
      radius: 11.8, height: 4.0, speed: 0.011, target: { x: 0, y: 1.7, z: 0 }, angle: 0.6, fov: 38
    });
  }

  unmount() {
    this.cast?.dispose();
    this.cast = null;
    if (!this.keepAlive) dropLink('screen unmounted');
    this.root.innerHTML = '';
  }
}

/* ------------------------------------------------------------------ */
/* the battle itself                                                   */
/* ------------------------------------------------------------------ */

/**
 * The real battle screen, with one thing changed: where the two choices come
 * from. Locally we still ask through `CommandMenu`; the other side's choice
 * arrives over the wire, and neither simulation advances until both are in.
 */
export class LinkBattleScreen extends BattleScreen {
  mount(root, params = {}) {
    this.root = root;
    const session = params.session || SESSION;
    if (!session || !session.battle) {
      // Bounce out on the next tick — the router is mid-mount right now.
      this._dead = true;
      root.appendChild(el('div', 'empty', 'That link battle is no longer running.'));
      setTimeout(() => this.app.router.go('link', { error: 'That link battle is no longer running.' }), 0);
      return;
    }
    this.session = session;
    this.mySide = session.mySide;
    this.awaitingPeer = false;

    const teams = session.battle.sides.map((s) => s.party.map((p) => ({
      speciesId: p.speciesId, nickname: p.nickname, level: p.level, nature: p.nature,
      ivs: { ...p.ivs }, evs: { ...p.evs }, ability: p.baseAbility, item: p.item,
      moves: p.moves.map((m) => m.id)
    })));

    super.mount(root, {
      ...params,
      mode: 'link',
      seed: session.seed,
      arena: session.arena,
      p0Team: teams[0], p1Team: teams[1],
      p0Name: session.battle.sides[0].name,
      p1Name: session.battle.sides[1].name,
      teamSize: teams[0].length,
      meta: { kind: 'link', ...(params.meta || {}) }
    });

    // Throw away the local battle the base screen built and drive the shared one.
    this.battle = session.battle;
    this.view.reset();
    this.view.setState(publicView(this.battle));
    this.view.push(this.battle.events);

    /* link status pill next to the turn counter */
    this.$pill = el('div', 'linkpill');
    this.$pill.innerHTML = '<span class="dot"></span><span>Linked</span>';
    this.bar?.appendChild(this.$pill);

    session.onTurn = (events) => {
      this.awaitingPeer = false;
      this.setLink('Linked', '');
      this.view.setState(publicView(this.battle));
      this.view.push(events);
      if (!this.view.busy) this.onIdle();
    };
    session.onStatus = (text) => { if (this.awaitingPeer) this.setLink(text, 'wait'); };
    session.onPeerLeft = () => this.peerLeft();
    session.onDesync = (detail) => this.desync(detail);
  }

  setLink(text, cls) {
    if (!this.$pill) return;
    this.$pill.className = `linkpill ${cls || ''}`;
    this.$pill.innerHTML = `<span class="dot"></span><span>${esc(String(text).slice(0, 34))}</span>`;
  }

  /** Only ever ask the local player, and only for the side they own. */
  promptNext() {
    const b = this.battle;
    if (b.ended || this.awaitingPeer) return;
    const me = this.mySide;
    if (b.request[me] === 'switch') { this.askSwitch(me); return; }
    if (b.request[me] === 'move') { this.ask(me); return; }
    // Nothing is being asked of us — the peer is replacing a fallen fighter.
    // Lockstep still needs a packet from this side, so send an explicit pass.
    this.passTurn();
  }

  passTurn() {
    if (this.awaitingPeer || this.battle.ended) return;
    this.awaitingPeer = true;
    this.setLink('Waiting for them', 'wait');
    this.app.textbox?.say?.('Waiting for your opponent…', { hold: 0 });
    this.session.submit({ kind: 'pass' });
  }

  onPlayerChoice(choice) {
    const side = this.waitingChoice;
    if (side === null || side === undefined) return;
    this.menu?.clear();
    this.turnPill?.classList.add('thinking');
    this.waitingChoice = null;
    this.forcedSwitch = false;
    this.awaitingPeer = true;
    this.setLink('Waiting for them', 'wait');
    if (!this.session.submit(choice)) {
      // Already submitted this turn — put the menu back rather than hanging.
      this.awaitingPeer = false;
      this.promptNext();
    }
  }

  peerLeft() {
    if (this._left) return;
    this._left = true;
    this.setLink('Opponent left', 'bad');
    modal({
      title: 'Your opponent left',
      html: '<p class="lede">The link closed mid-battle. A lockstep battle cannot be finished alone, so this one is abandoned.</p>',
      dismissable: false,
      actions: [
        { label: 'Back to link', cls: 'btn sm primary', fn: () => { dropLink('peer left'); this.app.router.go('link'); } },
        { label: 'Main menu', cls: 'btn sm ghost', fn: () => { dropLink('peer left'); this.app.router.go('title'); } }
      ]
    });
  }

  desync(detail) {
    if (this._desynced) return;
    this._desynced = true;
    this.setLink('Out of step', 'bad');
    console.warn('[link] desync', detail);
    modal({
      title: 'The two games fell out of step',
      html: `<p class="lede">Both sides run the same simulation from the same seed, and a checksum just disagreed
        (<code>${esc(detail?.reason || 'unknown')}</code>). Rather than show you two different battles, this one stops here.</p>
        <p class="lede">This normally means the two devices are running different builds of the game.</p>`,
      dismissable: false,
      actions: [
        { label: 'Leave the battle', cls: 'btn sm primary', fn: () => { dropLink('desync'); this.app.router.go('link'); } }
      ]
    });
  }

  unmount() {
    if (this.session) {
      this.session.onTurn = null;
      this.session.onStatus = null;
      this.session.onPeerLeft = null;
      this.session.onDesync = null;
      if (this.battle?.ended) dropLink('battle over');
    }
    if (this._dead) { this.root.innerHTML = ''; return; }
    super.unmount();
  }

  update(dt) { super.update?.(dt); }
}
