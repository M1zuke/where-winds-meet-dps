import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { simulateTimeline } from "../../src/engine/timeline"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { makeSkill, makeHit, type Skill } from "../../src/engine/skill"
import { RIVER_FLOW_DURATION_FRAMES } from "../../src/data/classes/bellstrikeUmbraGates"
import type { Inputs, Result } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"

function skillId(name: string): string {
  const s = builtinSkillsForClass(CLASS).find((sk) => sk.name === name)
  if (!s) throw new Error(`missing built-in skill "${name}"`)
  return s.id
}

function makeFiller(frames: number): Skill {
  return makeSkill(CLASS, { name: "Filler", castFrames: frames, hits: [makeHit({ frame: 0 })] })
}

function runSteps(
  steps: { skillId: string; hitCount: number }[],
  extraSkills: Skill[] = [],
): Result {
  const rotation = makeRotation(CLASS, { steps: steps.map((s) => makeStep(s)) })
  const inputs: Inputs = {
    ...defaultInputs,
    classId: CLASS,
    activeCustomRotation: rotation,
    customSkills: extraSkills,
  }
  return simulateTimeline(inputs)
}

function detonationEvents(result: Result) {
  return result.timeline!.filter((ev) => ev.skillName === "Bleed Detonation")
}

function damageOf(result: Result, name: string): number {
  return result.perSkill.find((p) => p.name === name)?.expectedDamage ?? 0
}

const spearQId = skillId("SpearQ")
const spearSpecialId = skillId("Spear Special")
const swordSpecial3Id = skillId("SwordSpecial 3-Hit")

const SPEARQ_CAST_FRAMES = 120

describe("Spear Special — no River Flow", () => {
  it("deals base coefficients with no bleed payload or detonation", () => {
    const r = runSteps([{ skillId: spearSpecialId, hitCount: 1 }])
    expect(detonationEvents(r)).toHaveLength(0)
    expect(r.perSkill.some((p) => p.name.startsWith("Bleed Tick"))).toBe(false)
    expect(damageOf(r, "Spear Special")).toBeGreaterThan(0)
  })
})

function describeEmpoweredCast(name: string) {
  describe(`${name} — River Flow active, cooldown inactive`, () => {
    it("uses the EXACT River Flow coefficients (not merely a larger number)", () => {
      const id = skillId(name)
      const baseline = damageOf(runSteps([{ skillId: id, hitCount: 1 }]), name)
      const r = runSteps([
        { skillId: spearQId, hitCount: 6 },
        { skillId: id, hitCount: 1 },
      ])
      const empowered = damageOf(r, name)
      expect(empowered).toBeGreaterThan(baseline)

      const trueSkill = builtinSkillsForClass(CLASS).find((s) => s.name === name)!
      const variant = trueSkill.hits[0].variants![0]
      const stripped: Skill = {
        ...trueSkill,
        hits: [
          {
            ...trueSkill.hits[0],
            physMultiplier: variant.physMultiplier,
            attributeMultiplier: variant.attributeMultiplier,
            physFixed: variant.physFixed,
            attributeFixed: variant.attributeFixed,
            variants: undefined,
            triggers: [],
          },
        ],
      }
      const control = runSteps(
        [
          { skillId: spearQId, hitCount: 6 },
          { skillId: id, hitCount: 1 },
        ],
        [stripped],
      )
      expect(empowered).toBeCloseTo(damageOf(control, name), 6)
    })

    it("fires the bleed payload exactly once, on the hit that carries it, and leaves a Bleed Tick (DoT) row standing", () => {
      const id = skillId(name)
      const filler = makeFiller(300)
      const r = runSteps(
        [
          { skillId: spearQId, hitCount: 6 },
          { skillId: id, hitCount: 1 },
          { skillId: filler.id, hitCount: 1 },
        ],
        [filler],
      )
      const dets = detonationEvents(r)
      expect(dets).toHaveLength(1)
      const hitFrame =
        SPEARQ_CAST_FRAMES +
        builtinSkillsForClass(CLASS).find((s) => s.name === name)!.hits[0].frame
      expect(dets[0].frame).toBe(hitFrame)
      expect(r.perSkill.some((p) => p.name.startsWith("Bleed Tick"))).toBe(true)
    })
  })
}
describeEmpoweredCast("Spear Special")
describeEmpoweredCast("Spear Special (1 Hit Cancel)")

