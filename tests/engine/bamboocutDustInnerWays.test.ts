// Scoped to Bamboocut Dust's own inner ways and the shared content that reaches
// its skills (docs/TESTING.md § "Class scoping"): the class is registered, not
// validated, so nothing here asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs, emptyMindMethod } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { makeStep } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"
import { getMindMethodContributions } from "../../src/definitions/baseStats"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"
import { INNER_WAY_LADDERS } from "../../src/data/innerWays/breakthroughLadders"
import { PASSIVE_ID_TO_INNER_WAY } from "../../src/data/innerWays/passiveIds"
import { bamboocutDust } from "../../src/data/classes/bamboocut-dust"
import { tokensOfGratitudeMeter } from "../../src/data/classes/bamboocut-dust/meters"
import minBuild from "../../src/data/classes/bamboocut-dust/graduationBuilds/minBuild"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { ROLE } from "../../src/data/skills/ids"
import { DEBUFF, SKILL, STATUS } from "../../src/data/skills/bamboocut-dust/ids"
import { testRotation } from "../builtins"
import { DUST_CLASS, runDust, stacksAfterCast, windowFramesOf } from "../bamboocutDust"

type DustResult = ReturnType<typeof runDust>

function slotted(innerWayId: string, tier: number): Inputs["mindMethods"] {
  return [
    { id: innerWayId, name: innerWayId, stacks: `tier ${tier}` },
    emptyMindMethod,
    emptyMindMethod,
    emptyMindMethod,
  ] as Inputs["mindMethods"]
}

function contributions(innerWayId: string, tier: number, breakthrough = 17) {
  return getMindMethodContributions({
    ...defaultInputs,
    classId: DUST_CLASS,
    breakthrough,
    mindMethods: slotted(innerWayId, tier),
  })
}

function runSlotted(
  skillIds: string[],
  mindMethods: Inputs["mindMethods"],
  overrides: Partial<Inputs> = {},
) {
  return runEngine(
    withDerivedStats({
      ...defaultInputs,
      classId: DUST_CLASS,
      mindMethods,
      ...overrides,
      activeCustomRotation: testRotation(DUST_CLASS, {
        steps: skillIds.map((skillId) => makeStep({ skillId })),
      }),
    }),
  )
}

const rank = (param: string, tier: number) => ({ [param]: true, [`${param}Tier`]: tier })

const damagingEvents = (result: DustResult, skillName: string) =>
  result.timeline!.filter((event) => event.skillName === skillName && event.damage > 0)

const damageOf = (result: DustResult, skillName: string, index = 0) =>
  damagingEvents(result, skillName)[index].damage

const UMBRELLA_LIGHT_NAME = "Umbrella - Light Attack (3-stage)"
const ROPE_LIGHT_NAME = "Rope Dart - Light Attack (4-stage)"
const RESONANCE_NAME = "Resonance (Martial Art Skill)"
const THIRD_CATCH_NAME = "Perfect Catch (after 3rd throw)"
const SECOND_CATCH_NAME = "Perfect Catch (after 2nd throw)"

const THROW_CHAIN = [
  SKILL.scarletSpin,
  SKILL.perfectCatchAfterFirst,
  SKILL.perfectCatchAfterSecond,
  SKILL.perfectCatchAfterThird,
]

const dustSkills = () => builtinSkillsForClass(DUST_CLASS)
const skillsReceiving = (buffId: string) =>
  dustSkills()
    .filter((skill) => skill.receives?.includes(buffId))
    .map((skill) => skill.id)
    .sort()
const idsOf = (skillIds: string[]) => [...skillIds].sort()

