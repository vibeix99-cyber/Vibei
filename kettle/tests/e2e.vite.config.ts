/**
 * Dev server for e2e runs: the app's normal config, minus HMR and file
 * watching, so edits elsewhere in the tree can't reload pages mid-test.
 */
import { mergeConfig, type UserConfig } from 'vite';
import base from '../vite.config';

export default mergeConfig(base as unknown as UserConfig, {
  server: { hmr: false, watch: null },
} satisfies UserConfig);
