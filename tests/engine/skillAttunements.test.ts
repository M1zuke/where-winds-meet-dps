import { describe, expect, it } from "vitest"
import {
  ATTUNEMENT_OPTIONS,
  getAttunement,
  type AttunementOption,
} from "../../src/engine/attunements"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { classDefinition } from "../../src/definitions/classes/registry"
import { defaultInputs } from "../../src/engine/defaults"
import { makeDebuff } from "../../src/engine/debuff"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { makeHit, makeSkill, makeTrigger } from "../../src/engine/skill"
import { simulateTimeline } from "../../src/engine/timeline"
import type { Result } from "../../src/engine/types"

const SKILL_ATTUNEMENTS = ATTUNEMENT_OPTIONS.filter(
  (option): option is AttunementOption & { affectsTag: string } => !!option.affectsTag,
)

function damageOf(result: Result, name: string): number {
  return result.perSkill
    .filter((row) => row.name === name)
    .reduce((sum, row) => sum + row.expectedDamage, 0)
}

function runTaggedSkillAndDot(option: (typeof SKILL_ATTUNEMENTS)[number], value: number): Result {
  const classId = option.classIds?.[0]
  if (!classId || !option.enginePath?.startsWith("classSpecificAttunement.")) {
    throw new Error(`${option.id} is not a class-scoped skill attunement`)
  }

  const tag = option.affectsTag
  const directName = `${option.id} Direct`
  const tickName = `${option.id} Tick`
  const tickId = `${classId}-test-${option.id}-tick`
  const debuffId = `debuff-${tickId}`
  const tickSkill = makeSkill(classId, {
    id: tickId,
    name: tickName,
    tags: [tag],
    skillType: "sustain",
    hits: [makeHit({ physMultiplier: 1 })],
  })
  const directSkill = makeSkill(classId, {
    id: `${classId}-test-${option.id}-direct`,
    name: directName,
    tags: [tag],
    castFrames: 180,
    hits: [
      makeHit({
        physMultiplier: 1,
        triggers: [makeTrigger({ kind: "applyDot", targetId: debuffId })],
      }),
    ],
  })
  const debuff = makeDebuff(classId, {
    id: debuffId,
    name: tickName,
    durationFrames: 180,
    dot: {
      tickIntervalFrames: 60,
      physMultiplier: 1,
      physFixed: 0,
      attributeMultiplier: 0,
      attributeFixed: 0,
      attributeAttack: "",
      skillType: "sustain",
      weaponOrAttribute: null,
      count: 1,
      perStackShapes: null,
      perStackMultipliers: null,
    },
  })
  const rotation = makeRotation(classId, {
    steps: [makeStep({ skillId: directSkill.id, hitCount: 1 })],
  })
  return simulateTimeline({
    ...defaultInputs,
    classId,
    classSpecificAttunement: { [option.id]: value },
    customSkills: [directSkill, tickSkill],
    customDebuffs: [debuff],
    activeCustomRotation: rotation,
  })
}

describe("declarative skill attunements", () => {
  it.each(SKILL_ATTUNEMENTS)("$id keys its engine path by its own id", (option) => {
    expect(option.enginePath).toBe(`classSpecificAttunement.${option.id}`)
  })

  it.each(SKILL_ATTUNEMENTS)("$id is an attunement its class declares", (option) => {
    const classId = option.classIds![0]!
    expect(classDefinition(classId)!.classSpecificAttunements).toContain(option.id)
  })

  it.each(SKILL_ATTUNEMENTS)(
    "$id applies its configured multiplier to a tagged direct skill and linked DoT",
    (option) => {
      const base = runTaggedSkillAndDot(option, 0)
      const boosted = runTaggedSkillAndDot(option, option.max)
      const directName = `${option.id} Direct`
      const dotName = `${option.id} Tick (DoT)`

      expect(damageOf(base, directName)).toBeGreaterThan(0)
      expect(damageOf(base, dotName)).toBeGreaterThan(0)
      expect(damageOf(boosted, directName) / damageOf(base, directName)).toBeCloseTo(
        1 + option.max,
        10,
      )
      expect(damageOf(boosted, dotName) / damageOf(base, dotName)).toBeCloseTo(1 + option.max, 10)
    },
  )

  it("applies the Phalanxbane charge attunement to the real Inner Passion skill but not other Mo Blade skills", () => {
    const option = getAttunement("phalanxChargeDamage")!
    const skills = builtinSkillsForClass("stonesplitStrength")
    const phalanx = skills.find(
      (skill) => skill.id === "stonesplitStrength-phalanxcharged-s3-innerpassion",
    )!
    const special = skills.find((skill) => skill.id === "stonesplitStrength-phalanxspecial")!

    const run = (skillId: string, value: number) => {
      const rotation = makeRotation("stonesplitStrength", {
        steps: [
          makeStep({
            skillId,
            hitCount: skills.find((skill) => skill.id === skillId)!.hits.length,
          }),
        ],
      })
      return simulateTimeline({
        ...defaultInputs,
        classId: "stonesplitStrength",
        classSpecificAttunement: { phalanxChargeDamage: value },
        activeCustomRotation: rotation,
      })
    }

    const phalanxBase = damageOf(run(phalanx.id, 0), phalanx.name)
    const phalanxBoosted = damageOf(run(phalanx.id, option.max), phalanx.name)
    const specialBase = damageOf(run(special.id, 0), special.name)
    const specialBoosted = damageOf(run(special.id, option.max), special.name)

    expect(phalanxBoosted / phalanxBase).toBeCloseTo(1 + option.max, 10)
    expect(specialBoosted).toBeCloseTo(specialBase, 10)
  })
})
