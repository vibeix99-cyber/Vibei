# Residual table draft (LEAD2) — rows marked (P) pending a run

Rule: BLOCKS = introduced or worsened by round 7 · FOLLOW-UP = present on INT and not worse (cause, files, owner) ·
ACCEPTED = not a defect (reason). Exception (Vibei): a transient visual artifact introduced in round 7 that hides no
text or control and changes no behaviour may be FOLLOW-UP with the reason.

## New in round 7 (or new form)
| # | Item | Evidence | Class |
|---|---|---|---|
| R7-1 | Banner after the first failed save happens at "Mark done" while scrolled: added above the view (375×667 @200 −379…−518 px; 844×390 −122…−177; 375×667 @100 partly in view, top −39), page kept still under the finger (settleAnchor +290…+352) | A leadd1 16 rows + smoke a; B markdone @100 | ACCEPTED under Vibei's ruling: first appears at that moment → announced exactly once (16/16 + smoke: one `kettle-save-warning-said` text, full sentence) |
| R7-2 | Mark done with the banner already shown (it scrolled away by the user's own scroll) | A setupb 375×667 L/D @200, 844×390 @200: tap jump 0 / −79 (toward the banner); no re-announcement; (P) mine at 390×844/375×667 @100, 1440, 390 @150 | ACCEPTED (case "reachable by scrolling once seen"); BLOCKS branch not observed (P) |
| R7-3 | Banner below the fold on arrival (End → Today at 375×667 @200: top 737 of 667) | saidlog, D a1 | ACCEPTED under the ruling: said once (6/6) + End toast on screen says "…kept in this tab: not saved yet" |
| R7-4 | End's toasts float over the in-page banner on arrival at landscape 200 % (844×390: 164 frames ≈ 2.7 s); ordinary toasts over the banner's first line while reading at 667×375 @200 (C item 13: 5–12 frames) | A smoke b; C resid | FOLLOW-UP: toast placement over page content (round-6 items 8/13 class, INT also overlays content and its own warning); said once + End toast text. Owner M2 (I04 toast placement) |
| R7-5 | Summary note covered by reward toasts at phones @200 (Save backup centre covered 12/12 frames at 375 and 390 @200, box overlap at @100) | B cover raw 5-summary-toasts | FOLLOW-UP: toast lift above the footer lands on the summary's lower content (INT: toasts over heading/sub, round-6 item 8 class); note said once (integrity :1004). Owner M2 + M7a |
| R7-6 | Toast room at landscape 200 % with Break's over scrolled to its END: room 27–42 px < one toast (667×375 lone toast 19/57 px visible; 844×390 34/57); older toasts scrolled away in the list | prev-lead close-r7, C close sweep, both themes; same on 49ea1de; INT cannot reach the state | judgement → see verdict text (P toastroom: update toast, arrival) |
| R7-7 | Shade band 12–19 device px at the panel's bottom during break / Break's over entrance at 100 % | C 1d pixels; C resid3 real clock 146–292 ms | FOLLOW-UP by the exception: transient, painted behind content (hides nothing), no behaviour change. Owner M7b (FocusScreen.module.css `.panel:has()` background vs entrance translate) |
| R7-8 | integrity.spec.ts:1090 @1440 intermittent (3 of 10 executions seen) | my diag: click lands on End's "Recipe done" toast still high in the first ~0.8 s; INT has that toast over Mark done for its whole life (4/4) | FOLLOW-UP (test): round 7's own test clicks 0.8 s after End without waiting for End's toasts; product cause = pre-existing toast lift (r6 item 10), INT worse. Owner M7a (test) / M2 (lift) |
| R7-9 | Focus → body when the banner leaves on recovery with Save backup focused | C c6 (616 ms) | FOLLOW-UP: same class as r6 item 16 (INT: focus → body when its warning is withdrawn), narrower trigger. Owner M7a |
| R7-10 | Second failure episode within 60 s: banner back, not announced | B episodes raw | FOLLOW-UP: INT shows nothing at all in that case (60 s toast throttle). Owner M7a |
| R7-11 | Resume after a tap at 375×667 @200: centre hit-testable, lower rim under the edge | C 1a | FOLLOW-UP (INT: Resume wholly below the edge, unreachable). Owner M7b |
| R7-12 | 667×375 @200, 100-px wheel: 4/8 banner lines, Save backup never whole (C item 3) | C resid read-100; (P) key/touch reach | FOLLOW-UP if key/touch reach (same ~60 px strip as r6 item 3) |

## Integrity
| R7-13 | integrity.spec.ts:768 export→reset→import pill read race (not a timeout: 19.2 s of 150 s) | my isolated run + trace; (P) INT ×5 | FOLLOW-UP (test, M1 owner): `profilePills` reads body.innerText while the exiting Today layer is still in the DOM |
