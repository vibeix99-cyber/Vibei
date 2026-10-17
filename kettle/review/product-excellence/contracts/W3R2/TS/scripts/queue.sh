#!/bin/bash
# The gated jobs, one after the other (each its own slot hold). Started in the background by the maker.
# Order: the bound probes (inject-notice-bound.sh, already queued) -> the whole timer file (1 slot, no burners) ->
# the under-load runs (2 slots, 4 burners) -> the whole notice file (2 slots, no burners).
cd /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/TS || exit 9
S=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/TS/scripts
until grep -q "TS freed" logs/inject-notice-bound.log.txt 2>/dev/null; do sleep 5; done
./scripts/gate.sh 1 logs/whole-timer.log.txt $S/underload.sh timer-whole
echo "whole timer done $(date -u +%T)" >> logs/queue.txt
./scripts/gate.sh 2 logs/underload-timer.log.txt $S/underload.sh timer
echo "timer underload done $(date -u +%T)" >> logs/queue.txt
./scripts/gate.sh 2 logs/underload-notice.log.txt $S/underload.sh notice
echo "notice underload done $(date -u +%T)" >> logs/queue.txt
./scripts/gate.sh 2 logs/whole-notice.log.txt $S/underload.sh notice-whole
echo "whole notice done $(date -u +%T)" >> logs/queue.txt
