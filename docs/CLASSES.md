# CLASSES.md — classes, skill data, and id schemes

Read this before adding or editing a class, a skill/buff/debuff data file, or
anything that mints an entity id.

## Implemented classes

**Only Bellstrike Umbra (`bellstrikeUmbra`, spec `bellstrike_umbra`) is
implemented and validated.**

The other six classes in `schools.json` — Bellstrike Rainbow, Silkbind Jade,
the Stonesplit and Bamboocut specs — are **not implemented yet**. The skill
import may have pulled in data for them (`src/data/skills/<class>/*.json`,
`buffs/data.ts`'s class → spec map), but that data is unverified and their
engine output should not be relied on. Treat anything they surface (stray or
spurious imported skills, for instance) as provisional until the class is
actually built out.

The seven class ids and their buff specs (`CLASS_SPEC` in
`src/engine/buffs/data.ts`):

| class id | spec id | status |
| --- | --- | --- |
| `bellstrikeUmbra` | `bellstrike_umbra` | **implemented + validated** |
| `bellstrikeRainbow` | `bellstrike_splendor` | provisional |
| `silkbindJade` | `silkbind_jade` | provisional |
| `stonesplitPower` | `stonesplit_might` | provisional |
| `stonesplitStrength` | `stonesplit_strength` | provisional |
| `bamboocutDust` | `bamboocut_dust` | provisional |
| `bamboocutWindTwinblade` | `bamboocut_dust` | provisional |

Test-suite consequences are in TESTING.md § "Class scoping" — in short, the
suite is Umbra-only and must stay that way until a class is genuinely built out.

## Hand-maintained data files

These are the **source of truth** — edit them directly. They carry hand-tuned
coefficients and entries that no import produced (`elevatedAttributeMultiplier`,
the Smolder debuff, the bleed detonation wiring):

- `src/data/skills/<class>/*.json` — one file per class-owned skill
- `src/data/skills/universal/*.json` — one file per universal skill (see below)
- `src/data/skills/buffs/*.json` — one file per buff def
- `src/data/rotations/defaultRotations.json`
- `src/data/skills/debuffsLibrary.json`

Before authoring a skill, read TIMELINE.md — it documents how a skill carries
coefficients, fires triggers, receives buffs and gives buffs/debuffs, plus a
step-by-step "implement a skill correctly" checklist.

## Universal skills — one source, instantiated per class

Skills every class can equip (the mystic arts: Soaring, Fire Breath, Poet,
Flute, Dragon Head, …) live **once** in `src/data/skills/universal/`, with
`universal` as the id segment (`universal-soaring`,
`debuff-universal-combustion`). They are **never duplicated into class
folders**. `src/data/skills/index.ts` instantiates them per class: the
`universal` segment in the skill id and every trigger/condition id becomes the
class id, and `attributeAttack` becomes the class's `primaryAttribute` from
`schools.json`.

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

## Where data lives

| folder | holds | main consumer |
| --- | --- | --- |
| `baseStats/` | character stat/progression tables (talents, oddities, enhancements, breakthroughs) and the module that folds them into a base | `src/data/baseStats/index.ts` |
| `classes/` | per-class / per-spec metadata (schools, spec ids, retunement pools) | `engine/panel.ts`, `engine/buffs/data.ts` |
| `rotations/` | built-in rotation pools | `engine/builtinLibrary.ts` |
| `sets/` | armour-set tables (panel stats, damage boosts, base-stat boni) | `engine/panel.ts`, `engine/formula.ts` |
| `skills/` | per-class skill files, the class-unbound `universal/` skills, and the debuff library | `engine/builtinLibrary.ts` |
| `skills/boosts/` | conditional damage-boost lookup tables (boost-zone, arts) | `engine/formula.ts`, `engine/mindMethodOverrides.ts` |
| `skills/buffs/` | data-driven buff defs (one file per buff) | `engine/buffs/data.ts` |

Naming: data tables and modules in `src/data` are camelCase; the per-class
folders under `skills/` and the skill JSON inside them stay kebab-case, and so
do the two lowercase grouping folders `skills/boosts/` and `skills/buffs/`.

## Naming: no `site`, no pinyin ids

Both were renamed on 2026-08-02; neither may come back.

- **Class ids are English camelCase** — `bellstrikeUmbra`, `silkbindJade`,
  `stonesplitPower`, `bamboocutWindTwinblade`, … — never the old pinyin
  (`mingJinYing`, `qianSiYu`, …). Spec ids keep their snake_case form
  (`bellstrike_umbra`), which is a different namespace.
- **Entity ids carry no `site-` namespace**: skills are `<classId>-<slug>`,
  buffs `buff-<classId>-<slug>`, debuffs `debuff-<classId>-<slug>`. The
  `debuff-` / `buff-` markers are **load-bearing** — `timeline.ts` derives a
  DoT's tick-skill id by stripping `debuff-`.
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

- On `bamboocutWindTwinblade`, Umbrella Q's
  `castSkill` trigger targets Resonance / First Resonance skills those classes
  never received, so it silently no-ops. Not asserted — the trigger-resolution
  sweep is Umbra-scoped.
- Per-class engine gaps (unmodeled mechanics, contributes-0 defs) are catalogued
  in CALCULATION.md § "Mechanic coverage".
