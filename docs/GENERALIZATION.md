# GENERALIZATION.md — decoupling the engine from Bellstrike Umbra

A phased plan to make skills, buffs, debuffs, attunements and inner ways
data-driven and per-class, so adding a class touches **no file in
`src/engine/`**.

**Behaviour is frozen.** Every phase is a refactor: the engine's output for
Bellstrike Umbra must stay bit-identical throughout. This document is temporary
— as each phase lands, its rules fold into `BUFFS.md`, `TIMELINE.md` and
`CLASSES.md`, and this file is deleted.

## Status (2026-08-10)

Every phase below was verified against `tests/engine/engineBaseline.test.ts`:
24 builds, bit-identical, and the `profile-v7` anchor still reporting
dps 74381.62.

| phase | state |
| --- | --- |
| P0 golden snapshot | **done** |
| P1 scoped-stat attunement | **done** |
| P2 identity / no name matching | **done** — 5 commits |
| P3 SkillBehavior contract | **done** |
| P4 status ledger | **done, scope changed** — see below |
| P5 art-modifier channel | **done**, as behaviour hooks rather than def fields |
| P6 DoT module | **done** |
| P7 mechanic plugins | **partial** — Crosswind ported; four stochastic mechanics remain inline |
| P8 class descriptor | **partial** — `classDefinition()` unifies lookup; inner-way defs not started |
| P9 acceptance | **1 of 3** — no skill/debuff name matching remains in `src/engine` |
| P10 wiki rewrite | **not started** |

Two deviations worth reading before continuing:

1. **P3 and P4 swapped.** `HitInput.statuses` needs a `StatusView`, so the
   ledger had to exist first.
2. **The two status stores were NOT merged, and should not be naively.** They
   disagree on what "active" means — the ledger unions any covering window, the
   buff engine takes the latest apply at or before the time, so a shorter
   re-apply shortens the buff (`rainwhisperShield`: `duration: 8` with a 12 s
   `durationByTrigger`). Merging storage would silently extend every buff shaped
   like that. `castBuffs.ts` unifies the read surface instead and documents the
   divergence at the seam. Doing it properly needs a per-status policy on the
   ledger — a real design decision, not a refactor step.

**What still reaches for a class by name:** three `classId === "bellstrikeUmbra"`
branches and five inner-way `name === "…"` comparisons, all inside the four
mechanics P7 has yet to move and the inner-way defs P8 has yet to build. No
engine code addresses a *skill or debuff* by name any more.

---

## 0. Thesis

The mechanism we want mostly **already exists in the data and in the UI**. What
is missing is that the engine doesn't read it, and keeps a hardcoded mirror of
it instead.

The clearest case: the `attune:` tag namespace is editable in the Skill Editor's
Effects card (`SkillsTab.tsx:996-1003`, vocabulary at `:53`), is present on
9–19 skill files in **every one of the eight classes**, and has **zero readers
anywhere in `src/engine`**. Meanwhile `timeline.ts:102` hardcodes the same
information as a set of display names.

So the work is less "design a new system" than "connect what is already
declared, then delete the mirrors". Three primitives are genuinely missing:

1. **A scope join** — one predicate matching a modifier's declared scope against
   an entity's namespaced tags, used by *both* the engine and the Effects card.
2. **One status ledger** — today there are two, merged by hand.
3. **An art-modifier channel** — buff data can only emit `{statKey, amount}`, so
   anything that patches the art row has to be an `if` in `timeline.ts`.

---

## 1. Findings

### 1a. The attunement is a scoped stat, and its tag is already in the data

An attunement is a **user stat** (rolled on gear), not a buff. Its scope is a
category of skills. The codebase already has two stats of exactly this shape —
`weaponBoosts` keyed by `art.weaponOrAttribute`, `mysticTypeBoosts` keyed by
`art.mysticCategory` — both joined inside `formula.ts` and both already rendered
in the Effects card (`catalog.ts:229-238`).

`dingYinByTag` is the third, and it is the only one not wired:

| | today | should be |
| --- | --- | --- |
| stat value | `inputs.dingYinByTag["Bleed Boost"]` | unchanged |
| scope | `BLEED_ATTUNEMENT_SKILLS = Set(["Bleed Detonation", "Bleed Tick"])` (`timeline.ts:102`) | the `attune:bleed` tag already on those two files |
| class gate | `inputs.classId === "bellstrikeUmbra"` (`timeline.ts:104`) | none needed — the tag is the gate |
| applied via | `art.correction` (`timeline.ts:685`), threaded into the DoT path as `bleedCorrection` (`:1065`) | `E_dingYin`, the slot built for it |

