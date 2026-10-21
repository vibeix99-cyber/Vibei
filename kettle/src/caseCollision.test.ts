/**
 * Guard: no two paths under src/ may differ only by case (ignoring a script extension). Windows and macOS
 * resolve such imports to the wrong file (`SaveWarning.tsx` vs `saveWarning.ts`).
 */
import { readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = dirname(fileURLToPath(import.meta.url));
const SCRIPT_EXT = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

function walk(dir: string, out: string[]): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules') continue;
    const full = join(dir, e.name);
    out.push(relative(SRC, full).split('\\').join('/'));
    if (e.isDirectory()) walk(full, out);
  }
  return out;
}

export function findCollisions(paths: string[]): string[] {
  const seen = new Map<string, string>();
  const clashes: string[] = [];
  for (const p of paths) {
    const key = p.replace(SCRIPT_EXT, '').toLowerCase();
    const prev = seen.get(key);
    if (prev !== undefined) clashes.push(`${prev}  <->  ${p}`);
    else seen.set(key, p);
  }
  return clashes;
}

describe('case-insensitive path collisions in src/', () => {
  it('detects a colliding pair (self-check)', () => {
    expect(findCollisions(['a/Foo.tsx', 'a/foo.ts', 'b/x.ts'])).toHaveLength(1);
    expect(findCollisions(['a/Dir', 'a/dir'])).toHaveLength(1);
  });

  it('has none', () => {
    const clashes = findCollisions(walk(SRC, []).sort());
    expect(clashes, `Paths differ only by case:\n${clashes.join('\n')}`).toEqual([]);
  });
});
