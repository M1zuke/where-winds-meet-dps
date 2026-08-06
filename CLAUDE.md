# CLAUDE.md — engine conventions

Always-on guardrails, plus a router to the detail. Keep this file **short**: if
a section here grows past a few lines, it belongs in the topic file instead.

## Read this first, by topic

| working on | read |
| --- | --- |
| damage math — the formula chain, stat layer, calculation rules | `docs/CALCULATION.md` |
| a skill, trigger, buff or debuff **data model** | `docs/TIMELINE.md` |
| whether a mechanic is a stat buff or a skill buff | `docs/BUFFS.md` |
| a class, skill/buff data file, or anything that mints an entity id | `docs/CLASSES.md` |
| **changing a specific skill** | its sibling `<slug>.md` next to the skill JSON, **if one exists** — only special-logic skills have one; never bulk-read them (convention: CLASSES.md § "Skill special-logic docs") |
| `src/ui/**`, `App.tsx`, or `dpsWorker.ts` | `docs/UI.md` |
| writing a localStorage migration | `docs/MIGRATIONS.md` |
| adding or changing tests | `docs/TESTING.md` |

The sections below are the rules that apply *before* you know which topic you're
in — they stay here on purpose, because a pointer you don't know to follow isn't
a guardrail.

## Git workflow — never push to `main`

Nothing is committed or pushed directly to `main`. Every change goes onto a
branch, which is what gets pushed; `main` only moves via merges of those
branches.

## Comments and names — write the code, not a narration

> **This has been asked for repeatedly. Treat a violation as a defect, not a
> style nit.**

1. **A comment must carry what the code cannot** — a rejected alternative, an
   ordering constraint that would otherwise get re-broken, a constraint from
   outside the file, an external-source citation, a unit on a bare number. The
   test is: *could the next reader reconstruct this from the code and the topic
   docs?* If yes, it is noise:

   ```
   // Sort the entries by name.     ← delete, the call already says it
   // Bump the retry counter.       ← delete
   // Holds the parsed profiles.    ← delete, the name says it
   ```

   This applies to **every file that ships** — source, stylesheets, config,
   tests, data — not only the ones where you think of yourself as "writing
   code". Whole files ending up with no comments at all is the normal outcome,
   not a warning sign. Moving code does not move its comments with it: re-judge
   each one against this bar and drop it if it fails, even when you were told to
   preserve it. No tombstones either — when you delete something, delete the
   lines that referenced it rather than noting it is gone.
2. **Names say what they hold at their point of use.** No `a`, `b`, `x`, `tmp`,
   no one-letter stand-in for a longer word — locals, parameters, or imports.
   `const a = loadProfiles()` is `const profiles = loadProfiles()`. A name that
   needs its surrounding line to be understood is a name to replace, and this
   outranks any external convention that prefers brevity.

If you find yourself writing a comment to explain an identifier, fix the
identifier instead. Before calling any task done, re-read your own diff and
delete every comment a reader of the code would not miss.

## Language: English-first — no Chinese in code

The app is **English-only**. There is **no Chinese in `src/` or `tests/`** — not
in identifiers, object keys, comparison literals, enum values, data JSON,
fixtures, or comments. Every domain term uses its official English form
(attributes `Bellstrike`/`Stonesplit`/`Silkbind`/`Bamboocut`, weapons
`Sword`/`Modao`/…, skill types
`weapon`/`mindMethod`/`mystic`/`sustain`/`settlement`/`weaponMystic`, tiers
`tier 6`, dingYin tags `Bleed Boost`/`Mouse Boost`/…).

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

| | precision | critRate | affinityRate | who uses |
| --- | --- | --- | --- | --- |
| **White** (raw character) | from gear/build | from gear/build | from gear/build | the **UI**: stored on `Inputs`, what the user types |
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
> task done, ask: *can a profile already saved in a user's browser be wrong,
> stale, or illegal under this change?* If yes, the change is **not complete**
> without a migration in the same commit. This is not optional polish and it is
> not a follow-up — a shipped change without its migration silently corrupts
> real user builds, and nothing in the test suite or the type checker will tell
> you. Saved profiles are the one part of this app that can't be regenerated.
>
> Say explicitly in your summary which it was: *"migration added: <what it
> heals>"* or *"no migration needed: <why saved profiles are unaffected>"*.
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

> **The dividing question:** does it change the character's *stats*
> (→ stat layer, invisible), or does it change the *damage of specific skills
> only* (→ a data-driven buff-def, visible in the Skill Editor)?

Never hardcode a per-skill mechanic in `timeline.ts`, and never add a read-only
display wrapper that duplicates an engine constant. One source of truth.

→ Full taxonomy, worked examples, and which system to use: **docs/BUFFS.md**.

## Calculation rules

Four rules apply unconditionally, from the external sources (Midasione PDF + CN
community sources) per user decision 2026-07-18: graze rate
`(1−precision)(1−affinity)`; net-pen `÷100` deficit / `÷200` overflow
(deliberately inverts PDF §7 — **do not "fix" it back**); DoT (`sustain`) rows
lose flat damage and elevated matching-path scaling; raw rate bonuses are
`÷(1+r)` before the cap (except Thundercry (Modao) charged crit = flat,
post-cap). Penetration resistance is **zero for every target**.

These have no cached anchor — only the directional `damageRules.test.ts`.

→ The reasoning, the sources, and the per-skill gating: **docs/CALCULATION.md**
§ "Calculation rules".

## dingYin tag map

`Inputs.dingYinByTag: Record<string, number>` keyed by the English tag names
(`Mouse Boost`, `Bleed Boost`, `Sword Charge Boost`, …). Each class declares its
visible tags via `permanentBuffs` in `schools.json`. The `classBuffs` field is
**always `[]`** — those source rows are class metadata, not panel input cells.

## Implemented classes

**Only Bellstrike Umbra (`bellstrikeUmbra`) is implemented and validated.** The
other seven carry unverified imported data; their engine output should not be
relied on. The test suite is Umbra-only and must stay that way.

→ The full class/spec table and what that means for tests: **docs/CLASSES.md**,
**docs/TESTING.md** § "Class scoping".

## Performance: heavy engine work stays off the main thread

A `runEngine` pass is a full 60 fps timeline simulation. **At most ONE
synchronous `runEngine` per input change** — the baseline pass in `App.tsx`'s
`result` memo. Everything else goes through `src/engine/dpsWorker.ts`, debounced.

→ All five rules, the hook pattern, and worker testing: **docs/UI.md**.
