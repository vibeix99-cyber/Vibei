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
| 1440x900-dark | control | unlock-4s | #/done | True | showcase | no field (control predates the model) | False | 0 | 21621 | [('showcase', 'false', None)] |
| 1440x900-dark | control | unlock-10s | #/done | True | showcase | no field (control predates the model) | False | 0 | 24616 | [('showcase', 'false', None)] |
| 1440x900-dark | trial | unlock-4s | #/done | True | showcase | procedural | False | 1 | 14224 | [('showcase', 'false', None)] |
| 1440x900-dark | trial | unlock-10s | #/done | True | showcase | procedural | False | 1 | 17174 | [('showcase', 'false', None)] |
| 1440x900-light | control | unlock-4s | #/done | True | showcase | no field (control predates the model) | False | 0 | 17864 | [('showcase', 'false', None)] |
| 1440x900-light | control | unlock-10s | #/done | True | showcase | no field (control predates the model) | False | 0 | 27068 | [('showcase', 'true', None)] |
| 1440x900-light | trial | unlock-4s | #/done | True | showcase | procedural | False | 1 | 31731 | [('showcase', 'false', None)] |
| 1440x900-light | trial | unlock-10s | #/done | True | showcase | procedural | False | 1 | 37427 | [('showcase', 'false', None)] |
| 1440x900-night | control | unlock-4s | #/done | True | showcase | no field (control predates the model) | False | 0 | 7969 | [('showcase', 'false', None)] |
| 1440x900-night | control | unlock-10s | #/done | True | showcase | no field (control predates the model) | False | 0 | 10910 | [('showcase', 'true', None)] |
| 1440x900-night | trial | unlock-4s | #/done | True | showcase | procedural | False | 1 | 11300 | [('showcase', 'false', None)] |
| 1440x900-night | trial | unlock-10s | #/done | True | showcase | procedural | False | 1 | 14460 | [('showcase', 'false', None)] |
| 390x844-dark | control | unlock-4s | #/done | True | showcase | no field (control predates the model) | False | 0 | 11936 | [('showcase', 'false', None)] |
| 390x844-dark | control | unlock-10s | #/done | True | showcase | no field (control predates the model) | False | 0 | 21386 | [('showcase', 'true', None)] |
| 390x844-dark | trial | unlock-4s | #/done | True | showcase | procedural | False | 1 | 10397 | [('showcase', 'false', None)] |
| 390x844-dark | trial | unlock-10s | #/done | True | showcase | procedural | False | 1 | 13453 | [('showcase', 'true', None)] |
| 390x844-light | control | unlock-4s | #/done | True | showcase | no field (control predates the model) | False | 0 | 8924 | [('showcase', 'false', None)] |
| 390x844-light | control | unlock-10s | #/done | True | showcase | no field (control predates the model) | False | 0 | 14600 | [('showcase', 'true', None)] |
| 390x844-light | trial | unlock-4s | #/done | True | showcase | procedural | False | 1 | 11380 | [('showcase', 'false', None)] |
| 390x844-light | trial | unlock-10s | #/done | True | showcase | procedural | False | 1 | 18712 | [('showcase', 'true', None)] |
| 390x844-night | control | unlock-4s | #/done | True | showcase | no field (control predates the model) | False | 0 | 10179 | [('showcase', 'false', None)] |
| 390x844-night | control | unlock-10s | #/done | True | showcase | no field (control predates the model) | False | 0 | 13176 | [('showcase', 'false', None)] |
| 390x844-night | trial | unlock-4s | #/done | True | showcase | procedural | False | 1 | 9733 | [('showcase', 'false', None)] |
| 390x844-night | trial | unlock-10s | #/done | True | showcase | procedural | False | 1 | 11591 | [('showcase', 'false', None)] |

## Unlock timing and errors

| cfg | side | doneAtMs | mounted after done | ready after done | errors | console err/warn (SW noise excluded) |
|---|---|---|---|---|---|---|
| 1440x900-dark | control | 2407 | 0 | None | [] | [] |
| 1440x900-dark | trial | 2380 | 0 | None | [] | [] |
| 1440x900-light | control | 2656 | 0 | 14736 | [] | [] |
| 1440x900-light | trial | 1879 | 0 | None | [] | [] |
| 1440x900-night | control | 2392 | 0 | 5072 | [] | [] |
| 1440x900-night | trial | 2373 | 0 | None | [] | [] |
| 390x844-dark | control | 2356 | 0 | 8896 | [] | [] |
| 390x844-dark | trial | 2371 | 0 | 7344 | [] | [] |
| 390x844-light | control | 2372 | 0 | 5840 | [] | [] |
| 390x844-light | trial | 2421 | 0 | 7960 | [] | [] |
| 390x844-night | control | 2349 | 0 | None | [] | [] |
| 390x844-night | trial | 2436 | 0 | 6832 | [] | [] |

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
