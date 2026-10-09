import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import type { BuffModule } from "../../src/engine/buffs/buffModule"
import { stat } from "../../src/engine/effects/effect"
import { makeSkill } from "../../src/engine/skill"

const SOURCE_ID = "source-status"
const PAYS_OUT_WITHIN_SECONDS = 5

const sourceModule: BuffModule = {
  id: SOURCE_ID,
  name: "Source Status",
  duration: 10,
  affectsAll: true,
  effects: [],
}

const payoutModule: BuffModule = {
  id: "pays-after-source-ends",
  name: "Pays After Source Ends",
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "test",
  effects: (ctx) => {
    const secondsSince = ctx.status.secondsSinceLastEnd(SOURCE_ID)
    if (ctx.status.isActive(SOURCE_ID)) return [stat("allDamageBoost", 0.1)]
    if (secondsSince !== null && secondsSince <= PAYS_OUT_WITHIN_SECONDS)
      return [stat("allDamageBoost", 0.1)]
    return []
  },
}

function allDamageBoostAt(engine: BuffEngine, time: number): number | undefined {
  const skill = makeSkill("test", { name: "AnySkill" })
  return engine
    .calculateDamageEffects(skill, time)
    .effects.find((effect) => effect.statKey === "allDamageBoost")?.amount
}

describe("ctx.status.secondsSinceLastEnd", () => {
  it("is null before the status has ever applied", () => {
    const engine = new BuffEngine({}, [], [sourceModule, payoutModule])
    expect(allDamageBoostAt(engine, 0)).toBeUndefined()
  })

  it("pays out while the source status is still active", () => {
    const engine = new BuffEngine({}, [], [sourceModule, payoutModule])
    engine.processSkillCast("cast:probe", 0, {}, false, [SOURCE_ID])
    expect(allDamageBoostAt(engine, 5)).toBe(0.1)
  })

  it("keeps paying out within the window after the source status's last window ended", () => {
    const engine = new BuffEngine({}, [], [sourceModule, payoutModule])
    engine.processSkillCast("cast:probe", 0, {}, false, [SOURCE_ID])
    expect(allDamageBoostAt(engine, 14.9)).toBe(0.1)
  })

  it("stops paying out once the window after the source status's last window ended elapses", () => {
    const engine = new BuffEngine({}, [], [sourceModule, payoutModule])
    engine.processSkillCast("cast:probe", 0, {}, false, [SOURCE_ID])
    expect(allDamageBoostAt(engine, 15.1)).toBeUndefined()
  })

  it("counts from the most recent closed window, not an earlier one", () => {
    const engine = new BuffEngine({}, [], [sourceModule, payoutModule])
    engine.processSkillCast("cast:probe", 0, {}, false, [SOURCE_ID])
    engine.processSkillCast("cast:probe", 20, {}, false, [SOURCE_ID])
    expect(allDamageBoostAt(engine, 16)).toBeUndefined()
    expect(allDamageBoostAt(engine, 32)).toBe(0.1)
  })
})
