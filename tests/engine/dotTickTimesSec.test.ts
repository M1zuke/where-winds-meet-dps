// Gated on a fictional skill id under a real class — a full damage pass needs
// one `buildContext` recognizes.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { registerMechanic } from "../../src/engine/mechanics"
import type { MechanicSetup, TimelineMechanic } from "../../src/engine/mechanics/types"
import { defaultInputs } from "../../src/engine/defaults"
import { applyDot } from "../../src/definitions/skills/triggers"
import { makeHit, makeSkill, type Skill } from "../../src/engine/skill"
import { makeDebuff, type Debuff } from "../../src/engine/debuff"
import { makeStep, type Rotation } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"
const PROBE_SKILL_ID = "dotTickTimesSecProbeApplier"

let capturedSchedule: readonly number[] | null = null
const probeMechanic: TimelineMechanic<true> = {
  id: "dotTickTimesSecProbeMechanic",
  prepare: (setup: MechanicSetup) => {
    if (!setup.inputs.customSkills?.some((skill) => skill.id === PROBE_SKILL_ID)) return null
    capturedSchedule = setup.dotTickTimesSec
    return true
  },
}
registerMechanic(probeMechanic)

function timelineInputs(rotation: Rotation, skills: Skill[], debuffs: Debuff[]): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: skills,
    customDebuffs: debuffs,
    activeCustomRotation: rotation,
    set: null,
  }
}

describe("MechanicSetup.dotTickTimesSec", () => {
  it("carries every tick the layout pass's own applyDot windows produce, ascending", () => {
    const debuff = makeDebuff(CLASS, {
      name: "Probe DoT",
      durationFrames: 180,
      dot: {
        tickIntervalFrames: 60,
        firstTickOffsetFrames: 0,
        physMultiplier: 0,
        physFixed: 1,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 1,
      },
      maxStacks: 1,
    })
    const applier = makeSkill(CLASS, {
      id: PROBE_SKILL_ID,
      name: "Applier",
      castFrames: 6,
      hits: [makeHit({ frame: 0, triggers: [applyDot({ target: debuff.id })] })],
    })
    const idle = makeSkill(CLASS, { name: "Idle", castFrames: 300, hits: [makeHit({ frame: 0 })] })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: applier.id }), makeStep({ skillId: idle.id })],
    })
    capturedSchedule = null

    simulateTimeline(timelineInputs(rotation, [applier, idle], [debuff]))

    expect(capturedSchedule).toEqual([0, 1, 2])
  })

  it("drops an additionalTicks offset whose requiresBuff never holds, same as pass 1's own entries", () => {
    const debuff = makeDebuff(CLASS, {
      name: "Probe DoT With Extra Tick",
      durationFrames: 180,
      dot: {
        tickIntervalFrames: 60,
        firstTickOffsetFrames: 0,
        physMultiplier: 0,
        physFixed: 1,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 1,
        additionalTicks: { offsetsFrames: [30], requiresBuff: "neverActiveGate" },
      },
      maxStacks: 1,
    })
    const applier = makeSkill(CLASS, {
      id: PROBE_SKILL_ID,
      name: "Applier",
      castFrames: 6,
      hits: [makeHit({ frame: 0, triggers: [applyDot({ target: debuff.id })] })],
    })
    const idle = makeSkill(CLASS, { name: "Idle", castFrames: 300, hits: [makeHit({ frame: 0 })] })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: applier.id }), makeStep({ skillId: idle.id })],
    })
    capturedSchedule = null

    simulateTimeline(timelineInputs(rotation, [applier, idle], [debuff]))

    expect(capturedSchedule).toEqual([0, 1, 2])
  })

  it("is empty when nothing in the rotation applies a DoT", () => {
    const applier = makeSkill(CLASS, {
      id: PROBE_SKILL_ID,
      name: "NoDot",
      castFrames: 6,
      hits: [makeHit({ frame: 0 })],
    })
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: applier.id })] })
    capturedSchedule = null

    simulateTimeline(timelineInputs(rotation, [applier], []))

    expect(capturedSchedule).toEqual([])
  })
})