Verified: `attune:bleed` sits on exactly `bleed-tick.json` and
`bleed-detonation.json` — precisely the two names in the hardcoded set.
Combustion exists only as a debuff row with no skill file, so it carries no
`attune:` tag and its deliberate exclusion (recorded at `timeline.ts:99-102`)
is preserved without a special case.

### 1b. The formula already has the slot, and it is dead

`formula.ts:379`:

```
F = F_base * (1 + H_total) * count * I_corr * (1 + E_dingYin) * dotMult
```

`E_dingYin` (`:372`) reads `ctx.dingYinByTag["DingYin" + dingYin]` where
`dingYin` is a `1|2|3` parameter. Nothing writes those keys — the real map is
keyed by English tag names — so the factor is permanently `1`.

Bleed attunement is meanwhile injected through `I_corr`. **Both are post-`H`
multiplicative factors of the form `(1 + v)` on the same line**, so moving the
value from `I_corr` to `E_dingYin` is arithmetically identical, not merely
close. That makes phase 1 provable rather than eyeballed.

Both damage paths converge correctly: `hitToArtRow` reads `skill.tags`
directly, and the DoT path already copies `weaponOrAttribute` / `mysticCategory`
onto the tick art row from the tick-source skill (`timeline.ts:1036-1047`),
resolved by stripping `debuff-` from the debuff id — which for
`debuff-bellstrikeUmbra-bleed-tick` yields `bellstrikeUmbra-bleed-tick`, the
file that carries `attune:bleed`.

**Do not merge dingYin into `T`.** `weaponBoosts`/`mysticTypeBoosts` are
additive inside `H_total`; dingYin is its own multiplicative factor. Same
concept, different channel, different number.

### 1c. There are two implementations of the scope join

- `BuffEngine.bonusAffects` (`buffEngine.ts:749`) decides what applies to damage.
- `catalog.bonusAffectsTags` (`catalog.ts:199`) decides what the Effects card
  *claims* applies.

They mirror each other by hand, so the card can already assert a buff a skill
doesn't receive, or omit one it does, with no test to catch it.

### 1d. There are two status ledgers

`timeline.ts` is itself a buff store — `windowsByBuff`, `stackHistory`,
`permanentOpened`, `stacksAt` (`:355-401`). `BuffEngine` is a second,
independent store — `activeBuffs`, `buffHistory`, `stackPools`. They never talk:

- `resolveState` (`:500-511`) queries the engine and appends its effects to the
  ones derived from the timeline's own ledger, splicing the memo key by hand.
- Display (`:848-929`) walks one ledger, then the other, dedupes by id with
  `seenBuffIds`, then bolts on four more blocks (Morale, Concentration,
  Hawkwing, Bitter Season) that live in neither.

### 1e. Art-row patches have no data channel

`computeSkillDamage` accepts `correction`, `extraCritRate`, `extraCritDamage`,
`extraPhysPenetration`, `guaranteedCrit`, `specialTag`. `BuffDef` can express
**none** of them — `DamageEffectsResult` is `{effects, forceCrit, breakdown}`.
So every mechanic that isn't a stat delta becomes an `if` in the event loop:
the qi-phase tags (`:666`, `:693-702`), the min-phys crit sentinel (`:687-692`),
the bleed correction (`:685`).

### 1f. Skill identity is the display name — everywhere

`castTagOf()` returns `skill.name` (`tags.ts:17`), and three name-keyed sets
drive mechanics in the timeline (`BLEED_ATTUNEMENT_SKILLS`,
`CONCENTRATION_DOT_MULT_SKILLS`, `castTagOf(skill) === "Bleed Detonation"` at
`:648`). Renaming a skill in the editor silently changes its damage.

`skillTagsOf` (`tags.ts:7-14`) then puts `skill.name`, `skillType`,
`weaponOrAttribute` and `attributeAttack` into the tag set **un-namespaced**,
alongside the `prop:` / `weapon:` / `mystic:` entries — and both `affects` and
`triggers` match by *prefix*. This is not an edge case; measured across the 59
def variants in `src/data/skills/buffs/`:

| | count | name-based |
| --- | --- | --- |
| `affects` entries | 42 | **40** (only `sustain` ×2 are structural) |
| distinct `triggers` prefixes | 42 | **42** |

So `affects: ["Bleed"]` matching any skill whose *display name* starts with
"Bleed" isn't a hypothetical — name-prefix matching is the primary addressing
mechanism on both the scope side and the trigger side.

