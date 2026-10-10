// aggregate judge JSONs into per-configuration counts. node agg.mjs <out.md> <judge.json...>
import { readFileSync, writeFileSync } from 'node:fs';
const [out, ...files] = process.argv.slice(2);
const runs = files.flatMap((f) => JSON.parse(readFileSync(f, 'utf8')));
const groups = new Map();
for (const r of runs) {
  const k = `${r.rev} | ${r.W}x${r.H} | ${r.theme} | t${r.text}`;
  const g = groups.get(k) ?? { n: 0, A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, any: 0, clean: 0, flows: new Set(), hows: new Set(), clamp: 0 };
  g.n++; g.flows.add(r.flow); g.hows.add(r.how);
  for (const f of r.flags) g[f]++;
  if (r.flags.length) g.any++; else g.clean++;
  if (r.clamps) g.clamp += r.clamps;
  groups.set(k, g);
}
const L = ['| rev | viewport | theme | text | runs | inputs | flows | A first line covered at full opacity | B entry re-mount | C hidden/faded while read | D jump back | E lines not all wholly read | F Save backup unreachable | G box over dock/below room | H squeezed | list clamps (toast left while scrolled) |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
for (const [k, g] of [...groups].sort()) { const [rev, vp, th, tx] = k.split(' | '); L.push(`| ${rev} | ${vp} | ${th} | ${tx} | ${g.n} | ${[...g.hows].join(',')} | ${[...g.flows].join(',')} | ${g.A} | ${g.B} | ${g.C} | ${g.D} | ${g.E} | ${g.F} | ${g.G} | ${g.H} | ${g.clamp} |`); }
const tot = { n: 0, A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0 };
for (const g of groups.values()) for (const k of Object.keys(tot)) tot[k] += g[k];
L.push(`| **total** | | | | ${tot.n} | | | ${tot.A} | ${tot.B} | ${tot.C} | ${tot.D} | ${tot.E} | ${tot.F} | ${tot.G} | ${tot.H} | |`);
writeFileSync(out, L.join('\n') + '\n');
console.log(L.join('\n'));
