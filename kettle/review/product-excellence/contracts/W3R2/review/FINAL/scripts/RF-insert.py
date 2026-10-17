#!/usr/bin/env python3
# RF-insert.py <section-file> [before-heading-prefix]: insert the section text into RECEIPT-FINAL-W3R2.md before the first heading starting with the prefix (or append)
import sys
p = '/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL/RECEIPT-FINAL-W3R2.md'
s = open(p).read(); new = open(sys.argv[1]).read().rstrip('\n') + '\n\n'
if len(sys.argv) > 2:
    i = s.find('\n' + sys.argv[2])
    if i < 0: sys.exit('heading not found')
    s = s[:i + 1] + new + s[i + 1:]
else:
    s = s.rstrip('\n') + '\n\n' + new
open(p, 'w').write(s.rstrip('\n') + '\n')
