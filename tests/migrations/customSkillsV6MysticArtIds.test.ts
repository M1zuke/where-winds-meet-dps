import { beforeEach, describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  LATEST_CUSTOM_SKILLS_VERSION,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V6__mysticArtIds,
  migrateMysticSkillHit,
} from "../../src/migrations/customSkills/V6__mysticArtIds"
import { loadCustomSkills, loadCustomSkillsForClass } from "../../src/storage"
import { MYSTIC_ARTS_CLASS_ID, type Skill } from "../../src/engine/skill"
import storeV5File from "./testCustomSkills/v5/store.json"

const SKILLS_KEY = "wwm.customSkills"
const STRENGTH_COPY = "stonesplitStrength-flute-of-the-tides-full"
const UMBRA_COPY = "bellstrikeUmbra-flute-of-the-tides-full"
const SHARED_FLUTE = "mystic-flute-of-the-tides-full"
const DRAGON_HEAD_PLUS_COPY = "bellstrikeUmbra-dragon-head-plus"
const USER_AUTHORED = "sk-user-authored-poet-chain"
const STORE = storeV5File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: { skills: unknown[] }, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const targetsOf = (skill: Skill): string[] =>
  skill.hits.flatMap((hit) => hit.triggers.map((trigger) => trigger.targetId))

describe("custom-skills v5 fixture", () => {
  it("is v5 and still stores mystic-art copies under the class they were opened from", () => {
    expect(STORE.v).toBe(V6__mysticArtIds.to - 1)
    expect(skillIn(STORE, STRENGTH_COPY).classId).toBe("stonesplitStrength")
    expect(skillIn(STORE, UMBRA_COPY).classId).toBe("bellstrikeUmbra")
    expect(skillIn(STORE, DRAGON_HEAD_PLUS_COPY).classId).toBe("bellstrikeUmbra")
  })

  it("holds a user-authored skill whose references name the class-prefixed ids", () => {
    const authored = skillIn(STORE, USER_AUTHORED)
    expect(targetsOf(authored)).toEqual([
      "bellstrikeUmbra-poet1",
      "debuff-bellstrikeUmbra-combustion",
    ])
    expect(authored.hits[0].conditions?.[0].buffId).toBe("debuff-bellstrikeUmbra-flute-ripple")
    expect(authored.hits[0].triggers[1].condition?.buffId).toBe("debuff-bellstrikeUmbra-dark-fire")
  })
})

describe("migrateMysticSkillHit", () => {
  it("moves every trigger target, trigger condition and hit condition onto the shared ids", () => {
    const hit = migrateMysticSkillHit(
      clone(skillIn(STORE, USER_AUTHORED).hits[0]),
    ) as Skill["hits"][0]
    expect(hit.triggers.map((trigger) => trigger.targetId)).toEqual([
      "mystic-poet1",
      "debuff-mystic-combustion",
    ])
    expect(hit.triggers[1].condition?.buffId).toBe("debuff-mystic-smolder")
    expect(hit.conditions?.[0].buffId).toBe("debuff-mystic-flute-ripple")
  })

  it("leaves a hit that references nothing mystic untouched", () => {
    const hit = clone(skillIn(STORE, "bellstrikeUmbra-swordq").hits[0])
    expect(migrateMysticSkillHit(hit)).toEqual(hit)
  })
})

describe("V6__mysticArtIds — called directly", () => {
  const after = V6__mysticArtIds.migrate(clone(STORE))

  it("lands the first copy of a mystic art on the shared id and class", () => {
    expect(after.v).toBe(6)
    const shared = skillIn(after, SHARED_FLUTE)
    expect(shared.classId).toBe(MYSTIC_ARTS_CLASS_ID)
    expect(shared.name).toBe(skillIn(STORE, STRENGTH_COPY).name)
    expect(targetsOf(shared)).toEqual(["debuff-mystic-flute-ripple"])
    expect(skillIn(after, DRAGON_HEAD_PLUS_COPY)).toBeUndefined()
    expect(skillIn(after, "mystic-dragon-head-plus").classId).toBe(MYSTIC_ARTS_CLASS_ID)
  })

  it("keeps a second class copy of the same mystic art as the class-bound skill it already was", () => {
    const kept = skillIn(after, UMBRA_COPY)
    expect(kept.classId).toBe("bellstrikeUmbra")
    expect(kept.hits[0].physMultiplier).toBe(4.5)
    expect(targetsOf(kept)).toEqual(["debuff-mystic-flute-ripple"])
  })

  it("keeps a user-authored skill's identity and moves only its references", () => {
    const authored = skillIn(after, USER_AUTHORED)
    expect(authored.classId).toBe("bellstrikeUmbra")
    expect(targetsOf(authored)).toEqual(["mystic-poet1", "debuff-mystic-combustion"])
  })

  it("leaves class-owned copies untouched", () => {
    for (const id of ["bellstrikeUmbra-swordq", "bellstrikeUmbra-swordqfollowup"]) {
      expect(skillIn(after, id)).toEqual(skillIn(STORE, id))
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V6__mysticArtIds.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V6__mysticArtIds.migrate(clone(once))).toEqual(once)
  })
})

describe("V6__mysticArtIds — through the chain", () => {
  beforeEach(() => localStorage.clear())

  it("is registered and is exactly what the v5 → v6 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V6__mysticArtIds)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 6 })!
    expect(result.applied).toEqual(["V6__mysticArtIds"])
    expect(result.blob.v).toBe(6)
  })

  it("loadCustomSkills persists the store at the latest version and every class sees the shared copy", () => {
    localStorage.setItem(SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    expect(loaded.map((skill) => skill.id)).toContain(SHARED_FLUTE)
    const persisted = JSON.parse(localStorage.getItem(SKILLS_KEY)!) as RawCustomSkillsBlob
    expect(persisted.v).toBe(LATEST_CUSTOM_SKILLS_VERSION)
    for (const classId of ["stonesplitStrength", "bellstrikeUmbra", "bamboocutDraught"]) {
      expect(loadCustomSkillsForClass(classId).map((skill) => skill.id)).toContain(SHARED_FLUTE)
    }
    expect(loadCustomSkillsForClass("bamboocutDraught").map((skill) => skill.id)).not.toContain(
      UMBRA_COPY,
    )
  })
})
