# TIMELINE.md — the skill / buff / debuff model

How a rotation becomes damage: how skills carry **coefficients**, fire **triggers**,
**receive** buffs, and **give** buffs / debuffs. Read this before authoring or importing a
new skill so it is wired correctly. Damage *math* (the per-tick formula, white/yellow,
the calculation rules) lives in `CALCULATION.md`; **which** system a given mechanic belongs
in lives in `BUFFS.md`; this file is the *data model + control flow*. Key files:
`src/engine/timeline.ts` (the simulation), `skill.ts`, `buff.ts`, `debuff.ts`,
`buffs/buffDef.ts` + `buffs/buffEngine.ts` (the ported class-buff system),
`buffs/tags.ts`, `formula.ts` (the kernel).

## 1. The big picture

```
rotation steps ──► laid skills ──► per-hit EventQueue (frame-ordered)
                                        │
        for each hit event (in frame order):
          resolveState(frame, skill) ──► active buffs at `frame` collapse into ONE ctx
          hitToArtRow(hit, skill)    ──► the N/O/P/Q coefficient row
          computeSkillDamage(art, ctx) ──► expected damage for this hit  (see CALCULATION.md)
          process hit.triggers        ──► applyBuff / applyDebuff / castSkill
        plus: every active Debuff with a `dot` ticks on its own cadence
                                        │
                                        ▼
                             per-skill damage + DPS + a cast timeline
```

Everything a buff/debuff does ultimately lands as `{statKey, amount}` **effects** that are
summed into the player `Inputs` / target override, from which `buildContext` builds the
`ctx` that `computeSkillDamage` reads. There is **one** damage kernel; buffs never do their
own math.

## 2. Coefficients — what a single hit deals

