// Scoped to Silkbind Jade metadata and buff gating; not a measured DPS anchor.
import { describe, expect, it } from "vitest"
import type { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { buffEngineWith, exhaustedFrom } from "../helpers/qiBars"
import { blossomBarrage } from "../../src/data/innerWays/blossomBarrage"
import { SKILLS } from "../../src/data/skills/silkbind-jade"
import { DEBUFFS } from "../../src/data/skills/silkbind-jade/debuffs"
import { DEBUFF, SKILL } from "../../src/data/skills/silkbind-jade/ids"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { PROP } from "../../src/data/skills/ids"
import { dotTickSkill, tickSourceSkillId } from "../../src/engine/dot"
import { QiBar } from "../../src/engine/qiBar"
import type { Skill } from "../../src/engine/skill"
import { CombatResource } from "../../src/engine/resources"
import { blossomResource } from "../../src/data/classes/silkbind-jade/blossoms"

const FPS = 60

const JITTERED_EXTENSION_DEFS = (blossomBarrage.buffDefs ?? []).map((def) =>
  def.id === BUFF.comboExtendMark && def.extendsBuffs
    ? {
        ...def,
        extendsBuffs: {
          ...def.extendsBuffs,
          lateness: { property: PROP.isDrone, maxSec: 0.005 },
        },
      }
    : def,
)

describe("Blossom Barrage Global 2.0 PvE", () => {
  const charged = SKILLS.find((skill) => skill.id === "silkbindJade-umblightcharge")!
  const drone = SKILLS.find((skill) => skill.id === "silkbindJade-umbdrone-20hit")!
  function engine(tier: number, marked = true, setupTime = 0) {
    const result = buffEngineWith(
      { blossomBarrage: true, blossomBarrageTier: tier },
      blossomBarrage.buffDefs ?? [],
      [],
      exhaustedFrom(5, 5),
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

  function engine(tier: number, comboAppliedAt = 0, breakDurationSec = 5, jittered = false) {
    const result = buffEngineWith(
      { blossomBarrage: true, blossomBarrageTier: tier },
      jittered ? JITTERED_EXTENSION_DEFS : (blossomBarrage.buffDefs ?? []),
      [],
      exhaustedFrom(5, breakDurationSec),
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

  it("lets a 6-bullet Spring Away extend Combo on bullets 1 and 4 on the exact cue grid", () => {
    expect(bulletsThatExtend(SIX_BULLET_CAST, 6)).toEqual([true, false, false, true, false, false])
  })

  it("lets a 12-bullet Spring Away extend Combo on bullets 1, 4, 7 and 10 on the exact cue grid", () => {
    expect(
      bulletsThatExtend(TWELVE_BULLET_CAST, 6).flatMap((extends_, index) =>
        extends_ ? [index + 1] : [],
      ),
    ).toEqual([1, 4, 7, 10])
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
    const bar = new QiBar(
      { max: 100, refill: 100, breakSec: 5, directImmunitySec: 0, takenIndex: 1 },
      FPS,
    )
    emptying.attachQiReader(bar)
    strike(emptying, SIX_BULLET_CAST, 5)
    bar.apply(5 * FPS, 100, "direct")
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
    const buffs = engine(4, 0, 30, true)
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

describe("Blossoms across Combo - Extend Mark outcomes", () => {
  const SPRING_SORROW = SKILLS.find((skill) => skill.id === SKILL.umbq)!
  const OPENING = 10
  const SPRING_SORROW_BASE_GAIN = 20
  const TIER_SIX_GAIN = 25

  function extendedByDroneRuns() {
    const buffs = buffEngineWith(
      { blossomBarrage: true, blossomBarrageTier: 4 },
      JITTERED_EXTENSION_DEFS,
      [],
      exhaustedFrom(5, 30),
    )
    buffs.processSkillCast("setup", 0, { castTime: 0 }, false, [
      BUFF.combo,
      BUFF.comboUmbLightBonus,
      BUFF.comboSpringAwayBonus,
    ])
    const droneDebuff = DEBUFFS.find((candidate) => candidate.id === DEBUFF.umbdrone)!
    const droneSkill = dotTickSkill(
      droneDebuff,
      SKILLS.find((skill) => skill.id === tickSourceSkillId(droneDebuff)),
    )
    for (let run = 0; run < 10; run++)
      buffs.processDamagingEvent({
        skill: droneSkill,
        timeSec: 12 + run * 0.5,
        runKey: `run-${run}`,
      })
    return buffs
  }

  function partiallyLiveFrame(buffs: BuffEngine): number {
    for (let frame = 15 * FPS; frame < 35 * FPS; frame++)
      if (
        buffs.liveFraction(BUFF.combo, (frame - 1) / FPS) > 0.2 &&
        buffs.liveFraction(BUFF.combo, (frame - 1) / FPS) < 0.8
      )
        return frame
    throw new Error("no frame with a partial Combo share")
  }

  function resourceReading(buffs: BuffEngine) {
    return new CombatResource(
      blossomResource,
      { opening: OPENING },
      {
        fps: FPS,
        startFrame: 0,
        collect: true,
        particleCount: buffs.extensionParticleCount,
        buffLive: (id, frame) => buffs.liveParticles(id, frame / FPS),
        exhausted: () => false,
        paramTier: () => 6,
      },
    )
  }

  it("credits the Tier 6 gain in exactly the trajectories where Combo is live", () => {
    const buffs = extendedByDroneRuns()
    const springSorrowFrame = partiallyLiveFrame(buffs)
    const share = buffs.liveFraction(BUFF.combo, (springSorrowFrame - 1) / FPS)
    const resource = resourceReading(buffs)
    resource.hit(SPRING_SORROW, springSorrowFrame)
    const regenerated =
      OPENING + SPRING_SORROW_BASE_GAIN + (blossomResource.regenPerSecond * springSorrowFrame) / FPS
    expect(resource.result.samples.at(-1)!.amount).toBeCloseTo(
      regenerated + TIER_SIX_GAIN * share,
      6,
    )
  })

  it("launches the drone only where the credited balance reaches the minimum, and scales its ticks by that share", () => {
    const buffs = extendedByDroneRuns()
    const springSorrowFrame = partiallyLiveFrame(buffs)
    const share = buffs.liveFraction(BUFF.combo, (springSorrowFrame - 1) / FPS)
    const resource = resourceReading(buffs)
    resource.hit(SPRING_SORROW, springSorrowFrame)
    const launchFrame = springSorrowFrame + 10
    expect(resource.launch(launchFrame)).toBeCloseTo(share, 10)
    const tick = resource.tick(launchFrame + 30, launchFrame)
    expect(tick.share).toBeCloseTo(share, 10)
    expect([...tick.particles!]).toEqual([
      ...(buffs.liveParticles(BUFF.combo, (springSorrowFrame - 1) / FPS) as Uint8Array),
    ])
  })

  it("keeps the extension trajectories of the inactive drone out of the cooldown", () => {
    const buffs = extendedByDroneRuns()
    const mask = new Uint8Array(buffs.extensionParticleCount)
    const droneDebuff = DEBUFFS.find((candidate) => candidate.id === DEBUFF.umbdrone)!
    const droneSkill = dotTickSkill(
      droneDebuff,
      SKILLS.find((skill) => skill.id === tickSourceSkillId(droneDebuff)),
    )
    const before = buffs.liveFraction(BUFF.combo, 40)
    buffs.processDamagingEvent({
      skill: droneSkill,
      timeSec: 14,
      runKey: "masked",
      particles: mask,
    })
    expect(buffs.liveFraction(BUFF.combo, 40)).toBe(before)
  })
})
