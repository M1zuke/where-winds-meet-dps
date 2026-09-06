// Scoped to Bamboocut Draught's Tiltrim set — the class carries no validated
// anchor (docs/TESTING.md § "Class scoping"), so nothing here asserts an
// absolute DPS number.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { SKILL, STATUS } from "../../src/data/skills/bamboocut-draught/ids"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { SET_ID } from "../../src/data/sets/ids"

const CLASS = "bamboocutDraught"

function runHerosBlood(bingePoints: number) {
  return runEngine({
    ...defaultInputs,
    classId: CLASS,
    set: SET_ID.tiltrim,
    activeCustomRotation: makeRotation(CLASS, {
      steps: [makeStep({ skillId: SKILL.herosBlood, hitCount: 2 })],
      openingStacks: { [STATUS.bingePoints]: bingePoints },
    }),
  })
}

function primeAndMeasure(primerCasts: number, measuredSkillId: string, measuredHitCount: number) {
  const steps = [
    ...Array.from({ length: primerCasts }, () =>
      makeStep({ skillId: SKILL.peakfall, hitCount: 2 }),
    ),
    makeStep({ skillId: measuredSkillId, hitCount: measuredHitCount }),
  ]
  const result = runEngine({
    ...defaultInputs,
    classId: CLASS,
    set: SET_ID.tiltrim,
    activeCustomRotation: makeRotation(CLASS, {
      steps,
      openingStacks: { [STATUS.bingePoints]: 100 },
    }),
  })
  const skillName = measuredSkillId === SKILL.castlink ? "Castlink" : "Twinblade Special"
  const measuredEvents = result.timeline!.filter((event) => event.skillName === skillName)
  return measuredEvents.slice(-measuredHitCount).reduce((sum, event) => sum + event.damage, 0)
}

describe("Tiltrim", () => {
  it("a plain Hero's Blood hit while Tipsy grants a Tiltrim stack", () => {
    const result = runHerosBlood(100)
    const herosBloodCast = result.casts!.find((cast) => cast.skillName === "Twinblade Special")!
    const stack = herosBloodCast.buffs.find((buff) => buff.id === BUFF.tiltrimStack)
    expect(stack?.stacks).toBeGreaterThanOrEqual(1)
  })

  it("the per-stack bonus reaches a skill that is not Inebriate-enhanced", () => {
    const withTipsy = runHerosBlood(100)
    const withoutTipsy = runHerosBlood(0)
    const damageOf = (result: ReturnType<typeof runHerosBlood>) =>
      result.perSkill.find((row) => row.breakdownName === "Hero's Blood")!.expectedDamage
    expect(damageOf(withTipsy)).toBeGreaterThan(damageOf(withoutTipsy))
  })

  it("pays no stack bonus below 100 Binge Points, though the engine still lets the stack itself build unseen", () => {
    const result = runHerosBlood(0)
    const herosBloodCast = result.casts!.find((cast) => cast.skillName === "Twinblade Special")!
    expect(herosBloodCast.buffs.some((buff) => buff.id === BUFF.tiltrimStack)).toBe(false)
  })

  it("the 5-stack bonus reaches only Inebriate-enhanced skills", () => {
    // 0 primers never lift a 4-hit measured cast past 4 stacks; 3 primers
    // (6 damaging hits) already sit at the 5-stack cap before it starts.
    const castlinkFresh = primeAndMeasure(0, SKILL.castlink, 4)
    const castlinkCapped = primeAndMeasure(3, SKILL.castlink, 4)
    const herosBloodFresh = primeAndMeasure(0, SKILL.herosBlood, 2)
    const herosBloodCapped = primeAndMeasure(3, SKILL.herosBlood, 2)

    const castlinkGrowth = castlinkCapped / castlinkFresh
    const herosBloodGrowth = herosBloodCapped / herosBloodFresh
    expect(castlinkGrowth).toBeGreaterThan(herosBloodGrowth)
  })
})
