// A refactor guard, not class validation — see docs/TESTING.md § "Locked
// fixtures assert unchanged, never right" and § "Class scoping". It spans
// every registered class the way `noClassSpecificEngineCode.test.ts` and
// `classExtensionPoints.test.ts` do — only Bellstrike Umbra's numbers are
// defended (CLASSES.md § "Implemented classes") and a diff there is a
// defect, but a class's declarative `Skill`/`BuffModule` data staying
// loadable and renderable IS asserted for every class, since the generalized
// `Effect`/`EffectContext`/`BuffModule` contract has to keep working as data
// whether or not that class's numbers are defended yet.
//
// Exists because the ordinary suite missed four real regressions during the
// `BuffDef → BuffModule` conversion (dropped `counterMechanic` seeding, a
// missing `tier6StatModifiers` read, a missing `durationByTrigger` read, and a
// display/damage `maxStacks` divergence) — none of the 737 pre-existing tests
// caught any of them; only a broad, all-class, all-param simulation did. This
// file is that simulation, kept as standing infrastructure instead of
// scratch tooling rebuilt by hand for the next data conversion.
//
// Regenerate with UPDATE_BUFF_EQUIVALENCE=1, only when a change to a class's
// output is deliberate and justified in the same commit, same discipline as
// `UPDATE_ENGINE_BASELINE`.
//
// This fixture is captured FROM the converted engine, so a green run here
// proves the tree hasn't moved SINCE the capture — it cannot itself prove the
// `BuffDef → BuffModule` conversion was output-neutral. That claim rests on
// the one-time before/after dump comparison done at conversion time (see the
// migration/deviation notes wherever that conversion is reported).
import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { writeFixture } from "../writeFixture"
import { CLASS_IDS, classDefinition } from "../../src/definitions/classes/registry"
import { builtinDebuffsForClass } from "../../src/engine/builtinLibrary"
import { BuffEngine, type DamageEffectsResult } from "../../src/engine/buffs/buffEngine"
import type { BuffModule } from "../../src/engine/buffs/buffModule"
import { buffDefsForClass, groupBuffDefs } from "../../src/engine/buffs/data"
import { makeSkill } from "../../src/engine/skill"

const FIXTURE_PATH = join(process.cwd(), "tests/engine/buffEngineEquivalence.fixture.json")
const REGENERATE = process.env.UPDATE_BUFF_EQUIVALENCE === "1"

// The tag combinations and time grid from the manual all-class dump that
// caught the four regressions above — kept exactly, since narrowing them is
// how a future regression slips back through.
const TAG_COMBOS: readonly string[][] = [
  [],
  ["role:bleedDetonation"],
  ["role:bleedTick"],
  ["role:combustion"],
  ["role:dragonHead"],
  ["role:dragonHeadPlus"],
  ["prop:isCharged"],
  ["prop:isExecution"],
  ["type:sustain"],
  ["attack:heavy"],
  ["attack:light"],
]

function describeModule(module: BuffModule): Record<string, unknown> {
  return {
    id: module.id,
    name: module.name,
    classBuff: "classBuff" in module,
    requires: module.requires ?? null,
    affectsAll: !!module.affectsAll,
    alwaysActive: !!module.alwaysActive,
    buffAppliesOnCastEnd: !!module.buffAppliesOnCastEnd,
    cooldown: module.cooldown ?? null,
    rateLimit: module.rateLimit ?? null,
    stackRateLimit: module.stackRateLimit ?? null,
    stacksPerHit: !!module.stacksPerHit,
    seedAtStart: !!module.seedAtStart,
    refreshOnAnyCast: !!module.refreshOnAnyCast,
    requiresBuffActive: module.requiresBuffActive ?? null,
    activeAfterBuffEnds: module.activeAfterBuffEnds ?? null,
    hasStacksFn: typeof module.stacks === "function",
    duration: typeof module.duration === "number" ? module.duration : "[fn]",
    maxStacks: module.maxStacks ?? null,
    effects: Array.isArray(module.effects) ? module.effects : "[fn]",
    summary: module.summary ?? null,
  }
}

// Skills and debuffs are digested rather than stored raw — full skill objects
// (hits, triggers, variants) across every class would make the committed
// fixture enormous for no gain over a hash: a digest still fails
// the instant a single field changes, exactly like `engineBaseline.fixture.json`'s
// own `digestOf`. Object keys are sorted before hashing so re-ordering a
// field — which a JSON-to-TypeScript conversion does routinely and
// harmlessly — cannot register as a content change.
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === "object") {
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = canonical((value as Record<string, unknown>)[key])
    }
    return sorted
  }
  return value
}

function digest(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex")
}

function staticDumpFor(classId: string) {
  const skills = classDefinition(classId)?.skills ?? []
  const debuffs = builtinDebuffsForClass(classId)
  return {
    skills: {
      count: skills.length,
      ids: skills.map((skill) => skill.id).sort(),
      digest: digest(skills),
    },
    debuffs: {
      count: debuffs.length,
      ids: debuffs.map((debuff) => debuff.id).sort(),
      digest: digest(debuffs),
    },
    buffs: buffDefsForClass(classId).map(describeModule),
    group: groupBuffDefs().map(describeModule),
  }
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(9)) : value
}

function summarizeDamage(result: DamageEffectsResult) {
  return {
    effects: result.effects
      .map((effect) => ({ statKey: effect.statKey, amount: round(effect.amount) }))
      .sort((effectA, effectB) =>
        effectA.statKey < effectB.statKey ? -1 : effectA.statKey > effectB.statKey ? 1 : 0,
      ),
    forceCrit: result.forceCrit,
    breakdown: Object.fromEntries(
      Object.entries(result.breakdown)
        .map(([id, amount]) => [id, round(amount)] as const)
        .sort(([idA], [idB]) => (idA < idB ? -1 : idA > idB ? 1 : 0)),
    ),
  }
}

