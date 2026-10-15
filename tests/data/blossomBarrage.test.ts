// Scoped to Silkbind Jade metadata and buff gating; not a measured DPS anchor.
import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { blossomBarrage } from "../../src/data/innerWays/blossomBarrage"
import { SKILLS } from "../../src/data/skills/silkbind-jade"
import { DEBUFFS } from "../../src/data/skills/silkbind-jade/debuffs"
import { DEBUFF, SKILL } from "../../src/data/skills/silkbind-jade/ids"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { PROP } from "../../src/data/skills/ids"
import { dotTickSkill, tickSourceSkillId } from "../../src/engine/dot"
import { warmStartQiSchedule } from "../../src/engine/qiBar"
import type { Skill } from "../../src/engine/skill"

const FPS = 60

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
  const SIX_BULLET_CAST = SKILLS.find((skill) => skill.id === SKILL.umblightcharge)!
  const TWELVE_BULLET_CAST = SKILLS.find((skill) => skill.id === SKILL.umblightcharge12)!
  const droneTickSkill = (() => {
    const debuff = DEBUFFS.find((candidate) => candidate.id === DEBUFF.umbdrone)!
    const source = SKILLS.find((skill) => skill.id === tickSourceSkillId(debuff))
    return dotTickSkill(debuff, source)
  })()

  function engine(tier: number, comboAppliedAt = 0, breakDurationSec = 5) {
    const result = new BuffEngine(
      {
        blossomBarrage: true,
        blossomBarrageTier: tier,
        qiBreakTime: 5,
        bossBreakDuration: breakDurationSec,
      },
      blossomBarrage.buffDefs ?? [],
    )
    result.processSkillCast("setup", comboAppliedAt, { castTime: 0 }, false, EXTENSION_BUFF_IDS)
    return result
  }

  const strike = (buffs: BuffEngine, skill: Skill, timeSec: number, runKey?: string) =>
    buffs.processDamagingEvent({ skill, timeSec, runKey })

  function comboExpiry(buffs: BuffEngine): number {
    let time = COMBO_LIFETIME_SEC - 5
    while (buffs.liveFraction(BUFF.combo, time) > 0) time += 0.05
    return time
  }

  function bulletsThatExtend(cast: Skill, castStartSec: number): boolean[] {
    const buffs = engine(4)
    return cast.hits.map((bullet) => {
      const before = comboExpiry(buffs)
      strike(buffs, cast, castStartSec + bullet.frame / FPS)
      return comboExpiry(buffs) - before > 0.5
    })
  }

  it("lets a 6-bullet Spring Away extend Combo on bullets 1 and 5 only", () => {
    expect(bulletsThatExtend(SIX_BULLET_CAST, 6)).toEqual([true, false, false, false, true, false])
  })

  it("lets a 12-bullet Spring Away extend Combo on bullets 1, 5 and 9 only", () => {
    expect(bulletsThatExtend(TWELVE_BULLET_CAST, 6)).toEqual([
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
    ])
  })

  it("adds 1 s to every Combo window while the target is Exhausted", () => {
    const buffs = engine(4)
    strike(buffs, SIX_BULLET_CAST, 6)
    for (const id of EXTENSION_BUFF_IDS) {
      expect(buffs.liveFraction(id, COMBO_LIFETIME_SEC + 0.5), id).toBe(1)
      expect(buffs.liveFraction(id, COMBO_LIFETIME_SEC + 1.5), id).toBe(0)
    }
  })

  it("does nothing outside Exhaustion", () => {
    const buffs = engine(4)
    strike(buffs, SIX_BULLET_CAST, 1)
    expect(buffs.liveFraction(BUFF.combo, COMBO_LIFETIME_SEC + 0.5)).toBe(0)
  })

  it("does not extend on the hit that empties the Qi bar, but does on the next qualifying hit", () => {
    const emptying = engine(4)
    emptying.attachQiSchedule(
      warmStartQiSchedule(
        [{ startFrame: 5 * FPS, endFrame: 10 * FPS, immuneUntilFrame: 10 * FPS }],
        FPS,
      ),
    )
    strike(emptying, SIX_BULLET_CAST, 5)
    expect(emptying.liveFraction(BUFF.combo, COMBO_LIFETIME_SEC + 0.5)).toBe(0)
    strike(emptying, SIX_BULLET_CAST, 5.1)
    expect(emptying.liveFraction(BUFF.combo, COMBO_LIFETIME_SEC + 0.5)).toBe(1)
  })

  it("shares one 0.5 s cooldown between Spring Away bullets and floating umbrella bullets", () => {
    const springFirst = engine(4)
    strike(springFirst, SIX_BULLET_CAST, 6)
    strike(springFirst, droneTickSkill, 6.3, "run-a")
    expect(comboExpiry(springFirst)).toBeCloseTo(COMBO_LIFETIME_SEC + 1, 1)
    strike(springFirst, droneTickSkill, 6.6, "run-b")
    expect(comboExpiry(springFirst)).toBeCloseTo(COMBO_LIFETIME_SEC + 2, 1)

    const droneFirst = engine(4)
    strike(droneFirst, droneTickSkill, 6, "run-a")
    strike(droneFirst, SIX_BULLET_CAST, 6.3)
    expect(comboExpiry(droneFirst)).toBeCloseTo(COMBO_LIFETIME_SEC + 1, 1)
    strike(droneFirst, SIX_BULLET_CAST, 6.6)
    expect(comboExpiry(droneFirst)).toBeCloseTo(COMBO_LIFETIME_SEC + 2, 1)
  })

  it("does not arm the cooldown on a hit that fails a condition", () => {
    const buffs = engine(4)
    strike(buffs, SIX_BULLET_CAST, 4.9)
    strike(buffs, SIX_BULLET_CAST, 5.2)
    expect(comboExpiry(buffs)).toBeCloseTo(COMBO_LIFETIME_SEC + 1, 1)
  })

  it("leaves a Combo of 15 s or more alone, yet still arms the cooldown", () => {
    const buffs = engine(4, 6)
    strike(buffs, SIX_BULLET_CAST, 6)
    expect(comboExpiry(buffs)).toBeCloseTo(6 + COMBO_LIFETIME_SEC, 1)
    strike(buffs, SIX_BULLET_CAST, 6.3)
    expect(comboExpiry(buffs)).toBeCloseTo(6 + COMBO_LIFETIME_SEC, 1)
    strike(buffs, SIX_BULLET_CAST, 6.6)
    expect(comboExpiry(buffs)).toBeCloseTo(6 + COMBO_LIFETIME_SEC + 0.6, 1)
  })

  it("never revives a lapsed Combo", () => {
    const buffs = engine(4, 0, 40)
    strike(buffs, SIX_BULLET_CAST, 21)
    expect(buffs.liveFraction(BUFF.combo, 21.5)).toBe(0)
  })

  it("never extends below Tier 4", () => {
    const buffs = engine(3)
    strike(buffs, SIX_BULLET_CAST, 6)
    expect(buffs.liveFraction(BUFF.combo, COMBO_LIFETIME_SEC + 0.5)).toBe(0)
  })

  it("is received by every Spring Away bullet and every drone tick, and by nothing else", () => {
    const receivingSkills = SKILLS.filter((skill) => skill.receives?.includes(BUFF.comboExtendMark))
    expect(receivingSkills.map((skill) => skill.id).sort()).toEqual([
      SKILL.umblightcharge,
      SKILL.umblightcharge12,
    ])
    const droneDebuffs = DEBUFFS.filter((debuff) => debuff.id.includes("umbdrone"))
    expect(droneDebuffs).toHaveLength(6)
    for (const debuff of droneDebuffs)
      expect(debuff.receives, debuff.id).toContain(BUFF.comboExtendMark)
    expect(
      [...SKILLS, ...DEBUFFS].filter((entry) =>
        entry.triggersBuffs?.includes(BUFF.comboExtendMark),
      ),
    ).toEqual([])
  })

  it("scores a window that is live only in some outcomes at its live share", () => {
    const buffs = engine(4, 0, 30)
    for (let run = 0; run < 10; run++) strike(buffs, droneTickSkill, 12 + run * 0.5, `run-${run}`)
    let partialTime: number | null = null
    for (let time = COMBO_LIFETIME_SEC; time < COMBO_LIFETIME_SEC + 20; time += 0.05) {
      const fraction = buffs.liveFraction(BUFF.combo, time)
      if (fraction > 0.2 && fraction < 0.8) partialTime = time
    }
    expect(partialTime).not.toBeNull()
    const fraction = buffs.liveFraction(BUFF.combo, partialTime!)
    const scored = buffs.calculateDamageEffects(droneTickSkill, partialTime!)
    expect(scored.breakdown[BUFF.combo]).toBeCloseTo(0.2 * fraction, 10)
  })
})
