#!/usr/bin/env python3
"""Build the scratch (injection) copies of the specs, from the committed specs, by text patch. Scratch only: the
committed specs are never edited by this. Usage: mkinject.py <worktree kettle dir> <out dir>.

  old/  = the specs at the base commit (494748b)       mid/ = old timer spec with only the observer moved before the start
  new/  = the specs on the branch (the working tree)

timer.spec.ts  -> a `page` fixture whose evaluate() is followed by a test-side wait (the runner is late) after the
                  command that starts the brew (the one whose function text holds `startFocus`): the page is untouched.
notice-strip   -> before the re-check read in press(), a positioned element covers the target (COVER=transient: ~300 ms,
                  once per test; permanent: never removed; shift: the page is scrolled 400 px at that read; dock: the Today dock is in the flow at the first read and docked over
                  the field at the re-check; permanent-abs: a cover anchored in the page; sheet: a sheet's control leaves the view for good; none).

  v2 = 21e5644 (the rejected tip); new = the working tree (the fix round).
"""
import subprocess, sys, pathlib

wt = pathlib.Path(sys.argv[1]); out = pathlib.Path(sys.argv[2])
BASE = '494748b'

def base_src(name):
    return subprocess.check_output(['git', '-C', str(wt), 'show', f'{BASE}:kettle/tests/{name}'], text=True)
def work_src(name):
    return (wt / 'tests' / name).read_text(encoding='utf-8')

def rep(s, a, b, n=1):
    assert s.count(a) == n, (s.count(a), a[:80])
    return s.replace(a, b)

# ---------------------------------------------------------------- timer
FIX = '''const test = base.extend<{ kettlePage: string }>({
  kettlePage: ['/tests/harness/timer.html', { option: true }],
  // INJECTION (scratch only): the runner is late after the command that starts the brew. The reply reaches the test
  // process late, so the next command is sent after the brew is over. Wait = brew length + 0.5 s (6.5 s / 4.5 s in the app).
  page: async ({ page, kettlePage }, use, testInfo) => {
    const brew = testInfo.title.startsWith('background') ? 3 : 2;
    const wait = Number(process.env.INJECT_MS ?? (kettlePage.includes('harness') ? brew : brew * 2) * 1000 + 500);
    const ev = page.evaluate.bind(page) as any;
    (page as any).evaluate = async (fn: any, arg?: any) => {
      const r = await ev(fn, arg);
      if (wait > 0 && String(fn).includes('startFocus')) {
        console.log(`[inject] runner late by ${wait} ms after the start command (${testInfo.title.slice(0, 20)}, ${kettlePage.slice(0, 20)})`);
        await new Promise<void>((done) => setTimeout(done, wait));
      }
      return r;
    };
    await use(page);
  },
});'''
ORIG = '''const test = base.extend<{ kettlePage: string }>({
  kettlePage: ['/tests/harness/timer.html', { option: true }],
});'''

def timer(src, mid=False):
    s = rep(src, ORIG, FIX)
    if mid:  # old test, observer moved before the start and nothing else (the shape of the brief's one-line fix)
        a = '''    await start(page, secs(kettlePage, 3));
    const { endsAt, sessionId } = await state(page);
    await page.evaluate(() => {
      const w = window as any;
      w.__kettle.timer.subscribe((s: any, p: any) => {
        if (p.status === 'running' && s.status === 'idle') w.__doneAt = Date.now();
      });
      // What'''
        b = '''    await page.evaluate(() => {
      const w = window as any;
      w.__kettle.timer.subscribe((s: any, p: any) => {
        if (p.status === 'running' && s.status === 'idle') w.__doneAt = Date.now();
      });
    });
    await start(page, secs(kettlePage, 3));
    const { endsAt, sessionId } = await state(page);
    await page.evaluate(() => {
      const w = window as any;
      // What'''
        s = rep(s, a, b)
    return s

