import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { StatusLedger } from "../../src/engine/ledger"
import type { BuffModule } from "../../src/engine/buffs/buffModule"
import { stat } from "../../src/engine/effects/effect"
import { makeSkill } from "../../src/engine/skill"

const COUNTER_ID = "counter-status"
const THRESHOLD = 100
const PAYS_OUT_WITHIN_SECONDS = 5
const FPS = 60

const payoutModule: BuffModule = {
  id: "pays-after-counter-drops",
  name: "Pays After Counter Drops",
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "test",
  effects: (ctx) => {
    const secondsSince = ctx.status.secondsSinceStacksBelowThreshold(COUNTER_ID, THRESHOLD)
    if (secondsSince !== null && secondsSince <= PAYS_OUT_WITHIN_SECONDS)
      return [stat("allDamageBoost", 0.1)]
    return []
  },
}

function engineWithCounterLedger(): { engine: BuffEngine; ledger: StatusLedger } {
  const engine = new BuffEngine({}, [], [payoutModule])
  const ledger = new StatusLedger(0, 3600)
  engine.attachStatuses({ view: ledger, fps: FPS })
  return { engine, ledger }
}

function allDamageBoostAt(engine: BuffEngine, time: number): number | undefined {
  const skill = makeSkill("test", { name: "AnySkill" })
  return engine
    .calculateDamageEffects(skill, time)
    .effects.find((effect) => effect.statKey === "allDamageBoost")?.amount
}

describe("ctx.status.secondsSinceStacksBelowThreshold", () => {
  it("is null while the counter has never dropped below the threshold", () => {
    const { engine, ledger } = engineWithCounterLedger()
    ledger.recordStack(COUNTER_ID, 0, 200)
    expect(allDamageBoostAt(engine, 10)).toBeUndefined()
  })

  it("pays out right at the frame the counter drops below the threshold", () => {
    const { engine, ledger } = engineWithCounterLedger()
    ledger.recordStack(COUNTER_ID, 0, 200)
    ledger.recordStack(COUNTER_ID, 600, 50)
    expect(allDamageBoostAt(engine, 10)).toBe(0.1)
  })

  it("keeps paying out within the window after the drop", () => {
    const { engine, ledger } = engineWithCounterLedger()
    ledger.recordStack(COUNTER_ID, 0, 200)
    ledger.recordStack(COUNTER_ID, 600, 50)
    expect(allDamageBoostAt(engine, 14.9)).toBe(0.1)
  })

  it("stops paying out once the window after the drop elapses", () => {
    const { engine, ledger } = engineWithCounterLedger()
    ledger.recordStack(COUNTER_ID, 0, 200)
    ledger.recordStack(COUNTER_ID, 600, 50)
    expect(allDamageBoostAt(engine, 15.1)).toBeUndefined()
  })

  it("counts from the most recent drop, not an earlier one, even once back above the threshold", () => {
    const { engine, ledger } = engineWithCounterLedger()
    ledger.recordStack(COUNTER_ID, 0, 200)
    ledger.recordStack(COUNTER_ID, 600, 50)
    ledger.recordStack(COUNTER_ID, 1200, 200)
    ledger.recordStack(COUNTER_ID, 2400, 50)
    expect(allDamageBoostAt(engine, 32)).toBeUndefined()
    expect(allDamageBoostAt(engine, 41)).toBe(0.1)
  })
})
