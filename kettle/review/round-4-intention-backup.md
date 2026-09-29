# Round 4 — Intention (f8079ee) and Backup (acfd3ec): independent QA / UX review

Reviewer: critic (independent). Branch `claude/wizardly-galileo-uy89d9`, HEAD `acfd3ec`.
Build under test: `vite build` of the clean `acfd3ec` tree at 08:52 UTC, served by `vite preview` on :5195.
Scripts, logs and screenshots: `kettle/.tmp/critic-r4b/` (gitignored). Screenshots are in `.tmp/critic-r4b/shots/`.

Note on the tree: from 08:55 UTC on, other tracked files changed in the working tree (App.tsx,
FocusScreen.tsx, History.tsx, tokens.css, ListRow.module.css and others). I did not make those changes and did not
touch them. My build and my `tsc` and baseline `vitest` runs happened before those changes, so everything below
describes `acfd3ec`.

## Baseline

| Check | Result |
|---|---|
| `npx tsc --noEmit -p .` | clean |
| `npx vitest run` | 23 files, 243 tests pass |
| Implementer's e2e specs (`intention: optional start…`, `backup: export, re-import…`) against :5195 | 2/2 pass |
| My own unit probes (`.tmp/critic-r4b/probe.test.ts`, separate config) | 10 scenarios, output below |
| axe (wcag2a/aa/21aa) on the Home composer, the finish card, and the finish card with Done selected, light and dark | no violations |

## Verdict against the requirements

**Intention.** Mostly meets the bar.
- Starting is unchanged. Enter on an empty field starts a brew in about 0.2 s, and there is no extra step.
- The finish card choice is stored, survives a reload, and reaches other tabs.
- Today's "Carried from your last brew · Mark done" works, including after a brew ended early.

The remaining problems are layout and UX gaps, not logic errors. The worst one is older than these commits: a long
word or URL in the intention breaks the finish card and the Focus screen on phones.

**Wording.** "What are you brewing?" meets "What are you focusing on?". It is in the app's voice, the placeholder
"e.g. Chapter 3 notes" makes clear it means a task, and the screen reader label adds "(optional)". One small risk:
once the field holds text, the placeholder is gone, and the heading alone could be read as "which tea?". I would not
change it.

**Backup.** The data logic is solid:
- The round trip is exact.
- Adding is the default when this device has progress.
- A file that is already here adds nothing.
- Cancel, Esc and a backdrop tap change nothing.
- Undo restores progress and settings deep-equal.
- 15 kinds of bad file give a friendly error and change nothing.

The gaps:
- The sheet does not fit small phones: labels are cut off at 320 px, and the loss warning is hidden in landscape.
- Undo can erase changes made after the import.
- A few copy and preview details are inaccurate.

No P0 found.

---

## P1: real user-facing defects

### P1-1. A long unbroken intention breaks the finish card and the Focus screen on phones (older bug, not fixed)
The field allows 80 characters. Nothing in the Done, Focus, Home or Stats CSS sets `overflow-wrap` or `word-break`,
so a URL or a long word widens its container.
- **Finish card at 390×844 and 320×568.** The card grows to about 380–400 px wide. The title, the Today tile and the
  Continue button are cut off on the right. At 320 px the Carry forward chip is partly off-screen (right edge at
  x=330). Screenshots: `shots/S-390x844-newbie-w.png`, `shots/L-320-light-url.png`.
- **Focus screen at 390×844.** Content reaches x=576. The timer ring is pushed right and cut off, and the End button
  is off-screen. A 63-character hyphenated word is enough to trigger this; a 35-character word is not. At 1440×900
  the intention is shortened with "…", but the tag chip is cut off at the right edge. Screenshots:
  `shots/F-390-63.png`, `shots/F-1440-81.png`, `shots/M-focus-url-320.png`.
- History at 320 px shortens the text with "…" and is fine.

