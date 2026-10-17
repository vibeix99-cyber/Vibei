// node console-report.cjs <base.jsonl> <fix.jsonl> > report.md : per spec, hook-order errors and all other console errors/warnings.
const fs = require('fs');
const [baseF, fixF] = process.argv.slice(2);
const rd = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : []);
const HOOK = /change in the order of Hooks|Rendered (more|fewer) hooks|Rules of Hooks/i;
const norm = (t) => t.replace(/https?:\/\/[^\s)'"]+/g, (u) => u.replace(/^https?:\/\/[^/]+/, '<origin>').replace(/\?.*$/, '')).replace(/\d+/g, '#').replace(/\s+/g, ' ').slice(0, 170);
const specs = ['notice-strip.spec.ts', 'w3-notices.spec.ts', 'w3-notices-idle.spec.ts', 'summary-notice.spec.ts', 'toast-room.spec.ts'];
const sets = { base: rd(baseF), fix: rd(fixF) };
const cls = (r) => (r.kind === 'pageerror' ? 'pageerror' : HOOK.test(r.text) ? 'hook' : r.type === 'error' ? 'error' : 'warning');
const count = (rows, spec, c) => rows.filter((r) => r.file === spec && cls(r) === c).length;
console.log('| Spec | hook-order errors base (:5560) | fix (:5582) | other `console.error` base | fix | warnings base | fix | page errors base | fix |');
console.log('|---|---:|---:|---:|---:|---:|---:|---:|---:|');
const tot = { hook: [0, 0], error: [0, 0], warning: [0, 0], pageerror: [0, 0] };
for (const sp of specs) {
  const cells = [];
  for (const c of ['hook', 'error', 'warning', 'pageerror']) {
    const b = count(sets.base, sp, c), f = count(sets.fix, sp, c);
    tot[c][0] += b; tot[c][1] += f; cells.push(b, f);
  }
  console.log(`| \`${sp}\` | ${cells.join(' | ')} |`);
}
console.log(`| **all five** | ${['hook', 'error', 'warning', 'pageerror'].map((c) => tot[c].join(' | ')).join(' | ')} |`);
const other = (rows) => { const m = new Map(); for (const r of rows) if (cls(r) !== 'hook') { const k = cls(r) + ' | ' + norm(r.text); m.set(k, (m.get(k) || 0) + 1); } return m; };
const ob = other(sets.base), of = other(sets.fix);
console.log('\nOther console lines (normalised), count base / fix:\n');
console.log('| Kind | Message | base | fix |\n|---|---|---:|---:|');
for (const k of new Set([...ob.keys(), ...of.keys()])) { const [kind, msg] = k.split(' | '); console.log(`| ${kind} | ${msg.replace(/\|/g, '\\|')} | ${ob.get(k) || 0} | ${of.get(k) || 0} |${!ob.has(k) ? ' **new on fix**' : ''}`); }
if (!ob.size && !of.size) console.log('| (none) | | 0 | 0 |');
console.log('\nHook-order records by test (base | fix):\n');
const byT = (rows) => { const m = new Map(); for (const r of rows) if (cls(r) === 'hook') { const k = r.file + ' › ' + r.title; m.set(k, (m.get(k) || 0) + 1); } return m; };
const tb = byT(sets.base), tf = byT(sets.fix);
for (const k of new Set([...tb.keys(), ...tf.keys()])) console.log(`- ${k}: ${tb.get(k) || 0} | ${tf.get(k) || 0}`);
const comp = (rows) => { const m = {}; for (const r of rows) if (cls(r) === 'hook') { const x = /called by %s[\s\S]*?\n ?(\w+) 1\./.exec(r.text); const n = x ? x[1] : '?'; m[n] = (m[n] || 0) + 1; } return m; };
console.log('\nComponent named in the hook-order record: base ' + JSON.stringify(comp(sets.base)) + ', fix ' + JSON.stringify(comp(sets.fix)));