**Dependency worth knowing before this is touched:** DoT ticks match defs
*only* by name, because `dotTickSkill` (`timeline.ts:1203-1217`) synthesizes a
`Skill` with **no `tags` field at all** — its tag set is just
`{debuff.name, skillType}`. So `affects: ["Bleed Tick"]`, `["Combustion"]` and
`["UmbDrone"]` reach DoT ticks purely through that synthesized display name.
Removing name matching without first giving `Debuff` a `tags` field and
propagating it would silently switch off every DoT-targeted buff.

### 1g. Class-specific code in the timeline

Roughly a third of `timeline.ts`'s 1281 lines:

| lines | what |
| --- | --- |
| 102-107 | two name-keyed skill sets |
| 252-266 | Hawkwing schedule, gated on `inputs.set === "Hawking"` |
| 268-286 | Concentration schedule, gated on classId + inner-way name |
| 288-337 | Bitter Season stacks and effects |
| 456-466 | qi-break window, Crosswind tracker construction |
| 535-559 | `if (… inputs.classId === "bellstrikeUmbra")` inside `resolveState` |
| 648-661 | Crosswind driven by a skill name, writing `ZENITH_*` ids |
| 683-702 | bleed correction, min-phys sentinel, qi-phase branches |
| 762 | Zenith's duration cap special-cased inside the generic `extendFrames` path |
| 800-835 | Bitter Season windows injected after the event loop |
| 1025-1110 | the DoT tick loop, with `bleedCorrection` and Bitter Season `tickWeight` |
| 1112-1162 | Yi River — a synthetic `Skill` literal and its own damage loop |
| 1203-1265 | DoT art builders |

Plus `panel.ts:268,285-293,371` hardcoding inner-way scalars by English display
name, and `builtinBuffs.ts` keyed `Record<classId, Buff[]>` with an entry for
Umbra only.

### 1h. Adding a class touches ten registries

`schools.json`, `specMeta.json`, `CLASS_SPEC` (`buffs/data.ts:22`),
`BUILTIN_SKILLS_BY_CLASS` (`data/skills/index.ts:63`), `debuffsLibrary.json`,
`BUILTIN_BUFFS` (`builtinBuffs.ts:27`), `defaultRotations.json`,
`handRotations.json`, `attunements.ts` `classIds`,
`classes/retunementPools.ts` — plus `timeline.ts` and `panel.ts` edits for
anything the class does that Umbra doesn't.

### 1i. An inner way can act through five channels

`mindMethodPanelStats.json`; hardcoded scalars in `buildContext`;
`mindMethodOverrides.ts` JSON rules; `paramMap` → `BuffDef.enabledParam`; a
bespoke module plus inline timeline code (`bitterSeason`, `concentration`,
`morale`, `innerWayBonus`). `CALCULATION.md` § "Mind-method layers" documents
four of these and says keep them disjoint — a correct rule that currently needs
five lookup sites keyed by English display strings to honour.

### 1j. The Skill Editor preview is a second damage path

`perSkillDamage.computeSkillPreview` applies `artsOverrides` that the timeline
never applies (stated in `CALCULATION.md` § "Mind-method layers"). Two code
paths answer "what does this hit deal", and they already disagree.

---

## 2. Target architecture

### 2a. Two orthogonal axes

Every modifier — buff-def, class-spec mechanic, attunement, set bonus, inner
way — declares both, separately:

| axis | question | expressed as | Effects card column |
| --- | --- | --- | --- |
| **availability** | does this *build* have it? | `spec`, `enabledParam` + `minTier`, `requiresSet`, inner-way tier, stat > 0 | `requires` / `active` |
| **scope** | which *entities* does it touch? | namespaced tags | `affects` |

A `classId === "bellstrikeUmbra"` check inside the damage path collapses the two
into one opaque condition — which is exactly why it can be neither rendered nor
reused. Splitting them is what makes every modifier describable.

### 2b. Direct addressing only — tags and ids, never names

Reserved prefixes: `weapon:`, `mystic:`, `attune:`, `attack:`, `prop:`, plus new
`type:`, `dot:`, `role:` and `cast:`. Two addressing forms, both exact:

- **by tag** — `affects: ["role:bleedDetonation"]`, satisfied only by an entity
  that literally declares `role:bleedDetonation`. For categories.
- **by id** — `affects: ["skill:bellstrikeUmbra-bleed-detonation"]`. For a
  genuinely singular target. Not available to a def shared across specs, since
  ids are class-scoped.