The same `.intent` span was there before f8079ee, so this is not a regression. It is still the intention feature's
main surface, and the brief asks for 80-character intentions at 320 px.

Repro: `/?debug&seed=newbie&nookq=off#/`, 390×844. Type
`https://docs.example.com/projects/kettle/chapter-three/literature-review-final-v2` and put the kettle on. Focus is
already broken. Then run `__kettle.finish()`: the finish card is cut off on the right.

### P1-2. The import sheet does not fit small phones: choice labels cut off at 320 px, loss warning hidden in landscape
- **320×568.** Each segment is 121 px wide. The labels overflow and are clipped: "Add to what's her…" and
  "Replace what's he…" (text 118/123 px in 113 px boxes). This is the one decision the whole flow is built around.
  Screenshot: `shots/Q-320-light.png`.
- **844×390 and 667×375 (landscape phones).** After you choose "Replace what's here", the red line "Your 52 brews and
  settings on this device will be swapped for the backup…" sits under the sheet footer. At 844×390 it starts at y=301
  and the footer at y=304. It only shows if you scroll the sheet body (scrollHeight 288, clientHeight 219). You see
  the title and the red Replace button, but not the loss text the commit calls the safeguard. Screenshot:
  `shots/Q-land-dark.png`.
- The sheet is fine at 390×844, 820×1180 and 1440×900 in light and dark. The warning text has 6.3:1 contrast in light
  and 7.9:1 in dark.

Repro: seed veteran, open Settings, choose "Import a backup" and pick any other device's backup. Choose "Replace
what's here". Look at 320×568, then at 844×390.

---

## P2: minor defects and gaps

### Backup
1. **Undo replays a stale snapshot, so later changes are erased silently in every tab.** `undoLastImport()` loads the
   in-memory copy from before the import, under a new data generation (epoch), and other tabs adopt it. Anything
   written between the import and Undo is lost: a History rename or delete, a Done mark, or a brew recorded by
   another tab.
   - Confirmed in a unit probe: a brew recorded after the import is gone after Undo.
   - Confirmed in the browser with two tabs. Tab B's finished brew "Brew in tab B" was gone from both tabs and after a
     reload.
   - Caveat: in that browser repro I moved tab A to Settings with the debug API while B was brewing. The normal UI
     sends every tab to Focus while a brew runs.
   - Why it matters: the toast lasts 10 s, but it pauses while hovered or focused, so the window can be long.
   - Repro (UI only, confirmed): tab A in Settings adds a backup and keeps the pointer on the Undo toast. Tab B,
     already open on Stats, renames "Spanish practice" to "Renamed in tab B" and saves. Tab A presses Undo: the rename
     is gone in both tabs.
   - Scripts: `.tmp/critic-r4b/undorename.mjs` (UI only) and `.tmp/critic-r4b/undorace.mjs` (brew in another tab)
2. **Add treats any known id as "already here", so newer edits in the backup are dropped silently.** If the other
   device renamed a brew or marked it done after the two devices shared data, Add keeps the old copy and counts it
   under "already here". Probe: a backup with `intention:'Essay v2', outcome:'done', v:+1e9` for id `x1` gives
   added 0, duplicates 1, and the record is unchanged.
3. **Add brings back brews deleted on this device** and counts them as "Adds 1 brew". Tombstones are ignored when
   adding. Probe: export, delete `gone1`, add the backup back, and `gone1` returns.
4. **The preview does not show the result or which backup it is.** The summary computes `after` (brews, leaves and
   level after adding) and `exportedAt`, but the sheet shows neither. The top box has no visible "In this backup"
   heading; that text is only its aria-label. Because Add replays the brews, leaves after adding are not "backup +
   here", and nothing on screen says what the result will be.
5. **"N damaged entries will be skipped" counts ledger entries that are rebuilt, not lost.** A backup whose whole
   leaves ledger is invalid says "184 damaged entries will be skipped", but it restores all 2,256 leaves from the
   brews. That wording scares people for no reason.
