"""Summarise Playwright list-reporter logs: passed/failed/skipped/flaky counts, failing titles, skip reasons."""
import re, sys
for path in sys.argv[1:]:
    try:
        t = re.sub(r'\x1b\[[0-9;]*m', '', open(path, encoding='utf-8', errors='replace').read())
    except FileNotFoundError:
        print(f'{path}: not run'); continue
    counts = {k: int(m.group(1)) for k in ('passed', 'failed', 'skipped', 'flaky', 'did not run') for m in [re.search(rf'^\s*(\d+) {k}', t, re.M)] if m}
    fails = sorted(set(re.findall(r'^\s+\d+\) (\[[^\]]+\] › .+?)\s*$', t, re.M)))
    skips = re.findall(r'^\s+-\s+\d+ (\[[^\]]+\] › .+?)\s*$', t, re.M)
    print(f'{path.split("/")[-1]}: {counts}')
    for f in fails: print('   FAIL', f[:200])
    for s in skips: print('   SKIP', s[:200])
