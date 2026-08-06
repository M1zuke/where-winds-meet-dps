# CALCULATION.md — how the calculation works

This is the playbook for the **damage math**: how a set of panel `Inputs`
becomes a per-hit damage number, and every conditional and gotcha along the
way.

Scope, so the three docs don't overlap:

| doc | owns |
| --- | --- |
| **CALCULATION.md** (this file) | the stat layer, `FormulaContext`, the per-hit formula chain, calculation rules, sources of truth, mechanic-coverage gaps |
| `TIMELINE.md` | the skill / buff / debuff **data model** — coefficients, triggers, how a skill gives vs receives a buff |
| `CLAUDE.md` | the guardrails — English-only, white/yellow rates, worker offloading, migrations |

There is a single calculation mode. The workbook engine (cached tick lists,
`resolveAxis`, settlement accumulators, the `.mjs` extraction pipeline) was
removed on 2026-08-02; everything below describes the timeline engine that
replaced it.

## Pipeline at a glance

```
Inputs (panel state — selections and user-authored data only; a saved profile
holds none of the resolved stat fields below, `withDerivedStats` recomputes
them fresh on every load)
  │
  ├─► withDerivedStats(inputs)                     → derivedInputs.ts
  │     Two passes over every known stat path:
  │       base (baseStats/index.ts getConfiguredBase)
  │     + inner-way flat stats (mindMethodPanelStats.json)
  │     + equipped gear (gearStats.ts sumContributions)
  │     Pass 2 re-derives attack-path-scaled talents against pass 1's totals.
  │
  ├─► applyArmorSet(…) ─► applyBowSet(…)           → panel.ts
  │     Flat rate/attack adds from the 4-pc armor set and the bow set.
  │
  ├─► runEngine(inputs)                            → dps.ts
  │     Picks the rotation (active custom → selected built-in → class default)
  │     and hands off to simulateTimeline. That is all it does.
  │
  └─► simulateTimeline(inputs)                     → timeline.ts
        1. Lay out casts on a 60 fps frame grid (pre-pull casts get negative
           frames); build the hit event queue.
        2. Pre-compute the whole-rotation stochastic schedules — Hawkwing
           stacks, Concentration activation probability.
        3. Feed every cast to BuffEngine.processSkillCast (buffs/buffEngine.ts).
        4. Drain the queue. For each hit:
             resolveState(frame, skill)  → collects active buff stat-effects,
                                           applies them to Inputs, rebuilds
                                           the FormulaContext (memoized on a
                                           signature string)
             hitToArtRow(hit, skill)     → the per-hit coefficient row
             computeSkillDamage(art, …)  → expected damage for this hit
           …then fire the hit's triggers (apply buffs/debuffs/DoTs, queue
           sub-skills, detonate).
        5. Second pass: walk each debuff's merged application episodes and
           emit DoT ticks on a continuous per-episode grid.
        6. Yi River ticks (Morale Chant T6), then aggregate:
             dps = totalDamage / (durationFrames / 60)
```

`computeRanking` (`itemRanking.ts`) and the gear/retunement sweeps re-run
`runEngine` many times over; per CLAUDE.md they all live in
`src/engine/dpsWorker.ts`, off the main thread.

## The stat layer

Everything here happens **before** any damage math, and produces the `Inputs`
the engine actually consumes. Per CLAUDE.md's buff taxonomy this is where
category-1 "base-stat" buffs belong.

- **`src/data/baseStats/index.ts`** derives the modeled character's base stats
  from the JSON tables under `src/data/baseStats/` at module load. To bump a
  configuration:
  - *new talent tier* — add a key to `talentPoints.json`, then add it to
    `TALENT_TIERS` (currently `["95.1", "95.2", "100.1"]`; all listed tiers are
    summed).
  - *new breakthrough* — add a key to `breakthroughAttributes.json`, then
    update `BREAKTHROUGH_TIER` (currently `"16"`).
  - *new enhancement entries* — edit `enhancements.json` only; the module
    re-sums every load.
  - *oddity defaults* — edit `oddities.json` to change the seed
    (`DEFAULT_ODDITIES`); live values are per-profile and folded in by
    `getConfiguredBase`.

  `BASE_LEVEL` is sourced from `APP_PLAYER_LEVEL`
  (`engine/buffs/levelAttributeBonus.ts`) so the base-stat row and the runtime
  attribute-attack level bonus can't drift apart.

