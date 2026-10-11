# integrity.spec.ts: only the old placement block changed

M1's approved revision: 3f00b57 (pe/w1-fix). Final code revision: 980ef2a (this file last changed in 41a25f4).

$ git diff --stat 3f00b57 980ef2a -- kettle/tests/integrity.spec.ts
 kettle/tests/integrity.spec.ts | 235 ++++++++++++++++++++++++-----------------
 1 file changed, 140 insertions(+), 95 deletions(-)

$ git diff 3f00b57 980ef2a -- kettle/tests/integrity.spec.ts | grep "^@@"   (every hunk at or after line 948; the first changed line is 951)
@@ -948,7 +948,8 @@ test.describe('I03 data safety', () => {
@@ -965,135 +966,179 @@ async function pressAt(page: Page, name: string | RegExp, touch: boolean) {

Lines 1–949 (everything before the block's opening rule line at 950):
  3f00b57: 669ff6598fc1ad85ecb3c59904b8275bc666cef33d90b91bcfb58f0262cd6e56  -
  980ef2a: 669ff6598fc1ad85ecb3c59904b8275bc666cef33d90b91bcfb58f0262cd6e56  -

The old block (3f00b57 lines 950–1099) began:
// ---------------------------------------------------------------------------------------------------------------
// I03 — the storage-full warning is told plainly, but never over a control (phones and desktop)
// ---------------------------------------------------------------------------------------------------------------

…and ran to the end of the file (1099 lines).

M1's storage / persistence / restore sources:
  src/lib/storage.ts: identical to 3f00b57
  src/timer/**: identical to 3f00b57
  src/progress/**: identical to 3f00b57

Full diff of the file:
```diff
diff --git a/kettle/tests/integrity.spec.ts b/kettle/tests/integrity.spec.ts
index 6a70e2b..45ae69a 100644
--- a/kettle/tests/integrity.spec.ts
+++ b/kettle/tests/integrity.spec.ts
@@ -948,7 +948,8 @@ test.describe('I03 data safety', () => {
 });
 
 // ---------------------------------------------------------------------------------------------------------------
-// I03 — the storage-full warning is told plainly, but never over a control (phones and desktop)
+// I03 — the storage-full warning is a banner in the page (Today, Settings › Your data) and a one-line note on the
+// summary: told plainly and steadily, never laid over anything (phones and desktop)
 // ---------------------------------------------------------------------------------------------------------------
 
 /** Is `name`'s button the element a tap at its centre would hit (nothing on top of it)? */
@@ -965,135 +966,179 @@ async function pressAt(page: Page, name: string | RegExp, touch: boolean) {
   if (touch) await page.touchscreen.tap(x, y);
   else await page.mouse.click(x, y);
 }
-const saveWarning = (page: Page) => page.getByRole('status', { name: 'Notifications' }).getByText(/storage is full\. Save a backup to keep them\./);
+const banner = (page: Page) => page.getByRole('region', { name: /storage is full/ });
 const CONTROLS = ['Add 5 minutes', 'Pause', 'End session'];
-/** No visible toast overlaps the session readout (flag, countdown digits, status line, meta line). */
-const readoutClear = (page: Page) =>
+/** Every place the warning could show: the banner / note, and any toast saying it. */
+const warningAnywhere = (page: Page) =>
+  page.evaluate(() => document.querySelectorAll('[data-save-warning]').length + [...document.querySelectorAll('[aria-label="Notifications"] li')].filter((li) => /storage is full|couldn’t save your latest/.test(li.textContent ?? '')).length);
+/** The banner is laid out in the page: not fixed or absolute, not in the toasts' layer, it scrolls with the page. */
+const inFlow = (page: Page) =>
+  page.locator('section[data-save-warning]').evaluate((el) => {
+    for (let e: Element | null = el; e && e !== document.body; e = e.parentElement) {
+      const p = getComputedStyle(e).position;
+      if (p === 'fixed' || p === 'absolute') return `${e.tagName}.${e.className} is ${p}`;
+    }
+    if (el.closest('[aria-label="Notifications"]')) return 'inside the toasts';
+    if (!el.closest('main')) return 'outside main';
+    return 'in flow';
+  });
+/** Count what the polite announcer says, from now on. */
+const countSaid = (page: Page) =>
   page.evaluate(() => {
-    const ro = document.querySelector('main [role="timer"]')?.parentElement;
-    if (!ro) return true;
-    const r = ro.getBoundingClientRect();
-    return [...document.querySelectorAll('[aria-label="Notifications"] li')].every((li) => {
-      const t = li.getBoundingClientRect();
-      return Number(getComputedStyle(li).opacity) === 0 || t.bottom <= r.top || t.top >= r.bottom || t.right <= r.left || t.left >= r.right;
-    });
+    const w = window as any;
+    w.__said = [];
+    const el = document.getElementById('kettle-save-warning-said');
+    if (!el) throw new Error('no announcer');
+    new MutationObserver(() => el.textContent && w.__said.push(el.textContent)).observe(el, { childList: true, characterData: true, subtree: true });
   });
-/** On the session screen: the controls are tappable and the readout is clear; on phones the warning waits. */
-async function sessionClear(page: Page, touch: boolean, controls: string[], tag: string) {
-  if (touch) await expect(saveWarning(page), `phone: no warning during the brew (${tag})`).toHaveCount(0);
-  for (const c of controls) expect(await hitOk(page, c), `${c} ${tag}`).toBe(true);
-  expect(await readoutClear(page), `readout clear ${tag}`).toBe(true);
-}
 
 for (const vp of [
   { name: 'phone 390×844', width: 390, height: 844, dpr: 2, touch: true },
   { name: 'phone 375×667', width: 375, height: 667, dpr: 2, touch: true },
   { name: 'desktop 1440×900', width: 1440, height: 900, dpr: 1, touch: false },
 ]) {
-  test.describe(`I03 storage-full warning never covers a control (${vp.name})`, () => {
-    test.use({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, isMobile: vp.touch, hasTouch: vp.touch });
+  test.describe(`I03 storage-full warning is a banner in the page (${vp.name})`, () => {
+    test.use({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, isMobile: vp.touch, hasTouch: vp.touch, acceptDownloads: true });
     test.beforeEach(async ({ context }) => prime(context));
 
-    test('while brewing (running and paused): Add 5, Pause, Resume and End stay tappable; End opens its sheet, never a download', async ({ page }) => {
-      test.setTimeout(120_000);
+    test('nothing over the brew; the summary says the brew is not saved, with Save backup; Today and Settings show the banner in the page, said once, kept while storage is full, gone when there is room', async ({ page }) => {
+      test.setTimeout(150_000);
       await newbieWithFullStorage(page);
+      await countSaid(page);
       let downloads = 0;
       page.on('download', () => downloads++);
       await page.evaluate(() => (window as any).__kettle.timer.getState().startFocus({ minutes: 25, intention: 'Storage full' }));
       await expect.poll(() => hash(page)).toBe('#/focus');
+      // The brew: no warning anywhere on screen, every control tappable (running and paused), End opens its sheet.
       for (let i = 0; i < 4; i++) {
         await page.waitForTimeout(300);
-        await sessionClear(page, vp.touch, CONTROLS, `@${i}`);
+        expect(await warningAnywhere(page), `no warning during the brew @${i}`).toBe(0);
+        for (const c of CONTROLS) expect(await hitOk(page, c), `${c} @${i}`).toBe(true);
       }
-      await pressAt(page, 'End session', vp.touch);
-      await expect(endDialog(page)).toBeVisible();
-      await endDialog(page).getByRole('button', { name: 'Keep brewing' }).click();
-      await expect(endDialog(page)).toBeHidden();
-      // Where nothing is covered (wide layouts) the warning is up now; put it away, as a person would.
-      if (await saveWarning(page).isVisible()) await saveWarning(page).click();
-
-      // A minute later a pause fails to save too: a new warning, and the paused controls stay clear.
-      await ff(page, 70_000);
       await pressAt(page, 'Pause', vp.touch);
       await expect.poll(async () => (await timer(page)).status).toBe('paused');
-      for (let i = 0; i < 4; i++) {
-        await page.waitForTimeout(300);
-        await sessionClear(page, vp.touch, ['Add 5 minutes', 'Resume', 'End session'], `paused @${i}`);
-      }
+      expect(await warningAnywhere(page)).toBe(0);
       await pressAt(page, 'End session', vp.touch);
       await expect(endDialog(page)).toBeVisible();
       await endDialog(page).getByRole('button', { name: 'Keep brewing' }).click();
       await pressAt(page, 'Resume', vp.touch);
       await expect.poll(async () => (await timer(page)).status).toBe('running');
       expect(downloads).toBe(0);
-      expect((await timer(page)).status).toBe('running');
-    });
-
-    test('a warning already up when the next brew starts never covers the session readout or controls (wave-1 integration regression)', async ({ page }) => {
-      test.setTimeout(120_000);
-      await newbieWithFullStorage(page);
-      // Raised where it covers nothing protected (Stats), so it is on screen when the brew starts.
-      await page.evaluate(() => (window as any).__kettle.navigate('/stats'));
-      await expect.poll(() => hash(page)).toBe('#/stats');
-      // A save that needs more room than is left (a longer name) fails.
-      await page.evaluate(() => (window as any).__kettle.settings.getState().set({ name: 'Sam, brewing through a full browser' }));
-      await expect(saveWarning(page)).toBeVisible();
-      await page.evaluate(() => (window as any).__kettle.timer.getState().startFocus({ minutes: 25, intention: 'Next brew' }));
-      await expect.poll(() => hash(page)).toBe('#/focus');
-      for (let i = 0; i < 6; i++) {
-        await sessionClear(page, vp.touch, CONTROLS, `next brew @${i}`);
-        await page.waitForTimeout(250);
-      }
-    });
+      expect(await page.evaluate(() => (window as any).__said.length), 'not said during the brew').toBe(0);
 
-    test('a warning raised just before 0:00 is taken away for the whistle and summary; Tea time and Skip break stay tappable; it comes back after', async ({ page }) => {
-      test.setTimeout(120_000);
-      await newbieWithFullStorage(page);
-      await page.evaluate(() => (window as any).__kettle.timer.getState().startFocus({ minutes: 25, intention: 'Storage full' }));
-      await expect.poll(() => hash(page)).toBe('#/focus');
-      await page.waitForTimeout(600);
-      if (await saveWarning(page).isVisible()) await saveWarning(page).click();
-      await ff(page, 70_000);
-      // 4 s before the end, pause and resume: both saves fail → a new warning, up (where it covers nothing) at the end.
-      await toEnd(page, 4000);
-      await page.evaluate(() => {
-        const t = (window as any).__kettle.timer.getState();
-        t.pause();
-        (window as any).__kettle.timer.getState().resume();
-      });
-      if (!vp.touch) await expect(saveWarning(page)).toBeVisible();
-      await sessionClear(page, vp.touch, CONTROLS, 'just before 0:00');
+      // The summary: one line, in the page, says this brew is not saved; Tea time and Skip break stay clear.
+      await toEnd(page, 50);
       await expect.poll(() => hash(page), { timeout: 20_000 }).toBe('#/done');
       await expect(summaryHeading(page)).toHaveText('25 minutes brewed');
-      for (let i = 0; i < 5; i++) {
-        await expect(saveWarning(page)).toHaveCount(0);
-        expect(await hitOk(page, /^Tea time/), `Tea time @${i}`).toBe(true);
-        expect(await hitOk(page, 'Skip break'), `Skip break @${i}`).toBe(true);
-        await page.waitForTimeout(300);
-      }
-      // Leaving the summary: on Today the warning comes (back), floating above "Put the kettle on" (the toast region
-      // lifts above Today's docked start), on every layout.
+      const note = page.getByText('Not saved: storage is full.');
+      await expect(note).toBeVisible();
+      expect(await page.locator('p[data-save-warning]').evaluate((el) => el.getBoundingClientRect().height < 60)).toBe(true);
+      expect(await hitOk(page, /^Tea time/)).toBe(true);
+      expect(await hitOk(page, 'Skip break')).toBe(true);
+      await expect.poll(() => page.evaluate(() => (window as any).__said.length)).toBe(1);
+      const [fromNote] = await Promise.all([page.waitForEvent('download'), page.locator('p[data-save-warning]').getByRole('button', { name: 'Save backup' }).click()]);
+      expect(JSON.parse(readFileSync((await fromNote.path())!, 'utf8')).progress.sessions.some((r: Rec) => r.intention === 'Storage full')).toBe(true);
+
+      // Today: the banner, in the page flow, with "Save backup" reached by Tab in document order.
       await pressAt(page, 'Skip break', vp.touch);
       await expect.poll(() => hash(page)).toBe('#/');
-      const cta = /^Put the kettle on/;
-      await expect(saveWarning(page)).toBeVisible();
-      expect(await hitOk(page, cta), 'Put the kettle on').toBe(true);
-      // Starting the next brew with the warning still up: it never covers the session controls or the readout (on
-      // phones it is taken away for the brew; on wide layouts it may stay, beside the panel)…
-      await pressAt(page, cta, vp.touch);
-      await expect.poll(() => hash(page)).toBe('#/focus');
-      for (let i = 0; i < 4; i++) {
-        await sessionClear(page, vp.touch, CONTROLS, `next brew @${i}`);
-        await page.waitForTimeout(250);
+      await expect(banner(page)).toBeVisible();
+      expect(await inFlow(page)).toBe('in flow');
+      expect(await hitOk(page, /^Put the kettle on/), 'Put the kettle on').toBe(true);
+      await page.locator('#home-greeting').evaluate((h) => {
+        h.setAttribute('tabindex', '-1');
+        (h as HTMLElement).focus();
+      });
+      let reached = false;
+      for (let i = 0; i < 40 && !reached; i++) {
+        await page.keyboard.press('Tab');
+        reached = await page.evaluate(() => !!document.activeElement?.closest('section[data-save-warning]') && document.activeElement?.textContent === 'Save backup');
       }
-      // …and it is there again on Today (the brew ended within its first minute: nothing saved, nothing lost).
+      expect(reached, 'Tab reaches Save backup').toBe(true);
+      // Kept: well past the old 12 s toast, and through a visit to Settings, where it sits beside the backup tools.
+      await page.waitForTimeout(13_000);
+      await expect(banner(page)).toBeVisible();
+      await page.evaluate(() => (window as any).__kettle.navigate('/settings'));
+      await expect.poll(() => hash(page)).toBe('#/settings');
+      await expect(banner(page)).toHaveCount(1);
+      expect(await page.evaluate(() => {
+        const b = document.querySelector('section[data-save-warning]')!;
+        const rows = [...document.querySelectorAll('button')].find((x) => /Reset everything/.test(x.textContent ?? ''))!;
+        return !!(rows.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
+      }), 'right after the backup tools').toBe(true);
+      await page.evaluate(() => (window as any).__kettle.navigate('/'));
+      await expect(banner(page)).toHaveCount(1); // (Settings' own banner leaves with it, as the tabs cross-fade)
+      await expect(banner(page)).toBeVisible();
+      // Saving a backup keeps it (storage is still full); it was said once in all this.
+      const [fromBanner] = await Promise.all([page.waitForEvent('download'), banner(page).getByRole('button', { name: 'Save backup' }).click()]);
+      expect(JSON.parse(readFileSync((await fromBanner.path())!, 'utf8')).progress.sessions.some((r: Rec) => r.intention === 'Storage full')).toBe(true);
+      await page.waitForTimeout(2500);
+      await expect(banner(page)).toBeVisible();
+      expect(await page.evaluate(() => (window as any).__said.length), 'said once').toBe(1);
+
+      // Room again: the next saves go through and the banner goes.
+      await page.evaluate(() => {
+        for (const k of Object.keys(localStorage)) if (k.startsWith('filler')) localStorage.removeItem(k);
+        const k = (window as any).__kettle;
+        k.timer.setState({});
+        k.progress.setState({});
+        k.settings.getState().set({ name: k.settings.getState().name });
+      });
+      await expect(banner(page)).toHaveCount(0, { timeout: 6_000 });
+    });
+
+    test('a banner that appears while Today is open moves nothing under the finger (Mark done with storage full)', async ({ page }) => {
+      test.setTimeout(120_000);
+      // A fresh profile (no seeded history), so the brew below is the last one and its task is offered on Today.
+      await open(page);
+      await startFromHome(page, 'Chapter 3 notes');
+      await ff(page, 3 * MIN);
       await page.evaluate(() => (window as any).__kettle.timer.getState().end('user'));
       await expect.poll(() => hash(page)).toBe('#/');
-      await expect(saveWarning(page)).toBeVisible();
-      const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save backup' }).click()]);
-      const backup = JSON.parse(readFileSync((await download.path())!, 'utf8'));
-      expect(backup.progress.sessions.some((r: Rec) => r.intention === 'Storage full')).toBe(true);
+      const markDone = page.getByRole('button', { name: /^Mark “Chapter 3 notes” done/ });
+      await expect(markDone).toBeVisible();
+      await markDone.scrollIntoViewIfNeeded();
+      await newbieWithFullStorage(page, { seeded: true });
+      await countSaid(page);
+      // The controls round the finger, where they are drawn, frame by frame from the tap on: the task field and its
+      // clear button, just above the "Mark done" line. (Below that line the composer closes up as the line goes, and
+      // whatever follows it, the docked start included where it is not pinned, moves with it: that is Mark done's own
+      // answer, on every revision, not the banner's.)
+      await page.evaluate(() => {
+        const w = window as any;
+        w.__moved = new Set<Element>();
+        const sel = 'main input, main input ~ button';
+        const pos = () => new Map([...document.querySelectorAll(sel)].map((el) => [el, el.getBoundingClientRect().top] as const));
+        let last = pos();
+        const f = () => {
+          if (w.__stopMoves) return;
+          const now = pos();
+          for (const [el, top] of now) if (last.has(el) && Math.abs(last.get(el)! - top) > 0.5) w.__moved.add(el);
+          last = now;
+          requestAnimationFrame(f);
+        };
+        requestAnimationFrame(f);
+      });
+      const field = page.getByRole('textbox', { name: /What are you brewing/ });
+      const fieldTop = (await field.boundingBox())!.y;
+      const box = (await markDone.boundingBox())!;
+      if (vp.touch) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
+      else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
+      await expect(page.getByText('Crossed off. Nice work.')).toBeVisible();
+      await expect(banner(page)).toHaveCount(1);
+      await page.waitForTimeout(800);
+      // What may move is only what sits above the banner (the greeting scrolls up to make room for it); nothing at
+      // or below it (the field next to the finger) moves on screen.
+      const moved = await page.evaluate(() => {
+        const w = window as any;
+        w.__stopMoves = true;
+        const b = document.querySelector('section[data-save-warning]')!.getBoundingClientRect();
+        return [...(w.__moved as Set<Element>)].filter((el) => el.isConnected && el.getBoundingClientRect().top >= b.bottom - 1).map((el) => el.textContent?.trim().slice(0, 24) || el.tagName);
+      });
+      expect(moved, 'controls at or below the banner that moved on screen').toEqual([]);
+      expect(Math.abs((await field.boundingBox())!.y - fieldTop), 'the composer stayed put').toBeLessThanOrEqual(0.5);
+      expect(await inFlow(page)).toBe('in flow');
+      await expect.poll(() => page.evaluate(() => (window as any).__said.length)).toBe(1);
     });
   });
 }
-
```