describe("Spear Special — bleed stacks are not consumed by its own payload", () => {
  it("SwordSpecial 3-Hit continues from the 3 stacks Spear Special left standing, detonating on its 2nd hit ⇒ 2 detonations total", () => {
    const r = runSteps([
      { skillId: spearQId, hitCount: 6 },
      { skillId: spearSpecialId, hitCount: 1 },
      { skillId: swordSpecial3Id, hitCount: 3 },
    ])
    expect(detonationEvents(r)).toHaveLength(2)
  })
})

describe("Spear Special Cooldown — suppresses a second payload", () => {
  it("a second cast right after the first stays empowered but adds no extra detonation", () => {
    const singleCast = damageOf(
      runSteps([
        { skillId: spearQId, hitCount: 6 },
        { skillId: spearSpecialId, hitCount: 1 },
      ]),
      "Spear Special",
    )
    const r = runSteps([
      { skillId: spearQId, hitCount: 6 },
      { skillId: spearSpecialId, hitCount: 1 },
      { skillId: spearSpecialId, hitCount: 1 },
    ])
    expect(detonationEvents(r)).toHaveLength(1)
    const row = r.perSkill.find((p) => p.name === "Spear Special")!
    expect(row.count).toBe(2)
    expect(row.expectedDamage).toBeGreaterThan(singleCast * 1.9)
    expect(row.expectedDamage).toBeLessThan(singleCast * 2.1)
  })
})

describe("Spear Special — fewer than 5 SpearQ hits", () => {
  it("never applies River Flow ⇒ base damage, no detonation", () => {
    const r = runSteps([
      { skillId: spearQId, hitCount: 4 },
      { skillId: spearSpecialId, hitCount: 1 },
    ])
    const trueSkill = builtinSkillsForClass(CLASS).find((s) => s.name === "Spear Special")!
    const strippedToBase: Skill = {
      ...trueSkill,
      hits: [{ ...trueSkill.hits[0], variants: undefined }],
    }
    const control = runSteps(
      [
        { skillId: spearQId, hitCount: 4 },
        { skillId: spearSpecialId, hitCount: 1 },
      ],
      [strippedToBase],
    )
    expect(damageOf(r, "Spear Special")).toBeCloseTo(damageOf(control, "Spear Special"), 6)
    expect(detonationEvents(r)).toHaveLength(0)
  })
})

describe("River Flow — window expiry", () => {
  it("once River Flow's window has lapsed, Spear Special falls back to base damage with no payload", () => {
    const filler = makeFiller(RIVER_FLOW_DURATION_FRAMES + 200)
    const steps = [
      { skillId: spearQId, hitCount: 6 },
      { skillId: filler.id, hitCount: 1 },
      { skillId: spearSpecialId, hitCount: 1 },
    ]
    const r = runSteps(steps, [filler])
    const trueSkill = builtinSkillsForClass(CLASS).find((s) => s.name === "Spear Special")!
    const strippedToBase: Skill = {
      ...trueSkill,
      hits: [{ ...trueSkill.hits[0], variants: undefined }],
    }
    const control = runSteps(steps, [filler, strippedToBase])
    expect(damageOf(r, "Spear Special")).toBeCloseTo(damageOf(control, "Spear Special"), 6)
    expect(detonationEvents(r)).toHaveLength(0)
  })
})

describe("Spear Special Cooldown — window expiry", () => {
  it("once both windows have lapsed, a fresh SpearQ + Spear Special pair detonates again", () => {
    const filler = makeFiller(1000)
    const r = runSteps(
      [
        { skillId: spearQId, hitCount: 6 },
        { skillId: spearSpecialId, hitCount: 1 },
        { skillId: filler.id, hitCount: 1 },
        { skillId: spearQId, hitCount: 6 },
        { skillId: spearSpecialId, hitCount: 1 },
      ],
      [filler],
    )
    expect(detonationEvents(r)).toHaveLength(2)
  })
})

describe("Spear Special — no collateral damage elsewhere", () => {
  it("a built-in rotation without Spear Special (Eazy-T6 Wolf) is unaffected — no Spear Special row appears", () => {
    const result = runEngine({
      ...defaultInputs,
      classId: CLASS,
      selectedBuiltinRotationId: "builtin-bellstrikeUmbra-eazy-t6-wolf",
    })
    expect(result.dps).toBeGreaterThan(0)
    expect(result.perSkill.some((p) => p.name.startsWith("Spear Special"))).toBe(false)
  })
})
