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
- `elevatedAttributeMultiplier` **defaults true** on every row, DoT ticks
  included. Set it false only when a hit has its own reason to take the
  non-matching coefficient — doing so demotes the row's flat attribute term
  along with its coefficient, never one without the other.
- `neverAbrades` removes the abrasion outcome: the mass that would have abraded
  deals the normal row. Precision, crit and affinity chances are unchanged — a
  hit that fails precision still cannot crit. `guaranteedNormal` means the hit
  can trigger none of crit, affinity or abrasion and always deals the normal
  row.
- Every authored `frame` and `castFrames` is the nominal 60 fps value,
  regardless of `startLatency`. A skill's `startLatency` states how its start
  relates to the server: waiting for the round trip (the default), skipping
  that wait only in dummy mode, or never waiting because the step is not a
  real skill request. The engine adds the resolved start latency ahead of a
  cast and quantises every cast's start, length and hit offset to the input
  frame rate on top of the authored data — never baked into a skill module.
- **Identifiers are English only** (CLAUDE.md § "Language").
- **Every hit and every damage-over-time tick carries a Qi rate** (`qiRate`,
  a flat channel `qiFlat`), read by the Qi bar rather than by the HP-damage
  kernel — docs/CALCULATION.md § "Qi damage". Absent means rate 1, flat 0, the
  in-game default. **An echo release deals no Qi**, whatever its own debuff's
  rate: it is a banked payout, not a fresh damage event.

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

A variant may also carry its own `frame`, replacing the hit's own when active —
for a hit whose landing time itself shifts under the gating buff, not only its
coefficients. The active variant is chosen against the ledger state at the
cast's own start, the same timing the cast-length override above already
uses, so the choice never depends on the hit's own not-yet-resolved landing
frame. Every reader of a hit's frame — validation, storage seed/import/
hydrate, layout and the damage pass — resolves it through the one function
that applies this override; none reads the hit's bare `frame` field directly.

### Projectile hits

A hit may declare itself a projectile: its own `frame` is when it launches,
and its actual landing frame is that launch frame plus the live target
distance divided by a constant travel speed, converted to frames — never a
fixed offset, since a farther or already-closer target lands later or
sooner. The distance read is the one target-distance simulation every other
reader of it uses, resolved at the same point a hit variant's own override
is. A ceiling on travel time bounds it independently of the target's
distance, for a projectile with its own limited lifetime. Every reader of a
hit's frame carries this the same way it carries a variant's own override —
resolving through the one function, never a fixed value baked in separately.

### Conditional hits

A hit may carry its own ANDed conditions, gating whether it occurs at all —
unmet, it deals no damage and fires no triggers, exactly as if it were absent
from the cast. This resolves at the same point, and against the same ledger
state, as the cast's own length, so a skill whose real hit count only grows
past some threshold is authored as one hit per real hit, each gated on that
threshold, rather than as a separate module per hit count. A cast's length
must be derived only from the hits that actually occur, never from every hit
the skill could ever land.

A hit may instead (or in addition) gate on rotation structure rather than
ledger state, with `requiresNextStepSkillIds`: it occurs only when the
rotation step immediately following this cast names one of the listed
skills — a cast whose own animation keeps running, and so keeps landing
hits, only because nothing before that next input interrupted it. Unlike an ordinary condition this is never true for the rotation's own last
step, and it is meaningless on a `castSkill`-generated cast, which has no
rotation step of its own to look ahead from — author it only on a hit a real
rotation step lands directly. Such a hit may also carry its own
`castFramesWhenGated`, overriding the skill's own `castFrames` for that cast
the same way an active hit variant's own `castFrames` would — read only when
this hit is among the ones that actually occurred, never derived from a hit
that did not land.

### Condition clauses

A condition — on a hit, a variant, a cast (`castConditions`) or a trigger — is
one of three shapes, evaluated by one shared function everywhere a condition
is checked: a status stack threshold (a buff or debuff id, a comparison and a
stack count — `gte`/`gt`/`eq`/`lte`/`lt`); a build param, with an optional
minimum tier, the same pair a trigger's own
`requiresParam`/`requiresMinTier` reads; or an OR-group of further clauses of
either shape, recursively, holding when at least one member does. An
OR-group's members are never individually restricted to only one of the
other two shapes.

