// summarise read.mjs jsonl files into a compact table. node summ-read.mjs <jsonl...>
import { readFileSync } from 'node:fs';
const rows = process.argv.slice(2).flatMap((f) => readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)));
const short = (b) => b.map((x) => x.replace(/ \(first t=.*$/, '').replace(/:.*$/, '')).join(' | ');
for (const r of rows) {
  const entry = r.entryHide ? 'ENTRY-HIDE' : '-';
  console.log(`${r.rev} ${r.W}x${r.H} ${r.theme} t${r.text} ${r.flow} ${r.how}: ${r.bad.length ? 'FAIL' : 'ok  '} lines ${r.linesRead?.seen}/${r.linesRead?.total} first@full ${r.firstLineAtFull} look ${r.firstLineLookMin} entry ${entry} readHide ${r.readHide} reshows ${r.reshows} inst ${JSON.stringify(r.instances)} steps ${r.readSteps} overDock ${r.overDockFrames} sq ${r.squeezed?.length ?? 0} dl ${r.download} :: ${short(r.bad)}`);
}
const n = rows.length, f = rows.filter((r) => r.bad.length).length;
console.log(`total ${n} runs, ${f} with at least one flag`);
