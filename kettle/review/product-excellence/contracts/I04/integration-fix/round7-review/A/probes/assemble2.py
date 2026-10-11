#!/usr/bin/env python3
"""Lane A relaunch: assemble RECEIPT.md. argv[1] = JSON of placeholder values (strings or {"file": path})."""
import json, subprocess, sys
A = '/home/user/wt/rv7-r7/kettle/.tmp/A'
OUT = '/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/A'
rep = json.loads(open(sys.argv[1]).read())
for k, v in list(rep.items()):
    if isinstance(v, dict) and 'file' in v: rep[k] = open(v['file']).read().rstrip('\n')
head = open(f'{A}/receipt-head.md').read() + open(f'{A}/receipt-body.md').read()
for k, v in rep.items():
    head = head.replace(f'@@{k}@@', v)
tables = subprocess.run(['python3', '-I', f'{A}/analyze.py'], capture_output=True, text=True).stdout
per = subprocess.run(['python3', '-I', f'{A}/analyze.py', 'perrun'], capture_output=True, text=True).stdout.split('## Appendix: every run', 1)[1]
cases = '\n' + subprocess.run(['python3', '-I', f'{A}/analyze_cases.py'], capture_output=True, text=True).stdout
open(f'{OUT}/tables.md', 'w').write('# Lane A r7 — tables regenerated from the raw jsonl (`probes/analyze.py`, `probes/analyze_cases.py`)\n\n' + cases + '\n' + tables + '\n## Appendix: every run' + per)
body = head + '\n## 6. Detailed tables (generated from the raw jsonl by `probes/analyze.py` and `probes/analyze_cases.py`)\n\n' + cases.replace('\n## ', '\n### ').replace('\n### One row', '\n#### One row').replace('\n### Scroll steps', '\n#### Scroll steps').replace('\n### Per configuration', '\n#### Per configuration') + '\n' + tables.replace('\n## ', '\n### ') + '\n## 7. Every run' + per.replace('\n## ', '\n### ')
left = [l for l in body.splitlines() if '@@' in l]
if left: print('UNFILLED:', [l[:100] for l in left[:8]])
open(f'{OUT}/RECEIPT.md', 'w').write(body)
print('written', len(body))
