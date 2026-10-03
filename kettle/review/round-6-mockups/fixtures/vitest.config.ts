/** Runs only the fixture generator, with the app's own aliases: npx vitest run -c review/round-6-mockups/fixtures/vitest.config.ts */
import base from '../../../vite.config.ts';

export default { ...base, test: { ...base.test, include: ['review/round-6-mockups/fixtures/*.gen.ts'], environment: 'node' } };
