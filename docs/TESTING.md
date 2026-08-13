# TESTING.md — test conventions

`pnpm test` runs vitest (jsdom, globals on, a shared setup file). **A red suite on
`main` is not a state this repo tolerates.**

## Class scoping — a class's numbers are defended only by an anchor

`bellstrikeUmbra` and `stonesplitStrength` are validated (CLASSES.md). A passing
sweep over a class that has no anchor reads as validation it has not had.

- **Do not add an all-classes `dps > 0` sweep.** It proves nothing and
  manufactures false confidence.
- Registry and metadata tests that legitimately span every **registered** class
  stay. The unregistered reference classes are not additional ids for these to
  iterate.
- A registered class earns damage tests only through a **real anchor** — a
  verified rotation and a measured figure, asserted exactly. That anchor, not a
  smoke test, is what lets `ClassDef.validated` become true.
- A scoped test file says so in a header comment.

## Locked fixtures assert _unchanged_, never _right_

Two fixtures pin behaviour wholesale: one over the engine's whole result for a set
of builds, one over the buff engine and the registry underneath it, across every
registered class with every gated param forced on.

Read the distinction carefully, because it is what allows them to exist alongside
the rule below:

- They do **not** assert the engine is _right_. Those numbers have no external
  authority.
- They assert it is _unchanged_. Any diff means the change under review moved
  output, and that has to be intended and explained.

**Regenerate only when a change to output is deliberate**, with the re-baseline and
its justification in the same commit as the change that caused it. A silent
re-baseline defeats the entire point. Figures a user verified against the running
app are spelled out separately from the generated fixture, so a re-baseline cannot
quietly carry them along — keep any such block outside the regenerated data.

The all-class fixture is allowed to span every registered class for the same
reason: it asserts the registry is unchanged, not that any class's damage is right.

## Otherwise, no locked-DPS assertion

Beyond those fixtures, **no test asserts an absolute DPS number**, and the default
build is not an anchor. Do not introduce a strict-equality DPS assertion without a
verified external source behind it.

The parity comparison against a verified live build uses intentionally **loose,
re-centered bands around what the engine actually produces** — the engine still
lands short. **Do not tighten the bands** until a term-by-term reconstruction
closes the gap. The rate-conversion assertion in that file _is_ exact and must stay
green.

## Calculation rules

The four unconditional rules (CALCULATION.md) have **no cached anchor**. Their only
guard is directional — it asserts the sign and shape of a change, not a value. If
you touch the penetration, DoT or rate-resistance branches, that is the file that
has to be convinced.

## The architecture guards

A guard test exists for each invariant the generalization work depends on, and they
assert properties of the code rather than of a build:

- no class, inner way or skill named under `src/engine`, no display-name literal
  comparison, no cast-tag prefix matching
- no class module reaching the panel or registry layer, and every module marked as
  class-owned listed by an actual owner
- a **fictional** class registering each extension point from outside the engine
  and being picked up — every id in it fictional, so no shipped class can see it
- each registration entry point called only from its owner registry and its own
  definition site; nothing self-registers
- content modules importing no barrel-loading registry, and every exported factory
  hoisted rather than `const`-bound — otherwise the failure is a load-order crash
- every scope and trigger entry namespaced and naming a tag some built-in carries,
  so a typo fails the suite instead of silently reaching nothing
- the `src/data` ↔ `src/definitions` boundary in both directions (CLASSES.md)
- `docs/**` naming no content and carrying no dates (CLAUDE.md § "Docs are
  implementation rules")

These legitimately span every registered class, which the scoping rule above
permits for registry and metadata tests. **Adding an invariant means adding its
guard** — an invariant only prose enforces is one that rots.

## Writing a new engine test

- Prefer a behavioural assertion — this buff raises that skill's damage, this
  cadence emits N ticks — over a magic number.
- When a magic number is unavoidable, cite where it came from.
- **Name the file after the mechanic, not the fix.** No dates, no bug numbers.
- Prefer encoding a constraint in the **test name** over a comment.
- No Chinese anywhere in `tests/` (CLAUDE.md § "Language").

## Migration tests

Every step in `src/migrations/` ships with a test in `tests/migrations/`.
Migrations are the one kind of code neither the type checker nor the rest of the
suite can protect: a broken step corrupts real saved builds silently.

1. **Test against a real captured profile**, named for the version it was captured
   at, one test file per fixture. A hand-written literal contains only the fields
   you remembered, so it cannot catch a step that drops the one you forgot.
2. **Assert the fixture is genuinely pre-change**, in its own test, before
   anything else. Fixtures drift; a repo-wide replace rewrites one without
   noticing and every other test keeps passing while covering nothing. The fixture
   is data under test, not scaffolding.
3. **Prove the step did the work.** The hydrator repairs values on every load, so a
   test that writes a blob, loads, and checks the result may be measuring the
   hydrator. Call the step **directly**, then separately pin that it is registered
   and that the chain reaches it. Verify by deleting the step from the registry and
   re-running: **if the test still passes, it is not testing the migration.**
4. **Then test the full path end to end** — direct calls prove the transform, not
   that it is wired in. Assert the upgraded blob was persisted at the latest
   version, so the chain runs once rather than on every load.
5. **Assert the user's build survived**, comparing against the fixture rather than
   hardcoded constants: identity, gear inventory and equipped set, panel stats,
   every selected inner way, and that the build still produces damage with no
   missing-rotation warning. **A field your step does not claim to touch must come
   out identical.**
6. **Assert by kind of change**: a renamed field arrived at its new home _and_ the
   old key is gone; a renamed id **exists** among the built-ins (an unknown id is
   skipped silently and only shows up as quietly lower damage); a narrowed
   allowlist cleared the illegal value and left a legal neighbour alone; a changed
   unit converted the number rather than merely being present.
7. **Never delete an old fixture.** Each exercises every hop from its own version
   up, which is the only coverage proving a multi-step walk composes. Expectations
   grow cumulatively — when a later step changes a field an older fixture asserts,
   update the expectation, never the stored data.
8. **Assert idempotency both directions** — load/save/load is identical, an
   already-migrated blob passes through unchanged, and the step does not mutate its
   input.
9. **Chain behaviour is tested once, not per step** — old, missing, garbage and
   future versions, a throwing step, a non-array store. Do not re-test them per
   migration.

⚠️ **A test that constructs `Inputs` literals bypasses the hydrator** and will not
catch a too-aggressive migration silently changing the default build.

## Worker tests

Worker compute functions get **direct-call parity tests** — call the compute
function and the direct path, assert they agree. **Never spin up a real worker in
vitest.**

## CI and lint

CI gates, in order: format check, lint, the English-only grep guard, typecheck,
build, test. There is no deploy job.

**Zero warnings is the gate** — including unused disable directives. The patterns
that used to warn were removed **structurally**: derived render values instead of
state resets in effects, context and hook modules split out of provider modules,
memo declarations ordered before their readers. Reintroducing one is fixed the same
way — **not** with a disable directive and **not** with a suppressions baseline.
