---
name: design-loop
description: Takes a goal and a real-world reference, extracts what actually makes the reference good, then runs a builder and three fresh-context critics on every piece until all three agree ours wins. Use this whenever the user wants a hero asset to be genuinely great rather than merely finished — a landing page, a flagship carousel, a title animation, a pitch deck — and especially when they name something to beat ("make it as good as Linear's homepage", "match this reference", "keep iterating until it's better than X"). Triggers on "/design-loop", "design loop", "run the critic loop", "loop this against", "critique until it wins".
---

# Design Loop

Claude has taste. It cannot judge its own work — the context that builds a piece is the context that grades it, a chef reviewing their own restaurant. Five stars, every time. This method moves the judging into fresh contexts that never saw the work being made. Parallel agents buy speed; fresh context buys the result.

Adapted from the Gauntlet Loop, invented by Matt Shumer.

Four phases: interview, preflight, teardown, loop. Do not skip ahead. Do not start building during phases 1 to 3 — the whole method depends on having a checkable bar before the first pixel exists.

## Phase 1: Interview

Ask exactly these three, together, then stop and wait.

1. What are you building, and how long or how big?
2. Name something that already does this brilliantly. A site, a video, a doc, anything I can open. If nothing comes to mind, say skip.
3. Any files I should work from? Design system, brand doc, script, existing draft.

If they name something vague ("Apple's website", "good SaaS design"), push once for the specific page or file. A vague bar is the number one reason this method fails: the critic invents a comparison and approves everything on round one.

If they say skip on question 2, propose three candidate bars, one line each on why, and wait. If they do not answer, take the hardest one.

## Phase 2: Preflight

A check, not a question. Run it before any work and report in one block.

- Fetch the bar now. Screenshot the URL or read the file. If it is blocked or missing, say so and ask for another.
- Confirm you can render our output: screenshots for a site, a filmstrip of frames for animation, a PDF render for a doc. No render means no craft critic.
- Name any generation tools the goal needs (image, video, voice) and confirm they are connected.
- Confirm the input files exist: `design-system.md`, brand doc, script.

Then print: what is working, what is missing, and **which critic goes blind** if something is missing. Never carry on quietly with a critic that cannot see — a blind critic passes everything, and one silent pass makes the other two look like consensus.

## Phase 3: Teardown

Read the reference properly and write 5 to 7 mechanisms to `bar.md`.

Mechanisms, not adjectives. Adjectives are unfalsifiable; measurements are not. "Feels premium" gives a critic nothing to check, so it checks nothing and approves. These are useful:

- headline is 5x body size, three type sizes total
- one accent colour, used at most twice per screen
- motion always resolves in one direction
- nothing animates for under 400ms
- whitespace above the fold is at least 40% of the frame

| Useless | Checkable |
| --- | --- |
| Feels premium | Headline is 5x body size |
| Clean and modern | Three type sizes total, no more |
| Good use of whitespace | Whitespace above the fold ≥ 40% of frame |
| Strong visual hierarchy | One accent colour, max twice per screen |

Every line must be something a critic can check by looking. Show `bar.md` to the user before continuing.

## Phase 4: Loop

Split the goal into the smallest pieces that can be improved and judged on their own. You choose the pieces. Keep it to three or four unless told otherwise, because every extra piece multiplies the run.

For each piece: fan out a builder, then three critics, each with fresh context and no knowledge of how the builder worked.

- **Brief critic** judges against the stated goal only. Does it do the thing? Ignore aesthetics.
- **System critic** judges against `design-system.md` only. Objective adherence.
- **Craft critic** judges against `bar.md` and rendered output only. Put ours next to the reference blind with labels stripped, say which is better, name the single biggest gap.

Write each critic's brief yourself, adapted to this specific goal. Do not reuse generic wording across different goals — "does it hit the brief" means something different for an animation than for a pricing page.

### Model tiering

The three roles are fixed so they never converge into one opinion. Tier the models to match what each is actually doing:

| Critic | Judges against | Model | Why |
| --- | --- | --- | --- |
| Brief | The stated goal only, ignoring aesthetics | Sonnet | Simple judgment, no vision needed |
| System | `design-system.md` only | Haiku | Mechanical adherence checking |
| Craft | `bar.md` and rendered frames, never the code | Strongest available | Never downgrade this one. A cheap craft critic approves everything and the loop dies on round one. |

### Rules

- Critics are harsh. Praise is not useful.
- Critics judge rendered output, never the code. Reading the implementation makes a critic evaluate intent instead of result — it starts grading what you meant.
- Binary verdicts, not scores. Scores drift upward every round.
- All three must pass. Any fail goes back to the builder with the single biggest gap named.
- No fixed round count. The exit is winning, or the user stopping the run.

Keep a live progress page updating as work evolves: piece status, each critic's verdict, gap history, round count.

## Cost

This is genuinely token-hungry — every round is a build plus three judgments. Reserve it for the hero asset: the landing page, the flagship carousel. Not the whole site.

There is no reliable self-reported token cost, so do not pretend to show one. Show round count and elapsed pieces instead.

If the user names a ceiling, treat it as a checkpoint: pause and ask before continuing past it. Tell them plainly that the real brake is them watching and stopping the run. In order of what actually works: the user watching and stopping it, capping pieces to three or four, and their weekly limit as the hard stop.

## What breaks this

- A vague bar. By far the most common failure.
- The builder judging its own work. Critics need fresh context.
- A soft critic. Binary job, not a score.
- A fixed round count. The exit is winning.
- Over-specifying. Every extra instruction is one fewer decision the model makes with its own judgment.

The one thing to remember: a critic that shares memory with the builder is grading its own homework. Everything else here is detail.
