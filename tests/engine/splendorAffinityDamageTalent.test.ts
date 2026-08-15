// Scoped to Bellstrike Splendor — see CLASSES.md § "Implemented classes". The
// Nameless Spear talent grants one Affinity DMG bonus behind two conditions,
// and the engine models each condition as its own buff, so the pair has to be
// asserted together or nothing notices them adding up.
import { describe, expect, it } from "vitest"
import { belowSixtyEndurance } from "../../src/data/skills/bellstrike-splendor/buffs/belowSixtyEndurance"
import { endlessGale } from "../../src/data/skills/bellstrike-splendor/buffs/endlessGale"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { buffDefsForClass } from "../../src/engine/buffs/data"
import { builtinSkill } from "../builtins"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"

const CLASS = "bellstrikeSplendor"

const enduranceEffectsWith = (active: string[]) => {
  const effects = belowSixtyEndurance.effects
  if (typeof effects !== "function") throw new Error("expected a context-dependent effect list")
  return effects({ status: { isActive: (id: string) => active.includes(id) } } as never)
}

describe("the Nameless Spear Affinity DMG talent pays out once", () => {
  it("grants the bonus from the endurance condition alone", () => {
    expect(enduranceEffectsWith([])).toEqual([
      { kind: "stat", statKey: "affinityDamageBoost", amount: 0.18 },
    ])
  })

  it("stands down while Endless Gale is the condition being met", () => {
    expect(enduranceEffectsWith([BUFF.endlessGale])).toEqual([])
  })

  it("is the same bonus on both sides, so neither can drift from the other", () => {
    expect(endlessGale.effects).toEqual(enduranceEffectsWith([]))
  })

  it("adds up to one bonus with both the window open and the toggle on", () => {
    const engine = new BuffEngine({ classId: CLASS, lowEndurance: true }, buffDefsForClass(CLASS))
    engine.triggerDeclaredBuffs([BUFF.endlessGale], "cast:spearQ", 1)
    const contribution = (buffId: string, time: number) =>
      engine.calculateDamageEffects(builtinSkill(CLASS, SKILL.swordq), time).breakdown[buffId] ?? 0

    expect(
      contribution(BUFF.endlessGale, 2) + contribution(BUFF.belowSixtyEndurance, 2),
    ).toBeCloseTo(0.18, 10)
    expect(contribution(BUFF.belowSixtyEndurance, 20)).toBeCloseTo(0.18, 10)
  })
})