`matchesScope` considers **only** namespaced tags and ids. A display name can
never satisfy a scope or fire a trigger, and `skillTagsOf` stops emitting bare
values (`sustain` becomes `type:sustain`; `weapon:`/`mystic:` already exist as
explicit tags, so only the duplicate bare copies go).

**Prefix matching is replaced by multi-tagging.** Where a prefix deliberately
covered a family — `triggers: ["AnxiSoldier"]` catching `AnxiSoldierMoDown`,
`…MoJump`, `…MoSweep` — every member declares the shared `cast:anxiSoldier` tag
*and* its own specific one. That is strictly more expressive than a prefix (a
skill can belong to several families) and it is explicit, so `exactMatch`
disappears along with the prefix semantics.

Trigger sources carry an explicit `Skill.castTag` **field** — authored, not
derived from `name`, so a rename is just a rename.

### 2c. Layers

```
data (per class folder: skills, debuffs, buffs, rotations, mechanics)
  │
  ├─ scope.ts        matchesScope(tagSet, scope)     ← one join, engine + UI
  ├─ ledger.ts       one StatusLedger; StatusView is read-only
  ├─ modifiers.ts    resolve(skill, frame, statuses) → {statEffects, artPatches, forceCrit}
  ├─ behavior.ts     SkillBehavior; DEFAULT_BEHAVIOR is fully data-driven
  ├─ dot.ts          episodes, stack shapes/ladders, tick art rows
  └─ mechanics/      TimelineMechanic plugins (the stateful exceptions)
        │
timeline.ts   scheduling + the ledger + the event loop. No class name, no skill name.
formula.ts    the one damage chain. Unchanged.
```

### 2d. The skill contract

The formula stays shared — a skill owns its **behaviour**, not a private copy of
the arithmetic. Two hard constraints force this:

- **Custom skills can never carry code.** `inputs.customSkills` is JSON from
  localStorage, so the data path must stay fully capable; a module is a
  built-ins-only escape hatch.
- **Most skills have no behaviour.** Of 24 Umbra skills, three do. A module per
  skill would be 21 files of boilerplate per class.

```ts
interface SkillBehavior {
  modify?(input: HitInput): HitModifiers      // stat effects + art patches it claims
  chooseVariant?(input: HitInput): HitVariant | null
  onHit?(input: HitInput): HitOutcome         // statuses to write, events to queue
  display?(input: DisplayInput): StatusChip[]
}

interface HitInput {
  skill: Skill
  hit: SkillHit
  frame: number
  statuses: StatusView   // read-only: activeAt / stacksAt / remainingAt
  build: BuildView       // read-only: classId, set, innerWay(name) → tier, dingYinByTag
}
```

`statuses` is the active-buff view the timeline hands to the skill. Writes come
back as a returned `HitOutcome` the timeline applies, keeping ordering
deterministic and the memo key derivable. `DEFAULT_BEHAVIOR` drives triggers,
variants and tags from data, and is what every custom skill gets. Modules are
opt-in, resolved by skill id, colocated with the JSON and its `.md`.

### 2e. Class folder

```
src/data/classes/bellstrikeUmbra/
  index.ts            ← ClassDefinition: id, spec, primaryAttribute, arsenal,
                        skills, debuffs, buffs, rotations, mechanics,
                        attunements, dingYinTags, retunementPool
  skills/*.json  (+ optional *.ts behaviour, + optional *.md notes)
  debuffs.json
  buffs/*.json        ← class-tied defs move out of the shared pile
  rotations.json
  mechanics/*.ts
```

Adding a class = one folder + one registry line.

---

## 3. Phases

Each phase ends green on the full suite **and** bit-identical against the phase-0
snapshot. Land them as separate commits on a branch.

### P0 — Golden snapshot

Serialize the full `Result` (dps, totalDamage, perSkill, timeline, buffWindows,
casts) for the default Umbra rotation plus variants: each armour set, Sword
Horizon on/off and tier 6, Bitter Season tiers 1/4/6, Insightful Strike tier 6,
dummy mode, qi-break enabled, pre-pull counted and not. Commit as a fixture with
an exact-equality test.

This is the entire safety net for phases 1-10. Nothing else starts until it's in.

*Files:* `tests/engine/engineBaseline.test.ts`,
`tests/engine/engineBaseline.fixture.json`, and a new `TESTING.md` § "The engine
baseline" carving out the exception to that file's "no locked-DPS fixture" rule.
Regenerate with `UPDATE_ENGINE_BASELINE=1`, and only deliberately.
*Migration:* none — test-only.

