#### trial2-5601

| case | iterations | pass | fail | exceptions | page errors |
|---|---|---|---|---|---|
| (a) pause | 5 | 5 | 0 | 0 | 0 |
| (b) add 5 | 5 | 5 | 0 | 0 | 0 |
| (c) end | 5 | 5 | 0 | 0 | 0 |
| (d) no hold | 5 | 5 | 0 | 0 | 0 |
| (f) pause on a replaced brew | 5 | 5 | 0 | 0 | 0 |
| (g) Next brew | 5 | 5 | 0 | 0 | 0 |

**(a) pause**, criteria met (of 5): precondition_B_behind 5; paused_in_A 5; paused_in_B 5; paused_in_storage 5; same_session_A_B_storage 5; kept_plus5_A_B_storage 5; A_B_storage_agree 5; remaining_gt_planned_minus_2min 5; pause_sound_played_in_B_when_applied 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | paused 3a5d 30m null | paused 3a5d 30m null | paused 3a5d 30m null | paused 3a5d 30m null | 0/-; 0/-; 0/- | - |
| 2 | pass | paused 095c 30m null | paused 095c 30m null | paused 095c 30m null | paused 095c 30m null | 0/-; 0/-; 0/- | - |
| 3 | pass | paused 5cd1 30m null | paused 5cd1 30m null | paused 5cd1 30m null | paused 5cd1 30m null | 0/-; 0/-; 0/- | - |
| 4 | pass | paused a031 30m null | paused a031 30m null | paused a031 30m null | paused a031 30m null | 0/-; 0/-; 0/- | - |
| 5 | pass | paused 01ba 30m null | paused 01ba 30m null | paused 01ba 30m null | paused 01ba 30m null | 0/-; 0/-; 0/- | - |

**(b) add 5**, criteria met (of 5): precondition_B_behind 5; same_session_A_B_storage 5; A_B_storage_agree 5; still_paused_A_B_storage 5; plus5_applied_A_B_storage 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | paused a92d 30m null | paused a92d 30m null | paused a92d 30m null | paused a92d 30m null | 0/-; 0/-; 0/- | - |
| 2 | pass | paused c700 30m null | paused c700 30m null | paused c700 30m null | paused c700 30m null | 0/-; 0/-; 0/- | - |
| 3 | pass | paused d385 30m null | paused d385 30m null | paused d385 30m null | paused d385 30m null | 0/-; 0/-; 0/- | - |
| 4 | pass | paused 9b2f 30m null | paused 9b2f 30m null | paused 9b2f 30m null | paused 9b2f 30m null | 0/-; 0/-; 0/- | - |
| 5 | pass | paused 74ef 30m null | paused 74ef 30m null | paused 74ef 30m null | paused 74ef 30m null | 0/-; 0/-; 0/- | - |

**(c) end**, criteria met (of 5): precondition_B_behind 5; brew2_running_A_B_storage 5; A_B_storage_agree 5; brew2_not_extended_or_ended 5; B_shows_focus 5; records_brew1_exactly_one_stored 5; records_brew1_exactly_one_A_memory 5; records_brew1_exactly_one_B_memory 5; no_record_for_brew2 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | running f7ac [brew 2] 25m 1792270639197 | running f7ac [brew 2] 25m 1792270639197 | running f7ac [brew 2] 25m 1792270639197 | running f7ac [brew 2] 25m 1792270639197 | 1/0; 1/0; 1/0 | - |
| 2 | pass | running 10f2 [brew 2] 25m 1792270664576 | running 10f2 [brew 2] 25m 1792270664576 | running 10f2 [brew 2] 25m 1792270664576 | running 10f2 [brew 2] 25m 1792270664576 | 1/0; 1/0; 1/0 | - |
| 3 | pass | running 2869 [brew 2] 25m 1792270685924 | running 2869 [brew 2] 25m 1792270685924 | running 2869 [brew 2] 25m 1792270685924 | running 2869 [brew 2] 25m 1792270685924 | 1/0; 1/0; 1/0 | - |
| 4 | pass | running ca84 [brew 2] 25m 1792270710851 | running ca84 [brew 2] 25m 1792270710851 | running ca84 [brew 2] 25m 1792270710851 | running ca84 [brew 2] 25m 1792270710851 | 1/0; 1/0; 1/0 | - |
| 5 | pass | running 2535 [brew 2] 25m 1792270730924 | running 2535 [brew 2] 25m 1792270730924 | running 2535 [brew 2] 25m 1792270730924 | running 2535 [brew 2] 25m 1792270730924 | 1/0; 1/0; 1/0 | - |

**(d) no hold**, criteria met (of 5): paused_in_A_and_B_after_B_pause 5; plus5_in_A_B_storage 5; still_paused_after_plus5 5; brew1_ended_idle_in_A_B_storage 5; brew1_one_record_everywhere 5; brew2_one_record_everywhere 5; final_idle_A_B_storage_agree 5; exactly_two_records_total 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 2 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 3 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 4 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 5 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |

**(f) pause on a replaced brew**, criteria met (of 5): precondition_B_behind 5; brew2_running_A_B_storage 5; A_B_storage_agree 5; brew2_not_extended_or_ended 5; brew2_not_paused 5; no_pause_or_resume_sound_in_B_when_dropped 5; B_shows_focus 5; records_brew1_exactly_one_stored 5; records_brew1_exactly_one_A_memory 5; records_brew1_exactly_one_B_memory 5; no_record_for_brew2 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | running fe33 [brew 2] 25m 1792270389338 | running fe33 [brew 2] 25m 1792270389338 | running fe33 [brew 2] 25m 1792270389338 | running fe33 [brew 2] 25m 1792270389338 | 1/0; 1/0; 1/0 | - |
| 2 | pass | running 6da6 [brew 2] 25m 1792270415656 | running 6da6 [brew 2] 25m 1792270415656 | running 6da6 [brew 2] 25m 1792270415656 | running 6da6 [brew 2] 25m 1792270415656 | 1/0; 1/0; 1/0 | - |
| 3 | pass | running 9296 [brew 2] 25m 1792270430454 | running 9296 [brew 2] 25m 1792270430454 | running 9296 [brew 2] 25m 1792270430454 | running 9296 [brew 2] 25m 1792270430454 | 1/0; 1/0; 1/0 | - |
| 4 | pass | running bd86 [brew 2] 25m 1792270449150 | running bd86 [brew 2] 25m 1792270449150 | running bd86 [brew 2] 25m 1792270449150 | running bd86 [brew 2] 25m 1792270449150 | 1/0; 1/0; 1/0 | - |
| 5 | pass | running c00f [brew 2] 25m 1792270472549 | running c00f [brew 2] 25m 1792270472549 | running c00f [brew 2] 25m 1792270472549 | running c00f [brew 2] 25m 1792270472549 | 1/0; 1/0; 1/0 | - |

**(g) Next brew**, criteria met (of 5): precondition_B_behind 5; B_joined_A_brew_after_its_click 5; A_storage_byte_identical_after_B_click 5; no_second_brew_started_by_B 5; A_B_storage_agree_after_release 5; saved_of_focus_toast_shown_in_B 5; B_went_home 5; one_record_for_joined_brew_everywhere 5; idle_in_A_B_storage_at_the_end 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 0/1; 0/1; 0/1 | - |
| 2 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 0/1; 0/1; 0/1 | - |
| 3 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 0/1; 0/1; 0/1 | - |
| 4 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 0/1; 0/1; 0/1 | - |
| 5 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 0/1; 0/1; 0/1 | - |

