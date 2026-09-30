// Tiny escaped-by-default HTML templating. Interpolated values are escaped unless wrapped with raw().
class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Raw(String(s ?? ''));
export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const str = (v) => {
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(str).join('');
  if (v === null || v === undefined || v === false) return '';
  return esc(v);
};
export const html = (strings, ...vals) => raw(strings.reduce((a, s, i) => a + s + (i < vals.length ? str(vals[i]) : ''), ''));
export const toString = str;
