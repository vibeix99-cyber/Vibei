# Handoff requests

Agents own disjoint sets of files (see `docs/ARCHITECTURE.md` §1). When you need a change
in a file you don't own, **append a request here instead of editing it**. Keep each request
short and precise: what you need, why, and the exact API you'd like.

Format:

```
### <your piece> → <owning piece>
**Need:** one line.
**Why:** one line.
**Proposed API:** signature / shape.
**Status:** open | done | declined (owner fills this in)
```

Also use this file to **announce** anything other agents must know about: a new exported
API, a new prop key, a new event kind, a new sfx key.

---

## Announcements

### Roster → Character models
New `model.silhouette` prop keys invented for the expanded roster get listed here by the
roster agent, with a one-line description of the shape each should produce.

### Arena → Game feel
`Stage` will gain a weather/terrain API so the event stream can drive the 3D field state.
The arena agent records the exact signature here when it lands.

---

## Requests

### Orchestrator → Screens & modes
**Need:** wire `src/net/link.js` into a `link` screen and the team builder.
**Why:** remote PvP between friends and shareable teams are the point of the game;
the module is written and standalone but nothing routes to it yet.
**Provided API** (`src/net/link.js`, owned by the orchestrator — read it, don't edit it):
- `LinkTransport` — manual-signalling WebRTC, no server. Host: `await t.host()` returns
  a `GLA-HOST:` code to share, then `await t.acceptAnswer(theirCode)`. Guest:
  `await t.join(hostCode)` returns a `GLA-JOIN:` code to send back. `LinkTransport.supported`
  gates the UI.
- `LinkSession(transport, { isHost, myTeam, myName, arena, teamSize })` — lockstep battle.
  Call `start()`, then `submit(choice)` once per turn. Fires `onReady(battle)`,
  `onTurn(events, battle)`, `onStatus(text)`, `onDesync(detail)`, `onPeerLeft()`.
  Only choices cross the wire; both peers run the identical seeded sim.
- `encodeTeam(team, name)` / `decodeTeam(code)` — `GLA-TEAM:` codes for trading teams.
- `ReplayRecorder(battle, meta)` / `loadReplay(code)` / `replayBattle(r)` — `GLA-REPLAY:`
  codes. A replay is just seed + teams + choices, so it stays short enough to paste.
**Status:** open
