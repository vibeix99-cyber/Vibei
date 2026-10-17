// node summary3.cjs <diff3.json> : markdown summary of the pairs
const rows = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8'));
const by = (c) => rows.filter((r) => r.cls === c).length;
const withNoise = rows.filter((r) => r.noisePx != null);
const sorted = withNoise.map((r) => r.noisePx).sort((a, b) => a - b);
console.log(`Pairs: ${rows.length}. **identical ${by('identical')}**, **within the noise floor ${by('within-noise')}**, **difference ${by('difference')}**, incomplete ${rows.filter((r) => r.missing || r.sizeDiff).length}.`);
console.log(`Noise floor (BEFORE vs BEFORE2, same build twice): pixel-identical in ${withNoise.filter((r) => r.noisePx === 0).length} of ${withNoise.length} states; where not, median ${sorted.filter((x) => x).length ? sorted.filter((x) => x)[sorted.filter((x) => x).length >> 1] : 0} px, max ${sorted[sorted.length - 1]} px, largest channel delta ${Math.max(0, ...withNoise.map((r) => r.noiseMax || 0))}/255; states where the base differs from itself by more than 2 levels: ${withNoise.filter((r) => r.noiseBig > 0).length}.`);
const cfgs = [...new Set(rows.map((r) => r.cfg))];
const states = [...new Set(rows.map((r) => r.state))];
console.log('\n| Configuration | ' + states.join(' | ') + ' |\n|---|' + states.map(() => ':-:').join('|') + '|');
const L = { identical: 'I', 'within-noise': 'N', difference: '**D**' };
for (const c of cfgs) console.log(`| ${c} | ` + states.map((s) => { const r = rows.find((x) => x.cfg === c && x.state === s); return r ? (L[r.cls] || (r.missing ? '?' : 'S')) : '-'; }).join(' | ') + ' |');
console.log('\nI = identical, N = within the noise floor, D = difference, ? = not captured, S = size differs.');
const dd = rows.filter((r) => r.cls === 'difference');
if (dd.length) { console.log('\nDifferences:\n'); for (const r of dd) console.log(`- \`${r.cfg}/${r.state}\`: differing px ${r.px}, real ${r.real} (max delta ${r.maxDelta}), bbox ${JSON.stringify(r.bbox)}, noise px ${r.noisePx}, crop \`crops/${r.crop}\``); }
