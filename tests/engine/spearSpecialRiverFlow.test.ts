import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { simulateTimeline } from "../../src/engine/timeline"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { makeSkill, makeHit, type Skill } from "../../src/engine/skill"
import { RIVER_FLOW_DURATION_FRAMES } from "../../src/data/innerWays/wolfchasersArtGates"
import type { Inputs, Result } from "../../src/engine/types"
import { builtinSkill, dotRow } from "../builtins"
import { DEBUFF, SKILL } from "../../src/data/skills/bellstrike-umbra/ids"
import { retiredRotation } from "./retiredRotations"
import { BUFF } from "../../src/data/skills/buffs/ids"

const CLASS = "bellstrikeUmbra"

const skillOf = (id: string) => builtinSkill(CLASS, id)

function makeFiller(frames: number): Skill {
  return makeSkill(CLASS, { name: "Filler", castFrames: frames, hits: [makeHit({ frame: 0 })] })
}

function runSteps(
  steps: { skillId: string; hitCount: number }[],
  extraSkills: Skill[] = [],
  mindMethods: Inputs["mindMethods"] = [
    WOLFCHASERS_ART_SLOT,
    ...defaultInputs.mindMethods.slice(1),
  ] as Inputs["mindMethods"],
): Result {
  const rotation = makeRotation(CLASS, { steps: steps.map((s) => makeStep(s)) })
  const inputs: Inputs = {
    ...defaultInputs,
    classId: CLASS,
    mindMethods,
    activeCustomRotation: rotation,
    customSkills: extraSkills,
  }
  return simulateTimeline(inputs)
}

function detonationEvents(result: Result) {
  return result.timeline!.filter((ev) => ev.skillName === skillOf(SKILL.bleedDetonation).name)
}

function damageOf(result: Result, name: string): number {
  return result.perSkill.find((p) => p.name === name)?.expectedDamage ?? 0
}

const spearQId = SKILL.spearq
const spearSpecialId = SKILL.spearspecial
const swordSpecial3Id = SKILL.swordspecial3Hit
const spearSpecialHitCount = skillOf(spearSpecialId).hits.length

const SPEARQ_CAST_FRAMES = 120

const WOLFCHASERS_ART_SLOT = { name: "wolfchasersArt", stacks: "tier 5" }

describe("Spear Special — no River Flow", () => {
  it("deals base coefficients with no bleed payload or detonation", () => {
    const r = runSteps([{ skillId: spearSpecialId, hitCount: spearSpecialHitCount }])
    expect(detonationEvents(r)).toHaveLength(0)
    expect(r.perSkill.some((p) => p.name === dotRow(CLASS, DEBUFF.bleedTick))).toBe(false)
    expect(damageOf(r, "Spear Special")).toBeGreaterThan(0)
  })
})

function describeEmpoweredCast(skillIdArg: string) {
  const trueSkill = skillOf(skillIdArg)
  const name = trueSkill.name
  const hitCount = trueSkill.hits.length
  describe(`${name} — River Flow active, cooldown inactive`, () => {
    it("uses the EXACT River Flow coefficients (not merely a larger number)", () => {
      const id = skillIdArg
      const baseline = damageOf(runSteps([{ skillId: id, hitCount }]), name)
      const r = runSteps([
        { skillId: spearQId, hitCount: 6 },
        { skillId: id, hitCount },
      ])
      const empowered = damageOf(r, name)
      expect(empowered).toBeGreaterThan(baseline)

      // Keeps each hit's own triggers — Sweep All's first hit lands Defense Down, which
      // raises the second hit's damage within the same cast, so stripping triggers here
      // would compare against a control that never saw that debuff.
      const stripped: Skill = {
        ...trueSkill,
        hits: trueSkill.hits.map((hit) => {
          const variant = hit.variants![0]
          return {
            ...hit,
            physMultiplier: variant.physMultiplier,
            attributeMultiplier: variant.attributeMultiplier,
            physFixed: variant.physFixed,
            attributeFixed: variant.attributeFixed,
            variants: undefined,
          }
        }),
      }
      const control = runSteps(
        [
          { skillId: spearQId, hitCount: 6 },
          { skillId: id, hitCount },
        ],
        [stripped],
      )
      expect(empowered).toBeCloseTo(damageOf(control, name), 6)
    })

    it("fires the bleed payload exactly once, on the hit that carries it, and leaves a Bleeding (DoT) row standing", () => {
      const id = skillIdArg
      const filler = makeFiller(300)
      const r = runSteps(
        [
          { skillId: spearQId, hitCount: 6 },
          { skillId: id, hitCount },
          { skillId: filler.id, hitCount: 1 },
        ],
        [filler],
      )
      const dets = detonationEvents(r)
      expect(dets).toHaveLength(1)
      const payloadHit = trueSkill.hits.find((hit) => hit.triggers.length > 0)!
      const hitFrame = SPEARQ_CAST_FRAMES + payloadHit.frame
      expect(dets[0].frame).toBe(hitFrame)
      expect(r.perSkill.some((p) => p.name === dotRow(CLASS, DEBUFF.bleedTick))).toBe(true)
    })
  })
}
describeEmpoweredCast(SKILL.spearspecial)
describeEmpoweredCast(SKILL.spearspecial1HitCancel)

