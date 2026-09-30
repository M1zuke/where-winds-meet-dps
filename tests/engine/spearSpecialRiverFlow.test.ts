import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { simulateTimeline } from "../../src/engine/timeline"
import { makeStep } from "../../src/engine/rotation"
import { hitDealsDamage, makeSkill, makeHit, type Skill } from "../../src/engine/skill"
import {
  EMPOWERED_MIN_BLEEDING_STACKS_FIVE_HIT_CANCEL,
  EMPOWERED_MIN_BLEEDING_STACKS_FULL_CAST,
  EMPOWERED_RIVER_FLOW_BUFF_ID,
  RIVER_FLOW_DURATION_FRAMES,
  RIVER_FLOW_MIN_BLEEDING_STACKS,
  SPRING_SURGE_BUFF_ID,
} from "../../src/data/innerWays/wolfchasersArtGates"
import type { Inputs, Result } from "../../src/engine/types"
import { builtinSkill, dotRow, testRotation as makeRotation } from "../builtins"
import { DEBUFF, SKILL } from "../../src/data/skills/bellstrike-umbra/ids"
import { retiredRotation } from "./retiredRotations"
import { BUFF } from "../../src/data/skills/buffs/ids"

const CLASS = "bellstrikeUmbra"

const skillOf = (id: string) => builtinSkill(CLASS, id)

function makeFiller(frames: number): Skill {
  return makeSkill(CLASS, { name: "Filler", castFrames: frames, hits: [makeHit({ frame: 0 })] })
}

// Seeds the target's Bleeding stacks in a single zero-damage hit — a stand-in
// for the sword-side casts that build them in a real rotation, so a test can
// pick the exact stack count Sober Sorrow's tier ladder reads.
function bleedSeeder(stacks: number): Skill {
  return makeSkill(CLASS, {
    name: "BleedSeeder",
    castFrames: 1,
    // Each applyDot trigger adds exactly one stack — one trigger per stack wanted.
    hits: [
      makeHit({
        frame: 0,
        triggers: Array.from({ length: stacks }, () => ({
          kind: "applyDot" as const,
          targetId: DEBUFF.bleedTick,
          stacks: 1,
          condition: null,
        })),
      }),
    ],
  })
}

