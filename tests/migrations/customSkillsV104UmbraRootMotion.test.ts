import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V104__umbraRootMotion,
  healSkill,
} from "../../src/migrations/customSkills/V104__umbraRootMotion"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import { SKILL } from "../../src/data/skills/bellstrike-umbra/ids"
import storeV103File from "./testCustomSkills/v103/store.json"

const STORE = storeV103File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const UNTOUCHED_IDS = [
  "bellstrikeSplendor-swordheavycharged-prepull",
  "bellstrikeSplendor-legioncrusher",
]
const USER_AUTHORED_ID = "sk-user-authored-vagrant-sword"

const CHARGE_IDS = [
  SKILL.swordChargeStage11Hit,
  SKILL.swordChargeStage12Hit,
  SKILL.swordChargeStage13Hit,
  SKILL.swordChargeStage14Hit,
  SKILL.swordChargeStage15Hit,
  SKILL.swordChargeStage24Hit,
  SKILL.swordChargeStage25Hit,
  SKILL.swordChargeStage1Level0,
]

const SEEDED_WITHOUT_DISPLACEMENT_IDS = [
  SKILL.swordq,
  SKILL.swordqfollowup,
  SKILL.swordqFollowUp2HitCancel,
  SKILL.swordqFollowUp1HitCancel,
  SKILL.swordRChargeFollowUp,
  SKILL.swordRChargeFollowUp1HitCancel,
  SKILL.swordMartialQqq,
  SKILL.swordspecial1Hit,
  SKILL.swordspecial2Hit,
  SKILL.swordspecial3Hit,
  SKILL.swordspecial4Hit,
  SKILL.swordHeavy2,
  SKILL.swordHeavy3,
  SKILL.crosswindBlade,
  SKILL.crosswindBladeCancel,
]

const PREVIOUS_CHARGE_DISPLACEMENT = {
  kind: "byDistance",
  bands: [
    { minMeters: 0, maxMeters: 8.999, then: { kind: "toTarget", meters: 1 } },
    { minMeters: 9, maxMeters: 100, then: { kind: "selfForward", meters: 8 } },
  ],
  otherwise: { kind: "towardTarget", referenceMeters: 0 },
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("bellstrikeUmbra").find((skill) => skill.id === id)!

const seededCopy = (id: string, previous: Skill["displacement"]): Skill => {
  const copy = clone(builtinOf(id))
  copy.displacement = previous
  for (const variant of copy.hits[0]!.variants ?? []) delete variant.displacement
  return copy
}

describe("custom-skills v103 fixture", () => {
  it("is v103 and stores the earlier displacement, or none, on the Umbra copies", () => {
    expect(STORE.v).toBe(V104__umbraRootMotion.to - 1)
    expect(skillIn(STORE, SKILL.swordChargeStage12Hit).displacement?.kind).toBe("byDistance")
    expect(skillIn(STORE, SKILL.swordspecial1Hit).displacement).toBeUndefined()
  })
})

describe("healSkill", () => {
  it.each(["swordspecial1Hit", "swordChargeStage12Hit", "swordChargeStage15Hit"] as const)(
    "lands the fixture's untouched %s copy on the built-in displacement",
    (key) => {
      const healed = healSkill(clone(skillIn(STORE, SKILL[key]))) as Skill
      expect(healed.displacement).toEqual(builtinOf(SKILL[key]).displacement)
    },
  )

  it.each(CHARGE_IDS)("lands the untouched %s copy on the built-in", (id) => {
    const healed = healSkill(seededCopy(id, PREVIOUS_CHARGE_DISPLACEMENT as Skill["displacement"]))
    expect(healed).toEqual(builtinOf(id))
  })

  it.each(SEEDED_WITHOUT_DISPLACEMENT_IDS)(
    "gives the untouched %s copy the built-in displacement",
    (id) => {
      const healed = healSkill(seededCopy(id, undefined)) as Skill
      expect(healed.displacement).toEqual(builtinOf(id).displacement)
      expect(healed.hits).toEqual(builtinOf(id).hits)
    },
  )

  it("rewrites only a displacement still identical to what was seeded", () => {
    const edited = seededCopy(SKILL.swordChargeStage12Hit, { kind: "toTarget", meters: 2 })
    expect(healSkill(clone(edited))).toEqual(edited)
    const addedByHand = seededCopy(SKILL.swordHeavy2, { kind: "selfForward", meters: 1 })
    expect(healSkill(clone(addedByHand))).toEqual(addedByHand)
  })

  it("leaves an untouched neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of [...UNTOUCHED_IDS, USER_AUTHORED_ID]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    const once = healSkill(clone(skillIn(STORE, SKILL.swordChargeStage12Hit)))
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("V104__umbraRootMotion — called directly", () => {
  it("heals the Umbra copies and keeps every other skill", () => {
    const after = V104__umbraRootMotion.migrate(clone(STORE))
    expect(after.v).toBe(104)
    for (const id of [
      SKILL.swordspecial1Hit,
      SKILL.swordChargeStage12Hit,
      SKILL.swordChargeStage15Hit,
    ])
      expect(skillIn(after, id).displacement).toEqual(builtinOf(id).displacement)
    for (const id of [...UNTOUCHED_IDS, USER_AUTHORED_ID])
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V104__umbraRootMotion.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("does not share one displacement object between two healed skills", () => {
    const after = V104__umbraRootMotion.migrate({
      v: 103,
      skills: [
        seededCopy(SKILL.crosswindBlade, undefined),
        seededCopy(SKILL.crosswindBladeCancel, undefined),
      ],
    })
    const [first, second] = after.skills as Skill[]
    expect(first!.displacement).toEqual(second!.displacement)
    expect(first!.displacement).not.toBe(second!.displacement)
  })
})

describe("V104__umbraRootMotion — through the chain", () => {
  it("is registered and is exactly what the v103 → v104 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V104__umbraRootMotion)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 104 })!
    expect(result.applied).toEqual(["V104__umbraRootMotion"])
    expect(result.blob.v).toBe(104)
  })
})
