## Nook (4 s after ready)

| cfg | side | tier | chai kind (field) | root.userData.model | .glb requests | errors (page/console err) | files |
|---|---|---|---|---|---|---|---|
| 1440x900-dark | control | low | no field (control predates the model) | False | 0 | 0 / 0 | nook-3d.png |
| 1440x900-dark | trial | low | model | True | 1 | 0 / 0 | nook-3d.png |
| 1440x900-light | control | low | no field (control predates the model) | False | 0 | 0 / 0 | nook-3d.png |
| 1440x900-light | trial | low | model | True | 1 | 0 / 0 | nook-3d.png |
| 1440x900-night | control | low | no field (control predates the model) | False | 0 | 0 / 0 | nook-3d.png |
| 1440x900-night | trial | low | model | True | 1 | 0 / 0 | nook-3d.png |
| 390x844-dark | control | low | no field (control predates the model) | False | 0 | 0 / 0 | nook-3d.png |
| 390x844-dark | trial | low | model | True | 1 | 0 / 0 | nook-3d.png |
| 390x844-light | control | low | no field (control predates the model) | False | 0 | 0 / 0 | nook-3d.png |
| 390x844-light | trial | low | model | True | 1 | 0 / 0 | nook-3d.png |
| 390x844-night | control | low | no field (control predates the model) | False | 0 | 0 / 0 | nook-3d.png |
| 390x844-night | trial | low | model | True | 1 | 0 / 0 | nook-3d.png |

## Summary unlock card (after finish())

| cfg | side | capture | hash | engine in unlock section | engine mode | chai kind (field) | root.userData.model | .glb requests so far | actual shot start ms | host (mode/ready/static) |
|---|---|---|---|---|---|---|---|---|---|---|
| 1440x900-dark | control | unlock-4s | #/done | True | showcase | no field (control predates the model) | False | 0 | 11419 | [('showcase', 'false', None)] |
| 1440x900-dark | control | unlock-10s | #/done | True | showcase | no field (control predates the model) | False | 0 | 14667 | [('showcase', 'false', None)] |
| 1440x900-dark | trial | unlock-4s | #/done | True | showcase | procedural | False | 1 | 12330 | [('showcase', 'false', None)] |
| 1440x900-dark | trial | unlock-10s | #/done | True | showcase | procedural | False | 1 | 15300 | [('showcase', 'true', None)] |
| 1440x900-light | control | unlock-4s | #/done | True | showcase | no field (control predates the model) | False | 0 | 7808 | [('showcase', 'false', None)] |
| 1440x900-light | control | unlock-10s | #/done | True | showcase | no field (control predates the model) | False | 0 | 12485 | [('showcase', 'true', None)] |
| 1440x900-light | trial | unlock-4s | #/done | True | showcase | procedural | False | 1 | 12152 | [('showcase', 'false', None)] |
| 1440x900-light | trial | unlock-10s | #/done | True | showcase | procedural | False | 1 | 15298 | [('showcase', 'true', None)] |
| 1440x900-night | control | unlock-4s | #/done | True | showcase | no field (control predates the model) | False | 0 | 10008 | [('showcase', 'false', None)] |
| 1440x900-night | control | unlock-10s | #/done | True | showcase | no field (control predates the model) | False | 0 | 13492 | [('showcase', 'false', None)] |
| 1440x900-night | trial | unlock-4s | #/done | True | showcase | procedural | False | 1 | 11878 | [('showcase', 'false', None)] |
| 1440x900-night | trial | unlock-10s | #/done | True | showcase | procedural | False | 1 | 15079 | [('showcase', 'false', None)] |
| 390x844-dark | control | unlock-4s | #/done | True | showcase | no field (control predates the model) | False | 0 | 7173 | [('showcase', 'false', None)] |
| 390x844-dark | control | unlock-10s | #/done | True | showcase | no field (control predates the model) | False | 0 | 10206 | [('showcase', 'true', None)] |
| 390x844-dark | trial | unlock-4s | #/done | True | showcase | procedural | False | 1 | 7028 | [('showcase', 'false', None)] |
| 390x844-dark | trial | unlock-10s | #/done | True | showcase | procedural | False | 1 | 10278 | [('showcase', 'true', None)] |
| 390x844-light | control | unlock-4s | #/done | True | showcase | no field (control predates the model) | False | 0 | 7391 | [('showcase', 'false', None)] |
| 390x844-light | control | unlock-10s | #/done | True | showcase | no field (control predates the model) | False | 0 | 10102 | [('showcase', 'true', None)] |
| 390x844-light | trial | unlock-4s | #/done | True | showcase | procedural | False | 1 | 7141 | [('showcase', 'false', None)] |
| 390x844-light | trial | unlock-10s | #/done | True | showcase | procedural | False | 1 | 10217 | [('showcase', 'true', None)] |
| 390x844-night | control | unlock-4s | #/done | True | showcase | no field (control predates the model) | False | 0 | 7095 | [('showcase', 'false', None)] |
| 390x844-night | control | unlock-10s | #/done | True | showcase | no field (control predates the model) | False | 0 | 10080 | [('showcase', 'false', None)] |
| 390x844-night | trial | unlock-4s | #/done | True | showcase | procedural | False | 1 | 7093 | [('showcase', 'false', None)] |
| 390x844-night | trial | unlock-10s | #/done | True | showcase | procedural | False | 1 | 10173 | [('showcase', 'true', None)] |