### Cast legality

A skill may carry its own ANDed ledger conditions (`castConditions`), checked
once at layout time, at the same point and against the same incrementally
built ledger state as a conditional hit. A step whose conditions fail is
flagged and reported, never removed or reshaped: it still lays out, lands
every hit its skill has and fires every trigger, exactly as it would if the
conditions had held — the flag changes nothing about the simulation, only
what gets reported alongside it. A `castConditions` entry never carries
`source: "buffEngine"` — the same restriction as a hit's or a variant's own
conditions. This flags a rotation step only — a `castSkill`-generated cast
skips straight to its own hits, unflagged.

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
- **A weapon or mystic-category boost and a class-specific attunement's
  `attune:` tag reach every hit of the skill that carries it — there is no
  per-hit override.** A cast whose hits are reached unevenly is authored as
  two skills sharing one `breakdownName`, the tag only on the one whose hits
  are actually reached, the other's hits summoned from the first through a
  `castSkill` trigger at the right frame offset — never a tag scoped to one
  hit inside a single skill.
- **A summoned hit counts as a hit for every hit-driven schedule** — proc
  mechanics, the layout ledger a later step's conditions read — the same as a
  laid one. A `castSkill` trigger's own hits are not a separate category from
  the rotation's own once they land; see CALCULATION.md § "Mechanic rules" for
  the proc side of this.
- **"Every damage-over-time row" is a structural check, not a tag list.** A
  DoT tick's synthetic skill carries `isDotTick`; a mechanic that must reach
  every such row tests that field, never a role tag or an enumerated list of
  them — a list silently stops matching the row it was written for once that
  row is retyped, and never grows to cover one added later.
- **The breakdown row a cast reports into is authored, not derived.** A skill's
  `breakdownName` is the in-game name its casts are summed under, so the
  engine-level variants of one in-game skill read as a single row; absent or
  blank falls back to the skill's own `name`. It is display text only — nothing
  matches on it, and it changes neither damage nor a cast's own timeline row.
- **Only a hit that deals damage reports into the breakdown.** A hit whose
  coefficients and flat adds are all zero exists to carry triggers; it still
  fires them and still lands on the cast timeline, but it adds neither a count
  nor a row, so a grant-only cast has no breakdown row at all.
- **A pre-pull cast sets up; it never lands.** Its hits fire their `triggers`
  and the cast fires its `triggersBuffs`, and it sits on the cast timeline at
  negative frames — but it adds nothing to the total, the breakdown or an echo
  bank, whatever its coefficients say, and its frames stay out of the duration.
- **A rotation step performs every hit its skill has.** A step names a skill and
  nothing else; a cast cut short is authored as its own skill carrying only the
  hits it lands, never as a count on the step.
- **A rotation may fix its own window** (`fixedWindowSec`): the run then lasts
  exactly that long, and DPS divides by it. Casts shorter than the window are
  followed by idle time in which every status keeps its own schedule — a
  damage-over-time effect still up keeps ticking and still counts. A cast that
  runs past the window keeps only the hits inside it, for damage and for the
  triggers and status writes those hits make alike; nothing outside the window
  fires, scores or opens a window. The cast length is still reported beside the
  run length, and a rotation with no window is exactly as long as its casts.
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
- **A skill's own `triggersBuffs` may delay one of its listed ids to a fixed
  frame of that cast** (`triggersBuffsAtFrame`, keyed by buff id), in place of
  granting it at the cast's own start. This is per grant site — scoped to the
  one skill that declares it — unlike a buff module's own
  `buffAppliesAfterSec`, which shifts every grant of that module alike
  regardless of which skill fired it. An id absent from the map keeps granting
  at the cast's start; the grant still belongs to that cast for display
  purposes.

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
- A status the player only gains once the granting cast is over opens at that
  cast's end, declared on the trigger. Never emulate it by moving the trigger to
  a later hit: a hit's frame is where it lands, not where a window starts, and a
  cast's end is usually past every hit it has.
