#### g-5560-control

| case | iterations | pass | fail | exceptions | page errors |
|---|---|---|---|---|---|
| (g) Next brew | 5 | 0 | 5 | 0 | 0 |

**(g) Next brew**, criteria met (of 5): precondition_B_behind 5; B_joined_A_brew_after_its_click 0; A_storage_byte_identical_after_B_click 0; no_second_brew_started_by_B 0; A_B_storage_agree_after_release 5; saved_of_focus_toast_shown_in_B 5; B_went_home 5; one_record_for_joined_brew_everywhere 0; idle_in_A_B_storage_at_the_end 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 0/0; 0/0; 0/0 | B_joined_A_brew_after_its_click, A_storage_byte_identical_after_B_click, no_second_brew_started_by_B, one_record_for_joined_brew_everywhere |
| 2 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 0/0; 0/0; 0/0 | B_joined_A_brew_after_its_click, A_storage_byte_identical_after_B_click, no_second_brew_started_by_B, one_record_for_joined_brew_everywhere |
| 3 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 0/0; 0/0; 0/0 | B_joined_A_brew_after_its_click, A_storage_byte_identical_after_B_click, no_second_brew_started_by_B, one_record_for_joined_brew_everywhere |
| 4 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 0/0; 0/0; 0/0 | B_joined_A_brew_after_its_click, A_storage_byte_identical_after_B_click, no_second_brew_started_by_B, one_record_for_joined_brew_everywhere |
| 5 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 0/0; 0/0; 0/0 | B_joined_A_brew_after_its_click, A_storage_byte_identical_after_B_click, no_second_brew_started_by_B, one_record_for_joined_brew_everywhere |

