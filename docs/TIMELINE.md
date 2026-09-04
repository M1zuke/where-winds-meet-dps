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

A variant may also carry its own cast length, for an empowered form that
genuinely runs longer or shorter than the skill's own. Every cast's length is
resolved incrementally, in rotation order, against the ledger state built from
every cast laid out before it — never only the rotation's declared opening
state — so a condition only a mid-fight trigger satisfies can still activate a
cast-length override. A cast's own triggers can never affect its own length or
hit set; only what came before it can. Where a skill's several hits each
select an active variant with an override, the first hit in authoring order
decides. Leaving the override unset, or giving it the same placeholder value
`castFrames` itself uses for "not yet measured", both mean no override — never
a value that could move the cast cursor backwards.

### Conditional hits

A hit may carry its own ANDed conditions, gating whether it occurs at all —
unmet, it deals no damage and fires no triggers, exactly as if it were absent
from the cast. This resolves at the same point, and against the same ledger
state, as the cast's own length, so a skill whose real hit count only grows
past some threshold is authored as one hit per real hit, each gated on that
threshold, rather than as a separate module per hit count. A cast's length
must be derived only from the hits that actually occur, never from every hit
the skill could ever land.

## Identity and tags

- **Ids are matched, names are not.** A buff reaches or is triggered by a skill
  or debuff through an id it declares — `receives` / `triggersBuffs` — never a
  display name. Namespaced tags still address the few things that read them
  directly: a mechanic's own scope, an attunement's reach, and a guard picking
  between magnitudes under a single reach. Never make a display name
  load-bearing, and never match a tag or an id by prefix.
- Wherever a tag is still the addressing mechanism, matching is **exact
  membership**. Express a family by giving every member the family tag _as
  well as_ its own — never by one name being a stem of another. A skill may
  then belong to several families, which a prefix cannot express.
- **The breakdown row a cast reports into is authored, not derived.** A skill's
  `breakdownName` is the in-game name its casts are summed under, so the
  engine-level variants of one in-game skill read as a single row; absent or
  blank falls back to the skill's own `name`. It is display text only — nothing
  matches on it, and it changes neither damage nor a cast's own timeline row.
- **A DoT row is named by its debuff, and only by its debuff** — never by the
  skill supplying the tick's coefficients. Absent or blank it falls back to the
  debuff's own `name`. **No marker is appended either way**, so a DoT and the
  cast that applies it report as one row whenever they carry the same name.
- ⚠️ **Three fields name this relationship, and the directions differ.** A
  hit's `triggers` is **outgoing** — what this hit sets off — and is persisted
  user data. A skill's or debuff's `triggersBuffs` is also **outgoing** — the
  buff ids a cast, or every tick of a debuff's `dot`, sets off. A skill's or
  debuff's `receives` is **incoming** — the buff ids that reach it. A buff
  module itself declares neither: it is a policy (`requires`, always-active,
  cooldown, rate limits) and a magnitude, addressed only by the id the skill or
  debuff names.

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
- **A trigger may move one status's stacks onto another** (`transferFrom`): the
  target gains as many stacks as the source holds at that frame, window-aware
  and clamped to the target's cap, and the source is set to 0 at the same frame
  with its windows untouched. Such a trigger ignores its own stack delta and
  never extends; the target write fires the cap payout like any other write,
  and both passes resolve it against the same ledger state.
- **A trigger may be bound to a Qi phase** (`phase`): it fires only when the
  clock-driven phase at its frame — the rotation's Qi-break window and its
  low-Qi lead, never a status — is the named one. A stagger or control state
  the source material gates on is expressed as the `exhausted` phase.
- **A trigger may carry its own cooldown** (`cooldownFrames`): once it fires,
  the same trigger fires again only after that many frames. The first firing
  is never held back, a firing blocked by its conditions or phase does not
  start the cooldown, and every pass counts on its own, so the layout pass
  and the event loop agree.

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
- **A state marker that only exists for some builds declares `requiresParam`.**
  The timeline drops the buff entirely when that param is off, so a condition on
  it never holds and the state cannot be reached. Use it instead of gating each
  trigger site; the requirement belongs on the entity, once.
- **A state marker that only exists from some tier of that param declares
  `requiresMinTier`** next to `requiresParam`, and is dropped below that tier
  exactly as it is when the param is off. It is invalid without `requiresParam`.
