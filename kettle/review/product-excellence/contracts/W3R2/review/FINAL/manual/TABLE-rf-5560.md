#### rf-5560

| case | iterations | pass | fail | exceptions | page errors |
|---|---|---|---|---|---|
| (a) pause | 3 | 3 | 0 | 0 | 0 |
| (b) add 5 | 3 | 3 | 0 | 0 | 0 |
| (c) end | 3 | 3 | 0 | 0 | 0 |
| (d) no hold | 3 | 3 | 0 | 0 | 0 |
| (e) add 5 on a replaced brew | 3 | 3 | 0 | 0 | 0 |
| (f) pause on a replaced brew | 3 | 3 | 0 | 0 | 0 |
| (g) Next brew | 3 | 3 | 0 | 0 | 0 |

**(a) pause**, criteria met (of 3): precondition_B_behind 3; paused_in_A 3; paused_in_B 3; paused_in_storage 3; same_session_A_B_storage 3; kept_plus5_A_B_storage 3; A_B_storage_agree 3; remaining_gt_planned_minus_2min 3; pause_sound_played_in_B_when_applied 3

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | paused 3752 30m null | paused 3752 30m null | paused 3752 30m null | paused 3752 30m null | 0/-; 0/-; 0/- | - |
| 2 | pass | paused 9308 30m null | paused 9308 30m null | paused 9308 30m null | paused 9308 30m null | 0/-; 0/-; 0/- | - |
| 3 | pass | paused 833c 30m null | paused 833c 30m null | paused 833c 30m null | paused 833c 30m null | 0/-; 0/-; 0/- | - |

**(b) add 5**, criteria met (of 3): precondition_B_behind 3; same_session_A_B_storage 3; A_B_storage_agree 3; still_paused_A_B_storage 3; plus5_applied_A_B_storage 3

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | paused 2083 30m null | paused 2083 30m null | paused 2083 30m null | paused 2083 30m null | 0/-; 0/-; 0/- | - |
| 2 | pass | paused 9890 30m null | paused 9890 30m null | paused 9890 30m null | paused 9890 30m null | 0/-; 0/-; 0/- | - |
| 3 | pass | paused 57e9 30m null | paused 57e9 30m null | paused 57e9 30m null | paused 57e9 30m null | 0/-; 0/-; 0/- | - |

**(c) end**, criteria met (of 3): precondition_B_behind 3; brew2_running_A_B_storage 3; A_B_storage_agree 3; brew2_not_extended_or_ended 3; B_shows_focus 3; records_brew1_exactly_one_stored 3; records_brew1_exactly_one_A_memory 3; records_brew1_exactly_one_B_memory 3; no_record_for_brew2 3

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | running 21cc [brew 2] 25m 1792276605967 | running 21cc [brew 2] 25m 1792276605967 | running 21cc [brew 2] 25m 1792276605967 | running 21cc [brew 2] 25m 1792276605967 | 1/0; 1/0; 1/0 | - |
| 2 | pass | running a40a [brew 2] 25m 1792276627038 | running a40a [brew 2] 25m 1792276627038 | running a40a [brew 2] 25m 1792276627038 | running a40a [brew 2] 25m 1792276627038 | 1/0; 1/0; 1/0 | - |
| 3 | pass | running 521e [brew 2] 25m 1792276643976 | running 521e [brew 2] 25m 1792276643976 | running 521e [brew 2] 25m 1792276643976 | running 521e [brew 2] 25m 1792276643976 | 1/0; 1/0; 1/0 | - |

**(d) no hold**, criteria met (of 3): paused_in_A_and_B_after_B_pause 3; plus5_in_A_B_storage 3; still_paused_after_plus5 3; brew1_ended_idle_in_A_B_storage 3; brew1_one_record_everywhere 3; brew2_one_record_everywhere 3; final_idle_A_B_storage_agree 3; exactly_two_records_total 3

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 2 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 3 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |

**(e) add 5 on a replaced brew**, criteria met (of 3): precondition_B_behind 3; brew2_running_A_B_storage 3; A_B_storage_agree 3; brew2_not_extended_or_ended 3; B_shows_focus 3; storage_byte_identical_after_B_click 3; no_plus5_note_ever_in_B 3

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | running 6cd5 [brew 2] 25m 1792276429058 | running 6cd5 [brew 2] 25m 1792276429058 | running 6cd5 [brew 2] 25m 1792276429058 | running 6cd5 [brew 2] 25m 1792276429058 | 1/0; 1/0; 1/0 | - |
| 2 | pass | running 061b [brew 2] 25m 1792276452911 | running 061b [brew 2] 25m 1792276452911 | running 061b [brew 2] 25m 1792276452911 | running 061b [brew 2] 25m 1792276452911 | 1/0; 1/0; 1/0 | - |
| 3 | pass | running 6321 [brew 2] 25m 1792276473737 | running 6321 [brew 2] 25m 1792276473737 | running 6321 [brew 2] 25m 1792276473737 | running 6321 [brew 2] 25m 1792276473737 | 1/0; 1/0; 1/0 | - |

**(f) pause on a replaced brew**, criteria met (of 3): precondition_B_behind 3; brew2_running_A_B_storage 3; A_B_storage_agree 3; brew2_not_extended_or_ended 3; brew2_not_paused 3; no_pause_or_resume_sound_in_B_when_dropped 3; B_shows_focus 3; records_brew1_exactly_one_stored 3; records_brew1_exactly_one_A_memory 3; records_brew1_exactly_one_B_memory 3; no_record_for_brew2 3

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | running 8eb6 [brew 2] 25m 1792276487966 | running 8eb6 [brew 2] 25m 1792276487966 | running 8eb6 [brew 2] 25m 1792276487966 | running 8eb6 [brew 2] 25m 1792276487966 | 1/0; 1/0; 1/0 | - |
| 2 | pass | running 3bfc [brew 2] 25m 1792276508551 | running 3bfc [brew 2] 25m 1792276508551 | running 3bfc [brew 2] 25m 1792276508551 | running 3bfc [brew 2] 25m 1792276508551 | 1/0; 1/0; 1/0 | - |
| 3 | pass | running de0a [brew 2] 25m 1792276524889 | running de0a [brew 2] 25m 1792276524889 | running de0a [brew 2] 25m 1792276524889 | running de0a [brew 2] 25m 1792276524889 | 1/0; 1/0; 1/0 | - |

**(g) Next brew**, criteria met (of 3): precondition_B_behind 3; B_joined_A_brew_after_its_click 3; A_storage_byte_identical_after_B_click 3; no_second_brew_started_by_B 3; A_B_storage_agree_after_release 3; saved_of_focus_toast_shown_in_B 3; B_went_home 3; one_record_for_joined_brew_everywhere 3; idle_in_A_B_storage_at_the_end 3

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 0/1; 0/1; 0/1 | - |
| 2 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 0/1; 0/1; 0/1 | - |
| 3 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 0/1; 0/1; 0/1 | - |

