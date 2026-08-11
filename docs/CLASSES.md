# CLASSES.md — classes, skill data, and id schemes

Read this before adding or editing a class, a skill/buff/debuff data file, or
anything that mints an entity id.

## Implemented classes

**Only Bellstrike Umbra (`bellstrikeUmbra`, spec `bellstrike_umbra`) is
implemented and validated.**

The other seven classes — Bellstrike Rainbow, Silkbind Jade, the Stonesplit
and Bamboocut specs — are **not implemented yet**, and are not registered
`ClassDef`s: `CLASS_IDS()` (`src/definitions/classes/registry.ts`) returns only
`bellstrikeUmbra`. Their imported data (schools, skills, buffs, debuffs,
rotations, spec metadata) lives under `reference/classes/` instead, unimported
by the app or the tests — kept for when one of them is actually built out.
Treat anything under that folder as provisional.

The eight class ids and their buff specs, preserved in
`reference/classes/schools.json` and `reference/classes/specMeta.json`:

| class id | spec id | status |
| --- | --- | --- |
| `bellstrikeUmbra` | `bellstrike_umbra` | **implemented + validated** |
| `bellstrikeRainbow` | `bellstrike_splendor` | provisional |
| `silkbindJade` | `silkbind_jade` | provisional |
| `stonesplitPower` | `stonesplit_might` | provisional |
| `stonesplitBalancePureTang` | `stonesplit_strength` | provisional |
| `bamboocutDust` | `bamboocut_dust` | provisional |
| `bamboocutWindTwinblade` | `bamboocut_dust` | provisional |
| `stonesplitBalanceDualCut` | `bamboocut_dust` | provisional |

Note the last three **share one spec**. That is a stand-in, not a claim they
play alike — it's why `bamboocutWindTwinblade` and `stonesplitBalanceDualCut`
inherit Umbrella Q's dangling `castSkill` trigger (see "Known gaps").

Test-suite consequences are in TESTING.md § "Class scoping" — in short, the
suite is Umbra-only and must stay that way until a class is genuinely built out.

## Hand-maintained data files

These are the **source of truth** for Bellstrike Umbra — edit them directly.
They carry hand-tuned coefficients and entries that no import produced
(`elevatedAttributeMultiplier`, the Smolder debuff, the bleed detonation
wiring). The seven not-yet-converted classes' equivalents are frozen,
unimported JSON under `reference/classes/` instead:

- `src/data/skills/bellstrike-umbra/*.ts` (`defineSkill`, one module per
  skill); `reference/classes/skills/<class>/*.json` for the seven not yet
  converted, one file per class-owned skill
- `src/data/skills/universal/*.ts` — one module per universal skill (see
  below), `instantiateUniversal`-retargeted onto every class the same way the
  JSON files used to be
- `src/data/skills/buffs/*.ts` and `src/data/skills/bellstrike-umbra/buffs/*.ts`
  — the 18 `defineBuff` / `defineClassBuff` modules behind Bellstrike Umbra's
  own buffs; `reference/classes/buffs/*.json` for the 35 not yet converted
- `src/data/rotations/defaultRotations.json` — Bellstrike Umbra's pool only;
  `reference/classes/defaultRotations.json` for the other seven
- `src/data/skills/bellstrike-umbra/debuffs.ts` (`defineDebuff`) — Bellstrike
  Umbra's six rows, read through `classDefinition(classId).debuffs`;
  `reference/classes/debuffsLibrary.json` (one key per class) for the seven
  not yet converted

Before authoring a skill, read TIMELINE.md — it documents how a skill carries
coefficients, fires triggers, receives buffs and gives buffs/debuffs, plus a
step-by-step "implement a skill correctly" checklist.

## Universal skills — one source, instantiated per class

