import fs from 'node:fs';
import { html, raw } from './html.mjs';

const manifestPath = new URL('../images.json', import.meta.url);
export const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};

/** Responsive <img> with srcset from the processed WebP set. */
export function img(root, name, { alt = '', sizes = '100vw', cls = '', eager = false, style = '', id = '', attrs = '' } = {}) {
  const m = manifest[name];
  if (!m) throw new Error(`Unknown image "${name}" — run npm run images`);
  const srcset = m.widths.map((w) => `${root}img/${name}-${w}.webp ${w}w`).join(', ');
  const src = `${root}img/${name}-${m.widths[m.widths.length - 1]}.webp`;
  return html`<img ${raw(attrs)} ${raw(id ? `id="${id}"` : '')} src="${src}" srcset="${srcset}" sizes="${sizes}" width="${m.w}" height="${m.h}" alt="${alt}" ${raw(cls ? `class="${cls}"` : '')} ${raw(style ? `style="${style}"` : '')} ${raw(eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"')}>`;
}
export const chaiList = () => manifest.__chai ?? [];
