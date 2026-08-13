# CLAUDE.md — engine conventions

Always-on guardrails, plus a router to the detail. Keep this file **short**: if
a section here grows past a few lines, it belongs in the topic file instead.

## Docs are implementation rules — the gate on editing them

> **Read this before opening any file in `docs/`. A docs edit that fails this
> gate is a defect, not a contribution.**

`docs/*.md` say **how a thing must be implemented**. They do not describe how the
code works — the code does that, and a prose copy of it rots. Every statement is
a rule an implementer must satisfy, or an external constraint the code cannot
carry.

**The gate: which rule changed?** A commit may touch `docs/` only if the same
commit changes a system contract — a type, a schema field, an engine rule, an
invariant, a convention. If you cannot name the rule that changed, do not touch
`docs/`.

None of these earn a docs edit:

- adding or changing a skill, buff, debuff, mechanic, class, rotation, inner way
- implementing something the docs already state as a rule
- recording that work happened, what it used to be, or who decided it
- an example, a worked walkthrough, or a status / coverage note

1. **Nothing content-specific — `docs/` or the wiki.** No skill, buff, debuff,
   inner way or gear set name or id; no coefficient; no frame count. Examples use
   placeholders. Class names appear only in `docs/CLASSES.md`'s implemented
   table, `docs/TESTING.md`'s scoping rule and `docs/REFERENCE-DATA.md`.
   Mechanically enforced by `tests/data/docsStayGeneral.test.ts`.
2. **Every sentence must hold for every class and skill.** If it is only true of
   one it is not a rule, and it belongs in no docs file at all. Genuinely complex
   per-skill logic gets a short comment in the `.ts` that defines the skill —
   nothing else, nowhere else.
3. **No descriptions of how code works.** No module tours, no folder trees, no
   call-order walkthroughs, no "X then calls Y". If a reader gets it by opening
   the file, it is noise.
4. **No history.** No dates, no decision provenance, no changelog sections.
5. **Adding does not add prose.** If your change made a docs file longer without
   changing a rule, delete what you added.

Every section should read like a checklist: imperative, checkable, no story.

## Read this first, by topic

| working on                                                         | read                     |
| ------------------------------------------------------------------ | ------------------------ |
| damage math — the formula chain, stat layer, calculation rules     | `docs/CALCULATION.md`    |
| a skill, trigger, buff or debuff **data model**                    | `docs/TIMELINE.md`       |
| whether a mechanic is a stat buff or a skill buff                  | `docs/BUFFS.md`          |
| a class, skill/buff data file, or anything that mints an entity id | `docs/CLASSES.md`        |
| `src/ui/**`, `App.tsx`, or `dpsWorker.ts`                          | `docs/UI.md`             |
| writing a localStorage migration                                   | `docs/MIGRATIONS.md`     |
| adding or changing tests                                           | `docs/TESTING.md`        |
| dev-only reference material outside `src/`                         | `docs/REFERENCE-DATA.md` |

## Adding something new — start from the wiki how-to

**Adding** a thing has a step-by-step page; the `docs/` files above explain the
system it plugs into. Read the how-to **first** — it is the ordered file list,
the wiring, the tests to update and the migration question, in one place.

| adding                       | read                          |
| ---------------------------- | ----------------------------- |
| a class or spec              | `How to Add a Class`          |
| a skill                      | `How to Add a Skill`          |
| a rotation                   | `How to Add a Rotation`       |
| a buff, debuff or DoT        | `How to Add a Buff or Debuff` |
| an inner way (mind method)   | `How to Add an Inner Way`     |
| a changelog entry, releasing | `src/changelog/README.md`     |

The changelog how-to is the one that lives in the repo rather than the wiki: it
is read while editing the folder it documents.

