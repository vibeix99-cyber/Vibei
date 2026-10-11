#!/bin/bash
# LEAD r7: M1-adjacent byte checks for a candidate revision.  diffcheck.sh <git-dir> <rev>
# Compares against 51521cf (round-6 combined; contains M1's approved 3f00b57) and INT 0d58c5e.
G=$1; R=$2; B=51521cf; M1=3f00b57; INT=0d58c5e
cd "$G" || exit 2
echo "== candidate $R = $(git rev-parse $R) tree $(git rev-parse $R^{tree}) src $(git rev-parse $R:kettle/src)"
echo "== M1 frozen paths vs $B (must be empty) =="
git diff --stat $B $R -- kettle/src/lib/storage.ts kettle/src/timer kettle/src/progress
echo "   blobs: storage.ts $(git rev-parse $R:kettle/src/lib/storage.ts | cut -c1-12) (base $(git rev-parse $B:kettle/src/lib/storage.ts | cut -c1-12), M1 $(git rev-parse $M1:kettle/src/lib/storage.ts | cut -c1-12))  timer $(git rev-parse $R:kettle/src/timer | cut -c1-12) (base $(git rev-parse $B:kettle/src/timer | cut -c1-12))  progress $(git rev-parse $R:kettle/src/progress | cut -c1-12) (base $(git rev-parse $B:kettle/src/progress | cut -c1-12))"
echo "== integrity.spec.ts: prefix before the placement block byte-identical to $B and $M1 =="
H='// I03 — the storage-full warning'
for X in $B $M1 $R; do
  f=$(mktemp); git show $X:kettle/tests/integrity.spec.ts > $f
  n=$(grep -n "^$H" $f | head -1 | cut -d: -f1)
  pre=$(head -n $((n-2)) $f | sha256sum | cut -c1-16)
  tot=$(wc -l < $f)
  echo "   $X: header at line $n of $tot; prefix(1..$((n-2))) sha $pre; header-count $(grep -c "^$H" $f)"
  rm -f $f
done
echo "   lines after the block in $B (block is last if the next top-level '// ----' header is absent):"
git show $B:kettle/tests/integrity.spec.ts | awk -v h="$H" 'index($0,h)==1{f=1} f&&/^\/\/ -{20,}/{c++} END{print "   dash-rules from header to EOF: " c}'
echo "== diff hunks in integrity.spec.ts $B..$R =="
git diff -U0 $B $R -- kettle/tests/integrity.spec.ts | grep '^@@'
echo "== flow.ts: M1 detection/emission kept =="
git show $R:kettle/src/app/flow.ts | grep -nE "onStorageWriteError\(|function warnSaveFailed|raiseSaveWarning|protectedUnderToasts|TOAST_ZONE_PX|toastLiftBottom|SAVE_TOAST_ID|recheckSaveWarning|watchSaveWarning"
echo "   leftovers anywhere in src (must be none): $(git grep -nE 'protectedUnderToasts|TOAST_ZONE_PX|warningWouldBlock|recheckSaveWarning|watchSaveWarning|kettle:save-failed' $R -- kettle/src | wc -l)"
git grep -nE 'protectedUnderToasts|TOAST_ZONE_PX|warningWouldBlock|recheckSaveWarning|watchSaveWarning|kettle:save-failed' $R -- kettle/src kettle/tests | head
echo "== flow.ts hunks vs $B =="
git diff -U0 $B $R -- kettle/src/app/flow.ts | grep '^@@'
echo "== all changed files vs $B (src, tests) =="
git diff --stat $B $R -- kettle/src kettle/tests | tail -30
echo "== vs INT $INT (src) =="
git diff --stat $INT $R -- kettle/src | tail -3
