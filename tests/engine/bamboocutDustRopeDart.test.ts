// Scoped to Bamboocut Dust (docs/TESTING.md § "Class scoping"): the class is
// registered, not validated, so nothing here asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { FPS } from "../../src/engine/timeline"
import { BUFF, PARAM } from "../../src/data/skills/buffs/ids"
import { ATTUNE, WEAPON } from "../../src/data/skills/ids"
import { DEBUFF, SKILL, STATUS } from "../../src/data/skills/bamboocut-dust/ids"
import { tokensOfGratitudeMeter } from "../../src/data/classes/bamboocut-dust/meters"
import placeholderRotation from "../../src/data/classes/bamboocut-dust/rotations/placeholder"
import { testRotation } from "../builtins"
import {
  DUST_CLASS,
  damageFramesOf,
  runDust,
  towlineSweepRank,
  windowFramesOf,
} from "../bamboocutDust"

type DustResult = ReturnType<typeof runDust>

const tokensAtStart = (result: DustResult, castIndex: number) =>
  result.casts![castIndex].meterLevels!.find((level) => level.id === tokensOfGratitudeMeter.id)!
    .amount

const damagingEventsOf = (result: DustResult, skillName: string) =>
  result.timeline!.filter((event) => event.skillName === skillName && event.damage > 0)

const ropeDartSkills = () =>
  builtinSkillsForClass(DUST_CLASS).filter((skill) => skill.tags?.includes(WEAPON.ropeDart))

describe("Soul Sweep", () => {
  it("lands three sweeps on frames 17, 54 and 76 of a 105-frame cast", () => {
    const result = runDust([SKILL.soulSweep, SKILL.ropeLightAttack])
    expect(damageFramesOf(result, "Soul Sweep")).toEqual([17, 54, 76])
    expect(Math.round(result.casts![1].timeSec * FPS)).toBe(105)
  })

  it("grants Soulbound on frame 9 and the readiness for Piercing Dart on frame 93", () => {
    const result = runDust([SKILL.soulSweep])
    expect(windowFramesOf(result, STATUS.soulbound)[0].start).toBe(9)
    expect(windowFramesOf(result, STATUS.piercingDartReady)[0].start).toBe(93)
  })

  it("restores 50 Tokens of Gratitude with Towline Sweep only", () => {
    const rotation = [
      SKILL.soulSweep,
      SKILL.piercingDartIII,
      SKILL.soulSweep,
      SKILL.ropeLightAttack,
    ]
    const withoutTowline = tokensAtStart(runDust(rotation), 3)
    const withTowline = tokensAtStart(runDust(rotation, towlineSweepRank(1)), 3)
    expect(withoutTowline).toBeLessThan(70)
    expect(withTowline - withoutTowline).toBeCloseTo(50, 1)
  })

  it("activates Jadeware and receives its own art's Additional Attack Up", () => {
    const soulSweep = ropeDartSkills().find((skill) => skill.id === SKILL.soulSweep)!
    expect(soulSweep.triggersBuffs).toContain(BUFF.jadeware)
    expect(soulSweep.receives).toContain(BUFF.unfetteredRopeDartAdditionalAttack)
    expect(soulSweep.receives).not.toContain(BUFF.battleAnthemChargedDamage)
    expect(soulSweep.tags).toContain(ATTUNE.unfetteredMartialArt)
  })
})

