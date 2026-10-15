// Scoped to Silkbind Jade metadata and buff gating; not a measured DPS anchor.
import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { blossomBarrage } from "../../src/data/innerWays/blossomBarrage"
import { SKILLS } from "../../src/data/skills/silkbind-jade"
import { DEBUFFS } from "../../src/data/skills/silkbind-jade/debuffs"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { PROP } from "../../src/data/skills/ids"

describe("Blossom Barrage Global 2.0 PvE", () => {
  const charged = SKILLS.find((skill) => skill.id === "silkbindJade-umblightcharge")!
  const drone = SKILLS.find((skill) => skill.id === "silkbindJade-umbdrone-20hit")!
  function engine(tier: number, marked = true, setupTime = 0) {
    const result = new BuffEngine(
      { blossomBarrage: true, blossomBarrageTier: tier, qiBreakTime: 5, bossBreakDuration: 5 },
      blossomBarrage.buffDefs ?? [],
    )
    result.processSkillCast(
      "setup",
      setupTime,
      {},
      false,
      marked
        ? [BUFF.combo, BUFF.comboUmbLightBonus, BUFF.comboSpringAwayBonus]
        : [BUFF.comboUmbLightBonus, BUFF.comboSpringAwayBonus],
    )
    return result
  }
  it("grants the drone 5% outside Exhaustion and 10% during Exhaustion", () => {
    const buffs = engine(4)
    expect(buffs.calculateDamageEffects(drone, 1).effects).toContainEqual({
      statKey: "allDamageBoost",
      amount: 0.05,
    })
    expect(buffs.calculateDamageEffects(drone, 6).effects).toContainEqual({
      statKey: "allDamageBoost",
      amount: 0.1,
    })
  })
  it("grants Spring Away 5% outside Exhaustion and 10% during Exhaustion", () => {
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
      expect(buffs.calculateDamageEffects(drone, 6).effects).not.toContainEqual({
        statKey: "allDamageBoost",
        amount: 0.1,
      })
    }
  })
  it("reaches every drone variant, and Spring Away separately", () => {
    const drones = SKILLS.filter((skill) => skill.tags?.includes(PROP.isDrone))
    expect(drones).toHaveLength(6)
    for (const skill of drones) expect(skill.receives).toContain(BUFF.comboUmbLightBonus)
    expect(charged.receives).toContain(BUFF.comboSpringAwayBonus)
    expect(charged.receives).not.toContain(BUFF.comboUmbLightBonus)
  })
})

describe("Blossom Barrage Combo - Extend Mark", () => {
  const COMBO_LIFETIME_SEC = 15
  const EXTENSION_BUFF_IDS = [BUFF.combo, BUFF.comboUmbLightBonus, BUFF.comboSpringAwayBonus]

  function engine(tier: number, setupTime = 0) {
    const result = new BuffEngine(
      { blossomBarrage: true, blossomBarrageTier: tier, qiBreakTime: 5, bossBreakDuration: 5 },
      blossomBarrage.buffDefs ?? [],
    )
    result.processSkillCast("setup", setupTime, { castTime: 0 }, false, EXTENSION_BUFF_IDS)
    return result
  }

  function extend(buffs: BuffEngine, time: number): void {
    buffs.triggerDeclaredBuffs([BUFF.comboExtendMark], "springAway", time)
  }

  it("adds 1 s to every Combo window while the target is Exhausted", () => {
    const buffs = engine(4)
    extend(buffs, 6)
    for (const id of EXTENSION_BUFF_IDS) {
      expect(buffs.isBuffActiveAtTime(id, COMBO_LIFETIME_SEC + 0.5), id).toBe(true)
      expect(buffs.isBuffActiveAtTime(id, COMBO_LIFETIME_SEC + 1.5), id).toBe(false)
    }
  })

  it("does nothing outside Exhaustion", () => {
    const buffs = engine(4)
    extend(buffs, 1)
    expect(buffs.isBuffActiveAtTime(BUFF.combo, COMBO_LIFETIME_SEC + 0.5)).toBe(false)
  })

  it("waits 0.5 s between extensions", () => {
    const buffs = engine(4)
    extend(buffs, 6)
    extend(buffs, 6.25)
    extend(buffs, 6.5)
    expect(buffs.isBuffActiveAtTime(BUFF.combo, COMBO_LIFETIME_SEC + 1.5)).toBe(true)
    expect(buffs.isBuffActiveAtTime(BUFF.combo, COMBO_LIFETIME_SEC + 2.5)).toBe(false)
  })

  it("never leaves more than 15 s of Combo", () => {
    const buffs = engine(4, 6)
    extend(buffs, 6)
    expect(buffs.isBuffActiveAtTime(BUFF.combo, 6 + COMBO_LIFETIME_SEC + 0.5)).toBe(false)
  })

  it("never revives a lapsed Combo", () => {
    const buffs = new BuffEngine(
      { blossomBarrage: true, blossomBarrageTier: 4, qiBreakTime: 20, bossBreakDuration: 5 },
      blossomBarrage.buffDefs ?? [],
    )
    buffs.processSkillCast("setup", 0, { castTime: 0 }, false, EXTENSION_BUFF_IDS)
    extend(buffs, 21)
    expect(buffs.isBuffActiveAtTime(BUFF.combo, 21.5)).toBe(false)
    expect(buffs.isBuffActiveAtTime(BUFF.comboExtendMark, 21.5)).toBe(false)
  })

  it("needs Blossom Barrage Tier 4", () => {
    const buffs = engine(2)
    extend(buffs, 6)
    expect(buffs.isBuffActiveAtTime(BUFF.combo, COMBO_LIFETIME_SEC + 0.5)).toBe(false)
  })

  it("is granted by Spring Away and by every drone variant", () => {
    const springAway = SKILLS.filter((skill) => skill.tags?.includes(PROP.isCharged))
    expect(springAway.length).toBeGreaterThan(0)
    const declaring = SKILLS.filter((skill) => skill.triggersBuffs?.includes(BUFF.comboExtendMark))
    expect(declaring.map((skill) => skill.id).sort()).toEqual([
      "silkbindJade-umblightcharge",
      "silkbindJade-umblightcharge-12",
    ])
    const droneDebuffs = DEBUFFS.filter((debuff) => debuff.id.includes("umbdrone"))
    expect(droneDebuffs).toHaveLength(6)
    for (const debuff of droneDebuffs)
      expect(debuff.triggersBuffs, debuff.id).toContain(BUFF.comboExtendMark)
  })
})
