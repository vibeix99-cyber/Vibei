#!/usr/bin/env node
/**
 * Blind side-by-side review harness (Kettle vs Duolingo comparables).
 *
 * 1) Capture + compose from the plan (default):
 *      node review/blind.mjs --round 1 [--base http://127.0.0.1:5190] [--plan review/blind-plan.json]
 *                            [--only home,focus] [--theme light] [--seed 1234] [--shots <dir-of-existing-kettle-pngs>]
 *    - captures each Kettle screen (390×844 @2x) → review/out/round-<n>/kettle/<id>.png (+ capture-log.json)
 *    - pairs it with every Duolingo ref listed for that screen (review/refs/duolingo/…)
 *    - writes anonymised composites → review/pairs/round-<n>/pair-NN.png + JUDGE.md
 *    - writes the key (who is A/B) → review/pairs/round-<n>-key/key.json   ← never give this to the judge
 *
 * 2) Explicit pairs (no capture):
 *      node review/blind.mjs --round x --pair kettle.png duo.png [--pair k2.png d2.png --kind "settings screen"] ...
 *
 * 3) Aggregate the blind judge's scores:
 *      node review/blind.mjs --aggregate review/pairs/round-1/scores.json [--key review/pairs/round-1-key/key.json]
 *    → per-screen Kettle vs Duolingo means + verdict (writes aggregate.md next to the key).
 *
 * Fairness: both images are first resampled to the *smaller* native height of the pair
 * (so a low-res reference doesn't make Kettle look sharper), then displayed at the same
 * height (≥ 900px). Left/right order is randomised per pair (seeded, recorded in the key);
 * pair order is shuffled across screens; labels are only "A" / "B"; no filenames or app
 * names appear in the pair folder. review/pairs/ is gitignored (it contains Duolingo imagery).
 */
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const REFS = join(here, 'refs', 'duolingo');
const LAUNCH = { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] };

// ---------- args ----------
const argv = process.argv.slice(2);
const opt = {};
const explicit = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--pair') {
    explicit.push({ kettle: argv[++i], duo: argv[++i], kind: 'comparable screen' });
  } else if (a === '--kind' && explicit.length) {
    explicit[explicit.length - 1].kind = argv[++i];
  } else if (a.startsWith('--')) {
    const next = argv[i + 1];
    opt[a.slice(2)] = next && !next.startsWith('--') ? (i++, next) : 'true';
  }
}

if (opt.aggregate) {
  aggregate(opt.aggregate, opt.key);
  process.exit(0);
}

const round = opt.round ?? 'adhoc';
const base = opt.base ?? 'http://127.0.0.1:5190';
const theme = opt.theme ?? 'light';
const seed = Number(opt.seed ?? (Date.now() % 2147483647));
const rand = mulberry32(seed);
const pairsDir = join(here, 'pairs', `round-${round}`);
const keyDir = join(here, 'pairs', `round-${round}-key`);
const shotsDir = opt.shots ? resolve(opt.shots) : join(here, 'out', `round-${round}`, 'kettle');
mkdirSync(pairsDir, { recursive: true });
mkdirSync(keyDir, { recursive: true });
mkdirSync(shotsDir, { recursive: true });

const browser = await chromium.launch(LAUNCH);
const jobs = []; // { screen, kind, kettle, duo }
const captureLog = [];