describe("Piercing Dart", () => {
  it("lands the first stage's sweeps after the charging stance", () => {
    const result = runDust([SKILL.piercingDartChargingStance, SKILL.piercingDartI])
    expect(damageFramesOf(result, "Piercing Dart I")).toEqual([33 + 8, 33 + 20, 33 + 32])
  })

  it("lands the second stage's five sweeps on frames 8, 20, 32, 52 and 63", () => {
    const result = runDust(
      [
        SKILL.piercingDartChargingStance,
        SKILL.piercingDartIII,
        SKILL.soulSweep,
        SKILL.piercingDartII,
      ],
      towlineSweepRank(1),
    )
    const sweepFrames = result
      .timeline!.filter(
        (event) =>
          event.skillName.startsWith("Piercing Dart II") &&
          !event.skillName.startsWith("Piercing Dart III") &&
          event.damage > 0,
      )
      .map((event) => event.frame)
    expect(sweepFrames.map((frame) => frame - sweepFrames[0])).toEqual([0, 12, 24, 44, 55])
  })

  it("pays 10 Tokens once, twice and three times across stages one, two and three", () => {
    const gainedByRelease = (
      rotation: string[],
      releaseIndex: number,
      cost: number,
      frames: number,
    ) => {
      const result = runDust(rotation, towlineSweepRank(1))
      const regenerated = (5 * frames) / FPS
      const spent = tokensAtStart(result, releaseIndex) - cost
      return Math.round(tokensAtStart(result, releaseIndex + 1) - spent - regenerated)
    }
    const stance = SKILL.piercingDartChargingStance
    const light = SKILL.ropeLightAttack
    expect(
      gainedByRelease(
        [stance, SKILL.piercingDartIII, stance, SKILL.piercingDartI, light],
        3,
        0,
        58,
      ),
    ).toBe(10)
    expect(
      gainedByRelease(
        [stance, SKILL.piercingDartIII, SKILL.soulSweep, SKILL.piercingDartII, light],
        3,
        50,
        71,
      ),
    ).toBe(20)
    expect(gainedByRelease([SKILL.soulSweep, SKILL.piercingDartIII, light], 1, 100, 124)).toBe(30)
  })

  it("lands the third stage's seven sweeps across its three groups", () => {
    const result = runDust([SKILL.soulSweep, SKILL.piercingDartIII])
    const sweepFrames = result
      .timeline!.filter(
        (event) => event.skillName.startsWith("Piercing Dart III") && event.damage > 0,
      )
      .map((event) => event.frame - 105)
    expect(sweepFrames).toEqual([8, 20, 32, 52, 64, 79, 113])
  })

  it("flags a release without the charging stance and a stage outside its Tokens range", () => {
    expect(runDust([SKILL.piercingDartI]).invalidStepIds).toHaveLength(1)
    expect(
      runDust([SKILL.piercingDartChargingStance, SKILL.piercingDartI]).invalidStepIds,
    ).toHaveLength(1)
    expect(
      runDust([SKILL.piercingDartChargingStance, SKILL.piercingDartIII]).invalidStepIds ?? [],
    ).toEqual([])
    const secondThirdStage = runDust([
      SKILL.soulSweep,
      SKILL.piercingDartIII,
      SKILL.piercingDartChargingStance,
      SKILL.piercingDartIII,
    ])
    expect(secondThirdStage.invalidStepIds).toHaveLength(1)
  })

  it("spends 100 Tokens on the third stage and regains 10 per sweep at most once every half second", () => {
    const result = runDust([SKILL.soulSweep, SKILL.piercingDartIII, SKILL.ropeLightAttack])
    const regeneratedDuringCast = (5 * 124) / FPS
    expect(tokensAtStart(result, 2)).toBeCloseTo(3 * 10 + regeneratedDuringCast, 1)
  })

  it("applies Soul Loss only on the release that consumed Soulbound", () => {
    const result = runDust([
      SKILL.soulSweep,
      SKILL.piercingDartIII,
      SKILL.piercingDartChargingStance,
      SKILL.piercingDartII,
    ])
    const soulLossStarts = windowFramesOf(result, DEBUFF.soulLoss).map((window) => window.start)
    const duringConsumingRelease = soulLossStarts.filter((frame) => frame > 105 && frame < 229)
    const duringLaterRelease = soulLossStarts.filter((frame) => frame >= 229 + 33)
    expect(duringConsumingRelease.length).toBeGreaterThanOrEqual(7)
    expect(duringLaterRelease).toEqual([])
  })

  it("applies two Soul Loss stacks a sweep with Towline Sweep, so a Soulbound release converts twice", () => {
    const result = runDust([SKILL.soulSweep, SKILL.piercingDartIII], towlineSweepRank(1))
    const conversions = new Set(
      windowFramesOf(result, DEBUFF.soulbreak).map((window) => window.start),
    )
    expect(conversions.size).toBe(2)
  })

  it("adds 5%, 10% and 15% to its three groups of sweeps from Towline Sweep rank 3", () => {
    const rotation = [SKILL.soulSweep, SKILL.piercingDartIII]
    const sweepDamage = (result: DustResult) =>
      result
        .timeline!.filter(
          (event) => event.skillName.startsWith("Piercing Dart III") && event.damage > 0,
        )
        .sort((left, right) => left.frame - right.frame)
        .map((event) => event.damage)
    const belowRankThree = sweepDamage(runDust(rotation, towlineSweepRank(2)))
    const gains = sweepDamage(runDust(rotation, towlineSweepRank(3))).map(
      (damage, index) => damage / belowRankThree[index],
    )
    expect(gains[0]).toBeGreaterThan(1.03)
    expect(gains[3]).toBeGreaterThan(gains[0])
    expect(gains[3]).toBeCloseTo(gains[4], 6)
    expect(gains[5]).toBeGreaterThan(gains[3])
    expect(gains[5]).toBeCloseTo(gains[6], 6)
  })

  it("receives Battle Anthem and the Charged Skill attunement on every group of sweeps", () => {
    const releases = ropeDartSkills().filter((skill) => skill.id.includes("piercing-dart-i"))
    expect(releases.length).toBeGreaterThanOrEqual(6)
    for (const skill of releases) {
      expect(skill.receives, skill.id).toContain(BUFF.battleAnthemChargedDamage)
      expect(skill.tags, skill.id).toContain(ATTUNE.unfetteredCharged)
    }
  })
})

