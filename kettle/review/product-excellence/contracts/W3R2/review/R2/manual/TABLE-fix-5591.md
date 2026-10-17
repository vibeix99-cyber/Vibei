#### fix-5591

| case | iterations | pass | fail | exceptions | page errors |
|---|---|---|---|---|---|
| (a) pause | 5 | 5 | 0 | 0 | 0 |
| (b) add 5 | 5 | 5 | 0 | 0 | 0 |
| (c) end | 5 | 5 | 0 | 0 | 0 |
| (d) no hold | 5 | 5 | 0 | 0 | 0 |
| (e) add 5 on a replaced brew | 5 | 5 | 0 | 0 | 0 |

**(a) pause**, criteria met (of 5): precondition_B_behind 5; paused_in_A 5; paused_in_B 5; paused_in_storage 5; same_session_A_B_storage 5; kept_plus5_A_B_storage 5; A_B_storage_agree 5; remaining_gt_planned_minus_2min 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | paused ebce 30m null | paused ebce 30m null | paused ebce 30m null | paused ebce 30m null | 0/-; 0/-; 0/- | - |
| 2 | pass | paused c224 30m null | paused c224 30m null | paused c224 30m null | paused c224 30m null | 0/-; 0/-; 0/- | - |
| 3 | pass | paused 3642 30m null | paused 3642 30m null | paused 3642 30m null | paused 3642 30m null | 0/-; 0/-; 0/- | - |
| 4 | pass | paused 7615 30m null | paused 7615 30m null | paused 7615 30m null | paused 7615 30m null | 0/-; 0/-; 0/- | - |
| 5 | pass | paused 83df 30m null | paused 83df 30m null | paused 83df 30m null | paused 83df 30m null | 0/-; 0/-; 0/- | - |

**(b) add 5**, criteria met (of 5): precondition_B_behind 5; same_session_A_B_storage 5; A_B_storage_agree 5; still_paused_A_B_storage 5; plus5_applied_A_B_storage 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | paused 4b52 30m null | paused 4b52 30m null | paused 4b52 30m null | paused 4b52 30m null | 0/-; 0/-; 0/- | - |
| 2 | pass | paused aa24 30m null | paused aa24 30m null | paused aa24 30m null | paused aa24 30m null | 0/-; 0/-; 0/- | - |
| 3 | pass | paused 0ccb 30m null | paused 0ccb 30m null | paused 0ccb 30m null | paused 0ccb 30m null | 0/-; 0/-; 0/- | - |
| 4 | pass | paused 9447 30m null | paused 9447 30m null | paused 9447 30m null | paused 9447 30m null | 0/-; 0/-; 0/- | - |
| 5 | pass | paused 3264 30m null | paused 3264 30m null | paused 3264 30m null | paused 3264 30m null | 0/-; 0/-; 0/- | - |

**(c) end**, criteria met (of 5): precondition_B_behind 5; brew2_running_A_B_storage 5; A_B_storage_agree 5; brew2_not_extended_or_ended 5; B_shows_focus 5; records_brew1_exactly_one_stored 5; records_brew1_exactly_one_A_memory 5; records_brew1_exactly_one_B_memory 5; no_record_for_brew2 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | running 0af1 [brew 2] 25m 1792262184266 | running 0af1 [brew 2] 25m 1792262184266 | running 0af1 [brew 2] 25m 1792262184266 | running 0af1 [brew 2] 25m 1792262184266 | 1/0; 1/0; 1/0 | - |
| 2 | pass | running 6228 [brew 2] 25m 1792262211016 | running 6228 [brew 2] 25m 1792262211016 | running 6228 [brew 2] 25m 1792262211016 | running 6228 [brew 2] 25m 1792262211016 | 1/0; 1/0; 1/0 | - |
| 3 | pass | running ea2a [brew 2] 25m 1792262233110 | running ea2a [brew 2] 25m 1792262233110 | running ea2a [brew 2] 25m 1792262233110 | running ea2a [brew 2] 25m 1792262233110 | 1/0; 1/0; 1/0 | - |
| 4 | pass | running 4155 [brew 2] 25m 1792262247277 | running 4155 [brew 2] 25m 1792262247277 | running 4155 [brew 2] 25m 1792262247277 | running 4155 [brew 2] 25m 1792262247277 | 1/0; 1/0; 1/0 | - |
| 5 | pass | running b7ba [brew 2] 25m 1792262264379 | running b7ba [brew 2] 25m 1792262264379 | running b7ba [brew 2] 25m 1792262264379 | running b7ba [brew 2] 25m 1792262264379 | 1/0; 1/0; 1/0 | - |

**(d) no hold**, criteria met (of 5): paused_in_A_and_B_after_B_pause 5; plus5_in_A_B_storage 5; still_paused_after_plus5 5; brew1_ended_idle_in_A_B_storage 5; brew1_one_record_everywhere 5; brew2_one_record_everywhere 5; final_idle_A_B_storage_agree 5; exactly_two_records_total 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 2 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 3 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 4 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 5 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |

**(e) add 5 on a replaced brew**, criteria met (of 5): precondition_B_behind 5; brew2_running_A_B_storage 5; A_B_storage_agree 5; brew2_not_extended_or_ended 5; B_shows_focus 5; storage_byte_identical_after_B_click 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | running 712c [brew 2] 25m 1792262426915 | running 712c [brew 2] 25m 1792262426915 | running 712c [brew 2] 25m 1792262426915 | running 712c [brew 2] 25m 1792262426915 | 1/0; 1/0; 1/0 | - |
| 2 | pass | running 931b [brew 2] 25m 1792262454345 | running 931b [brew 2] 25m 1792262454345 | running 931b [brew 2] 25m 1792262454345 | running 931b [brew 2] 25m 1792262454345 | 1/0; 1/0; 1/0 | - |
| 3 | pass | running 810e [brew 2] 25m 1792262479840 | running 810e [brew 2] 25m 1792262479840 | running 810e [brew 2] 25m 1792262479840 | running 810e [brew 2] 25m 1792262479840 | 1/0; 1/0; 1/0 | - |
| 4 | pass | running c64c [brew 2] 25m 1792262500925 | running c64c [brew 2] 25m 1792262500925 | running c64c [brew 2] 25m 1792262500925 | running c64c [brew 2] 25m 1792262500925 | 1/0; 1/0; 1/0 | - |
| 5 | pass | running 1eab [brew 2] 25m 1792262520444 | running 1eab [brew 2] 25m 1792262520444 | running 1eab [brew 2] 25m 1792262520444 | running 1eab [brew 2] 25m 1792262520444 | 1/0; 1/0; 1/0 | - |