Skills every class can equip (the mystic arts: Soaring, Fire Breath, Poet,
Flute, Dragon Head, …) live **once** in `src/data/skills/universal/`, with
`universal` as the id segment (`universal-soaring`,
`debuff-universal-combustion`). They are **never duplicated into class
folders**. `src/definitions/skills/universalSkills.ts`'s
`withUniversalSkills(classId, primaryAttribute, classSkills)` instantiates
them per class: the `universal` segment in the skill id and every
trigger/condition id becomes the class id, and `attributeAttack` becomes the
`primaryAttribute` the caller (each class's own `defineClass` module) passes
in.

The instantiated `<classId>-<slug>` id shape is **load-bearing** — saved
rotations and user skill overrides match built-ins by id, so a universal skill
must never surface with a class-less id. In the Skill Editor each class sees
its own instance, exactly like a class-owned skill.

## Skill special-logic docs

A skill whose behaviour is **not reconstructable from its JSON** — external
provenance for its coefficients, an engine flag with a story, a deliberately
unmodeled part — carries a sibling `<slug>.md` next to its JSON. One file may
cover a pair of variants (`universal/dragon-head.md` covers Dragon Head and
Dragon Head - Plus).

Most skills need none — create one only when there is special logic to record,
check for one before changing a skill, and never bulk-read them.

## One definition per class

`classDefinition(classId)` (`src/definitions/classes/registry.ts`) answers
what a class is made of — spec, primary attribute, inner ways, dingYin tags,
skills, debuffs, buffs, rotations and default, attunements, retunement pool —
and `CLASS_IDS()` is the one list, currently just `bellstrikeUmbra`. Reach for
it rather than opening the individual registries below; `builtinLibrary.ts` is
a thin read over it.

**Nothing in `src/engine` names a class, an inner way or a skill**
(`tests/engine/noClassSpecificEngineCode.test.ts`, with `defaults.ts`
allowlisted because the starting build is content rather than logic). Whatever a
class does beyond data reaches the engine through one of five registrations,
each a field on the class's `defineClass` call (`src/definitions/classes/classDef.ts`'s
`ClassDef`) that `src/definitions/classes/registry.ts` reads in one loop:

| the class needs | it declares |
| --- | --- |
| gate buffs — state markers the timeline reads | `gateBuffs` → `registerBuiltinBuffs(classId, buffs)` |
| a stochastic or stateful mechanic | `mechanics` → `registerMechanic(mechanic, MECHANIC_ORDER.…)` |
| procedural behaviour on one skill | `skillBehaviors` → `registerSkillBehavior(skillId, factory)` |
| a Skill Editor "is this active" gate | `displayGates` → `registerDisplayGate(defId, predicate)` |
| a poison/DoT extension window | `poisonExtensions` → `registerPoisonExtension(classId, statusId, maxRemainingSec)` |

`tests/engine/classExtensionPoints.test.ts` exercises the first four for a
fictional class and is the worked example. That was rehearsed for real first: wiring
`bellstrikeRainbow` with a mechanic, a gate buff, a behaviour and a display gate
touched exactly two files — its own module and the `src/data/classes` barrel —
and nothing under `src/engine`. The rehearsal was reverted rather than shipped,
because the wiring was the point and a real class needs verified coefficients.
**Building out one of the seven is data work**, not engine work: sourcing and
verifying its numbers.

An inner-way or set def declares a `mechanics` field the same way, read by
its own registry (`src/definitions/innerWays/registry.ts`,
`src/definitions/sets/registry.ts`) —
`declareMechanic`/`MechanicRegistration`/`MECHANIC_ORDER` are the one shared
contract all three owners use.

An inner way may also declare two of the five above, for the mechanics it —
not any one class — owns:

- `gateBuffs` (`InnerWayGateBuff[]`, `Buff` minus `classId`) — not registered
  directly. `src/definitions/classes/registry.ts` folds the gates of every
  inner way a class can slot into that class's `registerBuiltinBuffs` call,
  stamping the class's own id onto each record, because every consumer
  (`timeline.ts`, `SkillsTab.tsx`, `classDefinition()`) asks for a class's
  gates by class id, never by inner-way id.