describe("Burn and Bury", () => {
  it("deals nothing without Soul Loss or Soulbreak on the target", () => {
    expect(damagingEventsOf(runDust([SKILL.burnAndBury]), "Burn and Bury")).toEqual([])
  })

  it("hits on frame 32 with the boss ratio of 0.78 against Soul Loss and 1.3 against Soulbreak", () => {
    const soulLossOnly = damagingEventsOf(
      runDust([SKILL.soulSweep, SKILL.burnAndBury]),
      "Burn and Bury",
    )
    const soulbreak = damagingEventsOf(
      runDust([SKILL.soulSweep, SKILL.soulSweep, SKILL.soulSweep, SKILL.burnAndBury]),
      "Burn and Bury",
    )
    expect(soulLossOnly.map((event) => event.frame)).toEqual([105 + 32])
    const ratio = soulbreak[0].damage / soulLossOnly[0].damage
    expect(ratio).toBeGreaterThan(1.3 / 0.78)
    expect(ratio).toBeLessThan(2)
  })

  it("deals 15% more and always crits from Towline Sweep rank 6", () => {
    const rotation = [SKILL.soulSweep, SKILL.soulSweep, SKILL.soulSweep, SKILL.burnAndBury]
    const damageAt = (tier: number) =>
      damagingEventsOf(runDust(rotation, towlineSweepRank(tier)), "Burn and Bury")[0].damage
    expect(damageAt(6) / damageAt(5)).toBeGreaterThan(1.15)
  })
})

describe("the rope dart's basic attacks", () => {
  it("lands the light chain on its eight collider frames", () => {
    const result = runDust([SKILL.ropeLightAttack])
    expect(damageFramesOf(result, "Rope Dart - Light Attack (4-stage)")).toEqual([
      30, 62, 85, 112, 120, 128, 167, 189,
    ])
  })

  it("lands the sprint attack on its two collider frames", () => {
    const result = runDust([SKILL.ropeSprintAttack])
    expect(damageFramesOf(result, "Rope Dart - Sprint Attack")).toEqual([36, 56])
  })

  it("lands the dash skill on its two collider frames and receives no light-chain buff", () => {
    const result = runDust([SKILL.ropeDash])
    expect(damageFramesOf(result, "Rope Dart - Dash")).toEqual([36, 56])
    const dash = ropeDartSkills().find((skill) => skill.id === SKILL.ropeDash)!
    expect(dash.receives).toEqual([BUFF.unfetteredRopeDartAdditionalAttack])
  })

  it("performs the weapon change itself, so no direct swap precedes the Dual-Weapon Skill", () => {
    const result = runDust([SKILL.scarletSpin, SKILL.ropeDual])
    expect(result.casts!.map((cast) => cast.skillName)).toEqual([
      "Scarlet Spin",
      "Rope Dart (Dual-Weapon Skill)",
    ])
  })

  it("lands the Dual-Weapon Skill on frame 31", () => {
    const result = runDust([SKILL.ropeDual])
    expect(damageFramesOf(result, "Rope Dart (Dual-Weapon Skill)")).toEqual([31])
  })

  it("receives the Additional Attack Up of its own art on every damaging skill", () => {
    const damaging = ropeDartSkills().filter((skill) =>
      skill.hits.some((hit) => hit.physMultiplier > 0 || hit.attributeMultiplier > 0),
    )
    expect(damaging.length).toBeGreaterThanOrEqual(10)
    for (const skill of damaging)
      expect(skill.receives, skill.id).toContain(BUFF.unfetteredRopeDartAdditionalAttack)
  })
})

describe("the placeholder rotation", () => {
  it("runs on both arts without an illegal step, the Delicate Dreamwrought Bubbles included", () => {
    const result = runEngine({
      ...defaultInputs,
      classId: DUST_CLASS,
      buffParams: { [PARAM.phantomRally]: true, [`${PARAM.phantomRally}Tier`]: 6 },
      activeCustomRotation: testRotation(DUST_CLASS, {
        steps: placeholderRotation.steps.map((step) => makeStep(step)),
      }),
    })
    expect(result.invalidStepIds ?? []).toEqual([])
    expect(damagingEventsOf(result, "Burn and Bury")).toHaveLength(1)
  })
})
