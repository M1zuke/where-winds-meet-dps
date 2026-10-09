import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, makeTrigger, type Skill } from "../../src/engine/skill"
import { makeRotation, makeStep, type Rotation } from "../../src/engine/rotation"
import { makeBuff, type Buff } from "../../src/engine/buff"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"
const PARAM = "maxStacksByTierTestParam"

function timelineInputs(
  rotation: Rotation,
  skills: Skill[],
  buffs: Buff[],
  patch: Partial<Inputs> = {},
): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: skills,
    customBuffs: buffs,
    activeCustomRotation: rotation,
    set: null,
    ...patch,
  }
}

function stackerRotation(stacker: Skill, hits: number): Rotation {
  return makeRotation(CLASS, {
    steps: Array.from({ length: hits }, () => makeStep({ skillId: stacker.id })),
  })
}

describe("a buff's maxStacksByTier", () => {
  const gate = makeBuff(CLASS, {
    name: "Tiered Gate",
    activation: "triggered",
    durationFrames: 6000,
    effects: [],
    maxStacks: 3,
    maxStacksByTier: { param: PARAM, byTier: { 4: 6, 6: 10 } },
  })
  const stacker = makeSkill(CLASS, {
    name: "Stacker",
    castFrames: 6,
    hits: [makeHit({ frame: 0, triggers: [makeTrigger({ targetId: gate.id, stacks: 1 })] })],
  })

  function stacksAfter(hits: number, buffParams?: Record<string, unknown>): number {
    const result = simulateTimeline(
      timelineInputs(stackerRotation(stacker, hits), [stacker], [gate], { buffParams }),
    )
    let max = 0
    for (const cast of result.casts ?? []) {
      const chip = cast.buffs.find((buff) => buff.id === gate.id)
      if (chip) max = Math.max(max, chip.stacks)
    }
    return max
  }

  it("caps at the authored maxStacks below every threshold", () => {
    expect(stacksAfter(5)).toBe(3)
  })

  it("caps at the tier-4 threshold once the param reaches tier 4", () => {
    expect(stacksAfter(8, { [PARAM]: true, [`${PARAM}Tier`]: 4 })).toBe(6)
  })

  it("caps at the tier-6 threshold once the param reaches tier 6", () => {
    expect(stacksAfter(12, { [PARAM]: true, [`${PARAM}Tier`]: 6 })).toBe(10)
  })

  it("uses the highest threshold at or below the param's own tier, tier 5 still reading tier 4's cap", () => {
    expect(stacksAfter(8, { [PARAM]: true, [`${PARAM}Tier`]: 5 })).toBe(6)
  })
})