# ---------------------------------------------------------------- notice-strip
COVER = '''
let __covers = 0;
let __dockPrepared = false;
let __sheetDone = false;
/** INJECTION (scratch only, COVER=dock): the Today composer's dock is in the page flow (data-tall) at the first read of the
 *  first press, as it is for the first moments after boot; __cover then docks it (sticky) at the re-check. */
async function __dockOn(page: Page, el: ReturnType<Page['locator']>) {
  if ((process.env.COVER ?? 'transient') !== 'dock' || __dockPrepared || !String(el).includes('What are you brewing')) return;
  __dockPrepared = true;
  const s = await page.evaluate(async () => {
    const d = document.querySelector('[class*=ctaDock]');
    if (!d) return 'no dock';
    d.setAttribute('data-tall', '');
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const b = d.getBoundingClientRect();
    return `dock in the flow: ${getComputedStyle(d).position} top ${Math.round(b.top)} bottom ${Math.round(b.bottom)} of ${innerHeight}`;
  });
  console.log(`[inject] dock: ${s}`);
}
/** INJECTION (scratch only): cover the target, then the re-check in press() reads it. */
async function __cover(page: Page, el: ReturnType<Page['locator']>) {
  const mode = process.env.COVER ?? 'transient';
  if (mode === 'sheet') {  // a sheet's control leaves the view at the re-check and no wheel can bring it back
    if (__sheetDone || !(await el.evaluate((e) => !!e.closest('[role="dialog"]')))) return;
    __sheetDone = true;
    await el.evaluate((e) => { (e as HTMLElement).style.transform = 'translateY(-3000px)'; });
    console.log(`[inject] sheet: ${el} moved out of the view for good at the re-check`);
    return;
  }
  if (mode === 'none' || __covers >= 1) return;
  __covers++;
  if (mode === 'dock') {  // the dock settles: docked (sticky) over the field, for good
    const v = await page.evaluate(async () => {
      const d = document.querySelector('[class*=ctaDock]');
      if (!d) return 'no dock';
      d.removeAttribute('data-tall');
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const b = d.getBoundingClientRect();
      return `docked: ${getComputedStyle(d).position} top ${Math.round(b.top)} bottom ${Math.round(b.bottom)} of ${innerHeight}`;
    });
    console.log(`[inject] dock: ${v}`);
    return;
  }
  if (mode === 'shift') {  // the page moves under the target (a layout shift): the target is out of the view at the re-check
    const [a, b, v] = await page.evaluate(() => { const a = scrollY; window.scrollBy({ top: 400, behavior: 'instant' }); return [a, scrollY]; }).then(async ([a, b]) => [a, b, await el.evaluate((e) => { const r = e.getBoundingClientRect(); return `top ${Math.round(r.top)} bottom ${Math.round(r.bottom)} of ${innerHeight}`; })] as const);
    console.log(`[inject] shift: the page scrolled ${a} -> ${b}; the field is now at ${v}`);
    return;
  }
  const ms = mode.startsWith('permanent') ? 0 : Number(process.env.COVER_MS ?? 300);
  // permanent / transient: fixed to the screen (page chrome would look like this); permanent-abs: anchored in the page (scrolls with the field)
  const abs = mode === 'permanent-abs';
  await el.evaluate((e, [ms, abs]) => {
    const r = e.getBoundingClientRect();
    const d = document.createElement('div');
    d.id = '__cover';
    Object.assign(d.style, { position: abs ? 'absolute' : 'fixed', left: r.left - 4 + (abs ? scrollX : 0) + 'px', top: r.top - 4 + (abs ? scrollY : 0) + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px', zIndex: '2147483647', background: 'rgba(255,0,0,0.2)' });
    document.body.appendChild(d);
    if (ms) setTimeout(() => d.remove(), ms as number);
  }, [ms, abs] as const);
  console.log(`[inject] ${mode} cover over ${el} ${ms ? 'for ' + ms + ' ms' : '(never removed)'} at ${new Date().toISOString().slice(11, 23)}`);
}
'''
def notice(src):
    s = rep(src, "/** Scroll by real wheel (over `over`, or the page's middle) until `el` is on top, then tap / click it for real. */",
            COVER + "/** Scroll by real wheel (over `over`, or the page's middle) until `el` is on top, then tap / click it for real. */")
    s = rep(s, "    const again = await onTop(page, el, strict);\n",
            "    await __cover(page, el);\n    const again = await onTop(page, el, strict);\n    if (!again) console.log(`[inject] re-check: covered at ${new Date().toISOString().slice(11, 23)}`);\n")
    s = rep(s, "  let at = await onTop(page, el, strict);\n", "  await __dockOn(page, el);\n  let at = await onTop(page, el, strict);\n")
    if 'rescrolled + 1' in s:
        s = rep(s, ") return press(page, touch, el, over, strict, rescrolled + 1);", ") { console.log('[inject] rescroll: bring it clear by the wheel'); return press(page, touch, el, over, strict, rescrolled + 1); }")
    if 'AIM_PAUSE_MS);' in s:
        s = rep(s, "      await page.waitForTimeout(AIM_PAUSE_MS);\n",
                "      await page.waitForTimeout(AIM_PAUSE_MS);\n      console.log(`[inject] aim again ${covered} at ${new Date().toISOString().slice(11, 23)}`);\n")
    return s

def v1_src(name):
    return subprocess.check_output(['git', '-C', str(wt), 'show', f'a6b3790:kettle/tests/{name}'], text=True)
def v2_src(name):
    return subprocess.check_output(['git', '-C', str(wt), 'show', f'21e5644:kettle/tests/{name}'], text=True)

for name, getter in (('old', base_src), ('v1', v1_src), ('v2', v2_src), ('new', work_src)):
    d = out / name; d.mkdir(parents=True, exist_ok=True)
    if name not in ('v1', 'v2'): (d / 'timer.spec.ts').write_text(timer(getter('timer.spec.ts')), encoding='utf-8')
    (d / 'notice-strip.spec.ts').write_text(notice(getter('notice-strip.spec.ts')), encoding='utf-8')
d = out / 'mid'; d.mkdir(parents=True, exist_ok=True)
(d / 'timer.spec.ts').write_text(timer(base_src('timer.spec.ts'), mid=True), encoding='utf-8')
print('built', [str(p) for p in sorted(out.glob('*/*.ts'))])
