# Paper critique of v1 (independent critic, before any spend) and how v2 answers it

| # | Critique of v1 | v2 response |
|---|---|---|
| 1 | No capybara and no product in the first 3 s. The 5-word hook is generic, and the kettle picture doesn't show the problem | Hook is now "Can't start studying?" on a faceless desk scene that shows the problem. Chai appears at 2.7 s (the tap comes first to keep the story in order) |
| 2 | The board contradicted the brief: "Good afternoon, Sam" at night, demo streak/leaves/goal, and Chai's "5 min to go" contradicting "can't start" | Seed `blank` (day one); the app clock pinned to 21:15 in the recorder; Home is shown only as a punch-in on the composer and button |
| 3 | Shot 2 had too many actions | Intention and Study are set before frame 0; one tap; the orange mug cuts to the orange button |
| 4 | Full-screen UI unreadable; Chai too small; caption band inconsistent | Every shot is a punch-in. Chai's close-up comes from a larger capture window. One caption band at y 250–470, x ≤ 960 |
| 5 | G1's prompt conflicted with its frames (steam already detached, "firebox", rain "on glass", a cloud appearing, the curtain unnamed); start+end interpolation with parallax is risky | Engine shot dropped: the engine already renders steam and the whistle for free. The paid shot is now the one thing the app can't show |
| 6 | About 9 s near-static; show the whistle in picture | 15 s total. Shot 3 eases out from Chai; the whistle is shown in the room (lid rattle, notes) before the card |
| 7 | "25 minutes later…" too small; "Get it done" overclaims; leaves unexplained; no destination, so not a performance ad | Full-size time card; tagline cut to "Put the kettle on."; leaves cropped out; flagged as organic or preview until a destination exists |
| 8 | Sound-on thin without a bed | The app's own lo-fi ambience as a quiet bed (our own synthesis, no licence needed); the whistle peaks clearly; no VO |

## Second pass on v2 (same critic): "go once changes 1–4 are in the prompt"
1. One action from frame 0 (pencil taps); left hand still. **Done** in `g1-prompt-final.txt`.
2. High angle; no head, hair or shoulders; no window reflections. **Done.**
3. No laptop (logo risk); plain, unprinted hoodie, pencil and mug. **Done.**
4. Mug placed where the orange button lands, focus on mug and pencil tip. **Done.**
5. Tap moved to 2.2 s, button large. **Done** (shot list).
6. Lo-fi bed rendered through the app's audio graph. **Done** (`sources/audio/ambient-lofi.wav`).
7. Rejection list adds hair/ears/shoulders and reflections. **Done.**