describe("Spear Special — bleed stacks are not consumed by its own payload", () => {
  it("SwordSpecial 3-Hit continues from the 3 stacks Spear Special left standing, detonating on its 2nd hit ⇒ 2 detonations total", () => {
    const r = runSteps([
      { skillId: spearQId, hitCount: 6 },
      { skillId: spearSpecialId, hitCount: spearSpecialHitCount },
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
        { skillId: spearSpecialId, hitCount: spearSpecialHitCount },
      ]),
      "Spear Special",
    )
    const r = runSteps([
      { skillId: spearQId, hitCount: 6 },
      { skillId: spearSpecialId, hitCount: spearSpecialHitCount },
      { skillId: spearSpecialId, hitCount: spearSpecialHitCount },
    ])
    expect(detonationEvents(r)).toHaveLength(1)
    const row = r.perSkill.find((p) => p.name === skillOf(SKILL.spearspecial).name)!
    expect(row.count).toBe(2 * spearSpecialHitCount)
    expect(row.expectedDamage).toBeGreaterThan(singleCast * 1.9)
    expect(row.expectedDamage).toBeLessThan(singleCast * 2.1)
  })
})

describe("River Flow — the cast tag shows the magnitude the status carries", () => {
  it("reports its damage boost on the cast it is active for", () => {
    const r = runSteps([
      { skillId: spearQId, hitCount: 6 },
      { skillId: spearSpecialId, hitCount: spearSpecialHitCount },
    ])
    const spearSpecialCast = r.casts!.find((cast) => cast.skillName === "Spear Special")!
    const tag = spearSpecialCast.buffs.find((b) => b.id === BUFF.potentRiverFlow)!
    expect(tag).toBeTruthy()
    expect(tag.name).toBe("River Flow")
    expect(tag.effects).toEqual([{ statKey: "allDamageBoost", amount: 0.25 }])
  })
})

describe("River Flow — only exists while Wolfchaser's Art is slotted", () => {
  it("leaves SpearQ + Spear Special at base damage with no payload when it is not", () => {
    const steps = [
      { skillId: spearQId, hitCount: 6 },
      { skillId: spearSpecialId, hitCount: spearSpecialHitCount },
    ]
    const r = runSteps(steps, [], defaultInputs.mindMethods)
    const trueSkill = skillOf(SKILL.spearspecial)
    const strippedToBase: Skill = {
      ...trueSkill,
      hits: trueSkill.hits.map((hit) => ({ ...hit, variants: undefined })),
    }
    const control = runSteps(steps, [strippedToBase], defaultInputs.mindMethods)
    expect(damageOf(r, "Spear Special")).toBeCloseTo(damageOf(control, "Spear Special"), 6)
    expect(detonationEvents(r)).toHaveLength(0)
    expect(r.perSkill.some((p) => p.name === dotRow(CLASS, DEBUFF.bleedTick))).toBe(false)
  })
})

describe("Spear Special — fewer than 5 SpearQ hits", () => {
  it("never applies River Flow ⇒ base damage, no detonation", () => {
    const r = runSteps([
      { skillId: spearQId, hitCount: 4 },
      { skillId: spearSpecialId, hitCount: spearSpecialHitCount },
    ])
    const trueSkill = skillOf(SKILL.spearspecial)
    const strippedToBase: Skill = {
      ...trueSkill,
      hits: trueSkill.hits.map((hit) => ({ ...hit, variants: undefined })),
    }
    const control = runSteps(
      [
        { skillId: spearQId, hitCount: 4 },
        { skillId: spearSpecialId, hitCount: spearSpecialHitCount },
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
      { skillId: spearSpecialId, hitCount: spearSpecialHitCount },
    ]
    const r = runSteps(steps, [filler])
    const trueSkill = skillOf(SKILL.spearspecial)
    const strippedToBase: Skill = {
      ...trueSkill,
      hits: trueSkill.hits.map((hit) => ({ ...hit, variants: undefined })),
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
        { skillId: spearSpecialId, hitCount: spearSpecialHitCount },
        { skillId: filler.id, hitCount: 1 },
        { skillId: spearQId, hitCount: 6 },
        { skillId: spearSpecialId, hitCount: spearSpecialHitCount },
      ],
      [filler],
    )
    expect(detonationEvents(r)).toHaveLength(2)
  })
})

describe("Spear Special — no collateral damage elsewhere", () => {
  it("a rotation without Spear Special is unaffected — no Spear Special row appears", () => {
    const result = runEngine({
      ...defaultInputs,
      classId: CLASS,
      activeCustomRotation: retiredRotation("builtin-bellstrikeUmbra-eazy-t6-wolf"),
    })
    expect(result.dps).toBeGreaterThan(0)
    expect(result.perSkill.some((p) => p.name === skillOf(SKILL.spearspecial).name)).toBe(false)
  })
})