6. **Copy mismatches.**
   - A backup with no brews says "Every brew in this backup is already here". A backup with leaves but no brews can't
     be added, because Add is disabled when `added === 0`.
   - A file without `schema` says "missing its progress data" even when it has progress.
   - The Replace warning says "and settings" even when the backup has no settings, which are then kept.
   - The Welcome screen says "N brews restored" using the backup's total, even when it added and some were
     duplicates.
   - The Import row still says "Restore from a Kettle .json file" although Add is now the default.
7. **Welcome with progress already on the device replaces your settings with no preview and no Undo.** Seed newbie
   with `onboarded=0`, then import from Welcome: the brews are added (4 + 52 = 56, good), but the name changes from
   Sam to Robin and the daily goal from 30 to 60 without asking. The "Welcome back" message is also never seen,
   because `onboarded` flips at once and the screen changes. This is a rare state, but it goes against the claim that
   Welcome never replaces existing data.
8. **A 21 MB file takes about 5 s before "too big" appears**, with no busy indicator.

### Intention
9. **Right after a brew ended early, toasts cover the "Carried from your last brew · Mark done" line.** Two or three
   toasts land exactly on it for 3–5 s ("Kettle's off…", "Saved 5 minutes of focus", recipe toasts). This is the
   moment the line matters most. Screenshot: `shots/A2-carried-early.png`.
10. **The break-over card offers "Ready for another brew of *Essay B*?" but gives no way to cross it off.** If you
    skipped the choice on the finish card, "Put the kettle on" starts the same intention again. The only way to mark
    it done is "Done for now", then Home, then Mark done. There is also a naming clash: "Done for now" (leave) sits
    near the intention's "Done" (finished).
11. **Doing nothing and choosing Carry forward have the same effect, and a stale intention carries over for days.**
    The timer never clears the intention. It is still in the field the next day with "Carried from your last brew",
    and Enter starts a brew with it. To skip you have to clear the field or press Mark done. That is fine for someone
    who uses intentions, but it is not the "effortless skip" for someone who used one once.
12. **Done and Carry forward are toggle buttons (`aria-pressed`) that can't be switched off.** Pressing a selected
    chip does nothing, although the sound plays the lower "untoggle" pitch, and you can't go back to "no choice".
    Screen reader users hear toggle buttons that don't toggle.
13. **Keyboard focus is lost after Mark done.** The button unmounts and focus falls to `<body>`, in light and dark.
    The same happens after pressing Undo on the toast. The button's name, "Mark done", doesn't say what it marks.
14. **History: the done check is hard to find, and you can't unmark.**
    - The check is an 18 px green circle before the title. It uses the same glyph and colour as the day header's
      "Daily goal met" check.
    - Its explanation is a mouse-only `title` inside an `aria-hidden` span. Screen readers do get "(done)".
    - The Edit sheet has no Done control. The only way to clear "done" is to change the text.
    - Separately (older, not verified in the browser): the Edit field allows 60 characters while Today allows 80.
    - Screenshot: `shots/B3-history.png`.
15. **Small inconsistencies across tabs.**
    - Tab A presses Carry forward after the intention was cleared in History (another tab). The timer gets the old
      words back, but no outcome is stored (probe).
    - When one tab follows another tab's field, it writes back its own tag, so the timer's tag can differ from the
      chip highlighted in the typing tab (code reading). The words themselves always converged in my tests.
16. **At 320×568 with first-brew text and an 80-character intention, the stat tiles start below the fold.** The page
    scrolls by 161 px and only the tile headers peek out. Without an intention it already scrolled by 48 px, so the
    chips add about 50 px of scrolling rather than hiding anything. Screenshot: `shots/L-320-light-first.png`.

---

## Verified working (evidence)

### Intention (`intentA.mjs`, `intentB.mjs`, `twotab.mjs`, `layout.mjs`, `a11y.mjs`)
- **No friction to start.** An empty field plus Enter starts a brew in about 220–270 ms, measured with polling, and
  records an empty intention.
