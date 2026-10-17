#### control-5560

| case | iterations | pass | fail | exceptions | page errors |
|---|---|---|---|---|---|
| (a) pause | 5 | 0 | 5 | 0 | 0 |
| (b) add 5 | 5 | 0 | 5 | 0 | 0 |
| (c) end | 5 | 0 | 5 | 0 | 0 |
| (d) no hold | 5 | 5 | 0 | 0 | 0 |
| (e) add 5 on a replaced brew | 5 | 0 | 5 | 0 | 0 |

**(a) pause**, criteria met (of 5): precondition_B_behind 5; paused_in_A 5; paused_in_B 5; paused_in_storage 5; same_session_A_B_storage 5; kept_plus5_A_B_storage 0; A_B_storage_agree 5; remaining_gt_planned_minus_2min 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | FAIL | paused d028 25m null | paused d028 25m null | paused d028 25m null | paused d028 25m null | 0/-; 0/-; 0/- | kept_plus5_A_B_storage |
| 2 | FAIL | paused 0282 25m null | paused 0282 25m null | paused 0282 25m null | paused 0282 25m null | 0/-; 0/-; 0/- | kept_plus5_A_B_storage |
| 3 | FAIL | paused 5e60 25m null | paused 5e60 25m null | paused 5e60 25m null | paused 5e60 25m null | 0/-; 0/-; 0/- | kept_plus5_A_B_storage |
| 4 | FAIL | paused ab43 25m null | paused ab43 25m null | paused ab43 25m null | paused ab43 25m null | 0/-; 0/-; 0/- | kept_plus5_A_B_storage |
| 5 | FAIL | paused aa79 25m null | paused aa79 25m null | paused aa79 25m null | paused aa79 25m null | 0/-; 0/-; 0/- | kept_plus5_A_B_storage |

**(b) add 5**, criteria met (of 5): precondition_B_behind 5; same_session_A_B_storage 5; A_B_storage_agree 5; still_paused_A_B_storage 0; plus5_applied_A_B_storage 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | FAIL | running 2e46 30m 1792263715192 | running 2e46 30m 1792263715192 | running 2e46 30m 1792263715192 | running 2e46 30m 1792263715192 | 0/-; 0/-; 0/- | still_paused_A_B_storage |
| 2 | FAIL | running e377 30m 1792263729734 | running e377 30m 1792263729734 | running e377 30m 1792263729734 | running e377 30m 1792263729734 | 0/-; 0/-; 0/- | still_paused_A_B_storage |
| 3 | FAIL | running 3d1b 30m 1792263737871 | running 3d1b 30m 1792263737871 | running 3d1b 30m 1792263737871 | running 3d1b 30m 1792263737871 | 0/-; 0/-; 0/- | still_paused_A_B_storage |
| 4 | FAIL | running 2895 30m 1792263748087 | running 2895 30m 1792263748087 | running 2895 30m 1792263748087 | running 2895 30m 1792263748087 | 0/-; 0/-; 0/- | still_paused_A_B_storage |
| 5 | FAIL | running c66f 30m 1792263754943 | running c66f 30m 1792263754943 | running c66f 30m 1792263754943 | running c66f 30m 1792263754943 | 0/-; 0/-; 0/- | still_paused_A_B_storage |

**(c) end**, criteria met (of 5): precondition_B_behind 5; brew2_running_A_B_storage 0; A_B_storage_agree 5; brew2_not_extended_or_ended 5; B_shows_focus 0; records_brew1_exactly_one_stored 5; records_brew1_exactly_one_A_memory 5; records_brew1_exactly_one_B_memory 5; no_record_for_brew2 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, B_shows_focus |
| 2 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, B_shows_focus |
| 3 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, B_shows_focus |
| 4 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, B_shows_focus |
| 5 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, B_shows_focus |

**(d) no hold**, criteria met (of 5): paused_in_A_and_B_after_B_pause 5; plus5_in_A_B_storage 5; still_paused_after_plus5 5; brew1_ended_idle_in_A_B_storage 5; brew1_one_record_everywhere 5; brew2_one_record_everywhere 5; final_idle_A_B_storage_agree 5; exactly_two_records_total 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 2 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 3 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 4 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 5 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |

**(e) add 5 on a replaced brew**, criteria met (of 5): precondition_B_behind 5; brew2_running_A_B_storage 0; A_B_storage_agree 5; brew2_not_extended_or_ended 0; B_shows_focus 5; storage_byte_identical_after_B_click 0

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | FAIL | running 61ea [brew 1] 30m 1792263973329 | running 61ea [brew 1] 30m 1792263973329 | running 61ea [brew 1] 30m 1792263973329 | running 61ea [brew 1] 30m 1792263973329 | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_extended_or_ended, storage_byte_identical_after_B_click |
| 2 | FAIL | running 4860 [brew 1] 30m 1792264002925 | running 4860 [brew 1] 30m 1792264002925 | running 4860 [brew 1] 30m 1792264002925 | running 4860 [brew 1] 30m 1792264002925 | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_extended_or_ended, storage_byte_identical_after_B_click |
| 3 | FAIL | running eb6e [brew 1] 30m 1792264026411 | running eb6e [brew 1] 30m 1792264026411 | running eb6e [brew 1] 30m 1792264026411 | running eb6e [brew 1] 30m 1792264026411 | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_extended_or_ended, storage_byte_identical_after_B_click |
| 4 | FAIL | running 8378 [brew 1] 30m 1792264050712 | running 8378 [brew 1] 30m 1792264050712 | running 8378 [brew 1] 30m 1792264050712 | running 8378 [brew 1] 30m 1792264050712 | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_extended_or_ended, storage_byte_identical_after_B_click |
| 5 | FAIL | running aa53 [brew 1] 30m 1792264073858 | running aa53 [brew 1] 30m 1792264073858 | running aa53 [brew 1] 30m 1792264073858 | running aa53 [brew 1] 30m 1792264073858 | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_extended_or_ended, storage_byte_identical_after_B_click |