- **Gear** — `gearStats.ts` turns each equipped `GearPiece` into a list of
  `{path, amount}` contributions; `derivedInputs.ts` sums them onto the base.
  `RELAYED_FACTOR = 0.94` caps relayed words.
- **Inner ways** — `mindMethodPanelStats.json` carries each inner way's flat
  tier stats. These are plain stat adds; the *conditional* inner-way effects
  live in three other layers (see "Mind-method layers" below).
- **Arsenal** — a stored *selection* (`Inputs.arsenal`); `swapArsenal` only
  changes which arsenal is selected. `getConfiguredBase` adds
  `ARSENAL_BONUS = {min: 131, max: 263}` to the selected block during the
  derive, so the bonus itself is never stored.
- **Food** is the exception: it is **not** applied in the stat layer.
  `FOOD_MIN_PHYS_BONUS = 120` / `FOOD_MAX_PHYS_BONUS = 240` are added inside
  `formula.ts` at the AE/AG step, and re-shown read-only as the yellow
  "effective" min/max phys in Panel Stats. That is the only application site.

## White vs yellow rates

`Inputs.precision` / `critRate` / `affinityRate` are **white** (raw character
values, what the user types). `panel.ts effectiveRates` is the single place
they convert to **yellow** (post-resistance), and yellow is what
`computeSkillDamage` consumes:

```
precision:    (white − 0.65) / (1 + r) + 0.65     [soft-cap]
critRate:     white / (1 + r)
affinityRate: white / (1 + r)
```

`directCritRate` / `directAffinityRate` are unaffected by resistance — same
value white or yellow. `r` comes from the breakthrough row
(`resistanceForBreakthrough`). **See CLAUDE.md § "White vs Yellow rates — DO
NOT FLIP THIS"** before touching any of this; it is load-bearing for every
per-tick formula.

## `buildContext` — assembling the FormulaContext

`panel.ts buildContext(inputs, targetOverride?, hawkwingPhysBonus?,
dotDamageMultiplier?)` packs everything the formula needs that isn't per-hit.
The interesting derivations:

* **`generalDamageBoost`** sums:
  * the target's `generalDamageTaken` (0 in `dummyMode`)
  * `+8%` Soldier's Return · `+3%` Star-Picker at tier 6 · `+2%` Endurance
    Doctrine
  * `+3.75%` if set = Swaying Heights
  * `+8%` if `shareEasyHurt` (the tank-spear Vulnerability debuff)
  * `+1.5%` Divinecraft fire · `+1%` Divinecraft poison
  * `+ bossBoost`
  * `+8%` for the `stonesplitBalancePureTang` class
* **`effectiveDefense`** = `target.defense × (henZhiActive ? 0.94 : 1)`, where
  `henZhiActive = shareDebuff5HenZhi || (Year-Long Lament at tier 6)`
* **`chargeBonus`** = `0.15` if Mighty Song is selected
* **`weaponBoosts`** — the per-weapon boost map keyed by weapon name
  (`Sword`/`Spear`/`Fan`/`Umbrella`/`Modao`/`Twin Blades`/`Rope Dart`/`Hengdao`)
* **`mysticTypeBoosts`** — the merged **Single-Target Mystic Skill DMG Boost**
  stat feeds both `control` and `burst`; **Area Debuff** / **Area DMG** feed
  `area-debuff` / `area-damage`. The plain `area` category gets nothing.
* **`dotDamageBoost`** = `0.1` if Insightful Strike is selected — the always-on
  fallback, superseded by `dotDamageMultiplier` when the timeline passes one
* **`rateResistance` / `physPenResistance` / `attrPenResistance`** — see
  "Calculation rules"
* **`dingYinByTag`** — keyed on the class's `permanentBuffs` (from
  `schools.json`), never on `classBuffs` (which is always `[]`)

`deriveStats(inputs)` is a smaller sibling returning `DerivedStats`; the
timeline builds one per resolved state alongside the context.

## The per-hit formula chain

`formula.computeSkillDamage(art, slots, ctx, count, dingYin?, counters?)`.

The single-letter variable names (`AE`, `AG`, `AH`, `EH`, `H`, `F`, …) are the
actual identifiers in `formula.ts`. They are inherited from the spreadsheet the
formula was originally reverse-engineered from and carry no meaning beyond
that — treat them as opaque names, not as a claim about any live data source.

