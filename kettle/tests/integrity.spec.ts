/**
 * Session and data integrity, end to end in a real browser (Product Excellence I01, I02, I03).
 *
 *   KETTLE_PORT=5221 npx playwright test --project=chromium tests/integrity.spec.ts
 *
 * Every test runs in its own fresh browser context (a disposable profile), so nothing here can touch real data.
 * Time: the debug API's fast-forward (`__kettle.ff`) moves only this tab's clock and is lost on reload, so the
 * reload / "app was closed" cases use real time or a state planted before boot instead.
 * The engine-level cases (DST, clock jumps, split-brain tabs, sanitize) are unit tested in src/timer and
 * src/progress, and the harness-level timer cases in tests/timer.spec.ts; this file does not repeat them.
 */
import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/* eslint-disable @typescript-eslint/no-explicit-any */

const MIN = 60_000;

type Rec = { id: string; phase: string; completed: boolean; focusedMs: number; plannedMs: number; endedAt: number; intention: string; outcome?: string };
type Leaf = { id: string; amount: number; kind: string; ref?: string };
type Stored = { sessions: Rec[]; ledger: Leaf[]; leaves: number; cozies: number; badges: Record<string, { tier: number }>; lastReport: { id: string } | null } | null;

/** Quiet, fast defaults written before the app boots (only on a fresh profile): no 3D scene, no auto-start. */
const PRIME = `(() => {
  try {
    if (localStorage.getItem('kettle:settings')) return;
    const state = { onboarded: true, scene: 'off', motion: 'reduce', autoStartBreaks: false, autoStartFocus: false, muted: true };
    localStorage.setItem('kettle:settings', JSON.stringify({ state, version: 1 }));
  } catch {
    /* storage blocked: the test will say so */
  }
})();`;
async function prime(ctx: BrowserContext) {
  await ctx.addInitScript(PRIME);
}

// ---------- a plain Chromium over raw CDP (real Page Lifecycle freezes) ----------
//
// Playwright keeps the pages it drives visible, and Chromium won't freeze a visible page, so
// `Page.setWebLifecycleState({state:'frozen'})` through a Playwright page does nothing here (no `freeze` event; timers
// keep running). Driving Chromium directly, the same command hides and really freezes the page.

type CdpTab = {
  send: (method: string, params?: Record<string, unknown>) => Promise<Record<string, unknown>>;
  evaluate: (expression: string) => Promise<unknown>;
  waitFor: (expression: string, timeoutMs?: number) => Promise<void>;
};

async function rawChromium() {
  const dir = mkdtempSync(join(tmpdir(), 'kettle-m1-')); // a disposable profile
  const args = ['--headless=new', '--no-sandbox', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--enable-unsafe-swiftshader', '--use-angle=swiftshader', 'about:blank'];
  const proc = spawn(chromium.executablePath(), args, { stdio: 'ignore' });
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  let port = 0;
  for (let i = 0; i < 150 && !port; i++) {
    await sleep(100);
    try {
      port = Number(readFileSync(join(dir, 'DevToolsActivePort'), 'utf8').split('\n')[0]) || 0;
    } catch {
      /* not yet */
    }
  }
  if (!port) throw new Error('Chromium did not start');
  const sockets: WebSocket[] = [];
  const connect = async (url: string) => {
    const ws = new WebSocket(url);
    sockets.push(ws);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
    let id = 0;
    const pending = new Map<number, (d: { result?: Record<string, unknown>; error?: { message: string } }) => void>();
    ws.onmessage = (m) => {
      const d = JSON.parse(String(m.data));
      if (d.id && pending.has(d.id)) {
        pending.get(d.id)!(d);
        pending.delete(d.id);
      }
    };
    return (method: string, params: Record<string, unknown> = {}) =>
      new Promise<Record<string, unknown>>((resolve, reject) => {
        const i = ++id;
        pending.set(i, (d) => (d.error ? reject(new Error(`${method}: ${d.error.message}`)) : resolve(d.result ?? {})));
        ws.send(JSON.stringify({ id: i, method, params }));
      });
  };
  const version = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()) as { webSocketDebuggerUrl: string };
  const browser = await connect(version.webSocketDebuggerUrl);
  const { browserContextId } = await browser('Target.createBrowserContext');

  async function newTab(url: string): Promise<CdpTab> {
    const { targetId } = await browser('Target.createTarget', { url: 'about:blank', browserContextId });
    const send = await connect(`ws://127.0.0.1:${port}/devtools/page/${targetId}`);
    const evaluate = async (expression: string) => {
      const r = (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })) as { result?: { value?: unknown }; exceptionDetails?: { text: string } };
      if (r.exceptionDetails) throw new Error(`${expression.slice(0, 80)}: ${JSON.stringify(r.exceptionDetails).slice(0, 300)}`);
      return r.result?.value;
    };
    const waitFor = async (expression: string, timeoutMs = 30_000) => {
      const until = Date.now() + timeoutMs;
      for (;;) {
        try {
          if (await evaluate(expression)) return;
        } catch {
          /* page still loading */
        }
        if (Date.now() > until) {
          const seen = await evaluate(`JSON.stringify({ hash: location.hash, timer: window.__kettle?.timer.getState().status, info: window.__kettle?.timerInfo(), log: window.__log })`).catch(() => '?');
          throw new Error(`timed out waiting for ${expression} (page: ${seen})`);
        }
        await sleep(150);
      }
    };
    await send('Page.enable');
    await send('Page.addScriptToEvaluateOnNewDocument', { source: PRIME });
    await send('Page.navigate', { url });
    return { send, evaluate, waitFor };
  }

  return {
    newTab,
    close: () => {
      sockets.forEach((ws) => ws.close());
      proc.kill();
      setTimeout(() => rmSync(dir, { recursive: true, force: true }), 500);
    },
  };
}

async function ready(page: Page, leader = true) {
  await page.waitForFunction(() => !!(window as any).__kettle?.timerInfo, null, { timeout: 30_000 });
  if (leader)
    await page.waitForFunction(
      () => {
        const i = (window as any).__kettle.timerInfo();
        return i.leader && i.leaderForMs > 400 && !i.settling;
      },
      null,
      { timeout: 15_000 },
    );
}
async function open(page: Page, route = '/') {
  await page.goto(`/?debug#${route}`);
  await ready(page);
}
async function reload(page: Page) {
  await page.reload();
  await ready(page);
}

const timer = (page: Page) =>
  page.evaluate(() => {
    const s = (window as any).__kettle.timer.getState();
    return {
      status: s.status as string,
      phase: s.phase as string,
      sessionId: s.sessionId as string | null,
      startedAt: s.startedAt as number | null,
      endsAt: s.endsAt as number | null,
      remainingMs: s.remainingMs as number,
      plannedMs: s.plannedMs as number,
      addedMs: s.addedMs as number,
      pausedTotalMs: s.pausedTotalMs as number,
      intention: s.intention as string,
      completedInCycle: s.completedInCycle as number,
      lastEnded: s.lastEnded as { sessionId: string; reason: string; at: number; whileAway: boolean } | null,
    };
  });
