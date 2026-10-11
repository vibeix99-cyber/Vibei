// Summarise Lane D captures: one row per (config, state): R7 vs INT facts from meta.json (banner, note, toasts, Close).
//   node summarize-caps.cjs <captures root>
const fs = require('node:fs');
const root = process.argv[2];
const cfgs = new Set();
for (const side of ['R7', 'INT']) if (fs.existsSync(`${root}/${side}`)) for (const d of fs.readdirSync(`${root}/${side}`)) cfgs.add(d);
const rows = [];
const fmt = (s) => {
  if (!s) return 'not captured';
  const bits = [s.hash];
  if (s.banner) bits.push(`banner ${s.banner.inView ? 'in view' : s.banner.partlyInView ? 'partly in view' : 'out of view'} (top ${s.banner.top}, bottom ${s.banner.bottom})`);
  if (s.summaryNote) bits.push('summary note');
  if (s.warningToast) bits.push('warning toast');
  if (s.toasts?.length) bits.push(`${s.toasts.length} toast(s)`);
  if (s.close) bits.push(`Close ${s.close.hitTestable ? 'hit-testable' : 'NOT hit-testable'}`);
  if (s.lastLine) bits.push(`last line ${s.lastLine.lastLineBottom} vs footer ${s.lastLine.footerTop}: ${s.lastLine.clears ? 'clears' : 'DOES NOT clear'}`);
  if (s.scroll && (s.scroll.main || s.scroll.doc)) bits.push(`scroll main ${s.scroll.main}/${s.scroll.mainMax} doc ${s.scroll.doc}/${s.scroll.docMax}`);
  return bits.join('; ');
};
for (const c of [...cfgs].sort()) {
  const m = {};
  for (const side of ['R7', 'INT']) { try { m[side] = JSON.parse(fs.readFileSync(`${root}/${side}/${c}/meta.json`, 'utf8')); } catch { m[side] = null; } }
  const states = new Set([...Object.keys(m.R7?.states ?? {}), ...Object.keys(m.INT?.states ?? {})]);
  for (const st of [...states].sort()) rows.push(`| ${c} | ${st} | ${fmt(m.R7?.states?.[st])} | ${fmt(m.INT?.states?.[st])} |`);
  for (const side of ['R7', 'INT']) if (m[side]?.errors?.length) rows.push(`| ${c} | errors (${side}) | ${m[side].errors.join(' / ').replace(/\|/g, '/')} | |`);
}
console.log('| Config | State | R7 | INT |\n|---|---|---|---|\n' + rows.join('\n'));