- **A buff a rotation may open the fight already holding some of can declare
  its own starting count**, read only when the rotation carries no explicit
  opening entry of its own. Never written back into stored rotation data — a
  rotation saved before the counter existed still opens on the declared
  default, not on zero.
- **A timed buff may clear or reset another status when it lapses**
  (`onExpire`): at the frame a window ends with no other window of the same
  buff covering that frame, the target's stack count is set to the declared
  value. A refresh never fires it, an extension moves the frame it fires at,
  a permanent-activation buff never fires it, and each window fires at most
  once. The reset lands in the layout pass and the event loop alike, so a hit
  variant or cast length gated on the target sees it from that frame on.
- **A buff may count damaging hits** (`stacksPerDamagingHit`): every damaging
  hit from any skill grants one stack, at most once per its cooldown, clamped
  to `maxStacks` and opening the buff's own window. The granting hit's own
  triggers run after the grant.
- **A buff may fire triggers on reaching its cap** (`onMaxStacks`): the stack
  write that takes it from below `maxStacks` to `maxStacks` runs the listed
  `applyBuff`/`applyDebuff` triggers at that frame, conditions and
  extensions honoured, other trigger kinds ignored. A trigger fired this way
  never fires another buff's `onMaxStacks`, and may lower the firing buff
  itself.
- A class may ship built-in buffs alongside the user's own. A same-id user buff
  wins.
- **A DoT is authored on a debuff's `dot`, and nowhere else.** A `sustain`
  skill type is a scaling tag on one hit, not a DoT. Each tick runs through the
  kernel like any hit.
- A stacking DoT's detonation spec is the single source of truth for its
  threshold behaviour — see Triggers above.

### The class-buff system — buff modules

Id-referenced, not tag-matched. A module declares its **activation policy**
(always-active, or gated by `requires`, a cooldown, a rate limit) and its
**magnitude** as effects. Who applies it and who it boosts are declared by the
skill or debuff that owns that direction — `triggersBuffs` for applying,
`receives` for boosting — never by the module itself.

- A debuff's `triggersBuffs` fires on every tick of its `dot`, not once per
  window — the module's own policy (`cooldown`, a rate limit, `triggerPhase`,
  `requiresActiveBuffOnTrigger`, `requires`) gates a tick exactly as it gates a
  cast, so a def that should fire once per application still needs that gate
  authored on the module, not assumed from the trigger site.
- ⚠️ **A buff a debuff's tick applies reaches the tick that applied it, every
  later tick (of the same or a different debuff), a mechanic's own extra event,
  and the chips of any cast resolving after it — but never a regular hit.** That
  last one is an ordering limit, not a scope one: the main hit-damage pass runs
  before the tick pass, so a regular hit is scored before any tick has applied
  anything, and even an `affectsAll` def is skipped there. Do not declare
  `triggersBuffs` on a debuff expecting it to boost a regular hit.
- A def a class reaches purely by being that class goes on the class. A def an
  inner way gates goes on that inner way. A def that applies across every class,
  or is gated on a global toggle, goes on the global or group list. Getting this
  wrong changes which Skill Editor section the row appears in, not just where
  the file lives.
- Where a def's effects cannot be read without executing them, it must carry an
  author-written summary — the catalog and the display gates read the
  declarative fields without running anything.
- **One id declared as both a ledger gate and a module is one entity in two
  projections.** The gate side carries no effects, so a cast chip takes its
  effects from the module side; only the module may author a magnitude, and the
  gate's `requiresParam` must match the module's own requirement or the state
  opens for a build the module never reaches.

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
6. Giving a status: a hit trigger (editor system) or a `requires`-gated
   module, applied by the skill's own `triggersBuffs`, or by every tick of a
   debuff's `dot` via the debuff's own `triggersBuffs` (class-buff system).
   Links to a stacking DoT stay logic-free.
7. Receiving: the skill or debuff lists the buff's id in its own `receives`.
8. **No invisible magic** — the effect is a data-driven def visible in the Skill
   Editor. Extend the schema rather than branching in the timeline.
9. Verify: locked fixtures stay bit-exact, and add or extend a test. The
   calculation rules have no cached anchor, so reason about them explicitly.
