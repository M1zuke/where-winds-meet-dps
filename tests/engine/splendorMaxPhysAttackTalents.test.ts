// Scoped to Bellstrike Splendor — see CLASSES.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { buffEngineWith, exhaustedFrom } from "../helpers/qiBars"
import { classDefinition } from "../../src/definitions/classes/registry"
import { defineBuff } from "../../src/definitions/skills/buffDef"
import { stat } from "../../src/engine/effects/effect"
import { makeSkill } from "../../src/engine/skill"

const splendorBuffDefs = () => classDefinition("bellstrikeSplendor")!.classBuffDefs
const RECEIVES = ["swordEnergyEnhancement", "swordEnergyHpDamage"]

const timedMaxPhysAttack = defineBuff({
  id: "test-timed-max-phys-attack",
  name: "Timed Max Physical Attack",
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  effects: [stat("phys.max", 400)],
})

function sumsAt(maxPhysAttack: number, extraMaxPhysAttack = 0, withTimedBuff = false) {
  const engine = buffEngineWith(
    { maxPhysAttack },
    withTimedBuff ? [timedMaxPhysAttack] : [],
    splendorBuffDefs(),
    exhaustedFrom(0, 30),
  )
  const result = engine.calculateDamageEffects(
    makeSkill("test", { name: "probe", receives: RECEIVES }),
    1,
    [],
    0,
    undefined,
    extraMaxPhysAttack,
  )
  const sum = (statKey: string) =>
    result.effects
      .filter((effect) => effect.statKey === statKey)
      .reduce((total, effect) => total + effect.amount, 0)
  return { affinityDamage: sum("affinityDamageBoost"), hpDamage: sum("allDamageBoost") }
}

describe("the Nameless Sword Max Physical Attack talents scale with the attack at the hit", () => {
  it("steps per whole 100 Max Physical Attack", () => {
    const { affinityDamage, hpDamage } = sumsAt(850)
    expect(affinityDamage).toBeCloseTo(8 * 0.012, 10)
    expect(hpDamage).toBeCloseTo(8 * 0.02, 10)
  })

  it("pays nothing below 100 Max Physical Attack", () => {
    const { affinityDamage, hpDamage } = sumsAt(99)
    expect(affinityDamage).toBe(0)
    expect(hpDamage).toBe(0)
  })

  it("caps the Affinity DMG at 1500 and the HP damage at 1000 Max Physical Attack", () => {
    expect(sumsAt(1000).hpDamage).toBeCloseTo(0.2, 10)
    expect(sumsAt(1499).affinityDamage).toBeCloseTo(14 * 0.012, 10)
    expect(sumsAt(1500).affinityDamage).toBeCloseTo(0.18, 10)
    const { affinityDamage, hpDamage } = sumsAt(5000)
    expect(affinityDamage).toBeCloseTo(0.18, 10)
    expect(hpDamage).toBeCloseTo(0.2, 10)
  })

  it("counts attribute effects active at the event and those the timeline passes in", () => {
    expect(sumsAt(450, 0, true).hpDamage).toBeCloseTo(8 * 0.02, 10)
    expect(sumsAt(850, 650).affinityDamage).toBeCloseTo(15 * 0.012, 10)
  })
})
