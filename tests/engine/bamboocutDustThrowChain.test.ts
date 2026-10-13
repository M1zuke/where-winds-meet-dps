// Scoped to Bamboocut Dust (docs/TESTING.md § "Class scoping"): the class is
// registered, not validated, so nothing here asserts an absolute DPS number.
import { describe, expect, it } from "vitest"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeStep } from "../../src/engine/rotation"
import { FPS } from "../../src/engine/timeline"
import { PARAM } from "../../src/data/skills/buffs/ids"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-dust/ids"
import { scarletSpin } from "../../src/data/skills/bamboocut-dust/scarlet-spin"
import { fadingCrimsonMeter } from "../../src/data/classes/bamboocut-dust/meters"
import { testRotation } from "../builtins"

const CLASS = "bamboocutDust"

function run(skillIds: string[], buffParams: Record<string, unknown> = {}) {
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    buffParams,
    activeCustomRotation: testRotation(CLASS, {
      steps: skillIds.map((skillId) => makeStep({ skillId })),
    }),
  })
}

const FULL_CHAIN = [
  SKILL.scarletSpin,
  SKILL.perfectCatchAfterFirst,
  SKILL.perfectCatchAfterSecond,
  SKILL.perfectCatchAfterThird,
]

const startFrames = (result: ReturnType<typeof run>) =>
  result.casts!.map((cast) => Math.round(cast.timeSec * FPS))

const framesOf = (result: ReturnType<typeof run>, skillName: string) =>
  result
    .timeline!.filter((event) => event.skillName === skillName && event.damage > 0)
    .map((event) => event.frame)

const fadingCrimsonAtStart = (result: ReturnType<typeof run>, castIndex: number) =>
  result.casts![castIndex].meterLevels!.find((level) => level.id === fadingCrimsonMeter.id)!.amount

const PHANTOM_RALLY_TIER_ONE = { [PARAM.phantomRally]: true, [`${PARAM.phantomRally}Tier`]: 1 }
const PHANTOM_RALLY_TIER_SIX = { [PARAM.phantomRally]: true, [`${PARAM.phantomRally}Tier`]: 6 }

describe("the Scarlet Spin throw chain", () => {
  it("starts each catch at the close of the previous throw's window when the next step is its Perfect Catch", () => {
    const result = run([...FULL_CHAIN, SKILL.dreamwroughtBubbles])
    expect(startFrames(result)).toEqual([0, 65, 123, 188, 238])
  })

  it("runs a throw to its full cast length when the next step is not the offered Perfect Catch", () => {
    const result = run([SKILL.scarletSpin, SKILL.scarletSpinSecond])
    expect(startFrames(result)).toEqual([0, 68])
  })

  it("lands the out hit before the far point and the back hit after it", () => {
    const result = run([SKILL.scarletSpin, SKILL.scarletSpinSecond])
    expect(framesOf(result, "Scarlet Spin")).toEqual([35, 48])
    expect(framesOf(result, "Scarlet Spin (2nd throw)")).toEqual([68 + 24, 68 + 38])
  })

  it("spends 25 Fading Crimson a throw and holds its regeneration while Flower Burial is up", () => {
    const result = run(FULL_CHAIN)
    expect([0, 1, 2, 3].map((index) => fadingCrimsonAtStart(result, index))).toEqual([
      100, 75, 50, 25,
    ])
  })

  it("ends Flower Burial when a Perfect Catch leaves 2 Fading Crimson or fewer, and regeneration resumes", () => {
    const result = run([...FULL_CHAIN, SKILL.dreamwroughtBubbles])
    const flowerBurial = result.buffWindows!.find((window) => window.id === STATUS.flowerBurial)!
    const lastCatchStart = 188
    expect(flowerBurial.endSec * FPS).toBeLessThan(lastCatchStart + 10)
    const regenerated = fadingCrimsonAtStart(result, 4)
    expect(regenerated).toBeGreaterThan(5)
    expect(regenerated).toBeLessThan(10)
  })

  it("keeps Flower Burial through a Perfect Catch that leaves more than 2 Fading Crimson", () => {
    const result = run([SKILL.scarletSpin, SKILL.perfectCatchAfterFirst, SKILL.dreamwroughtBubbles])
    const flowerBurial = result.buffWindows!.find((window) => window.id === STATUS.flowerBurial)!
    expect(flowerBurial.endSec * FPS).toBeGreaterThan(300)
  })

  it("flags a Perfect Catch cast without Flower Burial and a Scarlet Spin below 25 Fading Crimson", () => {
    const catchOnly = run([SKILL.perfectCatchAfterFirst])
    expect(catchOnly.invalidStepIds).toHaveLength(1)
    const exhausted = run([...FULL_CHAIN, SKILL.scarletSpin])
    expect(exhausted.invalidStepIds).toHaveLength(1)
  })

  it("grants nothing from a throw whose next step is not a Perfect Catch", () => {
    const result = run([SKILL.scarletSpin, SKILL.scarletSpinSecond])
    const blossoms = result.casts![1].buffs.find((buff) => buff.id === STATUS.fallingBlossoms)
    expect(blossoms?.stacks ?? 0).toBe(0)
  })
})