describe("Bamboocut Dust's inner ways", () => {
  it("offers Phantom Rally as the class signature and the other three beside the shared ways", () => {
    expect(bamboocutDust.classMindGroup).toBe(INNER_WAY_ID.phantomRally)
    expect(bamboocutDust.allowedMindMethods).toEqual(
      expect.arrayContaining([
        INNER_WAY_ID.towlineSweep,
        INNER_WAY_ID.lightAnew,
        INNER_WAY_ID.songOfTang,
      ]),
    )
  })

  it("resolves each in-game passive number to its inner way", () => {
    expect(PASSIVE_ID_TO_INNER_WAY).toMatchObject({
      "501": INNER_WAY_ID.phantomRally,
      "502": INNER_WAY_ID.towlineSweep,
      "503": INNER_WAY_ID.lightAnew,
      "504": INNER_WAY_ID.songOfTang,
    })
  })

  it("starts the graduation build on rank 6 of the four inner ways it standardizes", () => {
    expect(minBuild.standardized?.innerWays).toEqual([
      { id: "phantomRally", tier: 6 },
      { id: "towlineSweep", tier: 6 },
      { id: "songOfTang", tier: 6 },
      { id: "moraleChant", tier: 6 },
    ])
  })

  it("grants each ladder from rank 2 and each fixed line from rank 5", () => {
    expect(contributions(INNER_WAY_ID.phantomRally, 1).critRate ?? 0).toBe(0)
    expect(contributions(INNER_WAY_ID.phantomRally, 2).critRate).toBeCloseTo(0.09, 10)
    expect(contributions(INNER_WAY_ID.phantomRally, 4).physBoost ?? 0).toBe(0)
    expect(contributions(INNER_WAY_ID.phantomRally, 5).physBoost).toBeCloseTo(0.028, 10)

    expect(contributions(INNER_WAY_ID.towlineSweep, 1)["phys.min"] ?? 0).toBe(0)
    expect(contributions(INNER_WAY_ID.towlineSweep, 2)["phys.min"]).toBeCloseTo(70.1, 10)
    expect(contributions(INNER_WAY_ID.towlineSweep, 4)["phys.penetration"] ?? 0).toBe(0)
    expect(contributions(INNER_WAY_ID.towlineSweep, 5)["phys.penetration"]).toBeCloseTo(0.051, 10)

    expect(contributions(INNER_WAY_ID.lightAnew, 1)["bamboocut.min"] ?? 0).toBe(0)
    expect(contributions(INNER_WAY_ID.lightAnew, 2)["bamboocut.min"]).toBeCloseTo(39.8, 10)
    expect(contributions(INNER_WAY_ID.lightAnew, 4)["bamboocut.penetration"] ?? 0).toBe(0)
    expect(contributions(INNER_WAY_ID.lightAnew, 5)["bamboocut.penetration"]).toBeCloseTo(0.06, 10)

    expect(contributions(INNER_WAY_ID.songOfTang, 1).precision ?? 0).toBe(0)
    expect(contributions(INNER_WAY_ID.songOfTang, 2).precision).toBeCloseTo(0.072, 10)
    expect(contributions(INNER_WAY_ID.songOfTang, 4).critDamageBoost ?? 0).toBe(0)
    expect(contributions(INNER_WAY_ID.songOfTang, 5).critDamageBoost).toBeCloseTo(0.04, 10)
  })

  it("follows the build's breakthrough on the two Min Attack ladders", () => {
    expect(contributions(INNER_WAY_ID.towlineSweep, 6, 16)["phys.min"]).toBeCloseTo(66.9, 10)
    expect(contributions(INNER_WAY_ID.towlineSweep, 6, 21)["phys.min"]).toBeCloseTo(95, 10)
    expect(contributions(INNER_WAY_ID.lightAnew, 6, 12)["bamboocut.min"]).toBeCloseTo(24, 10)
    expect(contributions(INNER_WAY_ID.lightAnew, 6, 21)["bamboocut.min"]).toBeCloseTo(53.9, 10)
    expect(Object.keys(INNER_WAY_LADDERS.weaponAttackMinFourStar)).toHaveLength(10)
    expect(Object.keys(INNER_WAY_LADDERS.bamboocutAttackMinFourStar)).toHaveLength(10)
  })

  it("switches on the Phantom Rally throw gates once the inner way is slotted", () => {
    const unslotted = runSlotted([SKILL.scarletSpin], slotted("", 0))
    const slottedRun = runSlotted([SKILL.scarletSpin], slotted(INNER_WAY_ID.phantomRally, 1))
    expect(windowFramesOf(unslotted, STATUS.phantomUmbrella)).toEqual([])
    expect(windowFramesOf(slottedRun, STATUS.phantomUmbrella).length).toBeGreaterThan(0)
  })

  it("switches on the Towline Sweep gates once the inner way is slotted", () => {
    const rotation = [
      SKILL.soulSweep,
      SKILL.piercingDartIII,
      SKILL.soulSweep,
      SKILL.ropeLightAttack,
    ]
    const tokensBeforeLastCast = (mindMethods: Inputs["mindMethods"]) =>
      runSlotted(rotation, mindMethods).casts![3].meterLevels!.find(
        (level) => level.id === tokensOfGratitudeMeter.id,
      )?.amount
    const unslotted = tokensBeforeLastCast(slotted("", 0))
    const slottedTokens = tokensBeforeLastCast(slotted(INNER_WAY_ID.towlineSweep, 1))
    expect(slottedTokens! - unslotted!).toBeCloseTo(50, 1)
  })
})

