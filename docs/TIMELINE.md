# TIMELINE.md — rules for authoring a skill, trigger, buff or debuff

Rules an authored skill, trigger, buff or debuff must satisfy. The simulation's
control flow is `src/engine/timeline.ts` — read it there, not here. Which system
a mechanic belongs in is BUFFS.md; the damage math is CALCULATION.md.

Per-skill behaviour that is genuinely not reconstructable from the module gets a
short comment **in that module**, never a section here (CLAUDE.md § "Docs are
implementation rules").

## Coefficients

A skill is a sequence of hits, each carrying its own damage shape — phys and
attribute multipliers, phys and attribute flat damage — plus its `frame` offset
on the 60 fps grid. Rules:

- Set every coefficient on the hit, put each hit at its real `frame`, and set
  `castFrames` (0 derives it from the last hit).
- `skillType` selects the boost bucket and the sustain branch. Tag a skill
  `sustain` only if it genuinely wants sustain routing.
- `attributeAttack` must name the attribute path that gets the elevated
  multiplier, or be empty.
- `weaponOrAttribute` is the lookup key into the weapon or mystic-category boost
  map. A skill whose key resolves to neither takes no typing boost.
- `elevatedAttributeMultiplier` **defaults true**. Set it false **only** for a
  real DoT tick. Ticks authored on a debuff's `dot` get it automatically.
- `guaranteedPrecision` forces effective precision to 1; crit and affinity still
  roll. `guaranteedNormal` means the hit can trigger none of crit, affinity or
  abrasion and always deals the normal row.
- **Identifiers are English only** (CLAUDE.md § "Language").

### Hit variants

A hit may carry buff-gated alternative coefficient rows. The first variant whose
conditions all hold replaces the hit's four coefficients; nothing else is
affected, and no match leaves the hit's own row untouched. **This is how an
empowered form is authored** — never with a per-skill branch in the timeline.

## Identity and tags

- **Ids are matched, names are not.** A modifier reaches a skill through
  namespaced tags only. Never make a display name load-bearing, and never match
  a tag by prefix.
- Matching is **exact membership** for both directions. Express a family by
  giving every member the family tag _as well as_ its own — never by one name
  being a stem of another. A skill may then belong to several families, which a
  prefix cannot express.
- **The breakdown row a cast reports into is authored, not derived.** A skill's
  `breakdownName` is the in-game name its casts are summed under, so the
  engine-level variants of one in-game skill read as a single row; absent or
  blank falls back to the skill's own `name`. It is display text only — nothing
  matches on it, and it changes neither damage nor a cast's own timeline row.
- **A DoT row is named by its debuff, and only by its debuff** — never by the
  skill supplying the tick's coefficients. Absent or blank it falls back to the
  debuff's own `name`. **No marker is appended either way**, so a DoT and the
  cast that applies it report as one row whenever they carry the same name.
- ⚠️ **Two fields are named for triggering, in opposite directions.** A hit's
  `triggers` is **outgoing** — what this hit sets off — and is persisted user
  data. A buff-def's `triggeredBy` is **incoming** — the casts that set it off.

## Triggers

A trigger names a kind, a target id, a stack delta and optional conditions.
Rules:

- Negative stacks **consume**.
- Conditions are ANDed; a trigger fires only when all of them hold.
- Every condition clause is **window-aware**: it reads 0 stacks when the target
  status has no active window at that frame, even when its stack history holds a
  nonzero value from before it expired. DoT stack accrual deliberately reads the
  raw, non-window-aware count instead, because a DoT's live stacks must persist
  independently of any other status's window. Do not unify the two.
- Ordering matters: a trigger that applies the very status gating it must be
  applied **last**, or it gates itself.
- A trigger that enqueues another skill's hits must not form an unbounded chain.
- Extending an already-active window is a distinct operation from opening a
  fresh one. Do not emulate one with the other.

**Linking to a stacking DoT is logic-free.** The kinds that add a stack and that
flag a detonation carry no thresholds of their own: the max stacks, the shared
duration, and the detonation rule (which skill, how many stacks retained, at
what build tier) live entirely on the target debuff. Never re-author any of it on
the trigger. A detonation flag without a sibling application on the same hit is
inert by design.

## Buffs and debuffs — two systems

Both end as `{statKey, amount}` effects. BUFFS.md decides which you want; these
are the authoring rules for each.

### The editor system — buffs, debuffs and hit triggers

Data-driven and user-authorable, injected at the app boundary and **never read
from storage inside the engine**, so locked fixtures stay byte-exact.

- A buff helps the player and applies onto the same `Inputs` fields the panel
  uses. A debuff is enemy-facing: target-scope reductions and/or a DoT.
- **A buff with no stat effects is legitimate.** A pure state marker that a hit
  variant or a trigger condition reads must still exist as a real buff, so it is
  visible in the Skill Editor and tracked on the cast timeline — never a bare
  engine constant.
- A class may ship built-in buffs alongside the user's own. A same-id user buff
  wins.
- **A DoT is authored on a debuff's `dot`, and nowhere else.** A `sustain`
  skill type is a scaling tag on one hit, not a DoT. Each tick runs through the
  kernel like any hit.
- A stacking DoT's detonation spec is the single source of truth for its
  threshold behaviour — see Triggers above.

### The class-buff system — buff modules

Tag-matched, not id-referenced. A module declares **who applies it**
(`triggeredBy` cast tags, or always-active, gated by `requires`), **who it
boosts** (`affects` tags, a property, weapon types, exclusions), and its
**magnitude** as effects.

- A def a class reaches purely by being that class goes on the class. A def an
  inner way gates goes on that inner way. A def that applies across every class,
  or is gated on a global toggle, goes on the global or group list. Getting this
  wrong changes which Skill Editor section the row appears in, not just where
  the file lives.
- Where a def's effects cannot be read without executing them, it must carry an
  author-written summary — the catalog and the display gates read the
  declarative fields without running anything.

## Procedural behaviour

A skill with genuinely procedural behaviour registers a **factory** against its
id rather than being special-cased in the loop. Factories, not instances — state
such as a charge counter must not carry between simulations. A per-hit art patch
is the **only** sanctioned art-level adjustment, and it comes from a behaviour or
a mechanic, never from a branch in the loop.

The status ledger and the buff engine are **two stores on purpose**: the ledger
calls a status active if any recorded window covers the frame, the engine goes by
the latest apply at or before it, so a shorter re-apply _shortens_ the buff.
Writing the engine's applies into the ledger would silently extend every buff
shaped that way. Merging them needs a per-status policy — a design decision, not
a refactor.

## Checklist

1. English identifiers only.
2. Coefficients, frames and `castFrames` set per hit.
3. `skillType` correct — it selects the boost bucket and the sustain branch.
4. `elevatedAttributeMultiplier` left default except on a real DoT tick.
5. DoTs on a debuff's `dot`, never faked with a `sustain` hit.
6. Giving a status: a hit trigger (editor system) or a `requires`-gated module
   with `triggeredBy` (class-buff system). Links to a stacking DoT stay
   logic-free.
7. Receiving: the skill declares the exact tags the buff names.
8. **No invisible magic** — the effect is a data-driven def visible in the Skill
   Editor. Extend the schema rather than branching in the timeline.
9. Verify: locked fixtures stay bit-exact, and add or extend a test. The
   calculation rules have no cached anchor, so reason about them explicitly.