describe("the Bamboocut attribute multiplier in skill data", () => {
  it("stores the raw attribute flat beside the multiplied coefficient, since the engine multiplies the flat itself", () => {
    const outHit = scarletSpin.hits.find((hitDef) => hitDef.attributeMultiplier > 0)!
    expect(outHit.attributeMultiplier).toBeCloseTo(1.62756, 6)
    expect(outHit.attributeFixed).toBeCloseTo(163.8, 6)
  })
})

describe("Falling Blossoms and Fragrant Song", () => {
  it("turns three Perfect Catches into a Fragrant Song that the next throw consumes", () => {
    const result = run([...FULL_CHAIN, SKILL.dreamwroughtBubbles])
    const lastThrow = result.casts![3]
    expect(lastThrow.buffs.find((buff) => buff.id === STATUS.fragrantSongLogic)?.stacks).toBe(1)
    expect(lastThrow.buffs.find((buff) => buff.id === STATUS.fragrantSong)?.stacks ?? 0).toBe(0)
  })

  it("plays the throw cast under Fragrant Song at the faster frames", () => {
    const result = run([...FULL_CHAIN, SKILL.dreamwroughtBubbles])
    expect(framesOf(result, "Perfect Catch (after 3rd throw)")).toEqual([188 + 20, 188 + 31])
    expect(startFrames(result)[4]).toBe(188 + 50)
  })

  it("closes the catch window at the Fragrant Song frame when a Perfect Catch follows", () => {
    const result = run([...FULL_CHAIN, SKILL.perfectCatchAfterFirst])
    expect(startFrames(result)[4]).toBe(188 + 46)
  })

  it("forces a crit and adds 20% on the throw cast under Fragrant Song only", () => {
    const boosted = run([...FULL_CHAIN, SKILL.dreamwroughtBubbles])
    const plain = run([
      SKILL.scarletSpin,
      SKILL.scarletSpinSecond,
      SKILL.scarletSpinThird,
      SKILL.scarletSpinFourth,
      SKILL.dreamwroughtBubbles,
    ])
    const outHit = (result: ReturnType<typeof run>, name: string) =>
      result.timeline!.find((event) => event.skillName === name && event.damage > 0)!.damage
    const boostedDamage = outHit(boosted, "Perfect Catch (after 3rd throw)")
    const plainDamage = outHit(plain, "Scarlet Spin (4th throw)")
    expect(boostedDamage / plainDamage).toBeCloseTo(1.2, 2)
  })

  it("does not boost the throw that earns the Fragrant Song", () => {
    const earning = run([...FULL_CHAIN, SKILL.dreamwroughtBubbles])
    const notEarning = run([
      SKILL.scarletSpin,
      SKILL.perfectCatchAfterFirst,
      SKILL.perfectCatchAfterSecond,
      SKILL.dreamwroughtBubbles,
    ])
    const outHit = (result: ReturnType<typeof run>) =>
      result.timeline!.find(
        (event) => event.skillName === "Perfect Catch (after 2nd throw)" && event.damage > 0,
      )!.damage
    expect(outHit(earning)).toBeCloseTo(outHit(notEarning), 6)
  })
})

describe("Phantom Rally on the throw chain", () => {
  it("adds nothing without the inner way", () => {
    const result = run(FULL_CHAIN)
    expect(result.perSkill.some((row) => row.breakdownName === "Resonance")).toBe(false)
    expect(result.buffWindows!.some((window) => window.id === STATUS.phantomUmbrella)).toBe(false)
    expect(fadingCrimsonAtStart(result, 1)).toBe(75)
  })

  it("restores 10 Fading Crimson on a Perfect Catch from rank 1", () => {
    const result = run(FULL_CHAIN, PHANTOM_RALLY_TIER_ONE)
    expect(fadingCrimsonAtStart(result, 1)).toBe(85)
  })

  it("summons a phantom on the first and fourth throw at rank 1 and on every throw at rank 6", () => {
    const summonsAt = (params: Record<string, unknown>) =>
      run(FULL_CHAIN, params)
        .buffWindows!.filter((window) => window.id === STATUS.phantomUmbrella)
        .map((window) => Math.round(window.startSec * FPS))
    expect(summonsAt(PHANTOM_RALLY_TIER_ONE)).toEqual([45, 216])
    expect(summonsAt(PHANTOM_RALLY_TIER_SIX)).toHaveLength(4)
  })

  it("makes the summoned phantom resonate after the far point", () => {
    const result = run(FULL_CHAIN, PHANTOM_RALLY_TIER_ONE)
    const resonance = result.perSkill.find((row) => row.breakdownName === "Resonance")
    expect(resonance?.count).toBeGreaterThan(0)
    expect(framesOf(result, "Resonance (Martial Art Skill)")).toContain(45 + 14)
  })

  it("grants Fragrant Song - Delicate with the third catch so the next Dreamwrought Bubbles needs no charge", () => {
    const withRally = run([...FULL_CHAIN, SKILL.dreamwroughtBubblesInstant], PHANTOM_RALLY_TIER_ONE)
    expect(withRally.invalidStepIds ?? []).toEqual([])
    const withoutRally = run([...FULL_CHAIN, SKILL.dreamwroughtBubblesInstant])
    expect(withoutRally.invalidStepIds).toHaveLength(1)
  })
})

