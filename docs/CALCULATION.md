# CALCULATION.md — rules for the damage math

Rules an implementation of the damage math must satisfy. It does not describe
what `formula.ts`, `panel.ts` or `derivedInputs.ts` do — read those. Skill,
buff and mechanic specifics belong in the module that defines them, never here
(CLAUDE.md § "Docs are implementation rules").

| doc         | rules on                                                 |
| ----------- | -------------------------------------------------------- |
| this file   | the stat layer, the formula chain, the calculation rules |
| TIMELINE.md | the skill / buff / debuff data model                     |
| BUFFS.md    | which system a mechanic belongs in                       |

## One kernel

There is one damage kernel and one calculation mode. Every buff, debuff,
mechanic and scoped stat lands as `{statKey, amount}` effects summed onto
`Inputs` or the target override, from which the formula context is built. **A
buff never does its own math**, and nothing computes damage outside the kernel.

## The stat layer

Everything here runs **before** any damage math and produces the `Inputs` the
kernel consumes. Category-1 base-stat buffs belong here (BUFFS.md).

- A saved profile holds **no resolved stat fields**. They are recomputed on
  every load, so never persist a derived stat.
- Bumping a base-stat configuration means editing the level row **and** the
  summation that consumes it. Adding a row field alone changes nothing.
- The base-stat row and the runtime level bonus must read the **same** level
  constant. Two sources drift silently.
- A per-point attribute conversion is authored **once**, and every consumer
  imports it. A gear-word delta is derived from the word's roll and that table —
  a pre-multiplied literal is a second copy of the max roll, and goes stale the
  moment either moves.
- A selection is stored; the bonus it implies is added during the derive. Never
  store a bonus that a selection already implies.
- **The food bonus is not a stat-layer add.** It is applied inside the kernel at
  the min/max-phys step, and that is its only application site. Applying it in
  the stat layer double-counts it.

## White vs yellow rates

Read **CLAUDE.md § "White vs Yellow rates — DO NOT FLIP THIS"** before touching
anything rate-shaped. Two rules bind here:

1. White → yellow conversion happens in **exactly one place**, and yellow is
   what the kernel consumes. Do not convert anywhere else.
2. Direct rates are unaffected by resistance — the same value white or yellow.

## The formula chain

- The single-letter variable names are inherited from the spreadsheet the
  formula was reverse-engineered from. They carry **no meaning** beyond that:
  treat them as opaque, not as a claim about any live data source.
- Two kernel parameters are vestigial on the live path — the per-call hit count
  is always 1, and the counters are always zero. Do not build a mechanic that
  depends on either; the qi phase reaches the kernel through buff effects and
  per-hit art patches instead.
- **A target-side reduction subtracts inside the bracket it opposes; it is never
  an addend in the additive boost total.** A whole-damage reduction is its own
  factor in the shared tail every row passes through, so it reaches a
  damage-over-time tick and an ordinary hit alike. A damage-boost bracket is
  floored at zero after the subtraction, and a crit- or affinity-damage
  reduction applies **before** that multiplier's clamp, so it is clamped with
  everything else.
- **An independent damage boost is its own multiplicative factor in the shared
  tail every row passes through, never an addend in the additive boost
  total.**

## Qi damage

Qi is a second, independent number the kernel produces alongside HP damage —
never the other way around, and never in its own pass. For every scored
event, after the kernel's own HP damage is finished (the rolled value when
seeded, the expectation when not):

```
qi = ( damage / target.hpMax × 100 × player.qiIndex × (1 + qiDamageIndexMultiplier) × target.qiTakenIndex )
     × (qiRate + qiRateAdd)
     × (1 + qiDamageBoost + targetQiDamageTaken)
   + qiFlat × (1 + qiDamageBoost + targetQiDamageTaken)
```

- **Qi reads the event's finished damage** — crit, affinity, abrasion and the
  broken-target HP bonus all already folded in, because that is the only
  damage value that ever existed for the event. A zero-coefficient hit deals
  no Qi; every other hit deals Qi whether or not it falls inside the DPS
  window, a pre-pull one included — docs/TIMELINE.md § "Qi bar".
