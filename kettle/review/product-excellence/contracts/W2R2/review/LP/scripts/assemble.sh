#!/bin/bash
# build RECEIPT-LP.md from the parts + generated tables
LP=/home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LP
SC=/home/user/wt/w3tr-p/kettle/.tmp/LP
R=/tmp/claude-0/lp-scratch/receipt
cd $SC
python3 -I analyze.py $LP/check1 geom > $LP/tables/check1-geometry-full.md
python3 -I analyze.py $LP/check1 hier > $LP/tables/check1-hierarchy-full.md
python3 -I compact.py $LP/check1 > $LP/tables/check1-compact.md
python3 -I glance.py $LP/check1 > $LP/tables/check1-glance.md
python3 -I analyze.py $LP/check1m hier > $LP/tables/check1m-hierarchy.md
python3 -I analyze.py $LP/check1m geom > $LP/tables/check1m-geometry-full.md
python3 -I compact.py $LP/check1m > $LP/tables/check1m-compact.md
python3 -I wider.py $LP/check4 > $LP/tables/check4-wider.md 2>/dev/null
python3 -I analyze.py $LP/check4 geom > $LP/tables/check4-geometry-full.md 2>/dev/null
python3 -I gen_copy_section.py > $R/copy2a.md
OUT=$LP/RECEIPT-LP.md
{
cat $R/00-head.md $R/10-commands.md $R/20-check1.md
echo; echo "### 1b. Control vs P, every pair (settled; arrival is identical)"; echo
cat $LP/tables/check1-compact.md
echo; echo "Milestone day (seed \`atRisk\`, the only day with the honey \`data-highlight\` card; 2 of the 8 configs were run):"; echo
cat $LP/tables/check1m-compact.md
echo; echo "Per-phase detail with fold lines, lowest kettle element and sample hit counts: \`tables/check1-geometry-full.md\`, \`tables/check1m-geometry-full.md\`."
cat $R/25-hier.md
cat $R/26-kettle.md
cat $R/30-check2-head.md
cat $R/copy2a.md
cat $R/35-streak.md
cat $R/40-check3.md
cat $R/50-check4.md
cat $LP/tables/check4-wider.md
cat $R/55-check4-notes.md
cat $R/60-captures.md
cat $R/70-spec-incomplete.md
} > $OUT
wc -c $OUT
