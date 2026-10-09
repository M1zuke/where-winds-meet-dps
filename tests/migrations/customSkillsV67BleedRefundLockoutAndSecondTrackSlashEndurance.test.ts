import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V67__bleedRefundLockoutAndSecondTrackSlashEndurance,
  healSkill,
} from "../../src/migrations/customSkills/V67__bleedRefundLockoutAndSecondTrackSlashEndurance"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV66File from "./testCustomSkills/v66/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const STORE = storeV66File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const USER_AUTHORED_ID = "sk-user-authored-vessel"

const REFUND_IDS = [
  "bellstrikeUmbra-crosswind-blade",
  "bellstrikeUmbra-crosswind-blade-cancel",
  "bellstrikeUmbra-swordspecial-4-hit",
  "bellstrikeUmbra-sword-martial-qqq",
]
const SECOND_TRACK_SLASH_IDS = [
  "bellstrikeUmbra-sword-charge-stage-1-4-hit",
  "bellstrikeUmbra-sword-charge-stage-2-4-hit",
]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtin = (id: string): Skill =>
  builtinSkillsForClass("bellstrikeUmbra").find((skill) => skill.id === id)!

const withSortedTriggers = (hits: Skill["hits"]) =>
  hits.map((hit) => ({
    ...hit,
    triggers: [...hit.triggers].sort((left, right) =>
      JSON.stringify(left) < JSON.stringify(right) ? -1 : 1,
    ),
  }))

const refundTriggers = (skill: Skill) =>
  skill.hits.flatMap((hit) =>
    hit.triggers.filter((trigger) =>
      trigger.cooldownGroup?.startsWith("bleedMechanismEnhancement"),
    ),
  )

describe("custom-skills v66 fixture", () => {
  it("is v66 and the seeded copies still carry the per-skill refund cooldowns and the press-time Second Track Slash cost", () => {
    expect(STORE.v).toBe(V67__bleedRefundLockoutAndSecondTrackSlashEndurance.to - 1)
    for (const id of REFUND_IDS) {
      const triggers = refundTriggers(skillIn(STORE, id))
      expect(triggers.length, id).toBeGreaterThan(0)
      for (const trigger of triggers) expect(trigger.cooldownFrames, id).toBe(120)
    }
    for (const id of SECOND_TRACK_SLASH_IDS) {
      expect(skillIn(STORE, id).meterCosts, id).toEqual([{ meterId: "endurance", amount: 6 }])
      expect(skillIn(STORE, id).meterFreezes, id).toEqual([{ meterId: "endurance", fromFrame: 0 }])
    }
  })
})