describe("Phantom Chime", () => {
  const chimeWindows = (tier: number) =>
    windowFramesOf(runDust(THROW_CHAIN, rank("phantomRally", tier)), DEBUFF.phantomChime)

  it("is applied by the resonance hits from rank 3 only", () => {
    expect(chimeWindows(2)).toEqual([])
    expect(chimeWindows(3).length).toBeGreaterThan(0)
  })

  it("lasts 5.1 seconds from the resonance that applied it", () => {
    const [window] = chimeWindows(3)
    expect(window.end - window.start).toBeGreaterThanOrEqual(306)
  })

  it("raises every later hit of the chain through physical penetration", () => {
    const withChime = runDust(THROW_CHAIN, rank("phantomRally", 3))
    const withoutChime = runDust(THROW_CHAIN, rank("phantomRally", 2))
    expect(damageOf(withChime, THIRD_CATCH_NAME)).toBeGreaterThan(
      damageOf(withoutChime, THIRD_CATCH_NAME),
    )
    expect(damageOf(withChime, "Scarlet Spin")).toBe(damageOf(withoutChime, "Scarlet Spin"))
  })

  it("stacks at most five times", () => {
    const result = runDust(
      [...THROW_CHAIN, SKILL.dreamwroughtBubbles, SKILL.dreamwroughtBubblesInstant],
      rank("phantomRally", 6),
    )
    const peak = Math.max(
      ...result.casts!.map((_, index) => stacksAfterCast(result, index, DEBUFF.phantomChime)),
    )
    expect(peak).toBeGreaterThan(0)
    expect(peak).toBeLessThanOrEqual(5)
  })
})

describe("Phantom Rally's resonance bonus", () => {
  it("lifts the two resonance skills from rank 4 and nothing else", () => {
    const rankThree = runDust(THROW_CHAIN, rank("phantomRally", 3))
    const rankFour = runDust(THROW_CHAIN, rank("phantomRally", 4))
    expect(damageOf(rankFour, RESONANCE_NAME)).toBeGreaterThan(damageOf(rankThree, RESONANCE_NAME))
    expect(damageOf(rankFour, "Scarlet Spin")).toBe(damageOf(rankThree, "Scarlet Spin"))
  })

  it("is received by both resonance skills and by no other skill", () => {
    expect(skillsReceiving(BUFF.phantomRallyResonanceBoost)).toEqual(
      idsOf([SKILL.resonance, SKILL.resonanceDreamwrought]),
    )
  })
})

