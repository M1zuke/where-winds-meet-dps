import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V103__splendorRootMotion,
  healSkill,
} from "../../src/migrations/customSkills/V103__splendorRootMotion"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"
import storeV102File from "./testCustomSkills/v102/store.json"

const STORE = storeV102File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const PREPULL_ID = SKILL.swordHeavyChargedPrepull
const UNTOUCHED_ID = "bellstrikeSplendor-legioncrusher"
const USER_AUTHORED_ID = "sk-user-authored-vagrant-sword"

const HEALED_IDS = [
  SKILL.swordHeavyCharged,
  SKILL.swordHeavyCharged2Hit,
  SKILL.swordHeavyChargedTier1,
  SKILL.swordHeavyChargedWushuang,
  SKILL.swordHeavyCharged2HitWushuang,
  SKILL.swordHeavyChargedTier1Wushuang,
  SKILL.swordHeavyChargedPrepull,
  SKILL.energySurge,
  SKILL.swordSpecial,
  SKILL.swordHeavyAttack,
]

const PREVIOUS_DISPLACEMENTS: Readonly<Record<string, readonly unknown[]>> = {
  [SKILL.energySurge]: [{ kind: "towardTarget", referenceMeters: 1 }],
  [SKILL.swordSpecial]: [{ kind: "towardTarget", referenceMeters: 1 }],
  [SKILL.swordHeavyAttack]: [{ kind: "towardTarget", referenceMeters: 1.75 }],
}
const VAGRANT_PREVIOUS_DISPLACEMENTS = [
  { kind: "towardTarget", referenceMeters: 1.75 },
  {
    kind: "byDistance",
    bands: [
      { minMeters: 0, maxMeters: 8.999, then: { kind: "toTarget", meters: 1 } },
      { minMeters: 9, maxMeters: 100, then: { kind: "selfForward", meters: 8 } },
    ],
    otherwise: { kind: "towardTarget", referenceMeters: 0 },
  },
]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("bellstrikeSplendor").find((skill) => skill.id === id)!

const previousDisplacementsOf = (id: string): readonly unknown[] =>
  PREVIOUS_DISPLACEMENTS[id] ?? VAGRANT_PREVIOUS_DISPLACEMENTS

const seededCopy = (id: string, previous: unknown): Skill => {
  const copy = clone(builtinOf(id))
  copy.displacement = previous as Skill["displacement"]
  for (const variant of copy.hits[0]!.variants ?? []) delete variant.displacement
  return copy
}

describe("custom-skills v102 fixture", () => {
  it("is v102 and still stores the earlier displacement on the pre-pull copy", () => {
    expect(STORE.v).toBe(V103__splendorRootMotion.to - 1)
    expect(skillIn(STORE, PREPULL_ID).displacement?.kind).toBe("byDistance")
  })
})

describe("healSkill", () => {
  it("lands the untouched pre-pull copy on the built-in", () => {
    const healed = healSkill(clone(skillIn(STORE, PREPULL_ID))) as Skill
    expect(healed.displacement).toEqual(builtinOf(PREPULL_ID).displacement)
    expect(healed.hits).toEqual(builtinOf(PREPULL_ID).hits)
  })

  it.each(
    HEALED_IDS.flatMap((id) => previousDisplacementsOf(id).map((previous) => [id, previous])),
  )(
    "lands the untouched %s copy on the built-in from each displacement it was seeded with",
    (id, previous) => {
      const healed = healSkill(seededCopy(id as string, previous)) as Skill
      expect(healed.displacement).toEqual(builtinOf(id as string).displacement)
      expect(healed.hits).toEqual(builtinOf(id as string).hits)
    },
  )

  it("rewrites only a displacement still identical to what was seeded", () => {
    const edited = seededCopy(SKILL.energySurge, { kind: "toTarget", meters: 2 })
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves an untouched neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    const once = healSkill(clone(skillIn(STORE, PREPULL_ID)))
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("V103__splendorRootMotion — called directly", () => {
  it("heals the pre-pull copy and keeps every other skill", () => {
    const after = V103__splendorRootMotion.migrate(clone(STORE))
    expect(after.v).toBe(103)
    expect(skillIn(after, PREPULL_ID).displacement).toEqual(builtinOf(PREPULL_ID).displacement)
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID])
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V103__splendorRootMotion.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("V103__splendorRootMotion — through the chain", () => {
  it("is registered and is exactly what the v102 → v103 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V103__splendorRootMotion)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 103 })!
    expect(result.applied).toEqual(["V103__splendorRootMotion"])
    expect(result.blob.v).toBe(103)
  })
})
