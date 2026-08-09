// Link Battle — play a friend on another device with no server.
//
// Two peers connect over WebRTC using manual signalling: the host produces a
// short code, the guest pastes it back, done. Because the simulation is pure
// and seeded (docs/ARCHITECTURE.md §0), we only ever send *choices* — never
// state — and both clients run the identical battle in lockstep. That makes
// the connection cheap, cheating hard, and desync detectable.

import { createBattle, submitChoices, publicView } from '../core/engine.js';
import { seedFromString } from '../core/rng.js';

/* ------------------------------------------------------------------ */
/* code encoding — a pasteable blob, not a QR-sized wall of JSON        */
/* ------------------------------------------------------------------ */

function toB64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64(b64) {
  const pad = b64.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(pad + '='.repeat((4 - (pad.length % 4)) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Strip an SDP down to what actually matters, so the code stays pasteable. */
function packSdp(desc) {
  return toB64(JSON.stringify({ t: desc.type === 'offer' ? 'o' : 'a', s: desc.sdp }));
}

function unpackSdp(code) {
  const o = JSON.parse(fromB64(code.trim().replace(/\s+/g, '')));
  return { type: o.t === 'o' ? 'offer' : 'answer', sdp: o.s };
}

/** Human-readable framing so a pasted code is obviously a code. */
export function wrapCode(kind, payload) {
  return `GLA-${kind}:${payload}`;
}
export function unwrapCode(text) {
  const m = String(text).trim().match(/GLA-(HOST|JOIN):([A-Za-z0-9\-_]+)/);
  if (!m) throw new Error('That does not look like a Grand Line code.');
  return { kind: m[1], payload: m[2] };
}

/* ------------------------------------------------------------------ */
/* transport                                                           */
/* ------------------------------------------------------------------ */

const ICE = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478'] }] };

/**
 * Manual-signalling WebRTC data channel.
 *
 * Host:  const t = new LinkTransport(); const code = await t.host();
 *        ...share code... await t.acceptAnswer(theirCode);
 * Guest: const t = new LinkTransport(); const code = await t.join(hostCode);
 *        ...share code back...
 */
export class LinkTransport {
  constructor() {
    this.pc = null;
    this.ch = null;
    this.role = null;
    this.onMessage = null;
    this.onOpen = null;
    this.onClose = null;
    this.onError = null;
    this.state = 'idle';   // idle | offering | answering | connecting | open | closed | failed
  }

  static get supported() {
    return typeof RTCPeerConnection === 'function';
  }

  _wire(ch) {
    this.ch = ch;
    ch.onopen = () => { this.state = 'open'; this.onOpen?.(); };
    ch.onclose = () => { this.state = 'closed'; this.onClose?.(); };
    ch.onerror = (e) => { this.onError?.(e); };
    ch.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      this.onMessage?.(msg);
    };
  }

  /** Gather ICE fully so the single code we hand over is self-contained. */
  _gathered() {
    return new Promise((resolve) => {
      if (this.pc.iceGatheringState === 'complete') return resolve();
      const done = () => {
        if (this.pc.iceGatheringState === 'complete') {
          this.pc.removeEventListener('icegatheringstatechange', done);
          resolve();
        }
      };
      this.pc.addEventListener('icegatheringstatechange', done);
      // Some networks never reach "complete"; ship what we have.
      setTimeout(resolve, 3500);
    });
  }

  async host() {
    this.role = 'host';
    this.state = 'offering';
    this.pc = new RTCPeerConnection(ICE);
    this._wire(this.pc.createDataChannel('gla', { ordered: true }));
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    await this._gathered();
    return wrapCode('HOST', packSdp(this.pc.localDescription));
  }

  async acceptAnswer(code) {
    const { kind, payload } = unwrapCode(code);
    if (kind !== 'JOIN') throw new Error('Expected a JOIN code from your opponent.');
    this.state = 'connecting';
    await this.pc.setRemoteDescription(unpackSdp(payload));
  }

  async join(hostCode) {
    const { kind, payload } = unwrapCode(hostCode);
    if (kind !== 'HOST') throw new Error('Expected a HOST code.');
    this.role = 'guest';
    this.state = 'answering';
    this.pc = new RTCPeerConnection(ICE);
    this.pc.ondatachannel = (e) => this._wire(e.channel);
    await this.pc.setRemoteDescription(unpackSdp(payload));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    await this._gathered();
    return wrapCode('JOIN', packSdp(this.pc.localDescription));
  }

  send(msg) {
    if (this.ch?.readyState === 'open') { this.ch.send(JSON.stringify(msg)); return true; }
    return false;
  }

  close() {
    try { this.ch?.close(); } catch { /* already gone */ }
    try { this.pc?.close(); } catch { /* already gone */ }
    this.state = 'closed';
  }
}

/* ------------------------------------------------------------------ */
/* lockstep session                                                    */
/* ------------------------------------------------------------------ */

/**
 * Runs one battle across two peers.
 *
 * Both sides build the same battle from the same seed and the same two teams,
 * then exchange one Choice per turn. Neither side advances until it has both
 * choices, so the two simulations stay bit-identical. Each side also sends a
 * cheap checksum of its own state; a mismatch means desync, which we surface
 * rather than silently diverge.
 */
export class LinkSession {
  constructor(transport, { isHost, myTeam, myName = 'You', arena = 'colosseum', teamSize = 3 }) {
    this.t = transport;
    this.isHost = isHost;
    this.mySide = isHost ? 0 : 1;
    this.myTeam = myTeam;
    this.myName = myName;
    this.arena = arena;
    this.teamSize = teamSize;

    this.battle = null;
    this.seed = null;
    this.peerTeam = null;
    this.peerName = null;

    this.myChoice = null;
    this.peerChoice = null;
    this.turnIndex = 0;

    this.onReady = null;      // (battle) => void
    this.onTurn = null;       // (events, battle) => void
    this.onDesync = null;     // (detail) => void
    this.onPeerLeft = null;
    this.onStatus = null;     // (text) => void

    this.t.onMessage = (m) => this._recv(m);
    this.t.onClose = () => this.onPeerLeft?.();
  }

  /** Host picks the seed; both sides then have everything they need. */
  start() {
    if (this.isHost) {
      this.seed = seedFromString(`${Date.now()}-${Math.random()}`);
      this.t.send({ k: 'hello', seed: this.seed, team: this.myTeam, name: this.myName, arena: this.arena, teamSize: this.teamSize });
    } else {
      this.t.send({ k: 'hello', team: this.myTeam, name: this.myName });
    }
    this.onStatus?.('Waiting for your opponent…');
  }

  _recv(m) {
    switch (m.k) {
      case 'hello': {
        this.peerTeam = m.team;
        this.peerName = m.name;
        if (!this.isHost) { this.seed = m.seed; this.arena = m.arena; this.teamSize = m.teamSize; }
        this._tryBuild();
        break;
      }
      case 'choice': {
        if (m.turn !== this.turnIndex) {
          // Out-of-order packet: the peer is ahead or behind. Lockstep should
          // make this impossible, so treat it as desync rather than guessing.
          this._desync({ reason: 'turn-mismatch', theirs: m.turn, ours: this.turnIndex });
          return;
        }
        this.peerChoice = m.choice;
        this._maybeResolve();
        break;
      }
      case 'check': {
        if (m.turn === this.turnIndex && this._checksum() !== m.sum) {
          this._desync({ reason: 'checksum', turn: m.turn });
        }
        break;
      }
      case 'bye': this.onPeerLeft?.(); break;
      default: break;
    }
  }

  _tryBuild() {
    if (this.battle || !this.peerTeam || this.seed == null) return;
    const hostSide = { name: this.isHost ? this.myName : this.peerName, tag: 'P1', team: this.isHost ? this.myTeam : this.peerTeam };
    const guestSide = { name: this.isHost ? this.peerName : this.myName, tag: 'P2', team: this.isHost ? this.peerTeam : this.myTeam };
    this.battle = createBattle({
      seed: this.seed,
      arena: this.arena,
      format: { level: 50, teamSize: this.teamSize, bring: this.teamSize },
      sides: [hostSide, guestSide]
    });
    this.onReady?.(this.battle);
  }

  /** Called by the battle screen when the local player has decided. */
  submit(choice) {
    if (this.myChoice) return false;
    this.myChoice = choice;
    this.t.send({ k: 'choice', turn: this.turnIndex, choice });
    this.onStatus?.(this.peerChoice ? 'Resolving…' : `Waiting for ${this.peerName ?? 'opponent'}…`);
    this._maybeResolve();
    return true;
  }

  _maybeResolve() {
    if (!this.battle || !this.myChoice || !this.peerChoice) return;
    const choices = [null, null];
    choices[this.mySide] = this.myChoice;
    choices[1 - this.mySide] = this.peerChoice;
    this.myChoice = null; this.peerChoice = null;

    const events = submitChoices(this.battle, choices);
    this.turnIndex++;
    this.t.send({ k: 'check', turn: this.turnIndex, sum: this._checksum() });
    this.onTurn?.(events, this.battle);
  }

  /**
   * Cheap order-sensitive hash of the visible state. Catches divergence
   * without shipping the whole battle every turn.
   */
  _checksum() {
    const b = this.battle;
    if (!b) return 0;
    let h = 2166136261 >>> 0;
    const mix = (n) => { h ^= n >>> 0; h = Math.imul(h, 16777619) >>> 0; };
    mix(b.turn); mix(b.rng.calls);
    mix(b.field.weather.id.length * 31 + b.field.weather.turns);
    for (const s of b.sides) {
      mix(s.activeIndex);
      for (const p of s.party) {
        mix(p.hp); mix(p.fainted ? 1 : 0);
        mix((p.status || 'x').charCodeAt(0));
        for (const k of ['atk', 'def', 'spa', 'spd', 'spe']) mix(p.boosts[k] + 7);
        for (const m of p.moves) mix(m.pp);
      }
    }
    return h >>> 0;
  }

  _desync(detail) {
    this.onDesync?.(detail);
    this.onStatus?.('The two games fell out of step. This battle can\'t continue.');
  }

  leave() {
    this.t.send({ k: 'bye' });
    this.t.close();
  }
}

/* ------------------------------------------------------------------ */
/* replays                                                             */
/* ------------------------------------------------------------------ */

/**
 * A replay is the seed, the teams and the choice list — nothing else.
 * Because the sim is deterministic, that is enough to reproduce the battle
 * exactly, which makes replays tiny and shareable as a code.
 */
export class ReplayRecorder {
  constructor(battle, meta = {}) {
    this.seed = battle.seed;
    this.arena = battle.arena;
    this.meta = meta;
    this.teams = battle.sides.map((s) => s.party.map((p) => ({
      speciesId: p.speciesId, nickname: p.nickname, level: p.level,
      nature: p.nature, ability: p.ability, item: p.item,
      moves: p.moves.map((m) => m.id), ivs: p.ivs, evs: p.evs
    })));
    this.names = battle.sides.map((s) => s.name);
    this.choices = [];
  }
  record(choicePair) { this.choices.push(choicePair); }
  toCode() {
    return wrapCode('REPLAY', toB64(JSON.stringify({
      v: 1, seed: this.seed, arena: this.arena, names: this.names,
      teams: this.teams, choices: this.choices, meta: this.meta
    })));
  }
}

export function loadReplay(code) {
  const m = String(code).trim().match(/GLA-REPLAY:([A-Za-z0-9\-_]+)/);
  if (!m) throw new Error('That does not look like a replay code.');
  const r = JSON.parse(fromB64(m[1]));
  if (r.v !== 1) throw new Error('That replay was made by a different version of the game.');
  return r;
}

/** Rebuild the battle a replay describes, ready to be stepped. */
export function replayBattle(r) {
  const battle = createBattle({
    seed: r.seed, arena: r.arena,
    format: { level: 50, teamSize: r.teams[0].length, bring: r.teams[0].length },
    sides: [
      { name: r.names[0], tag: 'P1', team: r.teams[0] },
      { name: r.names[1], tag: 'P2', team: r.teams[1] }
    ]
  });
  let i = 0;
  return {
    battle,
    get done() { return i >= r.choices.length || battle.ended; },
    step() {
      if (this.done) return [];
      return submitChoices(battle, r.choices[i++]);
    },
    all() {
      const out = [];
      while (!this.done) out.push(...this.step());
      return out;
    }
  };
}

/* ------------------------------------------------------------------ */
/* team codes — trade a team with a friend as one string               */
/* ------------------------------------------------------------------ */

export function encodeTeam(team, name = 'Team') {
  return wrapCode('TEAM', toB64(JSON.stringify({ v: 1, n: name, t: team })));
}

export function decodeTeam(code) {
  const m = String(code).trim().match(/GLA-TEAM:([A-Za-z0-9\-_]+)/);
  if (!m) throw new Error('That does not look like a team code.');
  const o = JSON.parse(fromB64(m[1]));
  if (o.v !== 1) throw new Error('That team code was made by a different version of the game.');
  return { name: o.n, team: o.t };
}