function runSteps(
  skillIds: string[],
  extraSkills: Skill[] = [],
  mindMethods: Inputs["mindMethods"] = [
    WOLFCHASERS_ART_SLOT,
    ...defaultInputs.mindMethods.slice(1),
  ] as Inputs["mindMethods"],
): Result {
  const rotation = makeRotation(CLASS, {
    steps: skillIds.map((skillId) => makeStep({ skillId })),
  })
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
// Frame 0's zero-damage Shattered Stone hit is not counted as a "hit" in the
// per-skill breakdown.
const spearSpecialHitCount = skillOf(spearSpecialId).hits.filter(hitDealsDamage).length

const WOLFCHASERS_ART_SLOT = { name: "wolfchasersArt", stacks: "tier 5" }

// The damage hit that carries Sweep All's bleed/detonation payload — not hit
// 0, which only ever carries the zero-damage Shattered Stone trigger.
function payloadHitOf(skill: Skill) {
  return skill.hits.find((hit) => hit.triggers.some((t) => t.kind === "castSkill"))!
}

describe("Spear Special — no River Flow", () => {
  it("deals base coefficients with no bleed payload or detonation", () => {
    const r = runSteps([spearSpecialId])
    expect(detonationEvents(r)).toHaveLength(0)
    expect(r.perSkill.some((p) => p.name === dotRow(CLASS, DEBUFF.bleedTick))).toBe(false)
    expect(damageOf(r, "Spear Special")).toBeGreaterThan(0)
  })
})

describe("Sober Sorrow's River Flow tier ladder — modal (most-likely) thresholds", () => {
  it("a full Sober Sorrow at 1 Bleeding stack grants Empowered River Flow", () => {
    const seeder = bleedSeeder(EMPOWERED_MIN_BLEEDING_STACKS_FULL_CAST)
    const r = runSteps([seeder.id, spearQId, spearSpecialId], [seeder])
    const followUpCast = r.casts!.find((cast) => cast.skillName === "Spear Special")!
    expect(followUpCast.buffs.some((b) => b.id === EMPOWERED_RIVER_FLOW_BUFF_ID)).toBe(true)
  })

  it("a full Sober Sorrow at 0 Bleeding stacks does not grant Empowered River Flow", () => {
    const r = runSteps([spearQId, spearSpecialId])
    const followUpCast = r.casts!.find((cast) => cast.skillName === "Spear Special")!
    expect(followUpCast.buffs.some((b) => b.id === EMPOWERED_RIVER_FLOW_BUFF_ID)).toBe(false)
  })

  it("a 5-hit cancel needs 4 stacks for Empowered River Flow", () => {
    const seeder = bleedSeeder(EMPOWERED_MIN_BLEEDING_STACKS_FIVE_HIT_CANCEL)
    const r = runSteps([seeder.id, SKILL.spearq5HitCancel, spearSpecialId], [seeder])
    const followUpCast = r.casts!.find((cast) => cast.skillName === "Spear Special")!
    expect(followUpCast.buffs.some((b) => b.id === EMPOWERED_RIVER_FLOW_BUFF_ID)).toBe(true)
  })

  it("a 5-hit cancel at 3 stacks does not grant Empowered River Flow", () => {
    const seeder = bleedSeeder(EMPOWERED_MIN_BLEEDING_STACKS_FIVE_HIT_CANCEL - 1)
    const r = runSteps([seeder.id, SKILL.spearq5HitCancel, spearSpecialId], [seeder])
    const followUpCast = r.casts!.find((cast) => cast.skillName === "Spear Special")!
    expect(followUpCast.buffs.some((b) => b.id === EMPOWERED_RIVER_FLOW_BUFF_ID)).toBe(false)
  })
})

describe("Water Drop / Spring Surge — 12 s base, 15 s with Wolfchaser's Art", () => {
  it("lasts 15 s when Wolfchaser's Art is slotted", () => {
    const r = runSteps([spearQId])
    const window = r.buffWindows!.find((w) => w.id === SPRING_SURGE_BUFF_ID)!
    expect(window.endSec - window.startSec).toBeCloseTo(15, 6)
  })

  it("lasts 12 s with no inner way slotted", () => {
    const r = runSteps([spearQId], [], defaultInputs.mindMethods)
    const window = r.buffWindows!.find((w) => w.id === SPRING_SURGE_BUFF_ID)!
    expect(window.endSec - window.startSec).toBeCloseTo(12, 6)
  })
})

function describeEmpoweredCast(
  skillIdArg: string,
  soberSorrowId: string,
  minBleedingStacks: number,
) {
  const trueSkill = skillOf(skillIdArg)
  const name = trueSkill.name
  describe(`${name} — Empowered River Flow (enough Bleeding stacks, Wolfchaser's Art tier ≥ 4)`, () => {
    it("uses the EXACT River Flow coefficients (not merely a larger number)", () => {
      const id = skillIdArg
      const seeder = bleedSeeder(minBleedingStacks)
      const baseline = damageOf(runSteps([id]), name)
      const r = runSteps([seeder.id, soberSorrowId, id], [seeder])
      const empowered = damageOf(r, name)
      expect(empowered).toBeGreaterThan(baseline)

      // Keeps each hit's own triggers — Sweep All's first hit lands Defense Down, which
      // raises the second hit's damage within the same cast, so stripping triggers here
      // would compare against a control that never saw that debuff. Carries the River
      // Flow variant's own cast-length override onto the skill's own castFrames too, so
      // a cancel form whose variant runs longer isn't timed differently from the real run.
      const riverFlowCastFrames = trueSkill.hits
        .flatMap((hit) => hit.variants ?? [])
        .find((variant) => variant.label === "River Flow")?.castFrames
      const stripped: Skill = {
        ...trueSkill,
        castFrames: riverFlowCastFrames ?? trueSkill.castFrames,
        hits: trueSkill.hits.map((hit) => {
          const variant = hit.variants?.find((v) => v.label === "River Flow")
          if (!variant) return hit
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
      const control = runSteps([seeder.id, soberSorrowId, id], [seeder, stripped])
      expect(empowered).toBeCloseTo(damageOf(control, name), 6)
    })

    it("fires the bleed payload exactly once, on the hit that carries it, and leaves a Bleeding (DoT) row standing", () => {
      const id = skillIdArg
      const seeder = bleedSeeder(minBleedingStacks)
      const filler = makeFiller(300)
      const r = runSteps([seeder.id, soberSorrowId, id, filler.id], [seeder, filler])
      const dets = detonationEvents(r)
      expect(dets).toHaveLength(1)
      const payloadHit = payloadHitOf(trueSkill)
      const riverFlowFrame = payloadHit.variants?.find((v) => v.label === "River Flow")?.frame
      // The detonation sub-cast starts at the payload hit's own (River
      // Flow-resolved) frame and carries its own delay to its own hit.
      const detonationDelay = skillOf(SKILL.bleedDetonation).hits[0].frame
      const hitFrame =
        seeder.castFrames +
        skillOf(soberSorrowId).castFrames +
        (riverFlowFrame ?? payloadHit.frame) +
        detonationDelay
      expect(dets[0].frame).toBe(hitFrame)
      expect(r.perSkill.some((p) => p.name === dotRow(CLASS, DEBUFF.bleedTick))).toBe(true)
    })
  })
}
describeEmpoweredCast(SKILL.spearspecial, spearQId, EMPOWERED_MIN_BLEEDING_STACKS_FULL_CAST)
describeEmpoweredCast(
  SKILL.spearspecial1HitCancel,
  SKILL.spearq5HitCancel,
  EMPOWERED_MIN_BLEEDING_STACKS_FIVE_HIT_CANCEL,
)

describe("Spear Special — bleed stacks are not consumed by its own payload", () => {
  it("SwordSpecial 3-Hit continues from the stacks Spear Special left standing, detonating on a later hit ⇒ 2 detonations total", () => {
    const seeder = bleedSeeder(EMPOWERED_MIN_BLEEDING_STACKS_FULL_CAST)
    const r = runSteps([seeder.id, spearQId, spearSpecialId, swordSpecial3Id], [seeder])
    expect(detonationEvents(r)).toHaveLength(2)
  })
})

describe("Spear Special Cooldown — suppresses a second payload", () => {
  it("a second cast right after the first stays empowered but adds no extra detonation", () => {
    const seeder = bleedSeeder(EMPOWERED_MIN_BLEEDING_STACKS_FULL_CAST)
    const singleCast = damageOf(
      runSteps([seeder.id, spearQId, spearSpecialId], [seeder]),
      "Spear Special",
    )
    const r = runSteps([seeder.id, spearQId, spearSpecialId, spearSpecialId], [seeder])
    expect(detonationEvents(r)).toHaveLength(1)
    const row = r.perSkill.find((p) => p.name === skillOf(SKILL.spearspecial).name)!
    expect(row.count).toBe(2 * spearSpecialHitCount)
    expect(row.expectedDamage).toBeGreaterThan(singleCast * 1.9)
    expect(row.expectedDamage).toBeLessThan(singleCast * 2.1)
  })
})

describe("River Flow — the cast tag shows the magnitude the status carries", () => {
  it("reports its own additional damage boost on the cast it is active for", () => {
    const seeder = bleedSeeder(RIVER_FLOW_MIN_BLEEDING_STACKS)
    const r = runSteps([seeder.id, spearQId, spearSpecialId], [seeder])
    const spearSpecialCast = r.casts!.find((cast) => cast.skillName === "Spear Special")!
    const tag = spearSpecialCast.buffs.find((b) => b.id === BUFF.potentRiverFlow)!
    expect(tag).toBeTruthy()
    expect(tag.name).toBe("River Flow")
    expect(tag.effects).toEqual([{ statKey: "allDamageBoost", amount: 0.05 }])
  })
})

describe("River Flow — only exists while Wolfchaser's Art is slotted, at any tier", () => {
  it("still applies at tier 3, but Empowered's extra layer and its Blood Burst payload do not", () => {
    const seeder = bleedSeeder(EMPOWERED_MIN_BLEEDING_STACKS_FULL_CAST)
    const steps = [seeder.id, spearQId, spearSpecialId]
    const tier3 = [
      { name: "wolfchasersArt", stacks: "tier 3" },
      ...defaultInputs.mindMethods.slice(1),
    ]
    const r = runSteps(steps, [seeder], tier3 as Inputs["mindMethods"])

    const trueSkill = skillOf(SKILL.spearspecial)
    const riverFlowOnly: Skill = {
      ...trueSkill,
      hits: trueSkill.hits.map((hit) => {
        const variant = hit.variants?.find((v) => v.label === "River Flow")
        if (!variant) return hit
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
    const control = runSteps(steps, [seeder, riverFlowOnly], tier3 as Inputs["mindMethods"])
    expect(damageOf(r, "Spear Special")).toBeCloseTo(damageOf(control, "Spear Special"), 6)
    expect(detonationEvents(r)).toHaveLength(0)

    const spearSpecialCast = r.casts!.find((cast) => cast.skillName === "Spear Special")!
    expect(spearSpecialCast.buffs.some((b) => b.id === BUFF.potentRiverFlow)).toBe(true)
    expect(spearSpecialCast.buffs.some((b) => b.id === SPRING_SURGE_BUFF_ID)).toBe(true)
    expect(spearSpecialCast.buffs.some((b) => b.id === EMPOWERED_RIVER_FLOW_BUFF_ID)).toBe(false)
  })

  it("gives Spring Surge only, never River Flow, with no inner way slotted at all", () => {
    const seeder = bleedSeeder(EMPOWERED_MIN_BLEEDING_STACKS_FULL_CAST)
    const steps = [seeder.id, spearQId, spearSpecialId]
    const r = runSteps(steps, [seeder], defaultInputs.mindMethods)

    // Spring Surge still applies without the inner way, so the control keeps
    // its Spring Surge variant rather than stripping to base.
    const trueSkill = skillOf(SKILL.spearspecial)
    const springSurgeOnly: Skill = {
      ...trueSkill,
      hits: trueSkill.hits.map((hit) => {
        const variant = hit.variants?.find((v) => v.label === "Spring Surge")
        if (!variant) return hit
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
    const control = runSteps(steps, [seeder, springSurgeOnly], defaultInputs.mindMethods)
    expect(damageOf(r, "Spear Special")).toBeCloseTo(damageOf(control, "Spear Special"), 6)
    expect(detonationEvents(r)).toHaveLength(0)

    const spearSpecialCast = r.casts!.find((cast) => cast.skillName === "Spear Special")!
    expect(spearSpecialCast.buffs.some((b) => b.id === SPRING_SURGE_BUFF_ID)).toBe(true)
    expect(spearSpecialCast.buffs.some((b) => b.id === BUFF.potentRiverFlow)).toBe(false)
    expect(spearSpecialCast.buffs.some((b) => b.id === EMPOWERED_RIVER_FLOW_BUFF_ID)).toBe(false)
  })
})

describe("Spear Special — fewer than 4 SpearQ hits", () => {
  it("never applies even Spring Surge ⇒ base damage, no detonation", () => {
    const spearQ = skillOf(spearQId)
    const spearQFourHits: Skill = {
      ...spearQ,
      id: `${spearQId}-4-hits`,
      hits: spearQ.hits.slice(0, 4),
    }
    const r = runSteps([spearQFourHits.id, spearSpecialId], [spearQFourHits])
    const trueSkill = skillOf(SKILL.spearspecial)
    const strippedToBase: Skill = {
      ...trueSkill,
      hits: trueSkill.hits.map((hit) => ({ ...hit, variants: undefined })),
    }
    const control = runSteps([spearQFourHits.id, spearSpecialId], [spearQFourHits, strippedToBase])
    expect(damageOf(r, "Spear Special")).toBeCloseTo(damageOf(control, "Spear Special"), 6)
    expect(detonationEvents(r)).toHaveLength(0)
  })
})

describe("River Flow — window expiry", () => {
  it("once River Flow's window has lapsed, Spear Special falls back to base damage with no payload", () => {
    const seeder = bleedSeeder(RIVER_FLOW_MIN_BLEEDING_STACKS)
    const filler = makeFiller(RIVER_FLOW_DURATION_FRAMES + 200)
    const steps = [seeder.id, spearQId, filler.id, spearSpecialId]
    const r = runSteps(steps, [seeder, filler])
    const trueSkill = skillOf(SKILL.spearspecial)
    const strippedToBase: Skill = {
      ...trueSkill,
      hits: trueSkill.hits.map((hit) => ({ ...hit, variants: undefined })),
    }
    const control = runSteps(steps, [seeder, filler, strippedToBase])
    expect(damageOf(r, "Spear Special")).toBeCloseTo(damageOf(control, "Spear Special"), 6)
    expect(detonationEvents(r)).toHaveLength(0)
  })
})

describe("Spear Special Cooldown — window expiry", () => {
  it("once both windows have lapsed, a fresh SpearQ + Spear Special pair detonates again", () => {
    const seeder = bleedSeeder(EMPOWERED_MIN_BLEEDING_STACKS_FULL_CAST)
    const filler = makeFiller(1000)
    const r = runSteps(
      [seeder.id, spearQId, spearSpecialId, filler.id, seeder.id, spearQId, spearSpecialId],
      [seeder, filler],
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