- `displayGates` — registered directly by
  `src/definitions/innerWays/registry.ts`, since `registerDisplayGate` is
  already a global, def-id-keyed map with no owner concept and the predicate
  receives the whole `Inputs`; no class composition step is needed.

`skillBehaviors` is **not** on an inner way's list: a registration is
`{ skillId, factory }`, and `skillId` is a class-owned id
(`bellstrikeUmbra-bleed-detonation`) an inner way cannot name without naming a
class. The inner way exports the factory instead (Sword Horizon's
`swordHorizonCrosswind.ts` is the worked example) and the class supplies the
one-line `{ skillId, factory }` binding.

## Buff category

`ClassDef` splits a class's buffs into two lists:

- `classBuffDefs` — reachable because being the class is sufficient, even when
  activation is still gated by an inner-way tier, a talent or a qi phase.
  Surfaces as an ordinary Receives-card row.
- `mechanicBuffDefs` — the class's own spec mechanics. Same `BuffModule` shape
  and the same `BuffEngine` registration as `classBuffDefs`, but the Skill
  Editor's Receives card breaks them out into their own "Spec Mechanic"
  section instead of the general buff list (`ReceivesRow.isSpecMechanic`).

Both lists are also the source for the Class Buffs column
(`alwaysActiveClassBuffs` in `src/engine/buffs/catalog.ts`), scoped down to
the entries that target specific skills — see that function's own comments
for the scope rule.

`defineClassBuff` (`src/definitions/skills/buffDef.ts`) marks a `BuffModule` as
reachable through one of these two lists; the marker itself is inert
everywhere else — the class that lists the module is the only statement of
scope.

## Where data lives

`src/data/` holds only content — value declarations, id tables and JSON
tables. Adding a class touches only files under `src/data/` (its own modules
plus the one-line entry in `src/data/classes/index.ts`) — never
`src/definitions/`.

| folder | holds | main consumer |
| --- | --- | --- |
| `baseStats/` | character stat/progression tables (talents, oddities, enhancements, breakthroughs) — JSON only | `src/definitions/baseStats/index.ts` |
| `classes/` | one `defineClass` module per implemented class (`bellstrikeUmbra.ts`), the `CLASSES` list (`index.ts`), and retunement pool values | `classes/index.ts` |
| `innerWays/` | one `defineInnerWay` module per inner way (id, name, selectable tiers, panel stats, context scalars, tier ladder, optional mechanic, gate buffs, display gates, skill-behaviour factories), and the `INNER_WAYS` list (`index.ts`) | `innerWays/index.ts` |
| `rotations/` | Bellstrike Umbra's built-in rotation pool — JSON only | `src/definitions/rotations/registry.ts` |
| `sets/` | one `defineSet` module per armour set (id, 2-piece panel bonus, 4-piece formula bonus, optional mechanic), and the `SET_DEFS` list (`index.ts`) | `sets/index.ts` |
| `skills/` | Bellstrike Umbra's per-class skill files (`bellstrike-umbra/`), the class-unbound `universal/` skills, and `skills/buffs/`'s global buff defs | `src/definitions/skills/universalSkills.ts` |
| `skills/buffs/` | data-driven global/group `BuffModule`s (`defineBuff`); Bellstrike Umbra's own class buffs are `skills/bellstrike-umbra/buffs/` (`defineClassBuff`) instead | `engine/buffs/data.ts` |
| `reference/classes/` | the seven not-yet-converted classes' schools, spec metadata, skills, buffs and debuffs, and their default rotations — unimported JSON, kept for when one is built out | — |

`src/definitions/` holds the contracts, the registries and the composition
side effects that give the content above its shape and load it — grouped by
the same domains.