describe("Song of Tang", () => {
  const martialArtSkillIds = () =>
    dustSkills()
      .filter((skill) => skill.tags?.includes(ROLE.dustMartialArtSkill))
      .map((skill) => skill.id)

  it("is received by every Martial Art Skill and nothing else", () => {
    for (const buffId of [BUFF.tangMelodyEarlyRanks, BUFF.tangMelodyLaterRanks]) {
      expect(skillsReceiving(buffId)).toEqual(idsOf(martialArtSkillIds()))
    }
  })

  it("raises Martial Art Skill hits with each Tang Melody stack and leaves other skills alone", () => {
    const rotation = [...THROW_CHAIN, SKILL.umbrellaLightAttack]
    const withSong = runDust(rotation, rank("songOfTang", 3))
    const withoutSong = runDust(rotation)
    expect(damageOf(withSong, THIRD_CATCH_NAME)).toBeGreaterThan(
      damageOf(withoutSong, THIRD_CATCH_NAME),
    )
    expect(damageOf(withSong, UMBRELLA_LIGHT_NAME)).toBe(damageOf(withoutSong, UMBRELLA_LIGHT_NAME))
  })

  it("gains one stack a second at ranks 1-2 and two a second from rank 3", () => {
    const rotation = [SKILL.scarletSpin, SKILL.perfectCatchAfterFirst]
    const earlyStacks = stacksAfterCast(
      runDust(rotation, rank("songOfTang", 2)),
      1,
      BUFF.tangMelodyEarlyRanks,
    )
    const laterStacks = stacksAfterCast(
      runDust(rotation, rank("songOfTang", 3)),
      1,
      BUFF.tangMelodyLaterRanks,
    )
    expect(earlyStacks).toBe(1)
    expect(laterStacks).toBe(2)
  })

  it("pays 3% a stack from rank 3 instead of 2%", () => {
    const rotation = [
      SKILL.scarletSpin,
      SKILL.perfectCatchAfterFirst,
      SKILL.perfectCatchAfterSecond,
    ]
    const rankTwo = runDust(rotation, rank("songOfTang", 2))
    const rankThree = runDust(rotation, rank("songOfTang", 3))
    expect(damageOf(rankThree, SECOND_CATCH_NAME)).toBeGreaterThan(
      damageOf(rankTwo, SECOND_CATCH_NAME),
    )
  })

  it("caps Tang Melody at five stacks", () => {
    const result = runDust(
      [...THROW_CHAIN, SKILL.soulSweep, SKILL.soulSweep],
      rank("songOfTang", 6),
    )
    const peak = Math.max(
      ...result.casts!.map((_, index) => stacksAfterCast(result, index, BUFF.tangMelodyLaterRanks)),
    )
    expect(peak).toBeLessThanOrEqual(5)
    expect(peak).toBeGreaterThan(2)
  })
})

describe("Light Anew", () => {
  it("changes no hit on a single target beyond its panel lines", () => {
    const rotation = [SKILL.scarletSpin, SKILL.ropeLightAttack]
    const unslotted = runSlotted(rotation, slotted("", 0), { breakthrough: 17 })
    const tierOne = runSlotted(rotation, slotted(INNER_WAY_ID.lightAnew, 1), { breakthrough: 17 })
    expect(damageOf(tierOne, "Scarlet Spin")).toBe(damageOf(unslotted, "Scarlet Spin"))
    const tierSix = runSlotted(rotation, slotted(INNER_WAY_ID.lightAnew, 6), { breakthrough: 17 })
    expect(damageOf(tierSix, "Scarlet Spin")).toBeGreaterThan(damageOf(unslotted, "Scarlet Spin"))
  })
})

