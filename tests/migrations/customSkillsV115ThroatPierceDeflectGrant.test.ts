import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V115__throatPierceDeflectGrant,
  healSkill,
} from "../../src/migrations/customSkills/V115__throatPierceDeflectGrant"
import { deflect } from "../../src/data/skills/stonesplit-strength/deflect"
import { deflectCancel } from "../../src/data/skills/stonesplit-strength/deflect-cancel"
import { deflectCancel as universalDeflectCancel } from "../../src/data/skills/universal/deflect-cancel"
import { deflectCancelPrepull } from "../../src/data/skills/universal/deflect-cancel-prepull"
import { deflectCancel as draughtDeflectCancel } from "../../src/data/skills/bamboocut-draught/deflect-cancel"
import storeV114File from "./testCustomSkills/v114/store.json"

const STORE = storeV114File as unknown as RawCustomSkillsBlob & {
  skills: { id: string; triggersBuffs: string[] }[]
}
const HEALED = ["cleftpeakDeflectGrant", "throatPierceDeflectGrant"]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const skillIn = (blob: RawCustomSkillsBlob, id: string) =>
  (blob.skills as { id: string; triggersBuffs: string[] }[]).find((skill) => skill.id === id)!

describe("custom-skills v114 fixture", () => {
  it("is v114 and lists only Cleftpeak's grant on the Deflect skills", () => {
    expect(STORE.v).toBe(V115__throatPierceDeflectGrant.to - 1)
    expect(skillIn(STORE, "stonesplitStrength-deflect").triggersBuffs).toEqual([
      "cleftpeakDeflectGrant",
    ])
  })
})

describe("the built-in Deflect skills", () => {
  it.each([deflect, deflectCancel, universalDeflectCancel, deflectCancelPrepull])(
    "$id lists Throat-Pierce's grant alone",
    (builtin) => {
      expect(builtin.triggersBuffs).toEqual(["throatPierceDeflectGrant"])
    },
  )

  it("lists nothing on a class's own Deflect Cancel that does not carry Throat-Pierce", () => {
    expect(draughtDeflectCancel.triggersBuffs).toEqual([])
  })
})

describe("healSkill", () => {
  it.each([
    "stonesplitStrength-deflect",
    "stonesplitStrength-deflect-cancel",
    "stonesplitStrength-deflect-cancel-prepull",
    "bellstrikeUmbra-deflect-cancel",
  ])("adds the grant to the untouched %s copy", (id) => {
    expect(
      (healSkill(clone(skillIn(STORE, id))) as { triggersBuffs: string[] }).triggersBuffs,
    ).toEqual(HEALED)
  })

  it("leaves an edited list, a class's own Deflect Cancel and a user-authored skill alone", () => {
    for (const id of [
      "stonesplitStrength-deflect-edited",
      "bamboocutDraught-deflect-cancel",
      "sk-user-authored-deflect",
    ]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
  })

  it("is idempotent", () => {
    const once = healSkill(clone(skillIn(STORE, "stonesplitStrength-deflect")))
    expect(healSkill(clone(once))).toEqual(once)
  })
})

describe("V115__throatPierceDeflectGrant — called directly and through the chain", () => {
  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V115__throatPierceDeflectGrant.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v114 → v115 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V115__throatPierceDeflectGrant)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 115 })!
    expect(result.applied).toEqual(["V115__throatPierceDeflectGrant"])
    expect(result.blob.v).toBe(115)
    expect(skillIn(result.blob, "stonesplitStrength-deflect").triggersBuffs).toEqual(HEALED)
  })
})