A skill is a sequence of **hits**; each `SkillHit` (`skill.ts`) carries its own damage
shape (mapped 1:1 onto the formula's `N/O/P/Q`):

| field | formula symbol | meaning |
| --- | --- | --- |
| `physMultiplier` | `N` | phys coefficient (e.g. `2.4` = 240 %) |
| `attributeMultiplier` | `O` | attribute coefficient — the **elevated matching-path** multiplier |
| `physFixed` | `P` | flat phys damage |
| `attributeFixed` | `Q` | flat attribute damage |
| `extraCritDamage` | — | per-hit crit-damage add-on |
| `frame` | — | offset (60 fps) from the skill's cast start |
| `variants?` | — | buff-gated alternative N/O/P/Q rows — see below |
| `triggers` | — | see §4 |

**`variants?: HitVariant[]`** — an optional list of buff-gated alternative
coefficient rows. Each `HitVariant` carries its own `physMultiplier` /
`attributeMultiplier` / `physFixed` / `attributeFixed` plus a `conditions`
list (same shape as a trigger condition, ALL must hold). At the frame a hit
lands, the simulator (`selectHitVariant` in `skill.ts`) picks the FIRST
variant whose conditions all hold and swaps its four coefficients onto the
art row in place of the hit's own; no match (or no `variants`) ⇒ the hit's
own row is used unchanged. `extraCritDamage`, `frame`, and `triggers` are
never affected by a variant. This is how a skill can have an "empowered"
form while some buff is active without a per-skill `if` branch in
`timeline.ts` — e.g. Bellstrike Umbra's Spear Special switching to its
River Flow row (see §7).

Skill-level fields that steer the coefficients:

- `skillType` — `weapon | mindMethod | mystic | sustain | settlement | weaponMystic | Heavenwork`.
  Drives which boost bucket applies (`weapon` → weapon boost `T`; `mystic` →
  `mysticTypeBoosts[weaponOrAttribute]`; `sustain` → the F18 sustain / Insightful-Strike
  branch), and whether the DoT rule can apply (see below). **English only** — never a
  Chinese literal (see CLAUDE.md § "Language").
- `attributeAttack` — `Bellstrike | Stonesplit | Silkbind | Bamboocut | ""`. When this
  matches the character's primary attribute (`BU === attribute` in `formula.ts`), the hit
  uses the elevated `O` instead of the base `N` on the matching attribute path.
- `weaponOrAttribute` — weapon name (weapon skills) or the mystic target-category key
  (mystic skills); it is the lookup key into `weaponBoosts` / `mysticTypeBoosts`.
- `elevatedAttributeMultiplier?` — **defaults `true`**. Only a genuine DoT tick sets it
  `false`; a `false` hit loses its flat damage and uses `N` instead of the elevated `O`
  (the PDF §1 DoT penalty). A burst detonation is `skillType: "sustain"` but keeps the
  default `true` (it is not a DoT). See CLAUDE.md § "Calculation rules".
- `guaranteedPrecision?` — the skill never abrades: effective precision is forced to 1
  (e.g. Dragon Head - Plus). Crit and affinity still roll normally.
- `guaranteedNormal?` — fixed damage: the skill can trigger neither crit, affinity nor
  abrasion and always deals the normal row (e.g. Dragon Head). Both flags are editable
  as checkboxes in the Skill Editor.

## 3. Skills — identity, frames, tags

`Skill` (`skill.ts`): `id`, `classId`, `name`, `skillType`, `weaponOrAttribute`,
`attributeAttack`, `hits[]`, `castFrames` (cursor advance; `0` ⇒ derive from max hit
frame), `triggerable` (may be a `castSkill` target), `prePull`, and one tag field:

- `tags?: string[]` — free-form tags for the site buff engine (e.g. `"weapon:Sword"`,
  `"attune:bleed"`, `"prop:isCharged"`).

**How a skill exposes itself to buff matching** (`buffs/tags.ts`):
- `skillTagsOf(skill)` = explicit `tags` ∪ `type:<skillType>`. **Namespaced
  only** — the display name and the bare `skillType` / `weaponOrAttribute` /
  `attributeAttack` values used to land here too, which is what let a modifier
  reach a skill by what it was called.
- `castTagOf(skill)` = the authored `castTag`, falling back to one derived from
  the name — the single tag a *cast* presents when it *fires* a buff's
  `triggeredBy`.

> ⚠️ **Two fields are named for triggering, in opposite directions.**
> `SkillHit.triggers` is **outgoing** — the things this hit sets off — and is
> persisted user data. `BuffModule.triggeredBy` is **incoming** — the casts
> that set this buff off. The def's field was called `triggers` until
> 2026-08-09; it is not, and the rename is why.
- Matching is **exact membership**, for both `affects` and `triggeredBy`. A
  family is expressed by every member carrying the family tag *as well as* its
  own — `role:anxiSoldierMo` on each of the four `AnxiSoldierMo*` skills — never
  by one name being a stem of another. A skill can therefore belong to several
  families, which a prefix could not express.

## 4. Triggers — how a skill *does* something beyond its own damage

Each hit has `triggers: HitTrigger[]` (`skill.ts`). A trigger is:

- `kind`: `applyBuff` | `applyDebuff` | `castSkill` | `applyDot` | `detonateDot`
- `targetId`: the buff id / debuff id / skill id to act on
- `stacks`: stacks added (negative = **consume**; ignored for `castSkill`/`applyDot`/`detonateDot`)
- `condition: { buffId, op: gte|gt|eq, stacks } | null` — an optional gate on any status's
  current stack count; `null` = always fires. A condition on `applyDot`/`detonateDot` IS
  honoured by the simulator (it gates whether the application/detonation happens at all) —
  those two kinds just carry no *stack-threshold* logic of their own (that lives on the
  target `Debuff`, see below).
- `conditions?: TriggerCondition[]` — EXTRA clauses ANDed on top of the legacy single
  `condition`. A trigger fires when `condition` (if present) AND every entry of `conditions`
  (if present) hold — `triggerConditions(trigger)` in `skill.ts` returns the merged list.
  Needed whenever a trigger must test more than one status at once (e.g. "a buff is up AND a
  cooldown is not" — see §7).
- Every condition clause is **window-aware**: it reads 0 stacks when the target status has no
  active window at the query frame, even though its stack HISTORY may still hold a nonzero
  value from before it expired (`conditionStacksAt`/`conditionHolds` in `timeline.ts`). This is
  deliberately NOT how `stacksAt` itself behaves — the DoT stack-accrual machinery (`applyDot`'s
  own "add one stack, clamp at max" step) reads the raw, non-window-aware `stacksAt`, since a
  DoT's live stack count must persist independent of any OTHER status's window.
- `extendFrames` / `extendOnly` — extend an already-active window instead of opening a fresh
  one (dragon-breath / Poet DoT extension)

`applyBuff` and `applyDebuff` are resolved against the **combined** buff+debuff map
(`statusById`) — the `kind` is an editor-authoring distinction only; the simulator applies
stacks + opens a window identically. `castSkill` enqueues the target skill's hits (this is
how auto-procs like Blood Burst fire; guard against unbounded chains — the loop has an
`EVENT_CAP`).

`applyDot` / `detonateDot` are **logic-free links to a stacking DoT** (e.g. Bleed): `applyDot`
adds one stack (clamped to the target `Debuff.maxStacks`) and refreshes its shared duration;
`detonateDot` flags the SAME hit so that, once the post-application stack count reaches
`maxStacks`, the target debuff's own `detonation` spec fires (consume stacks + auto-cast the
detonation skill — see §5a). The condition (reach max stacks) and the consequence (which skill,
how many stacks retained, at what build tier) live entirely on the debuff, never on the
trigger — a `detonateDot` without a sibling `applyDot` on the same hit is inert by design.

