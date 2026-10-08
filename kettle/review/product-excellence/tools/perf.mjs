// Kettle performance probe (I14): the same measurements on any build, repeatable for BEFORE / AFTER.
//
// usage (from kettle/, against a production build served by `vite preview`):
//   npx vite build --outDir /tmp/kettle-a && npx vite preview --outDir /tmp/kettle-a --port 5242 --strictPort
//   node review/product-excellence/tools/perf.mjs --base http://127.0.0.1:5242 [--name before] \
//        [--base http://127.0.0.1:5243 --name after] [--runs 3] [--profiles phone,desktop] \
//        [--out review/product-excellence/perf/<label>] [--theme light] [--sw block|allow] [--cpu 1] [--nookq high|low]
//
// Several --base values are measured back to back in ALTERNATING order (run 1: A B, run 2: B A, run 3: A B …),
// each sample in a fresh browser context (cold HTTP cache, empty storage), so machine load and drift hit every
// build alike. Writes <out>/perf.json (environment, every sample, medians) and <out>/summary.md, and prints the
// summary. With two bases the summary adds a B − A column per metric.
//
// Journeys per sample (phone = 390×844 DPR 2 mobile emulation; desktop = 1440×900 DPR 1):
//   cold    fresh load of Today → tap "Put the kettle on" as soon as it exists → first-interactive proxy,
//           startup paint/navigation timings, cold Start input timing.
//   journey fresh load of Today, settle 8 s → Home heap/CLS/bytes → Start → Focus (3D window, heap) → Pause →
//           Resume → +5 → whistle → Summary (heap) → Tea time → break. Input timing per control (Event Timing,
//           durationThreshold 16, max duration of the interaction; "<16" when no entry crossed the threshold),
//           click → next paint, layout shift per segment, main-thread busy time, Chai intrinsic vs rendered size.
//   nook    fresh load straight onto #/nook → 3D first render (data-scene-ready), CLS on load, heap, bytes.
//
// Service workers are blocked by default (--sw allow to include them): the PWA precache (≈2.4 MB, every chunk) is a
// background download that would otherwise race the measured page and hide later requests behind its cache.
// Bytes are CDP encodedDataLength (what crossed the wire; `vite preview` gzips) plus a gzip -6 estimate of each file.
//
// The renderer here is whatever Chromium gets: in this container that is SwiftShader (CPU). These numbers compare
// builds on the same machine; they are not phone numbers and say nothing about GPU frame pacing or energy.
import { chromium, devices } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import os from 'node:os';
import zlib from 'node:zlib';

// ---------------------------------------------------------------- args
const argv = process.argv.slice(2);
const multi = (k) => argv.flatMap((a, i) => (a === `--${k}` && argv[i + 1] ? [argv[i + 1]] : []));
const one = (k, d) => multi(k).at(-1) ?? d;
// --from <perf.json>: rebuild the summary from an earlier run without measuring again.
const FROM = multi('from').at(-1);
const prior = FROM ? JSON.parse(readFileSync(FROM, 'utf8')) : null;
const bases = prior ? prior.env.bases.map((b) => b.base) : multi('base').flatMap((b) => b.split(','));
if (!bases.length) throw new Error('--base <url> required (repeat for an A/B comparison)');
const names = prior ? prior.env.bases.map((b) => b.name) : multi('name').flatMap((n) => n.split(','));
const label = (i) => names[i] ?? (bases.length > 1 ? String.fromCharCode(65 + i) : 'build');
const RUNS = prior ? prior.env.runs : +one('runs', 3);
const PROFILES = prior ? prior.env.profiles : one('profiles', 'phone,desktop').split(',');
const THEME = prior ? prior.env.theme : one('theme', 'light');
const SW = prior ? prior.env.serviceWorkers : one('sw', 'block');
const CPU = prior ? prior.env.cpuThrottle : +one('cpu', 1);
const NOOKQ = prior ? (prior.env.nookq.startsWith('auto') ? '' : prior.env.nookq) : one('nookq', '');
const OUT = one('out', `review/product-excellence/perf/run-${new Date().toISOString().replace(/[:.]/g, '-')}`);
mkdirSync(OUT, { recursive: true });

