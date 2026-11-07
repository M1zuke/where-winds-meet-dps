// Scoped to Silkbind Jade metadata and timeline reach; not a measured DPS anchor.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"
import { builtinSkill } from "../builtins"

function simulate(skillId: string) {
  const step = makeStep({ skillId: builtinSkill("silkbindJade", skillId).id })
  const rotation = makeRotation("silkbindJade", { name: `test-${skillId}`, steps: [step] })
  const inputs: Inputs = {
    ...defaultInputs,
    classId: "silkbindJade",
    activeCustomRotation: rotation,
  }
  return simulateTimeline(inputs)
}

describe("Umb HeavyLight's heavy-share companion", () => {
  it("fires once per cast, not once per Colorful Phoenix hit", () => {
    const result = simulate("silkbindJade-umb-heavylight")
    const mainShare = result.perSkill.find((entry) => entry.name === "Umb HeavyLight")
    const heavyShare = result.perSkill.find(
      (entry) => entry.name === "Umb HeavyLight (Heavy Share)",
    )
    expect(mainShare?.count).toBe(3)
    expect(heavyShare?.count).toBe(1)
  })

  it("carries no attunement tag", () => {
    const heavyShare = builtinSkill("silkbindJade", "silkbindJade-umb-heavylight-heavyshare")
    expect(heavyShare.tags?.some((tag) => tag.startsWith("attune:"))).toBe(false)
  })
})

describe("Spring Away's lift companion", () => {
  it("fires once per cast, not once per bullet", () => {
    const result = simulate("silkbindJade-umblightcharge")
    const bullets = result.perSkill.find((entry) => entry.name === "UmbLightCharge")
    const lift = result.perSkill.find((entry) => entry.name === "UmbLightCharge (Lift)")
    expect(bullets?.count).toBe(6)
    expect(lift?.count).toBe(1)
  })

  it("fires once per 12-bullet cast too, merged into the same breakdown row", () => {
    const result = simulate("silkbindJade-umblightcharge-12")
    const bullets = result.perSkill.find((entry) => entry.name === "UmbLightCharge (12 bullets)")
    const lift = result.perSkill.find((entry) => entry.name === "UmbLightCharge (Lift)")
    expect(bullets?.count).toBe(12)
    expect(lift?.count).toBe(1)
    expect(bullets?.breakdownName).toBe(lift?.breakdownName)
  })

  it("carries no attunement tag", () => {
    const lift = builtinSkill("silkbindJade", "silkbindJade-umblightcharge-lift")
    expect(lift.tags?.some((tag) => tag.startsWith("attune:"))).toBe(false)
  })
})