Delivered as 24 cases: the anchor, an attunement-cleared variant that isolates
the bleed channel, dummy/qi-break/healer/revelry/break-extension toggles, four
inner-way variations, Bitter Season at tiers 1/4/6, nine armour-set variants,
and the `defaultInputs` Umbra build for a second rotation. Each case pins dps,
total, duration, warnings, every per-skill row, the timeline/buffWindow/cast
counts, and a SHA-256 digest over the whole `Result`.

#### The user-supplied anchor build

`tests/migrations/testProfiles/profile-v7.json` is a real saved build
(Sword Horizon / Wolfchaser's Art / Insightful Strike / Morale Chant, all
tier 6; Hawking; food; fire TianGong; both share-debuffs; affinity bow; dummy
mode; qi-break at 34 s; four `bleedingDamage` attunement rolls) on rotation
`builtin-bellstrikeUmbra-nox-1m-dh`. It must produce **identical numbers before
and after the whole plan** and is the first case the snapshot test covers.

Reproducing it needs the app's exact pipeline — a saved profile carries no
derived stats (V6 dropped them), so the raw `inputs` alone will not run:

```
localStorage["wwm.profiles"] = { v: 7, profiles: [file.profile], activeId: … }
const inputs = loadProfiles().profiles[0].inputs          // migrations + hydrate
runEngine(applyBowSet(applyArmorSet(withDerivedStats(inputs))))
```

Measured on `3f089a9` (2026-08-09), warnings empty:

| | value |
| --- | --- |
| **dps** | **74381.62** |
| totalDamage | 4285621.21 |
| rotationDuration | 57.6167 s |

Per-skill, descending — the stronger assertion, since a compensating pair of
errors can hold total DPS while moving rows:

| skill | type | n | expectedDamage |
| --- | --- | --- | --- |
| Bleed Detonation | sustain | 33 | 2151043.26 |
| Dragon Head - Plus | mystic | 1 | 725052.29 |
| Smolder (DoT) | sustain | 110 | 379504.60 |
| Bleed Tick (DoT) | sustain | 57 | 277096.22 |
| Sword Martial QQ | weapon | 16 | 111388.40 |
| Flute Ripple (DoT) | sustain | 5 | 87721.30 |
| SpearQ | weapon | 18 | 78760.15 |
| SwordSpecial 3-Hit | weapon | 27 | 73266.09 |
| Crosswind Blade | weapon | 9 | 61795.75 |
| Sword Martial QQQ | weapon | 8 | 55904.31 |
| Spear Special (1 Hit Cancel) | weapon | 4 | 49691.68 |
| SwordSpecial 4-Hit | weapon | 16 | 49527.82 |
| Yi River | mindMethod | 5 | 49060.89 |
| Sword Charge Stage 1, 3-Hit | weapon | 9 | 35526.12 |
| Dragon's Breath: Smolder 2 Hits | mystic | 3 | 34457.23 |
| Sword Martial Q | weapon | 4 | 27952.15 |
| Sword R Charge - Follow Up 1-Hit[cancel] | weapon | 3 | 13897.05 |
| SpearQ 5-Hit Cancel | weapon | 5 | 13723.96 |
| Sword Charge Stage 1, 4-Hit | weapon | 4 | 10251.95 |
| Deflect Cancel | weapon | 16 | 0.00 |

Four rows are load-bearing for this plan specifically and should be called out
in the test's failure message:

- **Bleed Detonation** and **Bleed Tick (DoT)** are the two `attune:bleed`
  entities — they are the *only* rows P1 can move, and it must move neither.
- **Smolder (DoT)** and **Flute Ripple (DoT)** are DoT rows *without* the
  attunement, so they prove P1's new join didn't over-reach.
- **Yi River** only exists via the Morale Chant tier-6 branch that P7 relocates
  behind `extraEvents`.

### P1 — Scope primitive + wire the attunement

1. `src/engine/scope.ts`: `Scope` type and `matchesScope(tagSet, scope)`.
2. Namespace `skillTagsOf` output; keep a compatibility pass for existing bare
   `affects` prefixes so no def changes meaning.
3. `AttunementOption` gains `affectsTag` (`bleedingDamage` → `"attune:bleed"`).
4. `panel.ts` builds `ctx.attuneBoostByTag` from `ATTUNEMENT_OPTIONS` +
   `inputs.dingYinByTag`; `formula.ts` computes
   `E_dingYin = ctx.attuneBoostByTag[art.attuneTag] ?? 0`.
5. `hitToArtRow` and the DoT art builders set `art.attuneTag` from the entity's
   `attune:` tag (DoT copies from its tick-source skill, as it already does for
   `weaponOrAttribute`).