describe("healSkill", () => {
  it.each(REFUND_IDS)("lands the seeded %s on the built-in's own hits", (id) => {
    const healed = healSkill(clone(skillIn(STORE, id))) as Skill
    expect(withSortedTriggers(healed.hits)).toEqual(withSortedTriggers(builtin(id).hits))
  })

  it.each(SECOND_TRACK_SLASH_IDS)(
    "lands the seeded %s on the built-in's own cost and freeze",
    (id) => {
      const healed = healSkill(clone(skillIn(STORE, id))) as Skill
      expect(healed.meterCosts).toEqual(builtin(id).meterCosts)
      expect(healed.meterFreezes).toEqual(builtin(id).meterFreezes)
      expect(healed.meterDrains).toEqual(skillIn(STORE, id).meterDrains)
    },
  )

  it.each([
    ["bellstrikeUmbra-swordspecial-1-hit", "bleedMechanismEnhancement-innerBalanceStrikeIII"],
    ["bellstrikeUmbra-swordspecial-2-hit", "bleedMechanismEnhancement-innerBalanceStrikeIII"],
    ["bellstrikeUmbra-swordspecial-3-hit", "bleedMechanismEnhancement-innerBalanceStrikeIII"],
    ["bellstrikeUmbra-sword-r-charge-follow-up", "bleedMechanismEnhancement-swordRChargeFollowUp"],
    [
      "bellstrikeUmbra-sword-r-charge-follow-up-1-hit-cancel",
      "bleedMechanismEnhancement-swordRChargeFollowUp",
    ],
  ])("lands %s, rebuilt in its pre-lockout shape, on the built-in's own hits", (id, oldGroup) => {
    const current = builtin(id)
    const preLockout = {
      ...clone(current),
      hits: current.hits.map((hit) => ({
        ...clone(hit),
        triggers: clone(hit.triggers)
          .filter((trigger) => trigger.kind !== "cooldownCut")
          .map((trigger) =>
            trigger.cooldownGroup === "bleedMechanismEnhancement"
              ? {
                  kind: trigger.kind,
                  targetId: trigger.targetId,
                  stacks: trigger.stacks,
                  condition: trigger.condition,
                  cooldownFrames: 120,
                  cooldownGroup: oldGroup,
                }
              : trigger,
          ),
      })),
    }
    expect(healSkill(preLockout)).toEqual(current)
  })

  it("gives only the first hit of an Inner Balance Strike III form the release", () => {
    const healed = healSkill(clone(skillIn(STORE, "bellstrikeUmbra-swordspecial-4-hit"))) as Skill
    const releaseHits = healed.hits
      .map((hit, index) => (hit.triggers.some((t) => t.kind === "cooldownCut") ? index : -1))
      .filter((index) => index >= 0)
    expect(releaseHits).toEqual([0])
  })

  it("leaves a copy whose refund trigger was edited alone", () => {
    const edited = clone(skillIn(STORE, "bellstrikeUmbra-crosswind-blade"))
    refundTriggers(edited)[0]!.stacks = 15
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a copy whose Second Track Slash cost or freeze was edited alone", () => {
    const edited = clone(skillIn(STORE, SECOND_TRACK_SLASH_IDS[0]!))
    edited.meterCosts![0]!.amount = 7
    edited.meterFreezes![0]!.fromFrame = 5
    expect(healSkill(clone(edited))).toEqual(edited)
  })

  it("leaves a user-authored skill alone", () => {
    const authored = { ...clone(skillIn(STORE, REFUND_IDS[0]!)), id: USER_AUTHORED_ID }
    expect(healSkill(clone(authored))).toEqual(authored)
  })

  it("does not heal a copy twice", () => {
    for (const id of [...REFUND_IDS, ...SECOND_TRACK_SLASH_IDS]) {
      const once = healSkill(clone(skillIn(STORE, id)))
      expect(healSkill(clone(once)), id).toEqual(once)
    }
  })
})

describe("V67__bleedRefundLockoutAndSecondTrackSlashEndurance — called directly", () => {
  it("heals every targeted copy and leaves every other skill identical", () => {
    const after = V67__bleedRefundLockoutAndSecondTrackSlashEndurance.migrate(clone(STORE))
    expect(after.v).toBe(67)
    const targeted = [...REFUND_IDS, ...SECOND_TRACK_SLASH_IDS]
    for (const skill of STORE.skills) {
      if (targeted.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
    for (const id of targeted) expect(skillIn(after, id)).not.toEqual(skillIn(STORE, id))
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V67__bleedRefundLockoutAndSecondTrackSlashEndurance.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V67__bleedRefundLockoutAndSecondTrackSlashEndurance.migrate(clone(once))).toEqual(once)
  })
})

describe("V67__bleedRefundLockoutAndSecondTrackSlashEndurance — through the chain", () => {
  it("is registered and is exactly what the v66 → v67 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V67__bleedRefundLockoutAndSecondTrackSlashEndurance)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 67 })!
    expect(result.applied).toEqual(["V67__bleedRefundLockoutAndSecondTrackSlashEndurance"])
    expect(result.blob.v).toBe(67)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V67__bleedRefundLockoutAndSecondTrackSlashEndurance,
    )
    const result = runChain(withoutStep, 67, clone(STORE))!
    expect(result.applied).not.toContain("V67__bleedRefundLockoutAndSecondTrackSlashEndurance")
    expect(skillIn(result.blob, REFUND_IDS[0]!)).toEqual(skillIn(STORE, REFUND_IDS[0]!))
  })
})

describe("the healed copies survive the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("loads the seeded Crosswind Blade and Second Track Slash on the built-in's shapes", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const crosswind = loaded.find((skill) => skill.id === REFUND_IDS[0])!
    expect(crosswind.hits).toEqual(builtin(REFUND_IDS[0]!).hits)
    const slash = loaded.find((skill) => skill.id === SECOND_TRACK_SLASH_IDS[0])!
    expect(slash.meterCosts).toEqual(builtin(SECOND_TRACK_SLASH_IDS[0]!).meterCosts)
  })
})