const PROFILE = {
  phone: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: devices['Pixel 7'].userAgent,
  },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  // Optional: a Retina laptop (Chai sharpness at DPR 2 on the desktop layout).
  desktop2x: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, isMobile: false, hasTouch: false },
};

const sh = (c) => {
  try {
    return execSync(c, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
};
const load = () => os.loadavg().map((x) => +x.toFixed(2));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r1 = (x) => (x == null || Number.isNaN(x) ? null : Math.round(x * 10) / 10);

// ---------------------------------------------------------------- in-page instrumentation
// Runs before any app code. Everything is stamped with performance.now() (ms since navigation start).
const INIT = () => {
  const P = (window.__perf = { events: [], firstInput: null, shifts: [], lcp: [], fcp: null, longtasks: [], clicks: [], startReady: null, scene: {}, hash: [] });
  const desc = (n) => {
    if (!n || !n.tagName) return null;
    const lab = n.getAttribute?.('aria-label') || (n.textContent || '').trim().slice(0, 40);
    return `${n.tagName.toLowerCase()}${n.className && typeof n.className === 'string' ? '.' + n.className.split(' ')[0] : ''}${lab ? ` "${lab}"` : ''}`;
  };
  const obs = (type, fn, extra = {}) => {
    try {
      new PerformanceObserver((l) => l.getEntries().forEach(fn)).observe({ type, buffered: true, ...extra });
    } catch {
      /* unsupported */
    }
  };
  obs('event', (e) => P.events.push({ name: e.name, start: e.startTime, dur: e.duration, ps: e.processingStart, pe: e.processingEnd, id: e.interactionId, target: desc(e.target) }), { durationThreshold: 16 });
  obs('first-input', (e) => (P.firstInput = { name: e.name, start: e.startTime, delay: e.processingStart - e.startTime, dur: e.duration }));
  obs('layout-shift', (e) =>
    P.shifts.push({
      start: e.startTime,
      value: e.value,
      input: e.hadRecentInput,
      sources: (e.sources || []).slice(0, 3).map((s) => desc(s.node)),
    }),
  );
  obs('largest-contentful-paint', (e) => P.lcp.push({ start: e.startTime, size: e.size, el: desc(e.element), url: e.url || '' }));
  obs('paint', (e) => {
    if (e.name === 'first-contentful-paint') P.fcp = e.startTime;
  });
  obs('longtask', (e) => P.longtasks.push({ start: e.startTime, dur: e.duration }));
  // Click → next paint: the frame after the handlers ran (rAF), then the task after that frame painted.
  addEventListener(
    'click',
    (e) => {
      const rec = { ts: e.timeStamp, target: desc(e.target.closest?.('button,a,[role=button]') || e.target), handled: performance.now(), paint: null };
      P.clicks.push(rec);
      requestAnimationFrame(() => {
        const mc = new MessageChannel();
        mc.port1.onmessage = () => (rec.paint = performance.now() - rec.ts);
        mc.port2.postMessage(0);
      });
    },
    true,
  );
  // The router uses pushState (no hashchange event): record route changes from the poll below.
  let lastHash = null;
  // Start ready: the first frame in which "Put the kettle on" exists and is enabled. 3D: first frame a scene of
  // each mode reports ready (or shows its static stand-in).
  const poll = () => {
    if (location.hash !== lastHash) P.hash.push({ t: performance.now(), hash: (lastHash = location.hash) });
    if (P.startReady == null) {
      const b = [...document.querySelectorAll('button')].find((x) => /Put the kettle on/.test(x.textContent || '') && !x.disabled);
      if (b) P.startReady = performance.now();
    }
    document.querySelectorAll('[data-scene-mode]').forEach((n) => {
      const m = n.getAttribute('data-scene-mode');
      const k = n.getAttribute('data-scene-ready') === 'true' ? `${m}:ready` : n.getAttribute('data-scene-static') ? `${m}:static` : `${m}:mounted`;
      if (P.scene[k] == null) P.scene[k] = performance.now();
    });
  };
  const loop = () => {
    poll();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  setInterval(poll, 50);
};

// ---------------------------------------------------------------- page helpers
const gz = new Map();
async function gzipSize(url) {
  if (gz.has(url)) return gz.get(url);
  let n = null;
  try {
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    n = zlib.gzipSync(buf, { level: 6 }).length;
  } catch {
    /* ignore */
  }
  gz.set(url, n);
  return n;
}
function category(url, type) {
  const f = url.split('?')[0].split('#')[0];
  if (/\/three-[^/]+\.js$/.test(f)) return 'three';
  if (/\/NookScene-[^/]+\.js$/.test(f)) return 'scene3d';
  if (type === 'Script' || /\.m?js$/.test(f)) return 'js';
  if (type === 'Stylesheet' || /\.css$/.test(f)) return 'css';
  if (type === 'Font' || /\.woff2?$/.test(f)) return 'font';
  if (type === 'Image' || /\.(png|webp|svg|jpe?g|avif|gif)$/.test(f)) return 'image';
  if (type === 'Document') return 'html';
  return 'other';
}

async function openPage(ctx) {
  const page = await ctx.newPage();
  await page.addInitScript(INIT);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' }).catch(() => cdp.send('Performance.enable'));
  await cdp.send('Network.enable');
  if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  const reqs = new Map();
  const net = [];
  cdp.on('Network.responseReceived', (e) => reqs.set(e.requestId, { url: e.response.url, type: e.type, status: e.response.status }));
  cdp.on('Network.loadingFinished', (e) => {
    const r = reqs.get(e.requestId);
    if (r) net.push({ ...r, bytes: e.encodedDataLength });
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return { page, cdp, net, errors };
}
async function metrics(cdp, gc = true) {
  if (gc) await cdp.send('HeapProfiler.collectGarbage').catch(() => {});
  const { metrics: m } = await cdp.send('Performance.getMetrics');
  const g = Object.fromEntries(m.map((x) => [x.name, x.value]));
  return {
    heapUsedMB: r1(g.JSHeapUsedSize / 1048576),
    heapTotalMB: r1(g.JSHeapTotalSize / 1048576),
    nodes: g.Nodes,
    listeners: g.JSEventListeners,
    taskMs: r1(g.TaskDuration * 1000),
    scriptMs: r1(g.ScriptDuration * 1000),
    layoutMs: r1(g.LayoutDuration * 1000),
    styleMs: r1(g.RecalcStyleDuration * 1000),
  };
}
async function bytes(net, base) {
  const out = { total: 0, totalGzip: 0, requests: net.length, by: {} };
  for (const r of net) {
    const c = category(r.url, r.type);
    const o = (out.by[c] ??= { bytes: 0, gzip: 0, n: 0 });
    o.bytes += r.bytes;
    o.n++;
    out.total += r.bytes;
    const g = r.url.startsWith(base) && r.status === 200 ? await gzipSize(r.url) : null;
    o.gzip += g ?? r.bytes;
    out.totalGzip += g ?? r.bytes;
  }
  for (const k of Object.keys(out.by)) out.by[k] = { kb: r1(out.by[k].bytes / 1024), gzipKb: r1(out.by[k].gzip / 1024), n: out.by[k].n };
  out.totalKb = r1(out.total / 1024);
  out.totalGzipKb = r1(out.totalGzip / 1024);
  delete out.total;
  delete out.totalGzip;
  return out;
}
const now = (page) => page.evaluate(() => performance.now());
const perf = (page) => page.evaluate(() => window.__perf);
async function press(page, phone, locator) {
  await locator.waitFor({ state: 'visible', timeout: 90_000 });
  if (phone) await locator.tap({ timeout: 90_000 });
  else await locator.click({ timeout: 90_000 });
}
/** The interaction that started after t0: Event Timing max duration (INP-style), input delay, click → next paint. */
async function interaction(page, t0) {
  await sleep(1200); // Event Timing entries are delivered after the next paint
  return page.evaluate((t0) => {
    const P = window.__perf;
    const evs = P.events.filter((e) => e.start >= t0 - 1 && e.id > 0);
    const firstId = evs.length ? Math.min(...evs.map((e) => e.id)) : null;
    const mine = evs.filter((e) => e.id === firstId);
    const click = P.clicks.find((c) => c.ts >= t0 - 1);
    return {
      eventMs: mine.length ? Math.max(...mine.map((e) => e.dur)) : 0, // 0 = no entry ≥ 16 ms
      inputDelayMs: mine.length ? Math.max(...mine.map((e) => e.ps - e.start)) : null,
      processingMs: mine.length ? Math.max(...mine.map((e) => e.pe - e.ps)) : null,
      entries: mine.map((e) => `${e.name}:${Math.round(e.dur)}`).join(' '),
      clickToPaintMs: click?.paint ?? null,
      target: click?.target ?? null,
    };
  }, t0);
}
function cls(shifts, from, to) {
  const s = shifts.filter((x) => !x.input && x.start >= from && x.start < to);
  // Max session window (1 s gap, 5 s cap), as Web Vitals CLS defines it.
  let best = 0;
  let cur = 0;
  let first = 0;
  let last = 0;
  for (const x of s) {
    if (cur && (x.start - last > 1000 || x.start - first > 5000)) {
      cur = 0;
    }
    if (!cur) first = x.start;
    cur += x.value;
    last = x.start;
    best = Math.max(best, cur);
  }
  const top = [...s].sort((a, b) => b.value - a.value).slice(0, 3).map((x) => `${x.value.toFixed(4)} ${x.sources.join(' | ')}`);
  return { sum: +s.reduce((a, x) => a + x.value, 0).toFixed(4), window: +best.toFixed(4), count: s.length, top };
}
function tbt(longtasks, from, to) {
  return r1(longtasks.filter((t) => t.start >= from && t.start < to).reduce((a, t) => a + Math.max(0, t.dur - 50), 0));
}
async function chai(page, dpr) {
  return page.evaluate((dpr) =>
    [...document.querySelectorAll('img')]
      .filter((i) => /chai-/.test(i.currentSrc || i.src))
      .map((i) => {
        const r = i.getBoundingClientRect();
        const file = (i.currentSrc || i.src).split('/').pop().replace(/-[\w-]{8}\.webp$/, '.webp');
        return {
          file,
          natural: [i.naturalWidth, i.naturalHeight],
          cssPx: [Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10],
          devicePx: [Math.round(r.width * dpr), Math.round(r.height * dpr)],
          sourcePerDevicePx: r.width ? Math.round((i.naturalWidth / (r.width * dpr)) * 100) / 100 : null,
          onScreen: r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
        };
      }),
  dpr);
}

// ---------------------------------------------------------------- journeys
function url(base, route = '/') {
  const q = `?debug&seed=veteran&theme=${THEME}${THEME === 'light' ? '&nooktime=day' : ''}${NOOKQ ? `&nookq=${NOOKQ}` : ''}`;
  return `${base.replace(/\/$/, '')}/${q}#${route}`;
}
const startBtn = (page) => page.getByRole('button', { name: /Put the kettle on/ }).first();

async function coldStart(ctx, base, phone) {
  const { page, net, errors } = await openPage(ctx);
  await page.goto(url(base), { waitUntil: 'commit', timeout: 120_000 });
  const btn = startBtn(page);
  await btn.waitFor({ state: 'visible', timeout: 120_000 });
  const t0 = await now(page);
  await press(page, phone, btn);
  await page.waitForFunction(() => location.hash.startsWith('#/focus'), null, { timeout: 120_000 });
  await page.waitForLoadState('load');
  const it = await interaction(page, t0);
  const P = await perf(page);
  const nav = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0];
    return { ttfb: n.responseStart, dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd };
  });
  const focusAt = P.hash.find((h) => h.hash.startsWith('#/focus'))?.t ?? null;
  const out = {
    ttfbMs: r1(nav.ttfb),
    fcpMs: r1(P.fcp),
    lcpMs: r1(P.lcp.at(-1)?.start),
    lcpElement: P.lcp.at(-1)?.el ?? null,
    dclMs: r1(nav.dcl),
    loadMs: r1(nav.load),
    startReadyMs: r1(P.startReady),
    firstClickHandledMs: r1(focusAt),
    firstInputDelayMs: r1(P.firstInput?.delay),
    startColdEventMs: it.eventMs,
    startColdClickToPaintMs: r1(it.clickToPaintMs),
    tbtToInteractiveMs: tbt(P.longtasks, 0, focusAt ?? Infinity),
    longestTaskMs: r1(Math.max(0, ...P.longtasks.filter((t) => t.start < (focusAt ?? Infinity)).map((t) => t.dur))),
    bytesToInteractive: await bytes(net, base),
    errors,
  };
  await page.close();
  return out;
}

async function journey(ctx, base, phone, dpr) {
  const { page, cdp, net, errors } = await openPage(ctx);
  const res = { input: {}, cls: {}, heap: {}, busyMs: {}, bytes: {}, chai: {}, scene: {} };
  await page.goto(url(base), { waitUntil: 'load', timeout: 120_000 });
  await startBtn(page).waitFor({ state: 'visible', timeout: 120_000 });
  await page.evaluate(() => document.fonts.ready);
  await sleep(8000); // Today idles: entry motion, the 3D pre-warm, the service worker install
  const tHome = await now(page);
  let m0 = await metrics(cdp, false);
  res.heap.home = await metrics(cdp);
  res.chai.home = await chai(page, dpr);
  res.bytes.home = await bytes(net, base);
  await page.evaluate(() => window.__kettle.settings.getState().set({ autoStartBreaks: false, autoStartFocus: false }));

  const mark = async (k) => {
    const m = await metrics(cdp, false);
    res.busyMs[k] = r1(m.taskMs - m0.taskMs);
    m0 = m;
  };
  // Start (settled)
  let t = await now(page);
  await press(page, phone, startBtn(page));
  await page.waitForFunction(() => location.hash.startsWith('#/focus'), null, { timeout: 120_000 });
  res.input.start = await interaction(page, t);
  const tStart = t;
  await page
    .waitForFunction(() => document.querySelector('[data-scene-mode="window"][data-scene-ready="true"]'), null, { timeout: 45_000 })
    .catch(() => {});
  await sleep(2500);
  let P = await perf(page);
  res.scene.focusWindowReadyMs = P.scene['window:ready'] != null ? r1(P.scene['window:ready'] - tStart) : null;
  res.scene.focusWindowStaticMs = P.scene['window:static'] != null ? r1(P.scene['window:static'] - tStart) : null;
  await mark('homeToFocus');
  res.heap.focus = await metrics(cdp);
  res.chai.focus = await chai(page, dpr);
  res.bytes.focus = await bytes(net, base);

  for (const [k, name] of [
    ['pause', /^Pause$/],
    ['resume', /^Resume$/],
    ['add5', /^Add 5 minutes$/],
  ]) {
    t = await now(page);
    await press(page, phone, page.getByRole('button', { name }).first());
    res.input[k] = await interaction(page, t);
    await sleep(400);
  }
  await mark('focusControls');
  const tFocusEnd = await now(page);
  await page.evaluate(() => window.__kettle.nearEnd());
  await sleep(500);
  await page.evaluate(() => window.__kettle.finish());
  const tea = page.getByRole('button', { name: /Tea time|Long tea break/ }).first();
  await tea.waitFor({ state: 'visible', timeout: 90_000 });
  await sleep(4000); // the kettle whistles on ~1.8 s, the summary settles
  const tSummary = await now(page);
  await mark('whistleToSummary');
  res.heap.summary = await metrics(cdp);
  res.chai.summary = await chai(page, dpr);
  res.bytes.summary = await bytes(net, base);

  t = await now(page);
  await press(page, phone, tea);
  res.input.teaTime = await interaction(page, t);
  await sleep(2500);
  const tBreak = await now(page);
  await mark('break');
  res.chai.break = await chai(page, dpr);
  P = await perf(page);
  res.cls = {
    homeLoad: cls(P.shifts, 0, tHome),
    focus: cls(P.shifts, tHome, tFocusEnd),
    whistleToSummary: cls(P.shifts, tFocusEnd, tSummary),
    break: cls(P.shifts, tSummary, tBreak),
    journey: cls(P.shifts, 0, tBreak),
  };
  res.tbtJourneyMs = tbt(P.longtasks, tHome, tBreak);
  res.longestTaskJourneyMs = r1(Math.max(0, ...P.longtasks.filter((x) => x.start >= tHome).map((x) => x.dur)));
  res.errors = errors;
  await page.close();
  return res;
}

async function nook(ctx, base, dpr) {
  const { page, cdp, net, errors } = await openPage(ctx);
  await page.goto(url(base, '/nook'), { waitUntil: 'load', timeout: 120_000 });
  await page
    .waitForFunction(() => document.querySelector('[data-scene-mode="showcase"][data-scene-ready="true"]'), null, { timeout: 90_000 })
    .catch(() => {});
  await sleep(3000);
  const P = await perf(page);
  const end = await now(page);
  const out = {
    scene3dReadyMs: r1(P.scene['showcase:ready']),
    staticShownMs: r1(P.scene['showcase:static']),
    tier: await page.evaluate(() => document.querySelector('[data-scene-mode="showcase"] canvas') ? 'canvas' : 'static'),
    cls: cls(P.shifts, 0, end),
    heap: await metrics(cdp),
    bytes: await bytes(net, base),
    longestTaskMs: r1(Math.max(0, ...P.longtasks.map((x) => x.dur))),
    errors,
  };
  await page.close();
  return out;
}

// ---------------------------------------------------------------- run
let env;
let samples;
if (prior) {
  ({ env, samples } = prior);
} else {
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  env = {
    startedAt: new Date().toISOString(),
    host: { cpus: os.cpus().length, nproc: +sh('nproc') || null, cpuModel: os.cpus()[0]?.model, memGB: r1(os.totalmem() / 2 ** 30), platform: `${os.type()} ${os.release()}` },
    node: process.version,
    chromium: browser.version(),
    renderer: null,
    uptimeStart: sh('uptime'),
    bases: bases.map((b, i) => ({ name: label(i), base: b })),
    runs: RUNS,
    profiles: PROFILES,
    theme: THEME,
    serviceWorkers: SW,
    cpuThrottle: CPU,
    nookq: NOOKQ || 'auto (default settings)',
    method: 'fresh context per journey; alternating base order per run; median of runs',
  };
  {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    env.renderer = await p.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      const i = gl?.getExtension('WEBGL_debug_renderer_info');
      return gl ? String(gl.getParameter(i ? i.UNMASKED_RENDERER_WEBGL : gl.RENDERER)) : 'no WebGL';
    });
    await ctx.close();
  }
  console.log(`perf: ${bases.length} base(s) × ${PROFILES.join('+')} × ${RUNS} runs · ${env.chromium} · ${env.renderer} · load ${load().join(' ')}`);

  samples = [];
  for (let run = 0; run < RUNS; run++) {
    const order = bases.map((_, i) => i);
    if (run % 2 === 1) order.reverse();
    for (const prof of PROFILES) {
      for (const bi of order) {
        const base = bases[bi];
        const o = PROFILE[prof];
        const mk = () => browser.newContext({ ...o, colorScheme: THEME, serviceWorkers: SW === 'block' ? 'block' : 'allow' });
        const s = { build: label(bi), base, profile: prof, run: run + 1, loadBefore: load() };
        const t0 = Date.now();
        for (const [k, fn] of [
          ['cold', (c) => coldStart(c, base, o.hasTouch)],
          ['journey', (c) => journey(c, base, o.hasTouch, o.deviceScaleFactor)],
          ['nook', (c) => nook(c, base, o.deviceScaleFactor)],
        ]) {
          const ctx = await mk();
          try {
            s[k] = await fn(ctx);
          } catch (e) {
            s[k] = { failed: String(e.message || e).split('\n')[0] };
          }
          await ctx.close();
        }
        s.loadAfter = load();
        s.seconds = Math.round((Date.now() - t0) / 1000);
        samples.push(s);
        console.log(`  run ${run + 1} ${prof} ${s.build}: ${s.seconds}s, load ${s.loadBefore[0]}→${s.loadAfter[0]}${s.cold?.failed || s.journey?.failed || s.nook?.failed ? ' FAILED: ' + [s.cold?.failed, s.journey?.failed, s.nook?.failed].filter(Boolean).join(' / ') : ''}`);
      }
    }
  }
  env.finishedAt = new Date().toISOString();
  env.uptimeEnd = sh('uptime');
  await browser.close();
}