- **The broken-target HP bonus is its own factor in the shared damage tail**,
  the same way an independent damage boost is (above) — never an addend in
  the additive boost total, and it reaches a damage-over-time tick exactly as
  it reaches an ordinary hit.
- `player.qiIndex` and the broken-target bonus's own size are base-stat data,
  not engine literals — read next to the other per-level base-stat values.
- docs/TIMELINE.md § "Qi bar" has the bar itself: where the state lives, the
  break rules, and the schedule every earlier pass reads instead of the live
  bar.

## Calculation rules

Three corrections apply **unconditionally**, from the external sources below.
They have no cached anchor — `tests/engine/damageRules.test.ts` is the only
guard, and it is directional.

1. **Graze/abrasion rate** is `(1 − precision) × (1 − affinity)`, not
   `1 − precision` (PDF §8). Differs only below 100 % precision. An
   abrasion-avoid fraction scales this rate down further, and the mass it
   removes lands on the normal row, never on crit.
2. **Penetration** uses net `(pen − resistance)`, `÷100` when net ≤ 0 (deficit
   at full weight) and `÷200` when net > 0 (overflow halved), for the physical
   and every attribute track. ⚠️ This **corrects PDF §7** — the CN sources'
   worked examples go the other way, and the PDF-literal branch inflated the
   pen term about 2×. **Do not "fix" it back.**
3. **A skill's own rate bonus** — crit and affinity alike — is added undivided
   onto the already-resisted panel rate, floored at zero, and falls **inside**
   the cap (PDF §11). The direct rate is added **after** the cap, unaffected by
   resistance.

**The martial art's attribute multiplier applies to every row alike, its flat
term together with its coefficient** — a damage-over-time tick included.
Nothing demotes a row to the non-matching coefficient by default;
`elevatedAttributeMultiplier` still exists per row and defaults true, for a
data module that has a genuine reason to set it false — and a row that does
demotes both terms together, never one without the other.

**A row whose attribute coefficient is exactly zero while its physical
coefficient is positive deals no attribute damage on any of the five attribute
tracks** — the martial art's own and the other four alike. The other tracks'
fallback to the physical coefficient applies only to a row that has an
attribute coefficient. A row with a zero physical coefficient is a marker and
is unaffected.

**Penetration resistance is zero for every target below breakthrough 20, and
non-zero from breakthrough 20 on.** It is read off the target's own
breakthrough, the same way its defense is.

**A per-hit bonus that scales a row's flat terms scales the physical and
attribute flat term alike, and applies before the martial art's
attribute-flat multiplier** so the two compose multiplicatively in that
order. It never reaches either coefficient term.

### Sources of truth

These external sources are authoritative. On conflicts **between** sources,
prefer corroboration (two agreeing beat one) and worked numeric examples over
prose.

1. **Midasione PDF** — `reference/formula/Copy of WWM Damage Formula by
Midasione.pdf`. Primary reference (§1 base damage, §8 hit outcomes, §11 rate
   resistances, §12 attribute conversions). Known error: §7's pen branches are
   inverted — see rule 2.