| var | meaning | derivation |
| --- | --- | --- |
| **N / O / P / Q** | phys / attribute multipliers + fixed damage | `art.physMultiplier`, `art.attributeMultiplier`, `art.physFixed`, `art.attributeFixed` |
| **U** | effective precision | `(skillType="Heavenwork" ∨ art.guaranteedPrecision) ? 1 : MIN(precisionPanel, 1)` |
| **V** | effective crit rate | `MIN(critPanel + Σslot.col4/(1+r), 0.8) + directCrit + setBonus.col6 + art.extraCritRate` |
| **W** | effective affinity rate | `MIN(affPanel + (art.extraAffinityRate + Σslot.col11)/(1+r), 0.4) + directAff + (lowQi ? setBonus.col4 : 0) + Σslot.col13` |
| **X** | crit-damage add-on | `critDmgPanel + art.extraCritDamage + setBonus.col5 + bengJie×0.05 + Σslot.col5` |
| **Y** | affinity-damage add-on | `affDmgPanel + art.extraAffinityDamage + setBonus.col3 + Σslot.col12` |
| **AE** | raw min phys | `(smallPhys + art.minPhysFlatBonus + food×120) × (1 + art.minPhysPctBonus) × (1 + hawkwing + Σslot.col3) − effectiveDef × (1 − Σslot.col8)` |
| **AG** | raw max phys | same shape with `largePhys`, `maxPhys*Bonus`, `food×240`; clamped `MAX(…, AE)` |
| **AF** | `(AE + AG) / 2` | |
| **AH** | phys penetration multiplier | `penFrac(outerPen + art.extraPhysPenetration + bengJie×5 + yiShui×2 + (henZhi ? 10 : 0) + Σslot.col6)` |
| **AI** | phys damage boost | `physBoostPanel + Σslot.col9 + (specialTag="Spinning Umbrella" ? 0.15 : 0)` |
| **AJ** | overall multiplier | `1` |
| **AK / AL** | graze damage / rate | `AE × N × AJ × (1+AI) × (1+AH)` ; `(1 − U) × (1 − W)` |
| **AM / AN** | crit damage / rate | `AF × N × (1+AI) × (1+AH) × AJ × (1+X)` ; `(V+W ≤ 1) ? U×V : U×(1−W)` |
| **AO / AP** | affinity damage / rate | `AG × N × AJ × (1+Y) × (1+AH) × (1+AI)` ; `W` |
| **AQ / AR** | normal damage / rate | `AF × N × (1+AH) × (1+AI) × AJ` ; `MAX(1 − AL − AN − AP, 0)` |
| **AS-BE** | phys-fixed track | uses `P`, the same rate weights |
| **BG-BS** | attribute-fixed track | uses `Q`, the primary attribute's penetration, `attributeDmgBoostPanel` |
| **BU + 4 per-attribute blocks** | Bellstrike / Stonesplit / Silkbind / Bamboocut tracks | each: `small = block.min + (BU=attr ∧ weapon ? attributePrimaryBonus : 0)` ; `mult = (BU=attr ∧ ¬dotRules) ? O : N` ; `dmgBoost = (BU=attr ? attributeDmgBoostPanel : 0) + (set=Swallowcall ∧ lowQi ? 0.1 : 0)` ; `setMul = 1 + (lowQi ? setBonus.col8 : 0)` |
| **DZ / EB / ED / EF** | graze / crit / affinity / normal totals | sum of phys + phys-fixed + attr-fixed + the 4 attribute blocks |
| **EH** | weighted total | `DZ×AL + EB×AN + ED×AP + EF×AR` |
| **T** | weapon + mystic-type boost | `(weaponBoosts[art.weaponOrAttribute] + allMartialBoost)` when the weapon resolves, `+ mysticTypeBoosts[art.mysticCategory]`. A DoT tick resolves both typings like any skill: from its display stand-in's `weaponOrAttribute` / `mystic:*` tag when one exists, else from the debuff's `dot.weaponOrAttribute` / `dot.mysticCategory` — so Sword-typed DoTs (bleed) take weapon + all-martial, and mystic DoTs take their category stat; the in-game stat text explicitly covers "damage over time". Boss damage lives in `generalDamageBoost`, not here. |
| **H** | total boost | `generalDamageBoost + allDamageBoost + T + yiShui×0.01 + qiExhausted × fatigueDamageTaken + Σslot.col2 + (usesChargeBoost ? chargeBonus : 0) + art.extraDamageBoost + (sustain ? sustainDmgBoostPanel + dotDamageBoost : 0)` |
| **I** | correction multiplier | `art.correction || 1` |
| **F** | final per-hit damage | `(guaranteedNormal ? EF : guaranteedCrit ? EB : EH) × (1 + H) × count × I × (1 + E) × dotMult` — `guaranteedNormal` is the fixed-damage flag (no crit/affinity/abrasion, e.g. Dragon Head) |

