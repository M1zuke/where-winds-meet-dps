# BUFFS.md — classifying a buff before you build it

Read this before implementing any buff, debuff, or "this mechanic boosts X"
effect. **Classify first** — the two categories live in completely different
places, and putting one in the other's home is the most common way this engine
grows a double-count.

TIMELINE.md § 5 documents the *schemas* (`Buff`/`Debuff` + `HitTrigger` vs
`BuffModule`/`BuffEngine`). This file decides *which* you want.

## The dividing question

Two questions, not one:

> 1. Is it a **stat the character has**, or an **effect that switches on**?
> 2. If it's a stat: does it apply to **everything** (→ category 1, stat layer),
>    or only to a **category of skills** (→ category 3, scoped stat)?
>
> An effect that switches on and reaches only certain skills is category 2 — a
> buff-def, visible in the Skill Editor.

## Category 1 — base-stat / overall-stat buffs

A permanent modifier to the character's OWN stats (penetration, affinity/crit
damage, min/max attack, …) that applies to **every** skill.

Examples: the food buff (Simmering Fish Slices, +120 min / +240 max phys —
`FOOD_MIN_PHYS_BONUS` / `FOOD_MAX_PHYS_BONUS` in `formula.ts`, applied once in
AE/AG and re-shown read-only as the yellow "effective" min/max phys in Panel
Stats); flat inner-way and gear-set stats folded into the panel.

Apply these in the **stat/base layer** as a permanent stat modifier —
class-gating is fine. They do **NOT** go through the per-skill buff-def system
and do **NOT** need to be visible in the Skill Editor.

See CALCULATION.md § "The stat layer" for where in the chain this lands.

## Category 2 — skill-specific buffs

Affects only certain skills.

Examples: Soul Shaken (boosts only the bleed/DoT skills); Bellstrike Umbra's
bleed penetration and bleeding/affinity damage — these reach only the bleed
skills, so they are skill-specific **even though the quantity they change is a
stat**. That last point is the one people get wrong.

These MUST be **first-class, data-driven buff-defs** in the trigger-driven buff
system (`src/engine/buffs/buffEngine.ts`; Soul Shaken, in a class's
`ClassDef.mechanicBuffDefs`, is the precedent — CLASSES.md § "Buff category").
The skill that *causes* the buff declares it (triggers); the skills that
*receive* it are matched by `affects` / tags. Both must be **visible and
referenced in the Skill Editor** (`SkillsTab.tsx`), and class-tied ones scoped
to specific skills are surfaced in the Class Buffs section too
(`alwaysActiveClassBuffs` in `engine/buffs/catalog.ts`).

This is the **"no invisible magic"** rule.

## For category 2 specifically — what not to do

- **Do NOT hardcode per-skill mechanics in `timeline.ts`** — the way
  `bellstrikeUmbraMaxPhysEffects` was once layered into `resolveState`. A
  class-specific `if (classId === …)` per-skill damage branch belongs in a
  class-gated buff-def instead.

  When the def schema genuinely cannot express it, the escape hatch is a
  `SkillBehavior` factory registered against the skill id
  (`engine/behavior.ts`; `data/innerWays/swordHorizonCrosswind.ts` is the
  worked example). It returns what it wants written and the timeline decides
  ordering, so a mechanic can hold state without the loop knowing about it.
  Built-ins only — a user-authored skill is JSON and can never carry code,
  which is exactly why the data path has to stay fully capable.
- **Do NOT add read-only display wrappers that duplicate an engine constant.**

Both hide the buff from where the user edits skills, and both create a second
application path that risks double-counting.

**One source of truth:** value / scaling / `affects` live in the def; the engine
reads it, the UI renders from it. If a skill-specific mechanic doesn't fit the
buff-def schema, **extend the schema** rather than working around it.

The sanctioned shape for a mechanic that genuinely needs both a timeline gate
and a catalog row is **one declaration, one id, two projections** —
`data/innerWays/swordHorizonZenith.ts`'s `zenithBar` is the worked example: the
same id names both the `Buff` gate the ledger tracks and shows as a chip, and
the `BuffModule` the Skill Editor's Receives/Class-Buffs columns read, and the
effect is still applied in exactly one place (the `SkillBehavior`, never
`BuffEngine`). That is what distinguishes it from the read-only wrapper the
rule above forbids: a wrapper duplicates a value the engine already applies
elsewhere, where these two projections are the entity's only representations,
neither reachable without the other.

## Category 3 — scoped stats

A stat the character **has** (rolled on gear, granted by a set), whose value
reaches only a category of skills rather than everything. It is *not* a buff:
nothing switches it on, and it does not belong in the buff-def system.

There are three, and they all work the same way — the entity declares what it
is, the stat declares what it reaches, and `formula.ts` joins them:

| stat | entity declares | joined |
| --- | --- | --- |
| `weaponBoosts` | `weaponOrAttribute` | additively, inside `H_total` (via `T`) |
| `mysticTypeBoosts` | a `mystic:` tag | additively, inside `H_total` (via `T`) |
| `dingYinByTag` (attunements) | an `attune:` tag | **multiplicatively**, as `(1 + E_dingYin)` |

⚠️ **The dingYin channel is multiplicative and the other two are additive.**
They are not interchangeable; never fold one into the other.

Wiring a new one is data, not code: give the entities an `attune:` tag (the
Skill Editor's Effects card edits it directly) and give the `AttunementOption`
an `affectsTag`. `panel.ts` derives `FormulaContext.attuneBoostByTag` from the
option list, so no engine file learns the tag's name.

These are visible in **Panel Stats / Stats Overview**, where stats belong — and
in the Skill Editor's *Receives* column, which lists them beside the buff-defs
that reach the same skill. The "no invisible magic" rule below is satisfied that
way, not by being a def.

## Which system, once you're in category 2

| effect | system |
| --- | --- |
| class-tied mechanic | a `BuffModule` gated by `requires` (TIMELINE.md § 5b) |
| user- or class-authored effect | a `Buff` / `Debuff` with `HitTrigger`s (TIMELINE.md § 5a) |
| a damage-over-time | **always** a `Debuff` with a `dot` — a `sustain` *skill type* is just a scaling tag on one hit, not a DoT |

## Known exceptions

A handful of mechanics genuinely don't fit the buff-def vocabulary. Sword
Horizon's Zenith Bar charge counter is now a `SkillBehavior` on the detonation
skill; the rest are each a `TimelineMechanic` (`src/engine/mechanics/types.ts`),
declared by the thing they are a mechanic of — `src/data/sets/hawkwingMechanic.ts`
(Hawkwing, its set), `src/data/innerWays/moraleChantMechanic.ts`,
`bitterSeasonMechanic.ts` and `insightfulStrikeMechanic.ts` (their inner ways),
and `src/data/classes/bellstrikeUmbraLevelBonus.ts` (its class).
`src/engine/mechanics/` holds only the contract (`types.ts`) and the registry
(`index.ts`) — no instances.
A stochastic per-hit proc plus a percentage target-defense reduction that
stacks and decays is not expressible as a static `Buff`/`Debuff`. Each is
documented in CALCULATION.md § "Mechanic coverage" with the reason. Adding to
that list needs the same justification: not "it was easier here", but "the def
schema cannot express this".
