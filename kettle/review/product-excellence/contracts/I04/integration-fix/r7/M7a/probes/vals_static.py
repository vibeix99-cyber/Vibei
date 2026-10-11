import json
SC = '/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/M7a'
try:
    V = json.load(open(f'{SC}/vals.json'))
except Exception:
    V = {}
V['lead_points'] = """1. **The Close fix everywhere.** Close probe (above): Close and every Break's over control clear and really tapped at
   375×667 @200 % light and dark, by wheel and by touch, with three toasts; Close also at 390×844 and 844×390 @200 % and
   at 100 % on all four sizes. M7b's toast check on the final revision covers Close, **Ambience and Mute** with **1 and
   3** toasts, panel at its top and at its end (wheel), in the paused break and Break's over (see the M7b section).
   Not measured: Ambience/Mute by touch scrolling (the room top is the same whichever input scrolled the panel). The room
   is **not emptied** at 844×390 or 667×375 @200 %: the clamp keeps ≥ 56 px or leaves the stylesheet's top (844×390
   @200 %: 26 px on both revisions — the lift leaves no more, pre-existing). **Round 6 elsewhere:** Today, Stats, Nook
   and Settings have no page-level `<header>`, so their room is untouched (Today's docked start: the "last toast fades
   out" and banner toast-room tests pass); on the summary footer and the brew controls only the room's top can move,
   never its bottom (the lift), and at 100 % the toasts' boxes are identical to the unfixed revision in every measured
   configuration (geometry table).
2. **Banner out of view after a real "Mark done".** Measured and stated in "Nothing moves under the finger" above: yes,
   where the person is scrolled down into the composer the banner goes above the view (−200 px @100 %, −772 px @200 %
   at 375×667); the scroll that keeps the finger's control still is the reason. How the person learns: one polite
   announcement; the banner at the top of Today; Settings › Your data; the next summary's note. INT shows its toast in
   view at once (and at 200 % sends it past the top of the screen; R6 looped it).
3. **"Nothing implies saved."** Two pre-existing wordings outside my files, identical on INT `0d58c5e`: the End sheet's
   "N minutes of focus will be saved" (`src/screens/focus/parts/EndSheet.tsx:44`, same line on INT) and the
   screen-reader line "Kettle’s off. N minutes of focus saved." (`src/timer/announce.ts:53`, frozen, same on INT).
   Neither checks whether saving works. The visible End-early toast and the summary are truthful on this revision.
4. **Brew captures at 100 %.** {brew}
5. **Summary note.** Last expanded line vs the Tea time / Skip footer with the note present: {summary_end}. The note
   wraps to two rows at 844×390 (narrow landscape panel) and at 200 %. Dark-theme honey tint: same family as the
   reward/unlock card next to it — a tone choice (see design notes).
6. **Behaviour.**
   - *Announced once:* 1 live-region addition per run in every LEAD-D1 run on the final revision (11 and 28–29 on
     e866118); the integrity spec requires exactly 1 across brew → summary → Today → Settings → Today; Today
     re-mounting or a route change does not announce again (the banner is not a live region; the announcer is set
     once per spell of failing saves, at most once a minute).
   - *When it disappears:* the state re-checks every 2 s whether every key whose save failed has since been written
     successfully (`lastWriteFailed`); the banner goes at the first check after the last of them is saved again —
     i.e. ≤ 2 s after the next successful save of each failed key once room is made. Making room alone is not enough
     until those keys are written again (storage still holds older values until then). The integrity spec frees the
     space, writes timer, progress and settings, and sees the banner gone within its 6 s timeout.
   - *Tab order:* phones — status bar pills, Chai's bubble chip (when shown), **Save backup**, then the composer and
     the docked start; desktop — the left column (status, composer, start) first, then the right column, **Save
     backup** first in it. The integrity spec Tabs from the greeting to Save backup.
   - *Replaced tests:* listed in (b).
   - *`scrollIntoViewIfNeeded`:* used in the "Mark done" spec and in `late.mjs` as setup only, before storage is
     filled and before recording; the tap itself is real."""
json.dump(V, open(f'{SC}/vals.json', 'w'), ensure_ascii=False)
print('ok')
