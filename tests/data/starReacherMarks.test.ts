// Scoped to the unvalidated Silkbind Jade class: wiring, not a damage anchor.
import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { buffDefsForClass } from "../../src/engine/buffs/data"
import { warmStartQiSchedule } from "../../src/engine/qiBar"
import { makeSkill } from "../../src/engine/skill"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { CAST, PROP } from "../../src/data/skills/ids"

const FPS = 60
const LAST_HIT_SEC = 0.55
const LINGERING_BONE_DELAY_SEC = 0.03
const MARK_GRANTS = [BUFF.lingeringBone, BUFF.starReacherSupreme, BUFF.starReacher]
const ANY_HIT = makeSkill("test", { name: "Any hit" })
const DIRECT_DOT_TICK = makeSkill("test", { name: "Tick", isDotTick: true })
const DRONE_TICK = makeSkill("test", { name: "Drone tick", tags: [PROP.isDrone] })

function engine(tier: number, breakSeconds?: [start: number, end: number]) {
  const result = new BuffEngine(
    { classId: "silkbindJade", starReacher: true, starReacherTier: tier },
    buffDefsForClass("silkbindJade"),
    [],
  )
  if (breakSeconds)
    result.attachQiSchedule(
      warmStartQiSchedule(
        [
          {
            startFrame: breakSeconds[0] * FPS,
            endFrame: breakSeconds[1] * FPS,
            immuneUntilFrame: breakSeconds[1] * FPS,
          },
        ],
        FPS,
      ),
    )
  return result
}

function applyMark(buffs: BuffEngine, castSec: number) {
  buffs.processSkillCast(CAST.fanSpecial, castSec, { lastHitSec: LAST_HIT_SEC }, false, MARK_GRANTS)
}

function droneRefresh(buffs: BuffEngine, tickSec: number) {
  buffs.triggerDeclaredBuffs(MARK_GRANTS, CAST.umbDroneTick20hit, tickSec, { isDrone: true })
}

const physicalAttackPercent = (buffs: BuffEngine, timeSec: number) =>
  buffs.calculateDamageEffects(ANY_HIT, timeSec).artBonuses.minPhysPctBonus ?? 0

describe("Star Reacher's Lingering Bone window", () => {
  it("opens with the mark, 0.03 s after the hit, for 12 s from rank 4", () => {
    const buffs = engine(6)
    applyMark(buffs, 10)
    const opens = 10 + LAST_HIT_SEC + LINGERING_BONE_DELAY_SEC
    expect(physicalAttackPercent(buffs, opens - 0.01)).toBe(0)
    expect(physicalAttackPercent(buffs, opens + 0.01)).toBeCloseTo(0.075)
    expect(physicalAttackPercent(buffs, opens + 11.9)).toBeCloseTo(0.075)
    expect(physicalAttackPercent(buffs, opens + 12.1)).toBe(0)
  })

  it("lasts 8 s below rank 4", () => {
    const buffs = engine(2)
    applyMark(buffs, 10)
    const opens = 10 + LAST_HIT_SEC + LINGERING_BONE_DELAY_SEC
    expect(physicalAttackPercent(buffs, opens + 7.9)).toBeCloseTo(0.075)
    expect(physicalAttackPercent(buffs, opens + 8.1)).toBe(0)
  })

  it("is +15% when the target's Qi is exhausted at the application, and replaces the plain window", () => {
    const buffs = engine(6, [20, 30])
    applyMark(buffs, 10)
    expect(physicalAttackPercent(buffs, 12)).toBeCloseTo(0.075)
    applyMark(buffs, 25)
    expect(physicalAttackPercent(buffs, 26)).toBeCloseTo(0.15)
    expect(physicalAttackPercent(buffs, 22.5)).toBeCloseTo(0.075)
  })

  it("blocks the plain window while the +15% one is up", () => {
    const buffs = engine(6, [20, 30])
    applyMark(buffs, 25)
    applyMark(buffs, 31)
    expect(physicalAttackPercent(buffs, 31.7)).toBeCloseTo(0.15)
    expect(physicalAttackPercent(buffs, 25 + LAST_HIT_SEC + 12.1)).toBe(0)
  })

  it("has no +15% window at rank 2", () => {
    const buffs = engine(2, [20, 30])
    applyMark(buffs, 25)
    expect(physicalAttackPercent(buffs, 26)).toBeCloseTo(0.075)
  })

  it("is refreshed by a floating umbrella projectile on a marked target, once per second", () => {
    const buffs = engine(6)
    applyMark(buffs, 10)
    droneRefresh(buffs, 15)
    droneRefresh(buffs, 15.5)
    expect(physicalAttackPercent(buffs, 26.9)).toBeCloseTo(0.075)
    expect(physicalAttackPercent(buffs, 27.1)).toBe(0)
    droneRefresh(buffs, 16)
    expect(physicalAttackPercent(buffs, 27.9)).toBeCloseTo(0.075)
  })

  it("is not opened by a floating umbrella projectile on an unmarked target", () => {
    const buffs = engine(6)
    droneRefresh(buffs, 15)
    expect(physicalAttackPercent(buffs, 16)).toBe(0)
  })
})

describe("Star Reacher's marked-target bonus", () => {
  const marked = (buffs: BuffEngine, skill: typeof ANY_HIT, timeSec: number) =>
    buffs
      .calculateDamageEffects(skill, timeSec)
      .effects.filter((effect) => effect.statKey === "allDamageBoost")
      .reduce((sum, effect) => sum + effect.amount, 0)

  it("adds 3% on direct hits while the mark is up, from rank 6", () => {
    const buffs = engine(6)
    applyMark(buffs, 10)
    expect(marked(buffs, ANY_HIT, 12)).toBeCloseTo(0.03)
    expect(marked(buffs, ANY_HIT, 17)).toBe(0)
  })

  it("reaches a floating umbrella projectile but not another damage-over-time tick", () => {
    const buffs = engine(6)
    applyMark(buffs, 10)
    expect(marked(buffs, DRONE_TICK, 12)).toBeCloseTo(0.03)
    expect(marked(buffs, DIRECT_DOT_TICK, 12)).toBe(0)
  })

  it("is absent below rank 6", () => {
    const buffs = engine(5)
    applyMark(buffs, 10)
    expect(marked(buffs, ANY_HIT, 12)).toBe(0)
  })
})
