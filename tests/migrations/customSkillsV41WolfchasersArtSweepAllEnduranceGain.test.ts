import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V41__wolfchasersArtSweepAllEnduranceGain,
  healSkill,
} from "../../src/migrations/customSkills/V41__wolfchasersArtSweepAllEnduranceGain"
import { loadCustomSkills } from "../../src/storage"
import { seedSkillFromBuiltin, type Skill } from "../../src/engine/skill"
import { spearspecial } from "../../src/data/skills/bellstrike-umbra/spearspecial"
import { spearspecial1HitCancel } from "../../src/data/skills/bellstrike-umbra/spearspecial-1-hit-cancel"
import storeV40File from "./testCustomSkills/v40/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"

const STORE = storeV40File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const isTheGain = (trigger: { kind: string; cooldownGroup?: string }): boolean =>
  trigger.kind === "meterDelta" && trigger.cooldownGroup === "wolfchasersArtSweepAllEnduranceGain"

const hasEnduranceGain = (skill: Skill, hitIndex: number): boolean =>
  !!skill.hits[hitIndex]?.triggers.some(isTheGain)

// The v40 fixture's own captured copy of Sweep All has been trimmed to a
// single hit by an earlier edit, so it cannot exercise hit 1 / hit 2 — a
// clean copy is seeded from the current built-in instead, with the gain this
// step itself would add stripped back out to reach the genuine pre-V41 shape.
function withoutGain(skill: Skill, hitIndexes: number[]): Skill {
  return {
    ...skill,
    hits: skill.hits.map((hit, index) =>
      hitIndexes.includes(index)
        ? { ...hit, triggers: hit.triggers.filter((trigger) => !isTheGain(trigger)) }
        : hit,
    ),
  }
}

const PRE_V41_BUILTINS: Record<string, Skill> = {
  "bellstrikeUmbra-spearspecial": withoutGain(spearspecial, [1, 2]),
  "bellstrikeUmbra-spearspecial-1-hit-cancel": withoutGain(spearspecial1HitCancel, [1]),
}

// Every matchId this step patches, and the hits each one gains the trigger on.
const TARGETS: [string, number[]][] = [
  ["bellstrikeUmbra-spearspecial", [1, 2]],
  ["bellstrikeUmbra-spearspecial-1-hit-cancel", [1]],
]

function seededBefore(id: string): Skill {
  return seedSkillFromBuiltin("bellstrikeUmbra", PRE_V41_BUILTINS[id]!)
}

describe("the seeded pre-V41 shape", () => {
  it("carries none of the hits this step patches with the gain yet", () => {
    for (const [id, hitIndexes] of TARGETS) {
      const skill = seededBefore(id)
      for (const hitIndex of hitIndexes) expect(hasEnduranceGain(skill, hitIndex), id).toBe(false)
    }
  })
})

describe("healSkill", () => {
  it("adds the gain, gated on Empowered River Flow, to Sweep All's hit 1 and hit 2", () => {
    const healed = healSkill(clone(seededBefore("bellstrikeUmbra-spearspecial"))) as Skill
    for (const hitIndex of [1, 2]) {
      const gain = healed.hits[hitIndex]!.triggers.find(isTheGain)
      expect(gain?.stacks, `hit ${hitIndex}`).toBe(20)
      expect(gain?.condition, `hit ${hitIndex}`).toEqual({
        buffId: "buff-bellstrikeUmbra-empowered-river-flow",
        op: "gte",
        stacks: 1,
      })
      expect(gain?.cooldownFrames, `hit ${hitIndex}`).toBe(720)
    }
  })

  it("adds the gain to the 1-hit-cancel form's own hit 1", () => {
    const healed = healSkill(
      clone(seededBefore("bellstrikeUmbra-spearspecial-1-hit-cancel")),
    ) as Skill
    expect(hasEnduranceGain(healed, 1)).toBe(true)
  })

  it("does not double-heal a copy that already carries the gain", () => {
    const once = healSkill(clone(seededBefore("bellstrikeUmbra-spearspecial"))) as Skill
    const twice = healSkill(clone(once))
    expect(twice).toEqual(once)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, "bellstrikeUmbra-crosswind-blade")
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })

  it("leaves the fixture's own trimmed copy alone where the target hit index does not exist", () => {
    const trimmed = skillIn(STORE, "bellstrikeUmbra-spearspecial")
    expect(trimmed.hits).toHaveLength(1)
    expect(healSkill(clone(trimmed))).toEqual(trimmed)
  })
})

describe("V41__wolfchasersArtSweepAllEnduranceGain — called directly", () => {
  it("heals every matchId and leaves every other skill untouched", () => {
    const seededStore: RawCustomSkillsBlob & { skills: Skill[] } = {
      ...STORE,
      skills: (STORE.skills as Skill[]).map((skill) =>
        skill.id in PRE_V41_BUILTINS ? seededBefore(skill.id) : skill,
      ),
    }
    const before = clone(seededStore)
    const after = V41__wolfchasersArtSweepAllEnduranceGain.migrate(before)
    expect(after.v).toBe(41)
    for (const [id, hitIndexes] of TARGETS) {
      const healed = skillIn(after, id)
      for (const hitIndex of hitIndexes) expect(hasEnduranceGain(healed, hitIndex), id).toBe(true)
    }
    for (const skill of before.skills) {
      if (TARGETS.some(([id]) => id === skill.id)) continue
      expect(skillIn(after, skill.id), skill.id).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V41__wolfchasersArtSweepAllEnduranceGain.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V41__wolfchasersArtSweepAllEnduranceGain.migrate(clone(once))).toEqual(once)
  })
})

describe("V41__wolfchasersArtSweepAllEnduranceGain — through the chain", () => {
  it("is registered and is exactly what the v40 → v41 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V41__wolfchasersArtSweepAllEnduranceGain)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 41 })!
    expect(result.applied).toEqual(["V41__wolfchasersArtSweepAllEnduranceGain"])
    expect(result.blob.v).toBe(41)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const seeded = clone(seededBefore("bellstrikeUmbra-spearspecial"))
    const seededStore: RawCustomSkillsBlob & { skills: Skill[] } = {
      ...clone(STORE),
      skills: (STORE.skills as Skill[]).map((skill) => (skill.id === seeded.id ? seeded : skill)),
    }
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V41__wolfchasersArtSweepAllEnduranceGain,
    )
    const result = runChain(withoutStep, 41, seededStore)!
    expect(result.applied).not.toContain("V41__wolfchasersArtSweepAllEnduranceGain")
    expect(hasEnduranceGain(skillIn(result.blob, "bellstrikeUmbra-spearspecial"), 1)).toBe(false)
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps the gain after loadCustomSkills, not just after the migration step", () => {
    const seededStore: RawCustomSkillsBlob & { skills: Skill[] } = {
      ...STORE,
      skills: (STORE.skills as Skill[]).map((skill) =>
        skill.id === "bellstrikeUmbra-spearspecial" ? seededBefore(skill.id) : skill,
      ),
    }
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(seededStore))
    const loaded = loadCustomSkills()
    const skill = loaded.find((candidate) => candidate.id === "bellstrikeUmbra-spearspecial")!
    expect(hasEnduranceGain(skill, 1)).toBe(true)
    expect(hasEnduranceGain(skill, 2)).toBe(true)
  })
})
