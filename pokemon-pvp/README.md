# Poké Arena — local PvP battle simulator

A complete two-player, hot-seat Pokémon-style battle simulator. No adventure, no
exploration, no CPU opponent — just two humans, two randomized Level 100 teams
and a full turn-based battle system.

Plain HTML/CSS/JS with no build step, no dependencies and no image assets: every
creature is drawn procedurally on a canvas.

## Play

Open `index.html` in any modern browser — it runs straight off the filesystem.

```
xdg-open pokemon-pvp/index.html      # Linux
open pokemon-pvp/index.html          # macOS
start pokemon-pvp\index.html         # Windows
```

## How a match works

1. **Title** — pick the format (1v1 / 3v3 / 6v6), whether picks are hidden, and text speed.
2. **Team preview** — both randomized teams with stats and movesets. Reroll until you like them.
3. **Battle** — Player 1 chooses, the screen curtains over, Player 2 chooses, then the
   turn resolves for both. Repeat until one side has no Pokémon left.

With *Hide picks* on (the default) a curtain screen appears before each player's
turn, so neither player sees the other's order before it's locked in. Turn off
*Hide picks* for a faster open-screen game.

### Controls

| Input | Action |
| --- | --- |
| Mouse / touch | Click anything |
| `1`–`4` | Pick a move (or a bench slot in the switch menu) |
| `S` | Open the switch menu |
| `Esc` | Back out of the switch menu |
| `↑` `↓` `←` `→` | Browse buttons |
| `Enter` | Confirm / advance the curtain |
| `Space` | Skip ahead through battle text |

## Battle mechanics

Modelled on the mainline games (Gen IV+ conventions):

- **Level 100, 31 IVs, 85 EVs across the board, neutral natures** — real base stats,
  so a Snorlax is a wall and an Alakazam is glass.
- **Damage** `((2·L/5+2)·Power·Atk/Def)/50 + 2`, then critical hit (×1.5, 1/16 base
  rate), a 0.85–1.00 random roll, STAB (×1.5) and the **full 18-type chart**.
- **Physical / special split** — physical moves use Atk vs Def, special use SpA vs SpD.
- **Status**: burn (chip + halved physical attack), poison, badly poison (escalating),
  paralysis (¼ chance to lose the turn, halved Speed), sleep, freeze — each with
  the usual type immunities. Fire attacks thaw a frozen target.
- **Volatiles**: confusion, Leech Seed, flinching, Protect (with the consecutive-use
  failure chance).
- **Stat stages** from −6 to +6 with the standard multipliers; critical hits ignore
  the attacker's drops and the target's boosts.
- **Turn order** by priority bracket, then effective Speed, with a random tiebreak.
  Switches always resolve first. Sucker Punch really does fail if the target
  isn't attacking.
- **PP tracking**, accuracy checks, recoil, draining moves and Struggle when a
  Pokémon runs dry.
- Fainting forces a replacement; a side loses when its whole team is down.

## Roster

29 species, each with real base stats, correct typing and a four-move set drawn
from a 58-move pool. Every move in the pool is on at least one Pokémon, and every
species in a match is unique, so no mirror matchups.

## Files

```
index.html        screens and layout
css/style.css     all styling
js/data.js        types, type chart, moves, species
js/engine.js      battle rules — pure logic, emits an event list per turn
js/sprites.js     procedural creature renderer
js/ui.js          stage rendering, animations, menus, turn loop
js/main.js        boot and menu wiring
```

`js/engine.js` has no DOM dependency: `new Battle([teamA, teamB]).resolveTurn([a1, a2])`
returns the events for a turn, which the UI replays as animation and text.
