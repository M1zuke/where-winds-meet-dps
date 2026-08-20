import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { GLOBAL_BUFF_DEFS } from "../../src/data/skills/buffs"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { makeSkill } from "../../src/engine/skill"
import { applyArmorSet } from "../../src/engine/panel"
import { defaultInputs } from "../../src/engine/defaults"
import { rainwhisper } from "../../src/data/sets/rainwhisper"
import { SET_ID } from "../../src/data/sets/ids"

const SHIELD_DURATION = 8

function engineWithSet(armorSet?: string) {
  return new BuffEngine(armorSet ? { armorSet } : {}, GLOBAL_BUFF_DEFS, [])
}

function critDamageAt(engine: BuffEngine, time: number): number | undefined {
  const { effects } = engine.calculateDamageEffects(makeSkill("test", { name: "Any Hit" }), time)
  return effects.find((effect) => effect.statKey === "critDamageBoost")?.amount
}

describe("rainwhisper — 2-piece precision", () => {
  it("adds 8% precision to the panel", () => {
    const base = { ...defaultInputs, set: null }
    const equipped = { ...defaultInputs, set: SET_ID.rainwhisper }
    expect(applyArmorSet(equipped).precision).toBeCloseTo(applyArmorSet(base).precision + 0.08, 10)
  })
})

describe("rainwhisper — 4-piece crit damage", () => {
  it("gives 10% with no HP shield up", () => {
    expect(critDamageAt(engineWithSet(rainwhisper.siteKey), 0)).toBe(0.1)
  })

  it("gives 25% while a self-applied HP shield is up", () => {
    const engine = engineWithSet(rainwhisper.siteKey)
    engine.processSkillCast("cast:probe", 0, {}, false, [BUFF.rainwhisperShield])
    expect(critDamageAt(engine, 1)).toBe(0.25)
  })

  it("falls back to 10% once the shield window has expired", () => {
    const engine = engineWithSet(rainwhisper.siteKey)
    engine.processSkillCast("cast:probe", 0, {}, false, [BUFF.rainwhisperShield])
    expect(critDamageAt(engine, SHIELD_DURATION + 1)).toBe(0.1)
  })

  it("is inert without the rainwhisper set, shield or not", () => {
    const engine = engineWithSet()
    expect(critDamageAt(engine, 0)).toBeUndefined()
    engine.processSkillCast("cast:probe", 0, {}, false, [BUFF.rainwhisperShield])
    expect(critDamageAt(engine, 1)).toBeUndefined()
  })
})
