// Lane K task 6: are the three Chai files in the live service-worker precache (Cache Storage) on the preview servers?
import fs from 'node:fs';
import { launch, newCtx } from './lib.mjs';
const out = {};
const b = await launch();
for (const [side, base] of [['before', 'http://localhost:5570'], ['after', `http://localhost:${process.env.K_AFTER_PREVIEW ?? 5622}`]]) {
  const ctx = await newCtx(b, { vw: 390, vh: 844, frozen: false });
  const page = await ctx.newPage();
  await page.goto(`${base}/?debug`);
  await page.waitForFunction(async () => (await navigator.serviceWorker.getRegistration())?.active?.state === 'activated', null, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(6000);
  out[side] = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    const rows = [];
    for (const name of await caches.keys()) { const c = await caches.open(name); for (const r of await c.keys()) if (/chai-(reading|sipping|cheering)/.test(r.url)) { const resp = await c.match(r); rows.push({ cache: name.slice(0, 40), file: r.url.split('/').pop(), bytes: (await resp.clone().arrayBuffer()).byteLength }); } }
    return { sw: reg?.active?.state ?? null, entries: rows };
  });
  await ctx.close();
}
await b.close(); fs.writeFileSync(`${process.env.K_OUT}/json/pwa-cache${process.env.K_SUF ?? ''}.json`, JSON.stringify(out, null, 1)); console.log(JSON.stringify(out));
