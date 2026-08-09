import { describe, expect, it } from "vitest"
import {
  DREAD_BUFF_ID,
  DREAD_DURATION_FRAMES,
  FEARFUL_BLADE_BUFF_ID,
  FEARFUL_BLADE_DURATION_FRAMES,
} from "../../src/engine/builtinBuffs"
import { builtinBuffsForClass, builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { defaultInputs } from "../../src/engine/defaults"
import { buildContext } from "../../src/engine/panel"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { makeHit, makeSkill, type Skill } from "../../src/engine/skill"
import { applyBuffEffects } from "../../src/engine/statRegistry"
import { simulateTimeline } from "../../src/engine/timeline"
import type { Result } from "../../src/engine/types"

const CLASS = "stonesplitStrength"

function skillNamed(name: string): Skill {
  const skill = builtinSkillsForClass(CLASS).find((candidate) => candidate.name === name)
  if (!skill) throw new Error(`missing built-in skill "${name}"`)
  return skill
}

function run(skills: Skill[], customSkills: Skill[] = []): Result {
  return simulateTimeline({
    ...defaultInputs,
    classId: CLASS,
    customSkills,
    activeCustomRotation: makeRotation(CLASS, {
      steps: skills.map((skill) => makeStep({ skillId: skill.id, hitCount: skill.hits.length })),
    }),
  })
}

function damageOf(result: Result, name: string): number {
  return result.perSkill
    .filter((row) => row.name === name)
    .reduce((total, row) => total + row.expectedDamage, 0)
}

function withoutTrigger(skill: Skill, targetId: string): Skill {
  return {
    ...skill,
    hits: skill.hits.map((hit) => ({
      ...hit,
      triggers: hit.triggers.filter((trigger) => trigger.targetId !== targetId),
    })),
  }
}

describe("Stonesplit Strength built-in buffs", () => {
  it("defines Dread and Fearful Blade with their workbook stat effects", () => {
    const buffs = builtinBuffsForClass(CLASS)
    const dread = buffs.find((buff) => buff.id === DREAD_BUFF_ID)
    const fearfulBlade = buffs.find((buff) => buff.id === FEARFUL_BLADE_BUFF_ID)

    expect(dread).toMatchObject({
      name: "Dread",
      durationFrames: DREAD_DURATION_FRAMES,
      effects: [{ statKey: "allDamageBoost", amount: 0.12 }],
    })
    expect(fearfulBlade).toMatchObject({
      name: "Fearful Blade",
      scope: "team",
      durationFrames: FEARFUL_BLADE_DURATION_FRAMES,
      effects: [
        { statKey: "allDamageBoost", amount: 0.08 },
        { statKey: "bellstrike.penetration", amount: 0.16 },
        { statKey: "stonesplit.penetration", amount: 0.16 },
        { statKey: "silkbind.penetration", amount: 0.16 },
        { statKey: "bamboocut.penetration", amount: 0.16 },
      ],
    })
  })

  it("converts Fearful Blade's fractional penetration to 16 formula points", () => {
    const fearfulBlade = builtinBuffsForClass(CLASS).find(
      (buff) => buff.id === FEARFUL_BLADE_BUFF_ID,
    )!
    const baseInputs = { ...defaultInputs, classId: CLASS }
    const { inputs: boostedInputs } = applyBuffEffects(baseInputs, fearfulBlade.effects)
    const baseContext = buildContext(baseInputs)
    const boostedContext = buildContext(boostedInputs)

    expect(boostedInputs.bellstrike.penetration - baseInputs.bellstrike.penetration).toBeCloseTo(
      0.16,
      10,
    )
    expect(boostedInputs.stonesplit.penetration - baseInputs.stonesplit.penetration).toBeCloseTo(
      0.16,
      10,
    )
    expect(boostedInputs.silkbind.penetration - baseInputs.silkbind.penetration).toBeCloseTo(
      0.16,
      10,
    )
    expect(boostedInputs.bamboocut.penetration - baseInputs.bamboocut.penetration).toBeCloseTo(
      0.16,
      10,
    )
    expect(boostedContext.bellstrike.pen - baseContext.bellstrike.pen).toBeCloseTo(16, 10)
    expect(boostedContext.stonesplit.pen - baseContext.stonesplit.pen).toBeCloseTo(16, 10)
    expect(boostedContext.silkbind.pen - baseContext.silkbind.pen).toBeCloseTo(16, 10)
    expect(boostedContext.bamboocut.pen - baseContext.bamboocut.pen).toBeCloseTo(16, 10)
  })

  it("wires Dread to Snowparting Special's final hit and both stab effects to the stab's final hit", () => {
    const special = skillNamed("SnowpartingSpecial")
    const stab = skillNamed("SnowpartingQ-Stab")
    const dreadApply = special.hits
      .at(-1)!
      .triggers.find((trigger) => trigger.targetId === DREAD_BUFF_ID)
    const dreadExtension = stab.hits
      .at(-1)!
      .triggers.find((trigger) => trigger.targetId === DREAD_BUFF_ID)
    const fearfulBladeApply = stab.hits
      .at(-1)!
      .triggers.find((trigger) => trigger.targetId === FEARFUL_BLADE_BUFF_ID)

    expect(special.hits.slice(0, -1).flatMap((hit) => hit.triggers)).not.toContainEqual(
      expect.objectContaining({ targetId: DREAD_BUFF_ID }),
    )
    expect(dreadApply).toMatchObject({ kind: "applyBuff", stacks: 1 })
    expect(stab.hits.slice(0, -1).flatMap((hit) => hit.triggers)).not.toContainEqual(
      expect.objectContaining({ targetId: FEARFUL_BLADE_BUFF_ID }),
    )
    expect(dreadExtension).toMatchObject({
      kind: "applyBuff",
      stacks: 0,
      extendFrames: 360,
      extendOnly: true,
    })
    expect(fearfulBladeApply).toMatchObject({ kind: "applyBuff", stacks: 1 })
  })

  it("opens, extends, and expires the two windows at their configured frames", () => {
    const special = skillNamed("SnowpartingSpecial")
    const stab = skillNamed("SnowpartingQ-Stab")
    const result = run([special, stab])
    const dread = result.buffWindows!.find((window) => window.id === DREAD_BUFF_ID)!
    const fearfulBlade = result.buffWindows!.find((window) => window.id === FEARFUL_BLADE_BUFF_ID)!
    const dreadStartFrame = special.hits.at(-1)!.frame
    const stabFinalFrame = special.castFrames + stab.hits.at(-1)!.frame

    expect(dread.startSec * 60).toBe(dreadStartFrame)
    expect(dread.endSec * 60).toBe(dreadStartFrame + DREAD_DURATION_FRAMES + 360)
    expect(fearfulBlade.startSec * 60).toBe(stabFinalFrame)
    expect(fearfulBlade.endSec * 60).toBe(stabFinalFrame + FEARFUL_BLADE_DURATION_FRAMES)

    const stabOnly = run([stab])
    expect(stabOnly.buffWindows!.some((window) => window.id === DREAD_BUFF_ID)).toBe(false)
    expect(stabOnly.buffWindows!.some((window) => window.id === FEARFUL_BLADE_BUFF_ID)).toBe(true)
  })

  it("applies Dread to subsequent damage and Fearful Blade to the stab-triggered skill", () => {
    const special = skillNamed("SnowpartingSpecial")
    const stab = skillNamed("SnowpartingQ-Stab")
    const probe = makeSkill(CLASS, {
      name: "Dread Probe",
      skillType: "weapon",
      weaponOrAttribute: "Hengdao",
      attributeAttack: "Stonesplit",
      hits: [makeHit({ physMultiplier: 1, attributeMultiplier: 1.5 })],
    })

    const dreadResult = run([special, probe], [probe])
    const noDreadResult = run([special, probe], [withoutTrigger(special, DREAD_BUFF_ID), probe])
    expect(damageOf(dreadResult, probe.name)).toBeGreaterThan(damageOf(noDreadResult, probe.name))

    const fearfulResult = run([stab])
    const noFearfulResult = run([stab], [withoutTrigger(stab, FEARFUL_BLADE_BUFF_ID)])
    const fearfulDamage = damageOf(fearfulResult, "AnxiSoldierHeng")
    const noFearfulDamage = damageOf(noFearfulResult, "AnxiSoldierHeng")
    expect(fearfulDamage).toBeGreaterThan(noFearfulDamage)
    expect(fearfulDamage / noFearfulDamage).toBeLessThan(1.5)
  })
})
