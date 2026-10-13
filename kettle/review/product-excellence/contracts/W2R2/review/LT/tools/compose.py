import subprocess, re
T='/home/user/wt/w3tr-t2/kettle/.tmp/LT/'
def tab(w): return subprocess.run(['python3', T+'tables.py', w], capture_output=True, text=True).stdout.strip()
head=open(T+'receipt-head.md').read(); body=open(T+'receipt-body.md').read()
fm=tab('fixmin').split(' ',2)
thu=open('/home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LT/logs/specs-index.log').read()
m=re.search(r'breakreach184-thu.*\n\s+rc=(\d+) (\S+)\s+(.*)', thu)
thu_s = f"**{m.group(3).strip(' ;')}** (rc {m.group(1)}, ended {m.group(2)})" if m else 'not finished'
body=body.replace('{END}',tab('end')).replace('{TODAY}',tab('today')).replace('{HIST}',tab('hist')).replace('{TOP}',tab('top')).replace('{FIXMIN}',fm[0]+f" (runs: {fm[2]})").replace('{FIXOUT}',fm[1]).replace('{THU}',thu_s)
out='/home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LT/RECEIPT-LT.md'
open(out,'w').write(head+body)
print(out, len(head+body))