- **A trigger may open its own grant at a length other than the target
  status's own** (`durationFrames`): that grant's window uses it in place of
  the status's declared duration, for that grant alone.
- **A trigger may move one status's stacks onto another** (`transferFrom`): the
  target gains as many stacks as the source holds at that frame, window-aware
  and clamped to the target's cap, and the source is set to 0 at the same frame
  with its windows untouched. Such a trigger ignores its own stack delta and
  never extends; the target write fires the cap payout like any other write,
  and both passes resolve it against the same ledger state.
- **A trigger may be bound to a Qi phase** (`phase`): it fires only when the
  Qi schedule's phase at its frame — the simulated bar's own break and low-Qi
  span in the default mode, the fixed clock window in manual mode, never a
  status — is the named one. A stagger or control state the source material
  gates on is expressed as the `exhausted` phase.
- **A trigger may require a build-level param and tier** (`requiresParam`,
  `requiresMinTier`): it fires only while the build carries that param, and at
  or above that tier when given — the per-trigger counterpart of a status's
  own `requiresParam`/`requiresMinTier`, for a build requirement that gates
  one trigger rather than the whole status.
- **A build-level param may be sourced from whichever gear set is equipped**,
  not only from a slotted inner way: a gear set may declare its own param,
  set true only while that set is the one equipped, read by a trigger's
  `requiresParam` or a condition exactly like an inner way's own param — the
  class-buff engine's own set gate reaches a module only, never a hit-level
  trigger or condition, which is what this exists for.
