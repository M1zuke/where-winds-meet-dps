import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V97__umbraGameplayTimings,
  healSkill,
} from "../../src/migrations/customSkills/V97__umbraGameplayTimings"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV96File from "./testCustomSkills/v96/store.json"

const STORE = storeV96File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const EDITED_ID = "bellstrikeUmbra-swordspecial-1-hit"
const UNTOUCHED_ID = "bellstrikeUmbra-spear-light-3"
const USER_AUTHORED_ID = "sk-user-authored-sword-strike"
const HEALED_IDS = [
  "bellstrikeUmbra-swordspecial-2-hit",
  "bellstrikeUmbra-swordspecial-3-hit",
  "bellstrikeUmbra-swordspecial-4-hit",
  "bellstrikeUmbra-swordspecial-4-hit-final",
  "bellstrikeUmbra-sword-charge-stage-1-1-hit",
  "bellstrikeUmbra-sword-charge-stage-1-2-hit",
  "bellstrikeUmbra-sword-charge-stage-1-3-hit",
  "bellstrikeUmbra-sword-charge-stage-1-4-hit",
  "bellstrikeUmbra-sword-charge-stage-2-4-hit",
  "bellstrikeUmbra-spear-light-2",
  "bellstrikeUmbra-spearheavy",
  "bellstrikeUmbra-spearheavy-stage-1",
]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass("bellstrikeUmbra").find((skill) => skill.id === id)!

describe("custom-skills v96 fixture", () => {
  it("is v96 and still carries the old forms and frames", () => {
    expect(STORE.v).toBe(V97__umbraGameplayTimings.to - 1)
    expect(skillIn(STORE, "bellstrikeUmbra-swordspecial-2-hit").castFrames).toBe(47)
    expect(skillIn(STORE, "bellstrikeUmbra-swordspecial-3-hit").castFrames).toBe(71)
    expect(skillIn(STORE, "bellstrikeUmbra-sword-charge-stage-1-2-hit").hits).toHaveLength(4)
    expect(skillIn(STORE, "bellstrikeUmbra-sword-charge-stage-2-4-hit").castConditions).toEqual([
      { param: "swordHorizon" },
    ])
    expect(skillIn(STORE, "bellstrikeUmbra-spearheavy").hits.at(-1)!.frame).toBe(245)
  })
})

describe("healSkill", () => {
  it.each(HEALED_IDS)("lands the untouched %s copy on the built-in", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    const live = builtinOf(id)
    expect(healed.hits).toEqual(live.hits)
    expect(healed.castFrames).toBe(live.castFrames)
    expect(healed.castConditions).toEqual(live.castConditions)
    expect(healed.cancelledBy).toBe(live.cancelledBy)
  })

  it("lands a 1-hit copy still on its seeded cast length on the built-in", () => {
    const seeded = clone(skillIn(STORE, EDITED_ID))
    seeded.castFrames = 41
    const healed = healSkill(seeded) as Skill
    const live = builtinOf(EDITED_ID)
    expect(healed.hits).toEqual(live.hits)
    expect(healed.castFrames).toBe(live.castFrames)
    expect(healed.cancelledBy).toBe("deflectCancel")
  })

  it("ends the 2-hit Inner Balance Strike III on a Deflect and removes the 3-hit Sword Horizon variant", () => {
    const twoHit = healSkill(clone(skillIn(STORE, "bellstrikeUmbra-swordspecial-2-hit"))) as Skill
    expect(twoHit.cancelledBy).toBe("deflectCancel")
    expect(twoHit.castFrames).toBe(36.16)
    const threeHit = healSkill(clone(skillIn(STORE, "bellstrikeUmbra-swordspecial-3-hit"))) as Skill
    expect(threeHit.hits[0]!.variants).toBeUndefined()
    expect(threeHit.castConditions).toContainEqual({ param: "swordHorizon" })
  })

  it("drops the hits a partial charged form only landed into the follow-up", () => {
    const twoHit = healSkill(
      clone(skillIn(STORE, "bellstrikeUmbra-sword-charge-stage-1-2-hit")),
    ) as Skill
    expect(twoHit.hits).toHaveLength(2)
    const threeHit = healSkill(
      clone(skillIn(STORE, "bellstrikeUmbra-sword-charge-stage-1-3-hit")),
    ) as Skill
    expect(threeHit.hits).toHaveLength(3)
  })

  it("retimes the hits of a 1-hit copy whose cast length was edited but leaves the cast length and the form alone", () => {
    const healed = healSkill(clone(skillIn(STORE, EDITED_ID))) as Skill
    expect(healed.castFrames).toBe(45)
    expect(healed.cancelledBy).toBeUndefined()
    expect(healed.hits[0]!.frame).toBe(28.8)
  })

  it("leaves a hit frame the copy was edited away from alone", () => {
    const edited = clone(skillIn(STORE, "bellstrikeUmbra-spear-light-2"))
    edited.hits[0]!.frame = 15
    expect((healSkill(clone(edited)) as Skill).hits[0]!.frame).toBe(15)
  })

  it("leaves a charged copy whose cast length was edited with that length", () => {
    const edited = clone(skillIn(STORE, "bellstrikeUmbra-sword-charge-stage-2-4-hit"))
    edited.castFrames = 150
    const healed = healSkill(clone(edited)) as Skill
    expect(healed.castFrames).toBe(150)
    expect(healed.castConditions).toEqual([{ param: "swordHorizon" }])
  })

  it("leaves an untouched neighbour and a user-authored skill alone and is idempotent", () => {
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID]) {
      const seeded = skillIn(STORE, id)
      expect(healSkill(clone(seeded)), id).toEqual(seeded)
    }
    for (const id of [...HEALED_IDS, EDITED_ID]) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V97__umbraGameplayTimings — called directly", () => {
  it("heals the retimed skills and keeps every other skill", () => {
    const after = V97__umbraGameplayTimings.migrate(clone(STORE))
    expect(after.v).toBe(97)
    for (const id of HEALED_IDS) {
      expect(skillIn(after, id).hits, id).toEqual(builtinOf(id).hits)
    }
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID]) {
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
    }
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V97__umbraGameplayTimings.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("V97__umbraGameplayTimings — through the chain", () => {
  it("is registered and is exactly what the v96 → v97 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V97__umbraGameplayTimings)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 97 })!
    expect(result.applied).toEqual(["V97__umbraGameplayTimings"])
    expect(result.blob.v).toBe(97)
  })
})
