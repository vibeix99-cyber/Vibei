import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// NOTE: PWA / service worker wiring is owned by the timer+pwa area (see docs/ARCHITECTURE.md).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    // ---- PWA (owner: timer/PWA area) --------------------------------------
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/pwa',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false, // src/pwa/register.ts (called from boot)
      // Icons, favicon and the manifest are already covered by globPatterns below.
      includeAssets: [],
      includeManifestIcons: false,
      manifest: {
        id: './',
        name: 'Kettle — cozy focus timer',
        short_name: 'Kettle',
        description: 'Put the kettle on. Get cozy. Get it done. A warm focus timer with tea breaks and a sleepy capybara.',
        lang: 'en',
        start_url: './',
        scope: './',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'any',
        theme_color: '#fff9f0',
        background_color: '#fff9f0',
        categories: ['productivity', 'lifestyle'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        // App shell + self-hosted fonts + icons + the lazy three.js chunk → fully offline.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      devOptions: { enabled: false }, // never a service worker in dev
    }),
    // -----------------------------------------------------------------------
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: '127.0.0.1',
    // Tooling output must never trigger HMR/full reloads on everyone's dev pages.
    watch: { ignored: ['**/.shots/**', '**/review/**', '**/test-results/**', '**/playwright-report/**', '**/docs/**', '**/dist/**'] },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
} as never);