if (explicit.length) {
  explicit.forEach((p, i) => jobs.push({ screen: `pair${i + 1}`, kind: p.kind, kettle: resolve(p.kettle), duo: resolve(p.duo) }));
} else {
  const plan = JSON.parse(readFileSync(resolve(opt.plan ?? join(here, 'blind-plan.json')), 'utf8'));
  const only = opt.only ? new Set(opt.only.split(',')) : null;
  for (const s of plan.screens) {
    if (only && !only.has(s.id)) continue;
    const shot = join(shotsDir, `${s.id}.png`);
    if (!opt.shots) {
      const log = await capture(s, plan.viewport, shot);
      captureLog.push({ id: s.id, ...log });
      console.log(`${log.ok ? 'shot' : 'SHOT?'} ${s.id}${log.warnings.length ? `  (${log.warnings.length} warning(s))` : ''}`);
    }
    if (!existsSync(shot)) {
      console.warn(`skip ${s.id}: no kettle shot`);
      continue;
    }
    for (const r of s.refs) {
      const duo = join(REFS, r);
      if (!existsSync(duo)) {
        console.warn(`skip ref ${r}: missing (run node review/fetch-refs.mjs)`);
        continue;
      }
      jobs.push({ screen: s.id, kind: s.kind, kettle: shot, duo });
    }
  }
  if (!opt.shots) writeFileSync(join(dirname(shotsDir), 'capture-log.json'), JSON.stringify(captureLog, null, 2));
}

// Shuffle pair order across screens so the judge can't infer sequences.
for (let i = jobs.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  [jobs[i], jobs[j]] = [jobs[j], jobs[i]];
}

const key = { round, seed, created: new Date().toISOString(), base, theme, pairs: [] };
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
for (const [idx, job] of jobs.entries()) {
  const n = String(idx + 1).padStart(2, '0');
  const kettleLeft = rand() < 0.5;
  const left = kettleLeft ? job.kettle : job.duo;
  const right = kettleLeft ? job.duo : job.kettle;
  const out = join(pairsDir, `pair-${n}.png`);
  const meta = await compose(page, left, right, `Pair ${n}: ${job.kind}`, out);
  key.pairs.push({
    pair: Number(n),
    file: `pair-${n}.png`,
    screen: job.screen,
    kind: job.kind,
    A: kettleLeft ? 'kettle' : 'duolingo',
    B: kettleLeft ? 'duolingo' : 'kettle',
    kettle: relative(here, job.kettle),
    duolingo: relative(here, job.duo),
    ...meta,
  });
  console.log(`pair-${n}  ${job.screen}  (${meta.lowRes ? 'low-res ' : ''}${meta.displayH}px)`);
}
await browser.close();

writeFileSync(join(keyDir, 'key.json'), JSON.stringify(key, null, 2));
writeFileSync(join(pairsDir, 'JUDGE.md'), judgeDoc(key));
console.log(`\n${key.pairs.length} pairs → ${relative(process.cwd(), pairsDir)}/  (judge gets this folder only)`);
console.log(`key → ${relative(process.cwd(), keyDir)}/key.json  (do NOT share with the judge)`);

