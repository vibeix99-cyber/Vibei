import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) } },
  test: { environment: 'node', include: ['.tmp/n/*.probe.test.ts'], root: fileURLToPath(new URL('../..', import.meta.url)) },
});