## Unlock timing and errors

| cfg | side | doneAtMs | mounted after done | ready after done | errors | console err/warn (SW noise excluded) |
|---|---|---|---|---|---|---|
| 1440x900-dark | control | 2377 | 0 | None | [] | [] |
| 1440x900-dark | trial | 2429 | 0 | 9312 | [] | [] |
| 1440x900-light | control | 2364 | 0 | 4848 | [] | [] |
| 1440x900-light | trial | 2332 | 0 | 9216 | [] | [] |
| 1440x900-night | control | 2297 | 0 | None | [] | [] |
| 1440x900-night | trial | 2404 | 0 | None | [] | [] |
| 390x844-dark | control | 2329 | 0 | 4429 | [] | [] |
| 390x844-dark | trial | 2328 | 0 | 4320 | [] | [] |
| 390x844-light | control | 2313 | 0 | 4640 | [] | [] |
| 390x844-light | trial | 2351 | 0 | 4384 | [] | [] |
| 390x844-night | control | 2370 | 0 | None | [] | [] |
| 390x844-night | trial | 2345 | 0 | 4320 | [] | [] |

## Text differences (control vs trial), recorded, not attributed

- 1440x900-dark unlock-4s unlockText: identical text
- 1440x900-dark unlock-4s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 1440x900-dark unlock-10s unlockText: identical text
- 1440x900-dark unlock-10s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 1440x900-dark nook mainText: identical text
- 1440x900-light unlock-4s unlockText: identical text
- 1440x900-light unlock-4s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 1440x900-light unlock-10s unlockText: identical text
- 1440x900-light unlock-10s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 1440x900-light nook mainText: identical text
- 1440x900-night unlock-4s unlockText: identical text
- 1440x900-night unlock-4s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 1440x900-night unlock-10s unlockText: identical text
- 1440x900-night unlock-10s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 1440x900-night nook mainText: identical text
- 390x844-dark unlock-4s unlockText: identical text
- 390x844-dark unlock-4s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 390x844-dark unlock-10s unlockText: identical text
- 390x844-dark unlock-10s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 390x844-dark nook mainText: identical text
- 390x844-light unlock-4s unlockText: identical text
- 390x844-light unlock-4s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 390x844-light unlock-10s unlockText: identical text
- 390x844-light unlock-10s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 390x844-light nook mainText: identical text
- 390x844-night unlock-4s unlockText: identical text
- 390x844-night unlock-4s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 390x844-night unlock-10s unlockText: identical text
- 390x844-night unlock-10s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 390x844-night nook mainText: identical text