// ---------- capture ----------
async function capture(screen, viewport, file) {
  const warnings = [];
  const errors = [];
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor ?? 2,
    isMobile: viewport.isMobile ?? true,
    hasTouch: viewport.hasTouch ?? true,
    colorScheme: theme === 'dark' ? 'dark' : 'light',
    reducedMotion: 'no-preference',
  });
  const page = await ctx.newPage();
  let loads = 0;
  page.on('load', () => loads++);
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  const c = screen.capture;
  const qs = Object.entries({ theme, ...(c.params ?? {}) })
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  let ok = true;
  try {
    await page.goto(`${base}/?debug&${qs}#${c.route}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForFunction(() => 'window' in globalThis && '__kettle' in window, null, { timeout: 10000 });
    await page.waitForTimeout(700);
    for (const step of c.steps ?? []) {
      try {
        await runStep(page, step);
      } catch (e) {
        const msg = `${JSON.stringify(step)} → ${String(e.message).split('\n')[0]}`;
        if (step.optional) warnings.push(`optional ${msg}`);
        else {
          warnings.push(msg);
          ok = false;
        }
      }
    }
    // Visible text only: in the viewport, and not faded out by any ancestor (e.g. stuck at opacity 0 mid-transition).
    const textLen = await page
      .evaluate(() => {
        let n = 0;
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let t = walker.nextNode(); t; t = walker.nextNode()) {
          const txt = t.textContent.trim();
          const el = t.parentElement;
          if (!txt || !el) continue;
          const r = el.getBoundingClientRect();
          if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth || r.width === 0) continue;
          let op = 1;
          for (let a = el; a; a = a.parentElement) {
            const cs = getComputedStyle(a);
            if (cs.visibility === 'hidden' || cs.display === 'none') op = 0;
            op *= Number(cs.opacity);
          }
          if (op > 0.2) n += txt.length;
        }
        return n;
      })
      .catch(() => 0);
    if (textLen < 8) {
      ok = false;
      warnings.push(`screen looks empty (${textLen} visible chars) — stuck mid-transition, crashed, or not built yet`);
    }
    if (loads > 1) {
      ok = false;
      warnings.push(`page reloaded ${loads - 1}× during capture (dev-server HMR?) — re-run, or use a snapshot server`);
    }
    const png = await page.screenshot({ path: file });
    // Definitive blank check on the pixels (catches overlays / stuck transitions the DOM check can't see).
    const spread = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = new OffscreenCanvas(96, 208);
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0, 96, 208);
      const d = g.getImageData(0, 0, 96, 208).data;
      let sum = 0;
      let sq = 0;
      const n = d.length / 4;
      for (let i = 0; i < d.length; i += 4) {
        const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        sum += l;
        sq += l * l;
      }
      return Math.sqrt(sq / n - (sum / n) ** 2);
    }, png.toString('base64'));
    if (spread < 3) {
      ok = false;
      warnings.push(`screenshot is blank (luminance σ=${spread.toFixed(1)}) — stuck transition, crash, or wrong route`);
    }
  } catch (e) {
    ok = false;
    warnings.push(`capture failed: ${String(e.message).split('\n')[0]}`);
  }
  const route = await page.evaluate(() => location.hash).catch(() => '?');
  await ctx.close();
  return { ok, route, warnings, consoleErrors: errors };
}

async function runStep(page, s) {
  const timeout = s.timeout ?? 3000;
  if (s.eval) return page.evaluate(s.eval);
  if (s.wait) return page.waitForTimeout(s.wait);
  if (s.press) return page.keyboard.press(s.press);
  if (s.fill) return page.locator(s.fill).first().fill(s.text, { timeout });
  if (s.click) return page.locator(s.click).first().click({ timeout });
  if (s.button) {
    const re = new RegExp(s.button, 'i');
    const loc = page.getByRole('button', { name: re });
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const n = await loc.count();
      for (let i = 0; i < n; i++) {
        const b = loc.nth(i);
        if ((await b.isVisible()) && (await b.isEnabled())) return b.click({ timeout });
      }
      await page.waitForTimeout(150);
    }
    throw new Error(`no visible enabled button matching ${re}`);
  }
  throw new Error(`unknown step ${JSON.stringify(s)}`);
}

// ---------- compose ----------
async function compose(page, leftPath, rightPath, title, out) {
  const url = (p) => `data:${mime(p)};base64,${readFileSync(p).toString('base64')}`;
  const html = `<!doctype html><html><body style="margin:0;background:#dcdcdc;font:600 28px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#222">
  <div id="wrap" style="display:inline-flex;flex-direction:column;gap:18px;padding:28px 36px 36px;background:#dcdcdc">
    <div id="title" style="font-size:24px;font-weight:600;color:#444"></div>
    <div style="display:flex;gap:48px;align-items:flex-start">
      <div class="col"><div class="lab">A</div><canvas id="a"></canvas></div>
      <div class="col"><div class="lab">B</div><canvas id="b"></canvas></div>
    </div>
  </div>
  <style>.col{display:flex;flex-direction:column;gap:12px;align-items:center}
  .lab{background:#2d2d2d;color:#fff;border-radius:999px;width:56px;height:56px;display:grid;place-items:center;font-size:30px;font-weight:700}
  canvas{display:block;border-radius:22px;box-shadow:0 2px 0 rgba(0,0,0,.08),0 8px 28px rgba(0,0,0,.14);background:#fff}</style>
  </body></html>`;
  await page.setContent(html);
  return page.evaluate(
    async ({ a, b, title }) => {
      document.getElementById('title').textContent = title;
      const load = (src) =>
        new Promise((res, rej) => {
          const i = new Image();
          i.onload = () => res(i);
          i.onerror = rej;
          i.src = src;
        });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      const common = Math.min(ia.naturalHeight, ib.naturalHeight, 1800);
      const displayH = Math.max(900, Math.min(common, 1400));
      for (const [img, id] of [
        [ia, 'a'],
        [ib, 'b'],
      ]) {
        // Pass 1: resample to the common (lower) native height; pass 2: scale to display height.
        const w1 = Math.round((img.naturalWidth * common) / img.naturalHeight);
        const tmp = new OffscreenCanvas(w1, common);
        const t = tmp.getContext('2d');
        t.imageSmoothingQuality = 'high';
        t.drawImage(img, 0, 0, w1, common);
        const c = document.getElementById(id);
        c.height = displayH;
        c.width = Math.round((w1 * displayH) / common);
        const ctx = c.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(tmp, 0, 0, c.width, c.height);
        c.style.width = `${c.width / devicePixelRatio}px`;
        c.style.height = `${c.height / devicePixelRatio}px`;
      }
      return { commonH: common, displayH, lowRes: common < 900, nativeA: [ia.naturalWidth, ia.naturalHeight], nativeB: [ib.naturalWidth, ib.naturalHeight] };
    },
    { a: url(leftPath), b: url(rightPath), title },
  ).then(async (meta) => {
    await (await page.$('#wrap')).screenshot({ path: out });
    return meta;
  });
}

function mime(p) {
  return p.endsWith('.png') ? 'image/png' : p.endsWith('.gif') ? 'image/gif' : p.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
}

function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- judge doc (brand-neutral) ----------
function judgeDoc(k) {
  const rows = k.pairs.map((p) => `| ${p.pair} | \`${p.file}\` | ${p.kind} |`).join('\n');
  return `# Blind design review: judging guide

You are judging **${k.pairs.length} pairs** of mobile app screens. In each image, **A** (left) and **B** (right)
show the *same kind* of screen from two different apps with different brands. Judge **craft**,
not brand familiarity. Ignore device chrome, status bars, the display language (some screens
are not in English), and small resolution differences. Don't try to work out which app is
which; if you recognise one, say so, and still score it on craft only.

For every pair, score **A** and **B** from 1 to 10 on the four criteria below, then state an overall preference.

## Criteria anchors
**Clarity**: can you tell in one glance what the screen is and what to do?
- 4: several elements compete; the main action is unclear; jargon.
- 6: the main action is findable but not dominant; flat hierarchy; numbers without labels.
- 8: one obvious primary action; a clear 3-level type hierarchy; every number labelled.
- 10: the outcome reads in under a second; secondary info is visibly secondary; nothing needs explaining.

**Charm**: warmth, personality, point of view.
- 4: generic template; mascot or illustration used as a sticker; neutral system copy.
- 6: brand present but repetitive (same pose everywhere); copy on-brand only in places.
- 8: illustration and copy fit this exact moment; a consistent voice; the metaphor carries meaning.
- 10: a moment you'd screenshot and share; small surprises; an unmistakable identity.

**Polish**: is every pixel deliberate?
- 4: misalignment, inconsistent radii/borders, default controls, clipped text.
- 6: mostly consistent, with visible rough spots (mixed icon styles, uneven spacing, weak states).
- 8: on-grid spacing, consistent radii, borders, depth and icons; a designed (not inverted) dark or colour treatment.
- 10: optical alignment, balanced whitespace, crisp art; nothing to fix.

**Ease of use**: would a first-timer know what to do and do it comfortably?
- 4: trial and error needed; tiny targets; destructive actions unguarded.
- 6: works with friction (unclear state, extra steps, no obvious way back).
- 8: the next step is obvious and one tap away; state is always visible; targets are comfortable.
- 10: anticipates the user; the next step is suggested; no dead ends.

## Pairs
| # | file | screen kind |
|---|---|---|
${rows}

## Output (required)
Reply with one JSON array, saved as \`scores.json\` next to the pairs:
\`\`\`json
[
  { "pair": 1,
    "A": { "clarity": 0, "charm": 0, "polish": 0, "ease": 0 },
    "B": { "clarity": 0, "charm": 0, "polish": 0, "ease": 0 },
    "preference": "A clearly | A slightly | tie | B slightly | B clearly",
    "why": { "A": "concrete visual evidence", "B": "concrete visual evidence" },
    "recognised": "none | A | B" }
]
\`\`\`
`;
}

// ---------- aggregate ----------
function aggregate(scoresPath, keyPath) {
  const scores = JSON.parse(readFileSync(resolve(scoresPath), 'utf8'));
  const kp = keyPath ? resolve(keyPath) : resolve(dirname(resolve(scoresPath)) + '-key', 'key.json');
  const key = JSON.parse(readFileSync(kp, 'utf8'));
  const crit = ['clarity', 'charm', 'polish', 'ease'];
  const mean = (o) => crit.reduce((s, c) => s + Number(o[c] ?? 0), 0) / crit.length;
  const by = {};
  for (const s of scores) {
    const k = key.pairs.find((p) => p.pair === Number(s.pair));
    if (!k) continue;
    const kSide = k.A === 'kettle' ? 'A' : 'B';
    const dSide = kSide === 'A' ? 'B' : 'A';
    const pref = String(s.preference ?? '').toLowerCase();
    const duoClearly = pref.startsWith(dSide.toLowerCase()) && pref.includes('clearly');
    const e = (by[k.screen] ??= { kind: k.kind, pairs: [], kettle: [], duo: [], perCrit: { kettle: {}, duo: {} }, duoClearly: 0 });
    e.pairs.push(k.pair);
    e.kettle.push(mean(s[kSide]));
    e.duo.push(mean(s[dSide]));
    for (const c of crit) {
      (e.perCrit.kettle[c] ??= []).push(Number(s[kSide][c]));
      (e.perCrit.duo[c] ??= []).push(Number(s[dSide][c]));
    }
    if (duoClearly) e.duoClearly++;
  }
  const avg = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
  const lines = [
    `# Blind review aggregate: round ${key.round}`,
    '',
    'Match rule (RUBRIC §0): kettle_mean ≥ duo_mean − 0.25 and no pair judged "Duolingo clearly".',
    '',
    '| screen | pairs | Kettle mean | Duolingo mean | Δ | Kettle C/Ch/P/E | Duo C/Ch/P/E | Duo-clearly | verdict |',
    '|---|---|---|---|---|---|---|---|---|',
  ];
  for (const [screen, e] of Object.entries(by)) {
    const km = avg(e.kettle);
    const dm = avg(e.duo);
    const kc = crit.map((c) => avg(e.perCrit.kettle[c]).toFixed(1)).join('/');
    const dc = crit.map((c) => avg(e.perCrit.duo[c]).toFixed(1)).join('/');
    const match = km >= dm - 0.25 && e.duoClearly === 0;
    lines.push(`| ${screen} | ${e.pairs.join(',')} | ${km.toFixed(2)} | ${dm.toFixed(2)} | ${(km - dm >= 0 ? '+' : '') + (km - dm).toFixed(2)} | ${kc} | ${dc} | ${e.duoClearly} | ${match ? 'MATCH' : 'BELOW'} |`);
  }
  const outFile = join(dirname(kp), 'aggregate.md');
  writeFileSync(outFile, lines.join('\n') + '\n');
  console.log(lines.join('\n'));
  console.log(`\n→ ${outFile}`);
}
