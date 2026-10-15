#!/bin/bash
# N2 regression chain. Every playwright run goes through the slot gate.
cd /home/user/wt/w7n/kettle
GATE="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane N2"
O=/tmp/n2/runs; mkdir -p $O
stamp() { echo "$(date -u +%T) $*" >> $O/chain.log; }
stamp "chain start"
# A. the new spec, 3x on the base (:5560) and 3x on the branch dev server (:5565); 2 workers
for P in 5560 5565; do
  stamp "A spec x3 on :$P"
  KETTLE_PORT=$P $GATE --n 2 -- npx playwright test tests/w3-history-focus-scroll.spec.ts --project=chromium --workers=2 --repeat-each=3 --reporter=list --output=/tmp/n2/pw/A$P > $O/spec-$P.log 2>&1
  stamp "A :$P exit $?"
done
# B. :292 at 1440 light @200 reduced x6 under load: 2 workers + 4 CPU burners (own PIDs, killed by PID after)
stamp "B stress start"
cat > /tmp/n2/stress-inner.sh <<'EOS'
#!/bin/bash
cd /home/user/wt/w7n/kettle
PIDS=""
for i in 1 2 3 4; do ( while :; do :; done ) & PIDS="$PIDS $!"; done
echo "burners: $PIDS start $(date -u +%T) load $(cut -d' ' -f1 /proc/loadavg)" > /tmp/n2/runs/stress-burners.log.txt
KETTLE_PORT=5565 npx playwright test tests/notice-strip.spec.ts --project=chromium --workers=2 --repeat-each=6 --reporter=list --output=/tmp/n2/pw/B -g '1440×900 light 200 % reduced motion' > /tmp/n2/runs/notice-292-stress.log 2>&1
echo "playwright exit $? end $(date -u +%T) load $(cut -d' ' -f1 /proc/loadavg)" >> /tmp/n2/runs/stress-burners.log.txt
kill $PIDS 2>/dev/null; wait 2>/dev/null
echo "burners stopped $(date -u +%T)" >> /tmp/n2/runs/stress-burners.log.txt
EOS
chmod +x /tmp/n2/stress-inner.sh
$GATE --n 2 -- bash /tmp/n2/stress-inner.sh > $O/stress-gate.log 2>&1
stamp "B done"
# C. the other specs that touch Stats / History, once each, and the whole notice-strip
for S in w3-stats w3-notices; do
  stamp "C $S"
  KETTLE_PORT=5565 $GATE --n 2 -- npx playwright test tests/$S.spec.ts --project=chromium --workers=2 --reporter=list --output=/tmp/n2/pw/C$S > $O/$S.log 2>&1
  stamp "C $S exit $?"
done
stamp "chain done"