| folder | holds | main export |
| --- | --- | --- |
| `baseStats/` | the base-stat aggregation (`GLOBAL_BASE`, `DEFAULT_ODDITIES`, `getConfiguredBase`, `getMindMethodContributions`) and `breakthroughs.ts` (`getBreakthrough`) | `baseStats/index.ts` |
| `classes/` | the `ClassDef`/`RetunementPool` contract (`classDef.ts`), the registry and class-registration loop — including folding every slottable inner way's `gateBuffs` into that class's built-in buff pool (`registry.ts`) — and the poison-extension registry (`poisonExtensions.ts`) | `classes/registry.ts` |
| `innerWays/` | the `InnerWayDef` contract, its `InnerWayGateBuff` type, and tier helpers including `slottedInnerWayTier` (`innerWayDef.ts`), the inner-way registry and its mechanic- and display-gate-registration loop (`registry.ts`), and the def-list leaf store (`defStore.ts`) that `bitterSeasonMechanic.ts` reads without going through the barrel it is part of | `innerWays/registry.ts` |
| `rotations/` | `rotationPoolFor(classId)` | `rotations/registry.ts` |
| `sets/` | the `SetDef`/`SetFormulaBonus`/`SetPanelBonus` contract (`setDef.ts`) and the set registry and mechanic-registration loop (`registry.ts`) | `sets/registry.ts` |
| `skills/` | `defineSkill`/`defineDebuff`/`hit`/`dotTicks` (`skillDef.ts`), the trigger authoring helpers (`triggers.ts`), `defineBuff`/`defineClassBuff` (`buffDef.ts`), and `withUniversalSkills` (`universalSkills.ts`) | `skills/skillDef.ts`, `skills/buffDef.ts` |

Naming: data tables and modules in `src/data` are camelCase; the per-class
folders under `skills/` stay kebab-case, and so does the lowercase grouping
folder `skills/buffs/`. Skill files inside those per-class folders stay
kebab-case too, whether under `src/data/skills/bellstrike-umbra/` (converted
`.ts` modules) or `reference/classes/skills/<class>/` (the seven classes' JSON).

## Naming: no `site`, no pinyin ids

Both were renamed on 2026-08-02; neither may come back.

- **Class ids are English camelCase** — `bellstrikeUmbra`, `silkbindJade`,
  `stonesplitPower`, `bamboocutWindTwinblade`, … — never the old pinyin
  (`mingJinYing`, `qianSiYu`, …). Spec ids keep their snake_case form
  (`bellstrike_umbra`), which is a different namespace.
- **Entity ids carry no `site-` namespace**: skills are `<classId>-<slug>`,
  buffs `buff-<classId>-<slug>`, debuffs `debuff-<classId>-<slug>`. The
  `debuff-` / `buff-` markers are **load-bearing** — `dot.ts tickSourceSkillId`
  derives a DoT's tick-skill id by stripping `debuff-` when the debuff does not
  name one. Authoring `dot.sourceSkillId` overrides the convention.
- The ported buff engine lives in `src/engine/buffs/` (was `engine/site/`);
  `builtinLibrary.ts` (was `siteLibrary.ts`) exposes the built-in pools.
- Comments may still cite "the reference site" as the *source* of a ported
  value. That is provenance, not naming — leave those.

Both id schemes are user data. `migrateEntityId` / `migrateClassId` in
`storage.ts` heal old blobs on every load; they are idempotent and covered by
`tests/migrations/profileV4.test.ts`.

## Naming a new domain term

Look the Chinese up in `reference/locale/zhToEnOfficial.json` (~250k official
pairs straight from the game client) and copy the official English. **Never
hand-invent a term the game already names.** The no-Chinese-in-`src` rule itself
is in CLAUDE.md § "Language".

## Known gaps

- On `bamboocutWindTwinblade` and `stonesplitBalanceDualCut`, Umbrella Q's
  `castSkill` trigger targets Resonance / First Resonance skills those classes
  never received, so it silently no-ops. Not asserted — the trigger-resolution
  sweep is Umbra-scoped.
- Per-class engine gaps (unmodeled mechanics, contributes-0 defs) are catalogued
  in CALCULATION.md § "Mechanic coverage".