2. **Sohu/17173 属性伤害揭秘** — <https://www.sohu.com/a/857778130_121212001>
   (mirror:
   <https://news.17173.com/z/yy16s/content/07152025/200828818.shtml>). Pen
   overflow-halved worked examples; crit and affinity base multipliers.
3. **GamerSky PVE数值系统与伤害公式解析** —
   <https://www.gamersky.com/handbook/202512/2063097.shtml>. Target defense and
   pen resistance ≈ 0; overall PVE structure.
4. **16yanyun 三率攻略** —
   <https://16yanyun.com/gameguide/yanyun-three-rates-attributes-guide>. Rate
   caps, precision-first judgment, affinity-overrides-crit.

These four titles are the only sanctioned Chinese in this file — they are source
citations, not domain naming (CLAUDE.md § "Language").

## Inner-way layers — classify before implementing

An inner way can reshape the calculation in three places. The buckets are
**disjoint**: classify a new effect first, and never let one effect land in two.

1. **Flat tier stats** — the module's own always-on and per-tier `panelStats`,
   folded in during the derive. Always-on stat adds, invisible to the Skill
   Editor. Tiers that are individually selectable carry their stats on the tier
   rather than unconditionally. A tier stat that moves with the character
   breakthrough is a `ladder`, resolved against the build's breakthrough at
   derive time; a breakthrough outside the ladder takes its nearest row.
2. **Context scalars** — the module's `scalars` block, summed across slotted
   inner ways. `minTier` gates the whole block. No engine file may name an inner
   way to read one.
3. **The buff engine** — a `BuffModule` gated by `requires.param`, enabled from
   the build through the module's own `buffParam`. A _conditional, triggered_
   inner-way mechanic belongs here (CLAUDE.md § "Buffs").

An inner way commonly spans more than one bucket. That is fine; counting one
effect twice is not.

⚠️ **A buff-def gated on an inner-way param must not restate a stat that inner
way's `panelStats` already bakes in.** Mapping a `buffParam` whose defs
duplicate a mechanic's own model is a double-count, and the engine will not
warn. When a mechanic and a def model the same thing, one of them contributes —
decide which, and leave the param unmapped if that is the answer.

## Mechanic rules

A mechanic is the escape hatch for what the def schema cannot express — a
stochastic per-hit roll, a stacking-and-decaying reduction, a stateful counter.

- **Declared by the thing it is a mechanic of** — its class, its inner way, its
  gear set, its consumable. `src/engine/mechanics/` holds only the contract and
  the registry: **no instances**.
- **Registry order is load-bearing.** Contributions apply in it and float
  addition is not associative. The memo signature is derived from what a
  mechanic returns, never hand-appended.
- **A stochastic effect is a seeded whole-rotation schedule**, not a buff def —
  a def cannot express a per-hit roll. Say so in the module when you add one. It
  must **accept the run's generator when the engine supplies one** and realise a
  single trajectory instead of averaging its own fixed-seed sweep; without one it
  averages as before. A schedule that ignores the generator keeps reporting an
  expectation on a run that has none, and understates the spread.
- **A hit rolls a proc whether it is laid by the rotation or summoned by a
  trigger.** A mechanic that builds its schedule from hit times reads every
  hit-driven schedule the engine exposes, not only the rotation's own laid
  hits. This is structural; do not work around it per mechanic.
- **A stochastic schedule's own origin is the earliest event it reacts to**,
  never the DPS window's own start — the two coincide whenever the window
  itself opens on that same event, but a schedule anchored to the window's
  start instead would reshuffle itself the day an earlier event is correctly
  found to open the window, with nothing about the rotation's own hits or
  ticks having changed. A mechanic genuinely timed off the fight's own clock,
  rather than off a hit it reacts to, is the one exception.
- **A DoT tick may feed a proc schedule too**, opted into separately from a
  hit's own schedule (`dotTickTimesSec`, alongside `hitTimesSec`) — derived
  from the same layout pass, at each debuff's own tick interval, through the
  one function pass 1's own tick entries walk too, so the two cannot diverge.
  It carries the layout pass's own limit: a detonation's sub-cast and a DoT a
  `castSkill` trigger summons are not on it, the same gap `hitTimesSec` has
  for a summoned hit's own detonation follow-up — and a resource-gated DoT's
  ticks are an upper bound rather than exact, since the resource's own
  sequential consumption check cannot run ahead of pass 1 without corrupting it.
- **A target-resistance reduction is modelled as player penetration.** Target
  pen resistance is zero and there is no target-resistance stat key, so the two
  are numerically identical.
- **A DoT ticks on one continuous grid per episode** of continuously-maintained
  application, so a debuff re-applied faster than its tick interval keeps a
  steady cadence. **Do not reintroduce a per-window phase reset** — a
  re-application must not restart the phase.
- **A party-applied debuff and an inner way modelling the same effect must not
  both contribute.** Suppress the stat contribution while the shared one is
  active; DoT damage is not suppressed.