### What the live path does not exercise

Four `computeSkillDamage` parameters are vestigial on the timeline path. They
are still wired and still tested, but nothing in a real run sets them:

| parameter | live value | consequence |
| --- | --- | --- |
| `slots` | always `padSlots([])` → five `"N/A"` | every `Σslot.colN` term is 0, so **`boostZone.json` and `boostZoneOverrides` contribute nothing** |
| `count` | always `1` (DoT ticks: `max(1, dot.count)`) | per-hit damage is per-hit |
| `counters` | always the default zeros | `qiExhausted` / `yiShuiLayer` / `bengJieLayer` / `lowQi` terms are 0 — the qi phase reaches the formula through buff stat-effects and per-hit tag handling in `timeline.ts` instead |
| `dingYin` | **never passed** | `E` is always 0. Note the lookup is `ctx.dingYinByTag["DingYin" + dingYin]` while `buildContext` keys the map by tag *name* (`"Mouse Boost"`), so the two would not match even if an argument were passed. |

Attunement (dingYin) does still reach damage, but by a different route:
`timeline.ts` multiplies `art.correction` by `1 + dingYinByTag["Bleed Boost"]`
for `bellstrikeUmbra`'s Bleed Detonation and Bleed Tick. That is currently the
only path from a gear-derived attunement tag to a damage number.

## Calculation rules

The engine follows the **external sources** (see below), which per user
decision 2026-07-18 are authoritative. Four corrections apply unconditionally:

1. **Graze/abrasion rate** = `(1 − precision) × (1 − affinity)` instead of
   `1 − precision` (PDF §8). Only differs below 100 % precision; at 100 % both
   are 0.
2. **Penetration multiplier** uses net `(pen − resistance)` with `÷100` when
   net ≤ 0 (deficit at full weight) and `÷200` when net > 0 (overflow halved),
   for both physical and every attribute track. ⚠️ This deliberately
   **inverts Midasione PDF §7** (which claims net > 0 → ÷100): the CN sources'
   worked examples go the other way (5 pen vs 10 res → 95 %, 30 pen vs 10 res
   → 110 %), and the PDF-literal branch inflated DPS 2× on the pen term.
3. **DoT rows** get no flat damage (`physFixed`/`attributeFixed` zeroed) and no
   elevated matching-path scaling (the non-matching multiplier `N` applies to
   every attribute path) — PDF §1, corroborated by GamerSky. This is gated
   per-skill by `elevatedAttributeMultiplier` (default `true`; only genuine DoT
   ticks set it `false`). A burst detonation (Bleed Detonation) is
   `sustain`-tagged for buff routing but keeps the default `true`, so it
   retains its flat damage and the elevated `O ≈ 1.5 × N` — it is not demoted.
4. **Buff/skill raw rate bonuses are resistance-divided** (PDF §11): boost-slot
   crit (col4) / affinity (col11) and `art.extraAffinityRate` divide by
   `(1 + r)` before the 80 %/40 % cap. The PDF's one named exception —
   Thundercry Blade's (Modao) charged-attack bonus crit, today the only
   occupant of `art.extraCritRate` — is a flat addition to the FINAL crit rate:
   unresisted, added after the cap (so charged Modao hits can reach 94 % crit
   where the plain cap would stop at 80 %). Direct rates stay flat.

Penetration resistance is **zero for every target** (`penResistanceForLevel`
returns 0/0): PvE bosses carry ~no pen resistance (in-game inspection shows
none; GamerSky concurs). The earlier (2026-06) decision to reuse the three-rate
band was compensating for the then-inverted pen branch and was reversed with
the branch fix. The plumbing is kept so real values can slot in if a target
with genuine pen resistance ever appears.

Branch logic lives in `formula.ts` (`penFrac`, `dotRules`, `rateRes`). These
rules have **no cached anchor** — the only guard is the directional
`tests/engine/damageRules.test.ts`.

### Sources of truth

