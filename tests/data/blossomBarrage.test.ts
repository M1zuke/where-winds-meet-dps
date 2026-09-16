// Scoped to Silkbind Jade metadata and buff gating; not a measured DPS anchor.
import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { blossomBarrage } from "../../src/data/innerWays/blossomBarrage"
import { SKILLS } from "../../src/data/skills/silkbind-jade"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { PROP } from "../../src/data/skills/ids"

describe("Blossom Barrage Global 2.0 PvE", () => {
  const charged = SKILLS.find((skill) => skill.id === "silkbindJade-umblightcharge")!
  function engine(tier: number, marked = true) {
    const result = new BuffEngine(
      { blossomBarrage: true, blossomBarrageTier: tier, qiBreakTime: 5, bossBreakDuration: 5 },
      blossomBarrage.buffDefs ?? [],
    )
    result.processSkillCast(
      "setup",
      0,
      {},
      false,
      marked ? [BUFF.combo, BUFF.comboUmbLightBonus] : [BUFF.comboUmbLightBonus],
    )
    return result
  }
  it("applies the sourced 5% outside Exhaustion and 10% during Exhaustion", () => {
    const buffs = engine(4)
    expect(buffs.calculateDamageEffects(charged, 1).effects).toContainEqual({
      statKey: "allDamageBoost",
      amount: 0.05,
    })
    expect(buffs.calculateDamageEffects(charged, 6).effects).toContainEqual({
      statKey: "allDamageBoost",
      amount: 0.1,
    })
  })
  it("requires Tier 4 and the caster's Combo mark", () => {
    for (const buffs of [engine(2), engine(4, false)]) {
      expect(buffs.calculateDamageEffects(charged, 1).effects).not.toContainEqual({
        statKey: "allDamageBoost",
        amount: 0.05,
      })
    }
  })
  it("reaches every drone variant as well as Spring Away", () => {
    const drones = SKILLS.filter((skill) => skill.tags?.includes(PROP.isDrone))
    expect(drones).toHaveLength(6)
    for (const skill of [charged, ...drones])
      expect(skill.receives).toContain(BUFF.comboUmbLightBonus)
  })
})
