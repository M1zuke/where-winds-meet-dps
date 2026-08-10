# MIGRATIONS.md — healing saved profiles

How to write a localStorage migration. **Whether you need one** is decided by
CLAUDE.md § "localStorage migrations" — that check runs on every change and is
not optional. This file is the *how*.

Two sibling files cover the rest: `PROFILE-MIGRATIONS.md` is how the version
chain itself behaves, `MIGRATION-TESTS.md` is how to test a step.

## Where user data lives

Three keys, each with its own `VERSION` constant in `src/storage.ts`:

| key | holds |
| --- | --- |
| `wwm.profiles` | saved profiles — `Inputs` + gear inventory (`PROFILES_VERSION`) |
| `wwm.customRotations` | user-authored rotations (`CUSTOM_VERSION`) |
| `wwm.inputs` | legacy single-build blob, auto-rolled into a default profile on first load (`VERSION`) |

## What counts as "affects saved profiles"

Much wider than adding a field. Any of these needs a migration:

- A field **added to / removed from** `Inputs`, `GearPiece`, `MindMethodSlot`,
  `Rotation`, `Skill`, `Buff`, `Debuff`, … (the classic additive case).
- A field **renamed**, or its unit / meaning / valid range changed.
- **A data-file allowlist narrowed** — trimming `allowedMindMethods`, gear
  words, sets, arsenals, tags, rotations or talents in `src/data/*.json`. A
  stored profile can still hold the removed value and keep scoring it while the
  UI no longer offers it: an invisible, wrong contribution. Precedent: the
  mind-method allowlist pass in `hydrateInputs()` (`allowedInnerWaysForClass`).
- **A new invariant enforced only in the UI** — e.g. "an inner way can't be
  equipped twice". The dropdown enforces it going forward; a profile saved
  before it still violates it. Enforce it in the hydrator too, or it isn't an
  invariant.
- **A default changed** in a way that stored blobs should follow.
- **An id scheme changed** — see `migrateSeededSkillIds`,
  `migrateDotStandinOverrides`, `migrateEntityId` / `migrateClassId`, and
  `migrateSetId` (`Inputs.set` display name → id, V8) for value-level repair
  precedents. `migrateSetId` is also the precedent for a value repaired in
  **both** places at once: a versioned step for `wwm.profiles`, and the same
  pure function called unconditionally inside `hydrateInputs` for the legacy
  `wwm.inputs` blob, which has no version chain of its own.
- **A field became derived** — it must stop being persisted, and any stored
  blob still carrying it needs the stale copy stripped. Precedent:
  `V6__dropDerivedStats` / `withoutDerivedStats` dropping the resolved stat
  fields off `Inputs` once `withDerivedStats` started recomputing all of them.

## Two kinds of change — pick the right one

**1. Additive, with a sensible default** (a new optional field on `Inputs`,
`GearPiece`, `MindMethodSlot`, …) — extend the relevant hydrate helper in
`storage.ts` to inject the default. **Do NOT bump the version.** Existing blobs
keep working, and the hydrator must be idempotent so it can run on every load.

- For `Inputs` and anything nested inside it (`inventory`, `equipped`, future
  fields): extend `hydrateInputs()`. It already walks each `GearPiece` in
  `inventory`, so per-piece defaults go in that map.
- For `Rotation` fields: add a similar hydrate pass in `loadCustomRotations()`,
  *before* the `.filter(isRotation)` validation (`isRotation` lives in
  `engine/rotation.ts`) — otherwise a rotation missing the new field is silently
  dropped instead of healed. `migrateRotationIds` is the existing precedent in
  that chain.

**2. Incompatible** (renaming a field, changing a unit, removing a load-bearing
field, switching a stat from yellow → white, …) — bump the version constant
(`CUSTOM_VERSION` / `VERSION`) and add a one-line entry to the version-history
comment block at the top of `storage.ts`. Older blobs are dropped on load and
the user falls back to defaults. For `wwm.profiles` there is no
version-history comment block to edit and no dropping — `PROFILES_VERSION` is
derived from the `src/migrations/` registry, so add a `V<n>__…` step there
instead (see `PROFILE-MIGRATIONS.md`); the chain never deletes a profile.
Don't try to silently auto-convert across an incompatible shape change in the
other two stores — better to lose stale data than to corrupt it.

**Rule of thumb:** if a single-line default makes existing blobs behave
correctly under the new code (e.g. `relayed: false` on legacy gear pieces),
it's additive. Otherwise it's incompatible. **Prefer additive** — a version bump
throws away the user's gear inventory, so reach for it only when the shape
genuinely can't be healed.

## Every migration must be

- **Idempotent** — it runs on every single load, so running it twice must equal
  running it once.
- **Non-throwing** — a corrupt or unrecognised value must degrade (skip that
  slot, fall back to a default), never break the whole load. Note `getSchool`
  **throws** on an unknown `classId`; hydration-path code must use a tolerant
  lookup like `allowedInnerWaysForClass` instead.
- **Tested** — see TESTING.md § "Migration tests" for the required shape.
- **Conservative about deleting** — clear the one field that is now illegal;
  don't discard neighbouring user data to be safe.
- **Checked against the default build** — `hydrateInputs` runs on
  `defaultInputs` via `makeDefaultProfile`, so a too-aggressive migration can
  silently change the app's default build. Tests that construct `Inputs`
  literals bypass the hydrator and will **not** catch this.

Tests don't catch a *missing* migration — the symptom is a user opening a stale
localStorage and seeing crashes or silently wrong numbers. That's why the
CLAUDE.md check is on you, every time.