6. Delete `BLEED_ATTUNEMENT_SKILLS`, `bleedAttunementValue`, the `art.correction`
   write at `:685`, the `bleedCorrection` parameter threaded through
   `dotTickDamage` / `dotTickDamageForShape`, and the dead `dingYin: 1|2|3`
   parameter with `art.dingYinTag`.
7. `catalog.receivesForSkill` gains an attunement `gearStatRow`, alongside the
   weapon and mystic rows it already emits.
8. Point `catalog.bonusAffectsTags` and `BuffEngine.bonusAffects` at
   `matchesScope`, deleting the duplicate.

**Tag only Umbra's two bleed entities.** The other seven classes' `attune:` tags
already exist in data; the moment the join is generic, giving them an
`AttunementOption` makes previously inert values live. That is a *gap being
filled*, not a refactor — separate, verified work.

*Migration:* none. `attune:` tags already exist on saved custom skills that were
seeded from built-ins, and absent tags simply mean "no attunement".

### P2 — Identity: kill name matching

The largest data change in the plan, and the one everything else rests on.
40 of 42 `affects` entries and all 42 trigger prefixes are display names today.

1. `Debuff` gains an optional `tags` field; `dotTickSkill` propagates tags from
   the tick-source skill and the debuff, so DoT ticks stop being addressable
   only by name. **This lands first** — see § 1f.
