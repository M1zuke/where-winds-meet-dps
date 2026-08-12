# BUFFS.md — classify a buff before you build it

**Classify first.** The categories live in different places, and putting one in
another's home is the most common way this engine grows a double-count.
TIMELINE.md carries the authoring rules for each system; this file decides which
one you are in.

## The dividing question

> 1. Is it a **stat the character has**, or an **effect that switches on**?
> 2. If it is a stat: does it apply to **everything** (category 1), or only to a
>    category of skills (category 3)?
>
> An effect that switches on and reaches only certain skills is **category 2**.

## Category 1 — base-stat buffs

A permanent modifier to the character's own stats — penetration, crit or
affinity damage, min/max attack — that applies to **every** skill.

Apply it in the stat layer as a permanent stat modifier. Class-gating is fine. It
does **not** go through the buff-def system and does **not** need to be visible in
the Skill Editor. CALCULATION.md § "The stat layer" has the rules for that layer.

## Category 2 — skill-specific buffs

Reaches only certain skills. **A stat that reaches only some skills is
category 2, not category 1** — that is the distinction people get wrong.

These MUST be first-class, data-driven defs in the trigger-driven buff system.
The skill that _causes_ it declares it; the skills that _receive_ it are matched
by tags. Both must be visible and referenced in the Skill Editor. This is the
**"no invisible magic"** rule.

### What not to do

- **Never hardcode a per-skill mechanic in the timeline.** A
  `if (classId === …)` damage branch belongs in a class- or inner-way-gated def.
- **Never add a read-only display wrapper that duplicates an engine constant.**

Both hide the mechanic from where the user edits skills, and both create a second
application path that can double-count.

**One source of truth:** value, scaling and reach live in the def; the engine
reads it and the UI renders from it. If a skill-specific mechanic does not fit
the schema, **extend the schema** rather than working around it.

### The two sanctioned escapes

- **A skill-behaviour factory**, registered against a skill id, when the def
  schema genuinely cannot express the mechanic. It returns what it wants written
  and the timeline decides ordering, so a mechanic can hold state without the
  loop knowing about it. Built-ins only — a user-authored skill is data and can
  never carry code, which is exactly why the data path must stay fully capable.
- **One declaration, one id, two projections**, when a mechanic needs both a
  timeline gate and a catalog row: the same id names the gate the ledger tracks
  and the module the Skill Editor reads, and the effect is still applied in
  exactly one place. What distinguishes this from the forbidden wrapper is that
  neither projection is reachable without the other, and neither re-applies a
  value the engine already applies elsewhere.

## Category 3 — scoped stats

A stat the character **has**, whose value reaches only a category of skills. It
is not a buff: nothing switches it on, and it does not belong in the buff-def
system. The entity declares what it is, the stat declares what it reaches, and
the kernel joins them.

| stat                       | the entity declares | joined                           |
| -------------------------- | ------------------- | -------------------------------- |
| weapon boost               | its weapon key      | additively, inside the boost sum |
| mystic-category boost      | a `mystic:` tag     | additively, inside the boost sum |
| attunement (dingYin) boost | an `attune:` tag    | **multiplicatively**             |

⚠️ **The attunement channel is multiplicative and the other two are additive.**
They are not interchangeable; never fold one into the other.

Wiring a new one is data, not code: give the entities the tag, and give the
attunement option the tag it affects. No engine file learns a tag's name.

These belong in Panel Stats, and in the Skill Editor's _Receives_ column beside
the defs reaching the same skill. That is how they satisfy "no invisible magic" —
not by becoming a def.

## Which system, once you are in category 2

| effect                   | system                             |
| ------------------------ | ---------------------------------- |
| class- or inner-way-tied | a buff module gated by `requires`  |
| user- or class-authored  | a buff or debuff with hit triggers |
| a damage-over-time       | **always** a debuff with a `dot`   |

## Mechanics — the last resort

A mechanic is for what the def vocabulary genuinely cannot say: a stochastic
per-hit proc, a reduction that stacks and decays, a stateful counter. Each is
declared by the thing it is a mechanic of, and CALCULATION.md § "Mechanic rules"
binds it.

Adding one needs the same justification every time: not "it was easier here", but
**"the def schema cannot express this"** — stated in the module itself.
