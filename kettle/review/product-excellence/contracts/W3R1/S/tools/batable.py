# Builds the packet's BEFORE/AFTER table from what is on disk under S/shots/{before,after}/<cfg>/<state>.png.
import os, sys, json
root = sys.argv[1]
cfgs = ['375x667', '390x844', '844x390', '1440x900']
variants = ['light-t100', 'dark-t100', 'light-t200', 'dark-t200']
states = [('S01-empty', 'Empty Stats (K07 state)'), ('S02-veteran-top', 'Populated top: the summary (veteran)'), ('S02-veteran-full', 'Populated, full page (veteran)'),
          ('S03-veteran-calendar', 'Warm-days card (veteran)'), ('S04-newbie-top', 'Populated top (newbie)'), ('S05-celebrate-top', 'Populated top (celebrate)'),
          ('S06-atrisk-top', 'Top, at risk 19:10'), ('S07-atrisk-calendar', 'Warm-days card, at risk'), ('S08-history', 'History'),
          ('S09-edit-sheet', 'Edit brew sheet'), ('S10-delete-dialog', 'Delete this brew?')]
have = 0; missing = []
print('| State | REFERENCE | Size | Variant | BEFORE (:5478) | AFTER (:5502) |')
print('|---|---|---|---|---|---|')
for st, label in states:
    for c in cfgs:
        for v in variants:
            d = f'{c.replace("x", "x")}-{v}'
            b = f'S/shots/before/{d}/{st}.png'; a = f'S/shots/after/{d}/{st}.png'
            hb = os.path.exists(os.path.join(root, b)); ha = os.path.exists(os.path.join(root, a))
            if not hb and not ha:
                continue
            have += 1
            ref = '`S/reference/K07-live-stats-empty.jpg`' if st == 'S01-empty' else '–'
            print(f'| {label} | {ref} | {c} | {v.replace("-t", " ")} % | {"`"+b+"`" if hb else "(not captured)"} | {"`"+a+"`" if ha else "(not captured)"} |')
for c in cfgs:
    for v in variants:
        for side in ['before', 'after']:
            if not os.path.isdir(os.path.join(root, f'S/shots/{side}/{c}-{v}')):
                missing.append(f'{side} {c} {v}')
print(f'\n{have} state × configuration rows. Not captured (time): {", ".join(missing) if missing else "none"}.')
