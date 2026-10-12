// Guards the one invariant that keeps the simulation pure: the list of hooks
// the engine dispatches to items itself must exactly match engine.js's real
// runItemHook call sites. When they drift, either an item fires twice or the
// same seed produces two different battles depending on process history.
import { readFileSync } from 'node:fs';
import { engineItemHooks } from '../src/data/items.js';

const src = readFileSync(new URL('../src/core/engine.js', import.meta.url), 'utf8');
const called = [...new Set([...src.matchAll(/runItemHook\(\s*'([a-zA-Z0-9_]+)'/g)].map((m) => m[1]))].sort();
const declared = engineItemHooks().slice().sort();

const missing = called.filter((h) => !declared.includes(h));
const extra = declared.filter((h) => !called.includes(h));

console.log('engine calls   :', called.join(', ') || '(none)');
console.log('items declares :', declared.join(', ') || '(none)');
if (missing.length) console.log('\n❌ engine calls but items does not declare:', missing.join(', '),
  '\n   -> the held item will fire twice (engine + runAbility).');
if (extra.length) console.log('\n❌ items declares but engine never calls:', extra.join(', '),
  '\n   -> the held item will never fire for that hook.');
if (missing.length || extra.length) process.exit(1);
console.log('\n✅ engine and item hook lists agree');
