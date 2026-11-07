import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V33__snowbreakSpringGrantTiming,
  healSkill,
} from "../../src/migrations/customSkills/V33__snowbreakSpringGrantTiming"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV32File from "./testCustomSkills/v32/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const SNOWPARTING_CHARGED_ID = "stonesplitStrength-snowpartingcharged"
const FREE_GRAVE_FROST_ID = "stonesplitStrength-snowpartingcharged-forgetfulness"
const SNOWPARTING_VC_ID = "stonesplitStrength-snowpartingvc"
const SNOWPARTING_VC_PREPULL_ID = "stonesplitStrength-snowpartingvc-prepull"
const HEALED_HIT_IDS = [SNOWPARTING_CHARGED_ID, FREE_GRAVE_FROST_ID]
const HEALED_CAST_CONDITION_IDS = [SNOWPARTING_VC_ID, SNOWPARTING_VC_PREPULL_ID]

const STORE = storeV32File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const AVAILABLE_TIER_3_TRIGGER = {
  kind: "applyBuff",
  targetId: "snowbreakSpringAvailable",
  stacks: 1,
  condition: null,
  requiresParam: "frostCladNight",
  requiresMinTier: 3,
}
const AVAILABLE_CAST_CONDITION = { buffId: "snowbreakSpringAvailable", op: "gte", stacks: 1 }

function expectHealed(id: string, healed: Skill) {
  if (id === SNOWPARTING_CHARGED_ID) {
    expect(healed.hits[0]!.triggers).toEqual([])
    expect(healed.hits[2]!.triggers).toEqual([])
    expect(healed.hits[3]!.triggers).toEqual([AVAILABLE_TIER_3_TRIGGER])
    return
  }
  if (id === FREE_GRAVE_FROST_ID) {
    const original = skillIn(STORE, id)
    expect(healed.hits[0]!.triggers).toEqual([original.hits[0]!.triggers[0]])
    expect(healed.hits[3]!.triggers).toEqual([AVAILABLE_TIER_3_TRIGGER])
    return
  }
  expect(healed.castConditions).toEqual([AVAILABLE_CAST_CONDITION])
}

describe("custom-skills v32 fixture", () => {
  it("is v32 and still stores the pre-V33 shape for every healed skill", () => {
    expect(STORE.v).toBe(V33__snowbreakSpringGrantTiming.to - 1)
    expect(skillIn(STORE, SNOWPARTING_CHARGED_ID).hits[0]!.triggers).toHaveLength(1)
    expect(skillIn(STORE, FREE_GRAVE_FROST_ID).hits[0]!.triggers).toHaveLength(2)
    for (const id of HEALED_CAST_CONDITION_IDS) {
      expect(skillIn(STORE, id).castConditions).toBeUndefined()
    }
  })
})

describe("healSkill", () => {
  it("relocates the grant trigger and adds the availability cast condition", () => {
    for (const id of [...HEALED_HIT_IDS, ...HEALED_CAST_CONDITION_IDS]) {
      expectHealed(id, healSkill(clone(skillIn(STORE, id))) as Skill)
    }
  })

  it("does not double-heal a copy that already carries the relocated trigger", () => {
    const alreadyHealed = healSkill(clone(skillIn(STORE, SNOWPARTING_CHARGED_ID))) as Skill
    const untouched = clone(alreadyHealed)
    expect(healSkill(alreadyHealed)).toEqual(untouched)
  })

  it("leaves an already-gated castConditions field alone rather than overwriting it", () => {
    const edited = { ...clone(skillIn(STORE, SNOWPARTING_VC_ID)), castConditions: [] }
    expect((healSkill(edited) as Skill).castConditions).toEqual([])
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = clone(skillIn(STORE, "stonesplitStrength-snowpartingq-stab"))
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V33__snowbreakSpringGrantTiming — called directly", () => {
  it("heals every targeted skill and nothing else", () => {
    const after = V33__snowbreakSpringGrantTiming.migrate(clone(STORE))
    expect(after.v).toBe(33)
    for (const id of [...HEALED_HIT_IDS, ...HEALED_CAST_CONDITION_IDS]) {
      expectHealed(id, skillIn(after, id))
    }
    for (const skill of STORE.skills) {
      if ([...HEALED_HIT_IDS, ...HEALED_CAST_CONDITION_IDS].includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V33__snowbreakSpringGrantTiming.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V33__snowbreakSpringGrantTiming.migrate(clone(once))).toEqual(once)
  })
})

describe("V33__snowbreakSpringGrantTiming — through the chain", () => {
  it("is registered and is exactly what the v32 → v33 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V33__snowbreakSpringGrantTiming)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 33 })!
    expect(result.applied).toEqual(["V33__snowbreakSpringGrantTiming"])
    expect(result.blob.v).toBe(33)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V33__snowbreakSpringGrantTiming,
    )
    const result = runChain(withoutStep, 33, clone(STORE))!
    expect(result.applied).not.toContain("V33__snowbreakSpringGrantTiming")
    for (const id of [...HEALED_HIT_IDS, ...HEALED_CAST_CONDITION_IDS]) {
      expect(skillIn(result.blob, id)).toEqual(skillIn(STORE, id))
    }
  })
})

// loadCustomSkills walks the full chain, so its result also reflects V38's
// later Blade Momentum gain on every hit of these two Grave Frost forms, and
// its later Blade Momentum requirement alongside the availability gate.
const GAINS_ADDED_BY_LATER_STEP = new Set(HEALED_HIT_IDS)

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the relocated trigger and the availability gate after loadCustomSkills", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    for (const id of [...HEALED_HIT_IDS, ...HEALED_CAST_CONDITION_IDS]) {
      const skill = loaded.find((candidate) => candidate.id === id)!
      if (GAINS_ADDED_BY_LATER_STEP.has(id)) {
        for (const hit of skill.hits) {
          expect(
            hit.triggers.some(
              (trigger) => trigger.kind === "meterDelta" && trigger.targetId === "bladeMomentum",
            ),
            `${id} [${hit.id}]`,
          ).toBe(true)
        }
        continue
      }
      if (HEALED_CAST_CONDITION_IDS.includes(id)) {
        expect(skill.castConditions, id).toEqual(expect.arrayContaining([AVAILABLE_CAST_CONDITION]))
        continue
      }
      expectHealed(id, skill)
    }
  })
})
