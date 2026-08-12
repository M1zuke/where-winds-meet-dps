// Guards the one thing this def must never do: contribute through
// `BuffEngine`. Concentration's uptime is `insightfulStrikeMechanic.ts`'s
// probability ramp, so anything that makes the engine apply the def as well
// double-counts every bonus it names.
import { describe, expect, it } from "vitest"
import { concentrationBuffDef } from "../../src/data/innerWays/insightfulStrikeConcentration"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { makeSkill } from "../../src/engine/skill"

const PARAMS_WITH_THE_GATE_FORCED_OPEN = {
  classId: "bellstrikeUmbra",
  spec: "bellstrike_umbra",
  insightfulStrike: true,
  insightfulStrikeTier: 6,
}

function engineWithConcentration(): BuffEngine {
  return new BuffEngine(PARAMS_WITH_THE_GATE_FORCED_OPEN, [concentrationBuffDef])
}

describe("concentration buff module", () => {
  it("carries the Skill Editor's display pair and nothing else", () => {
    expect(concentrationBuffDef.effects).toEqual([
      { kind: "stat", statKey: "affinityDamageBoost", amount: 0.1 },
      { kind: "stat", statKey: "directAffinityRate", amount: 0.03 },
    ])
    expect(concentrationBuffDef.summary).toBe("affinityDmg +10%, directAffinity +3%")
  })

  it("is inactive at t=0 even with its param on", () => {
    expect(engineWithConcentration().isBuffActiveAtTime(concentrationBuffDef.id, 0)).toBe(false)
  })

  it("stays inactive after a cast", () => {
    const engine = engineWithConcentration()
    engine.processSkillCast("cast:anything", 1, { castTime: 1 })
    expect(engine.isBuffActiveAtTime(concentrationBuffDef.id, 2)).toBe(false)
    expect(engine.activeBuffsForDisplay(2)).toEqual([])
  })

  it("adds nothing to a damage event", () => {
    const engine = engineWithConcentration()
    engine.processSkillCast("cast:anything", 1, { castTime: 1 })
    const result = engine.calculateDamageEffects(
      makeSkill("probe", { name: "probe", tags: ["type:sustain"] }),
      2,
    )
    expect(result.effects).toEqual([])
    expect(result.breakdown).toEqual({})
  })
})