/** What is actually saved in this profile (not what the tab holds in memory). */
const stored = (page: Page): Promise<Stored> =>
  page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('kettle:progress') ?? 'null')?.state ?? null;
    } catch {
      return null;
    }
  });
const memory = (page: Page) =>
  page.evaluate(() => {
    const p = (window as any).__kettle.progress.getState();
    return { sessions: p.sessions as Rec[], ledger: p.ledger as Leaf[], leaves: p.leaves as number, lastReport: p.lastReport as { id: string; leaves: { total: number } } | null };
  });
const recordsFor = (st: Stored, id: string) => (st?.sessions ?? []).filter((r) => r.id === id);
const grantsFor = (st: Stored, id: string) => (st?.ledger ?? []).filter((e) => e.id === `focus:${id}` || e.id === `full:${id}` || e.id === `deep:${id}`);
const hash = (page: Page) => page.evaluate(() => location.hash);
const ff = (page: Page, ms: number) => page.evaluate((m) => (window as any).__kettle.ff(m), ms);
/** Move this tab's clock to `msBefore` before the running phase ends. */
const toEnd = (page: Page, msBefore: number) =>
  page.evaluate((b) => {
    const k = (window as any).__kettle;
    const s = k.timer.getState();
    k.ff(s.endsAt - k.clock.now() - b);
  }, msBefore);

const startButton = (page: Page) => page.getByRole('button', { name: /^Put the kettle on · / });
const summaryHeading = (page: Page) => page.getByRole('heading', { level: 1, name: /minutes? brewed/ });
const endDialog = (page: Page) => page.getByRole('dialog', { name: 'Leave the kettle early?' });

async function startFromHome(page: Page, intention?: string) {
  if (intention !== undefined) await page.getByRole('textbox', { name: /What are you brewing/ }).fill(intention);
  await startButton(page).click();
  await expect.poll(() => hash(page)).toBe('#/focus');
  await expect.poll(async () => (await timer(page)).status).toBe('running');
}

// ---------------------------------------------------------------------------------------------------------------
// I01 — Reliable session time and exactly-once completion
// ---------------------------------------------------------------------------------------------------------------

