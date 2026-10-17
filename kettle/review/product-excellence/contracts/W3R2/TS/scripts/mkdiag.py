#!/usr/bin/env python3
"""mkdiag.py <worktree kettle dir> <out dir>: scratch copy of the BRANCH notice-strip.spec.ts with diagnostics only (no injection):
at every covered re-check and every 'aim again' in press(), log what is at the target's centre. Scratch only."""
import pathlib, sys
wt = pathlib.Path(sys.argv[1]); out = pathlib.Path(sys.argv[2]) / 'diag'; out.mkdir(parents=True, exist_ok=True)
s = (wt / 'tests' / 'notice-strip.spec.ts').read_text(encoding='utf-8')
def rep(s, a, b):
    assert s.count(a) == 1, a[:60]
    return s.replace(a, b)
WHY = '''
/** DIAGNOSTIC (scratch only): what is at the target's centre, and where the target is. */
async function __why(el: ReturnType<Page['locator']>) {
  return el.evaluate((e) => {
    const r = e.getBoundingClientRect();
    const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const d = h ? `${h.tagName.toLowerCase()}${h.id ? '#' + h.id : ''}.${String(h.className).slice(0, 60)} | ${(h.getAttribute('aria-label') || h.textContent || '').trim().slice(0, 30)} | inField=${e.contains(h)} leaving=${!!h.closest('[data-route-leaving]')} inert=${!!h.closest('[inert]')} chrome=${(() => { for (let a: Element | null = h; a && a !== document.body; a = a.parentElement) { const p = getComputedStyle(a).position; if (p === 'fixed' || p === 'sticky') return p + ' ' + a.tagName.toLowerCase() + '.' + String(a.className).slice(0, 40); } return 'none'; })()}` : 'null';
    return JSON.stringify({ t: Math.round(performance.now()), top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), ih: innerHeight, iw: innerWidth, sy: scrollY, hit: d, leavingLayers: document.querySelectorAll('[data-route-leaving]').length, dialogs: document.querySelectorAll('[role=dialog]').length, hash: location.hash, vv: window.visualViewport ? [Math.round(window.visualViewport.height), Math.round(window.visualViewport.offsetTop)] : null });
  }, undefined, { timeout: 5000 }).catch((x) => 'why-failed ' + String(x).slice(0, 80));
}
'''
s = rep(s, "/** Scroll by real wheel (over `over`, or the page's middle) until `el` is on top, then tap / click it for real. */",
        WHY + "/** Scroll by real wheel (over `over`, or the page's middle) until `el` is on top, then tap / click it for real. */")
s = rep(s, "    const again = await onTop(page, el, strict);\n",
        "    const again = await onTop(page, el, strict);\n    if (!again) console.log(`[diag] re-check null (round ${round}) ${await __why(el)}`);\n")
s = rep(s, "      if (!at && rescrolled < AIM_RESCROLL && !(await inView(el))) return press(",
        "      console.log(`[diag] aim again ${covered} (rescrolled ${rescrolled}) -> ${at ? 'on top' : 'null'} inView=${await inView(el)} ${await __why(el)}`);\n      if (!at && rescrolled < AIM_RESCROLL && !(await inView(el))) return press(")
s = rep(s, "  expect(at, `${el} still on top as the tap is aimed`).not.toBeNull();\n",
        "  if (!at) { const f = `/home/user/wt/w8q/kettle/.tmp/ts-out/diag-fail-${Date.now()}.png`; await page.screenshot({ path: f }).catch(() => {}); console.log(`[diag] FAIL screenshot ${f} ${await __why(el)}`); }\n  expect(at, `${el} still on top as the tap is aimed`).not.toBeNull();\n")
# optional CPU throttling of the page (a slow page, as on a loaded machine): THROTTLE=<rate>
s = rep(s, "  const page = await ctx.newPage();\n  await page.clock.install({ time: MONDAY });",
        "  const page = await ctx.newPage();\n  if (process.env.THROTTLE) await (await ctx.newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.THROTTLE) });\n  await page.clock.install({ time: MONDAY });")
(out / 'notice-strip.spec.ts').write_text(s, encoding='utf-8')
print('built', out / 'notice-strip.spec.ts')
