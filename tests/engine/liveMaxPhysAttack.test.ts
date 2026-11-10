import { describe, expect, it } from "vitest"
import { buffEngineWith } from "../helpers/qiBars"
import { classDefinition } from "../../src/definitions/classes/registry"
import { defineBuff } from "../../src/definitions/skills/buffDef"
import { stat } from "../../src/engine/effects/effect"
import { makeSkill } from "../../src/engine/skill"

const umbraBuffDefs = () => classDefinition("bellstrikeUmbra")!.classBuffDefs
const RECEIVES = ["bellstrikeUmbraBleedPen", "bellstrikeUmbraBleedingDamage"]
const BASE_MAX_PHYS_ATTACK = 850

const timedMaxPhysAttack = defineBuff({
  id: "test-timed-max-phys-attack",
  name: "Timed Max Physical Attack",
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  effects: [stat("phys.max", 400)],
})

function sumsAt(extraMaxPhysAttack: number, withTimedBuff: boolean) {
  const engine = buffEngineWith(
    { maxPhysAttack: BASE_MAX_PHYS_ATTACK },
    withTimedBuff ? [timedMaxPhysAttack] : [],
    umbraBuffDefs(),
  )
  const result = engine.calculateDamageEffects(
    makeSkill("test", { name: "probe", receives: RECEIVES }),
    0,
    [],
    0,
    undefined,
    extraMaxPhysAttack,
  )
  const sum = (statKey: string) =>
    result.effects
      .filter((effect) => effect.statKey === statKey)
      .reduce((total, effect) => total + effect.amount, 0)
  return { penetration: sum("phys.penetration"), affinityDamage: sum("affinityDamageBoost") }
}

describe("bleed talents read the attacker's live max physical attack", () => {
  it("uses the panel value when nothing else changes it", () => {
    const { penetration, affinityDamage } = sumsAt(0, false)
    expect(penetration).toBeCloseTo(0.08, 10)
    expect(affinityDamage).toBeCloseTo(0.096, 10)
  })

  it("counts an attribute effect on max physical attack active at the event", () => {
    const { penetration, affinityDamage } = sumsAt(0, true)
    expect(penetration).toBeCloseTo(0.12, 10)
    expect(affinityDamage).toBeCloseTo(0.144, 10)
  })

  it("counts attribute effects the timeline passes in from its own state", () => {
    const { penetration, affinityDamage } = sumsAt(650, false)
    expect(penetration).toBeCloseTo(0.15, 10)
    expect(affinityDamage).toBeCloseTo(0.18, 10)
  })

  it("stops at the penetration and affinity-damage caps", () => {
    const { penetration, affinityDamage } = sumsAt(5000, true)
    expect(penetration).toBeCloseTo(0.15, 10)
    expect(affinityDamage).toBeCloseTo(0.18, 10)
  })
})