test.describe('I01 session time survives reload, suspension and late return', () => {
  test.beforeEach(async ({ context }) => prime(context));

  test('pause → reload → resume: the paused time is kept and the deadline moves by exactly the pause', async ({ page }) => {
    await open(page);
    await startFromHome(page);
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Pause' }).click();
    const paused = await timer(page);
    expect(paused.status).toBe('paused');

    await reload(page);
    expect(await hash(page)).toBe('#/focus');
    const restored = await timer(page);
    expect(restored).toMatchObject({ status: 'paused', sessionId: paused.sessionId, remainingMs: paused.remainingMs, endsAt: null });
    await expect(page).toHaveTitle(/^24:5\d · Paused — Kettle$/);

    await page.waitForTimeout(2000);
    const t0 = Date.now();
    await page.getByRole('button', { name: 'Resume' }).click();
    await expect.poll(async () => (await timer(page)).status).toBe('running');
    const t1 = Date.now();
    const resumed = await timer(page);
    expect(resumed.sessionId).toBe(paused.sessionId);
    // The deadline is "resume time + what was left", so the 2 s pause and the reload cost nothing.
    expect(resumed.endsAt!).toBeGreaterThanOrEqual(t0 + paused.remainingMs - 50);
    expect(resumed.endsAt!).toBeLessThanOrEqual(t1 + paused.remainingMs + 50);
    expect(resumed.pausedTotalMs).toBeGreaterThanOrEqual(2000);
  });

  test('+5 → reload: the extension, its deadline and the gauge segment survive; completion records the full 30 min once', async ({ page }) => {
    await open(page);
    await startFromHome(page, 'Extended');
    const s0 = await timer(page);
    await page.getByRole('button', { name: 'Add 5 minutes' }).click();
    await expect.poll(async () => (await timer(page)).plannedMs).toBe(s0.plannedMs + 5 * MIN);
    const s1 = await timer(page);
    expect(s1.endsAt).toBe(s0.endsAt! + 5 * MIN);
    expect(s1.addedMs).toBe(5 * MIN);

    await reload(page);
    expect(await timer(page)).toMatchObject({ status: 'running', sessionId: s0.sessionId, endsAt: s1.endsAt, plannedMs: 30 * MIN, addedMs: 5 * MIN });
    await expect(page).toHaveTitle(/^29:5\d · Focusing — Kettle$/);
    await expect(page.getByText('Add 5 more', { exact: true })).toBeVisible();

    await toEnd(page, 500);
    await expect.poll(() => hash(page), { timeout: 15_000 }).toBe('#/done');
    await expect(summaryHeading(page)).toHaveText('30 minutes brewed');
    const st = await stored(page);
    expect(recordsFor(st, s0.sessionId!)).toEqual([expect.objectContaining({ completed: true, focusedMs: 30 * MIN, plannedMs: 30 * MIN })]);
    expect(grantsFor(st, s0.sessionId!).find((e) => e.id === `focus:${s0.sessionId}`)?.amount).toBe(30);
  });

  test('suspended tab (a real Page Lifecycle freeze) across the end: one completion right after resume, at the real end, "while away" summary', async ({ baseURL }) => {
    test.setTimeout(90_000);
    const b = await rawChromium();
    try {
      const tab = await b.newTab(`${baseURL}/?debug#/`);
      await tab.waitFor(`(() => { const i = window.__kettle?.timerInfo?.(); return !!(i && i.leader && i.leaderForMs > 400 && !i.settling); })()`);
      await tab.evaluate(`(() => {
        window.__log = [];
        for (const e of ['freeze', 'resume']) document.addEventListener(e, () => window.__log.push({ e, t: Date.now() }));
        const k = window.__kettle;
        k.timer.subscribe((s, p) => { if (p.status !== 'idle' && s.status === 'idle') window.__log.push({ e: 'idle', t: Date.now() }); });
        k.timer.getState().startFocus({ intention: 'Frozen' });
        const s = k.timer.getState();
        k.ff(s.endsAt - k.clock.now() - 1500); // 1.5 s left on this tab's clock
        return true;
      })()`);
      const { sessionId, endsAt } = (await tab.evaluate(`(() => { const s = window.__kettle.timer.getState(); return { sessionId: s.sessionId, endsAt: s.endsAt }; })()`)) as { sessionId: string; endsAt: number };
      await tab.send('Page.setWebLifecycleState', { state: 'frozen' });
      await new Promise((r) => setTimeout(r, 13_000)); // the end passes while nothing in the page can run
      await tab.send('Page.setWebLifecycleState', { state: 'active' });
      await tab.waitFor(`location.hash === '#/done' && window.__kettle.timer.getState().status === 'idle'`);
      // The person comes back to the tab. (A hidden page runs no animation frames, so the panel mounts on return.
      // Headless Chromium has no window to raise: focus emulation is what makes the page visible again.)
      await tab.send('Emulation.setFocusEmulationEnabled', { enabled: true });
      await tab.waitFor(`document.visibilityState === 'visible' && document.body.innerText.includes('minutes brewed')`);

      const log = (await tab.evaluate('window.__log')) as { e: string; t: number }[];
      expect(log.map((x) => x.e)).toEqual(['freeze', 'resume', 'idle']); // really frozen; completed only after resuming
      const t = (await tab.evaluate('window.__kettle.timer.getState().lastEnded')) as Record<string, unknown>;
      expect(t).toMatchObject({ sessionId, reason: 'complete', at: endsAt, whileAway: true });
      const text = (await tab.evaluate('document.body.innerText')) as string;
      expect(text).toContain('25 minutes brewed');
      expect(text).toContain('The kettle whistled while you were away');
      await new Promise((r) => setTimeout(r, 800));
      const st = (await tab.evaluate(`JSON.parse(localStorage.getItem('kettle:progress')).state`)) as Stored;
      expect(recordsFor(st, sessionId)).toEqual([expect.objectContaining({ completed: true, endedAt: endsAt, focusedMs: 25 * MIN })]);
      expect(grantsFor(st, sessionId).map((e) => e.id).sort()).toEqual([`focus:${sessionId}`, `full:${sessionId}`]);
    } finally {
      b.close();
    }
  });

  test('two tabs, the leading one frozen across the end: the other completes it once; the frozen one wakes up and does not add a second', async ({ baseURL }) => {
    test.setTimeout(90_000);
    const b = await rawChromium();
    try {
      const booted = `(() => !!window.__kettle?.timerInfo)()`;
      const a = await b.newTab(`${baseURL}/?debug#/`);
      await a.waitFor(booted);
      const z = await b.newTab(`${baseURL}/?debug#/`);
      await z.waitFor(booted);
      const leaderOf = async () => ((await a.evaluate('window.__kettle.timerInfo().leader')) ? [a, z] : [z, a]);
      await new Promise((r) => setTimeout(r, 800));
      const [leader, other] = await leaderOf();
      // A real 9-second brew (no fast-forward: both tabs keep real time).
      await other.evaluate(`window.__kettle.timer.getState().startFocus({ minutes: 0.15, intention: 'Frozen leader' }), true`);
      const sid = (await other.evaluate('window.__kettle.timer.getState().sessionId')) as string;
      await leader.waitFor(`window.__kettle.timer.getState().sessionId === ${JSON.stringify(sid)}`);
      await leader.send('Page.setWebLifecycleState', { state: 'frozen' });
      await other.waitFor(`window.__kettle.timer.getState().status === 'idle' && location.hash === '#/done'`, 30_000);
      const count = (t: CdpTab) => t.evaluate(`JSON.parse(localStorage.getItem('kettle:progress')).state.sessions.filter((s) => s.id === ${JSON.stringify(sid)}).length`);
      expect(await count(other)).toBe(1);
      await leader.send('Page.setWebLifecycleState', { state: 'active' });
      await leader.waitFor(`window.__kettle.timer.getState().status === 'idle'`);
      await new Promise((r) => setTimeout(r, 1500));
      expect(await count(leader)).toBe(1);
      expect(await leader.evaluate(`window.__kettle.progress.getState().sessions.filter((s) => s.id === ${JSON.stringify(sid)}).length`)).toBe(1);
      expect(await leader.evaluate(`JSON.parse(localStorage.getItem('kettle:progress')).state.ledger.filter((e) => e.id === 'full:' + ${JSON.stringify(sid)}).length`)).toBe(1);
    } finally {
      b.close();
    }
  });

  test('late return: an extended brew that ended 2 h ago while the app was closed completes once, at its real end, with the right minutes', async ({ page, context }) => {
    const endsAt = Date.now() - 2 * 3600_000;
    await context.addInitScript((e: number) => {
      if (sessionStorage.getItem('late-planted')) return;
      sessionStorage.setItem('late-planted', '1');
      const planned = 30 * 60_000;
      const state = {
        status: 'running', phase: 'focus', plannedMs: planned, addedMs: 5 * 60_000, startedAt: e - planned, endsAt: e, remainingMs: planned,
        pausedAt: null, pausedTotalMs: 0, completedInCycle: 0, intention: 'Late return', tag: null, sessionId: 's_late_e2e', lastEnded: null,
      };
      localStorage.setItem('kettle:timer', JSON.stringify({ state, version: 1 }));
    }, endsAt);
    await open(page);
    await expect.poll(() => hash(page), { timeout: 15_000 }).toBe('#/done');
    await expect(summaryHeading(page)).toHaveText('30 minutes brewed');
    await expect(page.getByText(/The kettle whistled while you were away/)).toBeVisible();
    await expect.poll(async () => recordsFor(await stored(page), 's_late_e2e').length).toBe(1);
    const st = await stored(page);
    expect(recordsFor(st, 's_late_e2e')[0]).toMatchObject({ completed: true, endedAt: endsAt, focusedMs: 30 * MIN, intention: 'Late return' });
    expect(grantsFor(st, 's_late_e2e').find((e) => e.id === 'focus:s_late_e2e')?.amount).toBe(30);
    const leaves = st!.leaves;

    for (let i = 0; i < 2; i++) {
      await reload(page);
      await expect(summaryHeading(page)).toHaveText('30 minutes brewed');
      await page.waitForTimeout(600);
      const again = await stored(page);
      expect(recordsFor(again, 's_late_e2e')).toHaveLength(1);
      expect(again!.leaves).toBe(leaves);
      expect(again!.ledger).toHaveLength(st!.ledger.length);
    }
  });

  test('late return to a paused brew: nothing completes; the same time is waiting', async ({ page, context }) => {
    await context.addInitScript((now: number) => {
      if (sessionStorage.getItem('paused-planted')) return;
      sessionStorage.setItem('paused-planted', '1');
      const state = {
        status: 'paused', phase: 'focus', plannedMs: 25 * 60_000, addedMs: 0, startedAt: now - 4 * 3600_000, endsAt: null, remainingMs: 10 * 60_000,
        pausedAt: now - 3 * 3600_000, pausedTotalMs: 0, completedInCycle: 0, intention: 'Paused away', tag: null, sessionId: 's_paused_e2e', lastEnded: null,
      };
      localStorage.setItem('kettle:timer', JSON.stringify({ state, version: 1 }));
    }, Date.now());
    await open(page);
    await expect.poll(() => hash(page)).toBe('#/focus');
    expect(await timer(page)).toMatchObject({ status: 'paused', sessionId: 's_paused_e2e', remainingMs: 10 * MIN });
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
    await expect(page).toHaveTitle('10:00 · Paused — Kettle');
    expect((await stored(page))?.sessions ?? []).toHaveLength(0);
  });
});

