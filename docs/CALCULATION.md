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
- Bumping a base-stat configuration means editing the JSON table **and** the
  constant that selects which keys are summed. Adding a table key alone changes
  nothing.
- The base-stat row and the runtime level bonus must read the **same** level
  constant. Two sources drift silently.
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

## Calculation rules

Four corrections apply **unconditionally**, from the external sources below.
They have no cached anchor — `tests/engine/damageRules.test.ts` is the only
guard, and it is directional.

1. **Graze/abrasion rate** is `(1 − precision) × (1 − affinity)`, not
   `1 − precision` (PDF §8). Differs only below 100 % precision.
2. **Penetration** uses net `(pen − resistance)`, `÷100` when net ≤ 0 (deficit
   at full weight) and `÷200` when net > 0 (overflow halved), for the physical
   and every attribute track. ⚠️ This deliberately **inverts PDF §7** — the CN
   sources' worked examples go the other way, and the PDF-literal branch
   inflated the pen term about 2×. **Do not "fix" it back.**
3. **DoT rows** get no flat damage and no elevated matching-path scaling (PDF
   §1) — the non-matching multiplier applies to every attribute path. This is
   gated per hit by `elevatedAttributeMultiplier`, which **defaults true**. Only
   a genuine DoT tick sets it false. A burst that is `sustain`-tagged for buff
   routing is not a DoT and keeps the default, retaining its flat damage and the
   elevated multiplier.
4. **A skill's raw affinity-rate bonus** divides by `(1 + resistance)` and falls
   **inside** the cap (PDF §11), while **a skill's raw crit-rate bonus is flat**
   and added **after** the cap — so a charged hit can exceed the plain crit cap.
   Direct rates stay flat.

**Penetration resistance is zero for every target.** PvE targets carry none.
The plumbing stays so real values can slot in if a target ever has any.

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
   pen resistance ≈ 0; DoT rules; overall PVE structure.
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
   rather than unconditionally.
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
  gear set. `src/engine/mechanics/` holds only the contract and the registry:
  **no instances**.
- **Registry order is load-bearing.** Contributions apply in it and float
  addition is not associative. The memo signature is derived from what a
  mechanic returns, never hand-appended.
- **A stochastic effect is a seeded whole-rotation schedule**, not a buff def —
  a def cannot express a per-hit roll. Say so in the module when you add one. It
  must **accept the run's generator when the engine supplies one** and realise a
  single trajectory instead of averaging its own fixed-seed sweep; without one it
  averages as before. A schedule that ignores the generator keeps reporting an
  expectation on a run that has none, and understates the spread.
- **Only hits laid by the rotation roll a proc.** DoT ticks and
  trigger-enqueued hits do not. This is structural; do not work around it per
  mechanic.
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
