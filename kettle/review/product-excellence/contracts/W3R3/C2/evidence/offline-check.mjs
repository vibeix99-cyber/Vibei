// Offline: with the service worker active, the three hashed poses are served from the precache. node offline-check.mjs <previewURL>
import { createRequire } from 'node:module';
const require = createRequire('/home/user/wt/w9c/kettle/package.json');
const { chromium } = require('@playwright/test');
const base = process.argv[2];
const b = await chromium.launch();
const ctx = await b.newContext();
const p = await ctx.newPage();
await p.goto(`${base}/?debug&theme=dark#/`);
await p.evaluate(() => navigator.serviceWorker.ready);
await p.waitForTimeout(3000);
await p.reload(); await p.waitForTimeout(1500); // controlled by the SW
await ctx.setOffline(true);
const r = await p.evaluate(async () => {
  const names = [];
  for (const n of await caches.keys()) for (const q of await (await caches.open(n)).keys()) if (/chai-(reading|sipping|cheering)-/.test(q.url)) names.push(q.url);
  const out = [];
  for (const u of names) { const x = await fetch(u); const buf = await x.arrayBuffer(); out.push([u.split('/').pop(), x.status, buf.byteLength]); }
  return { controlled: !!navigator.serviceWorker.controller, out };
});
console.log(JSON.stringify(r));
await b.close();
