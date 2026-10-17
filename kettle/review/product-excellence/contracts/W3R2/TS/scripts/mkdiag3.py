#!/usr/bin/env python3
"""mkdiag3.py <worktree kettle dir> <out dir>: the diagnostic copy for the fix round. LEAD-6's F-diag3 `__why` (the target's
rect, what is at its centre, its fixed/sticky ancestor, the Today dock's mode and box) is taken from his copy, and the
BRANCH notice-strip.spec.ts gets logging only: the first read and the read after the walk of the composer field, every
aim-again, every not-on-top re-check, a `[diag] PATH <why>` line each time the rescroll rule fires (so the number of times
the docked-chrome path is taken can be counted), and a screenshot at a final failure. No injection. Scratch only."""
import pathlib, re, sys
wt = pathlib.Path(sys.argv[1]); out = pathlib.Path(sys.argv[2]) / 'diag3'; out.mkdir(parents=True, exist_ok=True)
lead = pathlib.Path('/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/LEAD6/TS/F-diag3.notice-strip.spec.ts.txt').read_text(encoding='utf-8')
m = re.search(r"/\*\* DIAGNOSTIC \(scratch only\).*?\n}\n", lead, re.S)
assert m, 'no __why in the lead copy'
WHY = '\n' + m.group(0)
s = (wt / 'tests' / 'notice-strip.spec.ts').read_text(encoding='utf-8')
def rep(a, b):
    global s
    assert s.count(a) == 1, a[:70]
    s = s.replace(a, b)
rep("/** Scroll by real wheel (over `over`, or the page's middle) until `el` is on top, then tap / click it for real. */",
    WHY + """const __cures = async (el: ReturnType<Page['locator']>, strict: boolean, rescrolled: number) => {
  const why = await wheelCures(el, strict);
  if (why) console.log(`[diag] PATH ${why} (rescrolled ${rescrolled}) ${String(el).slice(0, 50)}`);
  return why;
};
/** Scroll by real wheel (over `over`, or the page's middle) until `el` is on top, then tap / click it for real. */""")
rep("  let at = await onTop(page, el, strict);\n",
    "  let at = await onTop(page, el, strict);\n  if (String(el).includes('What are you brewing')) console.log(`[diag] first read (rescrolled ${rescrolled}) -> ${at ? 'on top' : 'null'} ${await __why(el)}`);\n")
rep("    await park(page);\n    // (W3R2) Only a first call",
    "    if (String(el).includes('What are you brewing')) console.log(`[diag] after walk (rescrolled ${rescrolled}) -> ${at ? 'on top' : 'null'} ${await __why(el)}`);\n    await park(page);\n    // (W3R2) Only a first call")
rep("(await wheelCures(el, strict))) return press(", "(await __cures(el, strict, rescrolled))) return press(")
rep("      at = await onTop(page, el, strict);\n      if (!at && rescrolled < AIM_RESCROLL",
    "      at = await onTop(page, el, strict);\n      console.log(`[diag] aim again ${covered} (rescrolled ${rescrolled}) -> ${at ? 'on top' : 'null'} ${await __why(el)}`);\n      if (!at && rescrolled < AIM_RESCROLL")
rep("    const again = await onTop(page, el, strict);\n", "    const again = await onTop(page, el, strict);\n    if (!again) console.log(`[diag] re-check null (round ${round}, rescrolled ${rescrolled}) ${await __why(el)}`);\n")
rep("  expect(at, `${el} still on top as the tap is aimed`).not.toBeNull();\n",
    "  if (!at) { const f = `/home/user/wt/w8q/kettle/.tmp/ts-out/r2-diag3-fail-${Date.now()}.png`; await page.screenshot({ path: f }).catch(() => {}); console.log(`[diag] FAIL screenshot ${f} ${await __why(el)}`); }\n  expect(at, `${el} still on top as the tap is aimed`).not.toBeNull();\n")
(out / 'notice-strip.spec.ts').write_text(s, encoding='utf-8')
print('built', out / 'notice-strip.spec.ts')
