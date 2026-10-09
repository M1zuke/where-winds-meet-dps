// Scoped to Bamboocut Draught's per-skill cooldown gates (docs/TESTING.md
// § "Class scoping"); the class's anchor is bamboocutDraughtProfile.test.ts,
// so nothing here asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { applyBuff } from "../../src/definitions/skills/triggers"
import { makeHit, makeSkill } from "../../src/engine/skill"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import {
  CASTLINK_COOLDOWN_FRAMES,
  HEROS_BLOOD_COOLDOWN_FRAMES,
  PEAKFALL_COOLDOWN_FRAMES,
} from "../../src/data/classes/bamboocut-draught/gates"

const CLASS = "bamboocutDraught"

const longestCooldown = Math.max(
  PEAKFALL_COOLDOWN_FRAMES,
  CASTLINK_COOLDOWN_FRAMES,
  HEROS_BLOOD_COOLDOWN_FRAMES,
)

const clearsEveryCooldown = makeSkill(CLASS, {
  name: "Test Cooldown Clear",
  castFrames: longestCooldown,
  hits: [makeHit({ frame: 0 })],
})

const grantConsecutivePunches = makeSkill(CLASS, {
  name: "Test Consecutive Punches Grant",
  castFrames: 1,
  hits: [
    makeHit({
      frame: 0,
      triggers: [applyBuff({ target: STATUS.consecutivePunches, stacks: 1 })],
    }),
  ],
})

function run(steps: string[]) {
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    set: null,
    customSkills: [clearsEveryCooldown, grantConsecutivePunches],
    activeCustomRotation: makeRotation(CLASS, {
      steps: steps.map((id) => makeStep({ skillId: id })),
      openingStacks: {
        [STATUS.consecutivePunches]: 1,
        [STATUS.bingePoints]: 100,
      },
    }),
  })
}

function hitCount(result: ReturnType<typeof run>, breakdownName: string): number {
  return result.perSkill.find((row) => row.breakdownName === breakdownName)?.count ?? 0
}

describe.each([
  { skillId: SKILL.peakfall, breakdownName: "Peakfall" },
  { skillId: SKILL.herosBlood, breakdownName: "Hero's Blood" },
])("$breakdownName's cooldown", ({ skillId, breakdownName }) => {
  it("blocks an immediate second cast but not one after the cooldown clears", () => {
    const oneCast = hitCount(run([skillId]), breakdownName)
    const immediateSecond = hitCount(run([skillId, skillId]), breakdownName)
    const secondAfterWaiting = hitCount(
      run([skillId, clearsEveryCooldown.id, skillId]),
      breakdownName,
    )
    expect(oneCast).toBeGreaterThan(0)
    expect(immediateSecond).toBe(oneCast)
    expect(secondAfterWaiting).toBe(oneCast * 2)
  })
})

describe("Castlink's cooldown", () => {
  it("blocks an immediate second cast but not one after the cooldown clears and Consecutive Punches is re-granted", () => {
    const oneCast = hitCount(run([SKILL.castlink]), "Castlink")
    const immediateSecond = hitCount(run([SKILL.castlink, SKILL.castlink]), "Castlink")
    const secondAfterWaiting = hitCount(
      run([SKILL.castlink, clearsEveryCooldown.id, grantConsecutivePunches.id, SKILL.castlink]),
      "Castlink",
    )
    expect(oneCast).toBeGreaterThan(0)
    expect(immediateSecond).toBe(oneCast)
    expect(secondAfterWaiting).toBe(oneCast * 2)
  })
})
