import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { GLOBAL_BUFF_DEFS } from "../../src/data/skills/buffs"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { CAST } from "../../src/data/skills/ids"
import { makeSkill } from "../../src/engine/skill"

function engineAt(distanceMeters: number) {
  return new BuffEngine({ distanceMeters }, GLOBAL_BUFF_DEFS, [])
}

function allDamageBoostAt(engine: BuffEngine, time: number, isDotTick = false): number | undefined {
  const { effects } = engine.calculateDamageEffects(
    makeSkill("test", { name: "Any Hit", isDotTick }),
    time,
  )
  return effects.find((effect) => effect.statKey === "allDamageBoost")?.amount
}

describe("Flute of the Tides — distance bonus bands", () => {
  it.each([
    [0, 0.01],
    [0.5, 0.01],
    [1, 0.02],
    [2.9, 0.03],
    [4.9, 0.05],
    [5, 0.08],
    [8.9, 0.17],
    [9, 0.2],
    [20, 0.2],
  ])("gives the band bonus for a %s m distance", (distanceMeters, bonus) => {
    const engine = engineAt(distanceMeters)
    engine.processSkillCast(CAST.fluteOfTheTidesFull, 0, {}, false, [BUFF.fluteArrival])
    expect(allDamageBoostAt(engine, 5)).toBeCloseTo(bonus, 10)
  })

  it("reaches a damage-over-time tick, not just a direct hit", () => {
    const engine = engineAt(3)
    engine.processSkillCast(CAST.fluteOfTheTidesFull, 0, {}, false, [BUFF.fluteArrival])
    expect(allDamageBoostAt(engine, 5, true)).toBeCloseTo(0.04, 10)
  })
})

describe("Flute of the Tides — arrival delay", () => {
  it("opens the distance window 3.4 s after a full or cancel cast", () => {
    const engine = engineAt(3)
    engine.processSkillCast(CAST.fluteOfTheTidesFull, 0, {}, false, [BUFF.fluteArrival])
    expect(allDamageBoostAt(engine, 3.3)).toBeUndefined()
    expect(allDamageBoostAt(engine, 3.5)).toBeCloseTo(0.04, 10)
  })

  it("opens the distance window 2.1 s after the pre-pull cast instead", () => {
    const engine = engineAt(3)
    engine.processSkillCast(CAST.fluteOfTheTidesPrepull, 0, {}, false, [BUFF.fluteArrival])
    expect(allDamageBoostAt(engine, 2.0)).toBeUndefined()
    expect(allDamageBoostAt(engine, 2.2)).toBeCloseTo(0.04, 10)
  })

  it("closes the distance window 12.4 s after it opened", () => {
    const engine = engineAt(3)
    engine.processSkillCast(CAST.fluteOfTheTidesFull, 0, {}, false, [BUFF.fluteArrival])
    expect(allDamageBoostAt(engine, 3.4 + 12.4 - 0.1)).toBeCloseTo(0.04, 10)
    expect(allDamageBoostAt(engine, 3.4 + 12.4 + 0.1)).toBeUndefined()
  })
})