2. **Rename `BuffDef.triggers` → `triggeredBy`** (and `triggerDurations` →
   `durationByTrigger`, keyed by the same strings), as its own commit with the
   values untouched.

   The field is named for the wrong direction: `"triggers": ["SpearQ"]` reads as
   *this buff triggers SpearQ*, when SpearQ triggers the buff. Worse, it
   collides — `SkillHit.triggers` means the **outgoing** direction ("this hit
   triggers these things") and is persisted user data, while `BuffDef.triggers`
   means the **incoming** one and is repo data. The display layer had already
   corrected it: `catalog.ts` renders the def's field through `triggeredByNote`
   into a `ReceivesRow.triggeredBy`. Only the schema hadn't caught up.

   53 def files, plus `buffEngine.ts` / `catalog.ts` / `data.ts` / `buffDef.ts`.
   `triggerOnBuffEnd` and `triggerPhaseGate` are left alone — they name the
   triggering *event*, not a direction.
3. For each distinct `affects` / `triggeredBy` value, mint a `role:` or `cast:`
   tag and apply it to the entities it matches today. `sustain` →
   `type:sustain`; `affectsProperty` and `affectsWeaponTypes` already address
   structurally and are left alone.

   Kept as two passes over the same files on purpose — one commit where both the
   field name and every value changed at once is far harder to review, and to
   bisect if the equivalence harness disagrees.
4. `matchesScope` and the trigger map switch to exact tag/id matching;
   `anyTagStartsWith` over bare values, `exactMatch`, and the bare entries in
   `skillTagsOf` are deleted.
5. Delete the timeline's remaining name-keyed sets and the
   `castTagOf(skill) === "Bleed Detonation"` comparison.

**Equivalence harness.** Generate the initial tag assignments *from* the current
matches, then assert: for every def × every built-in skill and debuff across all
eight classes, the old predicate and the new predicate select identical sets.
That is exhaustive and mechanical, and it covers the seven classes the golden
snapshot does not.

*Migration:* none. Both fields are optional with fallback — a skill without a
`castTag` uses its name, exactly as today — so saved custom skills keep working
while the built-in data moves over.

### P3 — `SkillBehavior` contract

Introduce `behavior.ts` + `DEFAULT_BEHAVIOR`; route the event loop through it.
No mechanic moves yet — this phase only changes *who is asked*.

*Migration:* none.

### P4 — One status ledger

Extract `ledger.ts` from `timeline.ts`'s window/stack functions; make
`BuffEngine` a writer into it rather than a parallel store; expose `StatusView`.
Collapse the hand-written display merge.

Preserve **exactly** today's precedence: where an id exists in both stores the
timeline's own ledger wins for display, and both contribute to damage.

*Migration:* none — runtime state only.

### P5 — Art-modifier channel

Extend `DamageEffectsResult` to `{effects, artPatches, forceCrit}` and give
`BuffDef` the vocabulary to declare art patches. Convert the qi-phase tag
branches, the min-phys crit sentinel and the concentration DoT multiplier from
`if`s into defs. Fold the memo key derivation into `modifiers.resolve` — it must
stay at least as discriminating as today's hand-built suffixes, and
`hawkwingPhysBonus` / `dotDamageMultiplier` bypass `applyBuffEffects` entirely
(`timeline.ts:602`), so they need explicit inclusion.

*Migration:* none — built-in defs only.

### P6 — DoT module

Move episode merging, ladder/shape selection, tick art construction and tick
emission into `dot.ts`. Replace the `debuff-` id-prefix surgery with an explicit
optional `dot.sourceSkillId`, falling back to today's convention when absent.

*Migration:* none, because the field is optional with fallback. Making it
required later is the commit that owes one.

### P7 — Mechanic plugins

```ts
interface TimelineMechanic {
  id: string
  applies(setup): boolean
  prepare(setup): State | null
  statEffectsAt?(state, frame, skill): BuffStatEffect[]
  artPatchesAt?(state, frame, skill): ArtPatches
  onHit?(state, event): void
  extraEvents?(state, setup): DamageEvent[]
  tickWeightAt?(state, debuffId, frame): number
  display?(state, timeSec): StatusChip[]
}
```

Port one at a time, snapshot green after each: Crosswind → `bleed-detonation.ts`
`onHit`; Hawkwing, Concentration, Bitter Season, Morale (incl. Yi River via
`extraEvents`) → `mechanics/*.ts`. Zenith's duration cap becomes a property of
that status' own def instead of an id check in the generic trigger path.

*Migration:* none.

### P8 — Class descriptor + inner-way defs

Fold the ten registries into one folder per class. Move class-tied buff defs out
of `src/data/skills/buffs/` into the owning class folder. Replace the hardcoded
inner-way scalars in `buildContext` and `innerWayBonus.ts` with one
`InnerWayDef` per inner way declaring which of the four documented channels it
uses.

*Migration:* none if ids are unchanged — and they must be, since ids are user
data (`CLASSES.md` § "Naming"). If any id moves, that commit owes a
`migrateEntityId` case.

### P9 — Acceptance

Three conditions, all of which must hold:

1. **Zero numeric change.** The P0 snapshot is bit-identical, and the
   `profile-v7.json` anchor still reports **dps 74381.62**, totalDamage
   4285621.21, and every per-skill row unchanged to the cent. This is the
   headline promise of the plan: after ten phases the engine is restructured and
   the numbers have not moved at all.
2. **Zero engine edits for a new class.** Wire one currently-unimplemented class
   touching **no file in `src/engine/`**. If that is impossible, the refactor
   isn't finished. Keep the suite Umbra-only per `TESTING.md` § "Class scoping";
   the new class is wired, not asserted on.
3. **No name matching left.** `grep` finds no comparison of `skill.name` or
   `debuff.name` against a literal anywhere in `src/engine/`, and no
   `classId === "…"` in a damage path.

### `docs/` — updated per phase, not at the end

`docs/` ships next to the code and wins over the wiki (CLAUDE.md), so it must
never be stale mid-series. Each phase updates the topic file it invalidates, in
its own commit within that phase:

| phase | topic file |
| --- | --- |
| P1 | `BUFFS.md` gains a third category — **scoped stat** (`weaponBoosts`, `mysticTypeBoosts`, `dingYinByTag`), visible in Panel Stats rather than the Skill Editor, so "no invisible magic" is satisfied differently; its dividing question becomes three-way. `CALCULATION.md` § "`buildContext`" documents the live `E_dingYin` join. |
| P2 | `CLASSES.md` § "Naming" — the tag namespaces, `castTag`, and the rule that no engine code matches a name. |
| P3 | `TIMELINE.md` § 5 — the `SkillBehavior` contract. |
| P4 | `TIMELINE.md` § 5 loses the two-systems split; one ledger. |
| P5 | `BUFFS.md` § "Which system" — art patches are now data. |
| P6 | `CLASSES.md` § "Where data lives" — `dot.sourceSkillId` replaces the `debuff-` prefix contract, which `CLASSES.md` currently calls load-bearing. |
| P7 | `CALCULATION.md` § "Mechanic coverage" — rewritten against the plugin interface; `BUFFS.md` § "Known exceptions" shrinks to "implements `TimelineMechanic`". |
| P8 | `CLASSES.md` § "Where data lives" and `CALCULATION.md` § "Mind-method layers" — one class folder, one `InnerWayDef`. |
| P9 | `TESTING.md` — the snapshot, the anchor build, the equivalence harness. |

### P10 — Rewrite the wiki (last step)

The wiki is the **ordered how-to layer** over those topic files, cloned beside
this repo at `../where-winds-meet-dps.wiki`. It is rewritten **once, at the
end**, deliberately: the how-tos are step-by-step file lists, and the file
layout moves in P2, P6, P7 and P8. Rewriting them after each phase would mean
rewriting the same pages four times and shipping three intermediate versions
that were never true for longer than a week.

CLAUDE.md's rule — *a change that invalidates a how-to updates that page in the
same piece of work* — is satisfied by this being the closing commit series of
the same branch series, not a follow-up. **The plan is not done until P10 is
merged.** If the work is ever abandoned part-way, the wiki must be updated to
match whatever actually shipped before stopping.

Per page:

| page | change |
| --- | --- |
| `How-to-Add-a-Class.md` | **Full rewrite.** Ten registry edits become one folder plus one registry line. This page changes the most. |
| `How-to-Add-a-Skill.md` | Tag namespaces and `castTag` as authored fields; when a skill needs a behaviour module versus data only; that a rename is now safe. |
| `How-to-Add-a-Buff-or-Debuff.md` | The availability × scope split; addressing by tag or id, never name; `Debuff.tags`; the art-patch vocabulary; defs live in the class folder. |
| `How-to-Add-an-Inner-Way.md` | **Largest single page (298 lines).** Five channels collapse to one `InnerWayDef`; the four-bucket classification stays but stops needing five lookup sites. |
| `How-to-Add-a-Rotation.md` | Light — rotations move into the class folder; steps otherwise unchanged. |
| `Architecture-Overview.md` | The new layer diagram; `timeline.ts` as scheduler plus ledger only. |
| `Damage-Calculation.md` | `E_dingYin` is live; scoped stats as a category; `I_corr` no longer carries attunement. |
| `Project-Conventions.md` | The no-name-matching rule and the reserved tag prefixes as conventions. |
| `Testing-Guide.md` | The golden snapshot, the `profile-v7.json` anchor, the equivalence harness. |
| `Saved-Profile-Migrations.md` | The optional-field-with-fallback pattern that let ten phases ship without a migration. |
| `Glossary.md` | New terms: scope, availability, scoped stat, cast tag, role tag, behaviour module, status ledger, art patch. |
| `Home.md`, `_Sidebar.md` | Only if a page is added or removed. |

Each page lands as its own commit in the wiki clone. Then delete this file and
its `docs/GENERALIZATION.md` entry — the plan has become the documentation.

---

## 4. What "easily editable" means when this is done

| I want to change | I edit |
| --- | --- |
| a skill's coefficients, frames, hits | its JSON — or the Skill Editor |
| which skills an attunement boosts | the `attune:` combobox in the Effects card |
| a DoT's ticks, duration, stack ladder, detonation | the debuff row in the Skill Editor |
| which skills a class buff affects | that def's `affects`, shown in the card's Receives column |
| whether a mechanic needs the build to have something | that def's availability fields (`requires` column) |
| an inner way's flat stats or scalars | its `InnerWayDef` |
| add a class | one folder, one registry line |
| add a genuinely stateful mechanic | one file in that class's `mechanics/` |

Everything a user can express is data; everything data can't express is one file
behind one interface; nothing is a name comparison.

---

## 5. Risks and non-goals

- **Inert values going live.** Seven classes' `attune:` tags and
  `defaults.ts:48`'s `{"Mouse Boost": 0.153}` currently affect nothing. Keep it
  that way until each is verified, or "no behaviour change" quietly stops being
  true.
- **Memo key.** Auto-derived signatures must be at least as discriminating as
  today's hand-built ones, or `resolveState` returns a stale `FormulaContext`.
- **Ledger precedence.** Unifying the two stores must preserve today's display
  precedence and damage contribution exactly.
- **Additive vs multiplicative.** dingYin stays its own factor; never folded
  into `T`.
- **Worker-safe.** Behaviour modules and mechanics are imported by
  `dpsWorker.ts` — no DOM, no dynamic imports that break the bundle split.
- **Not in scope:** verifying the other seven classes' coefficients. This plan
  removes the engineering cost of adding a class, not the data-sourcing cost.
  The suite stays Umbra-only.
- **Also worth folding in:** `computeSkillPreview` should run the same behaviour
  contract as the timeline, so the editor stops showing numbers the timeline
  won't produce.

---

## 6. Migration verdict

**No migration needed for any phase**, provided every new field on a persisted
shape (`Skill.castTag`, `dot.sourceSkillId`, role tags) is optional with a
fallback to today's convention, and no entity id changes. Saved profiles stay
legal and read identically.

Two things would change that verdict, and each owes a migration in its own
commit: making any of those fields required, or moving an entity id during P7.