The wiki is the [project wiki](https://github.com/M1zuke/where-winds-meet-dps/wiki),
cloned beside this repo at `../where-winds-meet-dps.wiki` — read the `.md` files
there directly. It also carries `Development Setup`, `Architecture Overview`,
`Project Conventions`, `Damage Calculation`, `Testing Guide`,
`Saved Profile Migrations` and `Glossary`.

Two rules keep it trustworthy:

1. **One source per fact.** A rule, a number, a formula and a field name live in
   `docs/` and nowhere else. The wiki carries the ordered procedure and the _why_,
   and links to the `docs/` rule instead of restating it — so the two can never
   disagree. The gate above binds the wiki too: no content names, no examples
   built on a real skill.
2. A change that invalidates a how-to updates that page **in the same piece of
   work**, as its own commit in the wiki clone. A stale how-to is worse than a
   missing one.

The sections below are the rules that apply _before_ you know which topic you're
in — they stay here on purpose, because a pointer you don't know to follow isn't
a guardrail.

## Git workflow — never push to `main`

Nothing is committed or pushed directly to `main`. Every change goes onto a
branch, which is what gets pushed; `main` only moves via merges of those
branches.

## Comments: as close to zero as possible

> **This has been asked for repeatedly, and the bar has moved: the target is not
> "few comments", it is none. Treat a violation as a defect, not a style nit.**

Code describes itself. A comment is a failure to make the code say it, and is
allowed only where the code genuinely cannot:

- **genuinely complex logic** whose _why_ cannot be read off the implementation
- **an external-source citation** — an in-game value, a PDF or CN source, a unit
  on a bare number. Its as-of date is part of the citation, not history.
- **an ordering constraint** that would otherwise get re-broken
- **the previous data shape**, in `src/migrations/**` and storage repair only —
  there the old shape _is_ the specification

Everything else is deleted:

```
// Sort the entries by name.     ← delete, the call already says it
// Bump the retry counter.       ← delete
// Holds the parsed profiles.    ← delete, the name says it
```

And **never** write history:

```
// Removed in <commit> / no longer used since <date>.
// Since 2026-xx-xx the user decided ...
// This used to be inline in the timeline.
// Formerly `armorSetBoni.json`.
```

Git carries the history; it does not belong in the source. When you delete
something, delete every line that referenced it — no tombstones, and no
`@deprecated` marker parked on a field that should simply be gone. Prefer
encoding a constraint in a **test name** over a comment: a test called
`keeps a steady tick cadence across re-application` cannot rot the way a warning
comment can.

This applies to **every file that ships** — source, stylesheets, config, tests,
data, docs — not only the ones where you think of yourself as "writing code".
Whole files with no comments at all are the normal outcome, not a warning sign.
Moving code does not move its comments with it: re-judge each one against this
bar and drop it if it fails, even when you were told to preserve it.

### The comment pass — the last step of every task

**No task is finished until this has run.** When the work is otherwise done and
before you report it, re-read your own diff and judge every comment in it again
— the ones you just wrote included — then delete the ones that fail the bar and
keep the ones that pass. Three questions catch most of them:

1. Is the fact already visible at the call site, or in a name?
2. Is it said twice — in another comment, or in the commit message?
3. Could a **test name** carry it instead?

"It was non-obvious while I was writing it" is not the bar: that preserves the
author's reasoning, not something the reader cannot reconstruct. Shortening a
comment is not the same as re-judging it, and reporting the one as the other
misstates the work. Say in your summary that the pass ran.

## Names say what they hold at their point of use

No `a`, `b`, `x`, `tmp`, no one-letter stand-in for a longer word — locals,
parameters, or imports. `const a = loadProfiles()` is
`const profiles = loadProfiles()`. A name that needs its surrounding line to be
understood is a name to replace, and this outranks any external convention that
prefers brevity.

If you find yourself writing a comment to explain an identifier, fix the
identifier instead.

## Language: English-first — no Chinese in code

The app is **English-only**. There is **no Chinese in `src/` or `tests/`** — not
in identifiers, object keys, comparison literals, enum values, data JSON,
fixtures, or comments. Every domain term uses its official English form
(attributes `Bellstrike`/`Stonesplit`/`Silkbind`/`Bamboocut`, weapons
`Sword`/`Modao`/…, skill types
`weapon`/`mindMethod`/`mystic`/`sustain`/`settlement`/`weaponMystic`, tiers
`tier 6`, and every attunement label — see § "Class-specific attunement map").

Grep guard — must return nothing:

```
grep -rlP '[\x{4e00}-\x{9fff}]' src tests
```

Use `-P`, not `-E`: `grep -E` doesn't understand `\x{…}` and silently reports
false positives.

**The only sanctioned Chinese** is dev-only reference material outside `src/`:
the workbook in `excels/`, its extractions in `reference/workbook/`, the
official ZH↔EN pairs in `reference/locale/zhToEnOfficial.json`, and the four CN
source citations in `docs/CALCULATION.md` § "Sources of truth". None is
imported by the app or the tests.

The i18n system is retained (`Locale = "en"`, extensible union in
`src/i18n/translations.ts`) so a future language is just a new dictionary — but
there is **no `zh` locale and no language toggle**.

→ Naming a new domain term: **docs/CLASSES.md** § "Naming a new domain term".

## White vs Yellow rates — DO NOT FLIP THIS

Two different conventions for the three rates:

|                                         | precision                                    | critRate          | affinityRate      | who uses                                                      |
| --------------------------------------- | -------------------------------------------- | ----------------- | ----------------- | ------------------------------------------------------------- |
| **White** (raw character)               | from gear/build                              | from gear/build   | from gear/build   | the **UI**: stored on `Inputs`, what the user types           |
| **Yellow** (effective, post-resistance) | `(white − 0.65) / (1 + r) + 0.65` (soft-cap) | `white / (1 + r)` | `white / (1 + r)` | the **formula**: `computeSkillDamage` consumes these directly |

1. `Inputs.precision`, `Inputs.critRate`, `Inputs.affinityRate` are **WHITE**.
   The user types white into the UI. Do not change this.
2. The engine converts to yellow in exactly one place — `panel.ts
effectiveRates` — and feeds yellow into `formula.computeSkillDamage`.
3. **`directCritRate` / `directAffinityRate` are NOT affected by resistance** —
   same value white or yellow.
4. **Building a fixture from yellow reference values** (e.g. a reference site's
   panel)? Convert yellow → white before storing on `Inputs`:
   - `whitePrec = (yellow − 0.65) × (1 + r) + 0.65`
   - `whiteCrit = yellow × (1 + r)`
   - `whiteAffinity = yellow × (1 + r)`
5. `defaults.ts` uses `precision: 1.105`, `critRate: 0.7 × 1.3`,
   `affinityRate: 0.164 × 1.3`. These are white values that round-trip to the
   effective `1.0 / 0.7 / 0.164` at resistance 30. **Don't "simplify" them** to
   the yellow numbers — that breaks the convention.

If you find yourself questioning whether the engine's rates are wrong, check
this section first. The white→yellow conversion is **load-bearing for every
per-tick formula**, and removing it silently passes one fixture while breaking
others.

## localStorage migrations

> **MANDATORY — check this on EVERY change, no exceptions.** Before you call any
> task done, ask: _can a profile already saved in a user's browser be wrong,
> stale, or illegal under this change?_ If yes, the change is **not complete**
> without a migration in the same commit. This is not optional polish and it is
> not a follow-up — a shipped change without its migration silently corrupts
> real user builds, and nothing in the test suite or the type checker will tell
> you. Saved profiles are the one part of this app that can't be regenerated.
>
> Say explicitly in your summary which it was: _"migration added: <what it
> heals>"_ or _"no migration needed: <why saved profiles are unaffected>"_.
> Never leave it unstated.

The check lives here because it fires on changes that **don't look**
storage-related — a narrowed allowlist in a data file, a new UI-only invariant,
a changed default. Deciding you don't need one is a decision you have to make
out loud, every time.

→ How to actually write one, and the full "what counts" list:
**docs/MIGRATIONS.md**.

## Buffs: base-stat buffs vs skill-specific buffs

Classify FIRST — the two categories live in different places, and mixing them up
is how this engine grows a double-count.

> **The dividing question:** does it change the character's _stats_
> (→ stat layer, invisible), or does it change the _damage of specific skills
> only_ (→ a data-driven buff-def, visible in the Skill Editor)?

Never hardcode a per-skill mechanic in `timeline.ts`, and never add a read-only
display wrapper that duplicates an engine constant. One source of truth.

→ Full taxonomy, worked examples, and which system to use: **docs/BUFFS.md**.

## Calculation rules

Four rules apply unconditionally, from the external sources (Midasione PDF + CN
community sources): graze rate `(1−precision)(1−affinity)`; net-pen `÷100`
deficit / `÷200` overflow (deliberately inverts PDF §7 — **do not "fix" it
back**); DoT (`sustain`) rows lose flat damage and elevated matching-path
scaling; a skill's raw affinity-rate bonus is `÷(1+r)` and falls inside the cap,
while its raw crit-rate bonus is flat and added after the cap. Penetration
resistance is **zero for every target**.

These have no cached anchor — only the directional `damageRules.test.ts`.

→ The reasoning, the sources, and the per-skill gating: **docs/CALCULATION.md**
§ "Calculation rules".

## Ids are the identity; a label is only ever display text

**Nothing keys off a display string.** A stat line, a gear word and an attunement
are each identified by a stable camelCase id; the label is what the UI renders and
is free to be corrected without touching storage, an engine path or a test.

- **Stat lines, gear words and buff-targetable stats** —
  `src/data/stats/statLines.ts` is the only place an id, label, engine path, unit,
  max roll, scope and category are authored. `PATH_LABELS`, `PERCENT_PATHS`,
  `PENETRATION_PATHS`, `GEAR_WORD_MAX_ROLL`, `GEAR_WORD_UNIT`, and
  `statRegistry.ts`'s `StatKey` and `STAT_DEFS` are all **derived** from it —
  never hand-write a second copy. A line with a `maxRoll` is a rollable gear
  word; a line with a `category` is buff-targetable. `GearWordEntry.word` stores
  the id.
- **Class-specific attunements** — `Inputs.classSpecificAttunement` is keyed by
  `AttunementOption.id`, so an option's `enginePath` is exactly
  `classSpecificAttunement.<its own id>`, and each class lists the ids it shows in
  `ClassDef.classSpecificAttunements`. Attunement labels carry the **official
  in-game English Attune Effect name**.

Renaming an **id** is a storage change and needs a migration; renaming a **label**
never is.

## Implemented classes

**Registered and validated are two different things.** A class is registered once
its data is live; it is validated only once its output is checked against a
measured build. `ClassDef.validated` states which, and only a validated class's
numbers may be relied on.

**Bellstrike Umbra (`bellstrikeUmbra`) and Stonesplit Strength
(`stonesplitStrength`) are validated.** Every other class carries unverified
numbers, whether registered or not.

→ The full class/spec table and what that means for tests: **docs/CLASSES.md**,
**docs/TESTING.md** § "Class scoping".

## Performance: heavy engine work stays off the main thread

A `runEngine` pass is a full 60 fps timeline simulation. **At most ONE
synchronous `runEngine` per input change** — the baseline pass in `App.tsx`'s
`result` memo. Everything else goes through `src/engine/dpsWorker.ts`, debounced.

→ All five rules, the hook pattern, and worker testing: **docs/UI.md**.
