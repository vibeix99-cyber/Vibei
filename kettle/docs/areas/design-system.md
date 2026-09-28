# Design system — log & reference

Owner: design-system area. Live gallery: `#/kit?part=ui` (add `&open=sheet|dialog|toast`
to open overlays for screenshots). Contrast audit: `node scripts/contrast.mjs`.

## Using the kit (for other areas)

Import everything from `@/ui`. Don't restyle controls locally; if something is missing,
ask for it (or pass `className` for layout only).

| Component | Key props |
|---|---|
| `Button` | `variant` primary · secondary · soft · ghost · matcha · sky · honey · berry · plum · danger; `size` sm/md/lg; `icon`/`iconRight` (IconName or node); `block`; `loading`; `tone` (for soft/ghost); `sfx` (SfxName or false); `haptics` |
| `IconButton` | `icon`, `label` (required → aria-label + tooltip), `variant` (default ghost), `size`, `tooltip` |
| `Card` / `PressableCard` | `tone` plain·persimmon·matcha·honey·sky·berry·plum; `padding` none/sm/md/lg; `variant` raised/flat/sunken; `as`. PressableCard: `selected`, button props (pair with `role="radio" aria-checked` in pickers) |
| `ProgressBar` | `value` 0..1, `tone`, `height`, `label`, `valueText`, `animateIn`, `shimmer`, `track` |
| `Ring` | `value`, `size`, `thickness` (alias `stroke`), `tone`, `label`, `valueText`, `track` default/glass, children = center |
| `Toggle` | `checked`, `onChange(bool)`, `label` or `aria-labelledby`, `describedBy`, `tone`, `size` |
| `Slider` | `value`, `onChange`, `onCommit`, `min/max/step`, `label`, `hideLabel`, `format`, `showValue`, `tone`, `start`/`end` nodes |
| `Chip` / `ChipGroup` | Chip: `selected`, `tone`, `icon`, `size`. ChipGroup: `label`, `options[{value,label,icon,tone}]`, `value`, `onChange`, `multiple`, `allowEmpty`, `layout` wrap/scroll. Single-select = radiogroup with arrow keys |
| `SegmentedControl` | `label`, `options[{value,label,sublabel,icon}]`, `value`, `onChange`, `size` md/lg, `tone` |
| `Sheet` / `Dialog` | `open`, `onClose`, `title`, `hideTitle`, `description`, `hero` (e.g. `<Mascot pose="concerned"/>`), `footer` (actions: primary first, destructive as `variant="ghost" tone="berry"` below), `variant` auto/sheet/dialog, `size`, `dismissible`, `initialFocus`, `onExited` |
| `toast()` / `<Toaster/>` | `toast(msg, {tone, icon, duration, action, id})`, `toast.success`, `toast.warning`, `toast.dismiss`. `emit('ui:toast', …)` also works. Toaster is mounted in App |
| `SpeechBubble` | `tail` left/top/bottom/right/none, `tailAt`, `tone`, `size`, `arrive`, `live` |
| `Stat` | `icon`, `value` (node — use `<Counter/>`), `label`, `hint`, `tone`, `variant` tile/bare, `size` |
| `ListGroup` / `ListRow` | Group: `title` (overline), `footer`. Row: `icon`, `iconTone`, `label`, `description`, `value`, `onClick` (→ button + chevron), `toggle={{checked,onChange}}`, `trailing`, `stacked`, `danger`, `disabled` |
| `TextField` | `label`, `hideLabel`, `value`, `onChange(string)`, `icon`, `clearable`, `showCount`+`maxLength`, `hint`, `error`, `size` |
| `NumberStepper` | `value`, `onChange`, `min/max/step`, `label`, `unit`, `format`, `size` (spinbutton + hold-to-repeat) |
| `Digits` | `value` string/number, `roll` false/'up'/'down', `label` (SR text), `font`. Fixed-width digit cells — use for every timer |
| `Counter` | `value`, `from`, `duration`, `delay`, `format`, `onTick` (hook `audio.play('streakTick')`), `onDone` |
| `WeekStrip` | `days` (progress `WeekStripDay[]` as-is: `{day,label,state,isToday}`), `size` sm/md/lg, `celebrate` + `delay` (today's dot lights up with a pop + check draw — for the streak-extended card), `tray`, `label` |
| `Pill` / `Tag` | `tone` (+neutral), `icon`, `solid`, `size` |
| `Divider` | `label`, `spacing` |
| `ScreenHeader` / `SectionHeader` | `title`, `subtitle`, `overline`, `onBack`, `actions`, `size` l/m. The title is the page `<h1>` |
| `Tooltip`, `Spinner`, `Kbd`, `Skeleton`, `EmptyState`, `VisuallyHidden` | small bits |
| helpers | `cx`, `useMediaQuery`, `TONES`, types `Tone`, `IconSlot` |

Tokens: `src/styles/tokens.css`. Type utilities: `.t-display-xl/l/m`, `.t-title`,
`.t-headline`, `.t-body`, `.t-body-s`, `.t-caption`, `.t-overline`, `.t-num`, `.t-ink-2/3`.
`data-tone="<tone>"` on any element exposes `--tone`, `--tone-edge`, `--tone-soft`, `--tone-ink`,
`--tone-on`… to CSS. Motion presets: `@/lib/motion` (`spring.*`, `arrive()`, `slideUp()`,
`stagger()`, `pageTransition()`); CSS: `--ease-spring`, `--ease-bounce`, `--dur-*`.
`<html data-motion="reduce|full">` mirrors the effective reduced-motion preference (system
or settings) — use `:global(html[data-motion='reduce'])` in CSS modules.

## Decisions

- **Contrast strategy for white-on-tone buttons.** Tone faces are tuned so white text is ≥ 3:1,
  and button labels are Fredoka 700 at 19px (md) / 21px (lg) — WCAG "large text". `sm`
  buttons (16px) automatically use the deeper `--<tone>-strong` face (≥ 4.5:1). Honey uses
  espresso text. Verified by `scripts/contrast.mjs` (parses tokens.css, both themes).
- **Tone recipe**: face / hi / edge / strong / soft / soft-edge / ink / on for six tones.
  Legacy names (`--paper`, `--oat`, `--surface-edge`, …) remain as aliases.
- **Dark = "plum lamplight"**: warm aubergine surfaces (#241a2d → #2e2339), cream ink,
  a faint warm radial glow from the top-left on the page background.
- **Theme before paint**: inline script in `index.html` + synchronous apply in `theme.ts`;
  runtime switches cross-fade (360ms) unless motion is reduced; `theme-color` follows.
- **Shell**: one `<nav>` restyled per breakpoint (bottom tab bar → landscape icon rail →
  sidebar). Active tab = full-color icon (`Icon tone="color"`) in a persimmon tint pill that
  glides between tabs (shared layout); inactive = mono duotone. Content column max 680
  (720 ≥ 1600). Right rail ≥ 1200 (streak week, goal ring, level, recipes); 900–1199 shows
  a compact status card at the bottom of the sidebar instead.
- **Dialogs** stack actions vertically (primary on top, destructive as a berry text button
  below), matching the brief's no-guilt quit pattern.

## Iterations

### 1 — foundations + kit + shell
- Tokens rewritten (semantic surfaces/text/lines, tone recipe, space/radius/z/motion, CSS
  spring easings via `linear()`), type scale utilities, tones.css, contrast script.
- Built the kit (25+ components) and the gallery. Shell rebuilt (tab bar, sidebar, landscape
  rail, right rail with progress hooks). Toaster mounted + page transition preset in App.
- Review: gallery axe-clean (light/dark × 390/1440). Fixes after review: Digits body font
  weight, ring highlight off by default (read as a double stroke), dialog footer stacked,
  toast text 15px, warmer dark surfaces, rail "today" marker, hollow missed days, friendlier
  Tea Cozy copy, removed a misplaced rail link.

## Open issues / requests
- Home area: `src/screens/home/kit` stand-ins can now be swapped for `@/ui` (SpeechBubble,
  Ring, Chip/ChipGroup, SegmentedControl, Toggle, Slider, NumberStepper, TextField,
  IconButton, ListRow/ListGroup). API diffs: TextField `onChange(value)`; ListRow uses
  `label`/`iconTone` (not `title`/`tone`); ChipRadioGroup → `ChipGroup`; IconButton `size`
  is sm/md/lg.
- Home area: done-recipe reward text (`.questReward` with reduced opacity) fails contrast
  (2.5:1 light, 4.2:1 dark) — use `--ink-3` or `--matcha-ink` without opacity.
- Art area: a `Logo` export would replace the sidebar's `Icon name="kettle"` + wordmark.
