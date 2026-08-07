# BUFFS.md — classifying a buff before you build it

Read this before implementing any buff, debuff, or "this mechanic boosts X"
effect. **Classify first** — the two categories live in completely different
places, and putting one in the other's home is the most common way this engine
grows a double-count.

TIMELINE.md § 5 documents the *schemas* (`Buff`/`Debuff` + `HitTrigger` vs
`BuffDef`/`BuffEngine`). This file decides *which* you want.

## The dividing question

> Does it change the character's **stats** (→ category 1, stat layer,
> invisible), or does it change the **damage of specific skills only**
> (→ category 2, buff-def, visible in the Skill Editor)?

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
system (`src/engine/buffs/buffEngine.ts`; Soul Shaken in
`src/engine/buffs/mechanics.ts` `MECHANIC_BUFF_DEFS` is the precedent). The
skill that *causes* the buff declares it (triggers); the skills that *receive*
it are matched by `affects` / tags. Both must be **visible and referenced in the
Skill Editor** (`SkillsTab.tsx`), and class-tied ones are surfaced in the Class
Buffs tab.

This is the **"no invisible magic"** rule.

## For category 2 specifically — what not to do

- **Do NOT hardcode per-skill mechanics in `timeline.ts`** — the way
  `bellstrikeUmbraMaxPhysEffects` was once layered into `resolveState`. A
  class-specific `if (classId === …)` per-skill damage branch belongs in a
  class-gated buff-def instead.
- **Do NOT add read-only display wrappers that duplicate an engine constant.**

Both hide the buff from where the user edits skills, and both create a second
application path that risks double-counting.

**One source of truth:** value / scaling / `affects` live in the def; the engine
reads it, the UI renders from it. If a skill-specific mechanic doesn't fit the
buff-def schema, **extend the schema** rather than working around it.

## Which system, once you're in category 2

| effect | system |
| --- | --- |
| class-tied site mechanic | a `BuffDef` gated by `spec` / `enabledParam` (TIMELINE.md § 5b) |
| user- or class-authored effect | a `Buff` / `Debuff` with `HitTrigger`s (TIMELINE.md § 5a) |
| a damage-over-time | **always** a `Debuff` with a `dot` — a `sustain` *skill type* is just a scaling tag on one hit, not a DoT |

## Known exceptions

A handful of mechanics genuinely don't fit the buff-def vocabulary and are
realized at the `timeline.ts` boundary on purpose — Crosswind Spirit's charge
counter, the Hawkwing and Concentration probability schedules, Morale Chant's
stack curve, and the Bitter Season inner way's poison (`buffs/bitterSeason.ts`):
a stochastic per-hit proc plus a percentage target-defense reduction that
stacks and decays is not expressible as a static `Buff`/`Debuff`. Each is
documented in CALCULATION.md § "Mechanic coverage" with the reason. Adding to
that list needs the same justification: not "it was easier here", but "the def
schema cannot express this".
