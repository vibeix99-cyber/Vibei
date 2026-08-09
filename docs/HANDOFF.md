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
