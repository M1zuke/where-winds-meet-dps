# MIGRATIONS.md — healing saved profiles

How to write a localStorage migration, and how the version chain behaves.
**Whether you need one** is CLAUDE.md § "localStorage migrations" — that check runs
on every change and is not optional. How to test one is TESTING.md § "Migration
tests".

Saved profiles are the one part of this app that cannot be regenerated. A user's
gear inventory, panel stats and rotation exist nowhere else. Every rule here
follows from that.

## Where user data lives

Three stores, each with its own version constant: saved profiles (inputs plus gear
inventory), user-authored rotations, and a legacy single-build blob that is rolled
into a default profile on first load.

## What counts as "affects saved profiles"

Much wider than adding a field. Any of these needs a migration:

- A field **added to or removed from** any persisted shape — the classic additive
  case.
- A field **renamed**, or its unit, meaning or valid range changed.
- **A data allowlist narrowed** — trimming the inner ways, gear words, sets,
  arsenals, tags, rotations or talents a class may use. A stored profile can still
  hold the removed value and keep scoring it while the UI no longer offers it: an
  invisible, wrong contribution.
- **A new invariant enforced only in the UI.** The control enforces it going
  forward; a profile saved before it still violates it. Enforce it in the hydrator
  too, or it is not an invariant.
- **A default changed** in a way stored blobs should follow.
- **An id scheme changed** — repair the value, and repair it in **both** places when
  a store has no version chain of its own: a versioned step for the chained store,
  and the same pure function called unconditionally in the hydrator for the one
  without.
- **A field became derived** — it must stop being persisted, and any stored blob
  still carrying it needs the stale copy stripped.

## Two kinds of change — pick the right one

**1. Additive, with a sensible default.** Extend the relevant hydrate helper to
inject the default. **Do not bump the version.** Existing blobs keep working, and
the hydrator must be idempotent because it runs on every load.

For a rotation field, add the hydrate pass **before** the validation filter —
otherwise a rotation missing the new field is silently dropped instead of healed.

**2. Incompatible** — renaming a field, changing a unit, removing a load-bearing
field. For the two version-counter stores, bump the constant and add a line to the
version-history block; older blobs are dropped and the user falls back to defaults.
**Do not** try to silently auto-convert across an incompatible shape change there —
better to lose stale data than to corrupt it.

**For saved profiles there is no dropping.** That version is derived from the
migration registry, so add a step instead.

**Rule of thumb:** if a single-line default makes existing blobs behave correctly
under the new code, it is additive. Otherwise it is incompatible. **Prefer
additive** — a version bump throws away the user's gear inventory.

## The profile chain

A stored profiles blob carries a version and is walked **up one version at a
time** until it reaches the latest, then hydrated and re-saved at the new version
so the walk happens once rather than on every load. The latest version is
**derived from the registry**, never written by hand.

### Rule 1 — a profile is never deleted

Not for being too old, too new, unversioned, corrupt, or for tripping a bug in a
migration:

| situation                       | behaviour                                            |
| ------------------------------- | ---------------------------------------------------- |
| no step registered for a hop    | stepped over, blob kept                              |
| a step throws                   | caught; the pre-step blob carries forward            |
| version missing or not a number | treated as `0`, walked from the bottom               |
| version **newer** than we know  | returned untouched — a downgrade must not shred data |
| the store is not an array       | preserved as-is for the caller to salvage            |

The only paths that fall back to a fresh default are "nothing stored" and "the JSON
does not parse" — cases with nothing to recover. Hydration runs after the chain and
fills defaults for anything a step left unreadable, **so a step never has to delete
a field to make it safe**.

### Rule 2 — one hop per file

`V<n>__<whatItDoes>.ts`, exporting a migration whose target is `<n>`, migrating a
blob at `n - 1` to `n` and **nothing else**. Register it in the chain array; order
and the name/target match are asserted.

### Rule 3 — steps are pure and idempotent

Return a new blob; never mutate the input. Running a step twice must equal running
it once, because the chain is not the only caller — imported profiles and the
legacy blob reach the same transforms through the hydrator.

**Prefer carrying a value to its new home before dropping the old key** rather than
deleting and re-defaulting.

### Rule 4 — every step ships with a test against a real captured profile

TESTING.md § "Migration tests" is the required shape.

### Scope

The chain covers saved profiles only. The other stores carry their own version
counters, heal through their hydrators, reuse the transforms a step exports, and
still drop on version mismatch.

## Every migration must be

- **Idempotent** — it runs on every load.
- **Non-throwing** — a corrupt or unrecognised value degrades (skip that slot, fall
  back to a default) and never breaks the whole load. Beware lookups that **throw**
  on an unknown id; hydration-path code must use a tolerant one.
- **Tested** — TESTING.md § "Migration tests".
- **Conservative about deleting** — clear the one field that is now illegal; do not
  discard neighbouring user data to be safe.
- **Checked against the default build** — the hydrator runs on the default profile,
  so a too-aggressive migration can silently change the app's default build.

Tests do not catch a _missing_ migration. The symptom is a user opening a stale
localStorage and seeing crashes or silently wrong numbers. That is why the
CLAUDE.md check is on you, every time.
