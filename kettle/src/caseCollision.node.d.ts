// Minimal typings for the node built-ins used by src/caseCollision.test.ts (the app has no @types/node).
declare module 'node:fs' {
  export function readdirSync(path: string, options: { withFileTypes: true }): { name: string; isDirectory(): boolean }[];
}
declare module 'node:path' {
  export function dirname(p: string): string;
  export function join(...parts: string[]): string;
  export function relative(from: string, to: string): string;
}
declare module 'node:url' {
  export function fileURLToPath(url: string | URL): string;
}
