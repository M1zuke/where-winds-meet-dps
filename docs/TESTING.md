# TESTING.md — test conventions

`pnpm test` runs vitest (jsdom, globals on, `tests/setup.ts`). Today: **722 tests
across 75 files**, all green. Keep it that way — a red suite on `main` is not a
state this repo tolerates.

## Class scoping — the suite is Umbra-only

Only `bellstrikeUmbra` is implemented and validated (CLASSES.md). Tests that
asserted another class's damage, skills, rotations or DoT behaviour were removed
on 2026-08-02, because a passing sweep reads as validation those classes have
not had.

- **Do not add a `for (const classId of ALL_CLASSES)` `dps > 0` sweep.** It
  proves nothing and it manufactures false confidence.
- Registry / metadata tests that legitimately span all eight stay — `getSchool`,
  inner-way slot rules, the i18n pass-through.
- When a class is genuinely built out, add its tests back **with real anchors**
  (a verified rotation, a known damage figure), not a smoke sweep.
- Scoped test files carry a header comment saying so; follow the existing
  wording (`// Scoped to Bellstrike Umbra — see CLASSES.md`).

## The engine baseline — a refactor guard, not a correctness anchor

`tests/engine/engineBaseline.test.ts` + `engineBaseline.fixture.json` pin the
**entire `Result`** — dps, total, duration, every per-skill row, and a SHA-256
digest over the whole object including `timeline`, `buffWindows` and `casts` —
for 24 Bellstrike Umbra builds. It exists for `docs/GENERALIZATION.md`: a
refactor that claims to preserve behaviour has to be able to prove it.

Read the distinction carefully, because it is the whole reason this file is
allowed to exist alongside the rule below:

- It does **not** assert the engine is *right*. Those numbers have no external
  authority whatsoever.
- It asserts the engine is *unchanged*. Any diff means the change under review
  moved output, and that has to be intended and explained.

Regenerate with `UPDATE_ENGINE_BASELINE=1 pnpm test`, and **only** when a change
to the output is deliberate — the re-baseline and its justification belong in
the same commit as the change that caused it. A silent re-baseline defeats the
entire point.

The `profile-v7 anchor` block at the bottom of that file is spelled out
separately from the fixture on purpose: those are the figures a user verified
against the running app, so a re-baseline cannot quietly carry them along.

## Otherwise, there is no locked-DPS fixture

Beyond the baseline above, no test asserts an absolute DPS number.
`defaultInputs` (`engine/defaults.ts`) is the default Bamboocut-Wind build, not
an anchor. Don't introduce a new strict-equality DPS assertion without a
verified external source behind it.

`tests/engine/bellstrikeUmbraParity.test.ts` compares against one verified
live-site build. Its DPS bands are an intentionally **loose, re-centered fit
around what the engine actually produces** — the engine still lands short of the
site. **Do not tighten the bands to the site's numbers** until a term-by-term
reconstruction closes the gap. The white→yellow rate-conversion assertion in
that file *is* exact and must stay green.

## Calculation rules

The four unconditional rules (CALCULATION.md § "Calculation rules") have **no
cached anchor**. Their only guard is `tests/engine/damageRules.test.ts`, which
is **directional** — it asserts the sign and shape of a change, not a value. If
you touch `penFrac`, `dotRules` or `rateRes`, that file is the one that has to
be convinced.

## Migration tests

Every migration needs two cases (MIGRATIONS.md lists the other requirements):

1. A **pre-change blob** fed through `hydrateInputs` (or the relevant loader),
   asserting the healed result.
2. An **already-correct blob**, asserting it round-trips unchanged — this is
   what proves idempotence.

Live in `tests/storage.test.ts` and `tests/migrations/`. Follow the header
convention: `// Additive, no version bump — see MIGRATIONS.md`.

⚠️ **Tests that construct `Inputs` literals bypass the hydrator** and will not
catch a too-aggressive migration silently changing the default build.

## Worker tests

Worker compute functions get **direct-call parity tests** — call the compute
function and the direct path, assert they agree. **Never spin up a real `Worker`
in vitest.** `tests/engine/dpsWorkerOffload.test.ts` is the pattern.

## Writing a new engine test

- Prefer a behavioural assertion (this buff raises that skill's damage; this
  cadence emits N ticks) over a magic number.
- When a magic number is unavoidable, say in a comment where it came from.
- Name the file after the mechanic, not the fix (`bleedCadence`, not
  `bugfix-2026-08`).
- No Chinese anywhere in `tests/` — CLAUDE.md § "Language" applies here exactly
  as it does to `src/`.

## CI and lint

`.github/workflows/ci.yml` runs on every push to `main` and on every pull
request. It gates, in order: `format:check`, `lint`, the English-only grep
guard, `typecheck`, `build`, `test`. There is no deploy job — `pnpm run deploy`
stays manual and local.

`pnpm run lint` is `eslint . --max-warnings 0` against a flat config
(`eslint.config.mjs`): `@eslint/js` recommended, `typescript-eslint`
recommended (non-type-checked), `eslint-plugin-react-hooks`
recommended-latest, `eslint-plugin-react-refresh` vite. The config carries **no
severity overrides** for the react-hooks / react-refresh rules, so
`react-hooks/set-state-in-effect`, `react-hooks/preserve-manual-memoization`
and `react-refresh/only-export-components` run at the plugins' preset
`error`, and `react-hooks/exhaustive-deps` at the plugin's preset `warn`.

**Zero warnings** is the gate — that includes unused `eslint-disable`
directives, which ESLint reports as warnings under this flat config. The
patterns that used to warn (state resets inside worker-offload effects,
provider modules that also export a hook, React Compiler bailouts from
out-of-order `useMemo` declarations) were removed structurally: derived render
values instead of state resets in effects, context/hook modules split out of
provider modules, memo declarations ordered before their readers. Reintroducing
one of these must be fixed the same way — not with a disable directive and not
with a suppressions baseline.

`typecheck` and `build` still type-check with TypeScript **7** via the `tsc`
binary. `typescript` in `node_modules` resolves to the TS 6 API package
because `typescript-eslint` cannot load against TS 7 yet; `tsc` itself comes
from the `@typescript/native` alias.