- **"Optional" marker.** It is visible and hidden from screen readers, and the field is named "What are you brewing?
  (optional)".
- **Finish card.** The chips are 44 px tall (89 and 150 px wide) and sit in a group labelled "<intention>: done, or
  carry it forward to your next brew?". They are fully visible and not covered at 320×568, 390×844, 844×390,
  820×1180 and 1440×900, in light and dark, including the first-brew and while-away text. Mascot and styling are
  unchanged. Enter on a focused chip toggles it and does not advance the card. With reduced motion the chips render
  at opacity 1.
- **Done.** The record's outcome becomes `done` and the timer's intention is cleared. The break-over card then asks
  "Ready for another brew?", and "Put the kettle on" starts with no intention.
- **Carry forward and no choice.** After skipping the break, Home shows the words with "Carried from your last brew".
  This survives a reload and still shows after the clock moves on 24 h.
- **Brew ended early** (over 1 minute; shorter brews aren't recorded, by design). Home shows the carried line. Mark
  done clears the field and marks the record done. The toast's Undo puts the words back and stores `carried`.
- **Reload during the celebration.** The pressed state is kept.
- **Two tabs.**
  - Done and Carry forward in tab A clear and restore tab B's Home field, carried line included.
  - Tab B's words stay while it is typing ("Brand new plan" survived A's Done, and Done did not clear it).
  - Different outcomes chosen at the same time end up the same in both tabs (`done`/`done`).
- **History.** The check appears only on intentions marked done, and the row's screen reader name includes "(done)".
- **Unit probes.** Stale-record Done applies to the renamed text. Carry forward survives a break in between. Matching
  ignores surrounding spaces and is case-sensitive.

### Backup (`backup1.mjs`, `backup2.mjs`, `welcome.mjs`, `blank.mjs`, `sheetlayout.mjs`)
- **Export.** The file is `kettle-backup-2026-09-29.json`, 97 KB for the veteran profile, with `{app, kind, schema:2,
  exportedAt, progress{sessions, ledger, leaves, cozies, dayGoals, quests, badges, tombstones, lastReport:null, rev,
  epoch}, settings(22 keys)}`. Toast: "Saved … Keep it somewhere safe."
- **The same file back.** The sheet is titled "Add this backup?", with Add preselected and disabled, and says
  "Every brew in this backup is already here…". Esc, a backdrop tap and Cancel each leave the data deep-equal to
  before. Reopening the sheet selects Add again.
- **Another device (3 new brews, different name, theme, goal and brew length).**
  - Add goes from 52 to 55 brews and from 2,256 to 2,371 leaves, and keeps all settings. Toast: "Added 3 brews from
    your backup." with Undo.
  - Undo is deep-equal to before (sessions, ledger, badges, quests, dayGoals, settings).
  - Replace swaps in the name, theme, goal and brew length. Undo is again deep-equal.
  - Undo pressed after moving to /stats works. The Undo toast stays about 10.3 s.
  - A second tab follows both the import and the Undo.
- **Blank device.** "Restore this backup?" has no mode picker and says "Restores your brews, leaves and settings".
  Undo puts back the name "Alex" and the daily goal.
- **Welcome on a fresh device.** A bad file shows "That file doesn't look like a Kettle backup." A good file shows
  "Welcome back. 52 brews restored.", finishes onboarding and opens Home.
- **Bad files: friendly inline alert, sheet stays closed, data unchanged.**
  - Truncated file: "couldn't read that file".
  - 0-byte or whitespace-only: "empty".
  - A `package.json`, another app's backup, or a JSON array: "doesn't look like a Kettle backup".
  - Schema 3: "newer version… Update the app".
  - All brews damaged: "look damaged, so nothing was changed".
  - PNG bytes or CSV: "couldn't read".
  - 21 MB: "too big".
