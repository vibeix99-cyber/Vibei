// Minimal typing for the node built-in used by src/art/rive/clearBackground.test.ts (the app has no @types/node).
declare module 'node:fs' {
  export function readFileSync(path: string): Uint8Array;
}