test.describe('I01 exactly once', () => {
  test.beforeEach(async ({ context }) => prime(context));

  test('repeated finish / tick / end / pause at 0:00 and a double-clicked Tea time: one record, one grant, one break', async ({ page }) => {
    await open(page);
    await startFromHome(page, 'Hammer');
    const { sessionId } = await timer(page);
    await toEnd(page, 50);
    await page.evaluate(() => {
      const k = (window as any).__kettle;
      k.finish();
      k.finish();
      for (let i = 0; i < 5; i++) k.timer.getState().tick();
      k.timer.getState().end('user');
      k.timer.getState().pause();
      k.finish();
    });
    await expect.poll(() => hash(page), { timeout: 15_000 }).toBe('#/done');
    await expect(summaryHeading(page)).toHaveCount(1);
    await page.waitForTimeout(800);
    const st = await stored(page);
    expect(recordsFor(st, sessionId!)).toHaveLength(1);
    expect(st!.sessions).toHaveLength(1);
    const ids = st!.ledger.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(grantsFor(st, sessionId!).map((e) => e.id).sort()).toEqual([`focus:${sessionId}`, `full:${sessionId}`]);
    const mem = await memory(page);
    expect(mem.lastReport?.id).toBe(sessionId);
    expect(st!.leaves).toBe(mem.lastReport!.leaves.total); // first brew of this profile: everything came from it
    expect((await timer(page)).completedInCycle).toBe(1);

    await page.getByRole('button', { name: /^Tea time/ }).dblclick();
    await expect.poll(async () => (await timer(page)).phase).toBe('shortBreak');
    const brk = await timer(page);
    await page.waitForTimeout(1200);
    expect(await timer(page)).toMatchObject({ status: 'running', phase: 'shortBreak', sessionId: brk.sessionId, startedAt: brk.startedAt });
  });

  test('reload during the whistle and again on the summary: one record, rewards granted once, the summary still there', async ({ page }) => {
    await open(page);
    // The full-motion whistle is the longer beat (2.2 s), so the reload lands inside it.
    await page.evaluate(() => (window as any).__kettle.settings.getState().set({ motion: 'full' }));
    await startFromHome(page, 'Whistle reload');
    const { sessionId } = await timer(page);
    await toEnd(page, 300);
    await expect.poll(async () => (await timer(page)).status, { intervals: [25], timeout: 10_000 }).toBe('idle');
    expect(await hash(page)).toBe('#/focus'); // still the whistle beat on the session screen
    await page.reload();
    await ready(page);
    await expect.poll(() => hash(page), { timeout: 15_000 }).toBe('#/done');
    await expect(summaryHeading(page)).toHaveText('25 minutes brewed');
    await page.waitForTimeout(600);
    const st = await stored(page);
    expect(recordsFor(st, sessionId!)).toHaveLength(1);
    const leaves = st!.leaves;
    const ledger = st!.ledger.length;

    await reload(page);
    await expect(summaryHeading(page)).toHaveText('25 minutes brewed');
    await page.waitForTimeout(600);
    const again = await stored(page);
    expect(recordsFor(again, sessionId!)).toHaveLength(1);
    expect(again!.leaves).toBe(leaves);
    expect(again!.ledger).toHaveLength(ledger);
    expect(again!.lastReport?.id).toBe(sessionId);
  });

  test('two tabs on one profile: one record and one grant; both show the same summary; Tea time in one moves both', async ({ context }) => {
    const a = await context.newPage();
    await open(a);
    const b = await context.newPage();
    await b.goto('/?debug#/');
    await ready(b, false);
    // A real 6-second brew: each tab keeps real time (no fast-forward, which would only move one tab's clock).
    await a.evaluate(() => (window as any).__kettle.timer.getState().startFocus({ minutes: 0.1, intention: 'Two tabs' }));
    const { sessionId } = await timer(a);
    await expect.poll(() => hash(b)).toBe('#/focus');
    await expect.poll(async () => (await timer(b)).sessionId).toBe(sessionId);

    for (const p of [a, b]) {
      await expect.poll(() => hash(p), { timeout: 20_000 }).toBe('#/done');
      await expect(summaryHeading(p)).toHaveCount(1);
    }
    await a.waitForTimeout(1000);
    for (const p of [a, b]) {
      const st = await stored(p);
      expect(recordsFor(st, sessionId!)).toHaveLength(1);
      // A 6-second brew earns no whole minute, so its one grant is the full-brew bonus.
      expect(grantsFor(st, sessionId!).map((e) => e.id)).toEqual([`full:${sessionId}`]);
      expect((await memory(p)).sessions.filter((r) => r.id === sessionId)).toHaveLength(1);
      expect((await memory(p)).lastReport?.id).toBe(sessionId);
    }

    await b.bringToFront();
    await b.getByRole('button', { name: /^Tea time/ }).click();
    await expect.poll(async () => (await timer(b)).phase).toBe('shortBreak');
    const brk = await timer(b);
    await expect.poll(async () => (await timer(a)).sessionId).toBe(brk.sessionId);
    await expect.poll(() => hash(a)).toBe('#/focus');
    expect((await stored(a))!.sessions.filter((r) => r.phase === 'focus')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// I02 — Recoverable End and task disposition
// ---------------------------------------------------------------------------------------------------------------

test.describe('I02 End, dismissal and task disposition', () => {
  test.beforeEach(async ({ context }) => prime(context));

  test('dismissing the End sheet (Esc, backdrop, Keep brewing) or leaving the screen never stops the brew', async ({ page }) => {
    await open(page);
    await startFromHome(page, 'Keep going');
    const s0 = await timer(page);
    const same = async () => expect(await timer(page)).toMatchObject({ status: 'running', sessionId: s0.sessionId, endsAt: s0.endsAt });

    await page.getByRole('button', { name: 'End session' }).click();
    await expect(endDialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(endDialog(page)).toBeHidden();
    await same();

    await page.getByRole('button', { name: 'End session' }).click();
    await expect(endDialog(page)).toBeVisible();
    await page.mouse.click(4, 4); // the backdrop
    await expect(endDialog(page)).toBeHidden();
    await same();

    await page.getByRole('button', { name: 'End session' }).click();
    await endDialog(page).getByRole('button', { name: 'Keep brewing' }).click();
    await expect(endDialog(page)).toBeHidden();
    await same();

    // Leaving the session screen: browser back, another tab of the app, a reload on Home.
    await page.goBack();
    await expect.poll(() => hash(page)).toBe('#/');
    await expect(page.getByRole('heading', { name: 'Your kettle’s on' })).toBeVisible();
    await same();
    await page.evaluate(() => (window as any).__kettle.navigate('/stats'));
    await expect.poll(() => hash(page)).toBe('#/stats');
    await same();
    await page.evaluate(() => (window as any).__kettle.navigate('/'));
    await reload(page);
    await expect.poll(() => hash(page)).toBe('#/focus'); // an active brew owns the screen on load
    await same();
    await page.evaluate(() => (window as any).__kettle.navigate('/'));
    await page.getByRole('button', { name: 'Back to your brew' }).click();
    await expect.poll(() => hash(page)).toBe('#/focus');
    await same();
  });

  test('End early after 12 active minutes (with a pause): 12 minutes saved as an unfinished brew, 12 leaves, no full-brew bonus, task kept', async ({ page }) => {
    await open(page);
    await startFromHome(page, 'Chapter 3 notes');
    const { sessionId } = await timer(page);
    await ff(page, 10 * MIN + 2000);
    await page.getByRole('button', { name: 'Pause' }).click();
    await ff(page, 5 * MIN); // paused time never counts
    await page.getByRole('button', { name: 'Resume' }).click();
    await ff(page, 2 * MIN);

    await page.getByRole('button', { name: 'End session' }).click();
    await expect(endDialog(page)).toContainText('your minutes still count');
    await expect(endDialog(page)).toContainText('12 minutes of focus will be saved');
    await endDialog(page).getByRole('button', { name: 'End session' }).click();
    await expect.poll(() => hash(page)).toBe('#/');
    await expect(page.getByText('Saved 12 minutes of focus')).toBeVisible();

    const st = await stored(page);
    const rec = recordsFor(st, sessionId!);
    expect(rec).toHaveLength(1);
    expect(rec[0].completed).toBe(false);
    expect(rec[0].focusedMs).toBeGreaterThanOrEqual(12 * MIN);
    expect(rec[0].focusedMs).toBeLessThan(13 * MIN);
    expect(grantsFor(st, sessionId!)).toEqual([expect.objectContaining({ id: `focus:${sessionId}`, amount: 12 })]);
    const t = await timer(page);
    expect(t.completedInCycle).toBe(0);
    expect(t.lastEnded).toMatchObject({ sessionId, reason: 'user' });
    // The task waits for the next brew.
    await expect(page.getByRole('textbox', { name: /What are you brewing/ })).toHaveValue('Chapter 3 notes');
    await expect(page.getByText('Carried from your last brew')).toBeVisible();
  });

  test('End within the first minute: the sheet says nothing will be saved, and nothing is', async ({ page }) => {
    await open(page);
    await startFromHome(page, 'Too soon');
    await page.getByRole('button', { name: 'End session' }).click();
    await expect(endDialog(page)).toContainText('under a minute, so there’s nothing to save yet');
    await endDialog(page).getByRole('button', { name: 'End session' }).click();
    await expect.poll(() => hash(page)).toBe('#/');
    await expect(page.getByText('Kettle’s off. See you soon.')).toBeVisible();
    expect((await stored(page))?.sessions ?? []).toHaveLength(0);
  });

  test('Done / Carry forward are reversible; the carried task returns on Home; editing it and Mark done → Undo never add a focus record', async ({ page }) => {
    await open(page);
    await startFromHome(page, 'Chapter 3 notes');
    const { sessionId } = await timer(page);
    await toEnd(page, 50);
    await expect.poll(() => hash(page), { timeout: 15_000 }).toBe('#/done');

    const done = page.getByRole('button', { name: 'Done', exact: true });
    const carry = page.getByRole('button', { name: 'Carry forward' });
    const outcome = async () => (await memory(page)).sessions.find((r) => r.id === sessionId)?.outcome;
    await done.click();
    await expect(done).toHaveAttribute('aria-pressed', 'true');
    expect(await outcome()).toBe('done');
    expect((await timer(page)).intention).toBe('');
    await done.click(); // take it back
    await expect(done).toHaveAttribute('aria-pressed', 'false');
    expect(await outcome()).toBeUndefined();
    expect((await timer(page)).intention).toBe('Chapter 3 notes');
    await carry.click();
    await expect(carry).toHaveAttribute('aria-pressed', 'true');
    expect(await outcome()).toBe('carried');
    expect((await stored(page))!.sessions).toHaveLength(1);

    await page.getByRole('button', { name: 'Skip break' }).click();
    await expect.poll(() => hash(page)).toBe('#/');
    const field = page.getByRole('textbox', { name: /What are you brewing/ });
    await expect(field).toHaveValue('Chapter 3 notes');
    await expect(page.getByText('Carried from your last brew')).toBeVisible();

    await page.getByRole('button', { name: 'Mark “Chapter 3 notes” done' }).click();
    await expect(field).toHaveValue('');
    expect(await outcome()).toBe('done');
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(field).toHaveValue('Chapter 3 notes');
    expect(await outcome()).toBe('carried');

    await field.fill('Chapter 3 notes, part 2');
    await page.waitForTimeout(300);
    expect((await stored(page))!.sessions.filter((r) => r.phase === 'focus')).toHaveLength(1);
    await startButton(page).click();
    await expect.poll(() => hash(page)).toBe('#/focus');
    expect((await timer(page)).intention).toBe('Chapter 3 notes, part 2');
    await toEnd(page, 50);
    await expect.poll(() => hash(page), { timeout: 15_000 }).toBe('#/done');
    const st = await stored(page);
    const focus = st!.sessions.filter((r) => r.phase === 'focus');
    expect(focus).toHaveLength(2);
    expect(focus.find((r) => r.id === sessionId)).toMatchObject({ intention: 'Chapter 3 notes', outcome: 'carried' });
    expect(focus.find((r) => r.id !== sessionId)).toMatchObject({ intention: 'Chapter 3 notes, part 2', completed: true });
  });

  test('Skip break, Next brew and That’s all for now do what they say, and never record a skipped break', async ({ page }) => {
    await open(page);
    await startFromHome(page, 'Essay');
    await toEnd(page, 50);
    await expect.poll(() => hash(page), { timeout: 15_000 }).toBe('#/done');

    // Summary → Tea time → Next brew: the break is skipped (not recorded), the task carries on.
    await page.getByRole('button', { name: /^Tea time/ }).click();
    await expect.poll(async () => (await timer(page)).phase).toBe('shortBreak');
    await page.getByRole('button', { name: 'Start next brew' }).click();
    await expect.poll(async () => (await timer(page)).phase).toBe('focus');
    expect(await timer(page)).toMatchObject({ status: 'running', intention: 'Essay' });
    expect((await stored(page))!.sessions.map((r) => r.phase)).toEqual(['focus']);

    // Second brew → Tea time → the break runs out → Break's over → That's all for now.
    await toEnd(page, 50);
    await expect.poll(() => hash(page), { timeout: 15_000 }).toBe('#/done');
    await page.getByRole('button', { name: /^Tea time/ }).click();
    await expect.poll(async () => (await timer(page)).phase).toBe('shortBreak');
    await toEnd(page, 50);
    await expect(page.getByRole('heading', { name: 'Break’s over', level: 2 })).toBeVisible({ timeout: 15_000 }); // the card (an sr-only h1 names the screen too)
    await page.getByRole('button', { name: 'That’s all for now' }).click();
    await expect.poll(() => hash(page)).toBe('#/');
    expect((await stored(page))!.sessions.map((r) => `${r.phase}:${r.completed}`)).toEqual(['focus:true', 'focus:true', 'shortBreak:true']);

    // Third brew → Skip break on the summary: home, no break.
    await startButton(page).click();
    await expect.poll(() => hash(page)).toBe('#/focus');
    await toEnd(page, 50);
    await expect.poll(() => hash(page), { timeout: 15_000 }).toBe('#/done');
    await page.getByRole('button', { name: 'Skip break' }).click();
    await expect.poll(() => hash(page)).toBe('#/');
    expect((await timer(page)).status).toBe('idle');

    // Fourth brew (this one earns the long break) → Skip break during the break: home, the break is not recorded.
    await startButton(page).click();
    await expect.poll(() => hash(page)).toBe('#/focus');
    await toEnd(page, 50);
    await expect.poll(() => hash(page), { timeout: 15_000 }).toBe('#/done');
    await page.getByRole('button', { name: /^Long tea break/ }).click();
    await expect.poll(async () => (await timer(page)).phase).toBe('longBreak');
    await page.getByRole('button', { name: 'Skip break' }).click();
    await expect.poll(() => hash(page)).toBe('#/');
    expect((await stored(page))!.sessions.map((r) => `${r.phase}:${r.completed}`)).toEqual(['focus:true', 'focus:true', 'shortBreak:true', 'focus:true', 'focus:true']);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// I03 — Data safety and truthful storage consequences
// ---------------------------------------------------------------------------------------------------------------

/** Everything a person would notice: brews, leaves, level-driving totals, badges, Tea Cozies, settings. */
const snapshot = (page: Page) =>
  page.evaluate(() => {
    const k = (window as any).__kettle;
    const p = k.progress.getState();
    const s = k.settings.getState();
    const keep: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(s)) if (typeof v !== 'function') keep[key] = v;
    return {
      sessions: (p.sessions as any[]).map((r) => JSON.stringify(r)).sort(),
      ledger: (p.ledger as any[]).map((e) => `${e.id}=${e.amount}`).sort(),
      leaves: p.leaves as number,
      cozies: p.cozies as number,
      badges: JSON.stringify(Object.entries(p.badges).sort()),
      settings: keep,
    };
  });
const rawData = (page: Page) => page.evaluate(() => ({ progress: localStorage.getItem('kettle:progress'), settings: localStorage.getItem('kettle:settings') }));
/** The profile card in Settings: level, leaves, warm days, as a person reads them. */
const profilePills = async (page: Page) => {
  await page.evaluate(() => (window as any).__kettle.navigate('/settings'));
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  return page.evaluate(() => {
    const text = document.body.innerText;
    // (Not "32 leaves to level 5" from a side card that may or may not have rendered yet.)
    return ['Level \\d+', '[\\d,]+ leaves(?! to level)', '\\d+ days? warm'].map((re) => text.match(new RegExp(re))?.[0] ?? null);
  });
};
/** Export through Settings, as a person would, and return the file's text. */
async function exportViaSettings(page: Page): Promise<string> {
  await page.evaluate(() => (window as any).__kettle.navigate('/settings'));
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Export a backup/ }).click()]);
  return readFileSync((await download.path())!, 'utf8');
}
const nookItems = async (page: Page) => {
  await page.evaluate(() => (window as any).__kettle.navigate('/nook'));
  await page.waitForTimeout(800);
  return page.evaluate(() => (window as any).__kettle.progress.getState().leaves as number);
};

/**
 * A fresh "newbie" profile whose real localStorage quota is then filled (filler keys are not Kettle's), so every
 * further Kettle save fails with the browser's own QuotaExceededError. Returns what was saved before.
 */
async function newbieWithFullStorage(page: Page, opts: { seeded?: boolean } = {}) {
  if (!opts.seeded) {
    await open(page);
    await page.evaluate(() => (window as any).__kettle.seed('newbie'));
    await reload(page);
  }
  // A returning person's profile always holds a saved timer (every brew writes one). A freshly seeded profile may
  // not have one yet, depending on boot timing, so save it now: the storage-full case is then deterministic.
  await page.evaluate(() => (window as any).__kettle.timer.setState({}));
  expect(await page.evaluate(() => localStorage.getItem('kettle:timer'))).toContain('"status":"idle"');
  const raw0 = await rawData(page);
  const n0 = JSON.parse(raw0.progress!).state.sessions.length as number;
  const err = await page.evaluate(() => {
    let chunk = 'x'.repeat(1024 * 1024);
    let i = 0;
    while (chunk.length >= 8) {
      try {
        localStorage.setItem(`filler${i++}`, chunk);
      } catch {
        chunk = chunk.slice(0, chunk.length / 2);
      }
    }
    try {
      localStorage.setItem('filler-probe', 'x'.repeat(4096));
      return 'no error';
    } catch (e) {
      return (e as DOMException).name;
    }
  });
  expect(err).toBe('QuotaExceededError');
  return { raw0, n0 };
}

test.describe('I03 data safety', () => {
  test.beforeEach(async ({ context }) => prime(context));

  test('export → reset (explicit confirmation) → import restores brews, settings and every reward exactly', async ({ page }) => {
    test.setTimeout(150_000);
    await open(page);
    await page.evaluate(() => (window as any).__kettle.seed('veteran'));
    await reload(page);
    await page.evaluate(() => (window as any).__kettle.settings.getState().set({ theme: 'dark', dailyGoalMin: 90, keepAwake: false, name: 'Robin R.' }));
    const before = await snapshot(page);
    expect(before.sessions.length).toBeGreaterThan(50);
    expect(Object.keys(JSON.parse(before.badges)).length).toBeGreaterThan(0);
    const pillsBefore = await profilePills(page);
    expect(pillsBefore.every(Boolean)).toBe(true);

    // Export from Settings → a real file.
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Export a backup/ }).click()]);
    const file = await download.path();
    const backup = JSON.parse(readFileSync(file!, 'utf8'));
    expect(backup).toMatchObject({ app: 'kettle', kind: 'backup', schema: 2 });
    expect(backup.progress.sessions).toHaveLength(before.sessions.length);

    // Reset needs an explicit second step; every way out of the sheet keeps the data.
    const sheet = page.getByRole('dialog', { name: 'Start fresh?' });
    const reset = page.getByRole('button', { name: /^Reset everything/ });
    await reset.click();
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText('It can’t be undone.');
    expect((await snapshot(page)).sessions).toEqual(before.sessions);
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await reset.click();
    await sheet.getByRole('button', { name: 'Keep my data' }).click();
    await expect(sheet).toBeHidden();
    expect(await snapshot(page)).toEqual(before);
    await reset.click();
    await sheet.getByRole('button', { name: 'Reset everything' }).click();
    await expect.poll(() => hash(page)).toBe('#/welcome');
    const wiped = await snapshot(page);
    expect(wiped.sessions).toHaveLength(0);
    expect(wiped.leaves).toBe(0);
    expect(wiped.settings.theme).not.toBe('dark');

    // Restore from the welcome screen ("I have a backup").
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'I have a backup' }).click()]);
    await chooser.setFiles(file!);
    await expect.poll(() => hash(page)).toBe('#/');
    await expect(page.getByText(`Welcome back. ${before.sessions.filter((r) => JSON.parse(r).phase === 'focus').length} brews restored.`)).toBeVisible();
    const after = await snapshot(page);
    expect(after.sessions).toEqual(before.sessions);
    expect(after.ledger).toEqual(before.ledger);
    expect(after.leaves).toBe(before.leaves);
    expect(after.cozies).toBe(before.cozies);
    expect(after.badges).toBe(before.badges);
    expect(after.settings).toEqual(before.settings);
    expect(await profilePills(page)).toEqual(pillsBefore);
    expect(await nookItems(page)).toBe(before.leaves); // the Nook's items follow the restored level
    // …and it is saved, not just in memory.
    await reload(page);
    expect(await snapshot(page)).toEqual(after);
  });

  test('invalid files change nothing and say why (not JSON, another app, truncated, newer version, huge, empty, damaged)', async ({ page }) => {
    test.setTimeout(120_000);
    await open(page);
    await page.evaluate(() => (window as any).__kettle.seed('newbie'));
    await reload(page);
    const good = await page.evaluate(() => (window as any).__kettle.progress.getState().sessions.length);
    expect(good).toBeGreaterThan(0);
    const exported = await exportViaSettings(page);
    const base = JSON.parse(exported);
    const raw0 = await rawData(page);

    const cases: { name: string; body: string | Buffer; message: string | RegExp }[] = [
      { name: 'notes.txt', body: 'hello, not json', message: 'We couldn’t read that file. Is it a Kettle backup (.json)?' },
      { name: 'other.json', body: JSON.stringify({ app: 'notes', items: [1, 2] }), message: 'That file doesn’t look like a Kettle backup.' },
      { name: 'truncated.json', body: exported.slice(0, Math.floor(exported.length / 2)), message: 'We couldn’t read that file. Is it a Kettle backup (.json)?' },
      { name: 'future.json', body: JSON.stringify({ ...base, schema: 99 }), message: 'This backup is from a newer version of Kettle. Update the app, then try again.' },
      { name: 'huge.json', body: Buffer.alloc(21 * 1024 * 1024, 32), message: 'That file is too big to be a Kettle backup.' },
      { name: 'empty.json', body: '', message: /That file is empty|couldn’t read/ },
      { name: 'no-progress.json', body: JSON.stringify({ app: 'kettle', kind: 'backup', schema: 2 }), message: 'That backup is missing its progress data, so nothing was changed.' },
      { name: 'damaged.json', body: JSON.stringify({ ...base, progress: { ...base.progress, sessions: [{ id: 1 }, { nope: true }] } }), message: 'The sessions in this backup look damaged, so nothing was changed.' },
    ];
    for (const c of cases) {
      const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: /Import a backup/ }).click()]);
      await chooser.setFiles({ name: c.name, mimeType: 'application/json', buffer: Buffer.isBuffer(c.body) ? c.body : Buffer.from(c.body) });
      await expect(page.getByRole('alert')).toHaveText(c.message);
      await expect(page.getByRole('dialog')).toHaveCount(0);
      expect(await rawData(page), c.name).toEqual(raw0);
    }

    // A valid backup opens a preview; cancelling it changes nothing either.
    const extra = { ...base, progress: { ...base.progress, sessions: [...base.progress.sessions, { ...base.progress.sessions[0], id: 's_extra_e2e' }] } };
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: /Import a backup/ }).click()]);
    await chooser.setFiles({ name: 'ok.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(extra)) });
    const sheet = page.getByRole('dialog', { name: 'Add this backup?' });
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: 'Cancel' }).click();
    await expect(sheet).toBeHidden();
    expect(await rawData(page)).toEqual(raw0);
  });

  test('storage full: a brew that completes still reaches its summary, once; saved data stays intact; a backup carries the brew; making room saves it', async ({ page }) => {
    test.setTimeout(120_000);
    const { raw0, n0 } = await newbieWithFullStorage(page);
    await page.evaluate(() => (window as any).__kettle.timer.getState().startFocus({ minutes: 25, intention: 'Storage full' }));
    const { sessionId } = await timer(page);
    await toEnd(page, 50);
    // Not lost at 0:00: the whistle, then the summary of this brew.
    await expect.poll(() => hash(page), { timeout: 15_000 }).toBe('#/done');
    await expect(summaryHeading(page)).toHaveText('25 minutes brewed');
    expect(await timer(page)).toMatchObject({ status: 'idle', lastEnded: { sessionId, reason: 'complete' } });
    // What was saved before is intact and readable; the brew lives in this tab only, exactly once.
    expect((await rawData(page)).progress).toBe(raw0.progress);
    expect((await memory(page)).sessions.filter((r) => r.id === sessionId)).toHaveLength(1);

    // Exporting still works and includes the unsaved brew.
    await page.getByRole('button', { name: 'Skip break' }).click();
    // (Where and when the warning shows is tested below; put it away if it is up.)
    const warning = page.getByRole('status', { name: 'Notifications' }).getByText(/storage is full/);
    await page.waitForTimeout(600);
    if (await warning.isVisible()) await warning.click();
    const backup = JSON.parse(await exportViaSettings(page));
    expect(backup.progress.sessions.filter((r: Rec) => r.id === sessionId)).toHaveLength(1);

    // Make room: the next save writes everything the tab holds (here: the export's re-read of storage), and it
    // survives a reload.
    await page.evaluate(() => {
      for (const k of Object.keys(localStorage)) if (k.startsWith('filler')) localStorage.removeItem(k);
    });
    await page.getByRole('button', { name: /Export a backup/ }).click();
    await page.waitForTimeout(500);
    await reload(page);
    const st = await stored(page);
    expect(st!.sessions).toHaveLength(n0 + 1);
    expect(recordsFor(st, sessionId!)).toHaveLength(1);
  });

  test('storage full: a restore that cannot be saved is refused with a plain reason and changes nothing', async ({ page }) => {
    test.setTimeout(120_000);
    await open(page);
    await page.evaluate(() => (window as any).__kettle.seed('newbie'));
    await reload(page);
    const exported = await exportViaSettings(page);
    const extra = JSON.parse(exported);
    extra.progress.sessions.push({ ...extra.progress.sessions[0], id: 's_full_import' });
    const { raw0 } = await newbieWithFullStorage(page, { seeded: true });
    const memBefore = (await memory(page)).sessions.length;
    await page.evaluate(() => (window as any).__kettle.navigate('/settings'));
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: /Import a backup/ }).click()]);
    await chooser.setFiles({ name: 'more.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(extra)) });
    const sheet = page.getByRole('dialog', { name: 'Add this backup?' });
    await sheet.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('alert')).toHaveText('Kettle couldn’t save the backup: this browser’s storage is full. Nothing was changed.');
    expect((await memory(page)).sessions.length).toBe(memBefore);
    expect((await memory(page)).sessions.some((r) => r.id === 's_full_import')).toBe(false);
    expect(await rawData(page)).toEqual(raw0);
    // It says why itself; no second, general "couldn't save your latest changes" warning (there are none).
    await page.waitForTimeout(800);
    await expect(page.getByText(/Save a backup to keep them/)).toHaveCount(0);
    await reload(page);
    expect((await memory(page)).sessions.some((r) => r.id === 's_full_import')).toBe(false);
  });

  test('“Everything lives on this device”: a brew, an export and an import send nothing anywhere', async ({ page }) => {
    const requests: { method: string; url: string }[] = [];
    page.on('request', (r) => requests.push({ method: r.method(), url: r.url() }));
    await open(page);
    await startFromHome(page, 'Private');
    await toEnd(page, 50);
    await expect.poll(() => hash(page), { timeout: 15_000 }).toBe('#/done');
    await page.getByRole('button', { name: 'Skip break' }).click();
    await expect.poll(() => hash(page)).toBe('#/');
    await page.evaluate(() => (window as any).__kettle.navigate('/settings'));
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Export a backup/ }).click()]);
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: /Import a backup/ }).click()]);
    await chooser.setFiles((await download.path())!);
    await page.waitForTimeout(800);
    const origin = new URL(page.url()).origin;
    const offDevice = requests.filter((r) => !r.url.startsWith(origin) && !r.url.startsWith('blob:') && !r.url.startsWith('data:'));
    expect(offDevice).toEqual([]);
    expect(requests.filter((r) => r.method !== 'GET')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// I03 — the storage-full warning is told plainly, but never over a control (phones and desktop)
// ---------------------------------------------------------------------------------------------------------------

/** Is `name`'s button the element a tap at its centre would hit (nothing on top of it)? */
const hitOk = (page: Page, name: string | RegExp) =>
  page.getByRole('button', { name }).evaluate((el) => {
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return !!top && (top === el || el.contains(top));
  });
/** A real tap / click at the centre of `name`'s button (whatever is on top there receives it). */
async function pressAt(page: Page, name: string | RegExp, touch: boolean) {
  const box = (await page.getByRole('button', { name }).boundingBox())!;
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
  if (touch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}
const saveWarning = (page: Page) => page.getByRole('status', { name: 'Notifications' }).getByText(/storage is full\. Save a backup to keep them\./);
const CONTROLS = ['Add 5 minutes', 'Pause', 'End session'];

for (const vp of [
  { name: 'phone 390×844', width: 390, height: 844, dpr: 2, touch: true },
  { name: 'phone 375×667', width: 375, height: 667, dpr: 2, touch: true },
  { name: 'desktop 1440×900', width: 1440, height: 900, dpr: 1, touch: false },
]) {
  test.describe(`I03 storage-full warning never covers a control (${vp.name})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, isMobile: vp.touch, hasTouch: vp.touch });
    test.beforeEach(async ({ context }) => prime(context));

    test('while brewing (running and paused): Add 5, Pause, Resume and End stay tappable; End opens its sheet, never a download', async ({ page }) => {
      test.setTimeout(120_000);
      await newbieWithFullStorage(page);
      let downloads = 0;
      page.on('download', () => downloads++);
      await page.evaluate(() => (window as any).__kettle.timer.getState().startFocus({ minutes: 25, intention: 'Storage full' }));
      await expect.poll(() => hash(page)).toBe('#/focus');
      for (let i = 0; i < 4; i++) {
        await page.waitForTimeout(300);
        for (const c of CONTROLS) expect(await hitOk(page, c), `${c} @${i}`).toBe(true);
      }
      await pressAt(page, 'End session', vp.touch);
      await expect(endDialog(page)).toBeVisible();
      await endDialog(page).getByRole('button', { name: 'Keep brewing' }).click();
      await expect(endDialog(page)).toBeHidden();
      // Where nothing is covered (wide layouts) the warning is up now; put it away, as a person would.
      if (await saveWarning(page).isVisible()) await saveWarning(page).click();

      // A minute later a pause fails to save too: a new warning, and the paused controls stay clear.
      await ff(page, 70_000);
      await pressAt(page, 'Pause', vp.touch);
      await expect.poll(async () => (await timer(page)).status).toBe('paused');
      for (let i = 0; i < 4; i++) {
        await page.waitForTimeout(300);
        for (const c of ['Add 5 minutes', 'Resume', 'End session']) expect(await hitOk(page, c), `${c} paused @${i}`).toBe(true);
      }
      await pressAt(page, 'End session', vp.touch);
      await expect(endDialog(page)).toBeVisible();
      await endDialog(page).getByRole('button', { name: 'Keep brewing' }).click();
      await pressAt(page, 'Resume', vp.touch);
      await expect.poll(async () => (await timer(page)).status).toBe('running');
      expect(downloads).toBe(0);
      expect((await timer(page)).status).toBe('running');
    });

    test('a warning raised just before 0:00 is taken away for the whistle and summary; Tea time and Skip break stay tappable; it comes back after', async ({ page }) => {
      test.setTimeout(120_000);
      await newbieWithFullStorage(page);
      await page.evaluate(() => (window as any).__kettle.timer.getState().startFocus({ minutes: 25, intention: 'Storage full' }));
      await expect.poll(() => hash(page)).toBe('#/focus');
      await page.waitForTimeout(600);
      if (await saveWarning(page).isVisible()) await saveWarning(page).click();
      await ff(page, 70_000);
      // 4 s before the end, pause and resume: both saves fail → a new warning, up (where it covers nothing) at the end.
      await toEnd(page, 4000);
      await page.evaluate(() => {
        const t = (window as any).__kettle.timer.getState();
        t.pause();
        (window as any).__kettle.timer.getState().resume();
      });
      if (!vp.touch) await expect(saveWarning(page)).toBeVisible();
      await expect.poll(() => hash(page), { timeout: 20_000 }).toBe('#/done');
      await expect(summaryHeading(page)).toHaveText('25 minutes brewed');
      for (let i = 0; i < 5; i++) {
        await expect(saveWarning(page)).toHaveCount(0);
        expect(await hitOk(page, /^Tea time/), `Tea time @${i}`).toBe(true);
        expect(await hitOk(page, 'Skip break'), `Skip break @${i}`).toBe(true);
        await page.waitForTimeout(300);
      }
      // Leaving the summary: on Today the warning comes (back) unless it would sit over "Put the kettle on" (wide
      // layouts); then it waits for a screen where it covers nothing protected, e.g. Settings.
      await pressAt(page, 'Skip break', vp.touch);
      await expect.poll(() => hash(page)).toBe('#/');
      const cta = /^Put the kettle on/;
      if (vp.touch) {
        await expect(saveWarning(page)).toBeVisible();
        expect(await hitOk(page, cta), 'Put the kettle on').toBe(true);
        // Starting the next brew with the warning still up: it is taken away from the session controls at once…
        await pressAt(page, cta, true);
        await expect.poll(() => hash(page)).toBe('#/focus');
        for (let i = 0; i < 4; i++) {
          await expect(saveWarning(page)).toHaveCount(0);
          for (const c of CONTROLS) expect(await hitOk(page, c), `${c} next brew @${i}`).toBe(true);
          await page.waitForTimeout(250);
        }
        // …and comes back on Today (the brew ended within its first minute: nothing saved, nothing lost).
        await page.evaluate(() => (window as any).__kettle.timer.getState().end('user'));
        await expect.poll(() => hash(page)).toBe('#/');
        await expect(saveWarning(page)).toBeVisible();
      } else {
        expect(await hitOk(page, cta), 'Put the kettle on').toBe(true);
        for (let i = 0; i < 4; i++) {
          await page.waitForTimeout(300);
          await expect(saveWarning(page)).toHaveCount(0);
        }
        await page.evaluate(() => (window as any).__kettle.navigate('/settings'));
        await expect(saveWarning(page)).toBeVisible();
      }
      const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save backup' }).click()]);
      const backup = JSON.parse(readFileSync((await download.path())!, 'utf8'));
      expect(backup.progress.sessions.some((r: Rec) => r.intention === 'Storage full')).toBe(true);
    });
  });
}

