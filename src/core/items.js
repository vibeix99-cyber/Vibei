// Engine-facing surface for items. The definitions (and the shared sim
// primitives that ability/item hooks use) live in ../data/items.js so that
// `data/` stays importable without pulling in the engine.
//
// The engine calls `runItemHook(name, ctx)` for the hooks it dispatches itself
// ('modifyDamage' on the attacker, 'onResidual' on each active). Every other
// held-item hook is piped through `runAbility` in ./abilities.js — see the
// header comment there. `itemHookIsEngineDriven` keeps the two paths disjoint.

export {
  // registry
  ITEMS, ITEM_BY_ID, getItem, bagItems, heldItems, itemList, heldItemOf,
  // bag
  defaultBag, BAG_USES_PER_BATTLE, bagUsesLeft,
  // dispatch
  runItemHook, dispatchItemHook, itemHookIsEngineDriven, itemHookNames,
  // shared sim primitives (used by abilities.js and by tools/abilitytest.mjs)
  pushEvent, say, label, foeOf,
  hurt, restore, boostStat, giveStatus, cureAll, addVol, removeVol,
  setWeatherNow, setTerrainNow, addHazard, clearHazards,
  abilityFlash, itemFlash, ignoreDefBoosts, effAgainst,
  registerAbilityStatusGuard
} from '../data/items.js';