// ---------------------------------------------------------------- summary
const METRICS = [
  ['Startup', 'TTFB (ms)', (s) => s.cold?.ttfbMs],
  ['Startup', 'FCP (ms)', (s) => s.cold?.fcpMs],
  ['Startup', 'LCP (ms)', (s) => s.cold?.lcpMs],
  ['Startup', 'DOMContentLoaded (ms)', (s) => s.cold?.dclMs],
  ['Startup', 'load (ms)', (s) => s.cold?.loadMs],
  ['Startup', 'Start button ready (ms)', (s) => s.cold?.startReadyMs],
  ['Startup', 'first click handled → #/focus (ms)', (s) => s.cold?.firstClickHandledMs],
  ['Startup', 'TBT to first interaction (ms)', (s) => s.cold?.tbtToInteractiveMs],
  ['Input', 'Start, cold: event duration (ms)', (s) => s.cold?.startColdEventMs],
  ['Input', 'Start, cold: click → next paint (ms)', (s) => s.cold?.startColdClickToPaintMs],
  ...['start', 'pause', 'resume', 'add5', 'teaTime'].flatMap((k) => [
    ['Input', `${k}: event duration (ms)`, (s) => s.journey?.input?.[k]?.eventMs],
    ['Input', `${k}: click → next paint (ms)`, (s) => s.journey?.input?.[k]?.clickToPaintMs],
  ]),
  ['Input', 'longest task during journey (ms)', (s) => s.journey?.longestTaskJourneyMs],
  ['Input', 'TBT during journey (ms)', (s) => s.journey?.tbtJourneyMs],
  ...['homeLoad', 'focus', 'whistleToSummary', 'break', 'journey'].map((k) => ['Layout shift', `CLS ${k} (session window)`, (s) => s.journey?.cls?.[k]?.window]),
  ['Layout shift', 'CLS Nook load (session window)', (s) => s.nook?.cls?.window],
  ...['home', 'focus', 'summary'].map((k) => ['Memory', `JS heap used after GC, ${k} (MB)`, (s) => s.journey?.heap?.[k]?.heapUsedMB]),
  ['Memory', 'JS heap used after GC, Nook 3D (MB)', (s) => s.nook?.heap?.heapUsedMB],
  ['Memory', 'DOM nodes, summary', (s) => s.journey?.heap?.summary?.nodes],
  ...['homeToFocus', 'focusControls', 'whistleToSummary', 'break'].map((k) => ['Main thread', `busy ms, ${k}`, (s) => s.journey?.busyMs?.[k]]),
  ['3D', 'focus stage: Start → window scene ready (ms)', (s) => s.journey?.scene?.focusWindowReadyMs],
  ['3D', 'Nook cold load: nav → 3D ready (ms)', (s) => s.nook?.scene3dReadyMs],
  ['Bytes', 'cold load through first Start + 1.2 s, total (KB on the wire)', (s) => s.cold?.bytesToInteractive?.totalKb],
  ['Bytes', 'cold load through first Start + 1.2 s, total (KB gzip -6 est.)', (s) => s.cold?.bytesToInteractive?.totalGzipKb],
  ...['js', 'css', 'font', 'image', 'three', 'scene3d'].map((c) => ['Bytes', `Home settled: ${c} (KB on the wire)`, (s) => s.journey?.bytes?.home?.by?.[c]?.kb ?? 0]),
  ['Bytes', 'Home settled: total (KB on the wire)', (s) => s.journey?.bytes?.home?.totalKb],
  ['Bytes', 'through summary: total (KB on the wire)', (s) => s.journey?.bytes?.summary?.totalKb],
  ['Bytes', 'Nook cold: total (KB on the wire)', (s) => s.nook?.bytes?.totalKb],
];
const median = (xs) => {
  const v = xs.filter((x) => typeof x === 'number' && !Number.isNaN(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};
const summary = {};
for (const prof of PROFILES) {
  summary[prof] = {};
  for (const [, name, get] of METRICS) {
    summary[prof][name] = {};
    bases.forEach((_, bi) => {
      const vals = samples.filter((s) => s.profile === prof && s.build === label(bi)).map(get);
      summary[prof][name][label(bi)] = { median: r1(median(vals)), runs: vals.map((v) => (v == null ? null : r1(v))) };
    });
  }
}
const fmt = (name, v) => (v == null ? '—' : /event duration/.test(name) && v === 0 ? '<16' : String(v));
let md = `# Kettle perf run\n\n- Started ${env.startedAt}, finished ${env.finishedAt}\n- Host: ${env.host.nproc} vCPU ${env.host.cpuModel}, ${env.host.memGB} GB; ${env.host.platform}\n- Browser: Chromium ${env.chromium} (Playwright, headless); WebGL renderer: ${env.renderer}\n- Load average at start: \`${env.uptimeStart}\`; at end: \`${env.uptimeEnd}\`\n- ${RUNS} runs, alternating base order, fresh context per journey; theme ${THEME}; service workers ${SW}; CPU throttle ×${CPU}; scene quality ${env.nookq}\n- Builds: ${env.bases.map((b) => `${b.name} = ${b.base}`).join('; ')}\n\nEvent duration "<16" means no Event Timing entry reached the 16 ms threshold. Medians, with the individual runs in brackets.\n`;
for (const prof of PROFILES) {
  const cols = bases.map((_, i) => label(i));
  md += `\n## ${prof}\n\n| Area | Metric | ${cols.join(' | ')}${cols.length === 2 ? ` | ${cols[1]} − ${cols[0]}` : ''} |\n|---|---|${cols.map(() => '---:|').join('')}${cols.length === 2 ? '---:|' : ''}\n`;
  for (const [area, name] of METRICS) {
    const row = summary[prof][name];
    const cells = cols.map((c) => `${fmt(name, row[c].median)} [${row[c].runs.map((v) => fmt(name, v)).join(', ')}]`);
    const diff = cols.length === 2 && row[cols[0]].median != null && row[cols[1]].median != null ? r1(row[cols[1]].median - row[cols[0]].median) : null;
    md += `| ${area} | ${name} | ${cells.join(' | ')}${cols.length === 2 ? ` | ${diff ?? '—'}` : ''} |\n`;
  }
  // Chai: intrinsic vs rendered (from the first successful journey of each build)
  for (const c of cols) {
    const s = samples.find((x) => x.profile === prof && x.build === c && x.journey?.chai);
    if (!s) continue;
    md += `\nChai (${c}, ${prof}): ` + Object.entries(s.journey.chai).map(([k, v]) => `${k}: ${v.filter((i) => i.onScreen).map((i) => `${i.file} ${i.natural.join('×')} source px for ${i.cssPx.join('×')} CSS px = ${i.devicePx.join('×')} device px (×${i.sourcePerDevicePx})`).join('; ') || 'none on screen'}`).join(' · ') + '\n';
  }
}
writeFileSync(`${OUT}/perf.json`, JSON.stringify({ env, summary, samples }, null, 2));
writeFileSync(`${OUT}/summary.md`, md);
console.log(md);
console.log(`wrote ${OUT}/perf.json and ${OUT}/summary.md`);
