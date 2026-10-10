import { readFileSync, writeFileSync } from 'node:fs';
const [out, ...f] = process.argv.slice(2);
const runs = f.flatMap((x) => JSON.parse(readFileSync(x, 'utf8')));
const L = ['| rev | theme | flow | notch | warning lines wholly read | text coverage by visited scroll offsets | warning taken away / faded / jumped while read | entry re-mount | first line covered at full opacity (ms) | box top..bottom at look | Save backup tapped |', '|---|---|---|---|---|---|---|---|---|---|---|'];
for (const r of runs) L.push(`| ${r.rev} | ${r.theme} | ${r.flow} | ${r.how} | ${r.lines.seen}/${r.lines.total} | ${r.coverage ?? '-'} | ${r.readHides || r.fadedFrames || r.absentFrames || r.jumps ? 'YES' : 'none'} | ${r.entry ? `yes (${r.entry.lifeMs} ms)` : 'no'} | ${r.firstAtFull === 0 ? r.firstCoveredMs ?? 'never' : '-'} | ${r.box ? '' : ''} | ${r.flags.includes('F') ? 'NO' : 'yes'} |`);
writeFileSync(out, L.join('\n') + '\n'); console.log(L.join('\n'));
