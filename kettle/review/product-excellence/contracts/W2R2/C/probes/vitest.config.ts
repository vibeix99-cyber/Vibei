import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['review/product-excellence/contracts/W2R2/C/probes/*.probe.test.ts'], environment: 'node' } });