- **Only a `castSkill` trigger's condition may read the class-buff engine
  instead of the status ledger** (`source: "buffEngine"` on a
  `TriggerCondition`): the two are separate stores (see § "Procedural
  behaviour"), and gating a generated cast on a class-buff module's active
  window — something the ledger never records — sets this on its condition
  rather than duplicating that module as a ledger status. Every other
  trigger kind keeps reading the ledger; authoring `source: "buffEngine"` on
  one is invalid. A buff-engine-sourced condition only sees a module granted
  through that module's own `triggersBuffs`/`receives` wiring at the frame it
  is checked — one granted through `stackOnDamage` is not yet recorded when
  the generated-cast walk that decides whether to spawn the cast runs, since
  that walk finishes before damage hits are folded into the buff engine.
- **A trigger may carry its own cooldown** (`cooldownFrames`): once it fires,
  the same trigger fires again only after that many frames. The first firing
  is never held back, a firing blocked by its conditions or phase does not
  start the cooldown, and every pass counts on its own, so the layout pass
  and the event loop agree. That cooldown may itself shrink with every blocked
  attempt since the last firing (`cooldownDecayFramesPerAttempt`), down to a
  floor (`cooldownFloorFrames`) it never crosses; both are ignored without
  `cooldownFrames`. A trigger may also name a `cooldownGroup`: every trigger
  carrying the same group string, on any hit or skill, shares one cooldown
  clock — a trigger with no group is scoped to itself.
- **A trigger may release a debuff's echo** (`releaseEcho`): everything the
  target debuff has banked since its last release is dealt at that hit's frame
  as one event on the echo's own row. It carries no share and no name — both
  live on the debuff — and an empty pot deals nothing. A re-application
  without it refreshes the mark and keeps banking; a pot no trigger releases
  is dealt when the debuff's coverage lapses, and never after the rotation
  ends.
- **A trigger may close a status window outright** (`clearStatus`): the
  longest window covering this frame ends at this frame and the stack count
  resets to 0, the same write a cooldown-marker grant undoes when a separate
  event resets it early. It reads its own `condition`/`conditions`, `phase`
  and `requiresParam` exactly as every other trigger kind does; a status with
  no window covering this frame is left alone.

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
- **A state marker that stops existing from some tier up instead declares
  `requiresMaxTier`** next to `requiresParam` — the mirror of `requiresMinTier`,
  for a mechanic a later tier replaces outright rather than builds on. Untiered
  reads as tier 0, so a max-tier-only marker still exists for a build that
  never slotted the param at all; the two may combine into one tier band.
- **A buff whose stack cap itself grows with a build param's tier declares
  `maxStacksByTier`** (a param and a tier-to-cap table) instead of hardcoding
  the largest cap: resolved once per run against the build, the highest
  threshold at or below the param's own tier wins, and below every threshold
  the buff's authored `maxStacks` stands. Independent of `requiresParam` — the
  buff may exist unconditionally while only its cap scales.
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
  variant or cast length gated on the target sees it from that frame on. It
  may also declare `requiresBuffId`: the reset only lands if that other
  status has a live window at the same frame. When that status is absent the
  lapse resets nothing, unless `elseStacks` is set, in which case it resets to
  that value.
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
- **A debuff may bank an echo** (`echo`): while one of its windows is active,
  every scored damage event a def feeds into it — a regular hit, a DoT tick or
  a mechanic's extra event — banks `share` of its realised damage. A release
  deals the banked sum as it stands: never re-run through the formula, never
  rolled, reported under the echo's own `breakdownName` and `skillType`, and
  only from events inside the rotation window. The echo may also declare a
  release-time adjustment: a factor applied once to the released total, read
  against the target's state at the release frame rather than at banking
  time.
- A class may ship built-in buffs alongside the user's own. A same-id user buff
  wins.
- **A status may carry a `description`**: one line of display text the cast
  chip shows under the name, rendered through the locale catalogue like every
  other name. Nothing matches on it, and it is never a substitute for an
  effect a module should author.
- **A DoT is authored on a debuff's `dot`, and nowhere else.** A `sustain`
  skill type is a scaling tag on one hit, not a DoT. Each tick runs through the
  kernel like any hit.
- **A `dot` may declare `directHit`**: its pulse is a direct hit rather than a
  damage-over-time tick, so the row carries no `isDotTick` flag, takes no
  DoT-only effect, and reaches no sustain routing.
- A stacking DoT's detonation spec is the single source of truth for its
  threshold behaviour — see Triggers above.

### The class-buff system — buff modules

Id-referenced, not tag-matched. A module declares its **activation policy**
(always-active, or gated by `requires`, a cooldown, a rate limit) and its
**magnitude** as effects. `duration` and `cooldown` may each be a function of
the build rather than a fixed number, for a policy whose length genuinely
depends on a build param's tier; `maxStacks` may be one too, but — the
params being fixed for the whole run — it resolves once at registration
rather than being re-read on every query. Who applies it and who it boosts are
declared by the skill or debuff that owns that direction — `triggersBuffs`
for applying, `receives` for boosting — never by the module itself.

- A debuff's `triggersBuffs` fires on every tick of its `dot`, not once per
  window — the module's own policy (`cooldown`, a rate limit, `triggerPhase`,
  `requiresActiveBuffOnTrigger`, `requires`) gates a tick exactly as it gates a
  cast, so a def that should fire once per application still needs that gate
  authored on the module, not assumed from the trigger site.