describe("Shared content on Bamboocut Dust", () => {
  const martialArtSkills = () =>
    dustSkills().filter((skill) => skill.tags?.includes(ROLE.dustMartialArtSkill))

  it("arms Jadeware and Spring Thunder on every Martial Art Skill cast the player makes", () => {
    const casts = martialArtSkills().filter((skill) => skill.id !== SKILL.resonance)
    expect(casts.length).toBeGreaterThan(0)
    for (const skill of casts) {
      expect(skill.triggersBuffs, skill.id).toEqual(
        expect.arrayContaining([BUFF.jadeware, BUFF.springThunder]),
      )
    }
  })

  it("gives Starweave and Wolfchaser's Art their Martial Art Skill damage on exactly those skills", () => {
    const expected = idsOf(martialArtSkills().map((skill) => skill.id))
    expect(skillsReceiving(BUFF.starweaveMartialBoost)).toEqual(expected)
    expect(skillsReceiving(BUFF.wolfchasersArtMartialDamage)).toEqual(expected)
  })

  it("gives Etherwrath's penetration to both resonance skills only", () => {
    expect(skillsReceiving(BUFF.etherwrathPenetrationBoost)).toEqual(
      idsOf([SKILL.resonance, SKILL.resonanceDreamwrought]),
    )
  })

  it("gives Swallowcall to the light chains and the held light, not to the dashes or Dual-Weapon Skills", () => {
    expect(skillsReceiving(BUFF.swallowcallLightAttackBoost)).toEqual(
      idsOf([
        SKILL.umbrellaLightAttack,
        SKILL.springAway,
        SKILL.springAwayLift,
        SKILL.ropeLightAttack,
      ]),
    )
  })

  it("gives Battle Anthem to Dreamwrought Bubbles, the Spring Away bullets and every Piercing Dart release", () => {
    const expected = idsOf([
      SKILL.springAway,
      SKILL.dreamwroughtBubbles,
      SKILL.dreamwroughtBubblesInstant,
      SKILL.piercingDartI,
      SKILL.piercingDartII,
      SKILL.piercingDartIISweeps4To5,
      SKILL.piercingDartIII,
      SKILL.piercingDartIIISweeps4To5,
      SKILL.piercingDartIIISweeps6To7,
    ])
    expect(skillsReceiving(BUFF.battleAnthemChargedDamage)).toEqual(expected)
    expect(skillsReceiving(BUFF.battleAnthemEnduranceBoost)).toEqual(expected)
  })

  it("gives Thunderous Bloom to the light and heavy attack skills and the projectile hits, never Dreamwrought or the melee dashes", () => {
    const expected = idsOf([
      SKILL.umbrellaLightAttack,
      SKILL.springAway,
      SKILL.springAwayLift,
      SKILL.umbrellaDashBullet,
      SKILL.umbrellaDual,
      SKILL.heavyAttack1,
      SKILL.heavyAttack2,
      SKILL.heavyAttack3,
      SKILL.heavyAttack4,
      SKILL.ropeLightAttack,
      SKILL.ropeSprintAttack,
    ])
    expect(skillsReceiving(BUFF.thunderousBloom)).toEqual(expected)
    expect(skillsReceiving(BUFF.springThunder)).toEqual(expected)
  })

  it("marks Mistwillow's light side on the light skills and its heavy side on the heavy chain only", () => {
    const lightSkills = idsOf([
      SKILL.umbrellaLightAttack,
      SKILL.springAway,
      SKILL.springAwayLift,
      SKILL.umbrellaDashBullet,
      SKILL.umbrellaDual,
      SKILL.ropeLightAttack,
      SKILL.ropeSprintAttack,
    ])
    const heavySkills = idsOf([
      SKILL.heavyAttack1,
      SKILL.heavyAttack2,
      SKILL.heavyAttack3,
      SKILL.heavyAttack4,
    ])
    expect(skillsReceiving(BUFF.mistwillowHeavyBuff)).toEqual(lightSkills)
    expect(skillsReceiving(BUFF.mistwillowLightBuff)).toEqual(heavySkills)
    expect(skillsReceiving(BUFF.mistwillowBuff)).toEqual(idsOf([...lightSkills, ...heavySkills]))
  })

  it("lets a Martial Art Skill cast arm Spring Thunder for the light hit that follows it", () => {
    const rotation = [SKILL.soulSweep, SKILL.ropeLightAttack]
    const withBloom = runSlotted(rotation, slotted(INNER_WAY_ID.thunderousBloom, 6))
    const withoutBloom = runSlotted(rotation, slotted("", 0))
    const lightGrowth =
      damageOf(withBloom, ROPE_LIGHT_NAME) / damageOf(withoutBloom, ROPE_LIGHT_NAME)
    const sweepGrowth = damageOf(withBloom, "Soul Sweep") / damageOf(withoutBloom, "Soul Sweep")
    expect(lightGrowth).toBeGreaterThan(sweepGrowth * 1.05)
  })

  it("gives Wolfchaser's Art its 10% on a Soul Sweep from rank 3", () => {
    const rotation = [SKILL.soulSweep]
    const rankThree = runSlotted(rotation, slotted(INNER_WAY_ID.wolfchasersArt, 3))
    const rankTwo = runSlotted(rotation, slotted(INNER_WAY_ID.wolfchasersArt, 2))
    expect(damageOf(rankThree, "Soul Sweep")).toBeGreaterThan(damageOf(rankTwo, "Soul Sweep"))
  })
})
