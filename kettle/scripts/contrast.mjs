#!/usr/bin/env node
/**
 * WCAG contrast audit for Kettle's design tokens. OWNER: design-system area.
 *
 *   node scripts/contrast.mjs          # table of every pairing, exits 1 on failure
 *   node scripts/contrast.mjs --fails  # only failing rows
 *
 * Parses src/styles/tokens.css (light block + dark overrides, resolving var()
 * aliases) so the audit always reflects the real tokens.
 *   AA body text      4.5:1
 *   AA large text     3:1  (>= 18.66px bold — button labels are 19px/700)
 *   Non-text UI       3:1  (focus ring, control boundaries that carry meaning)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url)), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

function block(selectorRe) {
  const out = {};
  const re = new RegExp(selectorRe.source + String.raw`\s*\{([^}]*)\}`, 'g');
  for (const m of css.matchAll(re)) {
    for (const d of m[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) out[d[1]] = d[2].trim();
  }
  return out;
}
const base = block(/:root(?:,\s*:root\[data-theme='light'\])?(?=\s*\{)/);
const lightTheme = { ...base, ...block(/:root,\s*:root\[data-theme='light'\]/) };
const darkTheme = { ...lightTheme, ...block(/:root\[data-theme='dark'\]/) };

function resolve(theme, name, depth = 0) {
  const v = theme[name];
  if (v == null) throw new Error(`unknown token --${name}`);
  const m = v.match(/^var\(--([\w-]+)\)$/);
  if (m && depth < 10) return resolve(theme, m[1], depth + 1);
  return v;
}
function hex(v) {
  const m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) throw new Error(`not a hex color: ${v}`);
  let h = m[1];
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function lum([r, g, b]) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a, b) {
  const [x, y] = [lum(hex(a)), lum(hex(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const TONES = ['persimmon', 'matcha', 'honey', 'sky', 'berry', 'plum'];
const TEXT = 4.5;
const LARGE = 3;
const UI = 3;

/** [fg, bg, min, what] */
const pairs = [];
for (const bg of ['bg', 'bg-sunken', 'surface', 'surface-2', 'surface-3']) {
  pairs.push(['ink', bg, TEXT, 'primary text']);
  pairs.push(['ink-2', bg, TEXT, 'secondary text']);
  pairs.push(['ink-3', bg, TEXT, 'tertiary text / captions']);
}
pairs.push(['ink-inverse', 'inverse', TEXT, 'toast text']);
for (const t of TONES) {
  pairs.push([`${t}-on`, t, LARGE, `${t} button label (19px/700)`]);
  pairs.push([`${t}-on`, `${t}-strong`, TEXT, `${t} small button label (16px)`]);
  pairs.push([`${t}-ink`, `${t}-soft`, TEXT, `${t} text on tinted bg`]);
  pairs.push([`${t}-ink`, 'surface', TEXT, `${t} text on card`]);
  pairs.push([`${t}-ink`, 'bg', TEXT, `${t} text on page`]);
  pairs.push(['ink', `${t}-soft`, TEXT, `body text on ${t} tint`]);
  pairs.push(['ink-2', `${t}-soft`, TEXT, `secondary text on ${t} tint`]);
}
pairs.push(['focus-ring', 'bg', UI, 'focus ring vs page']);
pairs.push(['focus-ring', 'surface', UI, 'focus ring vs card']);
pairs.push(['persimmon', 'bg', UI, 'primary button face vs page']);
pairs.push(['matcha', 'surface', UI, 'toggle-on track vs card']);
pairs.push(['ink-3', 'surface-3', UI, 'toggle-off thumb vs its track']);
pairs.push(['ink-3', 'surface', UI, 'slider/stepper boundary vs card']);

/**
 * Informational only (not counted): progress fills vs their track. Every bar/ring in
 * the kit also exposes its value as text (visible label + aria-valuetext), so the
 * fill is supplementary per WCAG 1.4.11 — we still keep it close to 3:1.
 */
const info = [];
for (const t of ['persimmon', 'matcha', 'sky', 'berry', 'plum']) info.push([t, 'surface-3', 3, `${t} fill vs track`]);

const onlyFails = process.argv.includes('--fails');
let fails = 0;
for (const [name, theme] of [
  ['light', lightTheme],
  ['dark', darkTheme],
]) {
  console.log(`\n${name.toUpperCase()}`);
  for (const [fg, bg, min, what] of pairs) {
    const r = ratio(resolve(theme, fg), resolve(theme, bg));
    const ok = r >= min;
    if (!ok) fails++;
    if (onlyFails && ok) continue;
    const mark = ok ? 'ok  ' : 'FAIL';
    console.log(`  ${mark} ${r.toFixed(2).padStart(5)} ≥ ${min}  --${fg} on --${bg}  (${what})`);
  }
}
for (const [name, theme] of [
  ['light', lightTheme],
  ['dark', darkTheme],
]) {
  if (onlyFails) break;
  console.log(`\n${name.toUpperCase()} — informational`);
  for (const [fg, bg, min, what] of info) {
    const r = ratio(resolve(theme, fg), resolve(theme, bg));
    console.log(`  ${r >= min ? 'ok  ' : 'info'} ${r.toFixed(2).padStart(5)} ~ ${min}  --${fg} on --${bg}  (${what})`);
  }
}
console.log(fails ? `\n${fails} failing pairing(s)` : '\nAll pairings pass WCAG AA.');
process.exit(fails ? 1 : 0);