## 5. Buffs & debuffs — two systems, one convergence point

There are **two** buff mechanisms. Both end as `{statKey, amount}` effects fed to
`applyBuffEffects → buildContext`. Pick the right one:

### 5a. Custom / editor system — `Buff`, `Debuff` + `HitTrigger`

Data-driven, user-authorable in the Skill Editor, injected at the App boundary via
`Inputs.customBuffs` / `Inputs.customDebuffs` (never read from storage inside the engine, so
locked fixtures stay byte-exact).

- **`Buff`** (`buff.ts`) — **helps the player**. `scope: player|team`, `activation:
  permanent|triggered`, `durationFrames`, `effects: {statKey, amount}[]` (player stat keys —
  see `statRegistry.ts`), `maxStacks`, `stackScaling: flat|perStack`. A skill *gives* it via
  an `applyBuff` trigger; it *receives* onto the same `Inputs` fields the panel uses.
  Alongside the user's own `Inputs.customBuffs`, a class can ship BUILT-IN buffs
  (`builtinBuffs.ts`'s `builtinBuffsForClass`, re-exported from `builtinLibrary.ts`) — mirrors
  the built-in skill/debuff libraries (same-id user buff wins). `effects: []` is a legitimate
  buff, not an oversight: a status with no stat effects at all can still be a first-class,
  id-referenced STATE MARKER that a `HitVariant`/trigger `conditions` gate reads (e.g.
  Bellstrike Umbra's River Flow, §7) — it just needs to exist as a real `Buff` so it's visible
  in the Skill Editor and tracked on the cast timeline, rather than a bare engine constant.
- **`Debuff`** (`debuff.ts`) — **enemy-facing**: target-scope stat reductions (`target.*`
  keys) and/or a **DoT**. Same window/stack machinery, plus `dot: DebuffDotSpec | null`.
  **This is the ONLY place a damage-over-time is authored** — a `sustain` skill *type* is
  just a scaling tag on one hit, not a DoT.
  - `DebuffDotSpec`: `tickIntervalFrames` (first tick at +interval), `physMultiplier`/
    `physFixed`/`attributeMultiplier`/`attributeFixed` (the tick's N/O/P/Q),
    `attributeAttack`, `skillType` (usually `"sustain"`), `count` (hits/tick), and optional
    `perStackShapes[]` (a per-stack damage table indexed by live stack count, overriding
    scaling). Each tick runs through `computeSkillDamage` exactly like a normal hit, with
    `elevatedAttributeMultiplier: false` set for it (see `dotTickDamage` in `dot.ts`).
  - `detonation?: DotDetonationSpec | null` — optional, alongside `dot`, on a stacking DoT
    (e.g. Bleed): `{ skillId, retainStacks?, retainParam?, retainMinTier?, retainParamStacks? }`.
    Fires when a `detonateDot`-flagged hit's `applyDot` brings the stack count to the debuff's
    own `maxStacks` — consumes the stacks (down to `retainStacks`, default 0) and auto-casts
    `skillId`. When the build has `retainParam` at ≥ `retainMinTier` (default 6),
    `retainParamStacks` remain instead (e.g. Bleed retains 2 at `swordHorizon` tier 6). One
    source of truth: the trigger is just a flag, all of this data lives on the debuff.

### 5b. Class-buff system — `BuffModule` + `BuffEngine`

The reference-site (`wherewindsmath`) trigger-driven buff tracker, ported. Every reachable
buff compiles to one `BuffModule` (`engine/buffs/buffModule.ts`) — a `defineBuff` /
`defineClassBuff` TypeScript module (`data/skills/buffs/define.ts`); the 35 defs behind the
seven not-yet-converted classes are frozen, unimported JSON under `reference/classes/buffs/`
instead. A class declares its own via `ClassDef.classBuffDefs` / `mechanicBuffDefs`
(CLASSES.md § "Buff category" — Soul Shaken, Bellstrike Umbra's bleed penetration and
bleeding-damage mechanics are the `mechanicBuffDefs` precedent); `GLOBAL_BUFF_DEFS` /
`GROUP_BUFF_DEFS` (`data/skills/buffs/index.ts`) apply across every class instead of one.
`BuffModule` is tag-matched, not id-referenced:

- **who applies it** — `triggeredBy: string[]` (cast tags, matched exactly), `alwaysActive`,
  gating via `requires: { param, minTier, set }` (`buffGateSatisfied` in `catalog.ts`).
- **who it boosts** — `affects: string[] | null` (tags, matched exactly; `null` = everything),
  `affectsProperty` (a `prop:*`), `affectsWeaponTypes`, `excludes`. See `matchesScope` in
  `scope.ts`, called from both `buffEngine.calculateDamageEffects` and the Skill Editor's
  Receives card.
- **magnitude** — `effects: Effect[] | ((ctx: EffectContext) => Effect[])`, the same
  `{statKey, amount}` shape `applyEffect` reads everywhere else in the engine. `forceCrit`,
  stack/time (`duration`, `maxStacks`, `stacksPerHit`), and limiting (`cooldown`, `rateLimit`,
  `stackRateLimit`) round it out.

### 5c. Which system for what

**`BUFFS.md` owns this decision** — read it before building a mechanic. The short
version:

- Permanent modifier to the character's OWN stats that applies to **every** skill → the
  stat/base layer, invisible; not a buff-def at all.
- Skill-specific effect (reaches only some skills) → a **first-class, data-driven** def,
  visible/referenced in the Skill Editor. Class-tied mechanics → a `BuffModule` gated by
  `requires` (§ 5b). User/custom effects → a `Buff`/`Debuff` with `HitTrigger`s (§ 5a).
- **Never** hardcode a per-skill mechanic in `timeline.ts` (no `if (classId === …)` damage
  branches). Value/scaling/affects live in the def; the engine reads it, the UI renders it.

## 6. How the timeline runs (`simulateTimeline`, `timeline.ts`)

`timeline.ts` is scheduling and the event loop. Five modules do the rest, and a
change usually belongs in one of them rather than in the loop:

| module | owns |
| --- | --- |
| `engine/ledger.ts` | which statuses are up, at how many stacks — `StatusLedger` writes, `StatusView` reads |
| `engine/behavior.ts` | what a skill does per hit: art row, hit variant, claimed stat effects, art patches, `onHit` |
| `engine/dot.ts` | tick source, episode merging, stack shapes/ladders, tick emission |
| `engine/castBuffs.ts` | the one ordered list of statuses a cast displays |
| `engine/scope.ts` | `matchesScope` — the single predicate for "does this modifier reach this entity" |

A skill with genuinely procedural behaviour registers a factory
(`registerSkillBehavior`) rather than being special-cased in the loop;
`data/classes/bellstrikeUmbraCrosswind.ts` is the worked example. Factories, not
instances — a charge counter must not carry between simulations.

The ledger and `BuffEngine` remain **two stores on purpose**: the ledger calls a
status active if any recorded window covers the frame, the engine goes by the
latest apply at or before it, so a shorter re-apply *shortens* the buff
(`rainwhisperShield`). Writing the engine's applies into the ledger would
silently extend every buff shaped like that. `castBuffs.ts` unifies the read
surface and documents the divergence at the seam; merging the storage needs a
per-status policy on the ledger, which is a design decision rather than a
refactor.


1. **Lay the rotation** into performed hits; seed an `EventQueue` with one event per hit at
   `startFrame + hit.frame`; the queue pops in `(frame, seq)` order.
2. **Per hit event:**
   - `resolveState(frame, skill)` collapses *all active buffs at this frame* (custom windows
     + site engine + inner-way + combat-settings toggles) into a single memoized `ctx`.
     Buff windows are tracked as `{start, end}` per status with `stacksAt(frame)`; permanent
     buffs open a full-timeline window.
   - `behavior.buildArt` builds the coefficient row (`hitToArtRow` underneath) and resolves the
     min-phys crit bonus, then `behavior.patchArt` layers whatever that skill claims for this
     frame — the qi-phase crit/pen. An art patch is the *only* sanctioned art-level adjustment,
     and it comes from a behaviour or a mechanic, never from an `if` in the loop.
   - `computeSkillDamage(art, ctx)` → expected damage; added to totals only if the frame is
     `inWindow` (pre-pull / out-of-window casts still appear on the cast timeline).
   - **Fire `hit.triggers`**: check `condition`; then `applyDot` (add one
     stack to the target DoT, clamped at its `maxStacks`, refresh its window, and — if the
     same hit is also `detonateDot`-flagged and the post-application count reached
     `maxStacks` — consume the stacks and enqueue the debuff's `detonation.skillId`),
     `applyBuff`/`applyDebuff` (resolve `statusById`, apply `extendFrames` logic, `recordStack`
     + open window/permanent), or `castSkill` (enqueue the target's hits).
3. **DoT ticks:** every active `Debuff` with a `dot` emits a tick every `tickIntervalFrames`
   via `dotTickDamage` / `dotTickDamageForShape` — each a normal `computeSkillDamage` call. A
   tick may carry a probability weight (`0..1`, multiplied onto its damage) when its debuff is
   driven by a stochastic proc schedule (`buffs/bitterSeason.ts`) rather than an `applyDot`
   trigger — the schedule's per-frame active-probability stands in for the tick actually having
   fired that pass.

## 7. Worked example — Bellstrike Umbra (`bellstrikeUmbra`) bleed loop

The one currently-implemented class (CLAUDE.md § "Implemented classes"). Roughly:

1. Sword/bleed skills are tagged `attune:bleed` and carry logic-free `applyDot` triggers
   that link to a **bleed `Debuff`** (which owns the max stacks, the shared duration, the
   bleed DoT — a `DebuffDotSpec` — and the detonation rule — a `DotDetonationSpec`). The three
   detonating skills (SwordSpecial 3-/4-Hit, Crosswind Blade) additionally flag each hit
   `detonateDot`.
2. The bleed DoT ticks on its cadence (`elevatedAttributeMultiplier: false`, so in accurate
   mode it loses flat + the 1.5×).
3. Once a `detonateDot`-flagged hit's application brings the bleed count to its `maxStacks`
   (5), the debuff's own `detonation` spec fires: it consumes the stacks (retaining 2 instead
   of resetting to 0 at `swordHorizon` tier 6) and auto-casts **Bleed Detonation**
   (`skillType: "sustain"`, `elevatedAttributeMultiplier` **defaults true** — it is a burst,
   not a tick, so it keeps flat + the elevated `O`).
4. Class buff-defs matched by tag boost the bleed family: **Soul Shaken**
   (`data/skills/bellstrike-umbra/buffs/soulShaken.ts`, one of `bellstrikeUmbra.ts`'s
   `mechanicBuffDefs`) `affects` the bleed/DoT skills; **Insightful Strike / Concentration**
   adds affinity-dmg + a T6 dot multiplier (scaled by an activation-probability schedule).
5. Bleed-attunement gear applies a post-`(1+H)` `correction` multiplier, gated to the two
   bleed skills (`BLEED_ATTUNEMENT_SKILLS`).

**The River Flow / Spear Special loop** (same class): `SpearQ`'s 5th hit carries a plain
`applyBuff` trigger for the built-in **River Flow** buff (no stat effects — a pure state
marker). Both **Spear Special** skills carry a `HitVariant` gated on `River Flow ≥ 1`, so
while it's up they deal their empowered coefficients regardless of anything else. Each also
carries five triggers — three `applyDot` (bleed, un-consumed) + a `castSkill` (Bleed
Detonation) + an `applyBuff` (a **Spear Special Cooldown** buff, applied LAST so it doesn't
gate itself) — every one gated by a two-clause `conditions` list: `River Flow ≥ 1` AND
`Spear Special Cooldown = 0`. So the bleed/detonation payload fires once per River Flow
window; a second Spear Special cast while the cooldown is still up keeps the empowered
damage but skips the payload entirely. Both buffs' 18.0 s windows AND Spear Special's own
60-frame `castFrames` are unverified placeholders (`builtinBuffs.ts`; the cast time is
editable directly in the Skill Editor's Cast Time field).

## 8. Checklist — implementing a skill correctly

1. **English identifiers only.** `skillType`, `weaponOrAttribute`, `attributeAttack`, tags,
   names — no Chinese in `src`/`tests` (CLAUDE.md § "Language"; import via the `ZH_TO_EN`
   codemod).
2. **Coefficients:** set `physMultiplier`/`attributeMultiplier`/`physFixed`/`attributeFixed`
   per hit; put each hit at the right `frame`; set `castFrames`.
3. **`skillType`** correct — it selects the boost bucket and the sustain branch. Only tag a
   skill `sustain` if it genuinely wants sustain routing.
4. **`elevatedAttributeMultiplier`:** leave default (`true`) for normal skills and burst
   detonations; set `false` **only** for real DoT ticks (and DoT ticks authored on a
   `Debuff.dot` get this automatically).
5. **DoTs go on a `Debuff.dot`** — never fake a DoT with a `sustain` skill hit.
6. **Giving a buff/debuff:** add an `applyBuff`/`applyDebuff` `HitTrigger` (custom system) or
   a `requires`-gated `BuffModule` with `triggeredBy` (class-buff system). Negative `stacks` to
   consume. Linking
   to a stacking DoT instead (adding a stack / detonating it) uses the logic-free
   `applyDot`/`detonateDot` kinds — the max stacks, duration, and detonation rule live on the
   target `Debuff`, never re-authored on the trigger.
7. **Receiving a buff:** make sure the skill declares the exact tags the buff's
   `affects`/`affectsProperty`/`affectsWeaponTypes` name.
8. **No invisible magic:** the effect must be a data-driven def visible in the Skill Editor —
   do **not** add a per-skill `if` branch in `timeline.ts`. Extend the schema if it doesn't
   fit.
9. **Verify:** locked fixtures stay bit-exact; add/extend a test. The engine's single rule
   set has no cached anchor of its own (only `damageRules.test.ts` guards it directionally),
   so reason about it explicitly.