// Only Bellstrike Umbra's numbers are defended (CLASSES.md § "Implemented
// classes") — its `dynamic` entry stays fully spelled out so a diff shows
// exactly what moved. Any other class's entry collapses to a single digest:
// its role here is "tell me this moved", not "prove it didn't", so there is
// no reason to carry ~11 tag combinations × every probed time step for it in
// the committed fixture.
const SPELLED_OUT_CLASS_ID = "bellstrikeUmbra"

function dynamicDumpFor(classId: string) {
  const buffs = buffDefsForClass(classId)
  const group = groupBuffDefs()
  const allModules = [...buffs, ...group]

  // Forces every gate open so the simulation exercises every branch a build
  // could reach, not just whatever the default build happens to enable.
  const params: Record<string, unknown> = { armorSet: "jadeware" }
  for (const module of allModules) {
    if (module.requires?.param) {
      params[module.requires.param] = true
      params[module.requires.param + "Tier"] = 6
    }
  }

  const engine = new BuffEngine(params, buffs, group)
  const castTags = allModules.map((module) => `probe:${module.id}`).sort()
  // Short enough to still be inside every probed module's own duration (so a
  // `stacksPerHit` module ramps toward its cap) while shorter than every
  // probed cooldown (so a cooldown-gated module's second grant is the thing
  // that gets exercised, not just the first).
  const RETRIGGER_GAP = 3
  let time = 0
  for (const module of allModules) {
    engine.processSkillCast(`probe:${module.id}`, time, { hitCount: 3, castTime: 1 }, false, [
      module.id,
    ])
    engine.processSkillCast(
      `probe:${module.id}`,
      time + RETRIGGER_GAP,
      { hitCount: 3, castTime: 1 },
      false,
      [module.id],
    )
    time += 2
  }
  const lastTime = time + RETRIGGER_GAP + 5

  const damage: Record<string, unknown> = {}
  const display: Record<string, unknown> = {}
  for (let probeTime = 0; probeTime <= lastTime; probeTime += 1) {
    for (const tags of TAG_COMBOS) {
      const key = `${probeTime}|${tags.join(",")}`
      const skill = makeSkill("test", { name: "probe", tags })
      damage[key] = summarizeDamage(engine.calculateDamageEffects(skill, probeTime))
    }
    // Receiving is id-referenced too — a skill naming a module in `receives`
    // is the only way a scoped module (no `affectsAll`) reaches anything, so
    // the tag combos above alone would probe it as permanently unreachable.
    for (const module of allModules) {
      const key = `${probeTime}|receives:${module.id}`
      const skill = makeSkill("test", { name: "probe", receives: [module.id] })
      damage[key] = summarizeDamage(engine.calculateDamageEffects(skill, probeTime))
    }
    display[String(probeTime)] = engine
      .activeBuffsForDisplay(probeTime)
      .map((row) => ({
        id: row.id,
        stacks: row.stacks,
        maxStacks: row.maxStacks,
        effects: row.effects.map((effect) => ({
          statKey: effect.statKey,
          amount: round(effect.amount),
        })),
        requires: row.requires ?? null,
      }))
      .sort((rowA, rowB) => (rowA.id < rowB.id ? -1 : rowA.id > rowB.id ? 1 : 0))
  }
  return { castTags, damage, display }
}

function dynamicEntryFor(classId: string): unknown {
  const dump = dynamicDumpFor(classId)
  return classId === SPELLED_OUT_CLASS_ID ? dump : { digest: digest(dump) }
}

type Snapshot = Record<string, { static: ReturnType<typeof staticDumpFor>; dynamic: unknown }>

function currentSnapshot(): Snapshot {
  const out: Snapshot = {}
  for (const classId of CLASS_IDS()) {
    out[classId] = { static: staticDumpFor(classId), dynamic: dynamicEntryFor(classId) }
  }
  return out
}

if (REGENERATE) {
  await writeFixture(FIXTURE_PATH, currentSnapshot())
}

describe("buff engine equivalence — every registered class", () => {
  const recorded = existsSync(FIXTURE_PATH)
    ? (JSON.parse(readFileSync(FIXTURE_PATH, "utf8")) as Snapshot)
    : null

  it("has a recorded fixture", () => {
    expect(
      recorded,
      "buffEngineEquivalence.fixture.json missing — regenerate with UPDATE_BUFF_EQUIVALENCE=1",
    ).not.toBeNull()
  })

  it("covers every class, with no stale entries", () => {
    expect(Object.keys(recorded!).sort()).toEqual([...CLASS_IDS()].sort())
  })

  for (const classId of CLASS_IDS()) {
    it(`${classId} — built-in skills and debuffs are unchanged`, () => {
      const current = staticDumpFor(classId)
      expect(current.skills).toEqual(recorded![classId].static.skills)
      expect(current.debuffs).toEqual(recorded![classId].static.debuffs)
    })

    it(`${classId} — buff/group declarative fields are unchanged`, () => {
      const current = staticDumpFor(classId)
      expect(current.buffs).toEqual(recorded![classId].static.buffs)
      expect(current.group).toEqual(recorded![classId].static.group)
    })

    it(`${classId} — BuffEngine damage and display output are unchanged across every gate, cast, tag and time step probed`, () => {
      expect(dynamicEntryFor(classId)).toEqual(recorded![classId].dynamic)
    })
  }
})