Per user decision 2026-07-18, these external sources are authoritative. On
conflicts **between** sources, prefer corroboration (two sources agreeing beat
one) and worked numeric examples over prose.

1. **Midasione PDF** — `reference/formula/Copy of WWM Damage Formula by
   Midasione.pdf`. Primary formula reference (§1 base dmg, §8 hit outcomes, §11 rate
   resistances, §12 attribute conversions). Known error: §7's pen branches are
   inverted (see correction 2).
2. **Sohu/17173 属性伤害揭秘** — <https://www.sohu.com/a/857778130_121212001>
   (mirror: <https://news.17173.com/z/yy16s/content/07152025/200828818.shtml>).
   Pen overflow-halved worked examples; crit 1.5× / affinity 1.35× base
   multipliers.
3. **GamerSky PVE数值系统与伤害公式解析** —
   <https://www.gamersky.com/handbook/202512/2063097.shtml>. Boss defense/pen
   resistance ≈ 0; DoT rules; overall PVE formula structure.
4. **16yanyun 三率攻略** —
   <https://16yanyun.com/gameguide/yanyun-three-rates-attributes-guide>. Rate
   caps (100/80/40), precision-first judgment, affinity-overrides-crit.

(These four titles are the only sanctioned Chinese in this file — they are
source citations, not domain naming. See CLAUDE.md § "Language".)

## Mind-method layers

An inner way can reshape the calculation in four distinct places. Classify a
new effect before implementing it, and keep the buckets disjoint — the same
effect must never land in two.

1. **Flat tier stats** — `mindMethodPanelStats.json`, folded in by
   `withDerivedStats`. Always-on stat adds; invisible to the Skill Editor.
2. **`buildContext` scalars** — `panel.ts`. The handful of inner ways that move
   a context-level term rather than a stat: Soldier's Return / Star-Picker /
   Endurance Doctrine (`generalDamageBoost`), Year-Long Lament
   (`effectiveDefense`), Mighty Song (`chargeBonus`), Insightful Strike
   (`dotDamageBoost`).
3. **Per-art / per-boost-zone deltas** — `mindMethodOverrides.ts`, driven
   generically by `src/data/skills/boosts/artsConditionals.json` and
   `skills/boosts/boostZoneConditionals.json`. Each entry is a `checkxinf(name, then, else)`
   or `Checkxinfa(name, tier, then, else)` rule resolved against
   `inputs.mindMethods`.
   - `artsOverrides` is consumed **only** by
     `perSkillDamage.computeSkillPreview` (the Skill Editor's live preview) —
     the timeline never applies it.
   - `boostZoneOverrides` reaches `FormulaContext` but is inert, because slots
     are always `"N/A"` (see "What the live path does not exercise").
4. **The ported buff engine** — `src/data/skills/buffs/*.json` defs gated by
   `enabledParam`, enabled from the build via `buffs/paramMap.ts`. This is where
   a *conditional, triggered* inner-way mechanic belongs, per CLAUDE.md §
   "Buffs".

## Mechanic coverage — implemented vs known gaps

`timeline.ts` + `src/engine/buffs/*` port the reference site's trigger-driven
buff/debuff simulator. The code, data, and tests describe the bulk of it; this
section carries only what they can't — modeling decisions and deliberate
divergences (Implemented), and known gaps, which contribute 0 unless noted
(Gaps).

### Implemented

- **DoT-tick scheduling** ticks on a single continuous grid per *episode* of
  continuously-maintained application — deliberately matching the reference
  site's phase continuity, so a debuff re-applied more often than once per
  tick interval (bellstrikeUmbra's bleed) keeps a steady cadence instead of
  restarting the phase on every re-application. **Do not reintroduce the
  per-window phase reset** — guarded by `tests/engine/bleedCadence.test.ts`.
  Detonation *count* is driven by the stack-history curve, not tick
  scheduling, so it is unaffected (`bleedDetonation.test.ts`).
- **Crosswind Spirit** (`buffs/crosswind.ts`) — the 0-5 charge counter is
  per-detonation state rather than a windowed buff: the def schema has no
  consume-on-read counter, and a window would wrongly credit the charge-0
  detonation.
- **Hawkwing 4-pc** (`buffs/hawkwing.ts`) — the stacking proc is stochastic,
  so it is computed as a whole-rotation schedule (seeded Monte-Carlo) rather
  than a buff def, which cannot express a per-hit roll.
- **Concentration** (Insightful Strike, `buffs/concentration.ts`) —
  deliberately diverges from the reference site, which treats it as
  always-active once selected: here an affinity-hit ramp opens a renewable
  window, and every effect is scaled by the resulting activation probability.
- **Morale Chant** (`buffs/morale.ts`) — the stack curve is a whole-rotation
  schedule (not expressible as a static def); its tier-6 Yi River ticks
  deliberately take no weapon or mystic boost.
- **Combat Settings** — the Qi Break window's `startSec`/`durationSec` feed
  `qiPhase` even while the toggle is OFF, because Morale Chant's
  stack-doubling depends on the same window. `dragonsBreath` has no confirmed
  teammate-facing value — the extracted `dragonBreath` def is the caster's own
  Combustion mechanic, not a teammate buff — so it is stored but contributes 0.
- **Bellstrike Umbra bleed is Sword-typed** — bleed ticks and Bleed Detonation
  carry `weaponOrAttribute: "Sword"` (on the stand-in skill / detonation skill
  and as `dot.weaponOrAttribute` fallback on the debuff), so column `T` gives
  them sword boost *and* all-martial like any Sword skill, per the lvl-110
  workbook's skill-type column.

### Gaps

- **`getDefenseReductionAt`** (time-varying target defense reduction). Zero
  extracted defs carry `defenseReduction` — dead data with the current dataset,
  so it is left unimplemented rather than building a `TargetOverride`
  time-query hook nothing exercises.
- **`formbendBonus` / `formbendBonusTriggers`** (rainwhisperShield's +2 s
  duration bonus). Confirmed real on the site, but gated on a stand-alone
  `formbendArmorSet` checkbox with no equivalent gear-set, inner-way, or toggle
  in this app's data model. The fields survive in `buffDef.ts`'s schema and are
  read by nothing.
- **`ConsumeOnMatch.mistwillowCategory`** — `buffEngine.ts` gates on
  `opts.mistwillowCategory`, but `timeline.ts` only populates `opts` from a
  skill's `prop:` / `attack:` tags, so the flag is never set. It would need the
  timeline to flatten a per-hit light/heavy mistwillow categorization into
  `opts`. One def uses it (`springThunder.json`), and a def gated on it alone
  never consumes.
- **`starsAlignBonus`** (Stars Align 4-pc, `= distance × 5`) is stochastic —
  computed from live distance on the site. Equipping the set enables the buff
  but it contributes 0. See `buffs/paramMap.ts`.
- **`revelryScript` as an inner-way param** — `revelryScript.json` is registered
  across 6 specs and is never turned on by anything selectable in this app, so
  every one of those registrations always contributes 0. (The Combat Settings
  toggle of the same name is a separate, implemented +30 % — don't conflate
  them.)
- **`insightfulStrike` is deliberately absent from
  `paramMap.ts`'s `SITE_PARAM_TO_INNER_WAY`.** Mapping the param would
  re-trigger `concentration`'s `statModifiers` through the generic buff engine,
  which knows nothing about the activation counter and would apply them
  always-on — double-counting against the model above. This is a documented
  gap, not a missed mapping. The class-signature params
  (`swordHorizon`/`combo`/`frostCladNight`) were audited the same way and found
  safe: the defs they gate are situational tag-targeted procs, a different
  mechanic from the flat baseline stats `mindMethodPanelStats.json` bakes.
- **bamboocut_dust's second `calculationHooks`** (soulbreak pool,
  falling-blossom stacks, perfect-catch, phantom-rally injected entries). A
  bespoke stateful per-cast state machine with its own injected-entry
  scheduling, not expressible as static `BuffDef`s / `HitTrigger`s.
- **`forceCritIfHighCrit`** — its site gate is a crit-weight ≥ 0.7 test with
  no equivalent here; `buffEngine.ts` emits a warning for it.
- **Known trigger no-op**: on `bamboocutWindTwinblade` and
  `stonesplitBalanceDualCut`, Umbrella Q's `castSkill` trigger targets
  Resonance / First Resonance skills those classes never received, so it
  silently does nothing.

### Inner-way audit

Every inner way's effects live in one of the four layers above. A single inner
way commonly spans more than one — fine, as long as no single effect is
counted twice. `paramMap.ts`'s header comment is the authoritative
source-of-truth note this table summarizes.

| Inner way (site param) | Status | Notes |
| --- | --- | --- |
| Sword Horizon / `swordHorizon` (bellstrikeUmbra signature) | Panel tier stats + buff engine + `crosswind.ts` | Tier stats, T6 detonation retain, the charge counter and guaranteed-affinity are all modeled. The crosswindBlade/bloodBurst mode toggle is unimplemented — but bloodBurst is the site's own default and the app never applies the crosswindBlade conversion, so the omission is **correctly inert**. |
| Moon Above Flowers / `combo` (silkbindJade signature) | Panel + buff engine (combo-count buffs) | Disjoint channels. |
| Frostwhite Night / `frostCladNight` (stonesplitBalancePureTang signature) | Panel + buff engine (Frost-Clad Snowbreak procs, Forgetfulness) | Disjoint channels. |
| Wolfchaser's Art / `wolfchasersArt` | Panel + buff engine | Disjoint channels. The extra-detonation FSM is an unmodeled gap. |
| Thousand Mountain Law / `mountainsMight` | Panel + buff engine | Disjoint. |
| Throat-Pierce / `throatPierced` | Panel + buff engine | Disjoint. |
| Star-Picker / `starReacher` | Panel + buff engine | Disjoint. |
| Lone Loyalty / `steadfastDevotion` | Panel + buff engine | Disjoint. |
| Boat on Wood / `towlineSweep` (bamboocutDust) | Panel + buff engine (`towlineSweepT6Special` forceCrit bonus) | Disjoint; `forceCrit` is now consumed, so this def is live. |
| Morale Chant / `moraleChant` | Panel + `timeline.ts` stack schedule (`buffs/morale.ts`) | Stacks drive `allDamageBoost` + `phys.penetration`; tier 6 adds Yi River ticks. |
| Tang Anthem / `songOfTang` | Panel (`precision 0.059`, `critDamageBoost 0.04`) + buff engine (`tangMelody`: triggered, stacking `critDmg 0.03`×≤5, rate-limited) | **Verified NOT a double-count** — a flat always-on tier stat vs a distinct triggered mechanic that ramps and decays independently. |
| Endurance Doctrine / `artOfResistance` | Panel + `buildContext`'s `generalDamageBoost += 0.02` + buff engine (`resistanceResolve`: T6-only +10 % for 12 s on a rainwhisper-shield buff ending) | **Verified NOT a double-count** — different magnitude, trigger, and duration. |
| Insightful Strike / `insightfulStrike` | Panel (phys.min/max/pen tier stats only) + the `concentration` activation model | **Param deliberately unmapped** — see the gap entry above. `buildContext`'s flat `dotDamageBoost` fallback still serves every caller that doesn't set the activation-scaled override (`perSkillDamage.ts`, direct `buildContext` calls in tests). Do not map the param without re-deriving this; `insightfulStrike.test.ts` guards it. |
| Bliss Bleeding / candidate for `thunderousBloom` | Unmapped (unverified candidate) | `thunderousBloom` is a Silkbind-Jade inner way in the site registry with no confirmed app equivalent. |
| (no app equivalent) / `restoringBlossom` | Unmapped | Site registry path `silkbind_deluge` has no matching app class/spec. |
| Stars Align (set) / `starsAlignActive` | Enabled via set mapping; value uncomputed | Stochastic — see the gap entry above. |

## Verification

- `pnpm test` — **573 tests across 65 files**, all green.
- There is **no locked-DPS fixture**. `defaultInputs` (`engine/defaults.ts`) is
  the default Bamboocut-Wind build, not an anchor; no test asserts an absolute
  DPS number.
- `tests/engine/damageRules.test.ts` is the only guard on the four calculation
  rules, and it is directional (asserts the sign/shape of a change, not a
  value).
- `tests/engine/bellstrikeUmbraParity.test.ts` is a diagnostic comparison
  against one verified live-site build (site DPS 48,365 / total 2,936,621 /
  Bleed Detonation 1,578,359 over ~60.7 s). Its DPS bands are an intentionally
  **loose, re-centered fit around what the engine actually produces** — the
  engine still lands short of the site. Do not tighten the bands to the site's
  numbers until a term-by-term reconstruction closes the gap. The
  white→yellow rate-conversion assertion in that file *is* exact and must stay
  green.
- Everything else is behavioural: `bleedCadence` / `bleedDetonation` /
  `concentration` / `hawkwing` / `soulShaken` / `combustion` / `rateResistance`
  / `insightfulStrike` and ~50 more under `tests/engine/`.
