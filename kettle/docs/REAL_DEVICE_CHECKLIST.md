# Real-phone checklist

Things automated tests can't prove: they run headless Chromium with software
3D, and nobody listens to the audio. Please run these on a real phone and
write down what actually happened. Until results come back, every item here
counts as **not verified**.

**Setup:** open the preview link on the phone (sign in to claude.ai if it
asks), then set Settings → Brew to 5 min so each test brew is short. Write
down the phone model, OS version and browser.

**Where each section can run.** The private claude.ai preview is served by the
artifact host, not from Kettle's own address. Browsers restrict service workers,
notification permission, installing and screen wake lock in pages served
that way, so sections **1, 5 and 6** are meaningful on the preview, while
sections **2, 3 and 4** may only test the host's limits. For those, Kettle needs
to run at its own top-level address (a hosting choice that's yours to make).
If an item there fails on the preview, mark it ➖ with a note rather than ❌.

For the install items, use Share → Add to Home Screen (iPhone Safari) or
⋮ → Install app (Android Chrome). On iPhone, notifications only exist for
web apps added to the Home Screen (iOS 16.4 or later); in a Safari tab the
Nudges switch is disabled and says the browser can't show notifications.

Mark each item ✅ / ❌ / ➖ (couldn't test) and add a note.

## 1. Sound (volume up, ringer/silent switch noted)

| # | Do this | Expect | Result |
|---|---|---|---|
| 1.1 | Pick an ambience other than Quiet (the chip at the top of a brew), then tap **Put the kettle on** | A soft start sound; the ambience fades in over about 3 s |  |
| 1.2 | Pause, then resume | The ambience dips on pause and comes back on resume. No clicks or pops |  |
| 1.3 | Change the ambience (Rain, Fireplace, Forest, Brown noise, Lo-fi keys) during a brew | A smooth crossfade, no gap or jump in loudness. In the last ~40 s you also hear the kettle simmer |  |
| 1.4 | Let a short brew finish with the app open (Settings → Brew → 5 min, the shortest) | The kettle whistle, then the celebration sounds. Nothing distorts at full volume |  |
| 1.5 | iPhone: flip the silent switch on and repeat 1.1 | Note whether sound plays (Safari usually mutes web audio in silent mode) |  |
| 1.6 | Bluetooth headphones on, then off, during a brew | Audio follows the output; no stuck loud or silent state |  |
| 1.7 | Mute (speaker button or **M**) | Everything goes silent immediately and stays muted after a reload |  |

## 2. Notifications

| # | Do this | Expect | Result |
|---|---|---|---|
| 2.1 | Settings → **Nudges** on → tap **Allow** in the system prompt | The switch stays on; no error |  |
| 2.2 | Start a short brew and switch to another app (screen still on) | One "brew done" notification near the end time. Tapping it opens Kettle on the celebration |  |
| 2.3 | Start a short brew and lock the phone | Note **when** (if ever) the notification appears. Phones pause web pages when locked, so it may only show up once you unlock. Record the delay |  |
| 2.4 | Repeat 2.2 from the installed (Home Screen) app | Same as 2.2. Note any difference from the browser tab |  |
| 2.5 | Deny permission, then look at the Nudges row | Kettle explains how to re-enable them for how you opened it (installed app, phone browser, or computer); nothing breaks |  |

## 3. Offline and installed app

| # | Do this | Expect | Result |
|---|---|---|---|
| 3.1 | Open Kettle once online, then turn on airplane mode and reload | The app opens, and Today, Stats, Nook and Settings all load |  |
| 3.2 | Run a full brew offline | The timer, sounds, celebration and stats update all work |  |
| 3.3 | Go back online | Nothing is lost or duplicated |  |
| 3.4 | Open the installed app from the Home Screen | It opens full-screen with the Kettle icon. The status bar matches light or dark mode (the splash screen is always the light cream) |  |

## 4. Screen stays awake

| # | Do this | Expect | Result |
|---|---|---|---|
| 4.1 | Settings → **Keep screen awake** on, start a brew, don't touch the phone for longer than its auto-lock time | The screen stays on while the brew runs |  |
| 4.2 | Pause and wait past auto-lock | The screen is allowed to sleep while paused |  |
| 4.3 | Turn the setting off and repeat 4.1 | The phone locks at its normal time |  |
| 4.4 | Lock the phone mid-brew for 2 min, then unlock | The timer shows the correct remaining time (it runs on wall-clock time, not only while visible) |  |

## 5. Performance and feel

| # | Do this | Expect | Result |
|---|---|---|---|
| 5.1 | Cold-open Kettle | Time to a usable Today screen (roughly: under 2 s / 2–4 s / slower) |  |
| 5.2 | Start a brew | The move to Focus feels instant. The 3D room fades in without a blank flash |  |
| 5.3 | Leave a 25-min brew running with the screen on | The phone doesn't get noticeably hot. Note the battery used |  |
| 5.4 | Scroll Stats and Nook; rotate to landscape | Smooth scrolling, no overlapping text, nothing cut off |  |
| 5.5 | Turn on the system Reduce Motion setting and repeat a brew | Animations are calm or instant. The timer still works |  |

## 6. Data safety

| # | Do this | Expect | Result |
|---|---|---|---|
| 6.1 | Open Kettle in two tabs, start a brew in one | The other tab follows and shows the celebration too. After the brew, both show exactly one new brew in Stats |  |
| 6.1b | With both tabs open, delete a brew in Stats, then tap **Undo** | The brew comes back in both tabs and stays back after a reload |  |
| 6.2 | Settings → **Export a backup**; open the file | A `.json` file downloads and opens as readable text |  |
| 6.3 | Settings → **Import a backup**, pick that same file | The sheet shows what's in the backup and what's on this device, says every brew is already here, and has nothing to add. Cancel changes nothing |  |
| 6.4 | Import a backup from another device or browser | **Add to what's here** is preselected and says how many brews it adds. **Replace** says what would be lost. After either, **Undo** on the message puts everything back |  |

Send the table back (screenshots are fine), and I'll turn any ❌ into a fix.
