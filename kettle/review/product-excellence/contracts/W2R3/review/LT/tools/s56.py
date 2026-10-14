import re
t=open('/tmp/claude-0/lt3-s6.md').read()
def rows(pat):
    r=[l for l in t.splitlines() if l.startswith('| ✓') or l.startswith('| ✘')]
    m=[l for l in r if re.search(pat,l)]
    return f"{sum(l.startswith('| ✓') for l in m)} passed, {sum(l.startswith('| ✘') for l in m)} failed of {len(m)} run"
out=['| Control (round) | The trial\'s test that carries its shape (`toast-room.spec.ts` / `a11y.spec.ts`) | Result on the fix :5476 |','|---|---|---|',
f"| R5-D1 (banner never moved out of its room by a notice timing out) | \"the storage-full banner stays in the page, whole and steady, while … the strip … read by wheel / touch\" | {rows('storage-full banner stays')} |",
f"| LEAD-D1 (timed notices and the endless update prompt never move the banner) | \"notices timing out, and the endless update prompt, never move the banner under the person\" | {rows('never move the banner')} |",
f"| R7-D1 (update prompt and every notice whole and tappable on Break's over scrolled to its end) | \"the update prompt and every notice stay whole and tappable, never over a control, on Break's over…\" | {rows('update prompt and every notice')} |",
f"| round 8 / Close (three notices never over Close or a Break's over control) | \"three notices never cover the session top bar's Close…\" | {rows('three notices never cover')} |",
f"| last notice / docked start | \"the last notice leaves where it was, never over the docked start\" | {rows('last notice leaves')} |",
"| D4 (a toast never covers the break-over controls, carried task included) | `a11y.spec.ts` (375×667 and 390×844) | **not run** (time; see §7). Lane T's probe covers the same state (Break's over on Monday with a carried task, wheeled): 0 control intersections, 0 nine-point hits, all 22 configurations (§1.2) |",
'','Controls were not re-run by Lane T on the control revisions (`20671eb`, `e866118`, `b39202f`); the maker\'s control-first results are in the packet §3. The base `61aba17` (:5470) has no in-flow strip, so the trial\'s `toast-room.spec.ts` was not run against it.']
open('/tmp/claude-0/lt3-s56.md','w').write('\n'.join(out))