- **Files that open the sheet.** A schema 1 backup is accepted. A UTF-8 BOM is accepted (`File.text()` strips it).
  Partly damaged files are imported with a warning line.
- **Leaves after adding.**
  - Two devices with separate brews: 284 + 264 = 548 exactly.
  - Veteran added into newbie: 2,276 + 143 = 2,419, and the result is 2,465 (level 13). The extra 46 leaves come from
    goal and recipe rewards recomputed on days both devices share. That is plausible and never below either side.

## Not verified
- Real screen reader output (NVDA or VoiceOver). I checked the DOM, ARIA attributes and axe only.
- The native file picker's Cancel. Playwright bypasses the picker; from the code, no file means no change.
- iOS Safari filtering `.json` files under `accept="application/json,.json"`.
- The while-away finish card was produced by moving the clock forward, not by a real hidden tab.
- Behaviour across a midnight or DST boundary beyond a 24 h clock jump.
- Editing an 80-character intention in History's 60-character field (code only).

---

## Repairs (implementer, after this review)

| Finding | Repair | Evidence |
|---|---|---|
| P1-1 Long unbroken intention breaks layouts | The Focus panel column is `minmax(0,1fr)` and the intention line ellipsizes while its tag chip keeps its size. The finish card, break-over card and resume text wrap long words (`overflow-wrap: anywhere`). | New e2e "small screens: a long intention and the import sheet fit" (80-char URL at 390: no horizontal overflow, End and Carry forward on screen). |
| P1-2 Import sheet on small phones | Choices are now "Add · keep what's here" / "Replace · swap it all" (no clipping at 320). The one sentence that says what will happen moved into the sheet footer next to the button, so it's visible without scrolling in landscape. | Same e2e: labels not clipped at 320×568; loss warning in view at 844×390. |
| Undo erases later changes | `undoLastImport()` declines ("Can't undo any more: brews or settings changed since the import.") if brews, their versions, deletions or settings changed since the import, here or in another tab. | Unit "undo declines when brews or settings changed after the import". |
| Add ignores newer edits / resurrects deletions | Adding uses the cross-tab rule per brew: a newer edit in the backup updates the brew here; a brew deleted here stays deleted; this device's tombstones are kept. The preview counts added / updated / already here / deleted here. | Unit "adding takes newer edits … keeps brews deleted here deleted". |
| Preview gaps, "damaged entries" wording | Visible "In this backup · saved <date>" heading; "You'll have N brews, cozy level L" after adding; only unreadable brews count as damaged, and a rebuilt ledger says "Leaves will be recounted from the brews." | Unit "a damaged ledger is recounted…". |
| Copy mismatches | Empty backup: "This backup has no brews to add." Replace mentions settings only when the backup has them. No-schema files with progress import as schema 1. Import row: "Add or restore from a Kettle .json file." A >20 MB file is refused before reading. | Unit + visual check. |
| Welcome with progress replaces settings | Welcome adds brews and keeps this device's settings when brews exist; the confirmation is a toast that survives the move to Today and reports what was added. | Code. |
| Done/Carry can't be switched off | Pressing the selected chip takes the choice back (the intention stays for the next brew). | Code; e2e still green. |
| Focus lost after Mark done / Undo | Focus returns to the field; the link is named "Mark "<intention>" done". | Code. |
| Break-over has no way to cross off | "Mark it done, start fresh" on the break-over card; "Done for now" renamed "That's all for now" to avoid the clash. | Code. |
| Stale intention carries across days | On a new day, words from a brew that wasn't explicitly carried forward are not prefilled (still one tap away under Recent). | Code. |
| History check | The meta line starts with "✓ Done ·" (text, not just the goal-check glyph); the Edit sheet has a Done toggle; the Edit field allows 80 characters like Today. | Code. |

**Still open (minor):** toasts after an early end can briefly cover the carried line (#9); tag follow-through between two typing tabs (#15); the 320 finish card scrolls a little further with the chips (#16).
