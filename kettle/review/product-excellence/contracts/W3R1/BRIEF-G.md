# Maker G: Settings and shared controls (I11) (budget 2.5 h)

Read `PLAN.md` first. Its ownership, glossary and rules bind you. References: K09 (`live-settings.jpg`), K01, B08; I11 in `PRODUCT_EXCELLENCE_PLAN.md` / `MASTER_EVIDENCE_MATRIX.md`.

## Items

1. **Consistent shared controls.** First inventory the controls and their tokens (Button, IconButton, Chip/ChipGroup, SegmentedControl, the Toggle/Switch in `Misc`, ListRow, NumberStepper, Pill, Card). Then make focus-visible, disabled, pressed/active and hover states consistent across them, using the existing tokens.
   - Keyboard focus is always visible and meets contrast in light and dark.
   - Disabled controls read as disabled and are not focusable as actionable.
   - Pressed and selected states are distinct.
2. **Settings preferences** (theme, rhythm, motion, sound, plus 3D and shortcuts as they exist) keep their current persistence and reset behaviour. Prove each with a reload, and with "Reset everything" in a disposable profile.
3. **Honest copy for sound and notification limits:** what sound can and cannot do, for example when the tab is hidden or the device is silent, and what the app's notifications can and cannot do on this platform. Say only what the code actually does; read `src/audio/**` and `src/pwa/**`, which are not yours to edit.
4. **Warm-days wording in your files**, per the glossary: the Daily goal footer in `SettingsScreen.tsx` ("Your warm streak only needs one brew a day…"), the reset text in `DataSection.tsx` ("…your brews, warm streak, leaves…"), and the `ui/Gallery.tsx` strings.

**Don't:** add settings, change the palette or fonts, add chrome, or edit `ui/Sheet.*`, `ui/Stat.tsx`, `ui/Toast*`, `ui/InlineUndo.tsx`, `ui/moment.ts` or `ui/WeekStrip.tsx` (other owners').

## Proof

- **Controls first:** each inconsistency shown on base :5478.
- **REFERENCE (K09) → BEFORE → AFTER** at full size: 390×844, 375×667, 844×390 and 1440×900, light and dark, 100 % and 200 %. Show Settings top to bottom, plus a control-state sheet: focus, disabled, pressed and selected for each shared control on the screens that use them (Today's composer, Settings, the session controls).
- **Suites:** tsc; vitest; a new `tests/w3-settings.spec.ts` (persistence and reset, keyboard focus visibility); the full chromium suite if time allows.

**Hard stop:** 12:45 UTC. Then write `contracts/W3R1/G-READY-FOR-REVIEW.md` in your worktree.
