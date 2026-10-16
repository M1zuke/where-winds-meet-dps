import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { V82__umbraCastLengthsAndSweepAllBurstStacks } from "../../src/migrations/customSkills/V82__umbraCastLengthsAndSweepAllBurstStacks"
import { healSkill as healSwordHorizonBurstStacksAtTheBurst } from "../../src/migrations/customSkills/V98__swordHorizonBurstStacksAtTheBurst"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { HitTrigger, Skill } from "../../src/engine/skill"
import storeV81File from "./testCustomSkills/v81/store.json"

const STORE = storeV81File as unknown as RawCustomSkillsBlob & { skills: Skill[] }
const USER_AUTHORED = "sk-user-authored-slash"
const SWEEP_ALL = "bellstrikeUmbra-spearspecial"
const SWEEP_ALL_CANCEL = "bellstrikeUmbra-spearspecial-1-hit-cancel"
const QQQ = "bellstrikeUmbra-sword-martial-qqq"
const CAST_LENGTH_IDS = [
  "bellstrikeUmbra-spearheavy",
  "bellstrikeUmbra-spearheavy-stage-1",
  "bellstrikeUmbra-spearheavy-1-hit",
  "bellstrikeUmbra-swordq-follow-up-1-hit-cancel",
  "bellstrikeUmbra-swordq-follow-up-2-hit-cancel",
]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtin = (id: string): Skill =>
  builtinSkillsForClass("bellstrikeUmbra").find((skill) => skill.id === id)!

const conditionBuffId = (trigger: HitTrigger): string | undefined =>
  trigger.condition && "buffId" in trigger.condition ? trigger.condition.buffId : undefined

const burstStacks = (skill: Skill) =>
  skill.hits.flatMap((hit) =>
    hit.triggers.filter(
      (trigger) =>
        trigger.kind === "applyDot" &&
        conditionBuffId(trigger) === "buff-bellstrikeUmbra-empowered-river-flow",
    ),
  )

describe("custom-skills v81 fixture", () => {
  it("is v81 and stores the Drifting Thrust, cancel form, Crisscross and Sweep All copies on their earlier values", () => {
    expect(STORE.v).toBe(V82__umbraCastLengthsAndSweepAllBurstStacks.to - 1)
    expect(skillIn(STORE, "bellstrikeUmbra-spearheavy").castFrames).toBe(246)
    expect(skillIn(STORE, "bellstrikeUmbra-swordq-follow-up-1-hit-cancel").castFrames).toBe(24)
    expect(skillIn(STORE, QQQ).hits.map((hit) => hit.frame)).toEqual([32, 71])
    const stacks = burstStacks(skillIn(STORE, SWEEP_ALL))
    expect(stacks).toHaveLength(4)
    for (const stack of stacks) expect(stack.requiresParam).toBeUndefined()
  })
})

describe("V82__umbraCastLengthsAndSweepAllBurstStacks — called directly", () => {
  it("moves every untouched copy onto the built-in's values", () => {
    const after = V82__umbraCastLengthsAndSweepAllBurstStacks.migrate(clone(STORE))
    expect(after.v).toBe(82)
    for (const id of CAST_LENGTH_IDS) {
      expect(skillIn(after, id).castFrames, id).toBe(builtin(id).castFrames)
    }
    expect(skillIn(after, QQQ).hits.map((hit) => hit.frame)).toEqual(
      builtin(QQQ).hits.map((hit) => hit.frame),
    )
    for (const id of [SWEEP_ALL, SWEEP_ALL_CANCEL]) {
      expect(
        (healSwordHorizonBurstStacksAtTheBurst(skillIn(after, id)) as Skill).hits.map(
          (hit) => hit.triggers,
        ),
        id,
      ).toEqual(builtin(id).hits.map((hit) => hit.triggers))
    }
  })

  it("gates only the two Empowered burst stacks of each Sweep All hit", () => {
    const after = V82__umbraCastLengthsAndSweepAllBurstStacks.migrate(clone(STORE))
    for (const stack of burstStacks(skillIn(after, SWEEP_ALL))) {
      expect(stack.requiresParam).toBe("swordHorizon")
      expect(stack.requiresMinTier).toBe(6)
    }
    const plainStack = skillIn(after, SWEEP_ALL).hits[1]!.triggers.find(
      (trigger) => trigger.kind === "applyDot" && conditionBuffId(trigger) === "potentRiverFlow",
    )!
    expect(plainStack.requiresParam).toBeUndefined()
  })

  it("leaves an edited value, a user-authored skill and every other field alone", () => {
    const edited = clone(STORE)
    skillIn(edited, "bellstrikeUmbra-spearheavy").castFrames = 250
    skillIn(edited, QQQ).hits[1]!.frame = 74
    skillIn(edited, SWEEP_ALL).hits[1]!.triggers[1]!.requiresParam = "wolfchasersArt"
    const after = V82__umbraCastLengthsAndSweepAllBurstStacks.migrate(edited)
    expect(skillIn(after, "bellstrikeUmbra-spearheavy").castFrames).toBe(250)
    expect(skillIn(after, QQQ).hits.map((hit) => hit.frame)).toEqual([32, 74])
    expect(skillIn(after, SWEEP_ALL).hits[1]!.triggers[1]!.requiresParam).toBe("wolfchasersArt")
    expect(skillIn(after, USER_AUTHORED)).toEqual(skillIn(STORE, USER_AUTHORED))
    const { castFrames: _beforeCast, ...restBefore } = skillIn(STORE, CAST_LENGTH_IDS[0]!)
    const { castFrames: _afterCast, ...restAfter } = skillIn(after, CAST_LENGTH_IDS[0]!)
    void _beforeCast
    void _afterCast
    expect(restAfter).toEqual(restBefore)
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V82__umbraCastLengthsAndSweepAllBurstStacks.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V82__umbraCastLengthsAndSweepAllBurstStacks.migrate(clone(once))).toEqual(once)
  })
})

describe("V82__umbraCastLengthsAndSweepAllBurstStacks — through the chain", () => {
  it("is registered and is exactly what the v81 → v82 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V82__umbraCastLengthsAndSweepAllBurstStacks)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 82 })!
    expect(result.applied).toEqual(["V82__umbraCastLengthsAndSweepAllBurstStacks"])
    expect(result.blob.v).toBe(82)
    expect(skillIn(result.blob, "bellstrikeUmbra-spearheavy").castFrames).toBe(302)
  })
})