- **A module granted from several cast tags may gate each one differently**
  (`grantRequires`, keyed by the granting cast's own tag) **instead of a single
  `requires`** — the two are mutually exclusive on one module. A tag present
  in the map uses its own requirement, the same shape `requires` itself takes,
  an armor set included, for that one grant; a tag the map does not mention
  grants with no gate at all, unless the map carries the reserved
  `GRANT_REQUIRES_DEFAULT` key, checked last — that key's requirement then
  applies to every source none of the other keys matched, so an untagged or
  mis-authored source still cannot grant an unslotted param's buff. A key may
  also name any tag the granting skill carries, not only its own cast tag — a
  tag family several skills share reads one gate under one key, checked only
  once the cast's own tag finds no entry. Every source still writes the same
  id's one stack pool and shares its duration and cap; only which sources may
  grant at all differs. A default entry gates the same check the grant, the
  damage query and an `alwaysActive`/`seedAtStart` registration all share, so
  it closes those paths too; without one, a `grantRequires` module's own
  `requires` is `undefined`, so it reads as ungated everywhere but a named
  grant — the catalog's display falls back to the default entry, where one
  exists.
- **A buff a debuff's tick applies reaches every damage event that comes after
  it in time** — a later tick of the same or a different debuff, a mechanic's
  own extra event, the chips of any cast resolving after it, and a regular hit
  too, since every damage event is scored in one time-ordered pass.
- **An `echo` effect is a feed, not a magnitude.** A def returning one names
  the debuff whose echo the event it reaches feeds; it changes nothing about
  the event itself. The share, the row and any release-time adjustment are
  the debuff's — never author them on the def.
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
- **A module's `effects` may read the build's min or max physical attack, or
  its white critical rate, from its context, alongside the fight state.** Each
  is the same value the damage kernel takes as base min/max phys or as the
  pre-resistance critical rate, and a magnitude that scales with it is
  computed in the module — never re-derived in the UI or hardcoded in the
  timeline.
- **A module's `effects` may read the target's remaining health from
  context**, as a fraction of its max that falls with the damage dealt so far
  in time order — never re-derived from a hit count or a display value.
- **A module's `effects` may read the build's breakthrough from its
  context**, the same way it reads min physical attack. A module that only
  exists from some breakthrough on declares that minimum in `requires` rather
  than returning no effects below it — the catalog and the display gates read
  `requires` without executing anything, so a gate hidden inside `effects`
  never reaches them.
- **A module's `effects` may read the encounter's distance to the target from
  context**, the same way it reads remaining health — a persisted, hydrated
  input, never a per-skill guess.
- **A module's `effects` may read how long it has been since another status's
  last window closed** (`ctx.status.secondsSinceLastEnd`), `null` before that
  status has ever applied. A currently-active window has not closed, so a
  module paying out both while the source is active and for a while after
  checks `isActive` first and falls back to this only once it is false.
- **A module's `effects` may read how long it has been since a permanent
  counter status last fell below a threshold**
  (`ctx.status.secondsSinceStacksBelowThreshold`), `null` before it has ever
  crossed. A permanent-activation counter (a running point total, never
  windowed) has no "last window closed" for `secondsSinceLastEnd` to read, so
  this reads the same question off its stack history instead.
- **A module may open its window a fixed offset after the triggering cast's
  start** instead of at the trigger hit's own frame, when the source it models
  opens on an in-progress hit rather than the first or the last one. Author
  that offset on the module, never as a per-skill adjustment to the trigger's
  own frame; it is ignored once the module (or the trigger) already applies on
  cast end.
- **A module's `effects` may return `forceOutcome("noAbrasion")` or
  `finalCritAtLeast({ threshold, bonusBelowThreshold })`**, scoped by whatever
  the function already reads off its context — a phase, another status, a
  tag — for a rule the module's own activation window cannot express by
  itself. `finalCritAtLeast` is the effect-returned counterpart of the
  module's declarative `conditionalFinalCrit` field: use the field when the
  module's own active window already is the whole condition, the effect when
  it needs to read further state to decide.

## Meters

A meter is a build-wide bar every skill of every class may cost from, gain into
or gate on — a class registers one on its `ClassDef.meters`, shared by every
skill that names its id. It is **not** a special case: it simulates once, in
the layout pass's own sequential cursor, and is replayed onto the real ledger
as a permanent counter status (`meter:<id>`) — every existing reader then
works unchanged.

- **A threshold requirement is an ordinary status condition** against
  `meter:<id>`, authored on `castConditions` (a legality flag, per "Cast
  legality" above) or on a hit's own `conditions` — never a bespoke field. A
  meter has no separate "requires" schema.
- **A skill's own `meterCosts` spend a fixed amount at the cast's own start**,
  after that step's cast conditions are checked against the value the cost is
  about to spend. A cost's own `requiresParam`/`requiresMinTier`/
  `requiresMaxTier` waive it outside that param/tier range — untiered reads as
  tier 0, so a cost waived only from some tier up still applies to a build
  that never slotted the param at all.
- **A skill's own `meterDrains` and `meterFreezes` replace natural
  regeneration for their own interval** — a freeze drains nothing but still
  blocks regeneration exactly as a real drain does; neither ever adds to the
  natural rate. A drain's own stop time is authored either as an explicit
  offset or as "to the cast's own end".
- **A hit's own `meterDelta` trigger kind gains or spends on that hit**,
  reusing the shared trigger gate for its conditions, tier gates and
  cooldown — the same as every other trigger kind. `meterSpendCapToCurrent`
  spends at most that ceiling and at most the meter's current amount, for a
  release whose own damage reads what it is about to deduct. A meter's own
  level is exact, fractional amounts included; only a display rounds it. A
  chance-based grant the real game only regulates by its own cooldown (so a
  hit inside that cooldown eventually crits or affinity-hits in every
  validated build) is authored as its full, unscaled amount — the modal
  outcome, not an expected value scaled by the chance itself. Its own
  `recordSpendAsStatus` records the magnitude actually deducted (after
  `meterSpendCapToCurrent`) onto a permanent counter status, backdated to the
  granting cast's own start rather than this hit's frame — so a module whose
  bonus depends on what a capped release actually spent reads the same amount
  from every hit of that release, including one landing earlier than this one.
- **A `meterDelta` trigger's own `refundFractionOfCastCost` gains this
  fraction of what the owning cast actually paid to its own `targetId`
  meter**, after every cost modifier, in place of a fixed `stacks` amount —
  for a refund defined by the game as a share of a cost the build itself can
  change. The paid amount is read from what the cost step already recorded
  for that cast, never recomputed a second time.
- **A buff may declare `meterModifiers`**: while its window is active, it
  scales a meter's own cost, charge-drain cost or regeneration rate by a
  fraction — the ledger-native counterpart of a stat effect, since a meter
  simulates outside the damage-kernel stat pool. A modifier sourced from the
  class-buff engine rather than the status ledger is out of reach here, the
  same restriction every other ledger-side mechanism has.
- **A `meterModifiers` entry with a `tag` is class-scoped** — only a cast
  whose skill carries that tag pays it — **and one with no `tag` is
  unscoped**, paid by every spend of that meter regardless of skill. Every
  active modifier of the same kind and the same scope sums additively first;
  the scoped sum and the unscoped sum then multiply as two separate factors,
  never as one combined additive total, because a class-scoped cut and an
  unscoped one are different formulas in the source game. A `chargeCost`
  event additionally multiplies in the meter's own unscoped `cost`-kind
  factor on top of its own `chargeCost`-kind one — the unscoped cost formula
  is defined as covering every spend, a running charge drain included, while
  a class-scoped cost never reaches a charge at all.
- **A regeneration modifier may instead declare `belowCapacityFraction`**,
  gating itself on the meter's own live level against that fraction of its
  capacity rather than on a status window — a self-referential condition read
  directly off the meter as it advances, never through the ledger, since a
  window-based read would only see the level as of its last recorded step.
- **A modifier may instead declare `alwaysActive`**, skipping the ledger window
  (and `belowCapacityFraction`) check entirely — active whenever its owning
  status is present in the run at all, for a build-tier-gated modifier with no
  timed window or proc of its own.
- **A meter's own capacity may be a function of the build**, resolved once and
  exposed through the same generic build-param accessor every other
  build-level number uses — never a bespoke context field.
- **A meter's per-cast level is reported on the cast it belongs to**, read
  before that cast's own cost or drain applies — "the level available when
  the cast was placed", not the level once it resolved.
- **A pre-pull cast never touches a meter**, the same as it never lands a hit
  for damage — it compresses a real-world gap of unknown length into a
  handful of negative frames, which has no faithful frame-accurate placement
  for a cost, a drain, a freeze or a gain.
- **The meter's own cursor advances only for a meter-relevant event** — a
  cost, a drain or freeze start, a `meterDelta` — never for an ordinary hit
  that carries none of these, however far its own chain (a `castSkill`
  sub-cast, a detonation) reaches past the step that follows it in the
  rotation. A meter-relevant event generated by one step but landing past the
  next step's own start is held back until that later step's own advance
  reaches its frame, so every step's cast-start cost is applied at its own,
  earlier frame first — meter events across the whole layout pass apply in
  one global frame order, never in the rotation's per-step processing order.
- **A meter never rewinds its own cursor.** A cost, drain or freeze requested
  at a frame earlier than the meter has already advanced to is processed at
  the cursor's own frame instead and surfaces a warning, rather than
  corrupting the meter's forward-only simulation — the global ordering above
  keeps this to genuine same-frame ties and quantisation, not a cross-step
  race.
- **A charged skill's hold is authored at the earliest release of the stage
  its rotation step's form names** — never a longer hold, and never one
  timed to spend the whole meter. A player releases the moment the wanted
  stage becomes available; a stage held any longer is a different, unauthored
  step. This is the cast's own start-to-release span: every frame the module
  authors, hits included, is relative to the press, not the release, so this
  minimum hold folds into `castFrames` and every hit frame the same way any
  other fixed delay does — never a separate field. Where a class's own
  evidence shows a stage genuinely held past its earliest point, that is
  recorded beside the module, not assumed.
- **A skill's own `meterDrains` entry may carry `chargeRelease`, naming a
  fallback skill**: the generic form of "the meter already warns 'emptied
  mid-drain' — now the release follows that warning". At layout time, after
  the step's own cast-start `meterCosts` are paid but before its cast length
  or hits resolve, the drain is projected from its own start to its own stop
  frame (`stopAfterSec`, or the skill's own `castFrames` where absent) against
  the meter's level at that point — so the projection sees this same cast's
  own earlier-frame costs already spent, never a stale pre-cost level. The
  projection is read-only: checking it never itself advances the meter's own
  cursor, so a stage that turns out reachable costs nothing to have checked.
  A projection that would empty the meter before that stop frame replaces the
  step's cast with the named fallback outright — the in-game release at
  whatever lower stage the hold actually reached — flagged on the run rather
  than added to the step's own legality list, since the step is not illegal,
  only different from what it names. The fallback's own drain is checked the
  same way, so a chain of stages steps down at most one level at a time. A
  pre-pull cast is never in reach of this, the same reasoning that keeps it
  off every other meter mechanic.
- **A charged hold's own release time is quantised the same way every other
  cast length is** — through the render-frame layer, not a second formula —
  so nothing about ping or average FPS is authored per charged skill.

## Target distance

The player's ground distance to a stationary target simulates **once**, in the
layout pass's own sequential cursor, beside the meter simulation, and is
replayed onto the real ledger as a permanent counter status the same way a
meter is — every reader of `ctx.target.distanceMeters` then works unchanged.
There is no second simulation and no per-module distance logic.

- **A cast sets the distance at its own start**, after that step's cast
  conditions are checked, to `min(preferred distance, reach)` — the player
  stands as far away as the skill's own `reachMeters` allows. A skill with no
  authored `reachMeters` uses its class's `defaultMeleeReachMeters`. A
  `stationary` skill has no approach and instead caps the **current**
  distance at its own reach, never pulling toward the preferred distance.
- **A displacement applies after the approach**, against the distance it
  left: `towardTarget` shrinks by a reference amount, floored at zero;
  `toTarget` snaps to a fixed distance from the target; `selfForward` is a
  fixed dash, the resulting distance the magnitude of the difference;
  `byDistance` picks a band by the live distance at that same point and
  applies that band's own displacement, recursively, falling back to an
  `otherwise` displacement when no band matches.
- **A pre-pull cast never touches the distance**, the same reasoning a meter
  is never touched by one — a real-world gap of unknown length compressed
  into a few negative frames has no faithful placement for an approach.
- **Every hit and every DoT tick reads the distance at its own frame.** It
  holds the last cast-set value until the next cast changes it, exactly as a
  meter's level does between costs.

## Drawn weapon

Which of a class's arts is drawn simulates once, in the layout pass's own
sequential cursor, beside the meter and distance simulations, and is
replayed onto the real ledger as a permanent counter status per art
(`drawn:<weapon>`) — every reader of it then works unchanged.

- A skill's own weapon identity is its `weapon:` tag; a skill with none, or
  the reserved `none` tag, neither requires nor changes the drawn weapon.
- **A weapon-bearing step's start sets its own weapon's status and clears
  whichever other weapon was drawn**, at that same frame — exclusive, the
  same permanent-status pattern a meter or the target distance uses.
  Pre-pull steps follow the same rule; the very first weapon-bearing step of
  the run draws for free, since there is nothing to swap from yet.
- **A weapon change between two rotation steps inserts a free direct swap**
  ahead of the arriving step, unless that step already performs its own
  weapon change (`isWeaponSwap`), in which case it counts as the swap and
  nothing is inserted — a rotation step is never edited, only a fresh
  synthetic step is ever added. The direct swap deals no damage and adds no
  breakdown row.
- **The direct swap's own cooldown is a separate clock from anything else
  gated by `isWeaponSwap`.** A swap blocked by either cooldown waits as idle
  time instead of being flagged illegal, the same as any other cast whose
  own start is held back by a resource it cannot yet afford.

## Qi bar

The target's Qi bar is a damage-driven meter with no regeneration: every
scored event's own finished damage — the same value the breakdown and the
total tally read, crit/affinity/abrasion/broken bonus included — feeds a
formula that yields that event's Qi, which the bar spends. It cannot simulate
in the layout pass the way a meter or the target distance does, since it needs
a hit's damage before that damage itself exists; instead it is computed in
pass 2, in time order, alongside `totalDamage`.

- **A schedule, never the live bar, is what every gate reads.** The layout
  pass, the buff-engine prepass and pass 1 all need the break before pass 2's
  damage exists, so they read a `QiSchedule` — the target's break windows, a
  step function of its Qi fraction, and the compatibility phase view. Pass 2
  may additionally read the bar's own live state for the event it is scoring
  (`ctx.target.qiFraction`, `ctx.target.qiBroken`).
- **The circularity resolves by a fixed-point iteration**: the whole run
  simulates with one schedule, the bar it produces becomes the next schedule,
  and the run repeats until the break frames stop moving or a small iteration
  cap is reached — seeded from the rotation's own authored break, which
  already sits close in every validated case. A run that reaches the cap
  without converging keeps the last schedule and reports a warning, never an
  error.
- **A non-null encounter override means manual mode**: one fixed window, no
  iteration, and every gate that phase-checks time reads the clock-driven view
  of it — deterministic and reproducible for a fixture. Null means simulated,
  the default.
- **The bar starts at its capacity; a hit landing while it is at zero deals
  no Qi**, the mass lost outright. The event that brings it to zero opens a
  timed break; at the break's end the bar is set back to a refill value and,
  for a further fixed span, a direct hit deals no Qi while a tick still does.
  Breaks repeat without limit and nothing regenerates between hits.
- **The target the bar belongs to is a choice, not a constant**: its own
  capacity, refill, break length, post-break immunity and the index the
  formula reads off it are the chosen target's own data, next to its HP.
- **A gate that keys on a Qi phase may instead key on a genuine fraction
  threshold** (a `qiBelow` gate, alongside the phase itself wherever a phase
  gate is authored): it holds once the bar's own fraction crosses under that
  threshold, broken included — an in-game rule stated as a percentage reads
  its own number this way, rather than through the compatibility phase
  window's approximation of it.

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

- Declare resource capacity, launch identity, upkeep and gain rules on the owning
  class definition; keep resource names and values out of the engine.
- Gate resource-controlled ticks before their damage or buff triggers. A depleted
  launch must not revive from later refunds. Each new launch starts its own cadence.
- Distribute declared whole-skill resource gains over authored hits; credit only
  executed damaging hits, and keep once-per-cast bonuses independent.
- Gate conditional additional pulse impacts at execution time, so status extensions
  from earlier accepted impacts can affect later impacts.
- Apply phase-dependent hit refunds only at accepted hit times; elapsed time alone
  must not grant a hit refund. Clamp balances and use the encounter's phase clock.
- Declare passive regeneration as a flat per-second rate on the resource, netted
  against drain every frame and clamped to `[0, capacity]`. A gain rule's negative
  default is a cost, not a refill — persisting it keeps its sign, clamped no
  higher than zero.
- Expose uncertain gain amounts as persisted, hydrated inputs. Report actual funded
  windows and rejected launches, and distinguish assumptions from measured anchors.

1. English identifiers only.
2. Coefficients, frames and `castFrames` set per hit.
3. `skillType` correct — it selects the boost bucket and the sustain branch.
4. `elevatedAttributeMultiplier` left at its default unless the hit has its
   own reason to demote.
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
