#### control-5560-after

| case | iterations | pass | fail | exceptions | page errors |
|---|---|---|---|---|---|
| (a) pause | 5 | 0 | 5 | 0 | 0 |
| (b) add 5 | 5 | 0 | 5 | 0 | 0 |
| (c) end | 5 | 0 | 5 | 0 | 0 |
| (e) add 5 on a replaced brew | 5 | 0 | 5 | 0 | 0 |
| (f) pause on a replaced brew | 5 | 0 | 5 | 0 | 0 |

**(a) pause**, criteria met (of 5): precondition_B_behind 5; paused_in_A 5; paused_in_B 5; paused_in_storage 5; same_session_A_B_storage 5; kept_plus5_A_B_storage 0; A_B_storage_agree 5; remaining_gt_planned_minus_2min 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | FAIL | paused 16ea 25m null | paused 16ea 25m null | paused 16ea 25m null | paused 16ea 25m null | 0/-; 0/-; 0/- | kept_plus5_A_B_storage |
| 2 | FAIL | paused d977 25m null | paused d977 25m null | paused d977 25m null | paused d977 25m null | 0/-; 0/-; 0/- | kept_plus5_A_B_storage |
| 3 | FAIL | paused 0c8c 25m null | paused 0c8c 25m null | paused 0c8c 25m null | paused 0c8c 25m null | 0/-; 0/-; 0/- | kept_plus5_A_B_storage |
| 4 | FAIL | paused 1e0a 25m null | paused 1e0a 25m null | paused 1e0a 25m null | paused 1e0a 25m null | 0/-; 0/-; 0/- | kept_plus5_A_B_storage |
| 5 | FAIL | paused ac59 25m null | paused ac59 25m null | paused ac59 25m null | paused ac59 25m null | 0/-; 0/-; 0/- | kept_plus5_A_B_storage |

**(b) add 5**, criteria met (of 5): precondition_B_behind 5; same_session_A_B_storage 5; A_B_storage_agree 5; still_paused_A_B_storage 0; plus5_applied_A_B_storage 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | FAIL | running 952f 30m 1792267160616 | running 952f 30m 1792267160616 | running 952f 30m 1792267160616 | running 952f 30m 1792267160616 | 0/-; 0/-; 0/- | still_paused_A_B_storage |
| 2 | FAIL | running 4715 30m 1792267176852 | running 4715 30m 1792267176852 | running 4715 30m 1792267176852 | running 4715 30m 1792267176852 | 0/-; 0/-; 0/- | still_paused_A_B_storage |
| 3 | FAIL | running d345 30m 1792267186319 | running d345 30m 1792267186319 | running d345 30m 1792267186319 | running d345 30m 1792267186319 | 0/-; 0/-; 0/- | still_paused_A_B_storage |
| 4 | FAIL | running 5cfd 30m 1792267198131 | running 5cfd 30m 1792267198131 | running 5cfd 30m 1792267198131 | running 5cfd 30m 1792267198131 | 0/-; 0/-; 0/- | still_paused_A_B_storage |
| 5 | FAIL | running c19c 30m 1792267209669 | running c19c 30m 1792267209669 | running c19c 30m 1792267209669 | running c19c 30m 1792267209669 | 0/-; 0/-; 0/- | still_paused_A_B_storage |

**(c) end**, criteria met (of 5): precondition_B_behind 5; brew2_running_A_B_storage 0; A_B_storage_agree 5; brew2_not_extended_or_ended 5; B_shows_focus 0; records_brew1_exactly_one_stored 5; records_brew1_exactly_one_A_memory 5; records_brew1_exactly_one_B_memory 5; no_record_for_brew2 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, B_shows_focus |
| 2 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, B_shows_focus |
| 3 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, B_shows_focus |
| 4 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, B_shows_focus |
| 5 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, B_shows_focus |

**(e) add 5 on a replaced brew**, criteria met (of 5): precondition_B_behind 5; brew2_running_A_B_storage 0; A_B_storage_agree 5; brew2_not_extended_or_ended 0; B_shows_focus 5; storage_byte_identical_after_B_click 0

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | FAIL | running 49d5 [brew 1] 30m 1792267339943 | running 49d5 [brew 1] 30m 1792267339943 | running 49d5 [brew 1] 30m 1792267339943 | running 49d5 [brew 1] 30m 1792267339943 | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_extended_or_ended, storage_byte_identical_after_B_click |
| 2 | FAIL | running 900e [brew 1] 30m 1792267365275 | running 900e [brew 1] 30m 1792267365275 | running 900e [brew 1] 30m 1792267365275 | running 900e [brew 1] 30m 1792267365275 | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_extended_or_ended, storage_byte_identical_after_B_click |
| 3 | FAIL | running e6e3 [brew 1] 30m 1792267387759 | running e6e3 [brew 1] 30m 1792267387759 | running e6e3 [brew 1] 30m 1792267387759 | running e6e3 [brew 1] 30m 1792267387759 | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_extended_or_ended, storage_byte_identical_after_B_click |
| 4 | FAIL | running c317 [brew 1] 30m 1792267418888 | running c317 [brew 1] 30m 1792267418888 | running c317 [brew 1] 30m 1792267418888 | running c317 [brew 1] 30m 1792267418888 | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_extended_or_ended, storage_byte_identical_after_B_click |
| 5 | FAIL | running e08d [brew 1] 30m 1792267450774 | running e08d [brew 1] 30m 1792267450774 | running e08d [brew 1] 30m 1792267450774 | running e08d [brew 1] 30m 1792267450774 | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_extended_or_ended, storage_byte_identical_after_B_click |

**(f) pause on a replaced brew**, criteria met (of 5): precondition_B_behind 5; brew2_running_A_B_storage 0; A_B_storage_agree 5; brew2_not_extended_or_ended 5; brew2_not_paused 0; B_shows_focus 5; records_brew1_exactly_one_stored 5; records_brew1_exactly_one_A_memory 5; records_brew1_exactly_one_B_memory 5; no_record_for_brew2 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | FAIL | paused 5d55 [brew 1] 25m null | paused 5d55 [brew 1] 25m null | paused 5d55 [brew 1] 25m null | paused 5d55 [brew 1] 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_paused |
| 2 | FAIL | paused 7dcf [brew 1] 25m null | paused 7dcf [brew 1] 25m null | paused 7dcf [brew 1] 25m null | paused 7dcf [brew 1] 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_paused |
| 3 | FAIL | paused 741d [brew 1] 25m null | paused 741d [brew 1] 25m null | paused 741d [brew 1] 25m null | paused 741d [brew 1] 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_paused |
| 4 | FAIL | paused 0101 [brew 1] 25m null | paused 0101 [brew 1] 25m null | paused 0101 [brew 1] 25m null | paused 0101 [brew 1] 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_paused |
| 5 | FAIL | paused cf06 [brew 1] 25m null | paused cf06 [brew 1] 25m null | paused cf06 [brew 1] 25m null | paused cf06 [brew 1] 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_paused |