describe("the catch press inside a throw", () => {
  it("presses one frame after the far point, so the first throw's catch resonates off the summoned phantom", () => {
    const result = run([...FULL_CHAIN, SKILL.dreamwroughtBubblesInstant], PHANTOM_RALLY_TIER_ONE)
    expect(framesOf(result, "Resonance (Martial Art Skill)")).toContain(45 + 1)
    const withoutRally = run(FULL_CHAIN)
    expect(framesOf(withoutRally, "Resonance (Martial Art Skill)")).toEqual([])
  })

  it("keeps every catch press one frame after the far point, inside the window and before the cast ends", () => {
    for (const skill of builtinSkillsForClass(CLASS)) {
      const presses = skill.hits.filter((hit) => hit.requiresNextStepSkillIds !== undefined)
      if (presses.length === 0) continue
      const farPointHit = skill.hits.find((hit) =>
        hit.triggers.some((trigger) => trigger.targetId === STATUS.phantomUmbrella),
      )!
      for (const press of presses) {
        const fragrant = press.variants !== undefined
        const windowClose = fragrant ? press.variants![0].castFrames! : press.castFramesWhenGated!
        const farPointFrame = fragrant ? farPointHit.variants![0].frame! : farPointHit.frame
        expect(press.frame, skill.id).toBe(farPointFrame + 1)
        expect(press.frame, skill.id).toBeLessThan(windowClose)
        expect(windowClose, skill.id).toBeLessThanOrEqual(skill.castFrames)
      }
    }
  })
})

describe("Flower Burial gating of the throws", () => {
  it("refuses a first Scarlet Spin while Flower Burial is up", () => {
    const result = run([SKILL.scarletSpin, SKILL.scarletSpin])
    expect(result.invalidStepIds).toHaveLength(1)
  })

  it("ends Flower Burial one frame after a plain re-throw spends the last Fading Crimson", () => {
    const result = run([
      SKILL.scarletSpin,
      SKILL.scarletSpinSecond,
      SKILL.scarletSpinThird,
      SKILL.scarletSpinFourth,
    ])
    const flowerBurial = result.buffWindows!.find((window) => window.id === STATUS.flowerBurial)!
    expect(Math.round(flowerBurial.endSec * FPS)).toBe(startFrames(result)[3] + 1)
  })
})

describe("Fragrant Song - Delicate and the held inputs", () => {
  it("makes the held Dreamwrought Bubbles and the first heavy stage illegal while Delicate is up", () => {
    const afterChain = (skillId: string) =>
      run([...FULL_CHAIN, skillId], PHANTOM_RALLY_TIER_ONE).invalidStepIds ?? []
    expect(afterChain(SKILL.dreamwroughtBubbles)).toHaveLength(1)
    expect(afterChain(SKILL.heavyAttack1)).toHaveLength(1)
    expect(afterChain(SKILL.dreamwroughtBubblesInstant)).toEqual([])
  })

  it("plays the held Dreamwrought Bubbles and the first heavy stage without Delicate", () => {
    expect(run([SKILL.dreamwroughtBubbles]).invalidStepIds ?? []).toEqual([])
    expect(run([SKILL.heavyAttack1]).invalidStepIds ?? []).toEqual([])
  })
})

describe("Cyclone Waltz swap", () => {
  it("re-creates an own Phantom Umbrella 27 frames in, and creates none without one", () => {
    const phantomEnd = (result: ReturnType<typeof run>) =>
      Math.max(
        ...result
          .buffWindows!.filter((window) => window.id === STATUS.phantomUmbrella)
          .map((window) => Math.round(window.endSec * FPS)),
      )
    const withPhantom = run([SKILL.scarletSpin, SKILL.cycloneWaltz], PHANTOM_RALLY_TIER_ONE)
    const cycloneStart = startFrames(withPhantom)[1]
    expect(phantomEnd(withPhantom)).toBe(cycloneStart + 27 + 300)
    const withoutPhantom = run([SKILL.cycloneWaltz], PHANTOM_RALLY_TIER_ONE)
    expect(withoutPhantom.buffWindows!.some((window) => window.id === STATUS.phantomUmbrella)).toBe(
      false,
    )
  })
})
