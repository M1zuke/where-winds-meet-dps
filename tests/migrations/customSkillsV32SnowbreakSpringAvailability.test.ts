import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V32__snowbreakSpringAvailability,
  healSkill,
} from "../../src/migrations/customSkills/V32__snowbreakSpringAvailability"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV31File from "./testCustomSkills/v31/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const SNOWPARTING_VC_ID = "stonesplitStrength-snowpartingvc"
const SNOWPARTING_VC_PREPULL_ID = "stonesplitStrength-snowpartingvc-prepull"
const SNOWPARTING_CHARGED_ID = "stonesplitStrength-snowpartingcharged"
const FREE_GRAVE_FROST_ID = "stonesplitStrength-snowpartingcharged-forgetfulness"
const SNOWPARTING_DUAL_ID = "stonesplitStrength-snowpartingdual"
const SNOWPARTING_DUAL_PREPULL_ID = "stonesplitStrength-snowpartingdual-prepull"
const DEFLECT_ID = "stonesplitStrength-deflect"
const HEALED_IDS = [
  SNOWPARTING_VC_ID,
  SNOWPARTING_VC_PREPULL_ID,
  SNOWPARTING_CHARGED_ID,
  FREE_GRAVE_FROST_ID,
  SNOWPARTING_DUAL_ID,
  SNOWPARTING_DUAL_PREPULL_ID,
  DEFLECT_ID,
]

const STORE = storeV31File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const COOLDOWN_GRANT_TRIGGER = {
  kind: "applyBuff",
  targetId: "snowbreakSpringCooldown",
  stacks: 1,
  condition: null,
  requiresParam: "frostCladNight",
}
const AVAILABLE_TIER_3_TRIGGER = {
  kind: "applyBuff",
  targetId: "snowbreakSpringAvailable",
  stacks: 1,
  condition: null,
  requiresParam: "frostCladNight",
  requiresMinTier: 3,
}
const AVAILABLE_UNGATED_TRIGGER = {
  kind: "applyBuff",
  targetId: "snowbreakSpringAvailable",
  stacks: 1,
  condition: null,
  requiresParam: "frostCladNight",
}

function expectHealed(id: string, healed: Skill) {
  const original = skillIn(STORE, id)
  if (id === SNOWPARTING_VC_ID || id === SNOWPARTING_VC_PREPULL_ID) {
    expect(healed.hits[0]!.triggers, id).toEqual([
      COOLDOWN_GRANT_TRIGGER,
      ...original.hits[0]!.triggers,
    ])
    return
  }
  const addedTrigger = id === DEFLECT_ID ? AVAILABLE_UNGATED_TRIGGER : AVAILABLE_TIER_3_TRIGGER
  expect(healed.hits[0]!.triggers, id).toEqual([...original.hits[0]!.triggers, addedTrigger])
}

describe("custom-skills v31 fixture", () => {
  it("is v31 and still stores the pre-V32 shape for every healed skill", () => {
    expect(STORE.v).toBe(V32__snowbreakSpringAvailability.to - 1)
    for (const id of HEALED_IDS) {
      const triggers = skillIn(STORE, id).hits[0]!.triggers
      expect(
        triggers.some((trigger) => trigger.targetId === "snowbreakSpringAvailable"),
        id,
      ).toBe(false)
      expect(
        triggers.some((trigger) => trigger.targetId === "snowbreakSpringCooldown"),
        id,
      ).toBe(false)
    }
  })
})

describe("healSkill", () => {
  it("adds the availability gate to every untouched seeded copy", () => {
    for (const id of HEALED_IDS) expectHealed(id, healSkill(clone(skillIn(STORE, id))) as Skill)
  })

  it("does not double-heal a copy that already carries the availability trigger", () => {
    const alreadyHealed = healSkill(clone(skillIn(STORE, SNOWPARTING_CHARGED_ID))) as Skill
    const untouched = clone(alreadyHealed)
    expect(healSkill(alreadyHealed)).toEqual(untouched)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = clone(skillIn(STORE, "stonesplitStrength-snowpartingq-stab"))
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V32__snowbreakSpringAvailability — called directly", () => {
  it("heals every seeded copy and nothing else", () => {
    const after = V32__snowbreakSpringAvailability.migrate(clone(STORE))
    expect(after.v).toBe(32)
    for (const id of HEALED_IDS) expectHealed(id, skillIn(after, id))
    for (const skill of STORE.skills) {
      if (HEALED_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V32__snowbreakSpringAvailability.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V32__snowbreakSpringAvailability.migrate(clone(once))).toEqual(once)
  })
})

describe("V32__snowbreakSpringAvailability — through the chain", () => {
  it("is registered and is exactly what the v31 → v32 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V32__snowbreakSpringAvailability)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 32 })!
    expect(result.applied).toEqual(["V32__snowbreakSpringAvailability"])
    expect(result.blob.v).toBe(32)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V32__snowbreakSpringAvailability,
    )
    const result = runChain(withoutStep, 32, clone(STORE))!
    expect(result.applied).not.toContain("V32__snowbreakSpringAvailability")
    for (const id of HEALED_IDS) {
      expect(skillIn(result.blob, id)).toEqual(skillIn(STORE, id))
    }
  })
})

// loadCustomSkills walks the full chain, so its result also reflects V33's
// later relocation of these two skills' grant off cast start.
const RELOCATED_BY_LATER_STEP = new Set([SNOWPARTING_CHARGED_ID, FREE_GRAVE_FROST_ID])
// ...and V38's later Blade Momentum gain on the same hit.
const EXTENDED_BY_LATER_STEP = new Set([SNOWPARTING_VC_ID, SNOWPARTING_VC_PREPULL_ID])

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the availability gate after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    for (const id of HEALED_IDS) {
      const skill = loaded.find((candidate) => candidate.id === id)!
      if (RELOCATED_BY_LATER_STEP.has(id)) {
        expect(
          skill.hits
            .flatMap((hit) => hit.triggers)
            .some((trigger) => trigger.targetId === "snowbreakSpringAvailable"),
          id,
        ).toBe(true)
        continue
      }
      if (EXTENDED_BY_LATER_STEP.has(id)) {
        expect(
          skill.hits
            .flatMap((hit) => hit.triggers)
            .some(
              (trigger) => trigger.kind === "meterDelta" && trigger.targetId === "bladeMomentum",
            ),
          id,
        ).toBe(true)
        continue
      }
      expectHealed(id, skill)
    }
  })
})
