# CLASSES.md — classes, content layout, and id schemes

Rules for adding or editing a class, a skill/buff/debuff module, or anything that
mints an entity id.

## Implemented classes

A class is **registered** once it appears in the class barrel: its data is live
and the app runs it. A class is **validated** only once its output is pinned
against a measured build. `ClassDef.validated` states which, and the two are
independent — register a class the moment its data is authored, flip `validated`
only when an anchor test defends its numbers.

**Registration alone makes a class selectable.** Every class the barrel carries is
offered in the class picker; `validated` gates how far its numbers may be trusted,
never whether the UI shows it.

**Bellstrike Umbra (`bellstrikeUmbra`, spec `bellstrike_umbra`) and Stonesplit
Strength (`stonesplitStrength`, spec `stonesplit_strength`) are validated** — each
holds a measured build exactly. Rely on nothing either reports beyond what its
anchor pins.

The remaining classes — Bellstrike Rainbow, Silkbind Jade, and the other
Stonesplit and Bamboocut specs — are **not registered**. Their imported data
lives under `reference/classes/`, unimported by the app and the tests. Treat
everything there as provisional.

Two of them **share one spec** as a stand-in. That is not a claim they play
alike, and it is why a trigger authored for one can silently target a skill
another never received.

**Registering one of them is data work, not engine work**: sourcing and verifying
its numbers. The extension points are already proven from outside the engine.
Test-suite consequences are in TESTING.md § "Class scoping".

## Where content lives

`src/data/` holds **only content** — value declarations, id tables, JSON tables.
`src/definitions/` holds the contracts, registries and composition.

- **Adding a class touches only `src/data/`** — its own folder in the class tree,
  its skill folder, plus a one-line entry in the class barrel. Never
  `src/definitions/`, never `src/engine/`.
- **A class's own modules live in one folder per class**, whose barrel exports the
  `defineClass` call. A module only one class uses belongs there, not beside the
  barrel.
- **Every entity is authored through a `define*` factory** from
  `src/definitions/` — skills, debuffs, gate buffs, buff modules, sets, inner
  ways, classes. There is no JSON authoring format: the only JSON under
  `src/data/` is lookup tables with no contract to check.
- Nothing under `src/data/` may declare a `define*` contract or call a
  `register*` entry point.
- Nothing under `src/definitions/` may reach past a `src/data/` folder barrel, an
  `ids.ts` or a JSON table into an individual content module.
- Both halves are mechanically guarded (TESTING.md § "The architecture guards").

Naming: per-class folders are kebab-case in both the class and the skill tree,
as are the skill files inside one. Every other module and table under `src/data/`
is camelCase.

## One definition per class

One accessor answers what a class is made of — spec, primary attribute, inner
ways, class-specific attunement ids, skills, debuffs, buffs, rotations and
default, graduation build, attunements, retunement pool. **Reach for it rather
than the individual registries.**

**Nothing in `src/engine` may name a class, an inner way or a skill**, compare a
display name against a literal, or match a cast tag by prefix. The starting build
is allowlisted as content rather than logic.

Whatever a class does beyond data reaches the engine through registrations
declared as fields on its own definition, which one registry loop reads:

| the class needs                      | it declares       |
| ------------------------------------ | ----------------- |
| state markers the timeline reads     | gate buffs        |
| a stochastic or stateful mechanic    | mechanics         |
| procedural behaviour on one skill    | skill behaviours  |
| a Skill Editor "is this active" gate | display gates     |
| a poison/DoT extension window        | poison extensions |

An inner way or a gear set declares mechanics the same way, read by its own
registry. `declareMechanic` and the shared mechanic order are the one contract all
three owners use.

An inner way may also declare gate buffs, display gates, buff-defs and skill
behaviours of its own, for what it — not any one class — owns. Two of those need a
per-class composition step and two do not:

- **Gate buffs and buff-defs are folded into every class that can slot the inner
  way**, because every consumer asks for a class's gates and the buff engine is
  constructed per class.
- **Display gates and skill behaviours register directly**, because both are
  global id-keyed bindings with no owner concept.

**An inner way may name a class-owned skill id.** Once a mechanic is a full
inner-way entity, leaving the one line that says what advances it on the class
would split one entity across two owners. Persisted ids already contain a class
id, so this crosses no new line.

## Buff ownership

- A def reachable **purely because you are this class** — even when activation is
  gated by a tier, a talent or a qi phase — goes on the class's own list.
- A def an **inner way gates** goes on that inner way.
- A def triggered by a universal skill, or gated on a global toggle, goes on the
  global or group list.

This is not a filing convenience: the class's own list is what puts a row in the
Skill Editor's spec-mechanics section instead of the general buff list, and what
the rotation editor's chip suppression narrows further. The class or inner way
that lists a module is the **only** statement of its scope; the marker on the
module itself is inert everywhere else.

## Universal skills — one source, instantiated per class

A skill every class can equip lives **once**, with `universal` as its id segment,
and is instantiated per class: the `universal` segment in the skill id and in
every trigger and condition id becomes the class id, and the attribute path
becomes the instantiating class's primary attribute.

- **Never duplicate a universal skill into a class folder.**
- The instantiated `<classId>-<slug>` id shape is **load-bearing** — saved
  rotations and user overrides match built-ins by id, so a universal skill must
  never surface with a class-less id.

## Id schemes

- **Class ids are English camelCase.** Never pinyin. Spec ids keep snake_case —
  a different namespace.
- **Entity ids carry no vendor namespace**: skills are `<classId>-<slug>`, buffs
  `buff-<classId>-<slug>`, debuffs `debuff-<classId>-<slug>`.
- The `buff-` / `debuff-` prefixes are **load-bearing** — a DoT's tick-skill id
  is derived by stripping the debuff prefix when the debuff names none.
  Authoring the source skill id explicitly overrides that.
- **Both id schemes are user data.** Repair functions heal old blobs on every
  load and must stay idempotent (MIGRATIONS.md).
- A comment may cite the reference site as the **source** of a ported value. That
  is provenance, not naming.

## Naming a new domain term

Look the Chinese up in the official pair list (docs/REFERENCE-DATA.md) and copy
the official English. **Never hand-invent a term the game already names.** The
no-Chinese-in-`src` rule is CLAUDE.md § "Language".
