// summarise desk.mjs jsonl: node summ-desk.mjs <out.md> <jsonl...>
import { readFileSync, writeFileSync } from 'node:fs';
const [out, ...files] = process.argv.slice(2);
const rows = files.flatMap((f) => readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)));
const L = ['| run | lift applied (ms after first toast mount) | stack settled (ms, from first frame) | toast-over-dock overlap while arriving: frames / max px / span ms (max opacity) | overlap after settle | warning: first-instance life → re-shown | warning rest box | frames in first 2.5 s / max frame gap ms | notes |', '|---|---|---|---|---|---|---|---|---|'];
for (const r of rows) {
  const err = (r.notes ?? []).find((n) => n.startsWith('ERROR'));
  const life = r.warnLifetimes ? JSON.stringify(r.warnLifetimes) : '-';
  L.push(`| ${r.rev} ${r.W}x${r.H} ${r.theme} t${r.text} ${r.flow} | ${r.liftLatencyMs ?? '-'}${r.liftStyleEvents?.length ? ` (${r.liftStyleEvents.slice(0, 3).map((e) => `+${e[0]}:${e[1]}`).join(' ')})` : ''} | ${r.stackSettleMs != null ? Math.round(r.stackSettleMs) : '-'} | ${r.dockOverlapFrames ?? '-'} / ${r.dockOverlapMaxPx ?? '-'} / ${r.dockOverlapSpanMs ?? '-'} (${r.dockOverlapMaxOpacity != null ? Math.round(r.dockOverlapMaxOpacity * 100) / 100 : '-'}) | ${r.dockOverlapAfterSettleFrames ?? '-'} | ${life} | ${r.warnRestBox ? JSON.stringify(r.warnRestBox) : '-'} | ${r.framesIn2500ms ?? '-'} / ${r.maxFrameGapMs ?? '-'} | ${err ? err : (r.notes ?? []).join('; ')} |`);
}
writeFileSync(out, L.join('\n') + '\n');
console.log(L.join('\n'));
