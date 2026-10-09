import { describe, expect, it } from "vitest"
import { FPS, simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, makeTrigger } from "../../src/engine/skill"
import { makeBuff } from "../../src/engine/buff"
import { makeRotation, makeStep } from "../../src/engine/rotation"

const CLASS = "bellstrikeUmbra"
const baseInputs = { ...defaultInputs, classId: CLASS }

function grantSkill(name: string, targetId: string, frame = 0) {
  return makeSkill(CLASS, {
    name,
    castFrames: 10,
    startLatency: "none",
    hits: [makeHit({ frame, triggers: [makeTrigger({ kind: "applyBuff", targetId })] })],
  })
}

function clearSkill(
  name: string,
  targetId: string,
  conditions?: ReturnType<typeof makeTrigger>["conditions"],
) {
  return makeSkill(CLASS, {
    name,
    castFrames: 10,
    startLatency: "none",
    hits: [
      makeHit({ frame: 0, triggers: [makeTrigger({ kind: "clearStatus", targetId, conditions })] }),
    ],
  })
}

describe("a clearStatus trigger", () => {
  it("closes the target status's active window at the trigger's own frame", () => {
    const marker = makeBuff(CLASS, { name: "Marker", durationFrames: 600, effects: [] })
    const grant = grantSkill("Grant", marker.id)
    const clear = clearSkill("Clear", marker.id)
    const result = simulateTimeline({
      ...baseInputs,
      customSkills: [grant, clear],
      customBuffs: [marker],
      activeCustomRotation: makeRotation(CLASS, {
        steps: [makeStep({ skillId: grant.id }), makeStep({ skillId: clear.id })],
      }),
    })
    const window = result.buffWindows!.find((candidate) => candidate.id === marker.id)!
    expect(window.endSec).toBeCloseTo(grant.castFrames / FPS, 6)
  })

  it("is a no-op when the target status has no active window", () => {
    const marker = makeBuff(CLASS, { name: "Marker", durationFrames: 600, effects: [] })
    const clear = clearSkill("Clear", marker.id)
    const result = simulateTimeline({
      ...baseInputs,
      customSkills: [clear],
      customBuffs: [marker],
      activeCustomRotation: makeRotation(CLASS, { steps: [makeStep({ skillId: clear.id })] }),
    })
    expect(result.buffWindows!.some((candidate) => candidate.id === marker.id)).toBe(false)
  })

  it("respects its own condition — an unmet gate leaves the window open", () => {
    const marker = makeBuff(CLASS, { name: "Marker", durationFrames: 600, effects: [] })
    const gate = makeBuff(CLASS, { name: "Gate", durationFrames: 600, effects: [] })
    const grant = grantSkill("Grant", marker.id)
    const gatedClear = clearSkill("Gated Clear", marker.id, [
      { buffId: gate.id, op: "gte", stacks: 1 },
    ])
    const result = simulateTimeline({
      ...baseInputs,
      customSkills: [grant, gatedClear],
      customBuffs: [marker, gate],
      activeCustomRotation: makeRotation(CLASS, {
        steps: [makeStep({ skillId: grant.id }), makeStep({ skillId: gatedClear.id })],
      }),
    })
    const window = result.buffWindows!.find((candidate) => candidate.id === marker.id)!
    expect(window.endSec).toBeCloseTo(marker.durationFrames / FPS, 6)
  })
})
