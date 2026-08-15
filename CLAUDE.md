# CLAUDE.md

Default working agreement for this repository.

These workflows are adapted from the [superpowers](https://github.com/obra/superpowers)
plugin by obra. They apply by default, without being asked for. Direct user
instructions override anything here.

---

## 0. Workflow Selection (do this first)

**Before any response or action — including clarifying questions, reading files,
or checking git — decide which workflow below applies and say so out loud:**
"Using brainstorming to scope this."

Process workflows come first and set the approach; implementation follows.

- "Let's build X" / "add a feature" / "change behavior" → **Brainstorming**, then Writing Plans
- "Fix this bug" / a test fails / something behaves oddly → **Systematic Debugging**, then TDD
- Implementing anything → **Test-Driven Development**
- About to claim something is done / passing / fixed → **Verification Before Completion**

These thoughts mean you are rationalizing your way out of a workflow, and mean STOP:

| Thought | Reality |
|---|---|
| "This is just a simple question" | Questions are tasks. Pick a workflow. |
| "I need more context first" | Workflow selection comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | The workflow tells you HOW to explore. |
| "This is too small for the process" | Small things become big. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |

---

## 1. Brainstorming (before any creative work)

Use before creating features, building components, adding functionality, or
modifying behavior — anything that produces new code.

> **HARD GATE:** Do NOT write code, scaffold, or take any implementation action
> until you have told the user what you intend and they have approved it. The
> ceremony scales with the task; **the approval gate never does.**

### Classify the request first, and announce the classification

- **Spike** — a feasibility question ("can we…", "is it possible…", "quick and
  dirty is fine"). Output is an answer, not code you keep. Present the question
  and probe plan in 2–3 sentences, get a nod, investigate as cheaply as
  correctness allows, report a recommendation. Anything built is labeled
  throwaway.
- **Bounded** — a well-scoped change to a flow that **already exists in this
  repo**: a new flag, a small endpoint, a one-file fix. Familiarity with the
  kind of app is not enough; if there is no existing flow to change, it is not
  bounded. Ask the clarifying questions that matter, present a short design
  **in chat**, and STOP until you hear yes. No spec file, no plan document.
- **Architectural** — new projects, new subsystems, changes that restructure how
  components fit together or alter interfaces others depend on. Full process
  below.

When in doubt between two paths, take the heavier one. The ratchet is one-way:
hidden complexity discovered mid-task upgrades the path — stop and say so.
Nothing downgrades mid-task.

### Architectural path checklist

1. **Explore project context** — files, docs, recent commits.
2. **Ask clarifying questions** — one per message, multiple choice when possible.
   Focus on purpose, constraints, success criteria.
3. **Propose 2–3 approaches** — trade-offs, lead with your recommendation and
   why. YAGNI ruthlessly.
4. **Present the design in sections** — architecture, components, data flow,
   error handling, testing. Scale each section to its complexity. Ask after each
   section whether it looks right.
5. **Write the design doc** to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
   and commit it.
6. **Spec self-review** — scan for placeholders/TBDs, internal contradictions,
   scope creep, and requirements that could be read two ways. Fix inline.
7. **User reviews the spec** — "Spec written and committed to `<path>`. Please
   review it before we write the implementation plan." Wait for approval.
8. **Transition to Writing Plans.** That is the *only* next workflow.

### Design principles

- Break the system into units with one clear purpose, well-defined interfaces,
  and independent testability. For each: what does it do, how is it used, what
  does it depend on?
- If someone can't understand a unit without reading its internals, or you can't
  change internals without breaking consumers, the boundaries need work.
- Prefer smaller focused files. A file growing large is a signal it does too much.
- In existing code: follow established patterns, include targeted improvements to
  code you're already working in, and don't propose unrelated refactoring.
- If the request spans multiple independent subsystems, say so immediately and
  decompose into sub-projects. Each gets its own spec → plan → implementation cycle.

### Red flags

| Thought | Reality |
|---|---|
| "Too simple to need a design" | Simple means a short design, not no design. |
| "I'll call it bounded and skip the spec" | Reaching for a label to skip work IS the doubt. Take the heavier path. |
| "The design is obvious — I'll start while they read it" | The gate is the approval, not the design's length. |
| "I know this kind of app, so it's bounded" | Bounded measures the repo, not your familiarity. |
| "The spike works, so I'll keep the code" | Keeping it is a new request. Re-classify. |
| "It grew, but I'm almost done" | Hidden complexity upgrades the path. Stop and say so. |
| "They approved the spike, so the follow-up is approved" | Each task gets its own approval. |

---

## 2. Writing Plans (spec → implementation plan)

**Announce:** "I'm using the writing-plans workflow to create the implementation plan."

Write the plan assuming the implementer is a skilled developer who knows nothing
about this codebase, toolset, or problem domain, and doesn't know good test
design. Document everything: exact files, exact code, how to test. DRY, YAGNI,
TDD, frequent commits.

**Save to** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`.

### Before defining tasks: map the file structure

Which files get created or modified, and what each is responsible for. One clear
responsibility per file. Files that change together live together — split by
responsibility, not by technical layer.

### Task right-sizing

A task is the smallest unit that carries its own test cycle and is worth a fresh
reviewer's gate. Fold setup, config, scaffolding, and docs into the task whose
deliverable needs them. Split only where a reviewer could reject one task while
approving its neighbor. Each task ends with an independently testable deliverable.

Each **step** within a task is one action, 2–5 minutes: write the failing test /
run it and watch it fail / write minimal code / run tests / commit.

### Plan header

```markdown
# [Feature Name] Implementation Plan

**Goal:** [one sentence]
**Architecture:** [2-3 sentences]
**Tech Stack:** [key technologies]
**Spec:** [path to the design doc this plan implements]

## Global Constraints
[project-wide requirements — version floors, dependency limits, naming and copy
rules, platform requirements — one line each, values copied verbatim from the spec]
```

### Task structure

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Interfaces:**
- Consumes: [what this uses from earlier tasks — exact signatures]
- Produces: [exact names, parameter and return types later tasks rely on]

- [ ] **Step 1: Write the failing test**  ```<actual test code>```
- [ ] **Step 2: Run it and verify it fails** — Run: `<cmd>` Expected: FAIL with "<message>"
- [ ] **Step 3: Write minimal implementation** ```<actual code>```
- [ ] **Step 4: Run it and verify it passes** — Run: `<cmd>` Expected: PASS
- [ ] **Step 5: Commit** ```git add … && git commit -m "…"```
````

### No placeholders — these are plan failures

- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" without the actual test code
- "Similar to Task N" — repeat the code; tasks get read out of order
- Steps that say what to do without showing how
- References to types, functions, or methods not defined in any task

### Self-review after writing the plan

1. **Spec coverage** — point to a task for each spec requirement. Add tasks for gaps.
2. **Placeholder scan** — hunt the patterns above. Fix them.
3. **Type consistency** — `clearLayers()` in Task 3 and `clearFullLayers()` in
   Task 7 is a bug. Signatures and names must match across tasks.

Fix inline and move on. Then hand off for execution, reviewing between tasks.

---

## 3. Test-Driven Development (all implementation)

**Core principle:** If you didn't watch the test fail, you don't know if it tests
the right thing.

```
THE IRON LAW: NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Wrote code before the test? **Delete it and start over.** Don't keep it as
reference, don't "adapt" it while writing tests, don't look at it. Implement
fresh from the tests.

Applies to new features, bug fixes, refactoring, and behavior changes. The only
exceptions — throwaway prototypes, generated code, config files — require asking
the user first. Thinking "skip TDD just this once"? That's rationalization.

### Red → Green → Refactor

**RED — write one minimal failing test.** One behavior, clear name describing
that behavior, real code rather than mocks unless mocks are unavoidable. If the
name has "and" in it, split the test. Before writing it, name the production
change that would make it fail.

**Verify RED — MANDATORY, never skip.** Run the test. Confirm it *fails* (not
errors), that the failure message is the expected one, and that it fails because
the feature is missing — not because of a typo. Passes immediately? You're
testing existing behavior; fix the test.

**GREEN — simplest code that passes.** No extra options, no speculative
parameters, no "improving" surrounding code.

**Verify GREEN — MANDATORY.** Run it. Test passes, other tests still pass,
output pristine — no stray errors or warnings. If it fails, fix the code, not
the test.

**REFACTOR — only once green.** Remove duplication, improve names, extract
helpers. Keep tests green, add no behavior.

### Test quality

- Assert on real behavior, never on mock behavior.
- Keep test-only code in test utilities, out of production classes.
- Understand a dependency's side effects before mocking it.
- One thing per test. The name describes the behavior, and demonstrates the API
  you wish existed.

### Rationalizations

| Excuse | Reality |
|---|---|
| "Too simple to test" | Simple code breaks. The test takes 30 seconds. |
| "I'll test after" | Tests written after pass immediately, which proves nothing. |
| "Tests after achieve the same goals" | Tests-after answer "what does this do?"; tests-first answer "what should this do?" |
| "Already manually tested" | Ad-hoc, unrepeatable, no record of coverage. |
| "Deleting X hours is wasteful" | Sunk cost. Keeping code you can't trust is the waste. |
| "Keep as reference, write tests first" | You'll adapt it. That's testing after. |
| "Need to explore first" | Fine — throw the exploration away, then start with TDD. |
| "Hard to test = unclear design" | Listen to the test. Hard to test = hard to use. |
| "TDD will slow me down" | Shortcuts mean debugging in production. |
| "Existing code has no tests" | You're improving it. Add them. |

### When stuck

| Problem | Solution |
|---|---|
| Don't know how to test it | Write the wished-for API. Write the assertion first. Ask. |
| Test too complicated | Design too complicated. Simplify the interface. |
| Must mock everything | Code too coupled. Use dependency injection. |
| Setup is huge | Extract helpers. Still complex? Simplify the design. |

### Checklist before calling implementation done

- [ ] Every new function has a test
- [ ] Watched each test fail before implementing
- [ ] Each failed for the expected reason
- [ ] Minimal code written to pass
- [ ] All tests pass, output pristine
- [ ] Real code used; mocks only where unavoidable
- [ ] Edge cases and errors covered

Can't check all boxes? You skipped TDD. Start over.

---

## 4. Systematic Debugging (any bug or unexpected behavior)

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

Symptom fixes are failure. Use this for test failures, bugs, unexpected
behavior, performance problems, build failures, and integration issues —
*especially* under time pressure, when "one quick fix" seems obvious, or when
previous fixes didn't work.

**Phase 1 — Root cause investigation, before proposing any fix:**

1. **Read the error carefully** — full stack trace, line numbers, paths, codes.
   It often contains the exact solution.
2. **Reproduce consistently** — exact steps, every time? If not reproducible,
   gather more data instead of guessing.
3. **Check recent changes** — git diff, recent commits, new dependencies, config
   and environment differences.
4. **Instrument component boundaries** in multi-component systems — log what
   enters and exits each component, verify config propagation, check state at
   each layer.

Only after root cause is identified: fix the cause, and write a failing test that
reproduces the bug first (TDD applies). Never fix a bug without a test.

---

## 5. Verification Before Completion (before any success claim)

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it
passes.

**The gate:** identify the command that proves the claim → run it fresh and in
full → read the whole output and the exit code → confirm it actually supports the
claim → only then state the claim, *with* the evidence. Skipping a step is lying,
not verifying.

| Claim | Requires | Not sufficient |
|---|---|---|
| Tests pass | Test output showing 0 failures | A previous run, "should pass" |
| Linter clean | Linter output, 0 errors | A partial check |
| Build succeeds | Build exit 0 | Linter passing |
| Bug fixed | Original symptom re-tested, passes | Code changed, assumed fixed |
| Regression test works | Red-green cycle verified: write → pass → revert fix → MUST FAIL → restore → pass | It passed once |
| Agent completed | Diff shows the changes | The agent reported success |
| Requirements met | Line-by-line checklist against the plan | Tests passing |

**Stop if you catch yourself:** using "should" / "probably" / "seems to";
saying "Great!", "Perfect!", or "Done!" before verifying; about to commit, push,
or open a PR without verification; trusting a subagent's success report;
or wanting the work to be over because you're tired.

This applies to exact phrases, paraphrases, synonyms, and anything that merely
*implies* success.

---

## 6. Git & branches

- Never start implementation on `main`/`master` without explicit user consent.
- Commit frequently, at the task boundaries the plan defines.
- Commit design docs and plans as they're written.
- Verify (section 5) before committing, pushing, or opening a PR.
