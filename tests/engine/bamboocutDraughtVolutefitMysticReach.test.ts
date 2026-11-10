import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, makeTrigger } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import { STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { fireBreath1Hit } from "../../src/data/skills/mystic/fire-breath-1-hit"
import { poet1 } from "../../src/data/skills/mystic/poet1"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bamboocutDraught"

const grantDeepdaze = makeSkill(CLASS, {
  name: "Test Deepdaze Granter",
  castFrames: 12,
  hits: [
    makeHit({
      frame: 0,
      triggers: [makeTrigger({ kind: "applyBuff", targetId: STATUS.inebriateDeepdaze, stacks: 1 })],
    }),
  ],
})

const volutefitAt = (tier: number): Inputs["mindMethods"] => [
  { id: INNER_WAY_ID.volutefit, name: "Volutefit", stacks: String(tier) },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
]

const unslotted: Inputs["mindMethods"] = [
  { name: "", stacks: "" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
  { name: "", stacks: "" },
]

function rowDamage(
  skillId: string,
  name: string,
  mindMethods: Inputs["mindMethods"],
  drunk: boolean,
) {
  const result = runEngine({
    ...defaultInputs,
    classId: CLASS,
    mindMethods,
    customSkills: [grantDeepdaze],
    activeCustomRotation: makeRotation(CLASS, {
      steps: [...(drunk ? [grantDeepdaze] : []), fireBreath1Hit, poet1]
        .filter((skill) => skill.id === grantDeepdaze.id || skill.id === skillId)
        .map((skill) => makeStep({ skillId: skill.id })),
    }),
    divinecraft: null,
  })
  return result.perSkill.find((row) => row.name === name)!.expectedDamage
}

describe("Volutefit on the Winebound mystic hits", () => {
  it.each([
    [fireBreath1Hit.id, fireBreath1Hit.name],
    [poet1.id, poet1.name],
  ])("raises %s, twice as much at tier 6 as at tier 1, while Deepdaze holds", (skillId, name) => {
    const base = rowDamage(skillId, name, unslotted, true)
    const tier1Gain = rowDamage(skillId, name, volutefitAt(1), true) / base - 1
    const tier6Gain = rowDamage(skillId, name, volutefitAt(6), true) / base - 1
    expect(tier1Gain).toBeGreaterThan(0)
    expect(tier6Gain / tier1Gain).toBeCloseTo(2, 6)
  })

  it.each([
    [fireBreath1Hit.id, fireBreath1Hit.name],
    [poet1.id, poet1.name],
  ])("leaves %s alone outside Tipsy and Deepdaze", (skillId, name) => {
    expect(
      rowDamage(skillId, name, volutefitAt(6), false) / rowDamage(skillId, name, unslotted, false),
    ).toBeCloseTo(1, 6)
  })
})
